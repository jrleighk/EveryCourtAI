/**
 * ============================================================
 * EveryCourtAI
 * Comparison Natural Language Builder V1
 * ============================================================
 *
 * Purpose:
 *
 * Convert Comparison Answer Builder V1 structured output
 * into deterministic bilingual comparison language.
 *
 * Important:
 *
 * This engine does NOT:
 *
 * - resolve products
 * - load product knowledge
 * - calculate DNA
 * - calculate specifications
 * - score products
 * - determine player fit
 * - determine winners
 * - modify recommendation decisions
 *
 * All factual and decision inputs must already exist in the
 * Comparison Answer Builder contract.
 *
 * ============================================================
 */

const ENGINE_NAME =
    "comparison_language_builder";

const ENGINE_VERSION =
    "1.0";


function getProductName(
    products,
    key
) {

    const product =
        key === "a"
            ? products?.product_a
            : (
                key === "b"
                    ? products?.product_b
                    : null
            );


    return (
        product?.display_name ??
        product?.model ??
        product?.id ??
        null
    );
}


function getShortProductName(
    products,
    key
) {

    const product =
        key === "a"
            ? products?.product_a
            : (
                key === "b"
                    ? products?.product_b
                    : null
            );


    return (
        product?.model ??
        product?.display_name ??
        product?.id ??
        null
    );
}


function formatValue(
    key,
    value
) {

    if (
        value === null ||
        value === undefined
    ) {
        return null;
    }


    switch (
        key
    ) {

        case "head_size_sq_in":
            return `${value} sq in`;

        case "weight_unstrung_g":
        case "weight_strung_g":
            return `${value} g`;

        case "balance_unstrung_mm":
        case "balance_strung_mm":
            return `${value} mm`;

        case "length_in":
            return `${value} in`;

        case "stiffness_ra":
            return `RA ${value}`;

        default:
            return String(
                value
            );
    }
}


function buildMetricSentence(
    row,
    products,
    language
) {

    if (
        !row
    ) {
        return null;
    }


    const label =
        row?.label?.[language] ??
        row?.key ??
        null;


    if (
        !label
    ) {
        return null;
    }


    const valueA =
        formatValue(
            row.key,
            row.value_a
        );

    const valueB =
        formatValue(
            row.key,
            row.value_b
        );


    const nameA =
        getShortProductName(
            products,
            "a"
        );

    const nameB =
        getShortProductName(
            products,
            "b"
        );


    if (
        !nameA ||
        !nameB
    ) {
        return null;
    }


    if (
        language === "cn"
    ) {

        if (
            row.relation === "a_higher"
        ) {
            return `${label}方面，${nameA}为${valueA}，高于${nameB}的${valueB}。`;
        }


        if (
            row.relation === "b_higher"
        ) {
            return `${label}方面，${nameB}为${valueB}，高于${nameA}的${valueA}。`;
        }


        if (
            row.relation === "equal"
        ) {
            return `${label}方面，两支球拍相同，均为${valueA}。`;
        }


        return null;
    }


    if (
        row.relation === "a_higher"
    ) {
        return `For ${label.toLowerCase()}, ${nameA} is ${valueA}, higher than ${nameB} at ${valueB}.`;
    }


    if (
        row.relation === "b_higher"
    ) {
        return `For ${label.toLowerCase()}, ${nameB} is ${valueB}, higher than ${nameA} at ${valueA}.`;
    }


    if (
        row.relation === "equal"
    ) {
        return `For ${label.toLowerCase()}, both racquets are equal at ${valueA}.`;
    }


    return null;
}


function buildMetricSentences(
    rows,
    products,
    language
) {

    if (
        !Array.isArray(
            rows
        )
    ) {
        return [];
    }


    return rows
        .map(
            row =>
                buildMetricSentence(
                    row,
                    products,
                    language
                )
        )
        .filter(
            Boolean
        );
}


function buildPerformanceDecision(
    answer,
    language
) {

    const preference =
        answer
            ?.decision
            ?.performance_preference;


    if (
        preference?.available !== true
    ) {
        return null;
    }


    const preferred =
        preference
            .preferred_product;


    const name =
        getProductName(
            answer.products,
            preferred
        );


    if (
        !name
    ) {
        return null;
    }


    const delta =
        Math.abs(
            Number(
                preference.delta ??
                0
            )
        );


    if (
        language === "cn"
    ) {

        if (
            preferred === null
        ) {
            return "从纯粹的球员适配来看，两支球拍表现接近。";
        }


        return `从纯粹的球员适配来看，${name}略占优势，适配分差为${delta}分。`;
    }


    if (
        preferred === null
    ) {
        return "From a pure player-fit perspective, the two racquets are closely matched.";
    }


    return `From a pure player-fit perspective, ${name} has the advantage by ${delta} point${delta === 1 ? "" : "s"}.`;
}


function buildPracticalDecision(
    answer,
    language
) {

    const preference =
        answer
            ?.decision
            ?.practical_preference;


    if (
        preference?.available !== true
    ) {
        return null;
    }


    const preferred =
        preference
            .preferred_product;


    const name =
        getProductName(
            answer.products,
            preferred
        );


    if (
        !name
    ) {
        return null;
    }


    const delta =
        Math.abs(
            Number(
                preference.delta ??
                0
            )
        );


    if (
        language === "cn"
    ) {

        if (
            preferred === null
        ) {
            return "综合当前装备延续性后，两支球拍的实际选择接近。";
        }


        return `综合当前装备延续性后，${name}的实际选择分更高，差距为${delta}分。`;
    }


    if (
        preferred === null
    ) {
        return "After current-equipment continuity is considered, the practical choice is closely matched.";
    }


    return `After current-equipment continuity is considered, ${name} has the higher practical score by ${delta} point${delta === 1 ? "" : "s"}.`;
}


function buildLanguageBlock(
    answer,
    language
) {

    const productA =
        getProductName(
            answer.products,
            "a"
        );


    const productB =
        getProductName(
            answer.products,
            "b"
        );


    const title =
        language === "cn"
            ? `${productA} 与 ${productB} 对比`
            : `${productA} vs ${productB}`;


    const dna =
        buildMetricSentences(
            answer
                ?.objective
                ?.dna,
            answer.products,
            language
        );


    const specifications =
        buildMetricSentences(
            answer
                ?.objective
                ?.specifications,
            answer.products,
            language
        );


    const performanceDecision =
        buildPerformanceDecision(
            answer,
            language
        );


    const practicalDecision =
        buildPracticalDecision(
            answer,
            language
        );


    const decision = [
        performanceDecision,
        practicalDecision
    ].filter(
        Boolean
    );


    return {
        title,

        objective: {
            dna,
            specifications
        },

        player_fit: {
            available:
                answer
                    ?.player_fit
                    ?.available === true,

            decision
        }
    };
}


/**
 * ============================================================
 * Public API
 * ============================================================
 */

export function buildComparisonLanguage(
    answer
) {

    if (
        !answer ||
        answer.success !== true ||
        answer.status !==
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
                "comparison_language_not_ready"
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
            "comparison_language_ready",

        cn:
            buildLanguageBlock(
                answer,
                "cn"
            ),

        en:
            buildLanguageBlock(
                answer,
                "en"
            )
    };
}


export default {
    buildComparisonLanguage
};
