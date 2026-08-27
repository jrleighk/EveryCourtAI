/**
 * ============================================================
 * EveryCourtAI
 * Comparison Semantic Language V1 Regression
 * ============================================================
 */

import {
    translateSemanticImplication,
    buildSemanticLanguage
} from "../../engine/comparison_semantic_language_v1.js";


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


/**
 * ============================================================
 * Translation Contract
 * ============================================================
 */

const knownTranslation =
    translateSemanticImplication(
        "higher_swingweight_more_stability_potential"
    );


test(
    "known_translation_available",
    knownTranslation.available ===
        true
);


test(
    "known_translation_cn",
    knownTranslation.cn ===
        "更高的挥重通常能提供更扎实的击球稳定性。"
);


test(
    "known_translation_en",
    knownTranslation.en ===
        "The higher swingweight generally provides greater stability through contact."
);


const unknownTranslation =
    translateSemanticImplication(
        "unknown_semantic_token"
    );


test(
    "unknown_translation_unavailable",
    unknownTranslation.available ===
        false
);


test(
    "unknown_translation_cn_null",
    unknownTranslation.cn ===
        null
);


test(
    "unknown_translation_en_null",
    unknownTranslation.en ===
        null
);


/**
 * ============================================================
 * Realistic Semantic Contract
 * ============================================================
 */

const semanticResult = {

    engine:
        "comparison_semantic_engine",

    version:
        "1.0",

    success:
        true,

    status:
        "comparison_semantics_ready",

    semantics: {

        head_size: {

            key:
                "head_size_sq_in",

            available:
                true,

            higher_product:
                "a",

            lower_product:
                "b",

            implications: [
                "larger_head_more_forgiveness_potential",
                "larger_head_larger_effective_hitting_area",
                "smaller_head_more_compact_response"
            ]
        },


        static_weight: {

            key:
                "weight_unstrung_g",

            available:
                true,

            higher_product:
                "b",

            lower_product:
                "a",

            implications: [
                "heavier_frame_more_mass",
                "heavier_frame_more_swing_demand",
                "lighter_frame_easier_acceleration"
            ]
        },


        balance: {

            key:
                "balance_unstrung_mm",

            available:
                true,

            higher_product:
                "a",

            lower_product:
                "b",

            implications: [
                "higher_balance_more_headward",
                "lower_balance_more_head_light",
                "more_head_light_supports_maneuverability"
            ]
        },


        swingweight: {

            key:
                "swingweight",

            available:
                true,

            higher_product:
                "b",

            lower_product:
                "a",

            implications: [
                "higher_swingweight_more_dynamic_mass",
                "higher_swingweight_more_stability_potential",
                "higher_swingweight_more_plow_through_potential",
                "higher_swingweight_more_swing_demand",
                "lower_swingweight_easier_acceleration"
            ]
        },


        stiffness: {

            key:
                "stiffness_ra",

            available:
                false,

            higher_product:
                null,

            lower_product:
                null,

            implications:
                []
        }
    }
};


const result =
    buildSemanticLanguage(
        semanticResult
    );


test(
    "language_success",
    result.success ===
        true
);


test(
    "language_status",
    result.status ===
        "semantic_language_ready"
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
        ?.available ===
        true
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
    "head_size_language_count",
    result
        ?.semantics
        ?.head_size
        ?.language
        ?.length ===
        3
);


test(
    "head_size_cn_language",
    result
        ?.semantics
        ?.head_size
        ?.language
        ?.[0]
        ?.cn ===
        "更大的拍面通常提供更高的容错潜力。"
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
        ?.available ===
        true
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
    "weight_language_count",
    result
        ?.semantics
        ?.static_weight
        ?.language
        ?.length ===
        3
);


test(
    "weight_swing_demand_cn",
    result
        ?.semantics
        ?.static_weight
        ?.language
        ?.[1]
        ?.cn ===
        "更高的静态重量通常会增加持续挥拍的负担。"
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
        ?.available ===
        true
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
    "balance_language_count",
    result
        ?.semantics
        ?.balance
        ?.language
        ?.length ===
        3
);


test(
    "balance_maneuverability_cn",
    result
        ?.semantics
        ?.balance
        ?.language
        ?.[2]
        ?.cn ===
        "更头轻的平衡通常有利于挥拍灵活性。"
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
        ?.available ===
        true
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
    "swingweight_language_count",
    result
        ?.semantics
        ?.swingweight
        ?.language
        ?.length ===
        5
);


test(
    "swingweight_stability_cn",
    result
        ?.semantics
        ?.swingweight
        ?.language
        ?.[1]
        ?.cn ===
        "更高的挥重通常能提供更扎实的击球稳定性。"
);


test(
    "swingweight_plow_en",
    result
        ?.semantics
        ?.swingweight
        ?.language
        ?.[2]
        ?.en ===
        "The higher swingweight generally provides greater plow-through potential."
);


test(
    "swingweight_acceleration_cn",
    result
        ?.semantics
        ?.swingweight
        ?.language
        ?.[4]
        ?.cn ===
        "较低的挥重通常更容易加速和快速完成挥拍。"
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
        ?.available ===
        false
);


test(
    "stiffness_language_empty",
    Array.isArray(
        result
            ?.semantics
            ?.stiffness
            ?.language
    ) &&
    result
        .semantics
        .stiffness
        .language
        .length ===
        0
);


/**
 * ============================================================
 * Unknown Token Must Not Leak
 * ============================================================
 */

const unknownTokenResult =
    buildSemanticLanguage({

        success:
            true,

        status:
            "comparison_semantics_ready",

        semantics: {

            test_metric: {

                key:
                    "test_metric",

                available:
                    true,

                higher_product:
                    "a",

                lower_product:
                    "b",

                implications: [
                    "unknown_semantic_token"
                ]
            }
        }
    });


test(
    "unknown_token_filtered",
    unknownTokenResult
        ?.semantics
        ?.test_metric
        ?.language
        ?.length ===
        0
);


/**
 * ============================================================
 * Invalid Input
 * ============================================================
 */

const invalid =
    buildSemanticLanguage(
        null
    );


test(
    "invalid_input_rejected",
    invalid.success ===
        false &&
    invalid.status ===
        "semantic_language_not_ready"
);


/**
 * ============================================================
 * Summary
 * ============================================================
 */

console.log(
    "========================================"
);

console.log(
    "COMPARISON SEMANTIC LANGUAGE V1"
);

console.log(
    "========================================"
);


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

console.log(
    ""
);

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
