/**
 * ============================================================
 * EveryCourtAI
 * Chat Manager
 * Version: 2.1
 * ============================================================
 *
 * 路径：
 * scripts/chat_manager.js
 *
 * 功能：
 * 1. 接收用户提问
 * 2. 调用 api_client.js
 * 3. POST 到 Cloudflare /ai
 * 4. 显示 AI 回答
 * 5. 动态更新右侧推荐卡
 * 6. 支持当前语言
 * 7. 保存聊天上下文
 *
 * ============================================================
 */

import {
    t,
    getCurrentLanguage
} from "./language_manager.js";

import {
    sendChatRequest
} from "./api_client.js";


/**
 * ============================================================
 * 状态
 * ============================================================
 */

let isProcessing = false;

let conversationHistory = [];


/**
 * ============================================================
 * DOM
 * ============================================================
 */

let messagesElement = null;
let promptInputElement = null;
let sendButtonElement = null;


/**
 * ============================================================
 * 工具
 * ============================================================
 */

function safeString(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value).trim();
}


function scrollToBottom() {

    if (!messagesElement) {
        return;
    }

    messagesElement.scrollTo({
        top: messagesElement.scrollHeight,
        behavior: "smooth"
    });
}


/**
 * ============================================================
 * Message
 * ============================================================
 */

function createMessageElement(
    role,
    text,
    {
        thinking = false
    } = {}
) {

    const wrapper =
        document.createElement("div");

    wrapper.className =
        `message ${role === "user" ? "user" : "ai"}`;


    const label =
        document.createElement("div");

    label.className =
        "message-label";

    label.textContent =
        role === "user"
            ? t("system.you", "You")
            : t(
                "system.assistant",
                "EveryCourtAI"
            );


    const bubble =
        document.createElement("div");

    bubble.className =
        "bubble";

    if (thinking) {

        bubble.classList.add(
            "thinking-bubble"
        );

    }

    bubble.textContent =
        text;


    wrapper.appendChild(label);

    wrapper.appendChild(bubble);


    return wrapper;
}


export function addMessage(
    role,
    text,
    {
        saveToHistory = true
    } = {}
) {

    const cleanText =
        safeString(text);

    if (
        !messagesElement ||
        !cleanText
    ) {
        return null;
    }


    const element =
        createMessageElement(
            role,
            cleanText
        );


    messagesElement.appendChild(
        element
    );


    if (saveToHistory) {

        conversationHistory.push({

            role:
                role === "ai"
                    ? "assistant"
                    : "user",

            content:
                cleanText
        });

    }


    scrollToBottom();


    return element;
}


/**
 * ============================================================
 * Thinking
 * ============================================================
 */

function showThinking() {

    if (!messagesElement) {
        return null;
    }


    const element =
        createMessageElement(
            "ai",
            t(
                "system.thinking",
                "Analyzing your equipment..."
            ),
            {
                thinking: true
            }
        );


    messagesElement.appendChild(
        element
    );


    scrollToBottom();


    return element;
}


function removeThinking(
    element
) {

    if (element) {
        element.remove();
    }
}


/**
 * ============================================================
 * Processing State
 * ============================================================
 */

function setProcessing(
    value
) {

    isProcessing =
        value;


    if (sendButtonElement) {

        sendButtonElement.disabled =
            value;

        sendButtonElement.style.opacity =
            value
                ? "0.6"
                : "1";

    }


    if (promptInputElement) {

        promptInputElement.disabled =
            value;

    }
}


/**
 * ============================================================
 * Textarea
 * ============================================================
 */

function resizeTextarea() {

    if (!promptInputElement) {
        return;
    }


    promptInputElement.style.height =
        "auto";


    promptInputElement.style.height =
        Math.min(
            promptInputElement.scrollHeight,
            160
        ) + "px";
}


/**
 * ============================================================
 * Recommendation Card
 * ============================================================
 */

export function updateRecommendationCard(
    recommendation
) {

    if (!recommendation) {
        return;
    }


    const racquetElement =
        document.getElementById(
            "recommendedRacquet"
        );

    const stringElement =
        document.getElementById(
            "recommendedString"
        );

    const stringSetupElement =
        document.getElementById(
            "recommendedStringSetup"
        );

    const tensionElement =
        document.getElementById(
            "recommendedTension"
        );

    const tensionRangeElement =
        document.getElementById(
            "recommendedTensionRange"
        );

    const confidenceValueElement =
        document.getElementById(
            "confidenceValue"
        );

    const confidenceFillElement =
        document.getElementById(
            "confidenceFill"
        );


    /**
     * Racquet
     */

    if (
        racquetElement &&
        recommendation.racquet
    ) {

        racquetElement.textContent =
            recommendation.racquet;

    }


    /**
     * String
     */

    if (
        stringElement &&
        recommendation.string
    ) {

        stringElement.textContent =
            recommendation.string;

    }


    /**
     * Gauge + Setup
     */

    if (stringSetupElement) {

        const parts = [];


        if (
            recommendation.gauge_mm !==
            null &&
            recommendation.gauge_mm !==
            undefined
        ) {

            parts.push(
                `${recommendation.gauge_mm} mm`
            );

        }


        if (
            recommendation.setup_type
        ) {

            parts.push(
                recommendation.setup_type
            );

        }


        if (
            parts.length > 0
        ) {

            stringSetupElement.textContent =
                parts.join(" · ");

        }
    }


    /**
     * Tension
     */

    if (
        tensionElement &&
        recommendation.tension_lbs !==
        null &&
        recommendation.tension_lbs !==
        undefined
    ) {

        tensionElement.textContent =
            `${recommendation.tension_lbs} lbs`;

    }


    /**
     * Tension Range
     */

    if (
        tensionRangeElement &&
        recommendation.tension_range
    ) {

        tensionRangeElement.textContent =
            recommendation.tension_range;

    }


    /**
     * Confidence
     */

    if (
        recommendation.confidence !==
        null &&
        recommendation.confidence !==
        undefined
    ) {

        const confidence =
            Math.max(
                0,
                Math.min(
                    100,
                    Number(
                        recommendation.confidence
                    )
                )
            );


        if (
            confidenceValueElement
        ) {

            confidenceValueElement.textContent =
                `${confidence}%`;

        }


        if (
            confidenceFillElement
        ) {

            confidenceFillElement.style.width =
                `${confidence}%`;

        }
    }
}


/**
 * ============================================================
 * Submit
 * ============================================================
 */

export async function submitCurrentPrompt() {

    if (
        isProcessing ||
        !promptInputElement
    ) {
        return;
    }


    const prompt =
        safeString(
            promptInputElement.value
        );


    if (!prompt) {
        return;
    }


    /**
     * 1. User Message
     */

    addMessage(
        "user",
        prompt
    );


    promptInputElement.value =
        "";

    resizeTextarea();


    /**
     * 2. Processing
     */

    setProcessing(true);


    /**
     * 3. Thinking
     */

    const thinkingElement =
        showThinking();


    try {

        /**
         * 4. Cloudflare API
         */

        const result =
            await sendChatRequest({

                prompt,

                language:
                    getCurrentLanguage(),

                history:
                    conversationHistory
            });


        /**
         * 5. Remove Thinking
         */

        removeThinking(
            thinkingElement
        );


        /**
         * 6. Error
         */

        if (
            !result ||
            result.success !== true
        ) {

            console.error(
                "EveryCourtAI API Error:",
                result
            );


            addMessage(
                "ai",
                t(
                    "system.error",
                    "Something went wrong."
                )
            );


            return;
        }


        /**
         * 7. AI Answer
         */

        if (
            result.answer
        ) {

            addMessage(
                "ai",
                result.answer
            );

        }


        /**
         * 8. Recommendation
         */

        if (
            result.recommendation
        ) {

            updateRecommendationCard(
                result.recommendation
            );

        }


    } catch (error) {

        removeThinking(
            thinkingElement
        );


        console.error(
            "EveryCourtAI Chat Error:",
            error
        );


        addMessage(
            "ai",
            t(
                "system.error",
                "Something went wrong."
            )
        );

    } finally {

        setProcessing(false);


        if (
            promptInputElement
        ) {

            promptInputElement.focus();

        }
    }
}


/**
 * ============================================================
 * Starter Prompts
 * ============================================================
 */

function bindStarterPrompts() {

    document
        .querySelectorAll(
            "[data-prompt-key]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        if (
                            !promptInputElement
                        ) {
                            return;
                        }


                        promptInputElement.value =
                            button.textContent.trim();


                        resizeTextarea();


                        promptInputElement.focus();
                    }
                );
            }
        );
}


/**
 * ============================================================
 * Events
 * ============================================================
 */

function bindEvents() {

    if (
        sendButtonElement
    ) {

        sendButtonElement.addEventListener(
            "click",
            submitCurrentPrompt
        );

    }


    if (
        promptInputElement
    ) {

        promptInputElement.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter" &&
                    !event.shiftKey
                ) {

                    event.preventDefault();

                    submitCurrentPrompt();

                }
            }
        );


        promptInputElement.addEventListener(
            "input",
            resizeTextarea
        );

    }


    bindStarterPrompts();
}


/**
 * ============================================================
 * 初始化
 * ============================================================
 */

export function initializeChatManager() {

    messagesElement =
        document.getElementById(
            "messages"
        );

    promptInputElement =
        document.getElementById(
            "promptInput"
        );

    sendButtonElement =
        document.getElementById(
            "sendButton"
        );


    if (
        !messagesElement ||
        !promptInputElement ||
        !sendButtonElement
    ) {

        console.error(
            "EveryCourtAI Chat Manager: required DOM elements missing."
        );


        return {
            success: false
        };
    }


    bindEvents();

    resizeTextarea();


    console.log(
        "EveryCourtAI Chat Manager connected."
    );


    return {
        success: true,
        version: "2.1"
    };
}


/**
 * ============================================================
 * 自动启动
 * ============================================================
 */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeChatManager
    );

} else {

    initializeChatManager();

}


/**
 * ============================================================
 * Debug
 * ============================================================
 */

window.EveryCourtChat = {

    submitCurrentPrompt,

    addMessage,

    updateRecommendationCard,

    getConversationHistory() {

        return [
            ...conversationHistory
        ];
    },

    clearConversationHistory() {

        conversationHistory = [];

    }
};
