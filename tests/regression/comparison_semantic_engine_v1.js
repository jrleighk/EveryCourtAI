/**
 * ============================================================
 * EveryCourtAI
 * Comparison Semantic Engine V1 Regression
 * ============================================================
 */

import {
    buildComparisonSemantics
} from "../../engine/comparison_semantic_engine_v1.js";


const tests = [];


function test(
    id,
    pass
) {

    tests.push({
        id,
        pass:
            Boolean(
                pass
            )
    });
}


const comparisonAnswer = {

    engine:
        "comparison_answer_builder",

    version:
        "1.0",

    success:
        true,

    status:
        "comparison_answer_ready",

    products: {

        product_a: {
            id:
                "babolat_pure_drive_spectra_edition_2026",
            brand:
                "Babolat",
            model:
                "Pure Drive Spectra Edition 2026"
        },

        product_b: {
            id:
                "wilson_rf_01_pro_classic",
            brand:
                "Wilson",
            model:
                "RF 01 Pro Classic"
        }
    },

    objective: {

        available:
            true,

        specifications: [

            {
                key:
                    "head_size_sq_in",
                available:
                    true,
                value_a:
                    100,
                value_b:
                    98,
                delta:
                    2,
                relation:
                    "a_higher",
                higher_product:
                    "a"
            },

            {
                key:
                    "weight_unstrung_g",
                available:
                    true,
                value_a:
                    300,
                value_b:
                    320,
                delta:
                    -20,
                relation:
                    "b_higher",
                higher_product:
                    "b"
            },

            {
                key:
                    "balance_unstrung_mm",
                available:
                    true,
                value_a:
                    320,
                value_b:
                    310,
                delta:
                    10,
                relation:
                    "a_higher",
                higher_product:
                    "a"
            },

            {
                key:
                    "swingweight",
                available:
                    true,
                value_a:
                    290,
                value_b:
                    335,
                delta:
                    -45,
                relation:
                    "b_higher",
                higher_product:
                    "b"
            },

            {
                key:
                    "stiffness_ra",
                available:
                    false,
                value_a:
                    null,
                value_b:
                    null,
                delta:
                    null,
                relation:
                    "unavailable",
                higher_product:
                    null
            }
        ]
    }
};


const result =
    buildComparisonSemantics(
        comparisonAnswer
    );


console.log(
    "========================================"
);

console.log(
    "COMPARISON SEMANTIC ENGINE V1"
);

console.log(
    "========================================"
);


/**
 * ============================================================
 * Contract
 * ============================================================
 */

test(
    "semantic_success",
    result.success === true
);


test(
    "semantic_status",
    result.status ===
        "comparison_semantics_ready"
);


/**
 * ============================================================
 * Head Size
 * ============================================================
 */

test(
    "head_size_available",
    result
        ?.semantics
        ?.head_size
        ?.available === true
);


test(
    "head_size_higher_a",
    result
        ?.semantics
        ?.head_size
        ?.higher_product ===
        "a"
);


test(
    "head_size_lower_b",
    result
        ?.semantics
        ?.head_size
        ?.lower_product ===
        "b"
);


test(
    "head_size_forgiveness_semantic",
    result
        ?.semantics
        ?.head_size
        ?.implications
        ?.includes(
            "larger_head_more_forgiveness_potential"
        )
);


/**
 * ============================================================
 * Static Weight
 * ============================================================
 */

test(
    "weight_available",
    result
        ?.semantics
        ?.static_weight
        ?.available === true
);


test(
    "weight_higher_b",
    result
        ?.semantics
        ?.static_weight
        ?.higher_product ===
        "b"
);


test(
    "weight_lower_a",
    result
        ?.semantics
        ?.static_weight
        ?.lower_product ===
        "a"
);


test(
    "weight_swing_demand_semantic",
    result
        ?.semantics
        ?.static_weight
        ?.implications
        ?.includes(
            "heavier_frame_more_swing_demand"
        )
);


test(
    "weight_acceleration_semantic",
    result
        ?.semantics
        ?.static_weight
        ?.implications
        ?.includes(
            "lighter_frame_easier_acceleration"
        )
);


/**
 * ============================================================
 * Balance
 * ============================================================
 */

test(
    "balance_available",
    result
        ?.semantics
        ?.balance
        ?.available === true
);


test(
    "balance_higher_a",
    result
        ?.semantics
        ?.balance
        ?.higher_product ===
        "a"
);


test(
    "balance_lower_b",
    result
        ?.semantics
        ?.balance
        ?.lower_product ===
        "b"
);


test(
    "balance_head_light_semantic",
    result
        ?.semantics
        ?.balance
        ?.implications
        ?.includes(
            "lower_balance_more_head_light"
        )
);


test(
    "balance_maneuverability_semantic",
    result
        ?.semantics
        ?.balance
        ?.implications
        ?.includes(
            "more_head_light_supports_maneuverability"
        )
);


/**
 * ============================================================
 * Swingweight
 * ============================================================
 */

test(
    "swingweight_available",
    result
        ?.semantics
        ?.swingweight
        ?.available === true
);


test(
    "swingweight_higher_b",
    result
        ?.semantics
        ?.swingweight
        ?.higher_product ===
        "b"
);


test(
    "swingweight_lower_a",
    result
        ?.semantics
        ?.swingweight
        ?.lower_product ===
        "a"
);


test(
    "swingweight_stability_semantic",
    result
        ?.semantics
        ?.swingweight
        ?.implications
        ?.includes(
            "higher_swingweight_more_stability_potential"
        )
);


test(
    "swingweight_plow_semantic",
    result
        ?.semantics
        ?.swingweight
        ?.implications
        ?.includes(
            "higher_swingweight_more_plow_through_potential"
        )
);


test(
    "swingweight_demand_semantic",
    result
        ?.semantics
        ?.swingweight
        ?.implications
        ?.includes(
            "higher_swingweight_more_swing_demand"
        )
);


test(
    "swingweight_acceleration_semantic",
    result
        ?.semantics
        ?.swingweight
        ?.implications
        ?.includes(
            "lower_swingweight_easier_acceleration"
        )
);


/**
 * ============================================================
 * Missing Data Semantics
 * ============================================================
 */

test(
    "stiffness_unavailable",
    result
        ?.semantics
        ?.stiffness
        ?.available === false
);


test(
    "stiffness_no_inference",
    Array.isArray(
        result
            ?.semantics
            ?.stiffness
            ?.implications
    ) &&
    result
        .semantics
        .stiffness
        .implications
        .length === 0
);


/**
 * ============================================================
 * Invalid Input
 * ============================================================
 */

const invalid =
    buildComparisonSemantics(
        null
    );


test(
    "invalid_input_rejected",
    invalid.success === false &&
    invalid.status ===
        "comparison_semantics_not_ready"
);


/**
 * ============================================================
 * Output
 * ============================================================
 */

console.table(
    tests
);


const passed =
    tests.filter(
        item =>
            item.pass
    ).length;


const failed =
    tests.length -
    passed;


console.log(
    ""
);

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
    `Total: ${tests.length}`
);

console.log(
    `Passed: ${passed}`
);

console.log(
    `Failed: ${failed}`
);


if (
    failed > 0
) {

    console.log(
        ""
    );

    console.log(
        "RESULT: FAIL"
    );

    process.exit(
        1
    );
}


console.log(
    ""
);

console.log(
    "RESULT: PASS"
);
