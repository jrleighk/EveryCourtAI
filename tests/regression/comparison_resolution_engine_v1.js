import {
    resolveComparisonTargets
} from "../../engine/comparison_resolution_engine_v1.js";


const PRODUCT_A = {
    id:
        "babolat_pure_drive_spectra_edition_2026",

    brand:
        "Babolat",

    model:
        "Pure Drive Spectra Edition 2026"
};


const PRODUCT_B = {
    id:
        "wilson_rf_01_pro_classic",

    brand:
        "Wilson",

    model:
        "RF 01 Pro Classic"
};


const cases = [

    {
        id:
            "two_resolved",

        extraction: {
            detected:
                true,

            comparison_subtype:
                "direct_comparison",

            targets: [
                {
                    raw_text:
                        "Babolat Pure Drive Spectra Edition 2026",

                    status:
                        "resolved",

                    match:
                        PRODUCT_A,

                    candidates:
                        []
                },

                {
                    raw_text:
                        "Wilson RF 01 Pro Classic",

                    status:
                        "resolved",

                    match:
                        PRODUCT_B,

                    candidates:
                        []
                }
            ]
        },

        expected_status:
            "comparison_ready",

        expected_ready:
            true,

        expected_product_count:
            2,

        expected_unresolved_count:
            0,

        expected_subtype:
            "direct_comparison"
    },


    {
        id:
            "one_not_found",

        extraction: {
            detected:
                true,

            comparison_subtype:
                "direct_comparison",

            targets: [
                {
                    raw_text:
                        "Pure Drive",

                    status:
                        "not_found",

                    match:
                        null,

                    candidates: [
                        {
                            id:
                                "candidate_a"
                        }
                    ]
                },

                {
                    raw_text:
                        "RF01",

                    status:
                        "resolved",

                    match:
                        PRODUCT_B,

                    candidates:
                        []
                }
            ]
        },

        expected_status:
            "clarification_required",

        expected_ready:
            false,

        expected_product_count:
            1,

        expected_unresolved_count:
            1,

        expected_subtype:
            "direct_comparison"
    },


    {
        id:
            "one_ambiguous",

        extraction: {
            detected:
                true,

            comparison_subtype:
                "direct_comparison",

            targets: [
                {
                    raw_text:
                        "Pure Drive",

                    status:
                        "ambiguous",

                    match:
                        null,

                    candidates: [
                        {
                            id:
                                "candidate_a"
                        },

                        {
                            id:
                                "candidate_b"
                        }
                    ]
                },

                {
                    raw_text:
                        "RF01",

                    status:
                        "resolved",

                    match:
                        PRODUCT_B,

                    candidates:
                        []
                }
            ]
        },

        expected_status:
            "clarification_required",

        expected_ready:
            false,

        expected_product_count:
            1,

        expected_unresolved_count:
            1,

        expected_subtype:
            "direct_comparison"
    },


    {
        id:
            "not_detected",

        extraction: {
            detected:
                false,

            comparison_subtype:
                null,

            targets:
                []
        },

        expected_status:
            "comparison_not_ready",

        expected_ready:
            false,

        expected_product_count:
            0,

        expected_unresolved_count:
            0,

        expected_subtype:
            null
    },


    {
        id:
            "comparative_explanation_ready",

        extraction: {
            detected:
                true,

            comparison_subtype:
                "comparative_explanation",

            targets: [
                {
                    raw_text:
                        "Babolat Pure Drive Spectra Edition 2026",

                    status:
                        "resolved",

                    match:
                        PRODUCT_A,

                    candidates:
                        []
                },

                {
                    raw_text:
                        "Wilson RF 01 Pro Classic",

                    status:
                        "resolved",

                    match:
                        PRODUCT_B,

                    candidates:
                        []
                }
            ]
        },

        expected_status:
            "comparison_ready",

        expected_ready:
            true,

        expected_product_count:
            2,

        expected_unresolved_count:
            0,

        expected_subtype:
            "comparative_explanation"
    }
];


const results =
    cases.map(
        testCase => {

            const result =
                resolveComparisonTargets(
                    testCase.extraction
                );


            const checks = [

                result.status ===
                    testCase.expected_status,

                result.ready ===
                    testCase.expected_ready,

                result.products.length ===
                    testCase.expected_product_count,

                result.unresolved_targets.length ===
                    testCase.expected_unresolved_count,

                result.comparison_subtype ===
                    testCase.expected_subtype
            ];


            /**
             * When comparison is ready,
             * preserve ordered A/B identity.
             */

            if (
                testCase.expected_ready ===
                true
            ) {

                checks.push(
                    result.product_a?.id ===
                        PRODUCT_A.id
                );

                checks.push(
                    result.product_b?.id ===
                        PRODUCT_B.id
                );
            }


            return {
                id:
                    testCase.id,

                status:
                    result.status,

                ready:
                    result.ready,

                products:
                    result.products.length,

                unresolved:
                    result.unresolved_targets.length,

                subtype:
                    result.comparison_subtype,

                product_a:
                    result.product_a?.id ??
                    null,

                product_b:
                    result.product_b?.id ??
                    null,

                pass:
                    checks.every(
                        Boolean
                    )
            };
        }
    );


console.log(
    "========================================"
);

console.log(
    "COMPARISON RESOLUTION ENGINE V1"
);

console.log(
    "========================================"
);

console.table(
    results
);


const passed =
    results.filter(
        result =>
            result.pass
    ).length;


const failed =
    results.length -
    passed;


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
    `Total: ${results.length}`
);

console.log(
    `Passed: ${passed}`
);

console.log(
    `Failed: ${failed}`
);

console.log("");

console.log(
    failed === 0
        ? "RESULT: PASS"
        : "RESULT: FAIL"
);


if (
    failed >
    0
) {
    process.exit(
        1
    );
}
