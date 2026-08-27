import {
    analyzeRacquetComparison
} from "../../engine/comparison_analysis_engine_v1.js";

import {
    loadComparisonPair
} from "../../engine/comparison_product_loader_v1.js";


function assert(
    condition,
    message
) {
    if (!condition) {
        throw new Error(
            message
        );
    }
}


async function run() {

    console.log(
        "========================================"
    );

    console.log(
        "COMPARISON ANALYSIS ENGINE V1"
    );

    console.log(
        "========================================"
    );


    const loaded =
        await loadComparisonPair(
            "babolat_pure_drive_spectra_edition_2026",
            "wilson_rf_01_pro_classic"
        );


    assert(
        loaded?.success === true,
        "comparison pair must load"
    );


    const result =
        analyzeRacquetComparison(
            loaded.product_a.product,
            loaded.product_b.product
        );


    const checks = [
        {
            id:
                "comparison_ready",

            pass:
                result.success === true &&
                result.status ===
                    "comparison_ready"
        },

        {
            id:
                "product_identity",

            pass:
                result.product_a?.id ===
                    "babolat_pure_drive_spectra_edition_2026" &&
                result.product_b?.id ===
                    "wilson_rf_01_pro_classic"
        },

        {
            id:
                "power_delta",

            pass:
                result.dna?.power
                    ?.available === true &&
                result.dna?.power
                    ?.value_a === 9 &&
                result.dna?.power
                    ?.value_b === 8 &&
                result.dna?.power
                    ?.delta === 1 &&
                result.dna?.power
                    ?.relation ===
                    "a_higher"
        },

        {
            id:
                "control_delta",

            pass:
                result.dna?.control
                    ?.available === true &&
                result.dna?.control
                    ?.delta === -2 &&
                result.dna?.control
                    ?.relation ===
                    "b_higher"
        },

        {
            id:
                "spin_equal",

            pass:
                result.dna?.spin
                    ?.available === true &&
                result.dna?.spin
                    ?.delta === 0 &&
                result.dna?.spin
                    ?.relation ===
                    "equal"
        },

        {
            id:
                "missing_dna_preserved",

            pass:
                result.dna?.stability
                    ?.available === false &&
                result.dna?.stability
                    ?.relation ===
                    "unavailable" &&
                result.dna?.forgiveness
                    ?.available === false &&
                result.dna?.forgiveness
                    ?.relation ===
                    "unavailable"
        },

        {
            id:
                "weight_delta",

            pass:
                result.specifications
                    ?.weight_unstrung_g
                    ?.available === true &&
                result.specifications
                    ?.weight_unstrung_g
                    ?.delta === -20 &&
                result.specifications
                    ?.weight_unstrung_g
                    ?.relation ===
                    "b_higher"
        },

        {
            id:
                "swingweight_delta",

            pass:
                result.specifications
                    ?.swingweight
                    ?.available === true &&
                result.specifications
                    ?.swingweight
                    ?.delta === -45 &&
                result.specifications
                    ?.swingweight
                    ?.relation ===
                    "b_higher"
        },

        {
            id:
                "string_pattern_equal",

            pass:
                result.specifications
                    ?.string_pattern
                    ?.available === true &&
                result.specifications
                    ?.string_pattern
                    ?.relation ===
                    "equal"
        },

        {
            id:
                "missing_spec_preserved",

            pass:
                result.specifications
                    ?.stiffness_ra
                    ?.available === false &&
                result.specifications
                    ?.beam_mm
                    ?.available === false
        },

        {
            id:
                "quality_warnings_preserved",

            pass:
                Array.isArray(
                    result.data_quality
                        ?.product_a
                        ?.warnings
                ) &&
                result.data_quality
                    .product_a
                    .warnings
                    .some(
                        warning =>
                            warning.includes(
                                "approximate"
                            )
                    ) &&
                Array.isArray(
                    result.data_quality
                        ?.product_b
                        ?.warnings
                ) &&
                result.data_quality
                    .product_b
                    .warnings
                    .some(
                        warning =>
                            warning.includes(
                                "approximate"
                            )
                    )
        }
    ];


    /**
     * ========================================================
     * Explicit Null Contract
     * ========================================================
     */

    const nullResult =
        analyzeRacquetComparison(
            {
                id:
                    "a",

                identity: {
                    brand:
                        "A",

                    model:
                        "A"
                },

                specifications: {
                    swingweight:
                        300
                },

                core_dna: {
                    power:
                        8,

                    stability:
                        null
                }
            },

            {
                id:
                    "b",

                identity: {
                    brand:
                        "B",

                    model:
                        "B"
                },

                specifications: {
                    swingweight:
                        null
                },

                core_dna: {
                    power:
                        6,

                    stability:
                        9
                }
            }
        );


    checks.push(
        {
            id:
                "null_contract",

            pass:
                nullResult.dna
                    ?.power
                    ?.delta === 2 &&
                nullResult.dna
                    ?.stability
                    ?.available === false &&
                nullResult.dna
                    ?.stability
                    ?.delta === null &&
                nullResult.specifications
                    ?.swingweight
                    ?.available === false &&
                nullResult.specifications
                    ?.swingweight
                    ?.delta === null
        }
    );


    console.table(
        checks
    );


    const passed =
        checks.filter(
            item =>
                item.pass
        ).length;


    const failed =
        checks.length -
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
        `Total: ${checks.length}`
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
        failed > 0
    ) {
        process.exitCode =
            1;
    }
}


run().catch(
    error => {

        console.error(
            error
        );

        process.exitCode =
            1;
    }
);
