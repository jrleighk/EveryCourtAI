/**
 * ============================================================
 * EveryCourtAI
 * Comparison View Model V1
 * ============================================================
 *
 * Purpose:
 *
 * Convert the internal Comparison Orchestrator V1 result into
 * one compact, stable, frontend-oriented response contract.
 *
 * This layer does NOT:
 *
 * - resolve products
 * - score products
 * - calculate player fit
 * - change comparison decisions
 * - generate new comparison facts
 *
 * It only projects existing comparison truth into a UI-friendly
 * structure.
 *
 * Source of truth:
 *
 * comparison_orchestrator_v1.js
 *
 * ============================================================
 */

const ENGINE_NAME =
    "comparison_view_model";

const ENGINE_VERSION =
    "1.0";


function normalizeLanguage(
    language
) {

    const value =
        String(
            language ??
            "en"
        )
            .trim()
            .toLowerCase();


    return value.startsWith(
        "zh"
    )
        ? "zh"
        : "en";
}


function getLocalizedLabel(
    label,
    language
) {

    if (
        !label ||
        typeof label !==
            "object"
    ) {

        return null;
    }


    return language ===
        "zh"
        ? (
            label.cn ??
            label.en ??
            null
        )
        : (
            label.en ??
            label.cn ??
            null
        );
}


function normalizeProduct(
    product
) {

    if (
        !product ||
        typeof product !==
            "object"
    ) {

        return null;
    }


    return {

        id:
            product.id ??
            null,

        brand:
            product.brand ??
            null,

        model:
            product.model ??
            null,

        display_name:
            product.display_name ??
            (
                [
                    product.brand,
                    product.model
                ]
                    .filter(
                        Boolean
                    )
                    .join(
                        " "
                    ) ||
                product.id ||
                null
            ),

        release_year:
            product.release_year ??
            null
    };
}


function normalizeMetricRow(
    row,
    language
) {

    if (
        !row ||
        typeof row !==
            "object"
    ) {

        return null;
    }


    return {

        key:
            row.key ??
            null,

        label:
            getLocalizedLabel(
                row.label,
                language
            ),

        available:
            row.available ===
            true,

        product_a:
            row.value_a ??
            null,

        product_b:
            row.value_b ??
            null,

        delta:
            row.delta ??
            null,

        relation:
            row.relation ??
            null,

        higher_product:
            row.higher_product ??
            null
    };
}


function buildNarrativeBlocks(
    orchestratorResult,
    language
) {

    const narrative =
        orchestratorResult
            ?.interpretation
            ?.narrative;


    const blockContainer =
        language ===
            "zh"
            ? narrative?.cn
            : narrative?.en;


    const blocks =
        Array.isArray(
            blockContainer
                ?.blocks
        )
            ? blockContainer.blocks
            : [];


    return blocks
        .map(
            item => ({

                id:
                    item?.id ??
                    null,

                text:
                    item?.text ??
                    null
            })
        )
        .filter(
            item =>
                Boolean(
                    item.text
                )
        );
}


function buildSummary(
    orchestratorResult,
    language
) {

    const comparisonLanguage =
        orchestratorResult
            ?.interpretation
            ?.language;


    const title =
        language ===
            "zh"
            ? comparisonLanguage
                ?.cn
                ?.title
            : comparisonLanguage
                ?.en
                ?.title;


    const narrativeBlocks =
        buildNarrativeBlocks(
            orchestratorResult,
            language
        );


    const playerDecision =
        orchestratorResult
            ?.interpretation
            ?.player_decision_narrative;


    const decisionText =
        playerDecision
            ?.available ===
            true
            ? (
                language ===
                    "zh"
                    ? playerDecision.cn
                    : playerDecision.en
            )
            : null;


    return {

        title:
            title ??
            null,

        narrative:
            narrativeBlocks,

        player_decision:
            decisionText ??
            null
    };
}


function buildDecision(
    comparisonAnswer,
    orchestratorResult
) {

    const decision =
        comparisonAnswer
            ?.decision ??
        {};


    const playerDecision =
        orchestratorResult
            ?.interpretation
            ?.player_decision_narrative;


    const performance =
        decision
            ?.performance_preference ??
        null;


    const practical =
        decision
            ?.practical_preference ??
        null;


    const performancePreferred =
        performance
            ?.preferred_product ??
        null;


    const practicalPreferred =
        practical
            ?.preferred_product ??
        null;


    let overallStatus =
        "unavailable";


    if (
        performance?.available ===
            true ||
        practical?.available ===
            true
    ) {

        if (
            performancePreferred &&
            practicalPreferred &&
            performancePreferred !==
                practicalPreferred
        ) {

            overallStatus =
                "tradeoff";

        } else if (
            performancePreferred ||
            practicalPreferred
        ) {

            overallStatus =
                "preferred";

        } else {

            overallStatus =
                "equal";
        }
    }


    return {

        available:
            performance?.available ===
                true ||
            practical?.available ===
                true,

        status:
            overallStatus,

        decision_conflict:
            playerDecision
                ?.decision_conflict ===
                true,

        performance: {

            preferred_product:
                performancePreferred,

            reason:
                performance
                    ?.reason ??
                null,

            delta:
                performance
                    ?.delta ??
                null
        },

        practical: {

            preferred_product:
                practicalPreferred,

            reason:
                practical
                    ?.reason ??
                null,

            delta:
                practical
                    ?.delta ??
                null
        }
    };
}


function buildTradeoffs(
    synthesis
) {

    const clusters =
        synthesis
            ?.clusters ??
        {};


    const tradeoffs =
        [];


    const ease =
        clusters
            ?.ease_and_demand;


    if (
        ease?.available ===
            true &&
        ease.primary_product &&
        ease.secondary_product
    ) {

        tradeoffs.push({

            id:
                "ease_vs_demand",

            advantage_product:
                ease.primary_product,

            tradeoff_product:
                ease.secondary_product
        });
    }


    const forgiveness =
        clusters
            ?.forgiveness;


    if (
        forgiveness?.available ===
            true &&
        forgiveness.primary_product
    ) {

        tradeoffs.push({

            id:
                "forgiveness",

            advantage_product:
                forgiveness
                    .primary_product,

            tradeoff_product:
                forgiveness
                    .secondary_product ??
                null
        });
    }


    const stability =
        clusters
            ?.stability_and_plow;


    if (
        stability?.available ===
            true &&
        stability.primary_product
    ) {

        tradeoffs.push({

            id:
                "stability_and_plow",

            advantage_product:
                stability
                    .primary_product,

            tradeoff_product:
                stability
                    .secondary_product ??
                null
        });
    }


    return tradeoffs;
}


function buildDataQuality(
    comparisonAnswer
) {

    const quality =
        comparisonAnswer
            ?.objective
            ?.data_quality;


    if (
        !quality ||
        typeof quality !==
            "object"
    ) {

        return {
            available:
                false,

            product_a:
                null,

            product_b:
                null
        };
    }


    function normalizeQuality(
        item
    ) {

        if (
            !item ||
            typeof item !==
                "object"
        ) {

            return null;
        }


        return {

            specification_completeness:
                item
                    .specification_completeness ??
                null,

            performance_completeness:
                item
                    .performance_completeness ??
                null,

            warnings:
                Array.isArray(
                    item.warnings
                )
                    ? item.warnings
                    : []
        };
    }


    return {

        available:
            true,

        product_a:
            normalizeQuality(
                quality.product_a
            ),

        product_b:
            normalizeQuality(
                quality.product_b
            )
    };
}


/**
 * ============================================================
 * Public API
 * ============================================================
 */

export function buildComparisonViewModel(
    orchestratorResult,
    language = null
) {

    if (
        !orchestratorResult ||
        orchestratorResult.success !==
            true ||
        orchestratorResult.ready !==
            true ||
        orchestratorResult.status !==
            "comparison_orchestrator_ready"
    ) {

        return {

            engine:
                ENGINE_NAME,

            version:
                ENGINE_VERSION,

            success:
                false,

            available:
                false,

            status:
                "comparison_view_not_ready"
        };
    }


    const normalizedLanguage =
        normalizeLanguage(
            language ??
            orchestratorResult
                ?.language
        );


    const comparisonAnswer =
        orchestratorResult
            ?.comparison
            ?.answer;


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

            available:
                false,

            status:
                "comparison_view_answer_unavailable"
        };
    }


    const products =
        comparisonAnswer
            ?.products ??
        orchestratorResult
            ?.products ??
        {};


    const objective =
        comparisonAnswer
            ?.objective ??
        {};


    const playerFit =
        comparisonAnswer
            ?.player_fit ??
        {};


    const synthesis =
        orchestratorResult
            ?.interpretation
            ?.synthesis;


    const dimensions =
        Array.isArray(
            objective.dna
        )
            ? objective.dna
                .map(
                    row =>
                        normalizeMetricRow(
                            row,
                            normalizedLanguage
                        )
                )
                .filter(
                    Boolean
                )
            : [];


    const specifications =
        Array.isArray(
            objective.specifications
        )
            ? objective
                .specifications
                .map(
                    row =>
                        normalizeMetricRow(
                            row,
                            normalizedLanguage
                        )
                )
                .filter(
                    Boolean
                )
            : [];


    return {

        engine:
            ENGINE_NAME,

        version:
            ENGINE_VERSION,

        success:
            true,

        available:
            true,

        status:
            "comparison_view_ready",

        language:
            normalizedLanguage,

        products: {

            product_a:
                normalizeProduct(
                    products.product_a
                ),

            product_b:
                normalizeProduct(
                    products.product_b
                )
        },

        summary:
            buildSummary(
                orchestratorResult,
                normalizedLanguage
            ),

        dimensions,

        specifications,

        player_fit: {

            available:
                playerFit.available ===
                true,

            product_a:
                playerFit.product_a
                    ? {
                        match_score:
                            playerFit
                                .product_a
                                .match_score ??
                            null,

                        performance_fit_score:
                            playerFit
                                .product_a
                                .performance_fit_score ??
                            null,

                        continuity_bonus:
                            playerFit
                                .product_a
                                .continuity_bonus ??
                            0,

                        reasons:
                            Array.isArray(
                                playerFit
                                    .product_a
                                    .reasons
                            )
                                ? playerFit
                                    .product_a
                                    .reasons
                                : [],

                        risk_flags:
                            Array.isArray(
                                playerFit
                                    .product_a
                                    .risk_flags
                            )
                                ? playerFit
                                    .product_a
                                    .risk_flags
                                : [],

                        signals:
                            playerFit
                                .product_a
                                .signals &&
                            typeof playerFit
                                .product_a
                                .signals ===
                                "object"
                                ? {
                                    swing_compatibility:
                                        playerFit
                                            .product_a
                                            .signals
                                            .swing_compatibility ??
                                        null,

                                    weight_compatibility:
                                        playerFit
                                            .product_a
                                            .signals
                                            .weight_compatibility ??
                                        null,

                                    physical_demand:
                                        playerFit
                                            .product_a
                                            .signals
                                            .physical_demand ??
                                        null,

                                    physical_risk:
                                        playerFit
                                            .product_a
                                            .signals
                                            .physical_risk ===
                                        true,

                                    goal_alignment:
                                        playerFit
                                            .product_a
                                            .signals
                                            .goal_alignment ??
                                        null
                                }
                                : null
                    }
                    : null,

            product_b:
                playerFit.product_b
                    ? {
                        match_score:
                            playerFit
                                .product_b
                                .match_score ??
                            null,

                        performance_fit_score:
                            playerFit
                                .product_b
                                .performance_fit_score ??
                            null,

                        continuity_bonus:
                            playerFit
                                .product_b
                                .continuity_bonus ??
                            0,

                        reasons:
                            Array.isArray(
                                playerFit
                                    .product_b
                                    .reasons
                            )
                                ? playerFit
                                    .product_b
                                    .reasons
                                : [],

                        risk_flags:
                            Array.isArray(
                                playerFit
                                    .product_b
                                    .risk_flags
                            )
                                ? playerFit
                                    .product_b
                                    .risk_flags
                                : [],

                        signals:
                            playerFit
                                .product_b
                                .signals &&
                            typeof playerFit
                                .product_b
                                .signals ===
                                "object"
                                ? {
                                    swing_compatibility:
                                        playerFit
                                            .product_b
                                            .signals
                                            .swing_compatibility ??
                                        null,

                                    weight_compatibility:
                                        playerFit
                                            .product_b
                                            .signals
                                            .weight_compatibility ??
                                        null,

                                    physical_demand:
                                        playerFit
                                            .product_b
                                            .signals
                                            .physical_demand ??
                                        null,

                                    physical_risk:
                                        playerFit
                                            .product_b
                                            .signals
                                            .physical_risk ===
                                        true,

                                    goal_alignment:
                                        playerFit
                                            .product_b
                                            .signals
                                            .goal_alignment ??
                                        null
                                }
                                : null
                    }
                    : null
        },

        decision:
            buildDecision(
                comparisonAnswer,
                orchestratorResult
            ),

        tradeoffs:
            buildTradeoffs(
                synthesis
            ),

        data_quality:
            buildDataQuality(
                comparisonAnswer
            )
    };
}


export function getComparisonViewModelInfo() {

    return {

        name:
            ENGINE_NAME,

        version:
            ENGINE_VERSION,

        status:
            "ready",

        frontend_oriented:
            true
    };
}


export default {

    buildComparisonViewModel,

    getComparisonViewModelInfo
};
