/**
 * ============================================================
 * EveryCourtAI
 * Chat Manager
 * Version: 1.0
 * ============================================================
 *
 * 文件路径：
 * scripts/chat_manager.js
 *
 * 作用：
 * 1. 管理用户输入
 * 2. 管理聊天消息
 * 3. 管理 AI Thinking 状态
 * 4. 管理 Starter Prompts
 * 5. 管理消息自动滚动
 * 6. 与 Language Manager 联动
 * 7. 为 API Client 预留调用接口
 * 8. 为 Recommendation Card 预留更新接口
 *
 * 当前阶段：
 * - UI Chat Logic
 * - Mock AI Response
 *
 * 下一阶段：
 * - 接 scripts/api_client.js
 * - 接 Cloudflare Worker
 * - 接 EveryCourtAI Engine
 *
 * ============================================================
 */


import {
    t,
    getCurrentLanguage
} from "./language_manager.js";


/**
 * ============================================================
 * 基础配置
 * ============================================================
 */

const CHAT_VERSION =
    "1.0";

const MAX_MESSAGE_LENGTH =
    4000;

const MOCK_RESPONSE_DELAY =
    650;


/**
 * ============================================================
 * 内部状态
 * ============================================================
 */

let isProcessing =
    false;

let conversationHistory =
    [];


/**
 * ============================================================
 * DOM Elements
 * ============================================================
 */

let messagesElement =
    null;

let promptInputElement =
    null;

let sendButtonElement =
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


function createId(
    prefix = "message"
) {
    return (
        `${prefix}_` +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .slice(2, 8)
    );
}


function sleep(
    milliseconds
) {
    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                milliseconds
            )
    );
}


/**
 * ============================================================
 * 滚动到底部
 * ============================================================
 */

function scrollMessagesToBottom(
    smooth = true
) {
    if (
        !messagesElement
    ) {
        return;
    }

    messagesElement.scrollTo({
        top:
            messagesElement.scrollHeight,

        behavior:
            smooth
                ? "smooth"
                : "auto"
    });
}


/**
 * ============================================================
 * 消息历史
 * ============================================================
 */

function addToConversationHistory(
    message
) {
    conversationHistory.push(
        message
    );
}


export function getConversationHistory() {
    return [
        ...conversationHistory
    ];
}


export function clearConversationHistory() {
    conversationHistory =
        [];
}


/**
 * ============================================================
 * 创建 Message DOM
 * ============================================================
 */

function createMessageElement({
    role,
    text,
    messageId = null,
    isThinking = false
}) {
    const wrapper =
        document.createElement(
            "div"
        );

    wrapper.className =
        `message ${role}`;

    wrapper.dataset.messageId =
        messageId ??
        createId();


    /**
     * Label
     */

    const label =
        document.createElement(
            "div"
        );

    label.className =
        "message-label";

    label.textContent =
        role === "user"
            ? t(
                "system.you",
                "You"
            )
            : t(
                "system.assistant",
                "EveryCourtAI"
            );


    /**
     * Bubble
     */

    const bubble =
        document.createElement(
            "div"
        );

    bubble.className =
        "bubble";


    if (
        isThinking
    ) {
        bubble.classList.add(
            "thinking-bubble"
        );
    }


    bubble.textContent =
        text;


    wrapper.appendChild(
        label
    );

    wrapper.appendChild(
        bubble
    );


    return wrapper;
}


/**
 * ============================================================
 * 添加消息
 * ============================================================
 */

export function addMessage(
    role,
    text,
    {
        saveToHistory = true,
        smoothScroll = true
    } = {}
) {
    if (
        !messagesElement
    ) {
        return null;
    }


    const safeText =
        safeString(
            text
        );


    if (
        !safeText
    ) {
        return null;
    }


    const messageId =
        createId(
            role
        );


    const messageElement =
        createMessageElement({
            role,
            text:
                safeText,
            messageId
        });


    messagesElement.appendChild(
        messageElement
    );


    if (
        saveToHistory
    ) {
        addToConversationHistory({
            id:
                messageId,

            role,

            content:
                safeText,

            language:
                getCurrentLanguage(),

            created_at:
                new Date()
                    .toISOString()
        });
    }


    scrollMessagesToBottom(
        smoothScroll
    );


    return messageElement;
}


/**
 * ============================================================
 * Thinking Message
 * ============================================================
 */

function addThinkingMessage() {
    if (
        !messagesElement
    ) {
        return null;
    }


    const messageId =
        createId(
            "thinking"
        );


    const text =
        t(
            "system.thinking",
            "Analyzing your equipment..."
        );


    const element =
        createMessageElement({
            role:
                "ai",

            text,

            messageId,

            isThinking:
                true
        });


    messagesElement.appendChild(
        element
    );


    scrollMessagesToBottom(
        true
    );


    return element;
}


function removeThinkingMessage(
    element
) {
    if (
        !element
    ) {
        return;
    }


    element.remove();
}


/**
 * ============================================================
 * 输入框状态
 * ============================================================
 */

function setProcessingState(
    processing
) {
    isProcessing =
        processing;


    if (
        sendButtonElement
    ) {
        sendButtonElement.disabled =
            processing;

        sendButtonElement.style.opacity =
            processing
                ? "0.6"
                : "1";

        sendButtonElement.style.cursor =
            processing
                ? "default"
                : "pointer";
    }


    if (
        promptInputElement
    ) {
        promptInputElement.disabled =
            processing;
    }
}


/**
 * ============================================================
 * Textarea 自动高度
 * ============================================================
 */

function resizeTextarea() {
    if (
        !promptInputElement
    ) {
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
 * 获取输入
 * ============================================================
 */

function getPromptValue() {
    if (
        !promptInputElement
    ) {
        return "";
    }


    return safeString(
        promptInputElement.value
    );
}


/**
 * ============================================================
 * 清空输入
 * ============================================================
 */

function clearPromptInput() {
    if (
        !promptInputElement
    ) {
        return;
    }


    promptInputElement.value =
        "";

    resizeTextarea();
}


/**
 * ============================================================
 * 输入验证
 * ============================================================
 */

function validatePrompt(
    prompt
) {
    if (
        !prompt
    ) {
        return {
            valid: false,
            reason:
                "empty"
        };
    }


    if (
        prompt.length >
        MAX_MESSAGE_LENGTH
    ) {
        return {
            valid: false,
            reason:
                "too_long"
        };
    }


    return {
        valid: true,
        reason: null
    };
}


/**
 * ============================================================
 * Mock AI Response
 *
 * 当前只是测试 Chat Manager。
 * 下一步接 api_client.js 后会删除/替换此逻辑。
 * ============================================================
 */

function buildMockResponse(
    prompt
) {
    const language =
        getCurrentLanguage();


    if (
        language === "zh"
    ) {
        return (
            "我已经收到你的装备信息。下一阶段这里会连接 EveryCourtAI Engine，" +
            "系统会分析你的球拍、球线、打法、身体状况与目标，然后生成球拍、球线、磅数、备选方案和信心值。"
        );
    }


    if (
        language === "zh-tc"
    ) {
        return (
            "我已經收到你的裝備資訊。下一階段這裡會連接 EveryCourtAI Engine，" +
            "系統會分析你的球拍、球線、打法、身體狀況與目標，並產生球拍、球線、磅數、備選方案與信心值。"
        );
    }


    if (
        language === "ja"
    ) {
        return (
            "現在のセッティング情報を受け取りました。次の段階では EveryCourtAI Engine と接続し、" +
            "ラケット、ストリング、プレースタイル、身体的条件、目標を分析して最適なセッティングを提案します。"
        );
    }


    if (
        language === "fr"
    ) {
        return (
            "J’ai bien reçu les informations sur votre équipement. À l’étape suivante, " +
            "EveryCourtAI analysera votre raquette, votre cordage, votre style de jeu, vos contraintes physiques et vos objectifs."
        );
    }


    if (
        language === "es"
    ) {
        return (
            "He recibido la información sobre tu equipamiento. En la siguiente fase, EveryCourtAI analizará " +
            "tu raqueta, cordaje, estilo de juego, condición física y objetivos para generar una recomendación completa."
        );
    }


    return (
        "I’ve received your setup information. In the next integration step, EveryCourtAI will analyze " +
        "your racquet, strings, playing style, physical constraints and goals to generate a complete recommendation."
    );
}


/**
 * ============================================================
 * Recommendation Placeholder Update
 *
 * 当前只是 Demo。
 * 后面 API 返回真实 Engine Result 后，
 * 会通过 updateRecommendationCard() 更新。
 * ============================================================
 */

export function updateRecommendationCard(
    recommendation = {}
) {
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

    if (
        stringSetupElement
    ) {
        const parts = [];


        if (
            recommendation.gauge_mm
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
                parts.join(
                    " · "
                );
        }
    }


    /**
     * Tension
     */

    if (
        tensionElement &&
        recommendation.tension_lbs !==
            undefined &&
        recommendation.tension_lbs !==
            null
    ) {
        tensionElement.textContent =
            `${recommendation.tension_lbs} lbs`;
    }


    /**
     * Range
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
        confidenceValueElement &&
        recommendation.confidence !==
            undefined &&
        recommendation.confidence !==
            null
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


        confidenceValueElement.textContent =
            `${confidence}%`;


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
 * API Placeholder
 *
 * 下一阶段 api_client.js 会替换这个函数。
 * ============================================================
 */

async function requestAIResponse(
    prompt
) {
    await sleep(
        MOCK_RESPONSE_DELAY
    );


    return {
        success: true,

        answer:
            buildMockResponse(
                prompt
            ),

        recommendation: null
    };
}


/**
 * ============================================================
 * 主发送流程
 * ============================================================
 */

export async function submitCurrentPrompt() {
    if (
        isProcessing
    ) {
        return;
    }


    const prompt =
        getPromptValue();


    const validation =
        validatePrompt(
            prompt
        );


    if (
        !validation.valid
    ) {
        return;
    }


    /**
     * STEP 1
     * 用户消息
     */

    addMessage(
        "user",
        prompt
    );


    clearPromptInput();


    /**
     * STEP 2
     * 锁定 UI
     */

    setProcessingState(
        true
    );


    /**
     * STEP 3
     * Thinking
     */

    const thinkingElement =
        addThinkingMessage();


    try {

        /**
         * STEP 4
         * API / Mock
         */

        const response =
            await requestAIResponse(
                prompt
            );


        /**
         * STEP 5
         * 删除 Thinking
         */

        removeThinkingMessage(
            thinkingElement
        );


        /**
         * STEP 6
         * AI Answer
         */

        if (
            response?.success &&
            response?.answer
        ) {
            addMessage(
                "ai",
                response.answer
            );
        } else {
            addMessage(
                "ai",
                t(
                    "system.error",
                    "Something went wrong."
                )
            );
        }


        /**
         * STEP 7
         * Recommendation Card
         */

        if (
            response?.recommendation
        ) {
            updateRecommendationCard(
                response.recommendation
            );
        }


    } catch (
        error
    ) {

        removeThinkingMessage(
            thinkingElement
        );


        console.error(
            "EveryCourtAI Chat Manager:",
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

        /**
         * STEP 8
         * 解锁 UI
         */

        setProcessingState(
            false
        );


        if (
            promptInputElement
        ) {
            promptInputElement.focus();
        }
    }
}


/**
 * ============================================================
 * Starter Prompt
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
                            button.textContent
                                .trim();


                        resizeTextarea();


                        promptInputElement.focus();
                    }
                );
            }
        );
}


/**
 * ============================================================
 * Send Button
 * ============================================================
 */

function bindSendButton() {
    if (
        !sendButtonElement
    ) {
        return;
    }


    sendButtonElement.addEventListener(
        "click",
        () => {

            submitCurrentPrompt();

        }
    );
}


/**
 * ============================================================
 * Keyboard
 * ============================================================
 */

function bindKeyboard() {
    if (
        !promptInputElement
    ) {
        return;
    }


    promptInputElement.addEventListener(
        "keydown",
        event => {

            /**
             * Enter = Send
             * Shift + Enter = New Line
             */

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


/**
 * ============================================================
 * Language Change
 *
 * 这里只更新未来新消息使用的语言。
 * 已存在的用户动态消息不自动翻译。
 * ============================================================
 */

function bindLanguageChange() {
    window.addEventListener(
        "everycourt:language-change",
        () => {

            /**
             * 以后这里可以增加：
             * - Translate conversation
             * - Refresh AI greeting
             * - Re-render dynamic cards
             */

            console.log(
                "Chat Manager language changed:",
                getCurrentLanguage()
            );
        }
    );
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
        console.warn(
            "EveryCourtAI Chat Manager: required DOM elements not found."
        );

        return {
            success: false
        };
    }


    bindSendButton();

    bindKeyboard();

    bindStarterPrompts();

    bindLanguageChange();

    resizeTextarea();


    return {
        success: true,

        version:
            CHAT_VERSION
    };
}


/**
 * ============================================================
 * 自动初始化
 * ============================================================
 */

if (
    document.readyState ===
    "loading"
) {
    document.addEventListener(
        "DOMContentLoaded",
        () => {

            initializeChatManager();

        }
    );

} else {

    initializeChatManager();

}


/**
 * ============================================================
 * Browser Debug API
 * ============================================================
 *
 * Console:
 *
 * EveryCourtChat.addMessage(...)
 * EveryCourtChat.getConversationHistory()
 * EveryCourtChat.updateRecommendationCard(...)
 *
 * ============================================================
 */

window.EveryCourtChat = {
    addMessage,
    submitCurrentPrompt,
    updateRecommendationCard,
    getConversationHistory,
    clearConversationHistory
};
