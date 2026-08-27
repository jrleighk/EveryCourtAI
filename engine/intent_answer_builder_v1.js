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


export default {
    buildTensionFocusedAnswer
};
