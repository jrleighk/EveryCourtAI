/**
 * ============================================================
 * EveryCourtAI
 * Chat Manager
 * Version: 2.2
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
 * 8. 保存 Conversation State
 * 9. 自动支持多轮对话
 *
 * V2.2 核心：
 *
 * Turn 1
 * ↓
 * Worker 返回 conversation_state
 * ↓
 * 浏览器保存
 *
 * Turn 2
 * ↓
 * 自动带回 conversation_state
 * ↓
 * Worker 继续同一个 conversation
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
 * State
 * ============================================================
 */

let isProcessing =
    false;


let conversationHistory =
    [];


/**
 * Worker Conversation State
 *
 * 这是多轮对话真正的状态。
 */

let conversationState =
    null;


/**
 * 当前 Conversation Metadata
 */

let conversationId =
    null;


let conversationTurn =
    0;


/**
 * ============================================================
 * DOM
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


function scrollToBottom() {

    if (
        !messagesElement
    ) {

        return;
    }


    messagesElement.scrollTo({

        top:
            messagesElement
                .scrollHeight,

        behavior:
            "smooth"
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
        document.createElement(
            "div"
        );


    wrapper.className =
        `message ${
            role === "user"
                ? "user"
                : "ai"
        }`;


    const label =
        document.createElement(
            "div"
        );


    label.className =
        "message-label";


    label.textContent =
        role ===
            "user"
            ? t(
                "system.you",
                "You"
            )
            : t(
                "system.assistant",
                "EveryCourtAI"
            );


    const bubble =
        document.createElement(
            "div"
        );


    bubble.className =
        "bubble";


    if (
        thinking
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


export function addMessage(

    role,

    text,

    {
        saveToHistory =
            true
    } = {}

) {

    const cleanText =
        safeString(
            text
        );


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


    messagesElement
        .appendChild(
            element
        );


    if (
        saveToHistory
    ) {

        conversationHistory.push({

            role:
                role ===
                    "ai"
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
 * Comparison View Renderer V1
 * ============================================================
 *
 * Source:
 *
 * result.comparison_view
 *
 * This renderer does NOT interpret comparison data.
 * It only renders the frontend-oriented comparison contract
 * produced by comparison_view_model_v1.js.
 *
 * ============================================================
 */

function createComparisonMetricRow(
    item
) {

    if (
        !item ||
        item.available !==
            true
    ) {

        return null;
    }


    const row =
        document.createElement(
            "div"
        );


    row.className =
        "comparison-row";


    const label =
        document.createElement(
            "div"
        );


    label.className =
        "comparison-row-label";


    label.textContent =
        safeString(
            item.label ??
            item.key
        );


    const valueA =
        document.createElement(
            "div"
        );


    valueA.className =
        "comparison-row-value";


    valueA.textContent =
        item.product_a ===
            null ||
        item.product_a ===
            undefined
            ? "—"
            : String(
                item.product_a
            );


    const valueB =
        document.createElement(
            "div"
        );


    valueB.className =
        "comparison-row-value";


    valueB.textContent =
        item.product_b ===
            null ||
        item.product_b ===
            undefined
            ? "—"
            : String(
                item.product_b
            );


    if (
        item.higher_product ===
            "a"
    ) {

        valueA.classList.add(
            "comparison-row-advantage"
        );
    }


    if (
        item.higher_product ===
            "b"
    ) {

        valueB.classList.add(
            "comparison-row-advantage"
        );
    }


    row.appendChild(
        label
    );


    row.appendChild(
        valueA
    );


    row.appendChild(
        valueB
    );


    return row;
}


function createComparisonSection(
    title,
    items,
    productAName,
    productBName
) {

    if (
        !Array.isArray(
            items
        ) ||
        items.length ===
            0
    ) {

        return null;
    }


    const availableItems =
        items.filter(
            item =>
                item?.available ===
                true
        );


    if (
        availableItems.length ===
            0
    ) {

        return null;
    }


    const section =
        document.createElement(
            "section"
        );


    section.className =
        "comparison-section";


    const heading =
        document.createElement(
            "div"
        );


    heading.className =
        "comparison-section-title";


    heading.textContent =
        title;


    const table =
        document.createElement(
            "div"
        );


    table.className =
        "comparison-table";


    const header =
        document.createElement(
            "div"
        );


    header.className =
        "comparison-row comparison-row-header";


    const empty =
        document.createElement(
            "div"
        );


    empty.textContent =
        "";


    const productA =
        document.createElement(
            "div"
        );


    productA.textContent =
        productAName;


    const productB =
        document.createElement(
            "div"
        );


    productB.textContent =
        productBName;


    header.appendChild(
        empty
    );


    header.appendChild(
        productA
    );


    header.appendChild(
        productB
    );


    table.appendChild(
        header
    );


    for (
        const item
        of availableItems
    ) {

        const row =
            createComparisonMetricRow(
                item
            );


        if (
            row
        ) {

            table.appendChild(
                row
            );
        }
    }


    section.appendChild(
        heading
    );


    section.appendChild(
        table
    );


    return section;
}


export function renderComparisonView(
    comparisonView
) {

    if (
        !messagesElement ||
        !isPlainObject(
            comparisonView
        ) ||
        comparisonView.success !==
            true ||
        comparisonView.available !==
            true ||
        comparisonView.status !==
            "comparison_view_ready"
    ) {

        return null;
    }


    const productA =
        comparisonView
            ?.products
            ?.product_a;


    const productB =
        comparisonView
            ?.products
            ?.product_b;


    if (
        !productA ||
        !productB
    ) {

        return null;
    }


    const productAName =
        safeString(
            productA.model ??
            productA.display_name ??
            productA.id
        );


    const productBName =
        safeString(
            productB.model ??
            productB.display_name ??
            productB.id
        );


    if (
        !productAName ||
        !productBName
    ) {

        return null;
    }


    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        "message ai comparison-message";


    const label =
        document.createElement(
            "div"
        );


    label.className =
        "message-label";


    label.textContent =
        t(
            "system.assistant",
            "EveryCourtAI"
        );


    const card =
        document.createElement(
            "div"
        );


    card.className =
        "comparison-card";


    /**
     * Product Header
     */

    const products =
        document.createElement(
            "div"
        );


    products.className =
        "comparison-products";


    const productAElement =
        document.createElement(
            "div"
        );


    productAElement.className =
        "comparison-product";


    productAElement.textContent =
        productAName;


    const versus =
        document.createElement(
            "div"
        );


    versus.className =
        "comparison-vs";


    versus.textContent =
        "VS";


    const productBElement =
        document.createElement(
            "div"
        );


    productBElement.className =
        "comparison-product";


    productBElement.textContent =
        productBName;


    products.appendChild(
        productAElement
    );


    products.appendChild(
        versus
    );


    products.appendChild(
        productBElement
    );


    card.appendChild(
        products
    );


    /**
     * Performance Dimensions
     */

    const locale =
        safeString(
            comparisonView.locale ??
            comparisonView.language
        );


    const isChinese =
        locale === "zh-CN" ||
        locale === "zh-HK" ||
        locale === "zh-TW";


    const dimensionsSection =
        createComparisonSection(

            isChinese
                ? "性能对比"
                : "Performance",

            comparisonView.dimensions,

            productAName,

            productBName
        );


    if (
        dimensionsSection
    ) {

        card.appendChild(
            dimensionsSection
        );
    }


    /**
     * Specifications
     */

    const specificationsSection =
        createComparisonSection(

            isChinese
                ? "规格"
                : "Specifications",

            comparisonView.specifications,

            productAName,

            productBName
        );


    if (
        specificationsSection
    ) {

        card.appendChild(
            specificationsSection
        );
    }


    /**
     * Personalized Player Fit
     */

    const playerFit =
        comparisonView
            ?.player_fit;


    if (
        playerFit?.available ===
            true &&
        playerFit?.personalized ===
            true &&
        playerFit?.product_a &&
        playerFit?.product_b
    ) {

        const signalsA =
            playerFit
                .product_a
                .signals ?? {};


        const signalsB =
            playerFit
                .product_b
                .signals ?? {};


        const formatPlayerFitSignal =
            (
                value,
                type
            ) => {

                const normalized =
                    safeString(
                        value
                    )
                        .toLowerCase();


                const labels = {

                    strong: {
                        zh: "强",
                        en: "Strong"
                    },

                    moderate: {
                        zh: "中等",
                        en: "Moderate"
                    },

                    weak: {
                        zh: "弱",
                        en: "Weak"
                    },

                    demanding: {
                        zh: "负担较高",
                        en: "Demanding"
                    },

                    neutral: {
                        zh: "中性",
                        en: "Neutral"
                    },

                    low: {
                        zh: "低",
                        en: "Low"
                    },

                    high: {
                        zh: "高",
                        en: "High"
                    },

                    positive: {
                        zh: "符合",
                        en: "Positive"
                    },

                    negative: {
                        zh: "不符合",
                        en: "Negative"
                    },

                    unknown: {
                        zh: "未知",
                        en: "Unknown"
                    }

                };


                const label =
                    labels[
                        normalized
                    ];


                if (
                    label
                ) {

                    return isChinese
                        ? label.zh
                        : label.en;
                }


                if (
                    type ===
                        "physical"
                ) {

                    return isChinese
                        ? "未知"
                        : "Unknown";
                }


                return normalized
                    ? normalized
                    : (
                        isChinese
                            ? "未知"
                            : "Unknown"
                    );
            };


        const playerFitSection =
            document.createElement(
                "section"
            );


        playerFitSection.className =
            "comparison-section comparison-player-fit";


        const playerFitTitle =
            document.createElement(
                "div"
            );


        playerFitTitle.className =
            "comparison-section-title";


        playerFitTitle.textContent =
            isChinese
                ? "更适合你 · Player Fit"
                : "Personalized For You · Player Fit";


        playerFitSection.appendChild(
            playerFitTitle
        );


        const table =
            document.createElement(
                "div"
            );


        table.className =
            "comparison-table comparison-player-fit-table";


        const header =
            document.createElement(
                "div"
            );


        header.className =
            "comparison-row comparison-row-header";


        const headerLabel =
            document.createElement(
                "div"
            );


        headerLabel.textContent =
            isChinese
                ? "个人匹配"
                : "Player Fit";


        const headerA =
            document.createElement(
                "div"
            );


        headerA.textContent =
            productAName;


        const headerB =
            document.createElement(
                "div"
            );


        headerB.textContent =
            productBName;


        header.appendChild(
            headerLabel
        );


        header.appendChild(
            headerA
        );


        header.appendChild(
            headerB
        );


        table.appendChild(
            header
        );


        const rows = [

            {
                label:
                    isChinese
                        ? "挥拍匹配"
                        : "Swing Match",

                valueA:
                    formatPlayerFitSignal(
                        signalsA
                            .swing_compatibility,
                        "swing"
                    ),

                valueB:
                    formatPlayerFitSignal(
                        signalsB
                            .swing_compatibility,
                        "swing"
                    )
            },

            {
                label:
                    isChinese
                        ? "重量匹配"
                        : "Weight Match",

                valueA:
                    formatPlayerFitSignal(
                        signalsA
                            .weight_compatibility,
                        "weight"
                    ),

                valueB:
                    formatPlayerFitSignal(
                        signalsB
                            .weight_compatibility,
                        "weight"
                    )
            },

            {
                label:
                    isChinese
                        ? "身体负担"
                        : "Physical Demand",

                valueA:
                    formatPlayerFitSignal(
                        signalsA
                            .physical_demand,
                        "physical"
                    ) +
                    (
                        signalsA
                            .physical_risk ===
                        true
                            ? " ⚠"
                            : ""
                    ),

                valueB:
                    formatPlayerFitSignal(
                        signalsB
                            .physical_demand,
                        "physical"
                    ) +
                    (
                        signalsB
                            .physical_risk ===
                        true
                            ? " ⚠"
                            : ""
                    )
            },

            {
                label:
                    isChinese
                        ? "目标匹配"
                        : "Goal Match",

                valueA:
                    formatPlayerFitSignal(
                        signalsA
                            .goal_alignment,
                        "goal"
                    ),

                valueB:
                    formatPlayerFitSignal(
                        signalsB
                            .goal_alignment,
                        "goal"
                    )
            }
        ];


        for (
            const row
            of rows
        ) {

            const rowElement =
                document.createElement(
                    "div"
                );


            rowElement.className =
                "comparison-row comparison-player-fit-row";


            const rowLabel =
                document.createElement(
                    "div"
                );


            rowLabel.className =
                "comparison-row-label";


            rowLabel.textContent =
                row.label;


            const valueA =
                document.createElement(
                    "div"
                );


            valueA.className =
                "comparison-row-value";


            valueA.textContent =
                row.valueA;


            const valueB =
                document.createElement(
                    "div"
                );


            valueB.className =
                "comparison-row-value";


            valueB.textContent =
                row.valueB;


            rowElement.appendChild(
                rowLabel
            );


            rowElement.appendChild(
                valueA
            );


            rowElement.appendChild(
                valueB
            );


            table.appendChild(
                rowElement
            );
        }


        playerFitSection.appendChild(
            table
        );


        card.appendChild(
            playerFitSection
        );
    }

    else {

        const playerFitPrompt =
            document.createElement(
                "section"
            );


        playerFitPrompt.className =
            "comparison-section comparison-player-fit comparison-player-fit-prompt";


        const promptTitle =
            document.createElement(
                "div"
            );


        promptTitle.className =
            "comparison-section-title";


        promptTitle.textContent =
            isChinese
                ? "获得你的个性化匹配"
                : "Get Your Personalized Fit";


        const promptText =
            document.createElement(
                "div"
            );


        promptText.className =
            "comparison-player-fit-prompt-text";


        promptText.textContent =
            isChinese
                ? "完善运动档案后，可进一步判断两支球拍与你的挥拍方式、重量承受、身体负担和目标的匹配程度。"
                : "Complete your player profile to compare how each racquet fits your swing, weight tolerance, physical demand and goals.";


        playerFitPrompt.appendChild(
            promptTitle
        );


        playerFitPrompt.appendChild(
            promptText
        );


        card.appendChild(
            playerFitPrompt
        );
    }


    /**
     * Narrative
     */

    const narrative =
        comparisonView
            ?.summary
            ?.narrative;


    if (
        Array.isArray(
            narrative
        ) &&
        narrative.length >
            0
    ) {

        const narrativeSection =
            document.createElement(
                "section"
            );


        narrativeSection.className =
            "comparison-section comparison-narrative";


        const narrativeTitle =
            document.createElement(
                "div"
            );


        narrativeTitle.className =
            "comparison-section-title";


        narrativeTitle.textContent =
            isChinese
                ? "核心差异"
                : "Key Differences";


        narrativeSection.appendChild(
            narrativeTitle
        );


        for (
            const item
            of narrative
        ) {

            const text =
                safeString(
                    item?.text
                );


            if (
                !text
            ) {

                continue;
            }


            const paragraph =
                document.createElement(
                    "p"
                );


            paragraph.className =
                "comparison-narrative-item";


            paragraph.textContent =
                text;


            narrativeSection.appendChild(
                paragraph
            );
        }


        card.appendChild(
            narrativeSection
        );
    }


    wrapper.appendChild(
        label
    );


    wrapper.appendChild(
        card
    );


    messagesElement.appendChild(
        wrapper
    );


    scrollToBottom();


    return wrapper;
}


/**
 * ============================================================
 * Thinking
 * ============================================================
 */

function showThinking() {

    if (
        !messagesElement
    ) {

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
                thinking:
                    true
            }
        );


    messagesElement
        .appendChild(
            element
        );


    scrollToBottom();


    return element;
}


function removeThinking(
    element
) {

    if (
        element
    ) {

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


    if (
        sendButtonElement
    ) {

        sendButtonElement.disabled =
            value;


        sendButtonElement
            .style
            .opacity =
            value
                ? "0.6"
                : "1";
    }


    if (
        promptInputElement
    ) {

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

    if (
        !promptInputElement
    ) {

        return;
    }


    promptInputElement
        .style
        .height =
        "auto";


    promptInputElement
        .style
        .height =
        Math.min(
            promptInputElement
                .scrollHeight,
            160
        ) +
        "px";
}


/**
 * ============================================================
 * Recommendation Card
 * ============================================================
 */

export function updateRecommendationCard(
    recommendation
) {

    if (
        !recommendation
    ) {

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

        const racquetAction =
            String(
                recommendation
                    .racquet_action ??
                ""
            )
                .trim()
                .toLowerCase();


        const racquetActionLabel =
            racquetAction === "keep"
                ? "KEEP · 保留"
                : (
                    racquetAction === "change"
                        ? "CHANGE · 更换"
                        : (
                            racquetAction ===
                                "optional_change"
                                ? "OPTIONAL · 可选更换"
                                : null
                        )
                );


        racquetElement
            .textContent =
            racquetActionLabel
                ? `${racquetActionLabel} · ${recommendation.racquet}`
                : recommendation.racquet;
    }


    /**
     * String
     */

    if (
        stringElement &&
        recommendation.string
    ) {

        const stringAction =
            String(
                recommendation
                    .string_action ??
                ""
            )
                .trim()
                .toLowerCase();


        const stringActionLabel =
            stringAction === "keep"
                ? "KEEP · 保留"
                : (
                    stringAction === "change"
                        ? "CHANGE · 更换"
                        : (
                            stringAction ===
                                "optional_change"
                                ? "OPTIONAL · 可选更换"
                                : null
                        )
                );


        stringElement
            .textContent =
            stringActionLabel
                ? `${stringActionLabel} · ${recommendation.string}`
                : recommendation.string;
    }


    /**
     * Gauge + Setup
     */

    if (
        stringSetupElement
    ) {

        const parts =
            [];


        if (
            recommendation
                .gauge_mm !==
                null &&
            recommendation
                .gauge_mm !==
                undefined
        ) {

            parts.push(
                `${recommendation.gauge_mm} mm`
            );
        }


        if (
            recommendation
                .setup_type
        ) {

            parts.push(
                String(
                    recommendation
                        .setup_type
                )
                    .replace(
                        /_/g,
                        " "
                    )
            );
        }


        if (
            recommendation
                .change_strategy
        ) {

            const rawStrategy =
                String(
                    recommendation
                        .change_strategy
                )
                    .trim()
                    .toLowerCase();


            const strategyMap = {
                string_first:
                    "STRING FIRST · 优先换线",

                tension_only:
                    "TENSION ONLY · 仅调磅数",

                keep_current_setup:
                    "KEEP SETUP · 保持当前配置",

                maintain_or_minor_tension_adjustment:
                    "MINOR ADJUSTMENT · 小幅调整",

                full_setup_change:
                    "FULL SETUP CHANGE · 整体调整"
            };


            const strategyLabel =
                strategyMap[
                    rawStrategy
                ] ??
                rawStrategy
                    .replace(
                        /_/g,
                        " "
                    )
                    .replace(
                        /\b\w/g,
                        character =>
                            character
                                .toUpperCase()
                    );


            parts.push(
                strategyLabel
            );
        }


        if (
            recommendation
                .recommended_change_count !==
                null &&
            recommendation
                .recommended_change_count !==
                undefined
        ) {

            const changeCount =
                Number(
                    recommendation
                        .recommended_change_count
                );


            if (
                Number.isFinite(
                    changeCount
                )
            ) {

                parts.push(
                    changeCount === 1
                        ? "1 MAIN CHANGE · 1 个主要调整"
                        : `${changeCount} MAIN CHANGES · ${changeCount} 个主要调整`
                );
            }
        }


        if (
            parts.length >
            0
        ) {

            stringSetupElement
                .textContent =
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
        recommendation
            .tension_lbs !==
            null &&
        recommendation
            .tension_lbs !==
            undefined
    ) {

        const recommendedTension =
            Number(
                recommendation
                    .tension_lbs
            );


        const tensionDelta =
            Number(
                recommendation
                    .tension_delta_lbs
            );


        if (
            Number.isFinite(
                recommendedTension
            ) &&
            Number.isFinite(
                tensionDelta
            ) &&
            tensionDelta !== 0
        ) {

            const currentTension =
                recommendedTension -
                tensionDelta;


            tensionElement
                .textContent =
                `${currentTension} lbs → ${recommendedTension} lbs`;

        } else {

            tensionElement
                .textContent =
                `${recommendation.tension_lbs} lbs`;
        }
    }


    /**
     * Tension Range
     */

    if (
        tensionRangeElement &&
        recommendation
            .tension_range
    ) {

        tensionRangeElement
            .textContent =
            recommendation
                .tension_range;
    }


    /**
     * Confidence
     */

    if (
        recommendation
            .confidence !==
            null &&
        recommendation
            .confidence !==
            undefined
    ) {

        const confidence =
            Math.max(
                0,
                Math.min(
                    100,
                    Number(
                        recommendation
                            .confidence
                    )
                )
            );


        if (
            confidenceValueElement
        ) {

            const confidenceLevel =
                String(
                    recommendation
                        .confidence_level ??
                    ""
                )
                    .trim();


            confidenceValueElement
                .textContent =
                confidenceLevel
                    ? `${confidence}% · ${confidenceLevel}`
                    : `${confidence}%`;
        }


        if (
            confidenceFillElement
        ) {

            confidenceFillElement
                .style
                .width =
                `${confidence}%`;
        }
    }
}


/**
 * ============================================================
 * Conversation State
 * ============================================================
 */

function updateConversationStateFromResult(
    result
) {

    /**
     * Worker 有返回 State 时才更新。
     */

    if (
        isPlainObject(
            result
                ?.conversation_state
        )
    ) {

        conversationState =
            result
                .conversation_state;
    }


    if (
        safeString(
            result
                ?.conversation_id
        )
    ) {

        conversationId =
            result
                .conversation_id;
    }


    if (
        Number.isFinite(
            Number(
                result
                    ?.turn
            )
        )
    ) {

        conversationTurn =
            Number(
                result
                    .turn
            );
    }


    console.log(
        "EveryCourtAI Conversation:",
        {
            conversation_id:
                conversationId,

            turn:
                conversationTurn,

            status:
                result
                    ?.status ??
                null,

            pending_fields:
                result
                    ?.pending_fields ??
                []
        }
    );
}


/**
 * ============================================================
 * Reset Conversation
 * ============================================================
 */

export function resetConversationState() {

    conversationState =
        null;


    conversationId =
        null;


    conversationTurn =
        0;


    conversationHistory =
        [];


    console.log(
        "EveryCourtAI conversation reset."
    );


    return {

        success:
            true
    };
}


/**
 * ============================================================
 * Player Profile Form
 * ============================================================
 */

function readPlayerProfileForm() {

    const getValue =
        id =>
            String(
                document
                    .getElementById(id)
                    ?.value ??
                ""
            ).trim();


    const basic = {};


    const name =
        getValue(
            "playerName"
        );

    const gender =
        getValue(
            "playerGender"
        );

    const age =
        Number(
            getValue(
                "playerAge"
            )
        );

    const height =
        Number(
            getValue(
                "playerHeight"
            )
        );

    const weight =
        Number(
            getValue(
                "playerWeight"
            )
        );

    const dominantHand =
        getValue(
            "playerDominantHand"
        );


    if (name) {
        basic.name =
            name;
    }

    if (gender) {
        basic.gender =
            gender;
    }

    if (
        Number.isFinite(age) &&
        age > 0
    ) {
        basic.age =
            age;
    }

    if (
        Number.isFinite(height) &&
        height > 0
    ) {
        basic.height_cm =
            height;
    }

    if (
        Number.isFinite(weight) &&
        weight > 0
    ) {
        basic.weight_kg =
            weight;
    }

    if (dominantHand) {
        basic.dominant_hand =
            dominantHand;
    }


    const playerInput = {};


    if (
        Object.keys(basic)
            .length > 0
    ) {
        playerInput.basic =
            basic;
    }


    const currentRacquetText =
        getValue(
            "playerCurrentRacquet"
        );

    const currentStringText =
        getValue(
            "playerCurrentString"
        );


    const selectedRacquet =
        window
            ?.EveryCourtEquipmentSelector
            ?.getSelectedEquipmentProduct
            ?.(
                "playerCurrentRacquet"
            ) ??
        null;


    const selectedString =
        window
            ?.EveryCourtEquipmentSelector
            ?.getSelectedEquipmentProduct
            ?.(
                "playerCurrentString"
            ) ??
        null;


    const currentRacquet =
        selectedRacquet ??
        currentRacquetText;


    const currentString =
        selectedString ??
        currentStringText;

    const tensionRaw =
        getValue(
            "playerCurrentTension"
        );

    const currentTension =
        Number(
            tensionRaw
        );

    const primaryGoal =
        getValue(
            "playerPrimaryGoal"
        );

    const playingStyle =
        getValue(
            "playerPlayingStyle"
        );

    const swingSpeed =
        getValue(
            "playerSwingSpeed"
        );

    const feelPreference =
        getValue(
            "playerFeelPreference"
        );

    const physicalSensitivityFields = {
        shoulder_sensitivity:
            "playerShoulderSensitivity",
        elbow_sensitivity:
            "playerElbowSensitivity",
        wrist_sensitivity:
            "playerWristSensitivity",
        neck_sensitivity:
            "playerNeckSensitivity",
        lower_back_sensitivity:
            "playerLowerBackSensitivity",
        hip_sensitivity:
            "playerHipSensitivity",
        knee_sensitivity:
            "playerKneeSensitivity",
        ankle_sensitivity:
            "playerAnkleSensitivity"
    };

    const physicalCondition = {};

    for (
        const [
            field,
            elementId
        ]
        of Object.entries(
            physicalSensitivityFields
        )
    ) {
        const value =
            getValue(elementId);

        if (value) {
            physicalCondition[field] =
                value;
        }
    }


    if (currentRacquet) {
        playerInput.current_racquet =
            currentRacquet;
    }

    if (currentString) {
        playerInput.current_string =
            currentString;
    }

    if (
        tensionRaw &&
        Number.isFinite(
            currentTension
        )
    ) {
        playerInput.current_tension =
            currentTension;
    }

    if (primaryGoal) {
        playerInput.primary_goal =
            primaryGoal;
    }

    if (playingStyle) {
        playerInput.playing_style =
            playingStyle;
    }

    if (swingSpeed) {
        playerInput.swing_speed =
            swingSpeed;
    }

    if (feelPreference) {
        playerInput.feel_preference =
            feelPreference;
    }

    if (
        Object.keys(
            physicalCondition
        ).length > 0
    ) {
        playerInput.physical_condition =
            physicalCondition;
    }


    return Object.keys(
        playerInput
    ).length > 0
        ? playerInput
        : null;
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
            promptInputElement
                .value
        );


    if (
        !prompt
    ) {

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

    setProcessing(
        true
    );


    /**
     * 3. Thinking
     */

    const thinkingElement =
        showThinking();


    try {

        /**
         * ====================================================
         * 4. Cloudflare API
         * ====================================================
         *
         * 多轮核心：
         *
         * conversationState 在第一轮为 null。
         *
         * Worker 返回以后保存。
         *
         * 第二轮开始自动带回。
         * ====================================================
         */

        const playerInput =
            readPlayerProfileForm();


        const result =
            await sendChatRequest({

                prompt,

                language:
                    getCurrentLanguage(),

                history:
                    conversationHistory,

                conversationState,

                playerInput
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
            result.success !==
                true
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
         * ====================================================
         * 7. Save Conversation State
         * ====================================================
         */

        updateConversationStateFromResult(
            result
        );


        /**
         * ====================================================
         * 8. Answer / Comparison View
         * ====================================================
         *
         * comparison_ready:
         *
         * The structured Comparison Card is the primary UI.
         * Do not render the long text answer first because the
         * same comparison narrative already exists inside
         * comparison_view.
         *
         * Other response modes:
         *
         * Continue rendering result.answer normally.
         * ====================================================
         */

        const hasComparisonView =
            result.status ===
                "comparison_ready" &&
            result
                ?.comparison_view
                ?.success ===
                true &&
            result
                ?.comparison_view
                ?.available ===
                true &&
            result
                ?.comparison_view
                ?.status ===
                "comparison_view_ready";


        if (
            hasComparisonView
        ) {

            renderComparisonView(
                result
                    .comparison_view
            );

        } else if (
            result.answer
        ) {

            addMessage(
                "ai",
                result.answer
            );
        }


        /**
         * ====================================================
         * 10. Recommendation
         * ====================================================
         *
         * Follow-up 阶段：
         *
         * recommendation = null
         *
         * 所以不会错误更新右侧卡片。
         *
         * recommendation_ready：
         *
         * 才更新推荐。
         * ====================================================
         */

        if (
            result
                .recommendation
        ) {

            updateRecommendationCard(
                result
                    .recommendation
            );


            window
                ?.EveryCourtCommerceDemo
                ?.setCommerceRecommendation
                ?.(
                    result
                        .recommendation
                );
        }


    } catch (
        error
    ) {

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

        setProcessing(
            false
        );


        if (
            promptInputElement
        ) {

            promptInputElement
                .focus();
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


                        promptInputElement
                            .value =
                            button
                                .textContent
                                .trim();


                        resizeTextarea();


                        promptInputElement
                            .focus();
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

        sendButtonElement
            .addEventListener(
                "click",
                submitCurrentPrompt
            );
    }


    if (
        promptInputElement
    ) {

        promptInputElement
            .addEventListener(
                "keydown",
                event => {

                    if (
                        event.key ===
                            "Enter" &&
                        !event.shiftKey
                    ) {

                        event.preventDefault();


                        submitCurrentPrompt();
                    }
                }
            );


        promptInputElement
            .addEventListener(
                "input",
                resizeTextarea
            );
    }


    bindStarterPrompts();
}


/**
 * ============================================================
 * Initialization
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

            success:
                false
        };
    }


    bindEvents();


    resizeTextarea();


    console.log(
        "EveryCourtAI Chat Manager V2.2 connected."
    );


    return {

        success:
            true,

        version:
            "2.2",

        multi_turn:
            true
    };
}


/**
 * ============================================================
 * Auto Start
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

    resetConversationState,


    getConversationHistory() {

        return [
            ...conversationHistory
        ];
    },


    getConversationState() {

        return conversationState;
    },


    getConversationInfo() {

        return {

            conversation_id:
                conversationId,

            turn:
                conversationTurn,

            has_state:
                Boolean(
                    conversationState
                )
        };
    },


    clearConversationHistory() {

        conversationHistory =
            [];
    },


    clearConversation() {

        resetConversationState();


        const messagesElement =
            document.getElementById(
                "messages"
            );


        const promptInputElement =
            document.getElementById(
                "promptInput"
            );


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


        if (
            messagesElement
        ) {

            messagesElement.innerHTML =
                "";
        }


        if (
            promptInputElement
        ) {

            promptInputElement.value =
                "";

            promptInputElement.style.height =
                "auto";
        }


        if (
            racquetElement
        ) {

            racquetElement.textContent =
                "—";
        }


        if (
            stringElement
        ) {

            stringElement.textContent =
                "—";
        }


        if (
            stringSetupElement
        ) {

            stringSetupElement.textContent =
                "—";
        }


        if (
            tensionElement
        ) {

            tensionElement.textContent =
                "—";
        }


        if (
            tensionRangeElement
        ) {

            tensionRangeElement.textContent =
                "—";
        }


        if (
            confidenceValueElement
        ) {

            confidenceValueElement.textContent =
                "—";
        }


        if (
            confidenceFillElement
        ) {

            confidenceFillElement
                .style
                .width =
                "0%";
        }


        return {
            success:
                true
        };
    }
};

/**
 * ============================================================
 * New Analysis Button
 * ============================================================
 */

const newAnalysisButton =
    document.getElementById(
        "newAnalysisButton"
    );


if (
    newAnalysisButton
) {

    newAnalysisButton
        .addEventListener(
            "click",
            () => {

                window
                    ?.EveryCourtChat
                    ?.clearConversation
                    ?.();
            }
        );
}
