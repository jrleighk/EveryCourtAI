/**
 * ============================================================
 * EveryCourtAI
 * Comparison Explanation Synthesis V1
 * ============================================================
 *
 * Purpose:
 *
 * Combine stable comparison semantics and comparison-answer
 * facts into higher-level explanation clusters.
 *
 * This engine does NOT:
 *
 * - score products
 * - rank products
 * - determine winners
 * - modify player-fit decisions
 * - infer unavailable metrics
 * - generate final natural-language prose
 *
 * Source contracts:
 *
 * comparison_answer_builder_v1.js
 * comparison_semantic_engine_v1.js
 *
 * ============================================================
 */

const ENGINE_NAME =
    "comparison_explanation_synthesis";

const ENGINE_VERSION =
    "1.0";


function getSemantic(
    semanticResult,
    key
) {

    return (
        semanticResult
            ?.semantics
            ?.[key] ??
        null
    );
}


function getObjectiveRow(
    comparisonAnswer,
    section,
    key
) {

    const rows =
        comparisonAnswer
            ?.objective
            ?.[section];


    if (
        !Array.isArray(
            rows
        )
    ) {
        return null;
    }


    return (
        rows.find(
            row =>
                row?.key === key
        ) ??
        null
    );
}


function collectImplications(
    ...semanticEntries
) {

    const output = [];


    for (
        const semantic
        of semanticEntries
    ) {

        if (
            semantic?.available !==
                true ||
            !Array.isArray(
                semantic.implications
            )
        ) {
            continue;
        }


        for (
            const implication
            of semantic.implications
        ) {

            if (
                typeof implication !==
                    "string" ||
                output.includes(
                    implication
                )
            ) {
                continue;
            }


            output.push(
                implication
            );
        }
    }


    return output;
}


function buildCluster({
    id,
    available,
    primaryProduct = null,
    secondaryProduct = null,
    evidence = [],
    implications = []
}) {

    return {
        id,

        available:
            available === true,

        primary_product:
            available === true
                ? primaryProduct
                : null,

        secondary_product:
            available === true
                ? secondaryProduct
                : null,

        evidence:
            available === true
                ? evidence
                : [],

        implications:
            available === true
                ? implications
                : []
    };
}


function oppositeProduct(
    product
) {

    if (
        product === "a"
    ) {
        return "b";
    }


    if (
        product === "b"
    ) {
        return "a";
    }


    return null;
}


function buildEaseDemandCluster(
    comparisonAnswer,
    semanticResult
) {

    const weight =
        getSemantic(
            semanticResult,
            "static_weight"
        );

    const balance =
        getSemantic(
            semanticResult,
            "balance"
        );

    const swingweight =
        getSemantic(
            semanticResult,
            "swingweight"
        );


    const available =
        weight?.available === true ||
        balance?.available === true ||
        swingweight?.available === true;


    if (
        !available
    ) {
        return buildCluster({
            id:
                "ease_and_demand",

            available:
                false
        });
    }


    /*
     * Swingweight is the strongest direct dynamic-demand
     * signal in this synthesis layer.
     *
     * Static weight is the fallback.
     */

    const higherDemandProduct =
        swingweight?.available === true
            ? swingweight
                .higher_product
            : (
                weight?.available === true
                    ? weight
                        .higher_product
                    : null
            );


    const easierProduct =
        oppositeProduct(
            higherDemandProduct
        );


    const evidence = [];


    for (
        const [
            key,
            semantic
        ]
        of [
            [
                "weight_unstrung_g",
                weight
            ],
            [
                "balance_unstrung_mm",
                balance
            ],
            [
                "swingweight",
                swingweight
            ]
        ]
    ) {

        if (
            semantic?.available !==
                true
        ) {
            continue;
        }


        evidence.push({
            key,

            higher_product:
                semantic
                    .higher_product ??
                null,

            lower_product:
                semantic
                    .lower_product ??
                null
        });
    }


    return buildCluster({
        id:
            "ease_and_demand",

        available:
            true,

        primaryProduct:
            easierProduct,

        secondaryProduct:
            higherDemandProduct,

        evidence,

        implications:
            collectImplications(
                weight,
                balance,
                swingweight
            )
    });
}


function buildForgivenessCluster(
    comparisonAnswer,
    semanticResult
) {

    const headSize =
        getSemantic(
            semanticResult,
            "head_size"
        );


    const forgivenessRow =
        getObjectiveRow(
            comparisonAnswer,
            "dna",
            "forgiveness"
        );


    const available =
        headSize?.available === true ||
        forgivenessRow
            ?.available === true;


    if (
        !available
    ) {
        return buildCluster({
            id:
                "forgiveness",

            available:
                false
        });
    }


    const primaryProduct =
        forgivenessRow
            ?.available === true &&
        (
            forgivenessRow
                ?.higher_product === "a" ||
            forgivenessRow
                ?.higher_product === "b"
        )
            ? forgivenessRow
                .higher_product
            : (
                headSize
                    ?.higher_product ??
                null
            );


    const evidence = [];


    if (
        headSize?.available === true
    ) {

        evidence.push({
            key:
                "head_size_sq_in",

            higher_product:
                headSize
                    .higher_product ??
                null,

            lower_product:
                headSize
                    .lower_product ??
                null
        });
    }


    if (
        forgivenessRow
            ?.available === true
    ) {

        evidence.push({
            key:
                "forgiveness",

            higher_product:
                forgivenessRow
                    .higher_product ??
                null,

            relation:
                forgivenessRow
                    .relation ??
                null
        });
    }


    return buildCluster({
        id:
            "forgiveness",

        available:
            true,

        primaryProduct,

        secondaryProduct:
            oppositeProduct(
                primaryProduct
            ),

        evidence,

        implications:
            collectImplications(
                headSize
            )
    });
}


function buildStabilityPlowCluster(
    comparisonAnswer,
    semanticResult
) {

    const weight =
        getSemantic(
            semanticResult,
            "static_weight"
        );

    const swingweight =
        getSemantic(
            semanticResult,
            "swingweight"
        );


    const stabilityRow =
        getObjectiveRow(
            comparisonAnswer,
            "dna",
            "stability"
        );


    const available =
        weight?.available === true ||
        swingweight?.available === true ||
        stabilityRow
            ?.available === true;


    if (
        !available
    ) {
        return buildCluster({
            id:
                "stability_and_plow",

            available:
                false
        });
    }


    /*
     * Explicit stability DNA is preferred.
     * Swingweight is the physical fallback.
     */

    const primaryProduct =
        stabilityRow
            ?.available === true &&
        (
            stabilityRow
                ?.higher_product === "a" ||
            stabilityRow
                ?.higher_product === "b"
        )
            ? stabilityRow
                .higher_product
            : (
                swingweight
                    ?.higher_product ??
                weight
                    ?.higher_product ??
                null
            );


    const evidence = [];


    if (
        weight?.available === true
    ) {

        evidence.push({
            key:
                "weight_unstrung_g",

            higher_product:
                weight
                    .higher_product ??
                null,

            lower_product:
                weight
                    .lower_product ??
                null
        });
    }


    if (
        swingweight
            ?.available === true
    ) {

        evidence.push({
            key:
                "swingweight",

            higher_product:
                swingweight
                    .higher_product ??
                null,

            lower_product:
                swingweight
                    .lower_product ??
                null
        });
    }


    if (
        stabilityRow
            ?.available === true
    ) {

        evidence.push({
            key:
                "stability",

            higher_product:
                stabilityRow
                    .higher_product ??
                null,

            relation:
                stabilityRow
                    .relation ??
                null
        });
    }


    return buildCluster({
        id:
            "stability_and_plow",

        available:
            true,

        primaryProduct,

        secondaryProduct:
            oppositeProduct(
                primaryProduct
            ),

        evidence,

        implications:
            collectImplications(
                weight,
                swingweight
            )
    });
}


function buildPerformanceIdentityCluster(
    comparisonAnswer
) {

    const keys = [
        "power",
        "control",
        "spin",
        "comfort"
    ];


    const evidence =
        keys
            .map(
                key =>
                    getObjectiveRow(
                        comparisonAnswer,
                        "dna",
                        key
                    )
            )
            .filter(
                row =>
                    row?.available ===
                    true
            )
            .map(
                row => ({
                    key:
                        row.key,

                    higher_product:
                        row
                            .higher_product ??
                        null,

                    relation:
                        row
                            .relation ??
                        null,

                    value_a:
                        row
                            .value_a ??
                        null,

                    value_b:
                        row
                            .value_b ??
                        null
                })
            );


    return {
        id:
            "performance_identity",

        available:
            evidence.length > 0,

        evidence
    };
}


function buildDecisionCluster(
    comparisonAnswer
) {

    const performance =
        comparisonAnswer
            ?.decision
            ?.performance_preference ??
        null;

    const practical =
        comparisonAnswer
            ?.decision
            ?.practical_preference ??
        null;


    const available =
        performance?.available === true ||
        practical?.available === true;


    return {
        id:
            "player_decision",

        available,

        performance_preference:
            performance?.available ===
                true
                ? {
                    preferred_product:
                        performance
                            .preferred_product ??
                        null,

                    reason:
                        performance
                            .reason ??
                        null,

                    delta:
                        performance
                            .delta ??
                        null
                }
                : null,

        practical_preference:
            practical?.available ===
                true
                ? {
                    preferred_product:
                        practical
                            .preferred_product ??
                        null,

                    reason:
                        practical
                            .reason ??
                        null,

                    delta:
                        practical
                            .delta ??
                        null
                }
                : null,

        decision_conflict:
            performance?.available ===
                true &&
            practical?.available ===
                true &&
            performance
                ?.preferred_product &&
            practical
                ?.preferred_product &&
            performance
                .preferred_product !==
            practical
                .preferred_product
    };
}


/**
 * ============================================================
 * Public API
 * ============================================================
 */

export function buildComparisonExplanationSynthesis(
    comparisonAnswer,
    semanticResult
) {

    if (
        !comparisonAnswer ||
        comparisonAnswer.success !==
            true ||
        comparisonAnswer.status !==
            "comparison_answer_ready" ||
        !semanticResult ||
        semanticResult.success !==
            true ||
        semanticResult.status !==
            "comparison_semantics_ready"
    ) {

        return {
            engine:
                ENGINE_NAME,

            version:
                ENGINE_VERSION,

            success:
                false,

            status:
                "comparison_explanation_synthesis_not_ready"
        };
    }


    return {
        engine:
            ENGINE_NAME,

        version:
            ENGINE_VERSION,

        success:
            true,

        status:
            "comparison_explanation_synthesis_ready",

        products: {
            product_a:
                comparisonAnswer
                    ?.products
                    ?.product_a ??
                null,

            product_b:
                comparisonAnswer
                    ?.products
                    ?.product_b ??
                null
        },

        clusters: {
            ease_and_demand:
                buildEaseDemandCluster(
                    comparisonAnswer,
                    semanticResult
                ),

            forgiveness:
                buildForgivenessCluster(
                    comparisonAnswer,
                    semanticResult
                ),

            stability_and_plow:
                buildStabilityPlowCluster(
                    comparisonAnswer,
                    semanticResult
                ),

            performance_identity:
                buildPerformanceIdentityCluster(
                    comparisonAnswer
                ),

            player_decision:
                buildDecisionCluster(
                    comparisonAnswer
                )
        }
    };
}


export default {
    buildComparisonExplanationSynthesis
};
