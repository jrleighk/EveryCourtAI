/**
 * ============================================================
 * EveryCourtAI
 * API Client
 * Version: 1.0
 * ============================================================
 *
 * 文件路径：
 * scripts/api_client.js
 *
 * 作用：
 * 1. 负责 Web App 与 Cloudflare Worker 通讯
 * 2. 发送用户问题
 * 3. 发送当前语言
 * 4. 发送聊天历史
 * 5. 接收 EveryCourtAI Engine 结果
 * 6. 标准化 API Response
 * 7. 处理网络错误 / 超时 / JSON 错误
 * 8. 为未来 Streaming API 预留结构
 *
 * 当前阶段：
 * - API Client 架构完成
 * - Cloudflare API URL 可配置
 *
 * 下一阶段：
 * - 建立 / 更新 Cloudflare everycourt-api
 * - chat_manager.js 改为调用本文件
 *
 * ============================================================
 */


/**
 * ============================================================
 * 基础配置
 * ============================================================
 */

const API_CLIENT_VERSION =
    "1.0";


/**
 * ============================================================
 * Cloudflare API
 *
 * 下一阶段请把这里换成真正 Worker URL。
 *
 * 例如：
 *
 * https://everycourt-api.xxxxx.workers.dev
 *
 * 如果 Worker 使用 /ai：
 *
 * https://everycourt-api.xxxxx.workers.dev/ai
 *
 * ============================================================
 */

let API_ENDPOINT =
    "https://YOUR-EVERYCOURT-WORKER.workers.dev/ai";


/**
 * ============================================================
 * 请求配置
 * ============================================================
 */

const DEFAULT_TIMEOUT_MS =
    30000;

const MAX_HISTORY_MESSAGES =
    20;


/**
 * ============================================================
 * 内部状态
 * ============================================================
 */

let lastRequestId =
    null;


/**
 * ============================================================
 * 通用工具
 * ============================================================
 */

function safeString(
    value
) {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .trim();
}


function safeNumber(
    value
) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return null;
    }

    const number =
        Number(value);

    return Number.isFinite(number)
        ? number
        : null;
}


function createRequestId() {
    return (
        "eca_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .slice(2, 10)
    );
}


/**
 * ============================================================
 * API Endpoint
 * ============================================================
 */

export function setApiEndpoint(
    endpoint
) {
    const value =
        safeString(
            endpoint
        );


    if (!value) {
        return {
            success: false,
            error:
                "API endpoint cannot be empty."
        };
    }


    API_ENDPOINT =
        value;


    return {
        success: true,
        endpoint:
            API_ENDPOINT
    };
}


export function getApiEndpoint() {
    return API_ENDPOINT;
}


/**
 * ============================================================
 * 检查 API 是否已经配置
 * ============================================================
 */

export function isApiConfigured() {
    return (
        API_ENDPOINT &&
        !API_ENDPOINT.includes(
            "YOUR-EVERYCOURT-WORKER"
        )
    );
}


/**
 * ============================================================
 * History 标准化
 * ============================================================
 */

function normalizeHistory(
    history = []
) {
    if (
        !Array.isArray(
            history
        )
    ) {
        return [];
    }


    return history
        .slice(
            -MAX_HISTORY_MESSAGES
        )
        .map(
            message => {

                const role =
                    message?.role === "ai"
                        ? "assistant"
                        : message?.role === "assistant"
                            ? "assistant"
                            : "user";


                return {
                    role,

                    content:
                        safeString(
                            message?.content
                        )
                };
            }
        )
        .filter(
            message =>
                Boolean(
                    message.content
                )
        );
}


/**
 * ============================================================
 * Request Payload
 * ============================================================
 */

function buildRequestPayload({
    prompt,
    language = "en",
    history = [],
    metadata = {}
}) {
    const requestId =
        createRequestId();


    lastRequestId =
        requestId;


    return {
        request_id:
            requestId,

        client: {
            name:
                "EveryCourtAI Web App",

            version:
                API_CLIENT_VERSION
        },

        language:
            safeString(
                language
            ) || "en",

        prompt:
            safeString(
                prompt
            ),

        conversation:
            normalizeHistory(
                history
            ),

        metadata: {
            timestamp:
                new Date()
                    .toISOString(),

            page_url:
                window.location.href,

            user_agent:
                navigator.userAgent,

            ...metadata
        }
    };
}


/**
 * ============================================================
 * Timeout Fetch
 * ============================================================
 */

async function fetchWithTimeout(
    url,
    options = {},
    timeoutMs =
        DEFAULT_TIMEOUT_MS
) {
    const controller =
        new AbortController();


    const timeout =
        setTimeout(
            () => {

                controller.abort();

            },
            timeoutMs
        );


    try {

        return await fetch(
            url,
            {
                ...options,

                signal:
                    controller.signal
            }
        );

    } finally {

        clearTimeout(
            timeout
        );
    }
}


/**
 * ============================================================
 * Recommendation 标准化
 *
 * 这里兼容不同 Worker 返回格式。
 *
 * ============================================================
 */

function normalizeRecommendation(
    data
) {
    const recommendation =
        data?.recommendation ??
        data?.result?.recommendation ??
        null;


    if (!recommendation) {
        return null;
    }


    /**
     * ----------------------------------
     * 兼容 Main Engine 当前结构
     * ----------------------------------
     */

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


    const confidence =
        data?.confidence?.score ??
        data?.result?.confidence?.score ??
        recommendation?.confidence ??
        null;


    /**
     * ----------------------------------
     * 如果 API 已经直接返回前端格式
     * ----------------------------------
     */

    if (
        recommendation.racquet ||
        recommendation.string ||
        recommendation.tension_lbs
    ) {
        return {
            racquet:
                recommendation.racquet ??
                null,

            string:
                recommendation.string ??
                null,

            gauge_mm:
                safeNumber(
                    recommendation.gauge_mm
                ),

            setup_type:
                recommendation.setup_type ??
                null,

            tension_lbs:
                safeNumber(
                    recommendation.tension_lbs
                ),

            tension_range:
                recommendation.tension_range ??
                null,

            confidence:
                safeNumber(
                    recommendation.confidence ??
                    confidence
                ),

            why:
                recommendation.why ??
                [],

            alternatives:
                recommendation.alternatives ??
                []
        };
    }


    /**
     * ----------------------------------
     * EveryCourtAI Engine 原始格式
     * ----------------------------------
     */

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

        string:
            mainString
                ? `${mainString.brand ?? ""} ${mainString.model ?? ""}`
                    .trim()
                : null,

        gauge_mm:
            safeNumber(
                mainString?.gauge_mm
            ),

        setup_type:
            recommendation
                ?.string_setup
                ?.type ??
            null,

        tension_lbs:
            safeNumber(
                tension?.main_lbs
            ),

        tension_range:
            tensionRange,

        confidence:
            safeNumber(
                confidence
            ),

        why:
            recommendation
                ?.primary_reasons ??
            [],

        alternatives:
            recommendation
                ?.alternatives ??
            []
    };
}


/**
 * ============================================================
 * AI Answer 标准化
 * ============================================================
 */

function normalizeAnswer(
    data
) {
    const candidates = [
        data?.answer,
        data?.message,
        data?.response,
        data?.text,

        data
            ?.result
            ?.answer,

        data
            ?.result
            ?.message,

        data
            ?.explanation
            ?.summary
            ?.en,

        data
            ?.result
            ?.explanation
            ?.summary
            ?.en
    ];


    for (
        const candidate
        of candidates
    ) {
        const value =
            safeString(
                candidate
            );


        if (value) {
            return value;
        }
    }


    return "";
}


/**
 * ============================================================
 * API Response 标准化
 * ============================================================
 */

function normalizeApiResponse(
    data,
    httpStatus
) {
    const success =
        data?.success !== false &&
        httpStatus >= 200 &&
        httpStatus < 300;


    return {
        success,

        request_id:
            data?.request_id ??
            lastRequestId,

        answer:
            normalizeAnswer(
                data
            ),

        recommendation:
            normalizeRecommendation(
                data
            ),

        confidence:
            data?.confidence ??
            data?.result?.confidence ??
            null,

        explanation:
            data?.explanation ??
            data?.result?.explanation ??
            null,

        raw:
            data
    };
}


/**
 * ============================================================
 * Error 标准化
 * ============================================================
 */

function normalizeError(
    error
) {
    if (
        error?.name ===
        "AbortError"
    ) {
        return {
            type:
                "timeout",

            message:
                "EveryCourtAI API request timed out."
        };
    }


    return {
        type:
            "network",

        message:
            error instanceof Error
                ? error.message
                : String(error)
    };
}


/**
 * ============================================================
 * Main API Request
 * ============================================================
 */

export async function sendChatRequest({
    prompt,
    language = "en",
    history = [],
    metadata = {},
    timeoutMs =
        DEFAULT_TIMEOUT_MS
}) {
    const cleanPrompt =
        safeString(
            prompt
        );


    /**
     * ----------------------------------
     * Validate
     * ----------------------------------
     */

    if (!cleanPrompt) {
        return {
            success: false,

            error: {
                type:
                    "validation",

                message:
                    "Prompt cannot be empty."
            }
        };
    }


    /**
     * ----------------------------------
     * API 未配置
     * ----------------------------------
     */

    if (
        !isApiConfigured()
    ) {
        return {
            success: false,

            error: {
                type:
                    "configuration",

                message:
                    "EveryCourtAI API endpoint has not been configured yet."
            }
        };
    }


    const payload =
        buildRequestPayload({
            prompt:
                cleanPrompt,

            language,

            history,

            metadata
        });


    try {

        /**
         * ----------------------------------
         * Fetch
         * ----------------------------------
         */

        const response =
            await fetchWithTimeout(
                API_ENDPOINT,

                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json",

                        "X-EveryCourt-Client":
                            "web"
                    },

                    body:
                        JSON.stringify(
                            payload
                        )
                },

                timeoutMs
            );


        /**
         * ----------------------------------
         * Response Text
         * ----------------------------------
         */

        const responseText =
            await response.text();


        let data =
            {};


        if (
            responseText
        ) {
            try {

                data =
                    JSON.parse(
                        responseText
                    );

            } catch {

                return {
                    success: false,

                    request_id:
                        payload.request_id,

                    error: {
                        type:
                            "invalid_json",

                        message:
                            "EveryCourtAI API returned invalid JSON."
                    },

                    raw_text:
                        responseText
                };
            }
        }


        /**
         * ----------------------------------
         * HTTP Error
         * ----------------------------------
         */

        if (
            !response.ok
        ) {
            return {
                success: false,

                request_id:
                    payload.request_id,

                error: {
                    type:
                        "http",

                    status:
                        response.status,

                    message:
                        data?.error?.message ??
                        data?.message ??
                        `HTTP ${response.status}`
                },

                raw:
                    data
            };
        }


        /**
         * ----------------------------------
         * Success
         * ----------------------------------
         */

        return normalizeApiResponse(
            data,
            response.status
        );

    } catch (
        error
    ) {

        return {
            success: false,

            request_id:
                payload.request_id,

            error:
                normalizeError(
                    error
                )
        };
    }
}


/**
 * ============================================================
 * Health Check
 *
 * Cloudflare 后面可以做：
 *
 * GET /health
 *
 * ============================================================
 */

export async function checkApiHealth({
    endpoint = null,
    timeoutMs = 8000
} = {}) {
    const base =
        safeString(
            endpoint
        ) ||
        API_ENDPOINT;


    if (
        !base ||
        base.includes(
            "YOUR-EVERYCOURT-WORKER"
        )
    ) {
        return {
            success: false,

            status:
                "not_configured"
        };
    }


    /**
     * 如果 endpoint 是 /ai，
     * 自动尝试替换成 /health
     */

    const healthEndpoint =
        base.endsWith(
            "/ai"
        )
            ? base.slice(
                0,
                -3
            ) + "/health"
            : base.replace(
                /\/$/,
                ""
            ) + "/health";


    try {

        const response =
            await fetchWithTimeout(
                healthEndpoint,
                {
                    method:
                        "GET",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                },
                timeoutMs
            );


        const text =
            await response.text();


        let data =
            null;


        try {
            data =
                text
                    ? JSON.parse(
                        text
                    )
                    : null;
        } catch {
            data =
                text;
        }


        return {
            success:
                response.ok,

            status:
                response.status,

            endpoint:
                healthEndpoint,

            data
        };

    } catch (
        error
    ) {

        return {
            success: false,

            endpoint:
                healthEndpoint,

            error:
                normalizeError(
                    error
                )
        };
    }
}


/**
 * ============================================================
 * Debug Info
 * ============================================================
 */

export function getApiClientInfo() {
    return {
        version:
            API_CLIENT_VERSION,

        endpoint:
            API_ENDPOINT,

        configured:
            isApiConfigured(),

        timeout_ms:
            DEFAULT_TIMEOUT_MS,

        max_history_messages:
            MAX_HISTORY_MESSAGES,

        last_request_id:
            lastRequestId
    };
}


/**
 * ============================================================
 * Browser Debug API
 *
 * Console:
 *
 * EveryCourtAPI.getApiClientInfo()
 *
 * EveryCourtAPI.setApiEndpoint(
 *   "https://xxx.workers.dev/ai"
 * )
 *
 * ============================================================
 */

window.EveryCourtAPI = {
    sendChatRequest,
    checkApiHealth,
    setApiEndpoint,
    getApiEndpoint,
    isApiConfigured,
    getApiClientInfo
};
