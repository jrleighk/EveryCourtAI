/**
 * ============================================================
 * EveryCourtAI
 * Comparison Locale Adapter V1
 * ============================================================
 *
 * Purpose:
 *
 * Bridge canonical public locales to the existing internal
 * comparison source-language contract.
 *
 * Public locales:
 *
 * - en
 * - zh-CN
 * - zh-HK
 * - zh-TW
 * - ja
 *
 * Internal comparison source languages:
 *
 * - cn
 * - en
 *
 * Important:
 *
 * This adapter does NOT translate content.
 *
 * It only:
 *
 * 1. normalizes locale aliases
 * 2. preserves canonical locale identity
 * 3. selects the current internal source language
 * 4. exposes whether fallback is being used
 *
 * Japanese currently falls back to English until dedicated
 * Japanese comparison presentation is implemented.
 *
 * ============================================================
 */

const ENGINE_NAME =
    "comparison_locale_adapter";

const ENGINE_VERSION =
    "1.0";


export function normalizeComparisonLocale(
    locale
) {

    if (
        typeof locale !==
        "string"
    ) {
        return "en";
    }


    const normalized =
        locale
            .trim()
            .toLowerCase()
            .replace(/_/g, "-");


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
        normalized === "zh-tc" ||
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
        normalized === "en" ||
        normalized.startsWith(
            "en-"
        )
    ) {
        return "en";
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


export function resolveComparisonLocale(
    locale
) {

    const canonicalLocale =
        normalizeComparisonLocale(
            locale
        );


    switch (
        canonicalLocale
    ) {

        case "zh-CN":
            return {
                locale:
                    "zh-CN",

                source_language:
                    "cn",

                fallback:
                    false,

                fallback_locale:
                    null
            };


        case "zh-HK":
            return {
                locale:
                    "zh-HK",

                source_language:
                    "cn",

                fallback:
                    false,

                fallback_locale:
                    null
            };


        case "zh-TW":
            return {
                locale:
                    "zh-TW",

                source_language:
                    "cn",

                fallback:
                    false,

                fallback_locale:
                    null
            };


        case "ja":
            return {
                locale:
                    "ja",

                source_language:
                    "en",

                fallback:
                    true,

                fallback_locale:
                    "en"
            };


        case "en":
        default:
            return {
                locale:
                    "en",

                source_language:
                    "en",

                fallback:
                    false,

                fallback_locale:
                    null
            };
    }
}


export function selectComparisonLocalizedBranch(
    localizedValue,
    locale
) {

    if (
        !localizedValue ||
        typeof localizedValue !==
            "object"
    ) {
        return null;
    }


    const resolved =
        resolveComparisonLocale(
            locale
        );


    const primary =
        localizedValue[
            resolved.source_language
        ];


    if (
        primary !== null &&
        primary !== undefined
    ) {
        return primary;
    }


    const secondaryLanguage =
        resolved.source_language ===
            "cn"
            ? "en"
            : "cn";


    const secondary =
        localizedValue[
            secondaryLanguage
        ];


    return (
        secondary !== null &&
        secondary !== undefined
    )
        ? secondary
        : null;
}


/**
 * ============================================================
 * Localized Scalar Selector
 * ============================================================
 */

export function selectComparisonLocalizedValue(
    localizedValue,
    locale
) {

    if (
        !localizedValue ||
        typeof localizedValue !==
            "object"
    ) {
        return null;
    }


    const resolved =
        resolveComparisonLocale(
            locale
        );


    const primary =
        localizedValue[
            resolved.source_language
        ];


    if (
        typeof primary === "string" &&
        primary.trim()
    ) {
        return primary;
    }


    const secondaryLanguage =
        resolved.source_language ===
            "cn"
            ? "en"
            : "cn";


    const secondary =
        localizedValue[
            secondaryLanguage
        ];


    if (
        typeof secondary === "string" &&
        secondary.trim()
    ) {
        return secondary;
    }


    return null;
}


export default {
    normalizeComparisonLocale,
    resolveComparisonLocale,
    selectComparisonLocalizedBranch,
    selectComparisonLocalizedValue
};
