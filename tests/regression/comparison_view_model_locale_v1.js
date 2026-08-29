import {
    runComparisonOrchestrator
} from "../../engine/comparison_orchestrator_v1.js";

import {
    buildComparisonViewModel
} from "../../engine/comparison_view_model_v1.js";


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
 * Build One Stable Comparison Result
 * ============================================================
 */

const comparison =
    await runComparisonOrchestrator({
        message:
            "比较 Babolat Pure Drive Spectra Edition 2026 和 Wilson RF 01 Pro Classic",

        language:
            "en"
    });


check(
    "orchestrator_ready",
    comparison?.success === true &&
    comparison?.ready === true &&
    comparison?.status ===
        "comparison_orchestrator_ready"
);


/**
 * ============================================================
 * Build Canonical Locale Views
 * ============================================================
 */

const zhCN =
    buildComparisonViewModel(
        comparison,
        "zh-CN"
    );

const zhHK =
    buildComparisonViewModel(
        comparison,
        "zh-HK"
    );

const zhTW =
    buildComparisonViewModel(
        comparison,
        "zh-TW"
    );

const en =
    buildComparisonViewModel(
        comparison,
        "en"
    );

const ja =
    buildComparisonViewModel(
        comparison,
        "ja"
    );


/**
 * ============================================================
 * zh-CN
 * ============================================================
 */

check(
    "zh_cn_view_ready",
    zhCN?.available === true
);

check(
    "zh_cn_locale_identity",
    zhCN?.language ===
        "zh-CN" &&
    zhCN?.locale?.code ===
        "zh-CN"
);

check(
    "zh_cn_source_language",
    zhCN?.locale
        ?.source_language ===
        "cn"
);

check(
    "zh_cn_no_fallback",
    zhCN?.locale?.fallback ===
        false &&
    zhCN?.locale
        ?.fallback_locale ===
        null
);


/**
 * ============================================================
 * zh-HK
 * ============================================================
 */

check(
    "zh_hk_view_ready",
    zhHK?.available === true
);

check(
    "zh_hk_locale_identity",
    zhHK?.language ===
        "zh-HK" &&
    zhHK?.locale?.code ===
        "zh-HK"
);

check(
    "zh_hk_source_language",
    zhHK?.locale
        ?.source_language ===
        "cn"
);

check(
    "zh_hk_no_fallback",
    zhHK?.locale?.fallback ===
        false
);


/**
 * ============================================================
 * zh-TW
 * ============================================================
 */

check(
    "zh_tw_view_ready",
    zhTW?.available === true
);

check(
    "zh_tw_locale_identity",
    zhTW?.language ===
        "zh-TW" &&
    zhTW?.locale?.code ===
        "zh-TW"
);

check(
    "zh_tw_source_language",
    zhTW?.locale
        ?.source_language ===
        "cn"
);

check(
    "zh_tw_no_fallback",
    zhTW?.locale?.fallback ===
        false
);


/**
 * ============================================================
 * English
 * ============================================================
 */

check(
    "en_view_ready",
    en?.available === true
);

check(
    "en_locale_identity",
    en?.language === "en" &&
    en?.locale?.code === "en"
);

check(
    "en_source_language",
    en?.locale
        ?.source_language ===
        "en"
);

check(
    "en_no_fallback",
    en?.locale?.fallback ===
        false
);


/**
 * ============================================================
 * Japanese Fallback
 * ============================================================
 */

check(
    "ja_view_ready",
    ja?.available === true
);

check(
    "ja_locale_identity_preserved",
    ja?.language === "ja" &&
    ja?.locale?.code === "ja"
);

check(
    "ja_uses_en_source",
    ja?.locale
        ?.source_language ===
        "en"
);

check(
    "ja_fallback_enabled",
    ja?.locale?.fallback ===
        true
);

check(
    "ja_fallback_locale_en",
    ja?.locale
        ?.fallback_locale ===
        "en"
);


/**
 * ============================================================
 * Presentation Selection
 * ============================================================
 */

check(
    "chinese_locales_share_current_cn_source",
    zhCN?.summary?.title ===
        zhHK?.summary?.title &&
    zhCN?.summary?.title ===
        zhTW?.summary?.title
);

check(
    "japanese_currently_matches_en_fallback",
    ja?.summary?.title ===
        en?.summary?.title
);


/**
 * ============================================================
 * Locale Identity Must Stay Distinct
 * ============================================================
 */

check(
    "hk_tw_locale_identity_distinct",
    zhHK?.language !==
        zhTW?.language
);

check(
    "cn_hk_locale_identity_distinct",
    zhCN?.language !==
        zhHK?.language
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


if (failed === 0) {

    console.log(
        "RESULT: PASS"
    );

    process.exit(0);

} else {

    console.log(
        "RESULT: FAIL"
    );

    process.exit(1);
}
