/**
 * ============================================================
 * EveryCourtAI
 * Recommendation Engine
 * Version: 1.0
 * ============================================================
 *
 * 文件路径：
 * engine/recommendation_engine.js
 *
 * 作用：
 * 1. 接收 Ranking Engine + Alternative Engine 结果
 * 2. 决定保留还是更换球拍
 * 3. 决定 Full Bed / Hybrid
 * 4. 决定 Main / Cross
 * 5. 决定 Gauge
 * 6. 计算建议磅数范围
 * 7. 生成 Primary Recommendation
 * 8. 生成 Alternative Summary
 * 9. 输出 App 可直接使用的结构化 Setup
 *
 * 注意：
 * - 本文件不负责最终自然语言解释
 * - Confidence 由 confidence_engine.js 最终处理
 * - Explanation 由 explanation_engine.js 最终处理
 * ============================================================
 */

import {
    loadKnowledgeJson
} from "../utils/json_loader.js";

import {
    validatePlayerProfile,
    validateRecommendationCandidate,
    validateTension
} from "../utils/validator.js";


/**
 * ============================================================
 * 基础配置
 * ============================================================
 */

const ENGINE_VERSION = "1.0";

const DEFAULT_POLY_TENSION = 50;
const DEFAULT_MULTI_TENSION = 54;
const DEFAULT_GUT_TENSION = 55;

const MIN_TENSION = 35;
const MAX_TENSION = 65;


/**
 * ============================================================
 * 通用工具
 * ============================================================
 */

function safeNumber(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return null;
    }

    const parsed =
        Number(value);

    return Number.isFinite(parsed)
        ? parsed
        : null;
}


function safeString(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .trim()
        .toLowerCase();
}


function normalizeKey(value) {
    return safeString(value)
        .replace(/[\s-]+/g, "_");
}


function clamp(
    value,
    minimum,
    maximum
) {
    return Math.min(
        maximum,
        Math.max(
            minimum,
            value
        )
    );
}


function deepClone(value) {
    return structuredClone(value);
}


function uniqueArray(values) {
    return [
        ...new Set(
            values.filter(Boolean)
        )
    ];
}


function buildCandidateText(candidate) {
    try {
        return JSON.stringify(candidate)
            .toLowerCase();
    } catch {
        return "";
    }
}


/**
 * ============================================================
 * String Traits
 * ============================================================
 */

function detectStringTraits(candidate) {
    const text =
        buildCandidateText(candidate);

    return {
        polyester:
            text.includes("polyester") ||
            text.includes("co-poly"),

        natural_gut:
            text.includes("natural gut"),

        multifilament:
            text.includes("multifilament"),

        soft:
            text.includes("soft"),

        firm:
            text.includes("firm") ||
            text.includes("stiff"),

        shaped:
            text.includes("shaped") ||
            text.includes("pentagon") ||
            text.includes("hexagon") ||
            text.includes("octagon"),

        round:
            text.includes("round"),

        comfort:
            text.includes("comfort"),

        control:
            text.includes("control"),

        spin:
            text.includes("spin"),

        power:
            text.includes("power"),

        feel:
            text.includes("feel") ||
            text.includes("touch")
    };
}


/**
 * ============================================================
 * Physical Context
 * ============================================================
 */

function getActivePhysicalConstraints(
    playerProfile
) {
    const output = [];

    const physical =
        playerProfile?.physical ?? {};

    for (
        const [region, value]
        of Object.entries(physical)
    ) {
        if (
            value?.active === true &&
            value?.severity &&
            value.severity !== "none"
        ) {
            output.push({
                region:
                    normalizeKey(region),

                severity:
                    normalizeKey(
                        value.severity
                    )
            });
        }
    }

    return output;
}


/**
 * ============================================================
 * Current Setup
 * ============================================================
 */

function getCurrentRacquetId(
    playerProfile
) {
    return normalizeKey(
        playerProfile
            ?.current_setup
            ?.racquet
            ?.id
    );
}


function getCurrentStringId(
    playerProfile
) {
    return normalizeKey(
        playerProfile
            ?.current_setup
            ?.string
            ?.main
            ?.id
    );
}


function getCurrentMainTension(
    playerProfile
) {
    return safeNumber(
        playerProfile
            ?.current_setup
            ?.string
            ?.tension
            ?.main_lbs
    );
}


function getCurrentCrossTension(
    playerProfile
) {
    return safeNumber(
        playerProfile
            ?.current_setup
            ?.string
            ?.tension
            ?.cross_lbs
    );
}


/**
 * ============================================================
 * Racquet Decision
 * ============================================================
 */

function determineRacquetAction(
    primaryRacquet,
    playerProfile
) {
    if (!primaryRacquet) {
        return {
            action: "unknown",
            keep_current: null,
            reason:
                "No racquet candidate available."
        };
    }

    const currentId =
        getCurrentRacquetId(
            playerProfile
        );

    const recommendedId =
        normalizeKey(
            primaryRacquet.id
        );

    if (
        currentId &&
        currentId === recommendedId
    ) {
        return {
            action: "keep",
            keep_current: true,
            reason:
                "Current racquet remains the best overall match."
        };
    }

    const adaptationCost =
        safeNumber(
            primaryRacquet
                ?.ranking
                ?.adaptation_cost
        );

    if (
        adaptationCost !== null &&
        adaptationCost >= 8
    ) {
        return {
            action: "optional_change",
            keep_current: false,
            reason:
                "Recommended racquet offers benefits but requires meaningful adaptation."
        };
    }

    return {
        action: "change",
        keep_current: false,
        reason:
            "Alternative racquet provides a better overall fit."
    };
}


/**
 * ============================================================
 * Gauge Selection
 * ============================================================
 */

function determineGauge(
    primaryString,
    playerProfile
) {
    const directGauge =
        safeNumber(
            primaryString
                ?.recommended_gauge_mm
        );

    if (directGauge !== null) {
        return directGauge;
    }

    const swing =
        normalizeKey(
            playerProfile
                ?.swing_speed
                ?.overall
        );

    const breakFrequency =
        normalizeKey(
            playerProfile
                ?.preferences
                ?.string_break_frequency
        );

    if (
        breakFrequency === "very_frequent" ||
        breakFrequency === "frequent"
    ) {
        return 1.25;
    }

    if (
        swing === "slow"
    ) {
        return 1.20;
    }

    if (
        swing === "fast"
    ) {
        return 1.25;
    }

    return 1.25;
}


/**
 * ============================================================
 * Setup Architecture
 * ============================================================
 */

function determineSetupType(
    primaryString,
    playerProfile,
    physicalConstraints
) {
    const traits =
        detectStringTraits(
            primaryString
        );

    const hasModerateOrHighPhysical =
        physicalConstraints.some(
            item =>
                item.severity === "moderate" ||
                item.severity === "high"
        );

    const goal =
        playerProfile?.primary_goal;

    if (
        hasModerateOrHighPhysical &&
        traits.polyester &&
        !traits.soft
    ) {
        return "hybrid";
    }

    if (
        goal === "more_comfort" &&
        traits.polyester
    ) {
        return "hybrid";
    }

    return "full_bed";
}


/**
 * ============================================================
 * Hybrid Cross Selection
 * ============================================================
 */

function selectHybridCross(
    primaryString,
    rankingResult,
    playerProfile
) {
    const strings =
        Array.isArray(
            rankingResult?.strings
        )
            ? rankingResult.strings
            : [];

    const primaryId =
        normalizeKey(
            primaryString?.id
        );

    const primaryTraits =
        detectStringTraits(
            primaryString
        );

    for (
        const candidate
        of strings
    ) {
        if (
            normalizeKey(
                candidate?.id
            ) === primaryId
        ) {
            continue;
        }

        const traits =
            detectStringTraits(
                candidate
            );

        if (
            primaryTraits.polyester
        ) {
            if (
                traits.multifilament ||
                traits.natural_gut ||
                traits.soft ||
                traits.round
            ) {
                return candidate;
            }
        }

        if (
            primaryTraits.natural_gut ||
            primaryTraits.multifilament
        ) {
            if (
                traits.polyester &&
                (
                    traits.round ||
                    traits.soft
                )
            ) {
                return candidate;
            }
        }
    }

    return null;
}


/**
 * ============================================================
 * Base Tension
 * ============================================================
 */

function determineBaseTension(
    stringCandidate
) {
    const traits =
        detectStringTraits(
            stringCandidate
        );

    if (
        traits.natural_gut
    ) {
        return DEFAULT_GUT_TENSION;
    }

    if (
        traits.multifilament
    ) {
        return DEFAULT_MULTI_TENSION;
    }

    return DEFAULT_POLY_TENSION;
}


/**
 * ============================================================
 * Goal Tension Adjustment
 * ============================================================
 */

function applyGoalTensionAdjustment(
    tension,
    playerProfile
) {
    const goal =
        playerProfile?.primary_goal;

    switch (goal) {
        case "more_control":
            return tension + 1;

        case "more_power":
            return tension - 2;

        case "more_spin":
            return tension - 1;

        case "more_comfort":
            return tension - 2;

        case "more_feel":
            return tension - 1;

        default:
            return tension;
    }
}


/**
 * ============================================================
 * Swing Speed Adjustment
 * ============================================================
 */

function applySwingSpeedAdjustment(
    tension,
    playerProfile
) {
    const swing =
        normalizeKey(
            playerProfile
                ?.swing_speed
                ?.overall
        );

    if (
        swing === "slow"
    ) {
        return tension - 2;
    }

    if (
        swing === "fast"
    ) {
        return tension + 1;
    }

    return tension;
}


/**
 * ============================================================
 * Physical Adjustment
 * ============================================================
 */

function applyPhysicalTensionAdjustment(
    tension,
    physicalConstraints
) {
    let adjustment = 0;

    for (
        const constraint
        of physicalConstraints
    ) {
        if (
            constraint.severity === "high"
        ) {
            adjustment =
                Math.min(
                    adjustment,
                    -4
                );
        } else if (
            constraint.severity === "moderate"
        ) {
            adjustment =
                Math.min(
                    adjustment,
                    -3
                );
        } else if (
            constraint.severity === "mild"
        ) {
            adjustment =
                Math.min(
                    adjustment,
                    -1
                );
        }
    }

    return tension +
        adjustment;
}


/**
 * ============================================================
 * Preference Adjustment
 * ============================================================
 */

function applyPreferenceTensionAdjustment(
    tension,
    playerProfile
) {
    const feel =
        normalizeKey(
            playerProfile
                ?.preferences
                ?.feel
        );

    const launch =
        normalizeKey(
            playerProfile
                ?.preferences
                ?.launch_angle
        );

    let adjusted =
        tension;

    if (
        feel === "soft" ||
        feel === "plush"
    ) {
        adjusted -= 1;
    }

    if (
        feel === "firm" ||
        feel === "crisp"
    ) {
        adjusted += 1;
    }

    if (
        launch === "low"
    ) {
        adjusted += 1;
    }

    if (
        launch === "high"
    ) {
        adjusted -= 1;
    }

    return adjusted;
}


/**
 * ============================================================
 * Current Tension Continuity
 * ============================================================
 */

function blendWithCurrentTension(
    calculated,
    current
) {
    if (
        current === null
    ) {
        return calculated;
    }

    const difference =
        calculated -
        current;

    if (
        Math.abs(
            difference
        ) <= 2
    ) {
        return calculated;
    }

    return current +
        clamp(
            difference,
            -3,
            3
        );
}


/**
 * ============================================================
 * Final Tension
 * ============================================================
 */

function calculateRecommendedTension(
    stringCandidate,
    playerProfile,
    physicalConstraints
) {
    let tension =
        determineBaseTension(
            stringCandidate
        );

    tension =
        applyGoalTensionAdjustment(
            tension,
            playerProfile
        );

    tension =
        applySwingSpeedAdjustment(
            tension,
            playerProfile
        );

    tension =
        applyPhysicalTensionAdjustment(
            tension,
            physicalConstraints
        );

    tension =
        applyPreferenceTensionAdjustment(
            tension,
            playerProfile
        );

    tension =
        blendWithCurrentTension(
            tension,
            getCurrentMainTension(
                playerProfile
            )
        );

    tension =
        clamp(
            Math.round(tension),
            MIN_TENSION,
            MAX_TENSION
        );

    const validation =
        validateTension(
            tension,
            {
                minimum:
                    MIN_TENSION,

                maximum:
                    MAX_TENSION
            }
        );

    return validation.valid
        ? validation.value
        : DEFAULT_POLY_TENSION;
}


/**
 * ============================================================
 * Hybrid Tensions
 * ============================================================
 */

function calculateHybridTensions(
    mainString,
    crossString,
    playerProfile,
    physicalConstraints
) {
    const main =
        calculateRecommendedTension(
            mainString,
            playerProfile,
            physicalConstraints
        );

    if (!crossString) {
        return {
            main_lbs: main,
            cross_lbs: null
        };
    }

    const mainTraits =
        detectStringTraits(
            mainString
        );

    const crossTraits =
        detectStringTraits(
            crossString
        );

    let cross = main;

    if (
        mainTraits.natural_gut &&
        crossTraits.polyester
    ) {
        cross =
            main - 2;
    } else if (
        mainTraits.polyester &&
        (
            crossTraits.multifilament ||
            crossTraits.natural_gut
        )
    ) {
        cross =
            main + 2;
    }

    cross =
        clamp(
            Math.round(cross),
            MIN_TENSION,
            MAX_TENSION
        );

    return {
        main_lbs:
            main,

        cross_lbs:
            cross
    };
}


/**
 * ============================================================
 * Working Range
 * ============================================================
 */

function createTensionRange(
    mainTension
) {
    if (
        mainTension === null
    ) {
        return null;
    }

    return {
        minimum_lbs:
            clamp(
                mainTension - 2,
                MIN_TENSION,
                MAX_TENSION
            ),

        maximum_lbs:
            clamp(
                mainTension + 2,
                MIN_TENSION,
                MAX_TENSION
            )
    };
}


/**
 * ============================================================
 * Primary Tradeoffs
 * ============================================================
 */

function determineTradeoffs(
    primaryString,
    playerProfile
) {
    const traits =
        detectStringTraits(
            primaryString
        );

    const tradeoffs = [];

    if (
        traits.soft ||
        traits.multifilament ||
        traits.natural_gut
    ) {
        tradeoffs.push(
            "Potentially lower maximum durability."
        );
    }

    if (
        traits.firm &&
        traits.polyester
    ) {
        tradeoffs.push(
            "Potentially firmer impact response."
        );
    }

    if (
        traits.shaped
    ) {
        tradeoffs.push(
            "Potentially shorter peak playability window."
        );
    }

    if (
        playerProfile?.primary_goal ===
        "more_power"
    ) {
        tradeoffs.push(
            "Additional power may slightly reduce directional margin."
        );
    }

    if (
        playerProfile?.primary_goal ===
        "more_spin"
    ) {
        tradeoffs.push(
            "Higher spin potential may change launch behavior."
        );
    }

    return uniqueArray(
        tradeoffs
    ).slice(0, 3);
}


/**
 * ============================================================
 * Best Reasons
 * ============================================================
 */

function buildPrimaryReasons(
    racquet,
    stringCandidate,
    playerProfile
) {
    const reasons = [];

    if (
        playerProfile?.primary_goal
    ) {
        reasons.push(
            `Supports primary goal: ${playerProfile.primary_goal}.`
        );
    }

    if (
        racquet
            ?.ranking
            ?.physical_compatibility >= 85
    ) {
        reasons.push(
            "High physical compatibility."
        );
    }

    if (
        stringCandidate
            ?.ranking
            ?.goal_alignment >= 85
    ) {
        reasons.push(
            "Strong string alignment with player goal."
        );
    }

    if (
        stringCandidate
            ?.ranking
            ?.current_problem_resolution >= 85
    ) {
        reasons.push(
            "Directly addresses current setup problems."
        );
    }

    if (
        stringCandidate
            ?.ranking
            ?.confidence >= 85
    ) {
        reasons.push(
            "High recommendation confidence."
        );
    }

    return uniqueArray(
        reasons
    ).slice(0, 5);
}


/**
 * ============================================================
 * Alternative Summary
 * ============================================================
 */

function summarizeAlternatives(
    alternativeResult
) {
    if (
        !alternativeResult ||
        typeof alternativeResult !== "object"
    ) {
        return [];
    }

    const output = [];

    const stringAlternatives =
        alternativeResult
            ?.alternatives
            ?.strings ?? [];

    const racquetAlternatives =
        alternativeResult
            ?.alternatives
            ?.racquets ?? [];

    for (
        const alt
        of stringAlternatives
    ) {
        output.push({
            type:
                alt.type,

            candidate_type:
                "string",

            id:
                alt.candidate_id,

            brand:
                alt.brand,

            model:
                alt.model,

            score:
                alt.overall_score,

            advantages:
                alt.advantages ?? [],

            tradeoffs:
                alt.tradeoffs ?? []
        });
    }

    for (
        const alt
        of racquetAlternatives
    ) {
        output.push({
            type:
                alt.type,

            candidate_type:
                "racquet",

            id:
                alt.candidate_id,

            brand:
                alt.brand,

            model:
                alt.model,

            score:
                alt.overall_score,

            advantages:
                alt.advantages ?? [],

            tradeoffs:
                alt.tradeoffs ?? []
        });
    }

    return output.slice(
        0,
        6
    );
}


/**
 * ============================================================
 * Load Recommendation Knowledge
 * ============================================================
 */

async function loadRecommendationKnowledge() {
    try {
        const [
            engineRules,
            tensionRules,
            hybridRules
        ] = await Promise.all([
            loadKnowledgeJson(
                "decision_rules/recommendation_engine.json"
            ),

            loadKnowledgeJson(
                "recommendations/tension_rules.json"
            ),

            loadKnowledgeJson(
                "recommendations/hybrid_strings.json"
            )
        ]);

        return {
            engine_rules:
                engineRules,

            tension_rules:
                tensionRules,

            hybrid_rules:
                hybridRules
        };
    } catch {
        return null;
    }
}


/**
 * ============================================================
 * Main Recommendation Engine
 * ============================================================
 */

export async function generateRecommendation(
    rankingResult,
    playerProfile,
    alternativeResult = null
) {
    /**
     * ----------------------------------
     * STEP 1
     * Validate Player Profile
     * ----------------------------------
     */

    const profileValidation =
        validatePlayerProfile(
            playerProfile
        );

    if (
        !profileValidation.valid
    ) {
        throw new Error(
            "EveryCourtAI Recommendation Engine: invalid player profile."
        );
    }


    /**
     * ----------------------------------
     * STEP 2
     * Validate Ranking Result
     * ----------------------------------
     */

    if (
        !rankingResult ||
        typeof rankingResult !== "object"
    ) {
        throw new Error(
            "EveryCourtAI Recommendation Engine: rankingResult must be an object."
        );
    }


    /**
     * ----------------------------------
     * STEP 3
     * Load Knowledge
     * ----------------------------------
     */

    const recommendationKnowledge =
        await loadRecommendationKnowledge();


    /**
     * ----------------------------------
     * STEP 4
     * Primary Candidates
     * ----------------------------------
     */

    const primaryRacquet =
        rankingResult
            ?.best_matches
            ?.racquet ??
        rankingResult
            ?.racquets
            ?.[0] ??
        null;


    const primaryString =
        rankingResult
            ?.best_matches
            ?.string ??
        rankingResult
            ?.strings
            ?.[0] ??
        null;


    if (
        primaryRacquet
    ) {
        const validation =
            validateRecommendationCandidate(
                primaryRacquet
            );

        if (
            !validation.valid
        ) {
            throw new Error(
                "EveryCourtAI Recommendation Engine: invalid primary racquet."
            );
        }
    }


    if (
        primaryString
    ) {
        const validation =
            validateRecommendationCandidate(
                primaryString
            );

        if (
            !validation.valid
        ) {
            throw new Error(
                "EveryCourtAI Recommendation Engine: invalid primary string."
            );
        }
    }


    /**
     * ----------------------------------
     * STEP 5
     * Physical Context
     * ----------------------------------
     */

    const physicalConstraints =
        getActivePhysicalConstraints(
            playerProfile
        );


    /**
     * ----------------------------------
     * STEP 6
     * Racquet Action
     * ----------------------------------
     */

    const racquetDecision =
        determineRacquetAction(
            primaryRacquet,
            playerProfile
        );


    /**
     * ----------------------------------
     * STEP 7
     * Setup Type
     * ----------------------------------
     */

    const setupType =
        primaryString
            ? determineSetupType(
                primaryString,
                playerProfile,
                physicalConstraints
            )
            : null;


    /**
     * ----------------------------------
     * STEP 8
     * Gauge
     * ----------------------------------
     */

    const mainGauge =
        primaryString
            ? determineGauge(
                primaryString,
                playerProfile
            )
            : null;


    /**
     * ----------------------------------
     * STEP 9
     * Hybrid Cross
     * ----------------------------------
     */

    const crossString =
        (
            setupType === "hybrid" &&
            primaryString
        )
            ? selectHybridCross(
                primaryString,
                rankingResult,
                playerProfile
            )
            : null;


    const crossGauge =
        crossString
            ? determineGauge(
                crossString,
                playerProfile
            )
            : null;


    /**
     * ----------------------------------
     * STEP 10
     * Tension
     * ----------------------------------
     */

    let tensions = {
        main_lbs: null,
        cross_lbs: null
    };


    if (
        primaryString
    ) {
        if (
            setupType === "hybrid"
        ) {
            tensions =
                calculateHybridTensions(
                    primaryString,
                    crossString,
                    playerProfile,
                    physicalConstraints
                );
        } else {
            tensions.main_lbs =
                calculateRecommendedTension(
                    primaryString,
                    playerProfile,
                    physicalConstraints
                );
        }
    }


    /**
     * ----------------------------------
     * STEP 11
     * Working Range
     * ----------------------------------
     */

    const workingRange =
        createTensionRange(
            tensions.main_lbs
        );


    /**
     * ----------------------------------
     * STEP 12
     * Primary Reasons
     * ----------------------------------
     */

    const primaryReasons =
        buildPrimaryReasons(
            primaryRacquet,
            primaryString,
            playerProfile
        );


    /**
     * ----------------------------------
     * STEP 13
     * Tradeoffs
     * ----------------------------------
     */

    const tradeoffs =
        primaryString
            ? determineTradeoffs(
                primaryString,
                playerProfile
            )
            : [];


    /**
     * ----------------------------------
     * STEP 14
     * Alternative Summary
     * ----------------------------------
     */

    const alternatives =
        summarizeAlternatives(
            alternativeResult
        );


    /**
     * ----------------------------------
     * STEP 15
     * Recommendation Score
     * ----------------------------------
     */

    const racquetScore =
        safeNumber(
            primaryRacquet
                ?.ranking
                ?.overall_score
        );

    const stringScore =
        safeNumber(
            primaryString
                ?.ranking
                ?.overall_score
        );

    let setupScore = null;

    if (
        racquetScore !== null &&
        stringScore !== null
    ) {
        setupScore =
            Number(
                (
                    racquetScore * 0.45 +
                    stringScore * 0.55
                )
                    .toFixed(1)
            );
    } else {
        setupScore =
            racquetScore ??
            stringScore ??
            null;
    }


    /**
     * ----------------------------------
     * STEP 16
     * Next Test
     * ----------------------------------
     */

    const nextTest = {
        recommended_test_duration_hours:
            setupType === "hybrid"
                ? "4-8"
                : "6-10",

        feedback_questions: [
            "Was depth easier or harder to control?",
            "Did launch angle feel higher or lower?",
            "Did spin improve?",
            "Did control improve?",
            "Did comfort improve?",
            "Did performance change after several hours?"
        ]
    };


    /**
     * ----------------------------------
     * STEP 17
     * Final Output
     * ----------------------------------
     */

    return {
        engine:
            "recommendation_engine",

        version:
            ENGINE_VERSION,

        generated_at:
            new Date()
                .toISOString(),

        recommendation_knowledge_loaded:
            Boolean(
                recommendationKnowledge
            ),

        player_context: {
            primary_goal:
                playerProfile
                    ?.primary_goal ??
                null,

            playing_style:
                playerProfile
                    ?.playing_style
                    ?.primary ??
                null,

            swing_speed:
                playerProfile
                    ?.swing_speed
                    ?.overall ??
                null,

            physical_constraints:
                physicalConstraints,

            feel_preference:
                playerProfile
                    ?.preferences
                    ?.feel ??
                null,

            launch_preference:
                playerProfile
                    ?.preferences
                    ?.launch_angle ??
                null
        },

        setup_score:
            setupScore,

        racquet_decision: {
            action:
                racquetDecision.action,

            keep_current:
                racquetDecision.keep_current,

            reason:
                racquetDecision.reason,

            recommended: primaryRacquet
                ? {
                    id:
                        primaryRacquet.id,

                    brand:
                        primaryRacquet.brand,

                    model:
                        primaryRacquet.model,

                    score:
                        primaryRacquet
                            ?.ranking
                            ?.overall_score ??
                        primaryRacquet
                            ?.match_score ??
                        null
                }
                : null
        },

        string_setup: {
            type:
                setupType,

            main:
                primaryString
                    ? {
                        id:
                            primaryString.id,

                        brand:
                            primaryString.brand,

                        model:
                            primaryString.model,

                        gauge_mm:
                            mainGauge,

                        tension_lbs:
                            tensions.main_lbs,

                        score:
                            primaryString
                                ?.ranking
                                ?.overall_score ??
                            primaryString
                                ?.match_score ??
                            null
                    }
                    : null,

            cross:
                crossString
                    ? {
                        id:
                            crossString.id,

                        brand:
                            crossString.brand,

                        model:
                            crossString.model,

                        gauge_mm:
                            crossGauge,

                        tension_lbs:
                            tensions.cross_lbs,

                        score:
                            crossString
                                ?.ranking
                                ?.overall_score ??
                            crossString
                                ?.match_score ??
                            null
                    }
                    : null
        },

        tension: {
            main_lbs:
                tensions.main_lbs,

            cross_lbs:
                tensions.cross_lbs,

            working_range_lbs:
                workingRange
        },

        primary_reasons:
            primaryReasons,

        tradeoffs,

        alternatives,

        next_test:
            nextTest
    };
}


/**
 * ============================================================
 * Debug / Test Helpers
 * ============================================================
 */

export const recommendationHelpers = {
    detectStringTraits,

    getActivePhysicalConstraints,

    determineRacquetAction,

    determineGauge,

    determineSetupType,

    selectHybridCross,

    determineBaseTension,

    applyGoalTensionAdjustment,

    applySwingSpeedAdjustment,

    applyPhysicalTensionAdjustment,

    applyPreferenceTensionAdjustment,

    blendWithCurrentTension,

    calculateRecommendedTension,

    calculateHybridTensions,

    createTensionRange,

    determineTradeoffs,

    buildPrimaryReasons
};
