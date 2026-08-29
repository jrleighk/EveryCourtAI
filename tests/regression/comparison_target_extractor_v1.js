import {
    extractComparisonTargets
} from "../../engine/comparison_target_extractor_v1.js";


const cases = [

    {
        id:
            "full_models_cn",

        message:
            "Babolat Pure Drive Spectra Edition 2026 和 Wilson RF 01 Pro Classic 哪个更适合我？",

        expected_detected:
            true,

        expected_count:
            2,

        expected_ids: [
            "babolat_pure_drive_spectra_edition_2026",
            "wilson_rf_01_pro_classic"
        ],

        expected_ready:
            true
    },

    {
        id:
            "short_names_cn",

        message:
            "Pure Drive 和 RF01 哪个更适合我？",

        expected_detected:
            true,

        expected_count:
            2
    },

    {
        id:
            "compare_command_cn",

        message:
            "请比较 Pure Drive 和 RF01。",

        expected_detected:
            true,

        expected_count:
            2
    },

    {
        id:
            "vs_en",

        message:
            "Babolat Pure Drive Spectra Edition 2026 vs Wilson RF 01 Pro Classic",

        expected_detected:
            true,

        expected_count:
            2,

        expected_ids: [
            "babolat_pure_drive_spectra_edition_2026",
            "wilson_rf_01_pro_classic"
        ],

        expected_ready:
            true
    },

    {
        id:
            "versus_en",

        message:
            "Compare Babolat Pure Drive Spectra Edition 2026 versus Wilson RF 01 Pro Classic",

        expected_detected:
            true,

        expected_count:
            2,

        expected_ids: [
            "babolat_pure_drive_spectra_edition_2026",
            "wilson_rf_01_pro_classic"
        ],

        expected_ready:
            true
    },

    {
        id:
            "and_en",

        message:
            "Compare Babolat Pure Drive Spectra Edition 2026 and Wilson RF 01 Pro Classic",

        expected_detected:
            true,

        expected_count:
            2,

        expected_ids: [
            "babolat_pure_drive_spectra_edition_2026",
            "wilson_rf_01_pro_classic"
        ],

        expected_subtype:
            "direct_comparison",

        expected_ready:
            true
    },

    {
        id:
            "with_en",

        message:
            "Compare Babolat Pure Drive Spectra Edition 2026 with Wilson RF 01 Pro Classic",

        expected_detected:
            true,

        expected_count:
            2,

        expected_ids: [
            "babolat_pure_drive_spectra_edition_2026",
            "wilson_rf_01_pro_classic"
        ],

        expected_subtype:
            "direct_comparison",

        expected_ready:
            true
    },

    {
        id:
            "comparative_explanation_full_cn",

        message:
            "为什么 Babolat Pure Drive Spectra Edition 2026 比 Wilson RF 01 Pro Classic 更适合我？",

        expected_detected:
            true,

        expected_count:
            2,

        expected_ids: [
            "babolat_pure_drive_spectra_edition_2026",
            "wilson_rf_01_pro_classic"
        ],

        expected_subtype:
            "comparative_explanation",

        expected_ready:
            true
    },

    {
        id:
            "comparative_explanation_short_cn",

        message:
            "为什么 Pure Drive 比 RF01 更适合我？",

        expected_detected:
            true,

        expected_count:
            2,

        expected_subtype:
            "comparative_explanation",

        expected_ready:
            false
    },

    {
        id:
            "single_product_not_comparison",

        message:
            "Wilson RF 01 Pro Classic 适合我吗？",

        expected_detected:
            false,

        expected_count:
            0,

        expected_ready:
            false
    }
];


let passed =
    0;


const rows =
    [];


for (
    const testCase
    of cases
) {

    const result =
        extractComparisonTargets(
            testCase.message
        );


    const actualIds =
        result.targets
            .map(
                target =>
                    target.match
                        ?.id ??
                    null
            );


    let pass =
        result.detected ===
            testCase.expected_detected &&
        result.targets.length ===
            testCase.expected_count;


    if (
        Array.isArray(
            testCase.expected_ids
        )
    ) {

        pass =
            pass &&
            actualIds.length ===
                testCase.expected_ids.length &&
            actualIds.every(
                (
                    id,
                    index
                ) =>
                    id ===
                    testCase
                        .expected_ids[
                            index
                        ]
            );
    }


    if (
        typeof testCase
            .expected_ready ===
        "boolean"
    ) {

        pass =
            pass &&
            result.comparison_ready ===
                testCase.expected_ready;
    }


    if (
        typeof testCase
            .expected_subtype ===
        "string"
    ) {

        pass =
            pass &&
            result.comparison_subtype ===
                testCase.expected_subtype;
    }


    if (pass) {
        passed +=
            1;
    }


    rows.push({

        id:
            testCase.id,

        detected:
            result.detected,

        count:
            result.targets.length,

        statuses:
            result.targets
                .map(
                    target =>
                        target.status
                )
                .join(
                    " | "
                ),

        ids:
            actualIds.join(
                " | "
            ),

        subtype:
            result.comparison_subtype,

        not_found:
            result.not_found_count,

        ready:
            result.comparison_ready,

        pass
    });
}


console.log(
    "========================================"
);

console.log(
    "COMPARISON TARGET EXTRACTOR V1"
);

console.log(
    "========================================"
);

console.table(
    rows
);


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
    `Total: ${cases.length}`
);

console.log(
    `Passed: ${passed}`
);

console.log(
    `Failed: ${cases.length - passed}`
);

console.log("");

console.log(
    passed ===
        cases.length
        ? "RESULT: PASS"
        : "RESULT: FAIL"
);


if (
    passed !==
    cases.length
) {
    process.exit(
        1
    );
}
