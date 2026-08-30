/**
 * ============================================================
 * EveryCourtAI
 * Cloudflare Worker
 * Version: 2.3.1
 * ============================================================
 *
 * 文件路径：
 * cloudflare/worker.js
 *
 * 核心流程：
 *
 * Natural Language / Structured Input
 * ↓
 * Input Parser
 * ↓
 * Conversation State Engine
 * ↓
 * Merge Previous + Current Player Input
 * ↓
 * EveryCourtAI Engine
 * ↓
 * Confidence Engine
 * ↓
 * Follow-up Engine
 * ↓
 * 信息不足？
 *
 * YES:
 *   返回追问
 *   返回 conversation_state
 *   等待下一轮补充
 *
 * NO:
 *   返回完整 Recommendation
 *   返回 conversation_state
 *
 * V2.3.1 修复：
 *
 * Follow-up Engine 不再使用当前单轮 Parser 的 missing_fields，
 * 而是根据 Conversation State 合并后的完整 player_input
 * 重新判断真正缺失的信息。
 *
 * ============================================================
 */


/**
 * ============================================================
 * Imports
 * ============================================================
 */

import {
    runQuickRecommendation,
    getEngineInfo
} from "../engine/main_engine.js";


import {
    setKnowledgeRuntime,
    getKnowledgeRuntime
} from "../utils/runtime_json_loader.js";


import {
    parsePlayerInput
} from "../engine/input_parser.js";


import {
    detectQuestionIntent
} from "../engine/question_intent_engine.js";


import {
    understandTennisQuery
} from "../engine/query_understanding_v2.js";


import {
    buildIntentResponse
} from "../engine/intent_response_engine_v1.js";


import {
    runComparisonOrchestrator,
    runResolvedComparisonOrchestrator
} from "../engine/comparison_orchestrator_v1.js";


import {
    resolveComparisonClarification
} from "../engine/comparison_clarification_resolver_v1.js";


import {
    buildComparisonViewModel
} from "../engine/comparison_view_model_v1.js";


import {
    buildComparisonClarificationAnswer
} from "../engine/comparison_clarification_answer_builder_v1.js";




import {
    runFollowUpEngine
} from "../engine/follow_up_engine.js";


import {
    runConversationStateEngine,
    updatePendingFields,
    updateRecommendationContext,
    updatePendingComparisonContext,
    clearPendingComparisonContext
} from "../engine/conversation_state_engine.js";


import {
    normalizeStructuredProductInput
} from "../engine/structured_product_input.js";


/**
 * ============================================================
 * Configuration
 * ============================================================
 */

const APP_NAME =
    "EveryCourtAI";


const WORKER_VERSION =
    "2.3.1";


/**
 * ============================================================
 * Worker
 * ============================================================
 */

export default {

    async fetch(
        request,
        env,
        ctx
    ) {

        const url =
            new URL(
                request.url
            );


        /**
         * CORS
         */

        if (
            request.method === "OPTIONS"
        ) {

            return handleOptions();
        }


        /**
         * GET /
         */

        if (
            request.method === "GET" &&
            url.pathname === "/"
        ) {

            return jsonResponse({

                success:
                    true,

                app:
                    APP_NAME,

                service:
                    "everycourt-cloudflare-worker",

                worker_version:
                    WORKER_VERSION,

                runtime:
                    getKnowledgeRuntime(),

                engine:
                    getEngineInfo(),

                parser: {
                    name:
                        "EveryCourtAI Input Parser",

                    version:
                        "1.1",

                    mode:
                        "rule_based"
                },

                conversation_state_engine: {
                    name:
                        "conversation_state_engine",

                    version:
                        "1.0"
                },

                follow_up_engine: {
                    name:
                        "follow_up_engine",

                    version:
                        "1.0"
                },

                endpoints: {
                    health:
                        "/health",

                    ai:
                        "/ai"
                },

                input_modes: [
                    "message",
                    "player_input"
                ],

                multi_turn:
                    true,

                timestamp:
                    createTimestamp()
            });
        }


        /**
         * GET /health
         */

        if (
            request.method === "GET" &&
            url.pathname === "/health"
        ) {

            return handleHealth();
        }


        /**
         * POST /ai
         */

        if (
            request.method === "POST" &&
            url.pathname === "/ai"
        ) {

            return handleAI(
                request,
                env,
                ctx
            );
        }


        /**
         * 404
         */

        return jsonResponse(
            {

                success:
                    false,

                error: {

                    type:
                        "not_found",

                    message:
                        "EveryCourtAI API route not found."
                },

                path:
                    url.pathname

            },
            404
        );
    }
};


/**
 * ============================================================
 * Health
 * ============================================================
 */

async function handleHealth() {

    try {

        setKnowledgeRuntime(
            "cloudflare"
        );


        return jsonResponse({

            success:
                true,

            app:
                APP_NAME,

            service:
                "everycourt-cloudflare-worker",

            status:
                "online",

            worker_version:
                WORKER_VERSION,

            runtime:
                getKnowledgeRuntime(),

            engine:
                getEngineInfo(),

            parser: {

                name:
                    "EveryCourtAI Input Parser",

                version:
                    "1.1",

                mode:
                    "rule_based"
            },

            conversation_state_engine: {

                name:
                    "conversation_state_engine",

                version:
                    "1.0"
            },

            follow_up_engine: {

                name:
                    "follow_up_engine",

                version:
                    "1.0"
            },

            multi_turn:
                true,

            timestamp:
                createTimestamp()
        });


    } catch (
        error
    ) {

        return jsonResponse(
            {

                success:
                    false,

                status:
                    "error",

                error: {

                    type:
                        error?.name ??
                        "Error",

                    message:
                        safeErrorMessage(
                            error
                        )
                }
            },
            500
        );
    }
}


/**
 * ============================================================
 * AI Handler
 * ============================================================
 */

async function handleAI(
    request,
    env,
    ctx
) {

    const startedAt =
        Date.now();


    const requestId =
        createRequestId();


    try {

        /**
         * ====================================================
         * STEP 1
         * Runtime
         * ====================================================
         */

        setKnowledgeRuntime(
            "cloudflare"
        );


        /**
         * ====================================================
         * STEP 2
         * Parse Request Body
         * ====================================================
         */

        let body;


        try {

            body =
                await request.json();

        } catch {

            return jsonResponse(
                {

                    success:
                        false,

                    request_id:
                        requestId,

                    error: {

                        type:
                            "invalid_json",

                        message:
                            "Request body must be valid JSON."
                    }
                },
                400
            );
        }


        /**
         * ====================================================
         * STEP 3
         * Resolve Language
         * ====================================================
         */

        const language =
            normalizeLanguage(
                body?.language
            );


        /**
         * ====================================================
         * STEP 4
         * Previous Conversation State
         * ====================================================
         */

        const previousConversationState =
            isValidObject(
                body?.conversation_state
            )
                ? body.conversation_state
                : null;


        /**
         * ====================================================
         * STEP 5
         * Resolve Current Turn Input
         * ====================================================
         */

        let currentTurnPlayerInput =
            null;


        let parserResult =
            null;


        let questionIntentResult =
            null;


        let inputMode =
            null;


        /**
         * Natural Language + Optional Structured Player Input
         *
         * If message exists, always parse it first.
         * Optional body.player_input is merged into the parser result.
         *
         * This allows:
         * - Player Profile form data
         * - Natural-language equipment input
         *
         * to work in the same request.
         */

        if (
            typeof body?.message ===
                "string" &&
            body.message.trim()
        ) {

            questionIntentResult =
                detectQuestionIntent(
                    body.message
                );


            parserResult =
                parsePlayerInput(
                    body.message
                );


            if (
                !parserResult ||
                parserResult.success !==
                    true
            ) {

                return jsonResponse(
                    {

                        success:
                            false,

                        request_id:
                            requestId,

                        error: {

                            type:
                                "parser_failure",

                            message:
                                parserResult
                                    ?.error
                                    ?.message ??
                                "Unable to parse user message."
                        },

                        parser_result:
                            parserResult ??
                            null

                    },
                    400
                );
            }


            const structuredPlayerInput =
                isValidObject(
                    body?.player_input
                )
                    ? normalizeStructuredProductInput(
                        body.player_input
                    )
                    : {};


            const parserPlayerInput =
                isValidObject(
                    parserResult?.player_input
                )
                    ? Object.fromEntries(
                        Object.entries(
                            parserResult.player_input
                        ).filter(
                            ([key, value]) =>
                                key === "basic" ||
                                (
                                    value !== null &&
                                    value !== undefined &&
                                    value !== ""
                                )
                        )
                    )
                    : {};


            const parserBasic =
                isValidObject(
                    parserResult
                        ?.player_input
                        ?.basic
                )
                    ? Object.fromEntries(
                        Object.entries(
                            parserResult.player_input.basic
                        ).filter(
                            ([, value]) =>
                                value !== null &&
                                value !== undefined &&
                                value !== ""
                        )
                    )
                    : {};


            currentTurnPlayerInput = {
                ...structuredPlayerInput,
                ...parserPlayerInput,

                basic: {
                    ...(
                        isValidObject(
                            structuredPlayerInput
                                ?.basic
                        )
                            ? structuredPlayerInput.basic
                            : {}
                    ),

                    ...parserBasic
                }
            };


            parserResult = {
                ...parserResult,

                player_input:
                    currentTurnPlayerInput
            };


            inputMode =
                "message";
        }


        /**
         * Structured Player Input Only
         *
         * Used only when there is no natural-language message.
         */

        else if (
            isValidObject(
                body?.player_input
            )
        ) {

            currentTurnPlayerInput =
                body.player_input;


            inputMode =
                "player_input";
        }


        /**
         * No Input
         */

        else {

            return jsonResponse(
                {

                    success:
                        false,

                    request_id:
                        requestId,

                    error: {

                        type:
                            "validation",

                        message:
                            "Request must contain either a valid message or player_input object."
                    }

                },
                400
            );
        }


        /**
         * ====================================================
         * STEP 6
         * Validate Current Turn Input
         * ====================================================
         */

        if (
            !isValidObject(
                currentTurnPlayerInput
            )
        ) {

            return jsonResponse(
                {

                    success:
                        false,

                    request_id:
                        requestId,

                    error: {

                        type:
                            "validation",

                        message:
                            "Resolved player_input is invalid."
                    },

                    parser_result:
                        parserResult

                },
                400
            );
        }


        /**
         * ====================================================
         * STEP 7
         * Conversation State Engine
         * ====================================================
         */

        const conversationResult =
            runConversationStateEngine({

                previousState:
                    previousConversationState,

                parserResult,

                playerInput:
                    inputMode ===
                    "player_input"
                        ? currentTurnPlayerInput
                        : undefined,

                message:
                    typeof body?.message ===
                        "string"
                        ? body.message
                        : null,

                inputMode
            });


        /**
         * Conversation State Engine
         * 输出 merged_player_input。
         */

        const playerInput =
            conversationResult
                ?.merged_player_input;


        if (
            !isValidObject(
                playerInput
            )
        ) {

            return jsonResponse(
                {

                    success:
                        false,

                    request_id:
                        requestId,

                    error: {

                        type:
                            "conversation_state_failure",

                        message:
                            "Conversation State Engine did not produce a valid merged_player_input."
                    },

                    parser:
                        parserResult,

                    conversation:
                        conversationResult ??
                        null

                },
                500
            );
        }


        /**
         * ====================================================
         * STEP 8
         * Query Understanding V2 — Shadow Integration
         * ====================================================
         *
         * Shadow-only contract:
         *
         * - runs after Conversation State
         * - uses accumulated conversation_state context
         * - does NOT control routing
         * - does NOT alter Question Intent
         * - does NOT alter Comparison behavior
         * - does NOT alter Recommendation behavior
         * - is NOT exposed in the API response yet
         *
         * This allows production Worker behavior to remain
         * unchanged while Query Understanding V2 is exercised
         * against real Worker requests.
         * ====================================================
         */

        const queryUnderstandingShadow =
            typeof body?.message ===
                "string" &&
            body.message.trim()
                ? understandTennisQuery(
                    body.message,
                    {
                        conversationState:
                            conversationResult
                                ?.conversation_state
                    }
                )
                : null;


        /**
         * Explicitly preserve shadow-only behavior.
         *
         * The value is intentionally not consumed by routing
         * during 8O-C2A.
         */

        void queryUnderstandingShadow;


        /**
         * ====================================================
         * Comparison Clarification Continuation Gate V1
         * ====================================================
         *
         * A pending comparison has priority over normal
         * question-intent routing.
         *
         * Example:
         *
         * Turn 1:
         * "Pure Drive 和 RF 01 Pro Classic 哪个更适合我？"
         *
         * Turn 2:
         * "Spectra Edition 2026"
         *
         * Turn 2 does NOT need to be independently classified
         * as compare_products.
         *
         * ====================================================
         */

        const pendingComparisonContext =
            previousConversationState
                ?.pending_comparison_context;


        const shouldResolvePendingComparison =
            pendingComparisonContext
                ?.active ===
                true &&
            typeof body?.message ===
                "string" &&
            body.message.trim().length >
                0;


        if (
            shouldResolvePendingComparison
        ) {

            const clarificationResult =
                resolveComparisonClarification({

                    pendingContext:
                        pendingComparisonContext,

                    message:
                        body.message
                });


            /**
             * ------------------------------------------------
             * Clarification Resolved
             * ------------------------------------------------
             */

            if (
                clarificationResult
                    ?.success ===
                    true &&
                clarificationResult
                    ?.ready ===
                    true &&
                clarificationResult
                    ?.status ===
                    "comparison_clarification_resolved"
            ) {

                const resolvedComparisonResult =
                    await runResolvedComparisonOrchestrator({

                        productAId:
                            clarificationResult
                                ?.product_a
                                ?.id ??
                            null,

                        productBId:
                            clarificationResult
                                ?.product_b
                                ?.id ??
                            null,

                        playerProfile:
                            playerInput,

                        language,

                        resolution: {
                            ready:
                                true,

                            status:
                                "comparison_ready",

                            comparison_subtype:
                                clarificationResult
                                    ?.comparison_subtype ??
                                null,

                            products:
                                clarificationResult
                                    ?.products ??
                                [],

                            product_a:
                                clarificationResult
                                    ?.product_a ??
                                null,

                            product_b:
                                clarificationResult
                                    ?.product_b ??
                                null,

                            unresolved_targets:
                                []
                        }
                    });


                if (
                    resolvedComparisonResult
                        ?.success ===
                        true &&
                    resolvedComparisonResult
                        ?.ready ===
                        true &&
                    resolvedComparisonResult
                        ?.status ===
                        "comparison_orchestrator_ready"
                ) {

                    const playerDecision =
                        resolvedComparisonResult
                            ?.interpretation
                            ?.player_decision_narrative;


                    const objectiveNarrative =
                        resolvedComparisonResult
                            ?.interpretation
                            ?.narrative;


                    const deterministicLanguage =
                        resolvedComparisonResult
                            ?.interpretation
                            ?.language;


                    const normalizedLanguage =
                        normalizeLanguage(
                            language
                        );


                    const isChinese =
                        normalizedLanguage ===
                            "zh-CN" ||
                        normalizedLanguage ===
                            "zh-HK" ||
                        normalizedLanguage ===
                            "zh-TW";


                    const narrativeBlocks =
                        isChinese
                            ? (
                                objectiveNarrative
                                    ?.cn
                                    ?.blocks ??
                                []
                            )
                            : (
                                objectiveNarrative
                                    ?.en
                                    ?.blocks ??
                                []
                            );


                    const objectiveAnswer =
                        Array.isArray(
                            narrativeBlocks
                        )
                            ? narrativeBlocks
                                .map(
                                    item =>
                                        item
                                            ?.text ??
                                        null
                                )
                                .filter(
                                    Boolean
                                )
                                .join(
                                    "\n\n"
                                )
                            : "";


                    const playerDecisionAnswer =
                        playerDecision
                            ?.available ===
                            true
                            ? (
                                isChinese
                                    ? playerDecision.cn
                                    : playerDecision.en
                            )
                            : null;


                    const fallbackTitle =
                        isChinese
                            ? deterministicLanguage
                                ?.cn
                                ?.title
                            : deterministicLanguage
                                ?.en
                                ?.title;


                    const answerParts = [
                        fallbackTitle ??
                            null,

                        objectiveAnswer ||
                            null,

                        playerDecisionAnswer ??
                            null
                    ]
                        .filter(
                            Boolean
                        );


                    const answer =
                        answerParts.length >
                            0
                            ? answerParts.join(
                                "\n\n"
                            )
                            : (
                                isChinese
                                    ? "EveryCourtAI 已完成球拍对比。"
                                    : "EveryCourtAI completed the racquet comparison."
                            );


                    const comparisonView =
                        buildComparisonViewModel(
                            resolvedComparisonResult,
                            language
                        );


                    const clearedConversationState =
                        clearPendingComparisonContext(
                            conversationResult
                                ?.conversation_state
                        );


                    return jsonResponse({

                        success:
                            true,

                        request_id:
                            requestId,

                        app:
                            APP_NAME,

                        worker_version:
                            WORKER_VERSION,

                        runtime:
                            getKnowledgeRuntime(),

                        input_mode:
                            inputMode,

                        language,

                        message:
                            body.message,

                        status:
                            "comparison_ready",

                        answer,

                        parser:
                            parserResult,

                        question_intent:
                            questionIntentResult,

                        query_understanding:
                            queryUnderstandingShadow,

                        current_turn_player_input:
                            currentTurnPlayerInput,

                        player_input:
                            playerInput,

                        conversation_id:
                            conversationResult
                                ?.conversation_id ??
                            null,

                        turn:
                            conversationResult
                                ?.turn ??
                            null,

                        updated_fields:
                            conversationResult
                                ?.updated_fields ??
                            [],

                        missing_fields:
                            conversationResult
                                ?.missing_fields ??
                            [],

                        conversation_state:
                            clearedConversationState,

                        comparison:
                            resolvedComparisonResult,

                        comparison_view:
                            comparisonView,

                        comparison_clarification:
                            clarificationResult,

                        recommendation:
                            null,

                        follow_up:
                            null,

                        processing_time_ms:
                            Date.now() -
                            startedAt,

                        timestamp:
                            createTimestamp()
                    });
                }
            }


            /**
             * ------------------------------------------------
             * Clarification Still Required
             * ------------------------------------------------
             *
             * Preserve pending context.
             * Do not fall through to recommendation routing.
             */

            if (
                clarificationResult
                    ?.ready !==
                    true
            ) {

                const clarificationPresentation =
                    buildComparisonClarificationAnswer({
                        unresolvedTargets:
                            clarificationResult
                                ?.unresolved_targets ??
                            pendingComparisonContext
                                ?.unresolved_targets ??
                            [],

                        locale:
                            language
                    });


                return jsonResponse({

                    success:
                        true,

                    request_id:
                        requestId,

                    app:
                        APP_NAME,

                    worker_version:
                        WORKER_VERSION,

                    runtime:
                        getKnowledgeRuntime(),

                    input_mode:
                        inputMode,

                    language,

                    message:
                        body.message,

                    status:
                        "comparison_clarification_required",

                    answer:
                        clarificationPresentation
                            .answer,

                    comparison_clarification:
                        clarificationPresentation,

                    parser:
                        parserResult,

                    question_intent:
                        questionIntentResult,

                    query_understanding:
                        queryUnderstandingShadow,

                    current_turn_player_input:
                        currentTurnPlayerInput,

                    player_input:
                        playerInput,

                    conversation_id:
                        conversationResult
                            ?.conversation_id ??
                        null,

                    turn:
                        conversationResult
                            ?.turn ??
                        null,

                    updated_fields:
                        conversationResult
                            ?.updated_fields ??
                        [],

                    missing_fields:
                        conversationResult
                            ?.missing_fields ??
                        [],

                    conversation_state:
                        conversationResult
                            ?.conversation_state ??
                        null,

                    comparison:
                        null,

                    recommendation:
                        null,

                    follow_up:
                        null,

                    processing_time_ms:
                        Date.now() -
                        startedAt,

                    timestamp:
                        createTimestamp()
                });
            }
        }


        /**
         * ====================================================
         * Comparison Runtime Gate V1
         * ====================================================
         *
         * Comparison is an independent runtime task.
         *
         * It must execute after Conversation State has produced
         * the merged player profile, but before:
         *
         * - Previous Recommendation Recall
         * - Recommendation Engine
         * - Follow-up Engine
         *
         * The Comparison Orchestrator remains the single source
         * of truth for:
         *
         * - target extraction
         * - target resolution
         * - objective comparison
         * - player-aware comparison
         * - semantic interpretation
         * - comparison narrative
         *
         * Worker only routes and transports the result.
         * ====================================================
         */

        const shouldRunComparison =
            questionIntentResult
                ?.primary_intent ===
                "compare_products";


        if (
            shouldRunComparison
        ) {

            const comparisonResult =
                await runComparisonOrchestrator({

                    message:
                        typeof body?.message ===
                            "string"
                            ? body.message
                            : "",

                    playerProfile:
                        playerInput,

                    language
                });


            /**
             * ------------------------------------------------
             * Comparison Ready
             * ------------------------------------------------
             */

            if (
                comparisonResult
                    ?.success ===
                    true &&
                comparisonResult
                    ?.ready ===
                    true &&
                comparisonResult
                    ?.status ===
                    "comparison_orchestrator_ready"
            ) {

                const playerDecision =
                    comparisonResult
                        ?.interpretation
                        ?.player_decision_narrative;


                const objectiveNarrative =
                    comparisonResult
                        ?.interpretation
                        ?.narrative;


                const deterministicLanguage =
                    comparisonResult
                        ?.interpretation
                        ?.language;


                const normalizedLanguage =
                    normalizeLanguage(
                        language
                    );


                const isChinese =
                    normalizedLanguage ===
                        "zh-CN" ||
                    normalizedLanguage ===
                        "zh-HK" ||
                    normalizedLanguage ===
                        "zh-TW";


                const narrativeBlocks =
                    isChinese
                        ? (
                            objectiveNarrative
                                ?.cn
                                ?.blocks ??
                            []
                        )
                        : (
                            objectiveNarrative
                                ?.en
                                ?.blocks ??
                            []
                        );


                const objectiveAnswer =
                    Array.isArray(
                        narrativeBlocks
                    )
                        ? narrativeBlocks
                            .map(
                                item =>
                                    item
                                        ?.text ??
                                    null
                            )
                            .filter(
                                Boolean
                            )
                            .join(
                                "\n\n"
                            )
                        : "";


                const playerDecisionAnswer =
                    playerDecision
                        ?.available ===
                        true
                        ? (
                            isChinese
                                ? playerDecision.cn
                                : playerDecision.en
                        )
                        : null;


                const fallbackTitle =
                    isChinese
                        ? deterministicLanguage
                            ?.cn
                            ?.title
                        : deterministicLanguage
                            ?.en
                            ?.title;


                const answerParts = [
                    fallbackTitle ??
                        null,

                    objectiveAnswer ||
                        null,

                    playerDecisionAnswer ??
                        null
                ]
                    .filter(
                        Boolean
                    );


                const answer =
                    answerParts.length >
                        0
                        ? answerParts.join(
                            "\n\n"
                        )
                        : (
                            isChinese
                                ? "EveryCourtAI 已完成球拍对比。"
                                : "EveryCourtAI completed the racquet comparison."
                        );


                const comparisonView =
                    buildComparisonViewModel(
                        comparisonResult,
                        language
                    );


                return jsonResponse({

                    success:
                        true,

                    request_id:
                        requestId,

                    app:
                        APP_NAME,

                    worker_version:
                        WORKER_VERSION,

                    runtime:
                        getKnowledgeRuntime(),

                    input_mode:
                        inputMode,

                    language,

                    message:
                        typeof body?.message ===
                            "string"
                            ? body.message
                            : null,

                    status:
                        "comparison_ready",

                    answer,

                    parser:
                        parserResult,

                    question_intent:
                        questionIntentResult,

                    query_understanding:
                        queryUnderstandingShadow,

                    current_turn_player_input:
                        currentTurnPlayerInput,

                    player_input:
                        playerInput,

                    conversation_id:
                        conversationResult
                            ?.conversation_id ??
                        null,

                    turn:
                        conversationResult
                            ?.turn ??
                        null,

                    updated_fields:
                        conversationResult
                            ?.updated_fields ??
                        [],

                    missing_fields:
                        conversationResult
                            ?.missing_fields ??
                        [],

                    conversation_state:
                        conversationResult
                            ?.conversation_state ??
                        null,

                    comparison:
                        comparisonResult,

                    comparison_view:
                        comparisonView,

                    recommendation:
                        null,

                    follow_up:
                        null,

                    processing_time_ms:
                        Date.now() -
                        startedAt,

                    timestamp:
                        createTimestamp()
                });
            }


            /**
             * ------------------------------------------------
             * Clarification Required
             * ------------------------------------------------
             */

            if (
                comparisonResult
                    ?.status ===
                    "clarification_required"
            ) {

                const comparisonResolution =
                    comparisonResult
                        ?.resolution ??
                    comparisonResult
                        ?.comparison
                        ?.resolution ??
                    null;


                const pendingConversationState =
                    updatePendingComparisonContext(

                        conversationResult
                            ?.conversation_state,

                        {
                            comparisonSubtype:
                                comparisonResolution
                                    ?.comparison_subtype ??
                                null,

                            products:
                                comparisonResolution
                                    ?.products ??
                                [],

                            unresolvedTargets:
                                comparisonResolution
                                    ?.unresolved_targets ??
                                [],

                            sourceMessage:
                                typeof body?.message ===
                                    "string"
                                    ? body.message
                                    : null,

                            sourceTurn:
                                conversationResult
                                    ?.turn ??
                                null
                        }
                    );


                const clarificationPresentation =
                    buildComparisonClarificationAnswer({
                        unresolvedTargets:
                            comparisonResolution
                                ?.unresolved_targets ??
                            [],

                        locale:
                            language
                    });


                return jsonResponse({

                    success:
                        true,

                    request_id:
                        requestId,

                    app:
                        APP_NAME,

                    worker_version:
                        WORKER_VERSION,

                    runtime:
                        getKnowledgeRuntime(),

                    input_mode:
                        inputMode,

                    language,

                    message:
                        typeof body?.message ===
                            "string"
                            ? body.message
                            : null,

                    status:
                        "comparison_clarification_required",

                    answer:
                        clarificationPresentation
                            .answer,

                    comparison_clarification:
                        clarificationPresentation,

                    parser:
                        parserResult,

                    question_intent:
                        questionIntentResult,

                    query_understanding:
                        queryUnderstandingShadow,

                    current_turn_player_input:
                        currentTurnPlayerInput,

                    player_input:
                        playerInput,

                    conversation_id:
                        conversationResult
                            ?.conversation_id ??
                        null,

                    turn:
                        conversationResult
                            ?.turn ??
                        null,

                    updated_fields:
                        conversationResult
                            ?.updated_fields ??
                        [],

                    conversation_state:
                        pendingConversationState,

                    comparison:
                        comparisonResult,

                    recommendation:
                        null,

                    follow_up:
                        null,

                    processing_time_ms:
                        Date.now() -
                        startedAt,

                    timestamp:
                        createTimestamp()
                });
            }


            /**
             * ------------------------------------------------
             * Comparison Not Ready
             * ------------------------------------------------
             */

            return jsonResponse({

                success:
                    false,

                request_id:
                    requestId,

                app:
                    APP_NAME,

                worker_version:
                    WORKER_VERSION,

                runtime:
                    getKnowledgeRuntime(),

                input_mode:
                    inputMode,

                language,

                message:
                    typeof body?.message ===
                        "string"
                        ? body.message
                        : null,

                status:
                    "comparison_not_ready",

                answer:
                    normalizeLanguage(
                        language
                    )
                        .startsWith(
                            "zh"
                        )
                        ? "目前无法完成这次球拍对比，请确认两支球拍的完整型号。"
                        : "The racquet comparison could not be completed. Please confirm both full model names.",

                parser:
                    parserResult,

                question_intent:
                    questionIntentResult,

                query_understanding:
                    queryUnderstandingShadow,

                comparison:
                    comparisonResult,

                recommendation:
                    null,

                follow_up:
                    null,

                processing_time_ms:
                    Date.now() -
                    startedAt,

                timestamp:
                    createTimestamp()
            });
        }


        /**
         * ====================================================
         * Previous Recommendation Recall V1
         * ====================================================
         *
         * Explanation-only follow-up questions must explain
         * the previously completed recommendation.
         *
         * They must NOT:
         *
         * - rerun Recommendation Engine
         * - regenerate recommendation reasoning
         * - overwrite recommendation_context
         * - change recommendation source_turn
         *
         * Conversation State has already advanced the current
         * conversation turn before this gate.
         * ====================================================
         */

        const previousRecommendationContext =
            previousConversationState
                ?.last_recommendation_context ??
            null;


        const shouldRecallPreviousRecommendation =
            questionIntentResult
                ?.primary_intent ===
                "explain_current_setup" &&
            previousRecommendationContext
                ?.explanation;


        if (
            shouldRecallPreviousRecommendation
        ) {

            const recalledEngineResult = {

                success:
                    true,

                recommendation:
                    previousRecommendationContext
                        ?.recommendation ??
                    null,

                explanation:
                    previousRecommendationContext
                        ?.explanation ??
                    null,

                confidence:
                    previousRecommendationContext
                        ?.confidence ??
                    null
            };


            const recalledIntentResponse =
                buildIntentResponse({

                    questionIntentResult,

                    engineResult:
                        recalledEngineResult,

                    language
                });


            if (
                recalledIntentResponse
                    ?.handled ===
                    true
            ) {

                return jsonResponse({

                    success:
                        true,

                    request_id:
                        requestId,

                    app:
                        APP_NAME,

                    worker_version:
                        WORKER_VERSION,

                    runtime:
                        getKnowledgeRuntime(),

                    input_mode:
                        inputMode,

                    language,

                    message:
                        typeof body?.message ===
                            "string"
                            ? body.message
                            : null,

                    status:
                        "recommendation_ready",

                    answer:
                        recalledIntentResponse
                            .answer,

                    parser:
                        parserResult,

                    question_intent:
                        questionIntentResult,

                    query_understanding:
                        queryUnderstandingShadow,

                    intent_response:
                        recalledIntentResponse,

                    current_turn_player_input:
                        currentTurnPlayerInput,

                    player_input:
                        playerInput,

                    conversation_id:
                        conversationResult
                            ?.conversation_id ??
                        null,

                    turn:
                        conversationResult
                            ?.turn ??
                        null,

                    updated_fields:
                        conversationResult
                            ?.updated_fields ??
                        [],

                    missing_fields:
                        conversationResult
                            ?.missing_fields ??
                        [],

                    conversation_state:
                        conversationResult
                            ?.conversation_state ??
                        null,

                    follow_up:
                        null,

                    recommendation:
                        null,

                    engine_result: {

                        recommendation:
                            recalledEngineResult
                                .recommendation,

                        confidence:
                            recalledEngineResult
                                .confidence,

                        explanation:
                            recalledEngineResult
                                .explanation
                    },

                    recall: {

                        used:
                            true,

                        source_turn:
                            previousRecommendationContext
                                ?.source_turn ??
                            null
                    },

                    processing_time_ms:
                        Date.now() -
                        startedAt,

                    timestamp:
                        createTimestamp()
                });
            }
        }


        /**
         * ====================================================
         * STEP 8
         * Run EveryCourtAI Engine
         * ====================================================
         */

        const engineResult =
            await runQuickRecommendation(
                playerInput
            );


        if (
            !engineResult ||
            engineResult.success !==
                true
        ) {

            return jsonResponse(
                {

                    success:
                        false,

                    request_id:
                        requestId,

                    runtime:
                        getKnowledgeRuntime(),

                    input_mode:
                        inputMode,

                    player_input:
                        playerInput,

                    parser:
                        parserResult,

                    question_intent:
                        questionIntentResult,

                    query_understanding:
                        queryUnderstandingShadow,

                    conversation_id:
                        conversationResult
                            ?.conversation_id ??
                        null,

                    turn:
                        conversationResult
                            ?.turn ??
                        null,

                    conversation_state:
                        conversationResult
                            ?.conversation_state ??
                        null,

                    engine_result:
                        engineResult ??
                        null,

                    error: {

                        type:
                            "engine_failure",

                        message:
                            engineResult
                                ?.error
                                ?.message ??
                            "EveryCourtAI Engine failed."
                    },

                    processing_time_ms:
                        Date.now() -
                        startedAt

                },
                500
            );
        }


        /**
         * ====================================================
         * STEP 9
         * Follow-up Engine
         * ====================================================
         *
         * V2.3.1 修复：
         *
         * Follow-up Engine 必须以 Conversation State
         * 合并后的 playerInput 为唯一事实来源。
         *
         * 不能继续使用当前单轮 Parser 的 missing_fields，
         * 否则第二轮会重复询问第一轮已经回答过的问题。
         * ====================================================
         */

        const mergedParserMissingFields =
            getMissingFieldsFromMergedPlayerInput(
                playerInput
            );


        const mergedParserResult = {

            ...(parserResult ?? {}),

            success:
                true,

            player_input:
                playerInput,

            missing_fields:
                mergedParserMissingFields,

            requires_follow_up:
                mergedParserMissingFields.length >
                0
        };


        const followUpResult =
            runFollowUpEngine({

                parserResult:
                    mergedParserResult,

                confidenceResult:
                    engineResult
                        ?.confidence,

                playerInput,

                maxQuestions:
                    2
            });


        /**
         * ====================================================
         * Intent-Aware Follow-up Gate V1
         * ====================================================
         *
         * A general setup recommendation may still require
         * additional profile information.
         *
         * However, when the user explicitly asks for tension
         * guidance and the Follow-up Engine already confirms
         * that a precise tension recommendation is allowed,
         * non-critical missing fields must not block the
         * tension-focused answer.
         * ====================================================
         */

        const allowIntentResponseDespiteFollowUp =
            questionIntentResult
                ?.primary_intent ===
                "adjust_tension" &&
            followUpResult
                ?.recommendation_gate
                ?.allow_precise_tension_recommendation ===
                true;


        /**
         * ====================================================
         * STEP 10
         * Update Conversation Pending Fields
         * ====================================================
         */

        let conversationState =
            conversationResult
                ?.conversation_state ??
            null;


        if (
            followUpResult
                ?.requires_follow_up ===
                true &&
            allowIntentResponseDespiteFollowUp !==
                true &&
            Array.isArray(
                followUpResult
                    ?.questions
            )
        ) {

            const pendingFields =
                followUpResult
                    .questions
                    .map(
                        item =>
                            item?.field
                    )
                    .filter(
                        Boolean
                    );


            if (
                pendingFields.length >
                0 &&
                conversationState
            ) {

                conversationState =
                    updatePendingFields(
                        conversationState,
                        pendingFields
                    );
            }
        }


        /**
         * ====================================================
         * STEP 11
         * Follow-up Required
         * ====================================================
         */

        if (
            followUpResult
                ?.requires_follow_up ===
                true &&
            allowIntentResponseDespiteFollowUp !==
                true
        ) {

            const answer =
                buildFollowUpAnswer(
                    followUpResult,
                    language
                );


            return jsonResponse({

                success:
                    true,

                request_id:
                    requestId,

                app:
                    APP_NAME,

                worker_version:
                    WORKER_VERSION,

                runtime:
                    getKnowledgeRuntime(),

                input_mode:
                    inputMode,

                language,

                message:
                    typeof body?.message ===
                        "string"
                        ? body.message
                        : null,

                status:
                    "follow_up_required",

                answer,

                parser:
                    parserResult,

                question_intent:
                    questionIntentResult,

                query_understanding:
                    queryUnderstandingShadow,

                current_turn_player_input:
                    currentTurnPlayerInput,

                player_input:
                    playerInput,

                conversation_id:
                    conversationResult
                        ?.conversation_id ??
                    null,

                turn:
                    conversationResult
                        ?.turn ??
                    null,

                updated_fields:
                    conversationResult
                        ?.updated_fields ??
                    [],

                missing_fields:
                    mergedParserMissingFields,

                conversation_state:
                    conversationState,

                follow_up:
                    followUpResult,

                recommendation:
                    null,

                recommendation_preview:
                    buildGeneralDirection(
                        engineResult
                    ),

                engine_result: {

                    engine:
                        engineResult
                            ?.engine,

                    confidence:
                        engineResult
                            ?.confidence
                },

                processing_time_ms:
                    Date.now() -
                    startedAt,

                timestamp:
                    createTimestamp()
            });
        }


        /**
         * ====================================================
         * STEP 12
         * Full Recommendation Allowed
         * ====================================================
         */

        const intentResponse =
            buildIntentResponse({

                questionIntentResult,

                engineResult,

                language
            });


        const answer =
            intentResponse
                ?.handled ===
                true

                ? intentResponse.answer

                : buildFinalAnswer(
                    engineResult,
                    language
                );


        const webRecommendation =
            buildWebRecommendation(
                engineResult
            );


        /**
         * ====================================================
         * Recommendation Context V1
         * ====================================================
         *
         * Persist the latest completed recommendation so that
         * later turns such as:
         *
         * "Why this string?"
         * "Why this racquet?"
         * "Why this tension?"
         *
         * can explain the previous recommendation without
         * recalculating or losing its original reasoning.
         *
         * Only recommendation_ready reaches this point.
         * ====================================================
         */

        if (
            conversationState
        ) {

            conversationState =
                updateRecommendationContext(
                    conversationState,
                    {
                        recommendation:
                            engineResult
                                ?.recommendation,

                        explanation:
                            engineResult
                                ?.explanation,

                        confidence:
                            engineResult
                                ?.confidence,

                        sourceTurn:
                            conversationResult
                                ?.turn ??
                            null
                    }
                );
        }


        return jsonResponse({

            success:
                true,

            request_id:
                requestId,

            app:
                APP_NAME,

            worker_version:
                WORKER_VERSION,

            runtime:
                getKnowledgeRuntime(),

            input_mode:
                inputMode,

            language,

            message:
                typeof body?.message ===
                    "string"
                    ? body.message
                    : null,

            status:
                "recommendation_ready",

            answer,

            parser:
                parserResult,

            question_intent:
                questionIntentResult,

            query_understanding:
                queryUnderstandingShadow,

            intent_response:
                intentResponse,

            current_turn_player_input:
                currentTurnPlayerInput,

            player_input:
                playerInput,

            conversation_id:
                conversationResult
                    ?.conversation_id ??
                null,

            turn:
                conversationResult
                    ?.turn ??
                null,

            updated_fields:
                conversationResult
                    ?.updated_fields ??
                [],

            missing_fields:
                mergedParserMissingFields,

            conversation_state:
                conversationState,

            follow_up:
                followUpResult,

            recommendation:
                webRecommendation,

            engine_result: {

                engine:
                    engineResult
                        ?.engine,

                recommendation:
                    engineResult
                        ?.recommendation,

                confidence:
                    engineResult
                        ?.confidence,

                explanation:
                    engineResult
                        ?.explanation
            },

            processing_time_ms:
                Date.now() -
                startedAt,

            timestamp:
                createTimestamp()
        });


    } catch (
        error
    ) {

        return jsonResponse(
            {

                success:
                    false,

                request_id:
                    requestId,

                runtime:
                    getKnowledgeRuntime(),

                error: {

                    type:
                        error?.name ??
                        "Error",

                    message:
                        safeErrorMessage(
                            error
                        )
                },

                processing_time_ms:
                    Date.now() -
                    startedAt,

                timestamp:
                    createTimestamp()

            },
            500
        );
    }
}


/**
 * ============================================================
 * General Direction Preview
 * ============================================================
 */

function buildGeneralDirection(
    engineResult
) {

    const recommendation =
        engineResult
            ?.recommendation;


    const confidence =
        engineResult
            ?.confidence;


    return {

        status:
            "general_direction_only",

        racquet_action:
            recommendation
                ?.racquet_decision
                ?.action ??
            null,

        primary_goal:
            recommendation
                ?.player_context
                ?.primary_goal ??
            null,

        setup_score:
            recommendation
                ?.setup_score ??
            null,

        confidence:
            confidence
                ?.score ??
            null,

        confidence_level:
            confidence
                ?.level ??
            null,

        note: {
            en:
                "Specific product and tension recommendations are temporarily withheld until the missing information is provided.",

            zh:
                "在补充关键缺失信息之前，暂不把具体球线和精准磅数作为最终推荐。"
        }
    };
}


/**
 * ============================================================
 * Follow-up Answer
 * ============================================================
 */

function buildFollowUpAnswer(
    followUpResult,
    language
) {

    const questions =
        followUpResult
            ?.questions ??
        [];


    const normalizedLanguage =
        normalizeLanguage(
            language
        );


    if (
        normalizedLanguage === "zh-CN" ||
        normalizedLanguage === "zh-HK" ||
        normalizedLanguage === "zh-TW"
    ) {

        const questionTexts =
            questions
                .map(
                    (
                        item,
                        index
                    ) => {

                        const text =
                            item
                                ?.question
                                ?.zh ??
                            item
                                ?.question
                                ?.en ??
                            "";

                        return (
                            `${index + 1}. ${text}`
                        );
                    }
                )
                .filter(
                    Boolean
                );


        return [
            "我已经完成了第一轮装备分析，但目前资料还不足以把具体球线和精准磅数作为最终推荐。",
            "",
            "为了提高推荐准确度，请再告诉我：",
            ...questionTexts
        ]
            .join("\n");
    }


    const questionTexts =
        questions
            .map(
                (
                    item,
                    index
                ) => {

                    const text =
                        item
                            ?.question
                            ?.en ??
                        item
                            ?.question
                            ?.zh ??
                        "";

                    return (
                        `${index + 1}. ${text}`
                    );
                }
            )
            .filter(
                Boolean
            );


    return [
        "I have completed the first equipment analysis, but there is not yet enough information to treat a specific string and tension as the final setup.",
        "",
        "Please tell me:",
        ...questionTexts
    ]
        .join("\n");
}


/**
 * ============================================================
 * Final Human Answer
 * ============================================================
 */

function buildFinalAnswer(
    engineResult,
    language
) {

    const explanation =
        engineResult
            ?.explanation;


    const normalizedLanguage =
        normalizeLanguage(
            language
        );


    if (
        normalizedLanguage === "zh-CN"
    ) {

        return (
            explanation
                ?.summary
                ?.zh ??
            explanation
                ?.summary
                ?.en ??
            "EveryCourtAI 已完成装备分析。"
        );
    }


    if (
        normalizedLanguage === "zh-HK" ||
        normalizedLanguage === "zh-TW"
    ) {

        return (
            explanation
                ?.summary
                ?.zh ??
            explanation
                ?.summary
                ?.en ??
            "EveryCourtAI 已完成裝備分析。"
        );
    }


    return (
        explanation
            ?.summary
            ?.en ??
        explanation
            ?.summary
            ?.zh ??
        "EveryCourtAI has completed the equipment analysis."
    );
}


/**
 * ============================================================
 * Web Recommendation
 * ============================================================
 */

function buildWebRecommendation(
    engineResult
) {

    const recommendation =
        engineResult
            ?.recommendation;


    const confidence =
        engineResult
            ?.confidence;


    if (
        !recommendation
    ) {

        return null;
    }


    const racquet =
        recommendation
            ?.racquet_decision
            ?.recommended;


    const mainString =
        recommendation
            ?.string_setup
            ?.main;


    const tension =
        recommendation
            ?.tension;


    let tensionRange =
        null;


    if (
        tension
            ?.working_range_lbs
            ?.minimum_lbs !==
            undefined &&
        tension
            ?.working_range_lbs
            ?.maximum_lbs !==
            undefined
    ) {

        tensionRange =
            `${tension.working_range_lbs.minimum_lbs}–${tension.working_range_lbs.maximum_lbs} lbs`;
    }


    return {

        racquet:
            racquet
                ? `${racquet.brand ?? ""} ${racquet.model ?? ""}`
                    .trim()
                : null,

        racquet_id:
            racquet
                ?.id ??
            null,

        racquet_action:
            recommendation
                ?.racquet_decision
                ?.action ??
            null,

        string_action:
            recommendation
                ?.string_decision
                ?.action ??
            null,

        tension_action:
            recommendation
                ?.tension_decision
                ?.action ??
            null,

        change_strategy:
            recommendation
                ?.change_strategy
                ?.strategy ??
            null,

        change_principle:
            recommendation
                ?.change_strategy
                ?.principle ??
            null,

        recommended_change_count:
            recommendation
                ?.change_strategy
                ?.recommended_change_count ??
            null,

        tension_delta_lbs:
            recommendation
                ?.change_strategy
                ?.tension_delta_lbs ??
            null,

        string:
            mainString
                ? `${mainString.brand ?? ""} ${mainString.model ?? ""}`
                    .trim()
                : null,

        string_id:
            mainString
                ?.id ??
            null,

        gauge_mm:
            mainString
                ?.gauge_mm ??
            null,

        setup_type:
            recommendation
                ?.string_setup
                ?.type ??
            null,

        tension_lbs:
            tension
                ?.main_lbs ??
            null,

        tension_range:
            tensionRange,

        confidence:
            confidence
                ?.score ??
            null,

        confidence_level:
            confidence
                ?.level ??
            null,

        setup_score:
            recommendation
                ?.setup_score ??
            null,

        why:
            recommendation
                ?.primary_reasons ??
            [],

        tradeoffs:
            recommendation
                ?.tradeoffs ??
            [],

        alternatives:
            recommendation
                ?.alternatives ??
            []
    };
}


/**
 * ============================================================
 * Missing Fields From Merged Player Input
 * ============================================================
 *
 * 这里检查的是 Conversation State 合并后的完整用户资料，
 * 不是当前单轮 Parser 的资料。
 *
 * ============================================================
 */

function getMissingFieldsFromMergedPlayerInput(
    playerInput
) {

    const missingFields =
        [];


    if (
        !playerInput
            ?.current_racquet
    ) {

        missingFields.push(
            "current_racquet"
        );
    }


    if (
        !playerInput
            ?.primary_goal
    ) {

        missingFields.push(
            "primary_goal"
        );
    }


    if (
        !playerInput
            ?.playing_style
    ) {

        missingFields.push(
            "playing_style"
        );
    }


    if (
        !playerInput
            ?.swing_speed
    ) {

        missingFields.push(
            "swing_speed"
        );
    }


    if (
        !playerInput
            ?.feel_preference
    ) {

        missingFields.push(
            "feel_preference"
        );
    }


    if (
        !playerInput
            ?.current_string
    ) {

        missingFields.push(
            "current_string"
        );
    }


    if (
        playerInput
            ?.current_tension ===
            null ||
        playerInput
            ?.current_tension ===
            undefined
    ) {

        missingFields.push(
            "current_tension"
        );
    }


    return missingFields;
}


/**
 * ============================================================
 * Object Validation
 * ============================================================
 */

function isValidObject(
    value
) {

    return (
        value !== null &&
        typeof value ===
            "object" &&
        !Array.isArray(
            value
        )
    );
}


/**
 * ============================================================
 * Normalize Language
 * ============================================================
 */

function normalizeLanguage(
    language
) {

    if (
        typeof language !==
        "string"
    ) {

        return "en";
    }


    const normalized =
        language
            .trim()
            .toLowerCase()
            .replace(/_/g, "-");


    if (
        normalized === "zh" ||
        normalized === "zh-cn" ||
        normalized === "zh-sg" ||
        normalized === "zh-hans"
    ) {

        return "zh-CN";
    }


    if (
        normalized === "zh-hk" ||
        normalized === "zh-mo" ||
        normalized === "zh-tc"
    ) {

        return "zh-HK";
    }


    if (
        normalized === "zh-tw"
    ) {

        return "zh-TW";
    }


    if (
        normalized === "zh-hant"
    ) {

        return "zh-HK";
    }


    if (
        normalized === "en" ||
        normalized.startsWith(
            "en-"
        )
    ) {

        return "en";
    }


    if (
        normalized === "ja" ||
        normalized.startsWith(
            "ja-"
        )
    ) {

        return "ja";
    }


    return (
        normalized ||
        "en"
    );
}


/**
 * ============================================================
 * JSON Response
 * ============================================================
 */

function jsonResponse(
    data,
    status = 200
) {

    return new Response(
        JSON.stringify(
            data,
            null,
            2
        ),
        {

            status,

            headers: {

                "Content-Type":
                    "application/json; charset=UTF-8",

                "Access-Control-Allow-Origin":
                    "*",

                "Access-Control-Allow-Methods":
                    "GET, POST, OPTIONS",

                "Access-Control-Allow-Headers":
                    "Content-Type, Accept, X-EveryCourt-Client",

                "Cache-Control":
                    "no-store"
            }
        }
    );
}


/**
 * ============================================================
 * CORS
 * ============================================================
 */

function handleOptions() {

    return new Response(
        null,
        {

            status:
                204,

            headers: {

                "Access-Control-Allow-Origin":
                    "*",

                "Access-Control-Allow-Methods":
                    "GET, POST, OPTIONS",

                "Access-Control-Allow-Headers":
                    "Content-Type, Accept, X-EveryCourt-Client",

                "Access-Control-Max-Age":
                    "86400"
            }
        }
    );
}


/**
 * ============================================================
 * Request ID
 * ============================================================
 */

function createRequestId() {

    return (
        "eca_cf_" +
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
 * Safe Error
 * ============================================================
 */

function safeErrorMessage(
    error
) {

    if (
        error instanceof Error
    ) {

        return error.message;
    }


    return String(
        error
    );
}
