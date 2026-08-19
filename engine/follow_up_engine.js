/**
 * ============================================================
 * EveryCourtAI
 * Follow-up Engine
 * Version: 1.0
 * ============================================================
 *
 * 文件路径：
 * engine/follow_up_engine.js
 *
 * 作用：
 *
 * 1. 检查 Player Profile / Parser 的缺失信息
 * 2. 检查 Confidence
 * 3. 决定是否需要追问
 * 4. 生成最有价值的 1–2 个追问
 * 5. 控制是否允许输出精准产品 / 磅数推荐
 *
 * ============================================================
 */


/**
 * ============================================================
 * 基础配置
 * ============================================================
 */

const ENGINE_NAME =
    "follow_up_engine";

const ENGINE_VERSION =
    "1.0";


/**
 * ============================================================
 * Confidence Thresholds
 * ============================================================
 */

const MIN_CONFIDENCE_FOR_PRECISE_SETUP =
    70;

const MIN_CONFIDENCE_FOR_PRODUCT_RECOMMENDATION =
    60;


/**
 * ============================================================
 * Field Priority
 * ============================================================
 *
 * 数字越小，优先级越高。
 * ============================================================
 */

const FIELD_PRIORITY = {

    current_racquet: 1,

    primary_goal: 2,

    current_string: 3,

    current_tension: 4,

    swing_speed: 5,

    playing_style: 6,

    physical_profile: 7,

    feel_preference: 8,

    launch_preference: 9
};


/**
 * ============================================================
 * Question Library
 * ============================================================
 */

const QUESTION_LIBRARY = {

    current_racquet: {

        en:
            "What racquet are you currently using?",

        zh:
            "你目前使用的是哪一款球拍？"
    },


    primary_goal: {

        en:
            "What would you most like to improve: control, power, spin, comfort, or feel?",

        zh:
            "你最希望改善的是哪一点：控制、力量、旋转、舒适性，还是手感？"
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


    swing_speed: {

        en:
            "How would you describe your swing speed: slow, medium, or fast?",

        zh:
            "你的挥拍速度大概属于慢、中等还是快？"
    },


    playing_style: {

        en:
            "How would you describe your playing style: aggressive baseline, counterpuncher, grinder, all-court, or serve-and-volley?",

        zh:
            "你的主要打法更接近哪一种：进攻型底线、防守反击、底线相持、全场型，还是发球上网？"
    },


    physical_profile: {

        en:
            "Do you currently have any arm, elbow, wrist, shoulder, neck, back, hip, knee, or ankle discomfort?",

        zh:
            "你目前是否有手臂、手肘、手腕、肩部、颈部、腰背、髋、膝盖或脚踝方面的不适？"
    },


    feel_preference: {

        en:
            "What kind of feel do you prefer: soft, plush, connected, crisp, firm, or muted?",

        zh:
            "你更喜欢哪种手感：柔软、包裹感、连接感、清脆、偏硬，还是偏闷？"
    },


    launch_preference: {

        en:
            "Do you prefer a lower, medium, or higher launch angle?",

        zh:
            "你更偏好较低、中等还是较高的出球弹道？"
    }
};


/**
 * ============================================================
 * Normalize Missing Fields
 * ============================================================
 */

function normalizeMissingFields(
    missingFields = []
) {

    if (
        !Array.isArray(
            missingFields
        )
    ) {
        return [];
    }


    return [
        ...new Set(
            missingFields
                .filter(
                    item =>
                        typeof item ===
                        "string"
                )
                .map(
                    item =>
                        item
                            .trim()
                            .toLowerCase()
                )
                .filter(
                    Boolean
                )
        )
    ];
}


/**
 * ============================================================
 * Map Engine Missing Fields
 * ============================================================
 *
 * 不同 Engine 可能使用不同字段名，
 * 这里统一成 Follow-up Engine 使用的标准字段。
 * ============================================================
 */

function mapMissingField(
    field
) {

    const mapping = {

        current_racquet:
            "current_racquet",

        primary_goal:
            "primary_goal",

        current_string:
            "current_string",

        current_tension:
            "current_tension",

        playing_style:
            "playing_style",

        swing_speed:
            "swing_speed",

        feel_preference:
            "feel_preference",

        launch_preference:
            "launch_preference"
    };


    return (
        mapping[field] ??
        field
    );
}


/**
 * ============================================================
 * Detect Physical Information
 * ============================================================
 */

function hasPhysicalInformation(
    playerInput = {},
    confidenceResult = {}
) {

    const physical =
        playerInput
            ?.physical;


    if (
        physical &&
        typeof physical === "object" &&
        Object.keys(
            physical
        ).length > 0
    ) {
        return true;
    }


    const activeConstraints =
        confidenceResult
            ?.profile_status
            ?.active_physical_constraints;


    return (
        Array.isArray(
            activeConstraints
        ) &&
        activeConstraints.length > 0
    );
}


/**
 * ============================================================
 * Build Candidate Missing Fields
 * ============================================================
 */

function buildMissingFields({
    parserResult,
    confidenceResult,
    playerInput
}) {

    const missing = [];


    /**
     * Parser Missing Fields
     */

    const parserMissing =
        normalizeMissingFields(
            parserResult
                ?.missing_fields
        );


    for (
        const field
        of parserMissing
    ) {

        missing.push(
            mapMissingField(
                field
            )
        );
    }


    /**
     * Confidence Missing Fields
     */

    const confidenceMissing =
        normalizeMissingFields(
            confidenceResult
                ?.profile_status
                ?.missing_fields
        );


    for (
        const field
        of confidenceMissing
    ) {

        missing.push(
            mapMissingField(
                field
            )
        );
    }


    /**
     * Physical Profile
     *
     * 如果完全没有身体信息，
     * 可作为较低优先级追问。
     */

    if (
        !hasPhysicalInformation(
            playerInput,
            confidenceResult
        )
    ) {

        missing.push(
            "physical_profile"
        );
    }


    return [
        ...new Set(
            missing
        )
    ];
}


/**
 * ============================================================
 * Sort Missing Fields
 * ============================================================
 */

function sortMissingFields(
    fields = []
) {

    return [
        ...fields
    ].sort(
        (
            a,
            b
        ) => {

            const aPriority =
                FIELD_PRIORITY[a] ??
                999;

            const bPriority =
                FIELD_PRIORITY[b] ??
                999;


            return (
                aPriority -
                bPriority
            );
        }
    );
}


/**
 * ============================================================
 * Build Questions
 * ============================================================
 */

function buildQuestions(
    missingFields = [],
    maxQuestions = 2
) {

    const output = [];


    const sorted =
        sortMissingFields(
            missingFields
        );


    for (
        const field
        of sorted
    ) {

        const question =
            QUESTION_LIBRARY[field];


        if (
            !question
        ) {
            continue;
        }


        output.push({

            field,

            question: {

                en:
                    question.en,

                zh:
                    question.zh
            }
        });


        if (
            output.length >=
            maxQuestions
        ) {
            break;
        }
    }


    return output;
}


/**
 * ============================================================
 * Build Gate Decision
 * ============================================================
 */

function buildGateDecision({
    confidenceScore,
    missingFields,
    confidenceResult
}) {

    const restrictions =
        confidenceResult
            ?.restrictions ??
        {};


    /**
     * Precision Setup
     */

    const allowPreciseSetup =
        (
            confidenceScore >=
            MIN_CONFIDENCE_FOR_PRECISE_SETUP
        ) &&
        (
            restrictions
                ?.allow_high_precision_setup !==
            false
        );


    /**
     * Specific Product
     */

    const allowSpecificProduct =
        (
            confidenceScore >=
            MIN_CONFIDENCE_FOR_PRODUCT_RECOMMENDATION
        ) &&
        (
            restrictions
                ?.allow_specific_product_recommendation !==
            false
        );


    /**
     * Follow-up Required
     */

    const confidenceFollowUpRequired =
        confidenceResult
            ?.follow_up
            ?.required ===
        true;


    const requiresFollowUp =
        (
            confidenceFollowUpRequired ||
            confidenceScore <
                MIN_CONFIDENCE_FOR_PRECISE_SETUP ||
            missingFields.length > 0
        );


    return {

        requires_follow_up:
            requiresFollowUp,

        allow_specific_product_recommendation:
            allowSpecificProduct,

        allow_precise_tension_recommendation:
            allowPreciseSetup,

        recommendation_mode:
            allowPreciseSetup
                ? "precise_setup"
                : (
                    allowSpecificProduct
                        ? "product_direction"
                        : "general_direction"
                )
    };
}


/**
 * ============================================================
 * Main Follow-up Engine
 * ============================================================
 */

export function runFollowUpEngine({
    parserResult = null,
    confidenceResult = null,
    playerInput = {},
    maxQuestions = 2
} = {}) {

    /**
     * Confidence Score
     */

    const confidenceScore =
        Number(
            confidenceResult
                ?.score ??
            0
        );


    /**
     * Missing Fields
     */

    const missingFields =
        buildMissingFields({
            parserResult,
            confidenceResult,
            playerInput
        });


    /**
     * Gate
     */

    const gate =
        buildGateDecision({
            confidenceScore,
            missingFields,
            confidenceResult
        });


    /**
     * Questions
     */

    const questions =
        gate
            .requires_follow_up
            ? buildQuestions(
                missingFields,
                maxQuestions
            )
            : [];


    /**
     * Best Missing Field
     */

    const bestMissingField =
        questions
            ?.[
                0
            ]
            ?.field ??
        null;


    /**
     * Output
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
                confidenceResult
                    ?.level ??
                null
        },

        missing_fields:
            missingFields,

        best_missing_field:
            bestMissingField,

        requires_follow_up:
            gate
                .requires_follow_up,

        recommendation_gate: {

            mode:
                gate
                    .recommendation_mode,

            allow_specific_product_recommendation:
                gate
                    .allow_specific_product_recommendation,

            allow_precise_tension_recommendation:
                gate
                    .allow_precise_tension_recommendation
        },

        questions,

        summary: {

            en:
                gate
                    .requires_follow_up
                    ? "More information is recommended before presenting this as a precise final setup."
                    : "The available information is sufficient for a precise equipment recommendation.",

            zh:
                gate
                    .requires_follow_up
                    ? "建议先补充关键资料，再把当前结果作为精准最终配置。"
                    : "目前资料已经足够，可以生成较精准的装备推荐。"
        }
    };
}


/**
 * ============================================================
 * Helper
 * ============================================================
 */

export function shouldAskFollowUp(
    followUpResult
) {

    return (
        followUpResult
            ?.requires_follow_up ===
        true
    );
}


/**
 * ============================================================
 * Default Export
 * ============================================================
 */

export default {

    runFollowUpEngine,

    shouldAskFollowUp
};