/**
 * ============================================================
 * EveryCourtAI
 * Comparison Clarification Answer Builder V1
 * ============================================================
 *
 * Purpose:
 *
 * Convert unresolved comparison targets into a useful,
 * deterministic clarification message.
 *
 * This module:
 *
 * - does NOT resolve products
 * - does NOT rank products
 * - does NOT guess ambiguous products
 * - only presents candidates already produced by resolver
 *
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


function normalizeLocale(
    locale
) {

    const value =
        safeString(
            locale
        );


    if (
        value === "zh-CN" ||
        value === "zh-HK" ||
        value === "zh-TW" ||
        value === "en" ||
        value === "ja"
    ) {

        return value;
    }


    const normalized =
        value.toLowerCase();


    if (
        normalized === "zh" ||
        normalized === "zh-cn" ||
        normalized === "zh-sg" ||
        normalized === "zh-hans"
    ) {

        return "zh-CN";
    }


    if (
        normalized === "zh-hk" ||
        normalized === "zh-mo" ||
        normalized === "zh-hant"
    ) {

        return "zh-HK";
    }


    if (
        normalized === "zh-tw"
    ) {

        return "zh-TW";
    }


    if (
        normalized === "ja" ||
        normalized.startsWith(
            "ja-"
        )
    ) {

        return "ja";
    }


    return "en";
}


function isChineseLocale(
    locale
) {

    return (
        locale === "zh-CN" ||
        locale === "zh-HK" ||
        locale === "zh-TW"
    );
}


function extractCandidateProduct(
    candidate
) {

    if (
        candidate?.product &&
        typeof candidate.product ===
            "object"
    ) {

        return candidate.product;
    }


    if (
        candidate &&
        typeof candidate ===
            "object"
    ) {

        return candidate;
    }


    return null;
}


function buildCandidateLabel(
    candidate,
    locale
) {

    const product =
        extractCandidateProduct(
            candidate
        );


    if (
        !product
    ) {

        return "";
    }


    const chinese =
        isChineseLocale(
            locale
        );


    const model =
        chinese
            ? (
                safeString(
                    product.model_cn
                ) ||
                safeString(
                    product.model
                )
            )
            : (
                safeString(
                    product.model
                ) ||
                safeString(
                    product.model_cn
                )
            );


    const brand =
        chinese
            ? (
                safeString(
                    product.brand_cn
                ) ||
                safeString(
                    product.brand
                )
            )
            : safeString(
                product.brand
            );


    if (
        !model
    ) {

        return "";
    }


    /*
     * Do not duplicate the brand if model already
     * contains it.
     */

    if (
        brand &&
        !model
            .toLowerCase()
            .includes(
                brand.toLowerCase()
            )
    ) {

        return `${brand} ${model}`;
    }


    return model;
}


function normalizeCandidateList(
    unresolvedTarget,
    locale,
    maxCandidates
) {

    const source =
        Array.isArray(
            unresolvedTarget
                ?.candidates
        )
            ? unresolvedTarget.candidates
            : [];


    const seen =
        new Set();


    const candidates =
        [];


    for (
        const candidate of source
    ) {

        const product =
            extractCandidateProduct(
                candidate
            );


        const id =
            safeString(
                product?.id
            );


        const label =
            buildCandidateLabel(
                candidate,
                locale
            );


        if (
            !id ||
            !label ||
            seen.has(
                id
            )
        ) {

            continue;
        }


        seen.add(
            id
        );


        candidates.push({
            id,
            label
        });


        if (
            candidates.length >=
            maxCandidates
        ) {

            break;
        }
    }


    return candidates;
}


export function buildComparisonClarificationAnswer({
    unresolvedTargets = [],
    locale = "en",
    maxCandidates = 5
} = {}) {

    const normalizedLocale =
        normalizeLocale(
            locale
        );


    const chinese =
        isChineseLocale(
            normalizedLocale
        );


    const unresolved =
        Array.isArray(
            unresolvedTargets
        )
            ? unresolvedTargets
            : [];


    const target =
        unresolved.find(
            item =>
                item?.status ===
                    "ambiguous"
        ) ??
        unresolved[0] ??
        null;


    if (
        !target
    ) {

        return {
            available:
                false,

            locale:
                normalizedLocale,

            answer:
                chinese
                    ? "我还不能唯一确定你要比较的球拍，请提供更完整的型号。"
                    : "I cannot uniquely identify the racquet yet. Please provide a more complete model name.",

            target:
                null,

            candidates:
                []
        };
    }


    const rawText =
        safeString(
            target.raw_text
        );


    const candidates =
        normalizeCandidateList(
            target,
            normalizedLocale,
            Math.max(
                1,
                Number(
                    maxCandidates
                ) || 5
            )
        );


    /*
     * Not-found target:
     * there are no trustworthy candidates to present.
     */

    if (
        target.status ===
            "not_found" ||
        candidates.length ===
            0
    ) {

        return {
            available:
                true,

            locale:
                normalizedLocale,

            answer:
                chinese
                    ? (
                        rawText
                            ? `我还无法识别“${rawText}”。请提供品牌、完整型号或年份。`
                            : "我还无法识别这支球拍。请提供品牌、完整型号或年份。"
                    )
                    : (
                        rawText
                            ? `I still cannot identify “${rawText}”. Please provide the brand, full model, or year.`
                            : "I still cannot identify the racquet. Please provide the brand, full model, or year."
                    ),

            target: {
                raw_text:
                    rawText,

                status:
                    target.status
            },

            candidates:
                []
        };
    }


    const lines =
        candidates.map(
            (
                candidate,
                index
            ) =>
                `${index + 1}. ${candidate.label}`
        );


    const answer =
        chinese
            ? [
                rawText
                    ? `我找到了多个可能的“${rawText}”型号。你指的是哪一款？`
                    : "我找到了多个可能的型号。你指的是哪一款？",
                "",
                ...lines,
                "",
                "你可以直接回复型号关键词，例如“Spectra 2026”或“Pure Drive 98”。"
            ].join(
                "\n"
            )
            : [
                rawText
                    ? `I found multiple possible “${rawText}” models. Which one do you mean?`
                    : "I found multiple possible models. Which one do you mean?",
                "",
                ...lines,
                "",
                "You can reply with a model keyword, for example “Spectra 2026” or “Pure Drive 98”."
            ].join(
                "\n"
            );


    return {
        available:
            true,

        locale:
            normalizedLocale,

        answer,

        target: {
            raw_text:
                rawText,

            status:
                target.status
        },

        candidates
    };
}


export default {
    buildComparisonClarificationAnswer
};
