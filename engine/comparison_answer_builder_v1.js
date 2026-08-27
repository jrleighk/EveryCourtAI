/**
 * ============================================================
 * EveryCourtAI
 * Comparison Answer Builder V1
 * ============================================================
 *
 * Purpose:
 *
 * Convert Comparison Result V1 into a stable,
 * presentation-ready answer contract.
 *
 * This layer does NOT:
 *
 * - resolve product names
 * - load product knowledge
 * - calculate product DNA
 * - score racquets
 * - modify player fit
 * - decide new winners
 * - mutate player profile
 *
 * Source of truth:
 *
 * comparison_result_engine_v1.js
 *
 * ============================================================
 */

const ENGINE_NAME =
    "comparison_answer_builder";

const ENGINE_VERSION =
    "1.0";


const DNA_LABELS = {

    power: {
        en:
            "Power",
        cn:
            "力量"
    },

    control: {
        en:
            "Control",
        cn:
            "控制"
    },

    spin: {
        en:
            "Spin",
        cn:
            "旋转"
    },

    comfort: {
        en:
            "Comfort",
        cn:
            "舒适性"
    },

    stability: {
        en:
            "Stability",
        cn:
            "稳定性"
    },

    maneuverability: {
        en:
            "Maneuverability",
        cn:
            "灵活性"
    },

    forgiveness: {
        en:
            "Forgiveness",
        cn:
            "容错性"
    }
};


const SPEC_LABELS = {

    head_size_sq_in: {
        en:
            "Head Size",
        cn:
            "拍面"
    },

    weight_unstrung_g: {
        en:
            "Unstrung Weight",
        cn:
            "空拍重量"
    },

    weight_strung_g: {
        en:
            "Strung Weight",
        cn:
            "穿线重量"
    },

    balance_unstrung_mm: {
        en:
            "Unstrung Balance",
        cn:
            "空拍平衡点"
    },

    balance_strung_mm: {
        en:
            "Strung Balance",
        cn:
            "穿线平衡点"
    },

    length_in: {
        en:
            "Length",
        cn:
            "长度"
    },

    swingweight: {
        en:
            "Swingweight",
        cn:
            "挥重"
    },

    stiffness_ra: {
        en:
            "Stiffness",
        cn:
            "硬度"
    },

    string_pattern: {
        en:
            "String Pattern",
        cn:
            "线床"
    },

    beam_mm: {
        en:
            "Beam",
        cn:
            "拍框厚度"
    }
};


function safeNumber(
    value
) {

    return (
        typeof value === "number" &&
        Number.isFinite(value)
    )
        ? value
        : null;
}


function buildProductName(
    product
) {

    if (
        !product
    ) {
        return null;
    }


    const brand =
        product.brand ??
        null;

    const model =
        product.model ??
        null;


    if (
        brand &&
        model
    ) {
        return `${brand} ${model}`;
    }


    return (
        model ??
        brand ??
        product.id ??
        null
    );
}


function buildProductSummary(
    product
) {

    if (
        !product
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

        release_year:
            product.release_year ??
            null,

        display_name:
            buildProductName(
                product
            )
    };
}


function relationWinner(
    relation
) {

    if (
        relation === "a_higher"
    ) {
        return "a";
    }


    if (
        relation === "b_higher"
    ) {
        return "b";
    }


    if (
        relation === "equal"
    ) {
        return "equal";
    }


    return null;
}


function buildMetricRows(
    source,
    labels
) {

    if (
        !source ||
        typeof source !== "object"
    ) {
        return [];
    }


    const rows = [];


    for (
        const [
            key,
            label
        ]
        of Object.entries(
            labels
        )
    ) {

        const metric =
            source[key];


        if (
            !metric ||
            metric.available !== true
        ) {
            continue;
        }


        rows.push({
            key,

            label: {
                ...label
            },

            available:
                true,

            value_a:
                metric.value_a ??
                null,

            value_b:
                metric.value_b ??
                null,

            delta:
                safeNumber(
                    metric.delta
                ),

            relation:
                metric.relation ??
                null,

            higher_product:
                relationWinner(
                    metric.relation
                )
        });
    }


    return rows;
}


function buildPreferenceSummary(
    preference
) {

    if (
        !preference ||
        preference.available !== true
    ) {

        return {
            available:
                false,

            preferred_product:
                null,

            reason:
                null,

            delta:
                null
        };
    }


    return {
        available:
            true,

        preferred_product:
            preference
                .preferred_product ??
            null,

        reason:
            preference.reason ??
            null,

        delta:
            safeNumber(
                preference.fit_delta ??
                preference.score_delta
            )
    };
}


function buildPlayerFitSummary(
    playerFit
) {

    if (
        !playerFit ||
        playerFit.available !== true
    ) {

        return {
            available:
                false,

            product_a:
                null,

            product_b:
                null,

            performance_preference:
                buildPreferenceSummary(
                    null
                ),

            practical_preference:
                buildPreferenceSummary(
                    null
                )
        };
    }


    const analysis =
        playerFit.analysis ??
        {};


    return {
        available:
            true,

        product_a: {
            match_score:
                safeNumber(
                    analysis
                        ?.product_a
                        ?.match_score
                ),

            performance_fit_score:
                safeNumber(
                    analysis
                        ?.product_a
                        ?.performance_fit_score
                ),

            continuity_bonus:
                safeNumber(
                    analysis
                        ?.product_a
                        ?.continuity_bonus
                ) ?? 0,

            reasons:
                Array.isArray(
                    analysis
                        ?.product_a
                        ?.reasons
                )
                    ? [
                        ...analysis
                            .product_a
                            .reasons
                    ]
                    : [],

            risk_flags:
                Array.isArray(
                    analysis
                        ?.product_a
                        ?.risk_flags
                )
                    ? [
                        ...analysis
                            .product_a
                            .risk_flags
                    ]
                    : []
        },

        product_b: {
            match_score:
                safeNumber(
                    analysis
                        ?.product_b
                        ?.match_score
                ),

            performance_fit_score:
                safeNumber(
                    analysis
                        ?.product_b
                        ?.performance_fit_score
                ),

            continuity_bonus:
                safeNumber(
                    analysis
                        ?.product_b
                        ?.continuity_bonus
                ) ?? 0,

            reasons:
                Array.isArray(
                    analysis
                        ?.product_b
                        ?.reasons
                )
                    ? [
                        ...analysis
                            .product_b
                            .reasons
                    ]
                    : [],

            risk_flags:
                Array.isArray(
                    analysis
                        ?.product_b
                        ?.risk_flags
                )
                    ? [
                        ...analysis
                            .product_b
                            .risk_flags
                    ]
                    : []
        },

        performance_preference:
            buildPreferenceSummary(
                playerFit
                    .performance_preference
            ),

        practical_preference:
            buildPreferenceSummary(
                playerFit
                    .practical_preference
            )
    };
}


/**
 * ============================================================
 * Public API
 * ============================================================
 */

export function buildComparisonAnswer(
    comparisonResult
) {

    if (
        !comparisonResult ||
        comparisonResult.success !== true ||
        comparisonResult.status !==
            "comparison_result_ready"
    ) {

        return {
            engine:
                ENGINE_NAME,

            version:
                ENGINE_VERSION,

            success:
                false,

            status:
                "comparison_answer_not_ready"
        };
    }


    const productA =
        buildProductSummary(
            comparisonResult
                ?.products
                ?.product_a
        );


    const productB =
        buildProductSummary(
            comparisonResult
                ?.products
                ?.product_b
        );


    const objective =
        comparisonResult
            ?.objective_analysis ??
        {};


    const dnaRows =
        buildMetricRows(
            objective.dna,
            DNA_LABELS
        );


    const specificationRows =
        buildMetricRows(
            objective.specifications,
            SPEC_LABELS
        );


    const playerFit =
        buildPlayerFitSummary(
            comparisonResult
                ?.player_fit
        );


    return {
        engine:
            ENGINE_NAME,

        version:
            ENGINE_VERSION,

        success:
            true,

        status:
            "comparison_answer_ready",

        products: {
            product_a:
                productA,

            product_b:
                productB
        },

        objective: {
            available:
                objective.success ===
                true,

            dna:
                dnaRows,

            specifications:
                specificationRows,

            data_quality:
                objective
                    .data_quality ??
                null
        },

        player_fit:
            playerFit,

        decision: {
            performance_preference:
                playerFit
                    .performance_preference,

            practical_preference:
                playerFit
                    .practical_preference
        }
    };
}


export default {
    buildComparisonAnswer
};
