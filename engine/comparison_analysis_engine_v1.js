/**
 * ============================================================
 * EveryCourtAI
 * Comparison Analysis Engine V1
 * ============================================================
 *
 * Responsibilities:
 *
 * 1. Compare two normalized racquet records
 * 2. Compare canonical core DNA dimensions
 * 3. Compare objective specifications
 * 4. Preserve missing-data semantics
 * 5. Preserve source quality warnings
 *
 * This engine does NOT:
 *
 * - resolve product names
 * - load product files
 * - determine player suitability
 * - rank products
 * - generate recommendation language
 *
 * ============================================================
 */

const ENGINE_NAME =
    "comparison_analysis_engine";

const ENGINE_VERSION =
    "1.0";


const CORE_DNA_FIELDS = [
    "power",
    "control",
    "spin",
    "comfort",
    "stability",
    "maneuverability",
    "forgiveness"
];


const NUMERIC_SPEC_FIELDS = [
    "head_size_sq_in",
    "weight_unstrung_g",
    "weight_strung_g",
    "balance_unstrung_mm",
    "balance_strung_mm",
    "length_in",
    "swingweight",
    "stiffness_ra"
];


const TEXT_SPEC_FIELDS = [
    "string_pattern",
    "beam_mm"
];


function isFiniteNumber(
    value
) {
    return (
        typeof value === "number" &&
        Number.isFinite(value)
    );
}


function compareNumeric(
    valueA,
    valueB
) {

    if (
        !isFiniteNumber(valueA) ||
        !isFiniteNumber(valueB)
    ) {
        return {
            available:
                false,

            value_a:
                valueA ?? null,

            value_b:
                valueB ?? null,

            delta:
                null,

            relation:
                "unavailable"
        };
    }


    const delta =
        Number(
            (
                valueA -
                valueB
            ).toFixed(4)
        );


    return {
        available:
            true,

        value_a:
            valueA,

        value_b:
            valueB,

        delta,

        relation:
            delta > 0
                ? "a_higher"
                : (
                    delta < 0
                        ? "b_higher"
                        : "equal"
                )
    };
}


function compareText(
    valueA,
    valueB
) {

    const hasA =
        valueA !== null &&
        valueA !== undefined &&
        String(valueA).trim() !== "";

    const hasB =
        valueB !== null &&
        valueB !== undefined &&
        String(valueB).trim() !== "";


    if (
        !hasA ||
        !hasB
    ) {
        return {
            available:
                false,

            value_a:
                hasA
                    ? valueA
                    : null,

            value_b:
                hasB
                    ? valueB
                    : null,

            relation:
                "unavailable"
        };
    }


    return {
        available:
            true,

        value_a:
            valueA,

        value_b:
            valueB,

        relation:
            String(valueA) ===
                String(valueB)
                ? "equal"
                : "different"
    };
}


function buildIdentity(
    product
) {
    return {
        id:
            product?.id ??
            null,

        brand:
            product?.identity
                ?.brand ??
            null,

        model:
            product?.identity
                ?.model ??
            null,

        release_year:
            product?.identity
                ?.release_year ??
            null
    };
}


function buildQuality(
    product
) {
    return {
        specification_completeness:
            product?.data_quality
                ?.specification_completeness ??
            null,

        performance_completeness:
            product?.data_quality
                ?.performance_completeness ??
            null,

        source_file:
            product?.data_quality
                ?.source_file ??
            null,

        warnings:
            Array.isArray(
                product?.data_quality
                    ?.warnings
            )
                ? [
                    ...product
                        .data_quality
                        .warnings
                ]
                : []
    };
}


/**
 * ============================================================
 * Public API
 * ============================================================
 */

export function analyzeRacquetComparison(
    productA,
    productB
) {

    if (
        !productA ||
        !productB
    ) {
        return {
            engine:
                ENGINE_NAME,

            version:
                ENGINE_VERSION,

            success:
                false,

            status:
                "invalid_products",

            product_a:
                productA
                    ? buildIdentity(
                        productA
                    )
                    : null,

            product_b:
                productB
                    ? buildIdentity(
                        productB
                    )
                    : null,

            dna:
                {},

            specifications:
                {},

            data_quality:
                null
        };
    }


    const dna = {};


    for (
        const field
        of CORE_DNA_FIELDS
    ) {

        dna[field] =
            compareNumeric(
                productA
                    ?.core_dna
                    ?.[field],

                productB
                    ?.core_dna
                    ?.[field]
            );
    }


    const specifications = {};


    for (
        const field
        of NUMERIC_SPEC_FIELDS
    ) {

        specifications[field] =
            compareNumeric(
                productA
                    ?.specifications
                    ?.[field],

                productB
                    ?.specifications
                    ?.[field]
            );
    }


    for (
        const field
        of TEXT_SPEC_FIELDS
    ) {

        specifications[field] =
            compareText(
                productA
                    ?.specifications
                    ?.[field],

                productB
                    ?.specifications
                    ?.[field]
            );
    }


    return {
        engine:
            ENGINE_NAME,

        version:
            ENGINE_VERSION,

        success:
            true,

        status:
            "comparison_ready",

        product_a:
            buildIdentity(
                productA
            ),

        product_b:
            buildIdentity(
                productB
            ),

        dna,

        specifications,

        data_quality: {
            product_a:
                buildQuality(
                    productA
                ),

            product_b:
                buildQuality(
                    productB
                )
        }
    };
}


export default {
    analyzeRacquetComparison
};
