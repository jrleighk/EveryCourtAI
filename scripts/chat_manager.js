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

import {
    getComparisonPresentation
} from "./comparison_i18n_v1.js";


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
 * New Analysis Visibility
 * ============================================================
 */

function setNewAnalysisButtonVisible(
    visible
) {

    const button =
        document.getElementById(
            "newAnalysisButton"
        );


    if (
        !button
    ) {

        return;
    }


    button.hidden =
        !visible;
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
 * Comparison Clarification Renderer V1
 * ============================================================
 *
 * Source:
 *
 * result.comparison_clarification
 *
 * Candidate selection deliberately reuses the normal prompt
 * submission path. This preserves conversationState and lets
 * the existing backend clarification resolver complete the
 * pending comparison.
 *
 * ============================================================
 */

export function renderComparisonClarification(
    clarification
) {

    if (
        !messagesElement ||
        !isPlainObject(
            clarification
        ) ||
        clarification.available !==
            true
    ) {

        return null;
    }


    const candidates =
        Array.isArray(
            clarification.candidates
        )
            ? clarification.candidates
            : [];


    if (
        candidates.length ===
            0
    ) {

        return null;
    }


    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        "message ai comparison-clarification-message";


    const label =
        document.createElement(
            "div"
        );


    label.className =
        "message-label";


    label.textContent =
        "EveryCourtAI";


    const card =
        document.createElement(
            "div"
        );


    card.className =
        "comparison-clarification-card";


    const prompt =
        document.createElement(
            "div"
        );


    prompt.className =
        "comparison-clarification-prompt";


    prompt.textContent =
        safeString(
            clarification.answer
        );


    card.appendChild(
        prompt
    );


    const candidateList =
        document.createElement(
            "div"
        );


    candidateList.className =
        "comparison-clarification-candidates";


    candidates.forEach(
        candidate => {

            const candidateLabel =
                safeString(
                    candidate?.label ??
                    candidate?.model ??
                    candidate?.id
                );


            if (
                !candidateLabel
            ) {

                return;
            }


            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "comparison-clarification-candidate";


            button.textContent =
                candidateLabel;


            button.dataset.productId =
                safeString(
                    candidate?.id
                );


            button.addEventListener(
                "click",
                async () => {

                    if (
                        isProcessing ||
                        !promptInputElement
                    ) {

                        return;
                    }


                    candidateList
                        .querySelectorAll(
                            "button"
                        )
                        .forEach(
                            item => {

                                item.disabled =
                                    true;
                            }
                        );


                    promptInputElement.value =
                        candidateLabel;


                    resizeTextarea();


                    await submitCurrentPrompt();
                }
            );


            candidateList.appendChild(
                button
            );
        }
    );


    if (
        candidateList.children.length ===
            0
    ) {

        return null;
    }


    card.appendChild(
        candidateList
    );


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
    item,
    rowLabels = {}
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


    const localizedRowLabel =
        rowLabels?.[
            item.key
        ];


    label.textContent =
        safeString(
            localizedRowLabel ??
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
    productBName,
    rowLabels = {}
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
                item,
                rowLabels
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

    const localeCode =
        safeString(
            comparisonView
                ?.locale
                ?.code ??
            comparisonView
                ?.language
        );


    const comparisonI18n =
        getComparisonPresentation(
            localeCode
        );


    const dimensionsSection =
        createComparisonSection(

            comparisonI18n
                .performance,

            comparisonView.dimensions,

            productAName,

            productBName,

            comparisonI18n
                .row_labels
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

            comparisonI18n
                .specifications,

            comparisonView.specifications,

            productAName,

            productBName,

            comparisonI18n
                .row_labels
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


                const localizedSignal =
                    comparisonI18n[
                        normalized
                    ];


                if (
                    localizedSignal
                ) {
                    return localizedSignal;
                }


                return comparisonI18n
                    .unknown;
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
            comparisonI18n
                .personalized_for_you;


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
            comparisonI18n
                .player_fit;


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
                    comparisonI18n
                        .swing_match,

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
                    comparisonI18n
                        .weight_match,

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
                    comparisonI18n
                        .physical_demand,

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
                    comparisonI18n
                        .goal_match,

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
            comparisonI18n
                .personalized_prompt_title;


        const promptText =
            document.createElement(
                "div"
            );


        promptText.className =
            "comparison-player-fit-prompt-text";


        promptText.textContent =
            comparisonI18n
                .personalized_prompt_text;


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
            comparisonI18n
                .key_differences;


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


            const itemContainer =
                document.createElement(
                    "div"
                );


            itemContainer.className =
                "comparison-narrative-item";


            const itemLabel =
                safeString(
                    comparisonI18n
                        ?.narrative_labels
                        ?.[
                            item?.id
                        ]
                );


            if (
                itemLabel
            ) {

                const labelElement =
                    document.createElement(
                        "div"
                    );


                labelElement.className =
                    "comparison-narrative-label";


                labelElement.textContent =
                    itemLabel;


                itemContainer.appendChild(
                    labelElement
                );
            }


            const paragraph =
                document.createElement(
                    "p"
                );


            paragraph.className =
                "comparison-narrative-text";


            paragraph.textContent =
                text;


            itemContainer.appendChild(
                paragraph
            );


            narrativeSection.appendChild(
                itemContainer
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
 * Recommendation Panel Visibility
 * ============================================================
 */

function setRecommendationPanelVisible(
    visible
) {

    const panel =
        document.querySelector(
            ".recommendation-panel"
        );


    if (
        !panel
    ) {

        return;
    }


    panel.hidden =
        !visible;
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
         * A successful response means an analysis session now
         * exists. The reset action becomes available from this
         * point onward.
         */

        setNewAnalysisButtonVisible(
            true
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


        const hasComparisonClarification =
            result.status ===
                "comparison_clarification_required" &&
            result
                ?.comparison_clarification
                ?.available ===
                true &&
            Array.isArray(
                result
                    ?.comparison_clarification
                    ?.candidates
            ) &&
            result
                .comparison_clarification
                .candidates
                .length >
                0;


        if (
            hasComparisonView
        ) {

            setRecommendationPanelVisible(
                false
            );


            renderComparisonView(
                result
                    .comparison_view
            );

        } else if (
            hasComparisonClarification
        ) {

            setRecommendationPanelVisible(
                false
            );


            renderComparisonClarification(
                result
                    .comparison_clarification
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

            setRecommendationPanelVisible(
                true
            );


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

        updateHealthRecoveryCard(
            result?.recovery ?? null,
            result?.health_baseline ?? null,
            result?.health_baseline_adjustment ?? null
        );


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


            const welcomeElement =
                createMessageElement(
                    "ai",
                    t(
                        "chat.welcome",
                        "Tell me what you are currently using and what you want to improve."
                    )
                );


            welcomeElement.id =
                "welcomeMessage";


            messagesElement.appendChild(
                welcomeElement
            );
        }


        setNewAnalysisButtonVisible(
            false
        );


        setRecommendationPanelVisible(
            true
        );


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
 * Player Profile Disclosure
 * ============================================================
 */

const playerProfileToggle =
    document.getElementById(
        "playerProfileToggle"
    );


const playerProfileFields =
    document.getElementById(
        "playerProfileFields"
    );


if (
    playerProfileToggle &&
    playerProfileFields
) {

    playerProfileToggle
        .addEventListener(
            "click",
            () => {

                const expanded =
                    playerProfileToggle
                        .getAttribute(
                            "aria-expanded"
                        ) ===
                        "true";


                playerProfileToggle
                    .setAttribute(
                        "aria-expanded",
                        String(
                            !expanded
                        )
                    );


                playerProfileFields.hidden =
                    expanded;
            }
        );
}


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

/**
 * ============================================================
 * Health Recovery Card V1
 * ============================================================
 */

export function updateHealthRecoveryCard(
    recovery,
    baseline = null,
    baselineAdjustment = null
) {
    const anchor =
        document.getElementById(
            "recommendedRacquet"
        );

    if (!anchor) return;

    const setupCard =
        anchor.closest(
            ".setup-card"
        );

    if (!setupCard) return;

    let card =
        document.getElementById(
            "healthRecoveryCard"
        );

    if (!recovery) {
        if (card) card.hidden = true;
        return;
    }

    if (!card) {
        card =
            document.createElement(
                "section"
            );

        card.id =
            "healthRecoveryCard";

        card.className =
            "health-recovery-card";

        setupCard.insertAdjacentElement(
            "afterend",
            card
        );
    }

    const score =
        typeof recovery.recovery_score ===
        "number"
            ? Math.max(
                0,
                Math.min(
                    100,
                    recovery.recovery_score
                )
            )
            : null;

    const status =
        recovery.recovery_status ??
        "unknown";

    const statusLabel = {
        ready:
            "Ready · 状态良好",

        caution:
            "Caution · 注意负荷",

        recovery_priority:
            "Recovery Priority · 优先恢复",

        unknown:
            "Insufficient Data · 数据不足"
    }[status] ??
        "Insufficient Data · 数据不足";

    const guidanceLabel = {
        normal_training:
            "正常训练",

        moderate_load:
            "适度降低负荷",

        reduce_intensity:
            "降低训练强度",

        insufficient_data:
            "需要更多数据"
    }[
        recovery
            .next_session_guidance
    ] ??
        "需要更多数据";

    const load =
        typeof recovery.session_load ===
        "number"
            ? recovery.session_load
            : null;

    const loadPercent =
        load === null
            ? 0
            : Math.min(
                100,
                Math.round(
                    load / 12
                )
            );

    const deviations =
        baseline?.deviations ?? {};

    const baselineMetrics = [
        {
            key: "hrv",
            label: "HRV",
            value: deviations.hrv_percent,
            inverse: false
        },
        {
            key: "resting_hr",
            label: "Resting HR",
            value: deviations.resting_heart_rate_percent,
            inverse: true
        },
        {
            key: "sleep",
            label: "Sleep",
            value: deviations.sleep_percent,
            inverse: false
        },
        {
            key: "load",
            label: "7-Day Load",
            value: deviations.training_load_7d_percent,
            inverse: true
        }
    ];

    const baselineAvailable =
        baseline?.baseline_available === true;

    const baselineStatus =
        baselineAdjustment?.baseline_status ??
        "insufficient_data";

    const metricReadiness =
        baselineMetrics.map(metric => {
            if (typeof metric.value !== "number") {
                return {
                    ...metric,
                    readiness: null
                };
            }

            const directional =
                metric.inverse
                    ? -metric.value
                    : metric.value;

            return {
                ...metric,
                readiness: Math.max(
                    0,
                    Math.min(
                        100,
                        100 + directional
                    )
                )
            };
        });

    const radarValues =
        metricReadiness.map(metric =>
            metric.readiness ?? 0
        );

    const radarPoint = (
        value,
        index,
        total = 4
    ) => {
        const angle =
            (-Math.PI / 2) +
            (index * 2 * Math.PI / total);

        const radius =
            58 * (value / 100);

        return [
            80 + Math.cos(angle) * radius,
            80 + Math.sin(angle) * radius
        ];
    };

    const radarPoints =
        radarValues
            .map((value, index) =>
                radarPoint(value, index)
                    .map(n => n.toFixed(1))
                    .join(",")
            )
            .join(" ");

    card.hidden = false;

    card.innerHTML = `
        <div class="health-recovery-header">
            <div>
                <div class="health-recovery-kicker">
                    RECOVERY INTELLIGENCE
                </div>
                <div class="health-recovery-title">
                    ${statusLabel}
                </div>
            </div>

            <div class="health-recovery-score">
                ${score ?? "—"}
            </div>
        </div>

        <div class="health-recovery-bento">
            <div class="health-metric">
                <span>Recovery</span>
                <strong>${score === null ? "—" : `${score}%`}</strong>
            </div>

            <div class="health-metric">
                <span>Session Load</span>
                <strong>${load ?? "—"}</strong>
            </div>

            <div class="health-metric">
                <span>Fatigue Risk</span>
                <strong>${recovery.fatigue_risk ?? "unknown"}</strong>
            </div>

            <div class="health-metric">
                <span>Next Session</span>
                <strong>${guidanceLabel}</strong>
            </div>
        </div>

        <div class="health-status-row">
            <div class="health-status-label">
                <span>Recovery Readiness</span>
                <span>${score === null ? "—" : `${score}%`}</span>
            </div>
            <div class="health-status-track">
                <div
                    class="health-status-fill"
                    style="width:${score ?? 0}%"
                ></div>
            </div>
        </div>

        ${
            baselineAvailable
                ? `
        <div class="health-radar">
            <div class="health-recovery-kicker">
                BASELINE BALANCE
            </div>

            <svg
                viewBox="0 0 160 160"
                role="img"
                aria-label="Personal health baseline radar"
            >
                <polygon
                    class="health-radar-grid"
                    points="80,22 138,80 80,138 22,80"
                />
                <polygon
                    class="health-radar-grid"
                    points="80,51 109,80 80,109 51,80"
                />
                <line class="health-radar-axis" x1="80" y1="22" x2="80" y2="138"/>
                <line class="health-radar-axis" x1="22" y1="80" x2="138" y2="80"/>

                <polygon
                    class="health-radar-value"
                    points="${radarPoints}"
                />
            </svg>

            <div class="health-radar-labels">
                <span>HRV</span>
                <span>Resting HR</span>
                <span>Sleep</span>
                <span>7-Day Load</span>
            </div>
        </div>

        <div class="health-baseline-section">
            <div class="health-recovery-kicker">
                PERSONAL BASELINE · ${baselineStatus}
            </div>

            ${metricReadiness.map(metric => `
                <div class="health-status-row">
                    <div class="health-status-label">
                        <span>${metric.label}</span>
                        <span>${
                            typeof metric.value === "number"
                                ? `${metric.value > 0 ? "+" : ""}${metric.value}%`
                                : "—"
                        }</span>
                    </div>

                    <div class="health-status-track">
                        <div
                            class="health-status-fill"
                            style="width:${metric.readiness ?? 0}%"
                        ></div>
                    </div>
                </div>
            `).join("")}
        </div>
                `
                : ""
        }

        <div class="health-status-row">
            <div class="health-status-label">
                <span>Training Load</span>
                <span>${load ?? "—"}</span>
            </div>
            <div class="health-status-track">
                <div
                    class="health-status-fill"
                    style="width:${loadPercent}%"
                ></div>
            </div>
        </div>
    `;
}
