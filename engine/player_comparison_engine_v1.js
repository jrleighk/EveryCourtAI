/**
 * ============================================================
 * EveryCourtAI
 * Player Comparison Engine V1
 * ============================================================
 *
 * Purpose:
 *
 * Compare two racquets for one specific player while reusing
 * the exact racquet scoring mathematics from Matching Engine.
 *
 * Important:
 *
 * This engine does NOT create product scores.
 * Matching Engine remains the scoring source of truth.
 *
 * ============================================================
 */

import {
    scoreRacquetForPlayer
} from "./matching_engine.js";


const ENGINE_NAME =
    "player_comparison_engine";

const ENGINE_VERSION =
    "1.0";


function safeNumber(
    value
) {

    return Number.isFinite(
        Number(value)
    )
        ? Number(value)
        : null;
}


function buildCandidateSummary(
    scored
) {

    const candidate =
        scored?.candidate ??
        null;


    if (
        !candidate
    ) {

        return null;
    }


    return {
        id:
            candidate.id ??
            null,

        brand:
            candidate.brand ??
            null,

        model:
            candidate.model ??
            null,

        match_score:
            safeNumber(
                candidate.match_score
            ),

        excluded:
            scored?.excluded ===
            true,

        score_breakdown:
            candidate
                .score_breakdown ??
            {},

        reasons:
            Array.isArray(
                candidate.reasons
            )
                ? [
                    ...candidate.reasons
                ]
                : [],

        risk_flags:
            Array.isArray(
                candidate.risk_flags
            )
                ? [
                    ...candidate.risk_flags
                ]
                : []
    };
}


function getContinuityBonus(
    candidate
) {

    return safeNumber(
        candidate
            ?.score_breakdown
            ?.current_setup_continuity
    ) ?? 0;
}


function calculatePerformanceFitScore(
    candidate
) {

    const score =
        safeNumber(
            candidate
                ?.match_score
        );


    if (
        score === null
    ) {

        return null;
    }


    /**
     * Remove continuity bonus so comparison can distinguish:
     *
     * - pure player/product fit
     * - recommendation continuity advantage
     *
     * Matching score itself remains untouched.
     */

    return Number(
        (
            score -
            getContinuityBonus(
                candidate
            )
        )
            .toFixed(
                2
            )
    );
}


function determinePreferredProduct(
    candidateA,
    candidateB
) {

    /**
     * Safety exclusion has highest priority.
     */

    if (
        candidateA?.excluded ===
            true &&
        candidateB?.excluded !==
            true
    ) {

        return {
            preferred:
                "b",

            reason:
                "product_a_excluded"
        };
    }


    if (
        candidateB?.excluded ===
            true &&
        candidateA?.excluded !==
            true
    ) {

        return {
            preferred:
                "a",

            reason:
                "product_b_excluded"
        };
    }


    if (
        candidateA?.excluded ===
            true &&
        candidateB?.excluded ===
            true
    ) {

        return {
            preferred:
                null,

            reason:
                "both_products_excluded"
        };
    }


    const fitA =
        calculatePerformanceFitScore(
            candidateA
        );

    const fitB =
        calculatePerformanceFitScore(
            candidateB
        );


    if (
        fitA === null ||
        fitB === null
    ) {

        return {
            preferred:
                null,

            reason:
                "insufficient_score_data"
        };
    }


    if (
        fitA >
        fitB
    ) {

        return {
            preferred:
                "a",

            reason:
                "higher_player_fit"
        };
    }


    if (
        fitB >
        fitA
    ) {

        return {
            preferred:
                "b",

            reason:
                "higher_player_fit"
        };
    }


    return {
        preferred:
            null,

        reason:
            "equal_player_fit"
    };
}


/**
 * ============================================================
 * Public API
 * ============================================================
 */

export function analyzePlayerRacquetComparison(
    racquetA,
    racquetB,
    playerProfile
) {

    if (
        !racquetA ||
        !racquetB ||
        !playerProfile
    ) {

        return {
            engine:
                ENGINE_NAME,

            version:
                ENGINE_VERSION,

            success:
                false,

            status:
                "invalid_input"
        };
    }


    const scoredA =
        scoreRacquetForPlayer(
            racquetA,
            playerProfile
        );


    const scoredB =
        scoreRacquetForPlayer(
            racquetB,
            playerProfile
        );


    const candidateA =
        buildCandidateSummary(
            scoredA
        );


    const candidateB =
        buildCandidateSummary(
            scoredB
        );


    const preference =
        determinePreferredProduct(
            candidateA,
            candidateB
        );


    const fitA =
        calculatePerformanceFitScore(
            candidateA
        );


    const fitB =
        calculatePerformanceFitScore(
            candidateB
        );


    return {
        engine:
            ENGINE_NAME,

        version:
            ENGINE_VERSION,

        success:
            true,

        status:
            "player_comparison_ready",

        product_a:
            {
                ...candidateA,

                continuity_bonus:
                    getContinuityBonus(
                        candidateA
                    ),

                performance_fit_score:
                    fitA
            },

        product_b:
            {
                ...candidateB,

                continuity_bonus:
                    getContinuityBonus(
                        candidateB
                    ),

                performance_fit_score:
                    fitB
            },

        preferred_product:
            preference.preferred,

        preference_reason:
            preference.reason,

        fit_delta:
            (
                fitA !== null &&
                fitB !== null
            )
                ? Number(
                    (
                        fitA -
                        fitB
                    )
                        .toFixed(
                            2
                        )
                )
                : null
    };
}


export default {
    analyzePlayerRacquetComparison
};
