/**
 * ============================================================
 * EveryCourtAI
 * Comparison Semantic Engine V1
 * ============================================================
 *
 * Purpose:
 *
 * Convert objective racquet comparison facts into stable
 * tennis-specific semantic interpretations.
 *
 * Important:
 *
 * This engine does NOT:
 *
 * - score products
 * - rank products
 * - determine player suitability
 * - modify recommendation decisions
 * - infer missing data
 *
 * It only interprets already-available objective differences.
 *
 * ============================================================
 */

const ENGINE_NAME =
    "comparison_semantic_engine";

const ENGINE_VERSION =
    "1.0";


function buildSemanticResult(
    {
        key,
        available,
        higherProduct = null,
        lowerProduct = null,
        implications = []
    }
) {

    return {
        key,
        available,
        higher_product:
            higherProduct,
        lower_product:
            lowerProduct,
        implications
    };
}


function getHigherLower(
    row
) {

    if (
        !row ||
        row.available !== true
    ) {
        return {
            higher:
                null,
            lower:
                null
        };
    }


    if (
        row.relation ===
        "a_higher"
    ) {
        return {
            higher:
                "a",
            lower:
                "b"
        };
    }


    if (
        row.relation ===
        "b_higher"
    ) {
        return {
            higher:
                "b",
            lower:
                "a"
        };
    }


    return {
        higher:
            null,
        lower:
            null
    };
}


/**
 * ============================================================
 * Head Size
 * ============================================================
 */

function interpretHeadSize(
    row
) {

    if (
        !row ||
        row.available !== true
    ) {
        return buildSemanticResult({
            key:
                "head_size_sq_in",
            available:
                false
        });
    }


    if (
        row.relation ===
        "equal"
    ) {
        return buildSemanticResult({
            key:
                "head_size_sq_in",
            available:
                true,
            implications: [
                "similar_head_size"
            ]
        });
    }


    const {
        higher,
        lower
    } =
        getHigherLower(
            row
        );


    return buildSemanticResult({
        key:
            "head_size_sq_in",

        available:
            true,

        higherProduct:
            higher,

        lowerProduct:
            lower,

        implications: [
            "larger_head_more_forgiveness_potential",
            "larger_head_larger_effective_hitting_area",
            "smaller_head_more_compact_response"
        ]
    });
}


/**
 * ============================================================
 * Static Weight
 * ============================================================
 */

function interpretStaticWeight(
    row
) {

    if (
        !row ||
        row.available !== true
    ) {
        return buildSemanticResult({
            key:
                "weight_unstrung_g",
            available:
                false
        });
    }


    if (
        row.relation ===
        "equal"
    ) {
        return buildSemanticResult({
            key:
                "weight_unstrung_g",
            available:
                true,
            implications: [
                "similar_static_weight"
            ]
        });
    }


    const {
        higher,
        lower
    } =
        getHigherLower(
            row
        );


    return buildSemanticResult({
        key:
            "weight_unstrung_g",

        available:
            true,

        higherProduct:
            higher,

        lowerProduct:
            lower,

        implications: [
            "heavier_frame_more_mass",
            "heavier_frame_more_swing_demand",
            "lighter_frame_easier_acceleration"
        ]
    });
}


/**
 * ============================================================
 * Balance
 * ============================================================
 */

function interpretBalance(
    row
) {

    if (
        !row ||
        row.available !== true
    ) {
        return buildSemanticResult({
            key:
                "balance_unstrung_mm",
            available:
                false
        });
    }


    if (
        row.relation ===
        "equal"
    ) {
        return buildSemanticResult({
            key:
                "balance_unstrung_mm",
            available:
                true,
            implications: [
                "similar_balance_point"
            ]
        });
    }


    const {
        higher,
        lower
    } =
        getHigherLower(
            row
        );


    return buildSemanticResult({
        key:
            "balance_unstrung_mm",

        available:
            true,

        higherProduct:
            higher,

        lowerProduct:
            lower,

        implications: [
            "higher_balance_more_headward",
            "lower_balance_more_head_light",
            "more_head_light_supports_maneuverability"
        ]
    });
}


/**
 * ============================================================
 * Swingweight
 * ============================================================
 */

function interpretSwingweight(
    row
) {

    if (
        !row ||
        row.available !== true
    ) {
        return buildSemanticResult({
            key:
                "swingweight",
            available:
                false
        });
    }


    if (
        row.relation ===
        "equal"
    ) {
        return buildSemanticResult({
            key:
                "swingweight",
            available:
                true,
            implications: [
                "similar_dynamic_swing_demand"
            ]
        });
    }


    const {
        higher,
        lower
    } =
        getHigherLower(
            row
        );


    return buildSemanticResult({
        key:
            "swingweight",

        available:
            true,

        higherProduct:
            higher,

        lowerProduct:
            lower,

        implications: [
            "higher_swingweight_more_dynamic_mass",
            "higher_swingweight_more_stability_potential",
            "higher_swingweight_more_plow_through_potential",
            "higher_swingweight_more_swing_demand",
            "lower_swingweight_easier_acceleration"
        ]
    });
}


/**
 * ============================================================
 * Stiffness
 * ============================================================
 */

function interpretStiffness(
    row
) {

    if (
        !row ||
        row.available !== true
    ) {
        return buildSemanticResult({
            key:
                "stiffness_ra",
            available:
                false
        });
    }


    if (
        row.relation ===
        "equal"
    ) {
        return buildSemanticResult({
            key:
                "stiffness_ra",
            available:
                true,
            implications: [
                "similar_frame_stiffness"
            ]
        });
    }


    const {
        higher,
        lower
    } =
        getHigherLower(
            row
        );


    return buildSemanticResult({
        key:
            "stiffness_ra",

        available:
            true,

        higherProduct:
            higher,

        lowerProduct:
            lower,

        implications: [
            "higher_stiffness_firmer_response",
            "higher_stiffness_more_direct_energy_transfer_potential",
            "lower_stiffness_more_flex_potential"
        ]
    });
}


/**
 * ============================================================
 * Public API
 * ============================================================
 */

export function buildComparisonSemantics(
    comparisonAnswer
) {

    if (
        !comparisonAnswer ||
        comparisonAnswer.success !==
            true ||
        comparisonAnswer.status !==
            "comparison_answer_ready"
    ) {

        return {
            engine:
                ENGINE_NAME,

            version:
                ENGINE_VERSION,

            success:
                false,

            status:
                "comparison_semantics_not_ready"
        };
    }


    const specifications =
        Array.isArray(
            comparisonAnswer
                ?.objective
                ?.specifications
        )
            ? comparisonAnswer
                .objective
                .specifications
            : [];


    const byKey =
        Object.fromEntries(
            specifications.map(
                row => [
                    row.key,
                    row
                ]
            )
        );


    return {
        engine:
            ENGINE_NAME,

        version:
            ENGINE_VERSION,

        success:
            true,

        status:
            "comparison_semantics_ready",

        semantics: {
            head_size:
                interpretHeadSize(
                    byKey
                        .head_size_sq_in
                ),

            static_weight:
                interpretStaticWeight(
                    byKey
                        .weight_unstrung_g
                ),

            balance:
                interpretBalance(
                    byKey
                        .balance_unstrung_mm
                ),

            swingweight:
                interpretSwingweight(
                    byKey
                        .swingweight
                ),

            stiffness:
                interpretStiffness(
                    byKey
                        .stiffness_ra
                )
        }
    };
}


export default {
    buildComparisonSemantics
};
