/**
 * ============================================================
 * EveryCourtAI
 * Cloudflare Worker
 * Version: 2.0
 * ============================================================
 *
 * 文件路径：
 * cloudflare/worker.js
 *
 * 作用：
 *
 * 1. 提供 EveryCourtAI Cloudflare API
 * 2. 切换 Knowledge Runtime 为 Cloudflare
 * 3. 调用真正的 EveryCourtAI Recommendation Engine
 * 4. 返回 Recommendation / Confidence / Explanation
 *
 * 当前版本：
 *
 * POST /ai
 *   接收结构化 player_input
 *   ↓
 *   Cloudflare Knowledge Loader
 *   ↓
 *   EveryCourtAI Engine
 *   ↓
 *   Recommendation
 *
 * GET /health
 *   API / Engine 健康检查
 *
 * GET /
 *   API 基础状态
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


/**
 * ============================================================
 * Worker Configuration
 * ============================================================
 */

const APP_NAME =
    "EveryCourtAI";


const WORKER_VERSION =
    "2.0";


/**
 * ============================================================
 * Cloudflare Worker
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
         * ====================================================
         * CORS
         * ====================================================
         */

        if (
            request.method === "OPTIONS"
        ) {
            return handleOptions();
        }


        /**
         * ====================================================
         * GET /
         * ====================================================
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

                engine:
                    getEngineInfo(),

                runtime:
                    getKnowledgeRuntime(),

                endpoints: {
                    health:
                        "/health",

                    ai:
                        "/ai"
                },

                timestamp:
                    createTimestamp()
            });
        }


        /**
         * ====================================================
         * GET /health
         * ====================================================
         */

        if (
            request.method === "GET" &&
            url.pathname === "/health"
        ) {

            return handleHealth();
        }


        /**
         * ====================================================
         * POST /ai
         * ====================================================
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
         * ====================================================
         * 404
         * ====================================================
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
         * Cloudflare Knowledge Runtime
         * ====================================================
         */

        setKnowledgeRuntime(
            "cloudflare"
        );


        /**
         * ====================================================
         * STEP 2
         * Parse JSON Body
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
         * Read Player Input
         * ====================================================
         *
         * 当前正式 Engine 使用结构化 player_input。
         *
         * Example:
         *
         * {
         *   "player_input": {
         *     "current_racquet": {
         *       "id": "wilson_rf_01_pro"
         *     },
         *     "primary_goal": "more_comfort",
         *     "playing_style": "all_court",
         *     "swing_speed": "medium"
         *   }
         * }
         *
         * ====================================================
         */

        const playerInput =
            body?.player_input;


        if (
            !playerInput ||
            typeof playerInput !== "object" ||
            Array.isArray(playerInput)
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
                            "player_input must be a valid object."
                    }
                },
                400
            );
        }


        /**
         * ====================================================
         * STEP 4
         * Run EveryCourtAI
         * ====================================================
         */

        const engineResult =
            await runQuickRecommendation(
                playerInput
            );


        /**
         * ====================================================
         * STEP 5
         * Engine Failure
         * ====================================================
         */

        if (
            !engineResult ||
            engineResult.success !== true
        ) {

            return jsonResponse(
                {
                    success:
                        false,

                    request_id:
                        requestId,

                    runtime:
                        getKnowledgeRuntime(),

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
                            "EveryCourtAI Engine failed to generate a recommendation."
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
         * STEP 6
         * Successful Response
         * ====================================================
         */

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

            engine:
                engineResult.engine,

            recommendation:
                engineResult.recommendation,

            confidence:
                engineResult.confidence,

            explanation:
                engineResult.explanation,

            processing_time_ms:
                Date.now() -
                startedAt,

            timestamp:
                createTimestamp()
        });


    } catch (
        error
    ) {

        /**
         * ====================================================
         * Unexpected Error
         * ====================================================
         */

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
 * CORS OPTIONS
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