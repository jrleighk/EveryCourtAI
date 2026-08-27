/**
 * ============================================================
 * EveryCourtAI
 * Conversation State Engine
 * Version: 1.0
 * ============================================================
 *
 * 文件路径：
 * engine/conversation_state_engine.js
 *
 * 主要职责：
 *
 * 1. 保存上一轮 Player Input
 * 2. 接收新一轮解析结果
 * 3. 合并上一轮与本轮信息
 * 4. 保留已经确认的信息
 * 5. 新信息覆盖旧信息
 * 6. 生成新的 Conversation State
 *
 * 示例：
 *
 * 第一轮：
 * 用户：
 * "我现在用 Wilson RF 01 Pro Classic，
 *  打久了肩膀有点累，希望更舒服一点。"
 *
 * 得到：
 *
 * current_racquet = RF 01 Pro Classic
 * primary_goal = more_comfort
 * physical.shoulder = mild
 *
 *
 * 第二轮：
 * 用户：
 * "Natural Gut，53磅。"
 *
 * 得到：
 *
 * current_string = Natural Gut
 * current_tension = 53
 *
 *
 * Conversation State Engine 合并后：
 *
 * current_racquet = RF 01 Pro Classic
 * primary_goal = more_comfort
 * physical.shoulder = mild
 * current_string = Natural Gut
 * current_tension = 53
 *
 * ============================================================
 */


/**
 * ============================================================
 * Constants
 * ============================================================
 */

const ENGINE_NAME =
    "conversation_state_engine";


const ENGINE_VERSION =
    "1.0";


/**
 * ============================================================
 * Create Empty Conversation State
 * ============================================================
 */

export function createConversationState(
    options = {}
) {

    const conversationId =
        options.conversation_id ??
        createConversationId();


    return {

        engine:
            ENGINE_NAME,

        version:
            ENGINE_VERSION,

        conversation_id:
            conversationId,

        turn:
            0,

        status:
            "active",

        player_input:
            {},

        missing_fields:
            [],

        pending_fields:
            [],

        last_message:
            null,

        last_input_mode:
            null,

        last_recommendation_context:
            null,

        pending_comparison_context:
            null,

        history:
            [],

        created_at:
            createTimestamp(),

        updated_at:
            createTimestamp()
    };
}


/**
 * ============================================================
 * Run Conversation State Engine
 * ============================================================
 *
 * 推荐使用的主入口。
 *
 * 输入：
 *
 * {
 *   previousState,
 *   parserResult,
 *   playerInput,
 *   message,
 *   inputMode
 * }
 *
 * 输出：
 *
 * {
 *   conversation_state,
 *   merged_player_input,
 *   ...
 * }
 *
 * ============================================================
 */

export function runConversationStateEngine(
    {
        previousState = null,
        parserResult = null,
        playerInput = null,
        message = null,
        inputMode = "message"
    } = {}
) {

    /**
     * --------------------------------------------------------
     * STEP 1
     * Resolve Previous State
     * --------------------------------------------------------
     */

    const baseState =
        normalizeConversationState(
            previousState
        );


    /**
     * --------------------------------------------------------
     * STEP 2
     * Resolve Current Player Input
     * --------------------------------------------------------
     */

    const currentPlayerInput =
        resolveCurrentPlayerInput(
            parserResult,
            playerInput
        );


    /**
     * --------------------------------------------------------
     * STEP 3
     * Previous Player Input
     * --------------------------------------------------------
     */

    const previousPlayerInput =
        isPlainObject(
            baseState.player_input
        )
            ? baseState.player_input
            : {};


    /**
     * --------------------------------------------------------
     * STEP 4
     * Merge Player Input
     * --------------------------------------------------------
     */

    const mergedPlayerInput =
        mergePlayerInput(
            previousPlayerInput,
            currentPlayerInput
        );


    /**
     * --------------------------------------------------------
     * STEP 5
     * Resolve Missing Fields
     * --------------------------------------------------------
     */

    const parserMissingFields =
        normalizeStringArray(
            parserResult
                ?.missing_fields
        );


    const previousPendingFields =
        normalizeStringArray(
            baseState
                ?.pending_fields
        );


    const mergedMissingFields =
        resolveMissingFields({

            parserMissingFields,

            previousPendingFields,

            mergedPlayerInput
        });


    /**
     * --------------------------------------------------------
     * STEP 6
     * Detect Updated Fields
     * --------------------------------------------------------
     */

    const updatedFields =
        detectUpdatedFields(
            previousPlayerInput,
            mergedPlayerInput
        );


    /**
     * --------------------------------------------------------
     * STEP 7
     * Turn
     * --------------------------------------------------------
     */

    const nextTurn =
        Number.isFinite(
            Number(
                baseState.turn
            )
        )
            ? Number(
                baseState.turn
            ) + 1
            : 1;


    /**
     * --------------------------------------------------------
     * STEP 8
     * History Entry
     * --------------------------------------------------------
     */

    const historyEntry = {

        turn:
            nextTurn,

        message:
            typeof message ===
                "string"
                ? message
                : null,

        input_mode:
            inputMode ??
            null,

        parsed_player_input:
            cloneValue(
                currentPlayerInput
            ),

        merged_player_input:
            cloneValue(
                mergedPlayerInput
            ),

        updated_fields:
            updatedFields,

        missing_fields:
            mergedMissingFields,

        timestamp:
            createTimestamp()
    };


    /**
     * --------------------------------------------------------
     * STEP 9
     * History
     * --------------------------------------------------------
     */

    const previousHistory =
        Array.isArray(
            baseState.history
        )
            ? baseState.history
            : [];


    const history =
        [
            ...previousHistory,
            historyEntry
        ];


    /**
     * 防止 State 无限膨胀。
     *
     * V1 先保留最近 20 轮。
     */

    const limitedHistory =
        history.slice(
            -20
        );


    /**
     * --------------------------------------------------------
     * STEP 10
     * New State
     * --------------------------------------------------------
     */

    const conversationState = {

        engine:
            ENGINE_NAME,

        version:
            ENGINE_VERSION,

        conversation_id:
            baseState
                .conversation_id,

        turn:
            nextTurn,

        status:
            "active",

        player_input:
            mergedPlayerInput,

        missing_fields:
            mergedMissingFields,

        pending_fields:
            mergedMissingFields,

        last_message:
            typeof message ===
                "string"
                ? message
                : null,

        last_input_mode:
            inputMode ??
            null,

        last_recommendation_context:
            isPlainObject(
                baseState
                    ?.last_recommendation_context
            )
                ? cloneValue(
                    baseState
                        .last_recommendation_context
                )
                : null,

        pending_comparison_context:
            isPlainObject(
                baseState
                    ?.pending_comparison_context
            )
                ? cloneValue(
                    baseState
                        .pending_comparison_context
                )
                : null,

        history:
            limitedHistory,

        created_at:
            baseState
                .created_at,

        updated_at:
            createTimestamp()
    };


    /**
     * --------------------------------------------------------
     * STEP 11
     * Result
     * --------------------------------------------------------
     */

    return {

        success:
            true,

        engine: {

            name:
                ENGINE_NAME,

            version:
                ENGINE_VERSION
        },

        conversation_id:
            conversationState
                .conversation_id,

        turn:
            conversationState
                .turn,

        previous_player_input:
            cloneValue(
                previousPlayerInput
            ),

        current_player_input:
            cloneValue(
                currentPlayerInput
            ),

        merged_player_input:
            cloneValue(
                mergedPlayerInput
            ),

        updated_fields:
            updatedFields,

        missing_fields:
            mergedMissingFields,

        conversation_state:
            conversationState,

        generated_at:
            createTimestamp()
    };
}


/**
 * ============================================================
 * Merge Player Input
 * ============================================================
 *
 * 规则：
 *
 * - null 不覆盖已有值
 * - undefined 不覆盖已有值
 * - 空字符串不覆盖已有值
 * - 空对象不覆盖已有对象
 * - 新的有效值覆盖旧值
 * - nested object 递归合并
 *
 * ============================================================
 */

export function mergePlayerInput(
    previousInput = {},
    currentInput = {}
) {

    const previous =
        isPlainObject(
            previousInput
        )
            ? cloneValue(
                previousInput
            )
            : {};


    const current =
        isPlainObject(
            currentInput
        )
            ? currentInput
            : {};


    return deepMergeMeaningful(
        previous,
        current
    );
}


/**
 * ============================================================
 * Update Pending Fields
 * ============================================================
 *
 * Worker / Follow-up Engine 后面可以使用：
 *
 * conversation_state.pending_fields =
 * [
 *   "current_string",
 *   "current_tension"
 * ]
 *
 * ============================================================
 */

export function updatePendingFields(
    conversationState,
    fields = []
) {

    const state =
        normalizeConversationState(
            conversationState
        );


    const normalizedFields =
        normalizeStringArray(
            fields
        );


    return {

        ...state,

        missing_fields:
            normalizedFields,

        pending_fields:
            normalizedFields,

        updated_at:
            createTimestamp()
    };
}


/**
 * ============================================================
 * Update Recommendation Context
 * ============================================================
 *
 * Stores only the most recent successful recommendation
 * context required by multi-turn explanation / follow-up
 * behavior.
 *
 * This does NOT run recommendation engines.
 * ============================================================
 */

export function updateRecommendationContext(
    conversationState,
    {
        recommendation = null,
        explanation = null,
        confidence = null,
        sourceTurn = null,
        generatedAt = null
    } = {}
) {

    const state =
        normalizeConversationState(
            conversationState
        );


    const hasRecommendation =
        isPlainObject(
            recommendation
        );


    const hasExplanation =
        isPlainObject(
            explanation
        );


    if (
        !hasRecommendation &&
        !hasExplanation
    ) {

        return state;
    }


    return {

        ...state,

        last_recommendation_context: {

            source_turn:
                Number.isFinite(
                    Number(
                        sourceTurn
                    )
                )
                    ? Number(
                        sourceTurn
                    )
                    : state.turn,

            recommendation:
                hasRecommendation
                    ? cloneValue(
                        recommendation
                    )
                    : null,

            explanation:
                hasExplanation
                    ? cloneValue(
                        explanation
                    )
                    : null,

            confidence:
                isPlainObject(
                    confidence
                )
                    ? cloneValue(
                        confidence
                    )
                    : null,

            generated_at:
                generatedAt ??
                createTimestamp()
        },

        updated_at:
            createTimestamp()
    };
}


/**
 * ============================================================
 * Update Pending Comparison Context
 * ============================================================
 *
 * Stores an unfinished comparison task so a later turn can
 * resolve only the missing product target.
 *
 * This function does NOT:
 *
 * - resolve products
 * - run comparison engines
 * - determine intent
 * - modify recommendation context
 *
 * ============================================================
 */

export function updatePendingComparisonContext(
    conversationState,
    {
        comparisonSubtype = null,
        products = [],
        unresolvedTargets = [],
        sourceMessage = null,
        sourceTurn = null,
        createdAt = null
    } = {}
) {

    const state =
        normalizeConversationState(
            conversationState
        );


    const normalizedProducts =
        Array.isArray(
            products
        )
            ? cloneValue(
                products
            )
            : [];


    const normalizedUnresolvedTargets =
        Array.isArray(
            unresolvedTargets
        )
            ? cloneValue(
                unresolvedTargets
            )
            : [];


    if (
        normalizedUnresolvedTargets.length ===
        0
    ) {

        return {
            ...state,

            pending_comparison_context:
                null
        };
    }


    return {

        ...state,

        pending_comparison_context: {

            active:
                true,

            source_turn:
                Number.isFinite(
                    Number(
                        sourceTurn
                    )
                )
                    ? Number(
                        sourceTurn
                    )
                    : state.turn,

            comparison_subtype:
                comparisonSubtype ??
                null,

            products:
                normalizedProducts,

            unresolved_targets:
                normalizedUnresolvedTargets,

            source_message:
                typeof sourceMessage ===
                    "string"
                    ? sourceMessage
                    : null,

            created_at:
                createdAt ??
                createTimestamp(),

            updated_at:
                createTimestamp()
        },

        updated_at:
            createTimestamp()
    };
}


/**
 * ============================================================
 * Clear Pending Comparison Context
 * ============================================================
 */

export function clearPendingComparisonContext(
    conversationState
) {

    const state =
        normalizeConversationState(
            conversationState
        );


    return {

        ...state,

        pending_comparison_context:
            null,

        updated_at:
            createTimestamp()
    };
}


/**
 * ============================================================
 * Complete Conversation
 * ============================================================
 */

export function completeConversation(
    conversationState
) {

    const state =
        normalizeConversationState(
            conversationState
        );


    return {

        ...state,

        status:
            "completed",

        pending_fields:
            [],

        missing_fields:
            [],

        updated_at:
            createTimestamp()
    };
}


/**
 * ============================================================
 * Resolve Current Player Input
 * ============================================================
 */

function resolveCurrentPlayerInput(
    parserResult,
    playerInput
) {

    /**
     * Explicit playerInput 优先。
     */

    if (
        isPlainObject(
            playerInput
        )
    ) {

        return cloneValue(
            playerInput
        );
    }


    /**
     * 否则读取 parserResult.player_input
     */

    if (
        isPlainObject(
            parserResult
                ?.player_input
        )
    ) {

        return cloneValue(
            parserResult
                .player_input
        );
    }


    return {};
}


/**
 * ============================================================
 * Normalize Conversation State
 * ============================================================
 */

function normalizeConversationState(
    state
) {

    if (
        !isPlainObject(
            state
        )
    ) {

        return createConversationState();
    }


    return {

        engine:
            state.engine ??
            ENGINE_NAME,

        version:
            state.version ??
            ENGINE_VERSION,

        conversation_id:
            state.conversation_id ??
            createConversationId(),

        turn:
            Number.isFinite(
                Number(
                    state.turn
                )
            )
                ? Number(
                    state.turn
                )
                : 0,

        status:
            state.status ??
            "active",

        player_input:
            isPlainObject(
                state.player_input
            )
                ? cloneValue(
                    state.player_input
                )
                : {},

        missing_fields:
            normalizeStringArray(
                state.missing_fields
            ),

        pending_fields:
            normalizeStringArray(
                state.pending_fields
            ),

        last_message:
            typeof state.last_message ===
                "string"
                ? state.last_message
                : null,

        last_input_mode:
            state.last_input_mode ??
            null,

        last_recommendation_context:
            isPlainObject(
                state
                    ?.last_recommendation_context
            )
                ? cloneValue(
                    state
                        .last_recommendation_context
                )
                : null,

        pending_comparison_context:
            isPlainObject(
                state
                    ?.pending_comparison_context
            )
                ? cloneValue(
                    state
                        .pending_comparison_context
                )
                : null,

        history:
            Array.isArray(
                state.history
            )
                ? cloneValue(
                    state.history
                )
                : [],

        created_at:
            state.created_at ??
            createTimestamp(),

        updated_at:
            state.updated_at ??
            createTimestamp()
    };
}


/**
 * ============================================================
 * Resolve Missing Fields
 * ============================================================
 */

function resolveMissingFields(
    {
        parserMissingFields = [],
        previousPendingFields = [],
        mergedPlayerInput = {}
    } = {}
) {

    const combined =
        uniqueStrings([
            ...previousPendingFields,
            ...parserMissingFields
        ]);


    return combined.filter(
        (
            field
        ) => {

            /**
             * 如果字段已经在 merged player input
             * 中有有效值，则不再 Missing。
             */

            return !hasMeaningfulField(
                mergedPlayerInput,
                field
            );
        }
    );
}


/**
 * ============================================================
 * Has Meaningful Field
 * ============================================================
 */

function hasMeaningfulField(
    playerInput,
    field
) {

    if (
        !isPlainObject(
            playerInput
        )
    ) {

        return false;
    }


    switch (
        field
    ) {

        case "current_racquet":

            return hasMeaningfulValue(
                playerInput
                    .current_racquet
            );


        case "current_string":

            return hasMeaningfulValue(
                playerInput
                    .current_string
            );


        case "current_tension":

            return hasMeaningfulValue(
                playerInput
                    .current_tension
            );


        case "playing_style":

            return hasMeaningfulValue(
                playerInput
                    .playing_style
            );


        case "swing_speed":

            return hasMeaningfulValue(
                playerInput
                    .swing_speed
            );


        case "feel_preference":

            return hasMeaningfulValue(
                playerInput
                    .feel_preference
            );


        case "launch_preference":

            return hasMeaningfulValue(
                playerInput
                    .launch_preference
            );


        case "primary_goal":

            return hasMeaningfulValue(
                playerInput
                    .primary_goal
            );


        default:

            return hasMeaningfulValue(
                getNestedValue(
                    playerInput,
                    field
                )
            );
    }
}


/**
 * ============================================================
 * Detect Updated Fields
 * ============================================================
 */

function detectUpdatedFields(
    previousInput,
    mergedInput
) {

    const previousFlat =
        flattenObject(
            previousInput
        );


    const mergedFlat =
        flattenObject(
            mergedInput
        );


    const fields =
        [];


    for (
        const [
            key,
            value
        ]
        of Object.entries(
            mergedFlat
        )
    ) {

        const previousValue =
            previousFlat[
                key
            ];


        if (
            !deepEqual(
                previousValue,
                value
            )
        ) {

            fields.push(
                key
            );
        }
    }


    return fields;
}


/**
 * ============================================================
 * Deep Merge Meaningful
 * ============================================================
 */

function deepMergeMeaningful(
    target,
    source
) {

    const result =
        isPlainObject(
            target
        )
            ? cloneValue(
                target
            )
            : {};


    if (
        !isPlainObject(
            source
        )
    ) {

        return result;
    }


    for (
        const [
            key,
            sourceValue
        ]
        of Object.entries(
            source
        )
    ) {

        /**
         * 无意义值：
         * 不覆盖旧数据。
         */

        if (
            !hasMeaningfulValue(
                sourceValue
            )
        ) {

            continue;
        }


        const targetValue =
            result[
                key
            ];


        /**
         * Nested Object
         */

        if (
            isPlainObject(
                sourceValue
            )
        ) {

            if (
                isPlainObject(
                    targetValue
                )
            ) {

                result[
                    key
                ] =
                    deepMergeMeaningful(
                        targetValue,
                        sourceValue
                    );

            } else {

                result[
                    key
                ] =
                    cloneValue(
                        sourceValue
                    );
            }


            continue;
        }


        /**
         * Array
         */

        if (
            Array.isArray(
                sourceValue
            )
        ) {

            result[
                key
            ] =
                cloneValue(
                    sourceValue
                );


            continue;
        }


        /**
         * Primitive
         */

        result[
            key
        ] =
            sourceValue;
    }


    return result;
}


/**
 * ============================================================
 * Has Meaningful Value
 * ============================================================
 */

function hasMeaningfulValue(
    value
) {

    if (
        value === null ||
        value === undefined
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
        isPlainObject(
            value
        )
    ) {

        return (
            Object.keys(
                value
            ).length >
            0
        );
    }


    return true;
}


/**
 * ============================================================
 * Get Nested Value
 * ============================================================
 *
 * 支持：
 *
 * physical.shoulder
 *
 * ============================================================
 */

function getNestedValue(
    object,
    path
) {

    if (
        !isPlainObject(
            object
        ) ||
        typeof path !==
            "string"
    ) {

        return undefined;
    }


    const parts =
        path.split(
            "."
        );


    let current =
        object;


    for (
        const part
        of parts
    ) {

        if (
            current ===
                null ||
            current ===
                undefined
        ) {

            return undefined;
        }


        current =
            current[
                part
            ];
    }


    return current;
}


/**
 * ============================================================
 * Flatten Object
 * ============================================================
 */

function flattenObject(
    object,
    prefix = "",
    output = {}
) {

    if (
        !isPlainObject(
            object
        )
    ) {

        return output;
    }


    for (
        const [
            key,
            value
        ]
        of Object.entries(
            object
        )
    ) {

        const fullKey =
            prefix
                ? `${prefix}.${key}`
                : key;


        if (
            isPlainObject(
                value
            )
        ) {

            flattenObject(
                value,
                fullKey,
                output
            );

        } else {

            output[
                fullKey
            ] =
                cloneValue(
                    value
                );
        }
    }


    return output;
}


/**
 * ============================================================
 * Normalize String Array
 * ============================================================
 */

function normalizeStringArray(
    value
) {

    if (
        !Array.isArray(
            value
        )
    ) {

        return [];
    }


    return uniqueStrings(
        value
            .filter(
                (
                    item
                ) =>
                    typeof item ===
                        "string" &&
                    item.trim()
            )
            .map(
                (
                    item
                ) =>
                    item.trim()
            )
    );
}


/**
 * ============================================================
 * Unique Strings
 * ============================================================
 */

function uniqueStrings(
    values
) {

    return [
        ...new Set(
            values
        )
    ];
}


/**
 * ============================================================
 * Plain Object
 * ============================================================
 */

function isPlainObject(
    value
) {

    return (
        value !==
            null &&
        typeof value ===
            "object" &&
        !Array.isArray(
            value
        )
    );
}


/**
 * ============================================================
 * Deep Equal
 * ============================================================
 */

function deepEqual(
    left,
    right
) {

    try {

        return (
            JSON.stringify(
                left
            ) ===
            JSON.stringify(
                right
            )
        );

    } catch {

        return (
            left ===
            right
        );
    }
}


/**
 * ============================================================
 * Clone
 * ============================================================
 */

function cloneValue(
    value
) {

    if (
        value ===
            undefined
    ) {

        return undefined;
    }


    try {

        return structuredClone(
            value
        );

    } catch {

        try {

            return JSON.parse(
                JSON.stringify(
                    value
                )
            );

        } catch {

            return value;
        }
    }
}


/**
 * ============================================================
 * Conversation ID
 * ============================================================
 */

function createConversationId() {

    return (
        "eca_conv_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .slice(
                2,
                10
            )
    );
}


/**
 * ============================================================
 * Timestamp
 * ============================================================
 */

function createTimestamp() {

    return new Date()
        .toISOString();
}


/**
 * ============================================================
 * Engine Info
 * ============================================================
 */

export function getConversationStateEngineInfo() {

    return {

        name:
            ENGINE_NAME,

        version:
            ENGINE_VERSION,

        capabilities: [

            "conversation_state",

            "multi_turn_merge",

            "player_input_memory",

            "pending_field_tracking",

            "conversation_history"
        ]
    };
}