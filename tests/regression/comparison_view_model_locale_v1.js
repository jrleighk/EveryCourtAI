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

const fr =
    buildComparisonViewModel(
        comparison,
        "fr"
    );

const es =
    buildComparisonViewModel(
        comparison,
        "es"
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
    "zh_tw_aliases_to_zh_hk",
    zhTW?.language ===
        "zh-HK" &&
    zhTW?.locale?.code ===
        "zh-HK"
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
 * French Native Locale
 * ============================================================
 */

check(
    "fr_view_ready",
    fr?.available === true
);

check(
    "fr_locale_identity_preserved",
    fr?.language === "fr" &&
    fr?.locale?.code === "fr"
);

check(
    "fr_uses_native_source",
    fr?.locale?.source_language ===
        "fr"
);

check(
    "fr_no_fallback",
    fr?.locale?.fallback === false &&
    fr?.locale?.fallback_locale ===
        null
);


/**
 * ============================================================
 * Spanish Native Locale
 * ============================================================
 */

check(
    "es_view_ready",
    es?.available === true
);

check(
    "es_locale_identity_preserved",
    es?.language === "es" &&
    es?.locale?.code === "es"
);

check(
    "es_uses_native_source",
    es?.locale?.source_language ===
        "es"
);

check(
    "es_no_fallback",
    es?.locale?.fallback === false &&
    es?.locale?.fallback_locale ===
        null
);


/**
 * ============================================================
 * Japanese Native Locale
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
    "ja_uses_native_source",
    ja?.locale
        ?.source_language ===
        "ja"
);

check(
    "ja_no_fallback",
    ja?.locale?.fallback ===
        false
);

check(
    "ja_fallback_locale_null",
    ja?.locale
        ?.fallback_locale ===
        null
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
    "french_locale_view_available",
    typeof fr?.summary?.title ===
        "string"
);

check(
    "spanish_locale_view_available",
    typeof es?.summary?.title ===
        "string"
);

check(
    "japanese_locale_view_available",
    typeof ja?.summary?.title ===
        "string"
);


/**
 * ============================================================
 * Locale Identity Must Stay Distinct
 * ============================================================
 */

check(
    "hk_tw_locale_identity_unified",
    zhHK?.language ===
        zhTW?.language &&
    zhHK?.locale?.code ===
        zhTW?.locale?.code
);

check(
    "cn_hk_locale_identity_distinct",
    zhCN?.language !==
        zhHK?.language
);


/**
 * ============================================================
 * Native Narrative Content Contract
 * ============================================================
 */

const getNarrativeText = (
    view
) =>
    Array.isArray(
        view
            ?.summary
            ?.narrative
    )
        ? view
            .summary
            .narrative
            .map(
                item =>
                    item?.text ?? ""
            )
            .join(" ")
        : "";


const zhCNNarrative =
    getNarrativeText(
        zhCN
    );

const zhHKNarrative =
    getNarrativeText(
        zhHK
    );

const enNarrative =
    getNarrativeText(
        en
    );

const frNarrative =
    getNarrativeText(
        fr
    );

const esNarrative =
    getNarrativeText(
        es
    );

const jaNarrative =
    getNarrativeText(
        ja
    );


check(
    "zh_cn_narrative_is_chinese",
    /[\u4e00-\u9fff]/.test(
        zhCNNarrative
    ) &&
    !zhCNNarrative.includes(
        "is lighter in static weight"
    )
);


check(
    "zh_hk_narrative_uses_chinese_source",
    /[\u4e00-\u9fff]/.test(
        zhHKNarrative
    ) &&
    !zhHKNarrative.includes(
        "is lighter in static weight"
    )
);


check(
    "en_narrative_is_english",
    enNarrative.includes(
        "is lighter in static weight"
    ) ||
    enNarrative.includes(
        "has the larger head size"
    ) ||
    enNarrative.includes(
        "leans more toward"
    )
);


check(
    "fr_narrative_is_native",
    frNarrative.includes(
        "plus légère"
    ) ||
    frNarrative.includes(
        "tamis"
    ) ||
    frNarrative.includes(
        "privilégie"
    )
);


check(
    "es_narrative_is_native",
    esNarrative.includes(
        "más ligera"
    ) ||
    esNarrative.includes(
        "cabeza más grande"
    ) ||
    esNarrative.includes(
        "se orienta"
    )
);


check(
    "ja_narrative_is_native",
    /[\u3040-\u30ff]/.test(
        jaNarrative
    ) ||
    jaNarrative.includes(
        "安定"
    ) ||
    jaNarrative.includes(
        "パワー"
    )
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
