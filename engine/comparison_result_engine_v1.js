/**
 * ============================================================
 * EveryCourtAI
 * Comparison Result Engine V1
 * ============================================================
 *
 * Purpose:
 *
 * Compose:
 *
 * 1. Objective product comparison
 * 2. Player-specific racquet comparison
 *
 * into one stable comparison result contract.
 *
 * Important:
 *
 * This engine does NOT:
 *
 * - resolve product names
 * - load product files
 * - create new scoring mathematics
 * - generate natural-language answers
 * - mutate player profile
 *
 * Objective comparison remains owned by:
 * comparison_analysis_engine_v1.js
 *
 * Player-fit scoring remains owned by:
 * matching_engine.js
 * player_comparison_engine_v1.js
 *
 * ============================================================
 */

import {
    analyzeRacquetComparison
} from "./comparison_analysis_engine_v1.js";

import {
    analyzePlayerRacquetComparison
} from "./player_comparison_engine_v1.js";


const ENGINE_NAME =
    "comparison_result_engine";

const ENGINE_VERSION =
    "1.0";


function buildPerformancePreference(
    playerComparison
) {

    if (
        !playerComparison ||
        playerComparison.success !== true
    ) {

        return {
            available:
                false,

            preferred_product:
                null,

            reason:
                null,

            fit_delta:
                null
        };
    }


    return {
        available:
            true,

        preferred_product:
            playerComparison
                .preferred_product ??
            null,

        reason:
            playerComparison
                .preference_reason ??
            null,

        fit_delta:
            playerComparison
                .fit_delta ??
            null
    };
}


function buildPracticalPreference(
    playerComparison
) {

    if (
        !playerComparison ||
        playerComparison.success !== true
    ) {

        return {
            available:
                false,

            preferred_product:
                null,

            reason:
                null,

            score_delta:
                null
        };
    }


    const productA =
        playerComparison.product_a;

    const productB =
        playerComparison.product_b;


    const scoreA =
        Number.isFinite(
            productA?.match_score
        )
            ? productA.match_score
            : null;

    const scoreB =
        Number.isFinite(
            productB?.match_score
        )
            ? productB.match_score
            : null;


    if (
        scoreA === null ||
        scoreB === null
    ) {

        return {
            available:
                false,

            preferred_product:
                null,

            reason:
                "insufficient_score_data",

            score_delta:
                null
        };
    }


    if (
        productA?.excluded === true &&
        productB?.excluded !== true
    ) {

        return {
            available:
                true,

            preferred_product:
                "b",

            reason:
                "product_a_excluded",

            score_delta:
                Number(
                    (
                        scoreA -
                        scoreB
                    ).toFixed(2)
                )
        };
    }


    if (
        productB?.excluded === true &&
        productA?.excluded !== true
    ) {

        return {
            available:
                true,

            preferred_product:
                "a",

            reason:
                "product_b_excluded",

            score_delta:
                Number(
                    (
                        scoreA -
                        scoreB
                    ).toFixed(2)
                )
        };
    }


    if (
        productA?.excluded === true &&
        productB?.excluded === true
    ) {

        return {
            available:
                true,

            preferred_product:
                null,

            reason:
                "both_products_excluded",

            score_delta:
                Number(
                    (
                        scoreA -
                        scoreB
                    ).toFixed(2)
                )
        };
    }


    const scoreDelta =
        Number(
            (
                scoreA -
                scoreB
            ).toFixed(2)
        );


    return {
        available:
            true,

        preferred_product:
            scoreDelta > 0
                ? "a"
                : (
                    scoreDelta < 0
                        ? "b"
                        : null
                ),

        reason:
            scoreDelta === 0
                ? "equal_practical_score"
                : "higher_practical_score",

        score_delta:
            scoreDelta
    };
}


/**
 * ============================================================
 * Public API
 * ============================================================
 */

export function buildComparisonResult(
    productA,
    productB,
    matchingRacquetA,
    matchingRacquetB,
    playerProfile = null
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
                "invalid_products"
        };
    }


    const objectiveAnalysis =
        analyzeRacquetComparison(
            productA,
            productB
        );


    const canRunPlayerComparison =
        Boolean(
            playerProfile &&
            matchingRacquetA &&
            matchingRacquetB
        );


    const playerComparison =
        canRunPlayerComparison
            ? analyzePlayerRacquetComparison(
                matchingRacquetA,
                matchingRacquetB,
                playerProfile
            )
            : null;


    const performancePreference =
        buildPerformancePreference(
            playerComparison
        );


    const practicalPreference =
        buildPracticalPreference(
            playerComparison
        );


    return {
        engine:
            ENGINE_NAME,

        version:
            ENGINE_VERSION,

        success:
            objectiveAnalysis
                ?.success === true,

        status:
            objectiveAnalysis
                ?.success === true
                ? "comparison_result_ready"
                : "comparison_analysis_failed",

        products: {
            product_a:
                objectiveAnalysis
                    ?.product_a ??
                null,

            product_b:
                objectiveAnalysis
                    ?.product_b ??
                null
        },

        objective_analysis:
            objectiveAnalysis,

        player_fit: {
            available:
                playerComparison
                    ?.success === true,

            analysis:
                playerComparison,

            performance_preference:
                performancePreference,

            practical_preference:
                practicalPreference
        }
    };
}


export default {
    buildComparisonResult
};
