/**
 * ============================================================
 * EveryCourtAI
 * Comparison Player Decision Narrative V1
 * ============================================================
 *
 * Purpose:
 *
 * Convert preserved player comparison decisions into concise
 * bilingual explanation.
 *
 * Important:
 *
 * This layer does NOT:
 *
 * - score products
 * - recalculate player fit
 * - determine recommendation winners
 * - modify performance preference
 * - modify practical preference
 * - infer unavailable player data
 *
 * Source of truth:
 *
 * comparison_explanation_synthesis_v1.js
 *
 * ============================================================
 */

const ENGINE_NAME =
    "comparison_player_decision_narrative";

const ENGINE_VERSION =
    "1.0";


function getProduct(
    synthesis,
    key
) {

    if (
        key === "a"
    ) {
        return (
            synthesis
                ?.products
                ?.product_a ??
            null
        );
    }


    if (
        key === "b"
    ) {
        return (
            synthesis
                ?.products
                ?.product_b ??
            null
        );
    }


    return null;
}


function getProductName(
    synthesis,
    key
) {

    const product =
        getProduct(
            synthesis,
            key
        );


    return (
        product?.display_name ??
        product?.model ??
        product?.id ??
        null
    );
}


function buildUnavailable() {

    return {
        engine:
            ENGINE_NAME,

        version:
            ENGINE_VERSION,

        success:
            true,

        status:
            "player_decision_narrative_unavailable",

        available:
            false,

        decision_conflict:
            false,

        performance_preference:
            null,

        practical_preference:
            null,

        cn:
            null,

        en:
            null
    };
}


export function buildPlayerDecisionNarrative(
    synthesis
) {

    if (
        !synthesis ||
        synthesis.success !== true ||
        synthesis.status !==
            "comparison_explanation_synthesis_ready"
    ) {

        return {
            engine:
                ENGINE_NAME,

            version:
                ENGINE_VERSION,

            success:
                false,

            status:
                "player_decision_narrative_not_ready",

            available:
                false
        };
    }


    const decision =
        synthesis
            ?.clusters
            ?.player_decision ??
        null;


    if (
        !decision ||
        decision.available !== true
    ) {
        return buildUnavailable();
    }


    const performance =
        decision
            ?.performance_preference ??
        null;


    const practical =
        decision
            ?.practical_preference ??
        null;


    const performanceProduct =
        (
            performance
                ?.preferred_product ===
                "a" ||
            performance
                ?.preferred_product ===
                "b"
        )
            ? performance
                .preferred_product
            : null;


    const practicalProduct =
        (
            practical
                ?.preferred_product ===
                "a" ||
            practical
                ?.preferred_product ===
                "b"
        )
            ? practical
                .preferred_product
            : null;


    const performanceName =
        getProductName(
            synthesis,
            performanceProduct
        );


    const practicalName =
        getProductName(
            synthesis,
            practicalProduct
        );


    const conflict =
        Boolean(
            decision.decision_conflict ===
                true &&
            performanceProduct &&
            practicalProduct &&
            performanceProduct !==
                practicalProduct
        );


    let cn =
        null;

    let en =
        null;


    if (
        conflict
    ) {

        cn =
            `从纯性能匹配来看，${performanceName}更符合当前球员需求；但从实际使用与延续性来看，${practicalName}是更稳妥的选择。`;

        en =
            `From a pure performance-fit perspective, ${performanceName} is the stronger match for the player's current needs; however, from a practical-use and continuity perspective, ${practicalName} is the safer choice.`;
    }
    else if (
        performanceProduct &&
        practicalProduct &&
        performanceProduct ===
            practicalProduct
    ) {

        cn =
            `无论从性能匹配还是实际使用角度，${performanceName}都获得一致偏好。`;

        en =
            `Both performance fit and practical-use considerations point toward ${performanceName}.`;
    }
    else if (
        performanceProduct
    ) {

        cn =
            `从性能匹配来看，${performanceName}更符合当前球员需求。`;

        en =
            `From a performance-fit perspective, ${performanceName} is the stronger match for the player's current needs.`;
    }
    else if (
        practicalProduct
    ) {

        cn =
            `从实际使用角度来看，${practicalName}是更稳妥的选择。`;

        en =
            `From a practical-use perspective, ${practicalName} is the safer choice.`;
    }


    if (
        !cn ||
        !en
    ) {
        return buildUnavailable();
    }


    return {
        engine:
            ENGINE_NAME,

        version:
            ENGINE_VERSION,

        success:
            true,

        status:
            "player_decision_narrative_ready",

        available:
            true,

        decision_conflict:
            conflict,

        performance_preference: {
            preferred_product:
                performanceProduct,

            product_name:
                performanceName,

            reason:
                performance?.reason ??
                null,

            delta:
                performance?.delta ??
                null
        },

        practical_preference: {
            preferred_product:
                practicalProduct,

            product_name:
                practicalName,

            reason:
                practical?.reason ??
                null,

            delta:
                practical?.delta ??
                null
        },

        cn,

        en
    };
}


export default {
    buildPlayerDecisionNarrative
};
