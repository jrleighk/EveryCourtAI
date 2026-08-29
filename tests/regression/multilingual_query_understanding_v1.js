import {
    normalizeMultilingualComparisonQuery
} from "../../engine/multilingual_comparison_query_v1.js";


import {
    detectQuestionIntent
} from "../../engine/question_intent_engine.js";


import {
    extractComparisonTargets
} from "../../engine/comparison_target_extractor_v1.js";


const productA =
    "babolat_pure_drive_spectra_edition_2026";

const productB =
    "wilson_rf_01_pro_classic";


const cases = [

    {
        id:
            "english_and",

        locale:
            "en",

        message:
            "Compare Pure Drive Spectra 2026 and RF01 Pro Classic"
    },

    {
        id:
            "simplified_chinese",

        locale:
            "zh-CN",

        message:
            "比较 Pure Drive Spectra 2026 和 RF01 Pro Classic"
    },

    {
        id:
            "traditional_chinese",

        locale:
            "zh-HK",

        message:
            "比較 Pure Drive Spectra 2026 與 RF01 Pro Classic"
    },

    {
        id:
            "french_et",

        locale:
            "fr",

        message:
            "Comparez la Pure Drive Spectra 2026 et la RF01 Pro Classic."
    },

    {
        id:
            "french_avec",

        locale:
            "fr",

        message:
            "Comparez la Pure Drive Spectra 2026 avec la RF01 Pro Classic."
    },

    {
        id:
            "spanish_y",

        locale:
            "es",

        message:
            "Compara la Pure Drive Spectra 2026 y la RF01 Pro Classic."
    },

    {
        id:
            "spanish_con",

        locale:
            "es",

        message:
            "Compara la Pure Drive Spectra 2026 con la RF01 Pro Classic."
    },

    {
        id:
            "japanese_compare",

        locale:
            "ja",

        message:
            "Pure Drive Spectra 2026 と RF01 Pro Classic を比較"
    },

    {
        id:
            "japanese_compare_request",

        locale:
            "ja",

        message:
            "Pure Drive Spectra 2026 と RF01 Pro Classic を比べて"
    },

    {
        id:
            "japanese_compare_suru_browser",

        locale:
            "ja",

        message:
            "Pure Drive Spectra 2026とRF01 Pro Classicを比較する"
    },

    {
        id:
            "japanese_compare_shite_no_spaces",

        locale:
            "ja",

        message:
            "Pure Drive Spectra 2026とRF01 Pro Classicを比較して"
    }
];


const rows = [];


for (
    const testCase
    of cases
) {

    const normalized =
        normalizeMultilingualComparisonQuery(
            testCase.message
        );


    const intent =
        detectQuestionIntent(
            testCase.message
        );


    const extraction =
        extractComparisonTargets(
            testCase.message
        );


    const ids =
        extraction.targets
            .map(
                target =>
                    target.match?.id ??
                    null
            );


    const pass =
        normalized.detected ===
            true &&
        normalized.locale ===
            testCase.locale &&
        normalized.targets.length ===
            2 &&
        intent.primary_intent ===
            "compare_products" &&
        intent.context?.comparison ===
            true &&
        extraction.detected ===
            true &&
        extraction.targets.length ===
            2 &&
        extraction.comparison_ready ===
            true &&
        ids[0] ===
            productA &&
        ids[1] ===
            productB;


    rows.push({

        id:
            testCase.id,

        locale:
            normalized.locale,

        normalized:
            normalized.detected,

        intent:
            intent.primary_intent,

        extraction:
            extraction.detected,

        count:
            extraction.targets.length,

        ids:
            ids.join(
                " | "
            ),

        ready:
            extraction.comparison_ready,

        pass
    });
}


const negativeCases = [

    {
        id:
            "french_non_comparison",

        message:
            "J'utilise une Pure Drive et je veux plus de contrôle."
    },

    {
        id:
            "spanish_non_comparison",

        message:
            "Uso una Pure Drive y quiero más control."
    },

    {
        id:
            "japanese_non_comparison",

        message:
            "Pure Driveを使っています。もっとコントロールが欲しいです。"
    }
];


for (
    const testCase
    of negativeCases
) {

    const normalized =
        normalizeMultilingualComparisonQuery(
            testCase.message
        );


    const extraction =
        extractComparisonTargets(
            testCase.message
        );


    const pass =
        normalized.detected ===
            false &&
        extraction.detected ===
            false;


    rows.push({

        id:
            testCase.id,

        locale:
            normalized.locale,

        normalized:
            normalized.detected,

        intent:
            null,

        extraction:
            extraction.detected,

        count:
            extraction.targets.length,

        ids:
            "",

        ready:
            extraction.comparison_ready,

        pass
    });
}


const failed =
    rows.filter(
        row =>
            !row.pass
    );


console.log(
    "========================================"
);

console.log(
    "MULTILINGUAL QUERY UNDERSTANDING V1"
);

console.log(
    "========================================"
);

console.table(
    rows
);


console.log("");

console.log(
    "Total:",
    rows.length
);

console.log(
    "Passed:",
    rows.length -
        failed.length
);

console.log(
    "Failed:",
    failed.length
);


if (
    failed.length >
    0
) {

    console.log("");
    console.log(
        "FAILED:"
    );

    console.table(
        failed
    );

    process.exitCode =
        1;

} else {

    console.log("");
    console.log(
        "RESULT: PASS"
    );

}
