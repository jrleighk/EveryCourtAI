/**
 * ============================================================
 * EveryCourtAI
 * Follow-up Engine
 * Version: 1.1
 * ============================================================
 *
 * 文件路径：
 * engine/follow_up_engine.js
 *
 * 作用：
 *
 * 1. 接收 Parser 缺失字段
 * 2. 接收 Confidence Engine 缺失字段
 * 3. 接收 Conversation State 合并后的 playerInput
 * 4. 合并所有候选 missing fields
 * 5. 使用最终 playerInput 再次验证
 * 6. 已经存在的资料绝不重复追问
 * 7. 根据优先级选择最有价值的问题
 * 8. 控制是否允许精准产品 / 磅数推荐
 *
 * V1.1 核心修复：
 *
 * Confidence Engine 可能仍然把已经补充的字段标记为 missing。
 *
 * 例如：
 *
 * playerInput.current_tension = 53
 *
 * 但：
 *
 * confidence.profile_status.missing_fields
 * 仍然可能包含：
 *
 * current_tension
 *
 * V1.1 会以最终合并后的 playerInput 为事实来源，
 * 自动删除这些错误的 missing fields。
 *
 * ============================================================
 */


/**
 * ============================================================
 * Configuration
 * ============================================================
 */

const ENGINE_NAME =
    "follow_up_engine";


const ENGINE_VERSION =
    "1.1";


/**
 * ============================================================
 * Question Priority
 * ============================================================
 *
 * 数字越小，优先级越高。
 *
 * 当前逻辑：
 *
 * 1. 当前球拍
 * 2. 当前球线
 * 3. 当前磅数
 * 4. 主要目标
 * 5. 挥拍速度
 * 6. 打法
 * 7. 手感偏好
 *
 * ============================================================
 */

const FIELD_PRIORITY = {

    current_racquet:
        10,

    current_string:
        20,

    current_tension:
        30,

    primary_goal:
        40,

    swing_speed:
        50,

    playing_style:
        60,

    feel_preference:
        70
};


/**
 * ============================================================
 * Questions
 * ============================================================
 */

const QUESTION_LIBRARY = {

    current_racquet: {

        en:
            "What racquet are you currently using?",

        zh:
            "你目前使用的是哪一款球拍？"
    },


    current_string: {

        en:
            "What string are you currently using?",

        zh:
            "你目前使用的是什么球线？"
    },


    current_tension: {

        en:
            "What tension are you currently using, approximately in lbs?",

        zh:
            "你目前大约使用多少磅的穿线磅数？"
    },


    primary_goal: {

        en:
            "What would you most like to improve: control, power, spin, comfort, or feel?",

        zh:
            "你最希望改善的是哪一点：控制、力量、旋转、舒适性，还是手感？"
    },


    swing_speed: {

        en:
            "How would you describe your swing speed: slow, medium, or fast?",

        zh:
            "你的挥拍速度大概属于慢、中等还是快？"
    },


    playing_style: {

        en:
            "How would you describe your playing style: baseline, all-court, aggressive, defensive, or serve-and-volley?",

        zh:
            "你的主要打法更接近哪一种：底线型、全场型、进攻型、防守型，还是发球上网型？"
    },


    feel_preference: {

        en:
            "What type of feel do you prefer: connected, crisp, soft, muted, or powerful?",

        zh:
            "你更喜欢哪种击球手感：直接连接感、清脆、柔和、过滤感，还是力量感？"
    }
};


/**
 * ============================================================
 * Main Engine
 * ============================================================
 */

export function runFollowUpEngine({

    parserResult =
        null,

    confidenceResult =
        null,

    playerInput =
        null,

    maxQuestions =
        2

} = {}) {

    /**
     * ========================================================
     * STEP 1
     * Parser Missing Fields
     * ========================================================
     */

    const parserMissingFields =
        normalizeFieldArray(
            parserResult
                ?.missing_fields
        );


    /**
     * ========================================================
     * STEP 2
     * Confidence Missing Fields
     * ========================================================
     */

    const confidenceMissingFields =
        normalizeFieldArray(
            confidenceResult
                ?.profile_status
                ?.missing_fields
        );


    /**
     * ========================================================
     * STEP 3
     * Merge Candidate Missing Fields
     * ========================================================
     */

    const candidateMissingFields =
        uniqueFields([
            ...parserMissingFields,
            ...confidenceMissingFields
        ]);


    /**
     * ========================================================
     * STEP 4
     * Validate Against Final Merged Player Input
     * ========================================================
     *
     * 这是 V1.1 最关键的部分。
     *
     * Parser / Confidence 只能提供候选 missing fields。
     *
     * 最终是否真的 missing，
     * 必须检查 Conversation State 合并后的 playerInput。
     *
     * ========================================================
     */

    const missingFields =
        candidateMissingFields
            .filter(
                field =>
                    !hasPlayerField(
                        playerInput,
                        field
                    )
            );


    /**
     * ========================================================
     * STEP 5
     * Sort Missing Fields
     * ========================================================
     */

    const sortedMissingFields =
        [...missingFields]
            .sort(
                (
                    a,
                    b
                ) => {

                    const priorityA =
                        FIELD_PRIORITY[a] ??
                        999;


                    const priorityB =
                        FIELD_PRIORITY[b] ??
                        999;


                    return (
                        priorityA -
                        priorityB
                    );
                }
            );


    /**
     * ========================================================
     * STEP 6
     * Confidence
     * ========================================================
     */

    const confidenceScore =
        normalizeNumber(
            confidenceResult
                ?.score
        );


    const confidenceLevel =
        confidenceResult
            ?.level ??
        getConfidenceLevel(
            confidenceScore
        );


    /**
     * ========================================================
     * STEP 7
     * Recommendation Gate
     * ========================================================
     */

    const recommendationGate =
        buildRecommendationGate({

            confidenceScore,

            confidenceResult,

            missingFields:
                sortedMissingFields,

            playerInput
        });


    /**
     * ========================================================
     * STEP 8
     * Determine Follow-up
     * ========================================================
     */

    const requiresFollowUp =
        shouldRequireFollowUp({

            missingFields:
                sortedMissingFields,

            confidenceScore,

            recommendationGate
        });


    /**
     * ========================================================
     * STEP 9
     * Build Questions
     * ========================================================
     */

    const safeMaxQuestions =
        Number.isFinite(
            Number(
                maxQuestions
            )
        )
            ? Math.max(
                1,
                Math.min(
                    Number(
                        maxQuestions
                    ),
                    3
                )
            )
            : 2;


    const questions =
        requiresFollowUp
            ? buildQuestions(
                sortedMissingFields,
                safeMaxQuestions
            )
            : [];


    /**
     * ========================================================
     * STEP 10
     * Best Missing Field
     * ========================================================
     */

    const bestMissingField =
        questions
            ?.[
                0
            ]
            ?.field ??
        sortedMissingFields
            ?.[
                0
            ] ??
        null;


    /**
     * ========================================================
     * STEP 11
     * Response
     * ========================================================
     */

    return {

        engine:
            ENGINE_NAME,

        version:
            ENGINE_VERSION,

        generated_at:
            new Date()
                .toISOString(),

        confidence: {

            score:
                confidenceScore,

            level:
                confidenceLevel
        },

        missing_fields:
            sortedMissingFields,

        best_missing_field:
            bestMissingField,

        requires_follow_up:
            requiresFollowUp,

        recommendation_gate:
            recommendationGate,

        questions,

        summary:
            buildSummary(
                requiresFollowUp
            )
    };
}


/**
 * ============================================================
 * Player Field Validation
 * ============================================================
 *
 * 判断某个字段是否已经存在于最终 playerInput。
 *
 * 这是整个 V1.1 防止重复提问的核心。
 *
 * ============================================================
 */

function hasPlayerField(
    playerInput,
    field
) {

    if (
        !playerInput ||
        typeof playerInput !==
            "object"
    ) {

        return false;
    }


    switch (
        field
    ) {

        /**
         * Current Racquet
         */

        case "current_racquet":

            return hasObjectValue(
                playerInput
                    ?.current_racquet
            );


        /**
         * Current String
         */

        case "current_string":

            return hasObjectValue(
                playerInput
                    ?.current_string
            );


        /**
         * Current Tension
         */

        case "current_tension":

            return hasNumericOrTextValue(
                playerInput
                    ?.current_tension
            );


        /**
         * Primary Goal
         */

        case "primary_goal":

            return hasTextValue(
                playerInput
                    ?.primary_goal
            );


        /**
         * Playing Style
         */

        case "playing_style":

            return hasTextValue(
                playerInput
                    ?.playing_style
            );


        /**
         * Swing Speed
         */

        case "swing_speed":

            return hasTextValue(
                playerInput
                    ?.swing_speed
            );


        /**
         * Feel Preference
         */

        case "feel_preference":

            return hasTextValue(
                playerInput
                    ?.feel_preference
            );


        /**
         * Unknown Field
         *
         * 如果未来 Confidence Engine 新增字段，
         * 尝试直接读取 playerInput[field]。
         */

        default:

            return hasGenericValue(
                playerInput
                    ?.[field]
            );
    }
}


/**
 * ============================================================
 * Recommendation Gate
 * ============================================================
 */

function buildRecommendationGate({

    confidenceScore,

    confidenceResult,

    missingFields,

    playerInput

}) {

    /**
     * Confidence Engine 自己的限制。
     */

    const confidenceAllowsProduct =
        confidenceResult
            ?.restrictions
            ?.allow_specific_product_recommendation;


    const confidenceAllowsPrecision =
        confidenceResult
            ?.restrictions
            ?.allow_high_precision_setup;


    /**
     * 核心资料
     */

    const hasRacquet =
        hasPlayerField(
            playerInput,
            "current_racquet"
        );


    const hasGoal =
        hasPlayerField(
            playerInput,
            "primary_goal"
        );


    const hasCurrentString =
        hasPlayerField(
            playerInput,
            "current_string"
        );


    const hasCurrentTension =
        hasPlayerField(
            playerInput,
            "current_tension"
        );


    /**
     * 是否缺少关键资料。
     */

    const missingCriticalFields =
        missingFields
            .some(
                field =>
                    [
                        "current_racquet",
                        "primary_goal"
                    ]
                        .includes(
                            field
                        )
            );


    /**
     * Product Recommendation
     *
     * Moderate confidence + 核心资料存在，
     * 可以进入产品方向。
     */

    let allowSpecificProductRecommendation =
        (
            confidenceScore >=
            60 &&
            hasRacquet &&
            hasGoal &&
            !missingCriticalFields
        );


    /**
     * 如果 Confidence Engine 明确禁止，
     * 低 Confidence 时继续尊重限制。
     */

    if (
        confidenceAllowsProduct ===
            false &&
        confidenceScore <
            60
    ) {

        allowSpecificProductRecommendation =
            false;
    }


    /**
     * Precise Tension Recommendation
     *
     * 精准磅数要求更高：
     *
     * - Confidence >= 75
     * - 已知当前球线
     * - 已知当前磅数
     * - 不缺关键资料
     */

    let allowPreciseTensionRecommendation =
        (
            confidenceScore >=
            75 &&
            hasCurrentString &&
            hasCurrentTension &&
            !missingCriticalFields
        );


    if (
        confidenceAllowsPrecision ===
            false &&
        confidenceScore <
            75
    ) {

        allowPreciseTensionRecommendation =
            false;
    }


    /**
     * Mode
     */

    let mode =
        "general_direction";


    if (
        allowSpecificProductRecommendation
    ) {

        mode =
            "product_direction";
    }


    if (
        allowPreciseTensionRecommendation
    ) {

        mode =
            "precise_setup";
    }


    return {

        mode,

        allow_specific_product_recommendation:
            allowSpecificProductRecommendation,

        allow_precise_tension_recommendation:
            allowPreciseTensionRecommendation
    };
}


/**
 * ============================================================
 * Should Require Follow-up
 * ============================================================
 */

function shouldRequireFollowUp({

    missingFields,

    confidenceScore,

    recommendationGate

}) {

    /**
     * 没有任何缺失字段。
     */

    if (
        missingFields.length ===
        0
    ) {

        return false;
    }


    /**
     * Confidence 很低。
     */

    if (
        confidenceScore <
        60
    ) {

        return true;
    }


    /**
     * 如果还不能给具体产品方向，
     * 必须继续追问。
     */

    if (
        recommendationGate
            ?.allow_specific_product_recommendation !==
        true
    ) {

        return true;
    }


    /**
     * 如果还不能进入精准配置，
     * 且仍有影响配置的重要字段，
     * 继续追问。
     */

    const precisionRelevantFields =
        [
            "current_string",
            "current_tension",
            "swing_speed",
            "playing_style"
        ];


    const hasPrecisionMissingField =
        missingFields
            .some(
                field =>
                    precisionRelevantFields
                        .includes(
                            field
                        )
            );


    if (
        hasPrecisionMissingField
    ) {

        return true;
    }


    return false;
}


/**
 * ============================================================
 * Build Questions
 * ============================================================
 */

function buildQuestions(
    missingFields,
    maxQuestions
) {

    return missingFields
        .filter(
            field =>
                QUESTION_LIBRARY[
                    field
                ]
        )
        .slice(
            0,
            maxQuestions
        )
        .map(
            field => ({

                field,

                question:
                    QUESTION_LIBRARY[
                        field
                    ]
            })
        );
}


/**
 * ============================================================
 * Summary
 * ============================================================
 */

function buildSummary(
    requiresFollowUp
) {

    if (
        requiresFollowUp
    ) {

        return {

            en:
                "More information is recommended before presenting this as a precise final setup.",

            zh:
                "建议先补充关键资料，再把当前结果作为精准最终配置。"
        };
    }


    return {

        en:
            "Enough information is available to continue with the recommendation.",

        zh:
            "目前资料已经足够，可以继续生成推荐结果。"
    };
}


/**
 * ============================================================
 * Normalize Field Array
 * ============================================================
 */

function normalizeFieldArray(
    fields
) {

    if (
        !Array.isArray(
            fields
        )
    ) {

        return [];
    }


    return fields
        .filter(
            field =>
                typeof field ===
                    "string"
        )
        .map(
            field =>
                field.trim()
        )
        .filter(
            Boolean
        );
}


/**
 * ============================================================
 * Unique Fields
 * ============================================================
 */

function uniqueFields(
    fields
) {

    return [
        ...new Set(
            fields
        )
    ];
}


/**
 * ============================================================
 * Value Helpers
 * ============================================================
 */

function hasObjectValue(
    value
) {

    if (
        !value ||
        typeof value !==
            "object" ||
        Array.isArray(
            value
        )
    ) {

        return false;
    }


    return (
        hasTextValue(
            value?.id
        ) ||
        hasTextValue(
            value?.model
        ) ||
        hasTextValue(
            value?.brand
        )
    );
}


function hasTextValue(
    value
) {

    return (
        typeof value ===
            "string" &&
        value.trim()
            .length >
            0
    );
}


function hasNumericOrTextValue(
    value
) {

    if (
        typeof value ===
            "number"
    ) {

        return Number.isFinite(
            value
        );
    }


    return hasTextValue(
        value
    );
}


function hasGenericValue(
    value
) {

    if (
        value ===
            null ||
        value ===
            undefined
    ) {

        return false;
    }


    if (
        typeof value ===
            "string"
    ) {

        return (
            value.trim()
                .length >
            0
        );
    }


    if (
        typeof value ===
            "number"
    ) {

        return Number.isFinite(
            value
        );
    }


    if (
        typeof value ===
            "boolean"
    ) {

        return true;
    }


    if (
        Array.isArray(
            value
        )
    ) {

        return (
            value.length >
            0
        );
    }


    if (
        typeof value ===
            "object"
    ) {

        return (
            Object.keys(
                value
            )
                .length >
            0
        );
    }


    return false;
}


/**
 * ============================================================
 * Normalize Number
 * ============================================================
 */

function normalizeNumber(
    value
) {

    const number =
        Number(
            value
        );


    if (
        !Number.isFinite(
            number
        )
    ) {

        return 0;
    }


    return number;
}


/**
 * ============================================================
 * Confidence Level
 * ============================================================
 */

function getConfidenceLevel(
    score
) {

    if (
        score >=
        85
    ) {

        return "High";
    }


    if (
        score >=
        60
    ) {

        return "Moderate";
    }


    return "Low";
}


/**
 * ============================================================
 * Engine Info
 * ============================================================
 */

export function getFollowUpEngineInfo() {

    return {

        name:
            ENGINE_NAME,

        version:
            ENGINE_VERSION,

        capabilities: [

            "parser_missing_field_merge",

            "confidence_missing_field_merge",

            "conversation_state_validation",

            "merged_player_input_validation",

            "duplicate_question_prevention",

            "question_priority",

            "recommendation_gate",

            "specific_product_gate",

            "precise_tension_gate",

            "multi_turn_follow_up",

            "chinese_questions",

            "english_questions"
        ]
    };
}