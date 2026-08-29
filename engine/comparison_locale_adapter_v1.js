/**
 * ============================================================
 * EveryCourtAI
 * Comparison Locale Adapter V1
 * ============================================================
 *
 * Purpose:
 *
 * Bridge canonical public locales to comparison presentation
 * source languages.
 *
 * Canonical public locales:
 *
 * - en
 * - zh-CN
 * - zh-HK
 * - fr
 * - es
 * - ja
 *
 * Comparison source languages:
 *
 * - en
 * - cn
 * - fr
 * - es
 * - ja
 *
 * Important:
 *
 * This adapter does NOT translate content.
 *
 * It only:
 *
 * 1. normalizes locale aliases
 * 2. preserves canonical locale identity
 * 3. selects the matching comparison source language
 * 4. exposes whether locale fallback is being used
 *
 * Traditional Chinese currently shares the canonical Chinese
 * comparison narrative source. zh-TW remains an alias of zh-HK.
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
        normalized === "zh-hant" ||
        normalized === "zh-tw"
    ) {
        return "zh-HK";
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
        normalized === "fr" ||
        normalized.startsWith(
            "fr-"
        )
    ) {
        return "fr";
    }


    if (
        normalized === "es" ||
        normalized.startsWith(
            "es-"
        )
    ) {
        return "es";
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


        case "fr":
            return {
                locale:
                    "fr",

                source_language:
                    "fr",

                fallback:
                    false,

                fallback_locale:
                    null
            };


        case "es":
            return {
                locale:
                    "es",

                source_language:
                    "es",

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
                    "ja",

                fallback:
                    false,

                fallback_locale:
                    null
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


function buildComparisonLanguagePriority(
    sourceLanguage
) {

    return Array.from(
        new Set(
            [
                sourceLanguage,
                "en",
                "cn"
            ]
        )
    );
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


    const languages =
        buildComparisonLanguagePriority(
            resolved.source_language
        );


    for (
        const language
        of languages
    ) {

        const value =
            localizedValue[
                language
            ];


        if (
            value !== null &&
            value !== undefined
        ) {
            return value;
        }
    }


    return null;
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


    const languages =
        buildComparisonLanguagePriority(
            resolved.source_language
        );


    for (
        const language
        of languages
    ) {

        const value =
            localizedValue[
                language
            ];


        if (
            typeof value ===
                "string" &&
            value.trim()
        ) {
            return value;
        }
    }


    return null;
}


export default {
    normalizeComparisonLocale,
    resolveComparisonLocale,
    selectComparisonLocalizedBranch,
    selectComparisonLocalizedValue
};
