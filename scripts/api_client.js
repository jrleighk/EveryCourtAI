/**
 * ============================================================
 * EveryCourtAI
 * API Client
 * Version: 1.1
 * ============================================================
 *
 * 文件路径：
 * scripts/api_client.js
 *
 * V1.1：
 *
 * 1. 对接 Cloudflare Worker V2.3.1
 * 2. prompt → message
 * 3. 支持 conversation_state
 * 4. 支持多轮 Conversation ID / Turn
 * 5. 保留聊天 history 作为前端 metadata
 * 6. 标准化 Follow-up / Recommendation Response
 *
 * ============================================================
 */


/**
 * ============================================================
 * Configuration
 * ============================================================
 */

const API_CLIENT_VERSION =
    "1.1";


let API_ENDPOINT =
    "https://everycourt-api.jrleighk.workers.dev/ai";


const DEFAULT_TIMEOUT_MS =
    30000;


const MAX_HISTORY_MESSAGES =
    20;


/**
 * ============================================================
 * Internal State
 * ============================================================
 */

let lastRequestId =
    null;


/**
 * ============================================================
 * Utilities
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


    return String(
        value
    ).trim();
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
        Number(
            value
        );


    return Number.isFinite(
        number
    )
        ? number
        : null;
}


function isPlainObject(
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


function createRequestId() {

    return (
        "eca_web_" +
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


    if (
        !value
    ) {

        return {

            success:
                false,

            error:
                "API endpoint cannot be empty."
        };
    }


    API_ENDPOINT =
        value;


    return {

        success:
            true,

        endpoint:
            API_ENDPOINT
    };
}


export function getApiEndpoint() {

    return API_ENDPOINT;
}


export function isApiConfigured() {

    return (
        Boolean(
            API_ENDPOINT
        ) &&
        !API_ENDPOINT.includes(
            "YOUR-EVERYCOURT-WORKER"
        )
    );
}


/**
 * ============================================================
 * History
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
                    message?.role ===
                        "assistant" ||
                    message?.role ===
                        "ai"
                        ? "assistant"
                        : "user";


                return {

                    role,

                    content:
                        safeString(
                            message
                                ?.content
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
 * Conversation State
 * ============================================================
 */

function normalizeConversationState(
    conversationState
) {

    if (
        !isPlainObject(
            conversationState
        )
    ) {

        return null;
    }


    /**
     * 不在前端重新解释 State。
     *
     * Worker 返回什么，
     * 下一轮就原样带回。
     */

    return conversationState;
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

    conversationState = null,

    metadata = {}

}) {

    const requestId =
        createRequestId();


    lastRequestId =
        requestId;


    const payload = {

        request_id:
            requestId,

        client: {

            name:
                "EveryCourtAI Web App",

            version:
                API_CLIENT_VERSION
        },


        /**
         * Worker V2.3.1 使用 message，
         * 不再使用 prompt。
         */

        message:
            safeString(
                prompt
            ),


        language:
            safeString(
                language
            ) ||
            "en",


        /**
         * 多轮对话关键字段。
         */

        conversation_state:
            normalizeConversationState(
                conversationState
            ),


        /**
         * History 暂时作为 metadata。
         *
         * Worker 当前主要依赖 conversation_state，
         * 而不是 history。
         */

        metadata: {

            timestamp:
                new Date()
                    .toISOString(),

            page_url:
                typeof window !==
                    "undefined"
                    ? window.location.href
                    : null,

            user_agent:
                typeof navigator !==
                    "undefined"
                    ? navigator.userAgent
                    : null,

            conversation_history:
                normalizeHistory(
                    history
                ),

            ...metadata
        }
    };


    /**
     * 第一轮没有 conversation_state 时，
     * 直接删除字段。
     */

    if (
        !payload.conversation_state
    ) {

        delete payload
            .conversation_state;
    }


    return payload;
}


/**
 * ============================================================
 * Fetch with Timeout
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
 * Recommendation Normalization
 * ============================================================
 */

function normalizeRecommendation(
    data
) {

    const recommendation =
        data?.recommendation ??
        data?.result?.recommendation ??
        null;


    /**
     * Follow-up 阶段 recommendation === null。
     */

    if (
        !recommendation
    ) {

        return null;
    }


    /**
     * Worker V2.3.1 已经直接返回 Web 格式。
     */

    if (
        recommendation.racquet ||
        recommendation.string ||
        recommendation.tension_lbs !==
            undefined
    ) {

        return {

            racquet:
                recommendation.racquet ??
                null,

            racquet_id:
                recommendation.racquet_id ??
                null,

            racquet_action:
                recommendation.racquet_action ??
                null,

            string_action:
                recommendation.string_action ??
                null,

            tension_action:
                recommendation.tension_action ??
                null,

            change_strategy:
                recommendation.change_strategy ??
                null,

            change_principle:
                recommendation.change_principle ??
                null,

            recommended_change_count:
                safeNumber(
                    recommendation
                        .recommended_change_count
                ),

            tension_delta_lbs:
                safeNumber(
                    recommendation
                        .tension_delta_lbs
                ),

            string:
                recommendation.string ??
                null,

            string_id:
                recommendation.string_id ??
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
                    recommendation.confidence
                ),

            confidence_level:
                recommendation.confidence_level ??
                null,

            setup_score:
                safeNumber(
                    recommendation.setup_score
                ),

            why:
                Array.isArray(
                    recommendation.why
                )
                    ? recommendation.why
                    : [],

            tradeoffs:
                Array.isArray(
                    recommendation.tradeoffs
                )
                    ? recommendation.tradeoffs
                    : [],

            alternatives:
                Array.isArray(
                    recommendation.alternatives
                )
                    ? recommendation.alternatives
                    : []
        };
    }


    /**
     * ========================================================
     * Legacy Engine Format Compatibility
     * ========================================================
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
        data
            ?.confidence
            ?.score ??
        data
            ?.engine_result
            ?.confidence
            ?.score ??
        null;


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
            racquet?.id ??
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
            mainString?.id ??
            null,

        gauge_mm:
            safeNumber(
                mainString
                    ?.gauge_mm
            ),

        setup_type:
            recommendation
                ?.string_setup
                ?.type ??
            null,

        tension_lbs:
            safeNumber(
                tension
                    ?.main_lbs
            ),

        tension_range:
            tensionRange,

        confidence:
            safeNumber(
                confidence
            ),

        confidence_level:
            data
                ?.confidence
                ?.level ??
            data
                ?.engine_result
                ?.confidence
                ?.level ??
            null,

        setup_score:
            safeNumber(
                recommendation
                    ?.setup_score
            ),

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
 * Answer Normalization
 * ============================================================
 */

function normalizeAnswer(
    data
) {

    const candidates = [

        data?.answer,

        data
            ?.result
            ?.answer,

        data
            ?.explanation
            ?.summary
            ?.en,

        data
            ?.engine_result
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


        if (
            value
        ) {

            return value;
        }
    }


    return "";
}


/**
 * ============================================================
 * API Response Normalization
 * ============================================================
 */

function normalizeApiResponse(
    data,
    httpStatus
) {

    const success =
        data?.success !==
            false &&
        httpStatus >=
            200 &&
        httpStatus <
            300;


    return {

        success,

        request_id:
            data?.request_id ??
            lastRequestId,


        /**
         * Worker Conversation Status
         */

        status:
            data?.status ??
            null,

        conversation_id:
            data?.conversation_id ??
            data
                ?.conversation_state
                ?.conversation_id ??
            null,

        turn:
            safeNumber(
                data?.turn ??
                data
                    ?.conversation_state
                    ?.turn
            ),


        /**
         * 关键：
         * 将 State 暴露给 chat_manager.js。
         */

        conversation_state:
            isPlainObject(
                data
                    ?.conversation_state
            )
                ? data.conversation_state
                : null,


        missing_fields:
            Array.isArray(
                data
                    ?.missing_fields
            )
                ? data.missing_fields
                : [],


        pending_fields:
            Array.isArray(
                data
                    ?.conversation_state
                    ?.pending_fields
            )
                ? data
                    .conversation_state
                    .pending_fields
                : [],


        answer:
            normalizeAnswer(
                data
            ),

        recommendation:
            normalizeRecommendation(
                data
            ),

        recommendation_preview:
            data
                ?.recommendation_preview ??
            null,

        follow_up:
            data
                ?.follow_up ??
            null,

        confidence:
            data
                ?.engine_result
                ?.confidence ??
            data
                ?.confidence ??
            null,

        explanation:
            data
                ?.engine_result
                ?.explanation ??
            data
                ?.explanation ??
            null,

        player_input:
            data
                ?.player_input ??
            null,

        raw:
            data
    };
}


/**
 * ============================================================
 * Error Normalization
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
            error instanceof
                Error
                ? error.message
                : String(
                    error
                )
    };
}


/**
 * ============================================================
 * Main Chat Request
 * ============================================================
 */

export async function sendChatRequest({

    prompt,

    language = "en",

    history = [],

    conversationState = null,

    metadata = {},

    timeoutMs =
        DEFAULT_TIMEOUT_MS

}) {

    const cleanPrompt =
        safeString(
            prompt
        );


    /**
     * Validate
     */

    if (
        !cleanPrompt
    ) {

        return {

            success:
                false,

            error: {

                type:
                    "validation",

                message:
                    "Prompt cannot be empty."
            }
        };
    }


    /**
     * API Configuration
     */

    if (
        !isApiConfigured()
    ) {

        return {

            success:
                false,

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

            conversationState,

            metadata
        });


    try {

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

                    success:
                        false,

                    request_id:
                        payload
                            .request_id,

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
         * HTTP Error
         */

        if (
            !response.ok
        ) {

            return {

                success:
                    false,

                request_id:
                    payload
                        .request_id,

                error: {

                    type:
                        "http",

                    status:
                        response.status,

                    message:
                        data
                            ?.error
                            ?.message ??
                        data
                            ?.message ??
                        `HTTP ${response.status}`
                },

                raw:
                    data
            };
        }


        return normalizeApiResponse(
            data,
            response.status
        );


    } catch (
        error
    ) {

        return {

            success:
                false,

            request_id:
                payload
                    .request_id,

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

            success:
                false,

            status:
                "not_configured"
        };
    }


    const healthEndpoint =
        base.endsWith(
            "/ai"
        )
            ? base.slice(
                0,
                -3
            ) +
                "/health"
            : base.replace(
                /\/$/,
                ""
            ) +
                "/health";


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

            success:
                false,

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
            lastRequestId,

        multi_turn:
            true,

        worker_contract:
            "2.3.1"
    };
}


/**
 * ============================================================
 * Browser Debug API
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