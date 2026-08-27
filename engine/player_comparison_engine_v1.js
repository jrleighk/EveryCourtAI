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


/**
 * ============================================================
 * Player Fit Semantic Signals V1
 * ============================================================
 *
 * Purpose:
 *
 * Translate matching-engine mathematical evidence into a
 * stable semantic contract for downstream comparison layers.
 *
 * This layer does NOT:
 *
 * - modify matching scores
 * - create recommendation mathematics
 * - change player comparison preference
 *
 * It only interprets existing scoring evidence.
 * ============================================================
 */

function classifySwingCompatibility(
    value
) {

    if (
        !Number.isFinite(
            value
        )
    ) {
        return "unknown";
    }


    if (
        value >= 7
    ) {
        return "strong";
    }


    if (
        value >= 4
    ) {
        return "moderate";
    }


    return "weak";
}


function classifyWeightCompatibility(
    staticWeightFit,
    swingweightFit
) {

    const staticValue =
        Number.isFinite(
            staticWeightFit
        )
            ? staticWeightFit
            : 0;


    const swingValue =
        Number.isFinite(
            swingweightFit
        )
            ? swingweightFit
            : 0;


    if (
        staticValue < 0 ||
        swingValue <= -3
    ) {
        return "demanding";
    }


    if (
        swingValue < 0 ||
        staticValue === 0
    ) {
        return "moderate";
    }


    if (
        staticValue > 0 &&
        swingValue > 0
    ) {
        return "strong";
    }


    return "neutral";
}


function classifyPhysicalDemand(
    physicalAdjustment,
    riskFlags
) {

    const adjustment =
        Number.isFinite(
            physicalAdjustment
        )
            ? physicalAdjustment
            : 0;


    const hasRisk =
        Array.isArray(
            riskFlags
        ) &&
        riskFlags.length > 0;


    if (
        adjustment <= -15 ||
        hasRisk
    ) {
        return "high";
    }


    if (
        adjustment < 0
    ) {
        return "moderate";
    }


    return "low";
}


function classifyGoalAlignment(
    goalAdjustment
) {

    if (
        !Number.isFinite(
            goalAdjustment
        )
    ) {
        return "unknown";
    }


    if (
        goalAdjustment > 2
    ) {
        return "positive";
    }


    if (
        goalAdjustment < 0
    ) {
        return "negative";
    }


    return "neutral";
}


function buildPlayerFitSignals(
    product
) {

    if (
        !product ||
        typeof product !== "object"
    ) {
        return null;
    }


    const breakdown =
        product.score_breakdown ?? {};


    const riskFlags =
        Array.isArray(
            product.risk_flags
        )
            ? product.risk_flags
            : [];


    const swingCompatibility =
        breakdown
            .swing_compatibility_raw;


    const staticWeightFit =
        breakdown
            .static_weight_fit;


    const swingweightFit =
        breakdown
            .swingweight_fit;


    const physicalAdjustment =
        breakdown.physical;


    const goalAdjustment =
        breakdown.goal;


    return {

        swing_compatibility: {
            status:
                classifySwingCompatibility(
                    swingCompatibility
                ),

            evidence: {
                raw:
                    Number.isFinite(
                        swingCompatibility
                    )
                        ? swingCompatibility
                        : null
            }
        },


        weight_compatibility: {
            status:
                classifyWeightCompatibility(
                    staticWeightFit,
                    swingweightFit
                ),

            evidence: {
                static_weight_fit:
                    Number.isFinite(
                        staticWeightFit
                    )
                        ? staticWeightFit
                        : null,

                swingweight_fit:
                    Number.isFinite(
                        swingweightFit
                    )
                        ? swingweightFit
                        : null
            }
        },


        physical_demand: {
            status:
                classifyPhysicalDemand(
                    physicalAdjustment,
                    riskFlags
                ),

            risk:
                riskFlags.length > 0,

            evidence: {
                adjustment:
                    Number.isFinite(
                        physicalAdjustment
                    )
                        ? physicalAdjustment
                        : null,

                risk_flags:
                    [...riskFlags]
            }
        },


        goal_alignment: {
            status:
                classifyGoalAlignment(
                    goalAdjustment
                ),

            evidence: {
                adjustment:
                    Number.isFinite(
                        goalAdjustment
                    )
                        ? goalAdjustment
                        : null
            }
        }
    };
}


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

        player_fit_signals: {
            product_a:
                buildPlayerFitSignals(
                    candidateA
                ),

            product_b:
                buildPlayerFitSignals(
                    candidateB
                )
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
