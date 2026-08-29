import {
    normalizeComparisonLocale,
    resolveComparisonLocale,
    selectComparisonLocalizedValue
} from "../../engine/comparison_locale_adapter_v1.js";


let passed = 0;
let failed = 0;


function check(
    id,
    condition
) {

    const pass =
        Boolean(
            condition
        );


    console.log({
        id,
        pass
    });


    if (pass) {
        passed++;
    } else {
        failed++;
    }
}


/**
 * ============================================================
 * Canonical Locale Normalization
 * ============================================================
 */

check(
    "normalize_en",
    normalizeComparisonLocale(
        "en"
    ) === "en"
);


check(
    "normalize_en_us",
    normalizeComparisonLocale(
        "en-US"
    ) === "en"
);


check(
    "normalize_zh",
    normalizeComparisonLocale(
        "zh"
    ) === "zh-CN"
);


check(
    "normalize_zh_cn",
    normalizeComparisonLocale(
        "zh-CN"
    ) === "zh-CN"
);


check(
    "normalize_zh_hans",
    normalizeComparisonLocale(
        "zh-Hans"
    ) === "zh-CN"
);


check(
    "normalize_zh_hk",
    normalizeComparisonLocale(
        "zh-HK"
    ) === "zh-HK"
);


check(
    "normalize_zh_tc",
    normalizeComparisonLocale(
        "zh-tc"
    ) === "zh-HK"
);


check(
    "normalize_zh_hant",
    normalizeComparisonLocale(
        "zh-Hant"
    ) === "zh-HK"
);


check(
    "normalize_zh_tw",
    normalizeComparisonLocale(
        "zh-TW"
    ) === "zh-TW"
);


check(
    "normalize_ja",
    normalizeComparisonLocale(
        "ja"
    ) === "ja"
);


check(
    "normalize_ja_jp",
    normalizeComparisonLocale(
        "ja-JP"
    ) === "ja"
);


/**
 * ============================================================
 * Unknown / Invalid Locale Safety
 * ============================================================
 */

check(
    "invalid_locale_falls_back_en",
    normalizeComparisonLocale(
        "unknown-locale"
    ) === "en"
);


check(
    "null_locale_falls_back_en",
    normalizeComparisonLocale(
        null
    ) === "en"
);


/**
 * ============================================================
 * Source Language Routing
 * ============================================================
 */

const zhCN =
    resolveComparisonLocale(
        "zh-CN"
    );

const zhHK =
    resolveComparisonLocale(
        "zh-HK"
    );

const zhTW =
    resolveComparisonLocale(
        "zh-TW"
    );

const en =
    resolveComparisonLocale(
        "en"
    );

const ja =
    resolveComparisonLocale(
        "ja"
    );


check(
    "zh_cn_uses_cn_source",
    zhCN.source_language ===
        "cn"
);


check(
    "zh_hk_uses_cn_source",
    zhHK.source_language ===
        "cn"
);


check(
    "zh_tw_uses_cn_source",
    zhTW.source_language ===
        "cn"
);


check(
    "en_uses_en_source",
    en.source_language ===
        "en"
);


check(
    "ja_uses_en_source",
    ja.source_language ===
        "en"
);


/**
 * ============================================================
 * Locale Identity Preservation
 * ============================================================
 */

check(
    "zh_cn_identity_preserved",
    zhCN.locale ===
        "zh-CN"
);


check(
    "zh_hk_identity_preserved",
    zhHK.locale ===
        "zh-HK"
);


check(
    "zh_tw_identity_preserved",
    zhTW.locale ===
        "zh-TW"
);


check(
    "ja_identity_preserved",
    ja.locale ===
        "ja"
);


/**
 * ============================================================
 * Fallback Contract
 * ============================================================
 */

check(
    "zh_cn_not_fallback",
    zhCN.fallback ===
        false
);


check(
    "zh_hk_not_fallback",
    zhHK.fallback ===
        false
);


check(
    "zh_tw_not_fallback",
    zhTW.fallback ===
        false
);


check(
    "en_not_fallback",
    en.fallback ===
        false
);


check(
    "ja_is_fallback",
    ja.fallback ===
        true
);


check(
    "ja_fallback_locale_en",
    ja.fallback_locale ===
        "en"
);


/**
 * ============================================================
 * Localized Value Selection
 * ============================================================
 */

const bilingualValue = {
    cn: "中文内容",
    en: "English content"
};


check(
    "zh_cn_selects_cn",
    selectComparisonLocalizedValue(
        bilingualValue,
        "zh-CN"
    ) === "中文内容"
);


check(
    "zh_hk_selects_cn",
    selectComparisonLocalizedValue(
        bilingualValue,
        "zh-HK"
    ) === "中文内容"
);


check(
    "zh_tw_selects_cn",
    selectComparisonLocalizedValue(
        bilingualValue,
        "zh-TW"
    ) === "中文内容"
);


check(
    "en_selects_en",
    selectComparisonLocalizedValue(
        bilingualValue,
        "en"
    ) === "English content"
);


check(
    "ja_selects_en_fallback",
    selectComparisonLocalizedValue(
        bilingualValue,
        "ja"
    ) === "English content"
);


/**
 * ============================================================
 * Missing Primary Source Fallback
 * ============================================================
 */

check(
    "missing_cn_falls_back_en",
    selectComparisonLocalizedValue(
        {
            cn: "",
            en: "English fallback"
        },
        "zh-CN"
    ) === "English fallback"
);


check(
    "missing_en_falls_back_cn",
    selectComparisonLocalizedValue(
        {
            cn: "中文 fallback",
            en: ""
        },
        "en"
    ) === "中文 fallback"
);


check(
    "invalid_localized_value_returns_null",
    selectComparisonLocalizedValue(
        null,
        "en"
    ) === null
);


/**
 * ============================================================
 * Summary
 * ============================================================
 */

console.log("");
console.log(
    "========================================"
);
console.log(
    "REGRESSION SUMMARY"
);
console.log(
    "========================================"
);

console.log(
    `Total: ${passed + failed}`
);

console.log(
    `Passed: ${passed}`
);

console.log(
    `Failed: ${failed}`
);

console.log(
    failed === 0
        ? "RESULT: PASS"
        : "RESULT: FAIL"
);


process.exitCode =
    failed === 0
        ? 0
        : 1;
