/**
 * ============================================================
 * EveryCourtAI
 * Intent Answer Builder V1
 * ============================================================
 *
 * Purpose:
 *
 * Build focused human-readable answers from an existing
 * EveryCourtAI engine result.
 *
 * Important:
 *
 * This builder does NOT calculate recommendations.
 * Recommendation Engine remains the single source of truth.
 *
 * ============================================================
 */

const ENGINE_NAME =
    "intent_answer_builder";

const ENGINE_VERSION =
    "1.0";


function normalizeLanguage(
    language
) {

    const value =
        String(
            language ??
            "en"
        )
            .trim()
            .toLowerCase();


    if (
        value === "zh" ||
        value === "zh-cn" ||
        value === "zh-tc" ||
        value === "zh-tw"
    ) {

        return value;
    }


    return "en";
}


function formatDelta(
    value
) {

    if (
        value === null ||
        value === undefined ||
        !Number.isFinite(
            Number(value)
        )
    ) {

        return null;
    }


    const number =
        Number(value);


    if (
        number > 0
    ) {

        return `+${number}`;
    }


    return String(
        number
    );
}


function getWorkingRange(
    recommendation
) {

    const range =
        recommendation
            ?.tension
            ?.working_range_lbs;


    if (
        range?.minimum_lbs ===
            null ||
        range?.minimum_lbs ===
            undefined ||
        range?.maximum_lbs ===
            null ||
        range?.maximum_lbs ===
            undefined
    ) {

        return null;
    }


    return {
        minimum_lbs:
            range.minimum_lbs,

        maximum_lbs:
            range.maximum_lbs
    };
}


/**
 * ============================================================
 * Tension Focused Answer
 * ============================================================
 */

export function buildTensionFocusedAnswer(
    engineResult,
    language = "en"
) {

    const recommendation =
        engineResult
            ?.recommendation ??
        {};


    const explanation =
        engineResult
            ?.explanation
            ?.recommendation
            ?.tension ??
        null;


    const decision =
        recommendation
            ?.tension_decision ??
        {};


    const currentTension =
        decision
            ?.current_tension_lbs ??
        null;


    const recommendedTension =
        decision
            ?.recommended_tension_lbs ??
        recommendation
            ?.tension
            ?.main_lbs ??
        null;


    const delta =
        decision
            ?.delta_lbs ??
        (
            currentTension !== null &&
            recommendedTension !== null
                ? Number(
                    (
                        recommendedTension -
                        currentTension
                    ).toFixed(1)
                )
                : null
        );


    const range =
        getWorkingRange(
            recommendation
        );


    const normalizedLanguage =
        normalizeLanguage(
            language
        );


    if (
        recommendedTension ===
            null ||
        recommendedTension ===
            undefined
    ) {

        return {

            engine:
                ENGINE_NAME,

            version:
                ENGINE_VERSION,

            response_mode:
                "tension_focused",

            available:
                false,

            answer:
                normalizedLanguage === "en"
                    ? "A specific tension recommendation is not available yet."
                    : "目前还没有足够信息给出具体的建议磅数。",

            data: {
                current_tension_lbs:
                    currentTension,

                recommended_tension_lbs:
                    null,

                delta_lbs:
                    delta,

                working_range_lbs:
                    range,

                action:
                    decision
                        ?.action ??
                    null
            }
        };
    }


    const deltaText =
        formatDelta(
            delta
        );


    const explanationReason =
        normalizedLanguage === "en"
            ? explanation
                ?.reason
                ?.en
            : explanation
                ?.reason
                ?.zh;


    const fallbackReason =
        decision
            ?.reason ??
        null;


    let answer;


    if (
        normalizedLanguage === "en"
    ) {

        const lines = [
            `Recommended tension: ${recommendedTension} lbs.`
        ];


        if (
            currentTension !==
                null &&
            currentTension !==
                undefined
        ) {

            lines.push(
                `Current tension: ${currentTension} lbs.`
            );
        }


        if (
            deltaText !==
                null
        ) {

            lines.push(
                `Adjustment: ${deltaText} lbs.`
            );
        }


        if (
            range
        ) {

            lines.push(
                `Working range: ${range.minimum_lbs}–${range.maximum_lbs} lbs.`
            );
        }


        if (
            explanationReason ||
            fallbackReason
        ) {

            lines.push(
                `Reason: ${
                    explanationReason ??
                    fallbackReason
                }`
            );
        }


        answer =
            lines.join(
                "\n"
            );

    } else {

        const lines = [
            `建议磅数：${recommendedTension} lbs。`
        ];


        if (
            currentTension !==
                null &&
            currentTension !==
                undefined
        ) {

            lines.push(
                `当前磅数：${currentTension} lbs。`
            );
        }


        if (
            deltaText !==
                null
        ) {

            lines.push(
                `调整幅度：${deltaText} lbs。`
            );
        }


        if (
            range
        ) {

            lines.push(
                `建议工作区间：${range.minimum_lbs}–${range.maximum_lbs} lbs。`
            );
        }


        if (
            explanationReason ||
            fallbackReason
        ) {

            lines.push(
                `原因：${
                    explanationReason ??
                    fallbackReason
                }`
            );
        }


        answer =
            lines.join(
                "\n"
            );
    }


    return {

        engine:
            ENGINE_NAME,

        version:
            ENGINE_VERSION,

        response_mode:
            "tension_focused",

        available:
            true,

        answer,

        data: {

            current_tension_lbs:
                currentTension,

            recommended_tension_lbs:
                recommendedTension,

            delta_lbs:
                delta,

            working_range_lbs:
                range,

            action:
                decision
                    ?.action ??
                null,

            reason:
                explanationReason ??
                fallbackReason
        }
    };
}



/**
 * ============================================================
 * Explanation Focused Answer
 * ============================================================
 */

export function buildExplanationFocusedAnswer(
    engineResult,
    explanationTarget = null,
    language = "en"
) {

    const explanation =
        engineResult
            ?.explanation ??
        {};


    const normalizedLanguage =
        normalizeLanguage(
            language
        );


    const useEnglish =
        normalizedLanguage ===
        "en";


    const target =
        [
            "racquet",
            "string",
            "tension",
            "setup"
        ]
            .includes(
                explanationTarget
            )
                ? explanationTarget
                : null;


    /**
     * ========================================================
     * Racquet Explanation
     * ========================================================
     */

    if (
        target ===
        "racquet"
    ) {

        const section =
            explanation
                ?.recommendation
                ?.racquet;


        const reason =
            useEnglish
                ? section
                    ?.reason
                    ?.en
                : section
                    ?.reason
                    ?.zh;


        if (
            !section ||
            !reason
        ) {

            return buildExplanationUnavailable(
                target,
                normalizedLanguage
            );
        }


        const productName =
            [
                section
                    ?.product
                    ?.brand,

                section
                    ?.product
                    ?.model
            ]
                .filter(
                    Boolean
                )
                .join(
                    " "
                );


        const answer =
            useEnglish

                ? [
                    productName
                        ? `Racquet: ${productName}.`
                        : null,

                    `Reason: ${reason}`
                ]
                    .filter(
                        Boolean
                    )
                    .join(
                        "\n"
                    )

                : [
                    productName
                        ? `球拍：${productName}。`
                        : null,

                    `原因：${reason}`
                ]
                    .filter(
                        Boolean
                    )
                    .join(
                        "\n"
                    );


        return {
            engine:
                ENGINE_NAME,

            version:
                ENGINE_VERSION,

            response_mode:
                "explanation_focused",

            available:
                true,

            target,

            answer,

            data: {
                target,

                action:
                    section
                        ?.action ??
                    null,

                product:
                    section
                        ?.product ??
                    null,

                reason
            }
        };
    }


    /**
     * ========================================================
     * String Explanation
     * ========================================================
     */

    if (
        target ===
        "string"
    ) {

        const section =
            explanation
                ?.recommendation
                ?.string;


        const reason =
            useEnglish
                ? section
                    ?.reason
                    ?.en
                : section
                    ?.reason
                    ?.zh;


        if (
            !section ||
            !reason
        ) {

            return buildExplanationUnavailable(
                target,
                normalizedLanguage
            );
        }


        const stringName =
            [
                section
                    ?.main
                    ?.brand,

                section
                    ?.main
                    ?.model
            ]
                .filter(
                    Boolean
                )
                .join(
                    " "
                );


        const gauge =
            section
                ?.main
                ?.gauge_mm ??
            null;


        const answer =
            useEnglish

                ? [
                    stringName
                        ? `String: ${stringName}${gauge ? ` ${gauge} mm` : ""}.`
                        : null,

                    `Reason: ${reason}`
                ]
                    .filter(
                        Boolean
                    )
                    .join(
                        "\n"
                    )

                : [
                    stringName
                        ? `球线：${stringName}${gauge ? ` ${gauge} mm` : ""}。`
                        : null,

                    `原因：${reason}`
                ]
                    .filter(
                        Boolean
                    )
                    .join(
                        "\n"
                    );


        return {
            engine:
                ENGINE_NAME,

            version:
                ENGINE_VERSION,

            response_mode:
                "explanation_focused",

            available:
                true,

            target,

            answer,

            data: {
                target,

                setup_type:
                    section
                        ?.setup_type ??
                    null,

                main:
                    section
                        ?.main ??
                    null,

                cross:
                    section
                        ?.cross ??
                    null,

                reason
            }
        };
    }


    /**
     * ========================================================
     * Tension Explanation
     * ========================================================
     */

    if (
        target ===
        "tension"
    ) {

        const section =
            explanation
                ?.recommendation
                ?.tension;


        const reason =
            useEnglish
                ? section
                    ?.reason
                    ?.en
                : section
                    ?.reason
                    ?.zh;


        if (
            !section ||
            section
                ?.main_lbs ===
                null ||
            section
                ?.main_lbs ===
                undefined ||
            !reason
        ) {

            return buildExplanationUnavailable(
                target,
                normalizedLanguage
            );
        }


        const range =
            section
                ?.working_range_lbs;


        const lines =
            useEnglish

                ? [
                    `Recommended tension: ${section.main_lbs} lbs.`,

                    (
                        range
                            ?.minimum_lbs !==
                            null &&
                        range
                            ?.minimum_lbs !==
                            undefined &&
                        range
                            ?.maximum_lbs !==
                            null &&
                        range
                            ?.maximum_lbs !==
                            undefined
                    )
                        ? `Working range: ${range.minimum_lbs}–${range.maximum_lbs} lbs.`
                        : null,

                    `Reason: ${reason}`
                ]

                : [
                    `建议磅数：${section.main_lbs} lbs。`,

                    (
                        range
                            ?.minimum_lbs !==
                            null &&
                        range
                            ?.minimum_lbs !==
                            undefined &&
                        range
                            ?.maximum_lbs !==
                            null &&
                        range
                            ?.maximum_lbs !==
                            undefined
                    )
                        ? `建议工作区间：${range.minimum_lbs}–${range.maximum_lbs} lbs。`
                        : null,

                    `原因：${reason}`
                ];


        return {
            engine:
                ENGINE_NAME,

            version:
                ENGINE_VERSION,

            response_mode:
                "explanation_focused",

            available:
                true,

            target,

            answer:
                lines
                    .filter(
                        Boolean
                    )
                    .join(
                        "\n"
                    ),

            data: {
                target,

                main_lbs:
                    section.main_lbs,

                cross_lbs:
                    section
                        ?.cross_lbs ??
                    null,

                working_range_lbs:
                    range ??
                    null,

                reason
            }
        };
    }


    /**
     * ========================================================
     * Setup Explanation
     * ========================================================
     */

    if (
        target ===
        "setup"
    ) {

        const reasons =
            Array.isArray(
                explanation
                    ?.why_this_setup
            )
                ? explanation
                    .why_this_setup
                : [];


        const localizedReasons =
            reasons
                .map(
                    item =>
                        useEnglish
                            ? item?.en
                            : item?.zh
                )
                .filter(
                    Boolean
                );


        if (
            localizedReasons.length ===
            0
        ) {

            return buildExplanationUnavailable(
                target,
                normalizedLanguage
            );
        }


        const heading =
            useEnglish
                ? "Why this setup:"
                : "为什么推荐这套配置：";


        const answer =
            [
                heading,

                ...localizedReasons
                    .map(
                        (
                            reason,
                            index
                        ) =>
                            `${index + 1}. ${reason}`
                    )
            ]
                .join(
                    "\n"
                );


        return {
            engine:
                ENGINE_NAME,

            version:
                ENGINE_VERSION,

            response_mode:
                "explanation_focused",

            available:
                true,

            target,

            answer,

            data: {
                target,

                reasons:
                    localizedReasons
            }
        };
    }


    /**
     * ========================================================
     * Overall Explanation Fallback
     * ========================================================
     */

    const summary =
        useEnglish
            ? explanation
                ?.summary
                ?.en
            : explanation
                ?.summary
                ?.zh;


    if (
        !summary
    ) {

        return buildExplanationUnavailable(
            null,
            normalizedLanguage
        );
    }


    return {
        engine:
            ENGINE_NAME,

        version:
            ENGINE_VERSION,

        response_mode:
            "explanation_focused",

        available:
            true,

        target:
            null,

        answer:
            summary,

        data: {
            target:
                null,

            summary
        }
    };
}


/**
 * ============================================================
 * Explanation Unavailable
 * ============================================================
 */

function buildExplanationUnavailable(
    target,
    language
) {

    return {
        engine:
            ENGINE_NAME,

        version:
            ENGINE_VERSION,

        response_mode:
            "explanation_focused",

        available:
            false,

        target:
            target ??
            null,

        answer:
            language === "en"
                ? "A focused explanation is not available yet."
                : "目前还没有足够信息提供这一部分的具体解释。",

        data: {
            target:
                target ??
                null
        }
    };
}


export default {
    buildTensionFocusedAnswer,
    buildExplanationFocusedAnswer
};
