/**
 * ============================================================
 * EveryCourtAI
 * Multilingual Comparison Query V1
 * ============================================================
 *
 * Purpose:
 *
 * Normalize explicit racquet comparison commands across the
 * six frontend locales into one canonical comparison contract.
 *
 * Supported locale families:
 *
 * - English
 * - 简体中文
 * - 繁體中文
 * - Français
 * - Español
 * - 日本語
 *
 * This module does NOT resolve products.
 * It only detects explicit comparison grammar and extracts the
 * two raw product target strings.
 * ============================================================
 */


const MODULE_NAME =
    "multilingual_comparison_query";

const MODULE_VERSION =
    "1.0";


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


function cleanTarget(
    value,
    locale
) {
    let text =
        safeString(
            value
        )
            .replace(
                /^[\s，。！？、；：,.!?;:]+|[\s，。！？、；：,.!?;:]+$/g,
                ""
            )
            .trim();


    /**
     * French / Spanish natural questions often include
     * grammatical articles before product names:
     *
     * Comparez la Pure Drive ... et la RF01 ...
     * Compara la Pure Drive ... y la RF01 ...
     *
     * Articles are presentation grammar, not product identity.
     */

    if (
        locale === "fr"
    ) {

        text =
            text.replace(
                /^(?:la|le|les)\s+/i,
                ""
            );

        text =
            text.replace(
                /^l['’]\s*/i,
                ""
            );
    }


    if (
        locale === "es"
    ) {

        text =
            text.replace(
                /^(?:el|la|los|las)\s+/i,
                ""
            );
    }


    return text.trim();
}


function buildResult({
    detected = false,
    locale = null,
    targets = []
} = {}) {

    const normalizedTargets =
        Array.isArray(
            targets
        )
            ? targets
                .map(
                    target =>
                        cleanTarget(
                            target,
                            locale
                        )
                )
                .filter(
                    Boolean
                )
            : [];


    return {

        module:
            MODULE_NAME,

        version:
            MODULE_VERSION,

        detected:
            detected === true &&
            normalizedTargets.length === 2,

        locale,

        comparison_subtype:
            detected === true &&
            normalizedTargets.length === 2
                ? "direct_comparison"
                : null,

        targets:
            normalizedTargets,

        canonical_message:
            detected === true &&
            normalizedTargets.length === 2
                ? `${normalizedTargets[0]} vs ${normalizedTargets[1]}`
                : null
    };
}


export function normalizeMultilingualComparisonQuery(
    message
) {

    const text =
        safeString(
            message
        );


    if (!text) {
        return buildResult();
    }


    /**
     * ========================================================
     * English
     * ========================================================
     *
     * Compare A and B
     * Compare A with B
     * Compare A vs B
     * Compare A versus B
     */

    const english =
        text.match(
            /^(?:please\s+)?compare\s+(.+?)\s+(?:and|with|vs\.?|versus)\s+(.+?)[.!?]*$/i
        );


    if (english) {

        return buildResult({
            detected:
                true,

            locale:
                "en",

            targets: [
                english[1],
                english[2]
            ]
        });
    }


    /**
     * ========================================================
     * Simplified / Traditional Chinese
     * ========================================================
     *
     * 比较 A 和 B
     * 请比较 A 和 B
     * 比較 A 與 B
     * 請幫我比較 A 與 B
     */

    const chinese =
        text.match(
            /^(?:(?:请|請)(?:帮我|幫我)?|(?:帮我|幫我))?(?:比较|比較)\s*(.+?)\s*(?:和|与|與|跟)\s*(.+?)[。！？!?]*$/i
        );


    if (chinese) {

        const isTraditional =
            /[請幫較與]/.test(
                text
            ) ||
            text.includes(
                "比較"
            );


        return buildResult({
            detected:
                true,

            locale:
                isTraditional
                    ? "zh-HK"
                    : "zh-CN",

            targets: [
                chinese[1],
                chinese[2]
            ]
        });
    }


    /**
     * ========================================================
     * French
     * ========================================================
     *
     * Comparez A et B
     * Comparez A avec B
     * Comparer A et B
     */

    const french =
        text.match(
            /^(?:comparez|comparer)\s+(.+?)\s+(?:et|avec)\s+(.+?)[.!?…]*$/i
        );


    if (french) {

        return buildResult({
            detected:
                true,

            locale:
                "fr",

            targets: [
                french[1],
                french[2]
            ]
        });
    }


    /**
     * ========================================================
     * Spanish
     * ========================================================
     *
     * Compara A y B
     * Compara A con B
     * Comparar A con B
     */

    const spanish =
        text.match(
            /^(?:compara|comparar)\s+(.+?)\s+(?:y|con)\s+(.+?)[.!?¡¿]*$/i
        );


    if (spanish) {

        return buildResult({
            detected:
                true,

            locale:
                "es",

            targets: [
                spanish[1],
                spanish[2]
            ]
        });
    }


    /**
     * ========================================================
     * Japanese
     * ========================================================
     *
     * A と B を比較
     * A と B を比較して
     * A と B を比べて
     */

    const japanese =
        text.match(
            /^(.+?)\s*と\s*(.+?)\s*(?:を)?(?:比較(?:して)?|比べて)(?:ください)?[。！？!?]*$/i
        );


    if (japanese) {

        return buildResult({
            detected:
                true,

            locale:
                "ja",

            targets: [
                japanese[1],
                japanese[2]
            ]
        });
    }


    return buildResult();
}


export function isExplicitMultilingualComparisonQuery(
    message
) {

    return normalizeMultilingualComparisonQuery(
        message
    ).detected;
}


export default {
    normalizeMultilingualComparisonQuery,
    isExplicitMultilingualComparisonQuery
};
