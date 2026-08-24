/**
 * ============================================================
 * EveryCourtAI
 * Setup Scenario Engine V0.1
 *
 * File:
 * engine/setup_scenario_engine.js
 *
 * Purpose:
 * Build multiple logically distinct equipment setups from the
 * existing racquet + string candidate pools.
 *
 * Core scenarios:
 *
 * 1. Best Overall
 * 2. Comfort
 * 3. Performance
 * 4. Minimal Change
 *
 * Important:
 * - Does NOT replace recommendation_engine.js
 * - Does NOT replace alternative_engine.js
 * - Does NOT modify commerce
 * - Does NOT hard-code product recommendations
 * - Uses candidates already scored by EveryCourtAI
 * ============================================================
 */


const ENGINE_NAME =
    "setup_scenario_engine";

const ENGINE_VERSION =
    "0.1";


/**
 * ============================================================
 * Scenario Types
 * ============================================================
 */

export const SETUP_SCENARIO_TYPES = {

    BEST_OVERALL:
        "best_overall",

    COMFORT:
        "comfort",

    PERFORMANCE:
        "performance",

    MINIMAL_CHANGE:
        "minimal_change"
};


/**
 * ============================================================
 * Default Scenario Weights
 *
 * These are intentionally different.
 *
 * The purpose is NOT to create four copies of the same setup.
 * Each scenario optimizes for a different player objective.
 * ============================================================
 */

const SCENARIO_WEIGHTS = {

    best_overall: {

        base_match:
            0.70,

        comfort:
            0.10,

        performance:
            0.10,

        continuity:
            0.10
    },


    comfort: {

        base_match:
            0.45,

        comfort:
            0.40,

        performance:
            0.05,

        continuity:
            0.10
    },


    performance: {

        base_match:
            0.45,

        comfort:
            0.05,

        performance:
            0.40,

        continuity:
            0.10
    },


    minimal_change: {

        base_match:
            0.35,

        comfort:
            0.10,

        performance:
            0.05,

        continuity:
            0.50
    }
};


/**
 * ============================================================
 * Helpers
 * ============================================================
 */

function safeNumber(
    value,
    fallback = 0
) {

    const number =
        Number(
            value
        );


    return Number.isFinite(
        number
    )
        ? number
        : fallback;
}


function clamp(
    value,
    min = 0,
    max = 100
) {

    return Math.max(
        min,
        Math.min(
            max,
            value
        )
    );
}


function normalizeText(
    value
) {

    return String(
        value ??
        ""
    )
        .trim()
        .toLowerCase();
}


function getCandidateId(
    candidate
) {

    return (
        candidate?.id ??
        candidate?.product_id ??
        candidate?.racquet_id ??
        candidate?.string_id ??
        candidate?.slug ??
        null
    );
}


function getCandidateName(
    candidate
) {

    return (
        candidate?.name ??
        candidate?.display_name ??
        candidate?.product_name ??
        candidate?.model ??
        getCandidateId(
            candidate
        )
    );
}


/**
 * ============================================================
 * Base Match Score
 *
 * Candidate structures may evolve between engine versions.
 * Therefore this helper intentionally supports several existing
 * score field names.
 * ============================================================
 */

function getBaseMatchScore(
    candidate
) {

    return clamp(
        safeNumber(
            candidate?.match_score ??
            candidate?.score ??
            candidate?.ranking_score ??
            candidate?.overall_score ??
            candidate?.final_score ??
            0
        )
    );
}


/**
 * ============================================================
 * Trait Extraction
 * ============================================================
 */

function collectTraitText(
    candidate
) {

    const values = [

        candidate?.category,

        candidate?.family,

        candidate?.type,

        candidate?.material,

        candidate?.feel,

        candidate?.profile,

        candidate?.description,

        candidate?.power_level,

        candidate?.control_level,

        candidate?.spin_level,

        candidate?.comfort_level,

        ...(Array.isArray(
            candidate?.traits
        )
            ? candidate.traits
            : []),

        ...(Array.isArray(
            candidate?.tags
        )
            ? candidate.tags
            : []),

        ...(Array.isArray(
            candidate?.strengths
        )
            ? candidate.strengths
            : [])

    ];


    return values
        .filter(
            Boolean
        )
        .map(
            normalizeText
        )
        .join(
            " "
        );
}


/**
 * ============================================================
 * Comfort Score
 *
 * V0.1:
 * Use available structured scores first.
 * Trait text is only a secondary signal.
 *
 * This is deliberately conservative until the scenario layer
 * is connected to the exact normalized product schema.
 * ============================================================
 */

function calculateComfortScore(
    candidate
) {

    const productData =
        candidate?.product_data ??
        {};


    /**
     * ========================================================
     * Racquet
     * ========================================================
     */

    if (
        candidate?.candidate_type ===
            "racquet"
    ) {

        const performance =
            productData?.performance ??
            {};


        const comfort =
            safeNumber(
                performance
                    ?.comfort
                    ?.rating,
                5
            );


        const maneuverability =
            safeNumber(
                performance
                    ?.maneuverability
                    ?.rating,
                5
            );


        const stability =
            safeNumber(
                performance
                    ?.stability
                    ?.rating,
                5
            );


        const weight =
            safeNumber(
                candidate
                    ?.specifications
                    ?.weight_g,
                null
            );


        const headSize =
            safeNumber(
                candidate
                    ?.specifications
                    ?.head_size_sq_in,
                null
            );


        /**
         * Weight comfort heuristic
         *
         * This is intentionally mild.
         * It must not overpower actual product ratings.
         */

        let weightComfort =
            70;


        if (
            weight !== null
        ) {

            if (
                weight <= 285
            ) {
                weightComfort =
                    92;
            } else if (
                weight <= 300
            ) {
                weightComfort =
                    86;
            } else if (
                weight <= 310
            ) {
                weightComfort =
                    78;
            } else if (
                weight <= 320
            ) {
                weightComfort =
                    68;
            } else {
                weightComfort =
                    58;
            }
        }


        let forgiveness =
            70;


        if (
            headSize !== null
        ) {

            if (
                headSize >= 105
            ) {
                forgiveness =
                    94;
            } else if (
                headSize >= 100
            ) {
                forgiveness =
                    86;
            } else if (
                headSize >= 98
            ) {
                forgiveness =
                    76;
            } else {
                forgiveness =
                    66;
            }
        }


        const score =
            (
                comfort * 10 *
                    0.45
            ) +
            (
                maneuverability * 10 *
                    0.20
            ) +
            (
                stability * 10 *
                    0.10
            ) +
            (
                weightComfort *
                    0.15
            ) +
            (
                forgiveness *
                    0.10
            );


        return clamp(
            score
        );
    }


    /**
     * ========================================================
     * String
     * ========================================================
     */

    if (
        candidate?.candidate_type ===
            "string"
    ) {

        const aiRating =
            productData?.ai_rating ??
            {};


        const performanceProfile =
            productData
                ?.performance_profile ??
            {};


        const comfort =
            safeNumber(
                aiRating?.comfort,
                5
            );


        const feel =
            safeNumber(
                aiRating?.feel,
                5
            );


        const armFriendliness =
            safeNumber(
                performanceProfile
                    ?.arm_friendliness,
                comfort
            );


        const gauges =
            productData
                ?.specifications
                ?.available_gauges;


        let elasticity =
            5;


        if (
            Array.isArray(
                gauges
            ) &&
            gauges.length > 0
        ) {

            const values =
                gauges
                    .map(
                        gauge =>
                            safeNumber(
                                gauge?.elasticity,
                                null
                            )
                    )
                    .filter(
                        value =>
                            value !==
                                null
                    );


            if (
                values.length > 0
            ) {

                elasticity =
                    values.reduce(
                        (
                            total,
                            value
                        ) =>
                            total +
                            value,
                        0
                    ) /
                    values.length;
            }
        }


        const score =
            (
                comfort * 10 *
                    0.45
            ) +
            (
                armFriendliness * 10 *
                    0.25
            ) +
            (
                feel * 10 *
                    0.15
            ) +
            (
                elasticity * 10 *
                    0.15
            );


        return clamp(
            score
        );
    }


    /**
     * Legacy fallback
     */

    const text =
        collectTraitText(
            candidate
        );


    let score =
        50;


    if (
        text.includes(
            "comfort"
        )
    ) {
        score +=
            10;
    }


    if (
        text.includes(
            "soft"
        )
    ) {
        score +=
            10;
    }


    return clamp(
        score
    );
}


/**
 * ============================================================
 * Performance Score
 * ============================================================
 */

function calculatePerformanceScore(
    candidate
) {

    const productData =
        candidate?.product_data ??
        {};


    /**
     * ========================================================
     * Racquet
     * ========================================================
     */

    if (
        candidate?.candidate_type ===
            "racquet"
    ) {

        const performance =
            productData?.performance ??
            {};


        const control =
            safeNumber(
                performance
                    ?.control
                    ?.rating,
                5
            );


        const spin =
            safeNumber(
                performance
                    ?.spin
                    ?.rating,
                5
            );


        const stability =
            safeNumber(
                performance
                    ?.stability
                    ?.rating,
                5
            );


        const power =
            safeNumber(
                performance
                    ?.power
                    ?.rating,
                5
            );


        const score =
            (
                control * 10 *
                    0.35
            ) +
            (
                spin * 10 *
                    0.25
            ) +
            (
                stability * 10 *
                    0.25
            ) +
            (
                power * 10 *
                    0.15
            );


        return clamp(
            score
        );
    }


    /**
     * ========================================================
     * String
     * ========================================================
     */

    if (
        candidate?.candidate_type ===
            "string"
    ) {

        const aiRating =
            productData?.ai_rating ??
            {};


        const performanceProfile =
            productData
                ?.performance_profile ??
            {};


        const control =
            safeNumber(
                aiRating?.control,
                5
            );


        const spin =
            safeNumber(
                aiRating?.spin,
                5
            );


        const feel =
            safeNumber(
                aiRating?.feel,
                5
            );


        const directionalPrecision =
            safeNumber(
                performanceProfile
                    ?.directional_precision,
                control
            );


        const score =
            (
                control * 10 *
                    0.35
            ) +
            (
                spin * 10 *
                    0.25
            ) +
            (
                directionalPrecision * 10 *
                    0.25
            ) +
            (
                feel * 10 *
                    0.15
            );


        return clamp(
            score
        );
    }


    /**
     * Legacy fallback
     */

    const text =
        collectTraitText(
            candidate
        );


    let score =
        50;


    if (
        text.includes(
            "control"
        )
    ) {
        score +=
            8;
    }


    if (
        text.includes(
            "spin"
        )
    ) {
        score +=
            8;
    }


    return clamp(
        score
    );
}


/**
 * ============================================================
 * Current Equipment Detection
 * ============================================================
 */

function getCurrentRacquetId(
    playerProfile
) {

    return (
        playerProfile
            ?.current_setup
            ?.racquet
            ?.id ??

        playerProfile
            ?.current_equipment
            ?.racquet_id ??

        playerProfile
            ?.current_racquet
            ?.id ??

        playerProfile
            ?.current_racquet_id ??

        playerProfile
            ?.equipment
            ?.racquet_id ??

        null
    );
}


function getCurrentStringId(
    playerProfile
) {

    return (
        playerProfile
            ?.current_setup
            ?.string
            ?.main
            ?.id ??

        playerProfile
            ?.current_setup
            ?.string
            ?.id ??

        playerProfile
            ?.current_equipment
            ?.string_id ??

        playerProfile
            ?.current_string
            ?.id ??

        playerProfile
            ?.current_string_id ??

        playerProfile
            ?.equipment
            ?.string_id ??

        null
    );
}


/**
 * ============================================================
 * Continuity Score
 *
 * Minimal Change is now treated as ONE scenario objective,
 * rather than the governing principle for every recommendation.
 * ============================================================
 */

function calculateContinuityScore(
    candidate,
    currentProductId
) {

    if (
        !currentProductId
    ) {

        return 50;
    }


    const candidateId =
        getCandidateId(
            candidate
        );


    if (
        !candidateId
    ) {

        return 50;
    }


    return (
        normalizeText(
            candidateId
        ) ===
        normalizeText(
            currentProductId
        )
    )
        ? 100
        : 25;
}


/**
 * ============================================================
 * Candidate Scenario Score
 * ============================================================
 */

function calculateScenarioCandidateScore(
    candidate,
    scenarioType,
    currentProductId = null
) {

    const weights =
        SCENARIO_WEIGHTS[
            scenarioType
        ] ??
        SCENARIO_WEIGHTS
            .best_overall;


    const baseMatch =
        getBaseMatchScore(
            candidate
        );


    const comfort =
        calculateComfortScore(
            candidate
        );


    const performance =
        calculatePerformanceScore(
            candidate
        );


    const continuity =
        calculateContinuityScore(
            candidate,
            currentProductId
        );


    const score =
        (
            baseMatch *
            weights.base_match
        ) +
        (
            comfort *
            weights.comfort
        ) +
        (
            performance *
            weights.performance
        ) +
        (
            continuity *
            weights.continuity
        );


    return {

        score:
            Number(
                score
                    .toFixed(
                        2
                    )
            ),

        components: {

            base_match:
                baseMatch,

            comfort,

            performance,

            continuity
        }
    };
}


/**
 * ============================================================
 * Rank Candidates For Scenario
 * ============================================================
 */

function rankCandidatesForScenario(
    candidates,
    scenarioType,
    currentProductId = null
) {

    if (
        !Array.isArray(
            candidates
        )
    ) {

        return [];
    }


    return candidates
        .map(
            candidate => {

                const scenarioScore =
                    calculateScenarioCandidateScore(
                        candidate,
                        scenarioType,
                        currentProductId
                    );


                return {

                    candidate,

                    scenario_score:
                        scenarioScore
                            .score,

                    scenario_components:
                        scenarioScore
                            .components
                };
            }
        )
        .sort(
            (
                a,
                b
            ) =>
                b.scenario_score -
                a.scenario_score
        );
}


/**
 * ============================================================
 * Pair Compatibility
 *
 * V0.1 starts conservatively.
 *
 * Existing matching scores remain the dominant signal.
 * Later versions can add:
 *
 * - racquet stiffness × string stiffness
 * - head size × gauge
 * - pattern density × string type
 * - launch profile compatibility
 * - swingweight × player swing speed
 * - physical sensitivity constraints
 * ============================================================
 */

function getStringStiffnessScore(
    stringCandidate
) {

    const stiffness =
        normalizeText(
            stringCandidate
                ?.product_data
                ?.performance_profile
                ?.string_stiffness
        );


    const mapping = {

        very_soft:
            2,

        soft:
            3,

        medium_soft:
            4,

        medium:
            5,

        medium_firm:
            7,

        firm:
            8,

        very_firm:
            9
    };


    const normalized =
        stiffness
            .replace(
                /[\s-]+/g,
                "_"
            );


    return (
        mapping[
            normalized
        ] ??
        5
    );
}


/**
 * ============================================================
 * Pair Compatibility V0.2
 *
 * Racquet and string must work as a system.
 *
 * A high-scoring racquet and a high-scoring string are not
 * automatically a high-scoring setup.
 * ============================================================
 */

function calculatePairCompatibility(
    racquetEntry,
    stringEntry,
    scenarioType =
        SETUP_SCENARIO_TYPES
            .BEST_OVERALL
) {

    if (
        !racquetEntry ||
        !stringEntry
    ) {

        return 0;
    }


    const racquet =
        racquetEntry
            .candidate;


    const string =
        stringEntry
            .candidate;


    const racquetScore =
        safeNumber(
            racquetEntry
                .scenario_score
        );


    const stringScore =
        safeNumber(
            stringEntry
                .scenario_score
        );


    let score =
        (
            racquetScore +
            stringScore
        ) /
        2;


    /**
     * ========================================================
     * Racquet Load
     * ========================================================
     */

    const weight =
        safeNumber(
            racquet
                ?.specifications
                ?.weight_g,
            null
        );


    const swingweight =
        safeNumber(
            racquet
                ?.specifications
                ?.swingweight,
            null
        );


    const headSize =
        safeNumber(
            racquet
                ?.specifications
                ?.head_size_sq_in,
            null
        );


    const pattern =
        normalizeText(
            racquet
                ?.specifications
                ?.string_pattern
        );


    /**
     * ========================================================
     * String Characteristics
     * ========================================================
     */

    const stiffness =
        getStringStiffnessScore(
            string
        );


    const stringProfile =
        string
            ?.product_data
            ?.performance_profile ??
        {};


    const aiRating =
        string
            ?.product_data
            ?.ai_rating ??
        {};


    const armFriendliness =
        safeNumber(
            stringProfile
                ?.arm_friendliness,
            safeNumber(
                aiRating?.comfort,
                5
            )
        );


    const directionalPrecision =
        safeNumber(
            stringProfile
                ?.directional_precision,
            safeNumber(
                aiRating?.control,
                5
            )
        );


    const spin =
        safeNumber(
            aiRating?.spin,
            5
        );


    /**
     * ========================================================
     * Heavy / High-SW Frame + Firm String
     *
     * Prevent overly demanding / harsh pairings.
     * ========================================================
     */

    const demandingFrame =
        (
            weight !== null &&
            weight >= 315
        ) ||
        (
            swingweight !== null &&
            swingweight >= 330
        );


    if (
        demandingFrame &&
        stiffness >= 7
    ) {

        score -=
            4;
    }


    if (
        demandingFrame &&
        stiffness >= 8 &&
        armFriendliness <= 6
    ) {

        score -=
            3;
    }


    /**
     * Small head + demanding frame + firm string
     */

    if (
        headSize !== null &&
        headSize <= 98 &&
        demandingFrame &&
        stiffness >= 7
    ) {

        score -=
            2;
    }


    /**
     * ========================================================
     * Pattern Compatibility
     * ========================================================
     */

    if (
        pattern.includes(
            "18x20"
        ) &&
        stiffness >= 8
    ) {

        score -=
            1.5;
    }


    if (
        pattern.includes(
            "16x19"
        ) &&
        spin >= 8
    ) {

        score +=
            1;
    }


    /**
     * ========================================================
     * Scenario-Specific Pair Adjustment
     * ========================================================
     */

    if (
        scenarioType ===
            SETUP_SCENARIO_TYPES
                .COMFORT
    ) {

        score +=
            (
                armFriendliness -
                5
            ) *
            0.8;


        if (
            stiffness <= 5
        ) {

            score +=
                2;
        }
    }


    if (
        scenarioType ===
            SETUP_SCENARIO_TYPES
                .PERFORMANCE
    ) {

        score +=
            (
                directionalPrecision -
                5
            ) *
            0.55;


        score +=
            (
                spin -
                5
            ) *
            0.35;
    }


    if (
        scenarioType ===
            SETUP_SCENARIO_TYPES
                .BEST_OVERALL
    ) {

        score +=
            (
                armFriendliness -
                5
            ) *
            0.25;


        score +=
            (
                directionalPrecision -
                5
            ) *
            0.25;
    }


    return Number(
        clamp(
            score
        )
            .toFixed(
                2
            )
    );
}


/**
 * ============================================================
 * Find Distinct Pair
 *
 * Prevent every scenario from returning exactly the same
 * racquet + string combination when meaningful alternatives
 * exist.
 * ============================================================
 */

function selectDistinctPair(
    rankedRacquets,
    rankedStrings,
    usedPairs = new Set(),
    scenarioType =
        SETUP_SCENARIO_TYPES
            .BEST_OVERALL
) {

    const racquetPool =
        rankedRacquets
            .slice(
                0,
                8
            );


    const stringPool =
        rankedStrings
            .slice(
                0,
                8
            );


    const combinations =
        [];


    for (
        const racquetEntry
        of racquetPool
    ) {

        for (
            const stringEntry
            of stringPool
        ) {

            const racquetId =
                getCandidateId(
                    racquetEntry
                        .candidate
                );


            const stringId =
                getCandidateId(
                    stringEntry
                        .candidate
                );


            const pairKey =
                `${racquetId ?? "unknown"}::${stringId ?? "unknown"}`;


            combinations.push({

                racquetEntry,

                stringEntry,

                pairKey,

                pair_score:
                    calculatePairCompatibility(
                        racquetEntry,
                        stringEntry,
                        scenarioType
                    )
            });
        }
    }


    combinations.sort(
        (
            a,
            b
        ) =>
            b.pair_score -
            a.pair_score
    );


    const unused =
        combinations.find(
            combination =>
                !usedPairs.has(
                    combination
                        .pairKey
                )
        );


    return (
        unused ??
        combinations[0] ??
        null
    );
}


/**
 * ============================================================
 * Current String Gauge
 * ============================================================
 */

function getCurrentStringGauge(
    playerProfile
) {

    return safeNumber(
        playerProfile
            ?.current_setup
            ?.string
            ?.main
            ?.gauge_mm ??
        playerProfile
            ?.current_setup
            ?.string
            ?.gauge_mm ??
        playerProfile
            ?.current_string
            ?.gauge_mm,
        null
    );
}


/**
 * ============================================================
 * Gauge Score
 * ============================================================
 */

function calculateGaugeScenarioScore(
    gauge,
    scenarioType
) {

    const power =
        safeNumber(
            gauge?.power,
            5
        );

    const control =
        safeNumber(
            gauge?.control,
            5
        );

    const spin =
        safeNumber(
            gauge?.spin,
            5
        );

    const comfort =
        safeNumber(
            gauge?.comfort,
            5
        );

    const feel =
        safeNumber(
            gauge?.feel,
            5
        );

    const durability =
        safeNumber(
            gauge?.durability,
            5
        );

    const tensionMaintenance =
        safeNumber(
            gauge
                ?.tension_maintenance,
            5
        );

    const elasticity =
        safeNumber(
            gauge?.elasticity,
            5
        );


    if (
        scenarioType ===
            SETUP_SCENARIO_TYPES
                .COMFORT
    ) {

        return (
            comfort *
                0.35 +
            elasticity *
                0.25 +
            feel *
                0.20 +
            control *
                0.10 +
            tensionMaintenance *
                0.10
        );
    }


    if (
        scenarioType ===
            SETUP_SCENARIO_TYPES
                .PERFORMANCE
    ) {

        return (
            control *
                0.35 +
            spin *
                0.25 +
            feel *
                0.15 +
            tensionMaintenance *
                0.15 +
            durability *
                0.10
        );
    }


    return (
        control *
            0.25 +
        spin *
            0.15 +
        comfort *
            0.15 +
        feel *
            0.15 +
        tensionMaintenance *
            0.15 +
        durability *
            0.10 +
        power *
            0.05
    );
}


/**
 * ============================================================
 * Select Gauge
 * ============================================================
 */

function selectGaugeForScenario(
    stringCandidate,
    scenarioType,
    {
        currentStringId =
            null,

        currentGaugeMm =
            null
    } = {}
) {

    const stringId =
        getCandidateId(
            stringCandidate
        );


    const gauges =
        stringCandidate
            ?.product_data
            ?.specifications
            ?.available_gauges;


    /**
     * Keep current gauge when Minimal Change uses current string.
     */

    if (
        scenarioType ===
            SETUP_SCENARIO_TYPES
                .MINIMAL_CHANGE &&
        currentStringId &&
        stringId ===
            currentStringId &&
        currentGaugeMm !==
            null
    ) {

        return currentGaugeMm;
    }


    if (
        !Array.isArray(
            gauges
        ) ||
        gauges.length ===
            0
    ) {

        return (
            stringCandidate
                ?.recommended_gauge_mm ??
            stringCandidate
                ?.gauge_mm ??
            null
        );
    }


    const available =
        gauges
            .filter(
                gauge =>
                    gauge?.available !==
                        false &&
                    safeNumber(
                        gauge?.gauge_mm,
                        null
                    ) !==
                        null
            )
            .map(
                gauge => ({
                    gauge,

                    score:
                        calculateGaugeScenarioScore(
                            gauge,
                            scenarioType
                        )
                })
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    b.score -
                    a.score
            );


    if (
        available.length ===
            0
    ) {

        return null;
    }


    return safeNumber(
        available[0]
            ?.gauge
            ?.gauge_mm,
        null
    );
}


/**
 * ============================================================
 * Current Tension
 * ============================================================
 */

function getCurrentTensionLbs(
    playerProfile
) {

    return safeNumber(
        playerProfile
            ?.current_setup
            ?.string
            ?.tension
            ?.main_lbs ??

        playerProfile
            ?.current_setup
            ?.tension
            ?.main_lbs ??

        playerProfile
            ?.current_tension ??

        playerProfile
            ?.current_setup
            ?.tension_lbs,

        null
    );
}


/**
 * ============================================================
 * Scenario Tension V0.1
 *
 * Conservative rule-based setup tension.
 *
 * This is intentionally not a replacement for the full
 * EveryCourtAI tension engine.
 * ============================================================
 */

function calculateScenarioTension({
    racquet,
    string,
    gaugeMm,
    scenarioType,
    currentTensionLbs
}) {

    let tension =
        currentTensionLbs !== null
            ? currentTensionLbs
            : 52;


    const headSize =
        safeNumber(
            racquet
                ?.specifications
                ?.head_size_sq_in,
            100
        );


    const stringStiffness =
        getStringStiffnessScore(
            string
        );


    /**
     * Scenario direction
     */

    if (
        scenarioType ===
            SETUP_SCENARIO_TYPES
                .COMFORT
    ) {

        tension -=
            2;
    }


    if (
        scenarioType ===
            SETUP_SCENARIO_TYPES
                .PERFORMANCE
    ) {

        tension -=
            1;
    }


    if (
        scenarioType ===
            SETUP_SCENARIO_TYPES
                .BEST_OVERALL
    ) {

        tension -=
            1;
    }


    if (
        scenarioType ===
            SETUP_SCENARIO_TYPES
                .MINIMAL_CHANGE
    ) {

        tension -=
            0;
    }


    /**
     * Firm string adjustment
     */

    if (
        stringStiffness >= 8
    ) {

        tension -=
            2;
    } else if (
        stringStiffness >= 7
    ) {

        tension -=
            1;
    }


    /**
     * Head size adjustment
     */

    if (
        headSize <= 98
    ) {

        tension -=
            1;
    } else if (
        headSize >= 102
    ) {

        tension +=
            1;
    }


    /**
     * Gauge adjustment
     */

    if (
        gaugeMm !== null
    ) {

        if (
            gaugeMm <= 1.20
        ) {

            tension +=
                1;
        } else if (
            gaugeMm >= 1.30
        ) {

            tension -=
                1;
        }
    }


    /**
     * Conservative guard rails
     */

    tension =
        Math.max(
            42,
            Math.min(
                58,
                tension
            )
        );


    tension =
        Math.round(
            tension
        );


    return {

        recommended_lbs:
            tension,

        working_range_lbs: {

            minimum_lbs:
                tension - 2,

            maximum_lbs:
                tension + 2
        }
    };
}


/**
 * ============================================================
 * Tension Context
 *
 * V0.1 does not invent a new tension model.
 *
 * It carries forward the existing recommendation-engine
 * tension result whenever available.
 * ============================================================
 */

function extractTensionContext(
    recommendationResult
) {

    const tension =
        recommendationResult
            ?.tension ??
        recommendationResult
            ?.recommendation
            ?.tension ??
        null;


    const recommendedLbs =
        tension
            ?.recommended_lbs ??
        tension
            ?.tension_lbs ??
        recommendationResult
            ?.tension_lbs ??
        null;


    const workingRange =
        tension
            ?.working_range_lbs ??
        recommendationResult
            ?.working_range_lbs ??
        null;


    return {

        recommended_lbs:
            recommendedLbs,

        working_range_lbs:
            workingRange
    };
}


/**
 * ============================================================
 * Build Scenario
 * ============================================================
 */

function buildScenario({
    type,
    label,
    objective,
    racquetCandidates,
    stringCandidates,
    currentRacquetId,
    currentStringId,
    currentGaugeMm,
    currentTensionLbs,
    recommendationResult,
    usedPairs
}) {

    const rankedRacquets =
        rankCandidatesForScenario(
            racquetCandidates,
            type,
            currentRacquetId
        );


    const rankedStrings =
        rankCandidatesForScenario(
            stringCandidates,
            type,
            currentStringId
        );


    const selected =
        type ===
            SETUP_SCENARIO_TYPES
                .MINIMAL_CHANGE

            ? selectDistinctPair(
                rankedRacquets,
                rankedStrings,
                new Set(),
                type
            )

            : selectDistinctPair(
                rankedRacquets,
                rankedStrings,
                usedPairs,
                type
            );


    if (
        !selected
    ) {

        return null;
    }


    usedPairs.add(
        selected
            .pairKey
    );


    const racquet =
        selected
            .racquetEntry
            .candidate;


    const string =
        selected
            .stringEntry
            .candidate;


    const gaugeMm =
        selectGaugeForScenario(
            string,
            type,
            {
                currentStringId,
                currentGaugeMm
            }
        );


    const existingTension =
        extractTensionContext(
            recommendationResult
        );


    const tension =
        existingTension
            ?.recommended_lbs !==
                null &&
        existingTension
            ?.recommended_lbs !==
                undefined

            ? existingTension

            : calculateScenarioTension({
                racquet,
                string,
                gaugeMm,
                scenarioType:
                    type,
                currentTensionLbs
            });


    return {

        type,

        label,

        objective,

        score:
            selected
                .pair_score,

        racquet: {

            id:
                getCandidateId(
                    racquet
                ),

            name:
                getCandidateName(
                    racquet
                ),

            scenario_score:
                selected
                    .racquetEntry
                    .scenario_score,

            score_components:
                selected
                    .racquetEntry
                    .scenario_components,

            source_candidate:
                racquet
        },

        string: {

            id:
                getCandidateId(
                    string
                ),

            name:
                getCandidateName(
                    string
                ),

            gauge_mm:
                gaugeMm,

            scenario_score:
                selected
                    .stringEntry
                    .scenario_score,

            score_components:
                selected
                    .stringEntry
                    .scenario_components,

            source_candidate:
                string
        },

        tension,

        pair_key:
            selected
                .pairKey
    };
}


/**
 * ============================================================
 * Main
 * ============================================================
 */

export function generateSetupScenarios({
    playerProfile = null,
    matchingResult = null,
    recommendationResult = null
} = {}) {

    const racquetCandidates =
        Array.isArray(
            matchingResult
                ?.racquets
        )
            ? matchingResult
                .racquets
            : [];


    const stringCandidates =
        Array.isArray(
            matchingResult
                ?.strings
        )
            ? matchingResult
                .strings
            : [];


    const currentRacquetId =
        getCurrentRacquetId(
            playerProfile
        );


    const currentStringId =
        getCurrentStringId(
            playerProfile
        );


    const currentGaugeMm =
        getCurrentStringGauge(
            playerProfile
        );


    const currentTensionLbs =
        getCurrentTensionLbs(
            playerProfile
        );


    const usedPairs =
        new Set();


    const scenarioDefinitions = [

        {
            type:
                SETUP_SCENARIO_TYPES
                    .BEST_OVERALL,

            label:
                "Best Overall",

            objective:
                "Best balanced equipment match for the player profile."
        },

        {
            type:
                SETUP_SCENARIO_TYPES
                    .COMFORT,

            label:
                "Comfort",

            objective:
                "Prioritize comfort and physical sustainability while preserving suitable performance."
        },

        {
            type:
                SETUP_SCENARIO_TYPES
                    .PERFORMANCE,

            label:
                "Performance",

            objective:
                "Prioritize control, spin, precision and performance potential."
        },

        {
            type:
                SETUP_SCENARIO_TYPES
                    .MINIMAL_CHANGE,

            label:
                "Minimal Change",

            objective:
                "Preserve current equipment where appropriate and minimize adaptation cost."
        }

    ];


    const scenarios =
        scenarioDefinitions
            .map(
                definition =>
                    buildScenario({

                        ...definition,

                        racquetCandidates,

                        stringCandidates,

                        currentRacquetId,

                        currentStringId,

                        currentGaugeMm,

                        currentTensionLbs,

                        recommendationResult,

                        usedPairs
                    })
            )
            .filter(
                Boolean
            );


    return {

        engine:
            ENGINE_NAME,

        version:
            ENGINE_VERSION,

        generated_at:
            new Date()
                .toISOString(),

        candidate_counts: {

            racquets:
                racquetCandidates
                    .length,

            strings:
                stringCandidates
                    .length
        },

        current_equipment: {

            racquet_id:
                currentRacquetId,

            string_id:
                currentStringId
        },

        scenarios
    };
}


/**
 * ============================================================
 * Test / Debug Helpers
 * ============================================================
 */

export const setupScenarioHelpers = {

    safeNumber,

    clamp,

    getCandidateId,

    getCandidateName,

    getBaseMatchScore,

    calculateComfortScore,

    calculatePerformanceScore,

    calculateContinuityScore,

    calculateScenarioCandidateScore,

    rankCandidatesForScenario,

    calculatePairCompatibility,

    selectDistinctPair,

    extractTensionContext
};
