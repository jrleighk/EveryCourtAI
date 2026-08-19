/**
 * ============================================================
 * EveryCourtAI
 * Cloudflare Worker
 * Version: 2.2
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
 * EveryCourtAI Engine
 * ↓
 * Confidence Engine
 * ↓
 * Follow-up Engine
 * ↓
 * 信息不足？
 *
 * YES:
 *   先追问
 *   不把精准球线 / 磅数作为最终答案
 *
 * NO:
 *   返回完整 Recommendation
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
    runFollowUpEngine
} from "../engine/follow_up_engine.js";


/**
 * ============================================================
 * Configuration
 * ============================================================
 */

const APP_NAME =
    "EveryCourtAI";


const WORKER_VERSION =
    "2.2";


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
                        "1.0",

                    mode:
                        "rule_based"
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
                    "1.0",

                mode:
                    "rule_based"
            },

            follow_up_engine: {

                name:
                    "follow_up_engine",

                version:
                    "1.0"
            },

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
         * Resolve Input
         * ====================================================
         */

        let playerInput =
            null;


        let parserResult =
            null;


        let inputMode =
            null;


        /**
         * Structured Player Input
         */

        if (
            body?.player_input &&
            typeof body.player_input ===
                "object" &&
            !Array.isArray(
                body.player_input
            )
        ) {

            playerInput =
                body.player_input;


            inputMode =
                "player_input";
        }


        /**
         * Natural Language
         */

        else if (
            typeof body?.message ===
                "string" &&
            body.message.trim()
        ) {

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


            playerInput =
                parserResult
                    .player_input;


            inputMode =
                "message";
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
         * STEP 5
         * Validate Resolved Input
         * ====================================================
         */

        if (
            !playerInput ||
            typeof playerInput !==
                "object" ||
            Array.isArray(
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
         * STEP 6
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
         * STEP 7
         * Follow-up Engine
         * ====================================================
         */

        const followUpResult =
            runFollowUpEngine({

                parserResult,

                confidenceResult:
                    engineResult
                        ?.confidence,

                playerInput,

                maxQuestions:
                    2
            });


        /**
         * ====================================================
         * STEP 8
         * Follow-up Required
         * ====================================================
         */

        if (
            followUpResult
                ?.requires_follow_up ===
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

                player_input:
                    playerInput,

                follow_up:
                    followUpResult,

                /**
                 * 非最终推荐
                 *
                 * 不把具体产品与磅数作为正式 Recommendation 返回。
                 */

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
         * STEP 9
         * Full Recommendation Allowed
         * ====================================================
         */

        const answer =
            buildFinalAnswer(
                engineResult,
                language
            );


        const webRecommendation =
            buildWebRecommendation(
                engineResult
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
                "recommendation_ready",

            answer,

            parser:
                parserResult,

            player_input:
                playerInput,

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
 *
 * 当 Confidence 不足时：
 *
 * 可以告诉用户总体方向，
 * 但不把具体产品 / 精准磅数当成最终结果。
 *
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


    /**
     * 中文 / 繁体
     */

    if (
        normalizedLanguage === "zh" ||
        normalizedLanguage === "zh-cn" ||
        normalizedLanguage === "zh-tc" ||
        normalizedLanguage === "zh-tw"
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


    /**
     * English
     */

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
        normalizedLanguage === "zh" ||
        normalizedLanguage === "zh-cn"
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
        normalizedLanguage === "zh-tc" ||
        normalizedLanguage === "zh-tw"
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
            .toLowerCase();


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