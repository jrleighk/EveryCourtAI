/**
 * ============================================================
 * EveryCourtAI
 * Confidence Engine
 * Version: 1.0
 * ============================================================
 *
 * 文件路径：
 * engine/confidence_engine.js
 *
 * 作用：
 * 1. 读取 Player Profile
 * 2. 读取 Recommendation / Ranking / Conflict 结果
 * 3. 计算整体 Confidence Score
 * 4. 给出 Confidence Level
 * 5. 说明哪些因素提高可信度
 * 6. 说明哪些因素降低可信度
 * 7. 判断是否还需要追问
 *
 * 注意：
 * - 本文件不负责重新推荐
 * - 本文件不负责生成最终自然语言说明
 * - 最终 Explanation 由 explanation_engine.js 处理
 *
 * ============================================================
 */

import {
    loadKnowledgeJson
} from "../utils/json_loader.js";

import {
    validatePlayerProfile
} from "../utils/validator.js";


/**
 * ============================================================
 * 基础配置
 * ============================================================
 */

const ENGINE_VERSION = "1.0";

const MIN_SCORE = 0;
const MAX_SCORE = 100;


/**
 * ============================================================
 * 通用工具
 * ============================================================
 */

function clamp(
    value,
    minimum = MIN_SCORE,
    maximum = MAX_SCORE
) {
    return Math.min(
        maximum,
        Math.max(
            minimum,
            value
        )
    );
}


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


function normalizeKey(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, "_");
}


function uniqueArray(values) {
    return [
        ...new Set(
            values.filter(Boolean)
        )
    ];
}


/**
 * ============================================================
 * Profile Completeness
 * ============================================================
 */

function calculateProfileCompleteness(
    playerProfile
) {
    const fields = [
        {
            key: "primary_goal",
            value:
                playerProfile?.primary_goal,
            weight: 18
        },

        {
            key: "current_racquet",
            value:
                playerProfile
                    ?.current_setup
                    ?.racquet
                    ?.id ||
                playerProfile
                    ?.current_setup
                    ?.racquet
                    ?.model,
            weight: 18
        },

        {
            key: "playing_style",
            value:
                playerProfile
                    ?.playing_style
                    ?.primary,
            weight: 14
        },

        {
            key: "swing_speed",
            value:
                playerProfile
                    ?.swing_speed
                    ?.overall,
            weight: 14
        },

        {
            key: "current_string",
            value:
                playerProfile
                    ?.current_setup
                    ?.string
                    ?.main
                    ?.id ||
                playerProfile
                    ?.current_setup
                    ?.string
                    ?.main
                    ?.model,
            weight: 12
        },

        {
            key: "current_tension",
            value:
                playerProfile
                    ?.current_setup
                    ?.string
                    ?.tension
                    ?.main_lbs,
            weight: 8
        },

        {
            key: "current_setup_feedback",
            value:
                playerProfile
                    ?.current_setup_feedback,
            weight: 10
        },

        {
            key: "preferences",
            value:
                (
                    playerProfile
                        ?.preferences
                        ?.feel ||
                    playerProfile
                        ?.preferences
                        ?.launch_angle
                ),
            weight: 6
        }
    ];


    let earned = 0;
    let total = 0;

    const known = [];
    const missing = [];


    for (
        const field
        of fields
    ) {
        total += field.weight;

        const hasValue =
            field.value !== null &&
            field.value !== undefined &&
            field.value !== "";

        if (
            hasValue
        ) {
            earned +=
                field.weight;

            known.push(
                field.key
            );
        } else {
            missing.push(
                field.key
            );
        }
    }


    return {
        score:
            Math.round(
                (
                    earned /
                    total
                ) * 100
            ),

        known,

        missing
    };
}


/**
 * ============================================================
 * Physical Status
 * ============================================================
 */

function evaluatePhysicalStatus(
    playerProfile
) {
    const physical =
        playerProfile?.physical ?? {};

    const active = [];

    for (
        const [
            region,
            value
        ]
        of Object.entries(
            physical
        )
    ) {
        if (
            value?.active === true &&
            value?.severity &&
            value.severity !== "none"
        ) {
            active.push({
                region:
                    normalizeKey(
                        region
                    ),

                severity:
                    normalizeKey(
                        value.severity
                    )
            });
        }
    }

    return {
        known:
            Object.keys(
                physical
            ).length > 0,

        active
    };
}


/**
 * ============================================================
 * Conflict Evaluation
 * ============================================================
 */

function evaluateConflicts(
    conflictResult
) {
    if (
        !conflictResult ||
        typeof conflictResult !== "object"
    ) {
        return {
            penalty: 0,
            major_conflicts: 0,
            minor_conflicts: 0,
            unresolved_hard_conflicts: 0,
            factors: []
        };
    }


    const conflicts =
        Array.isArray(
            conflictResult.conflicts_detected
        )
            ? conflictResult.conflicts_detected
            : [];


    const excludedRacquets =
        conflictResult
            ?.filtering
            ?.racquets_excluded ??
        0;


    const excludedStrings =
        conflictResult
            ?.filtering
            ?.strings_excluded ??
        0;


    let penalty = 0;

    let majorConflicts = 0;
    let minorConflicts = 0;
    let unresolvedHardConflicts = 0;

    const factors = [];


    for (
        const conflict
        of conflicts
    ) {
        const type =
            normalizeKey(
                conflict?.type
            );

        if (
            type.includes(
                "physical"
            )
        ) {
            majorConflicts += 1;
            penalty += 6;

            factors.push(
                "Physical/performance conflict detected."
            );
        } else {
            minorConflicts += 1;
            penalty += 3;
        }
    }


    if (
        excludedRacquets > 0 ||
        excludedStrings > 0
    ) {
        factors.push(
            "Hard constraint filtering was required."
        );
    }


    if (
        conflictResult
            ?.unresolved_hard_conflict === true
    ) {
        unresolvedHardConflicts += 1;
        penalty += 30;

        factors.push(
            "Unresolved hard conflict remains."
        );
    }


    penalty =
        Math.min(
            penalty,
            35
        );


    return {
        penalty,
        major_conflicts:
            majorConflicts,

        minor_conflicts:
            minorConflicts,

        unresolved_hard_conflicts:
            unresolvedHardConflicts,

        factors
    };
}


/**
 * ============================================================
 * Ranking Quality
 * ============================================================
 */

function evaluateRankingQuality(
    rankingResult
) {
    const bestRacquet =
        rankingResult
            ?.best_matches
            ?.racquet ??
        null;


    const bestString =
        rankingResult
            ?.best_matches
            ?.string ??
        null;


    const racquetScore =
        safeNumber(
            bestRacquet
                ?.ranking
                ?.overall_score
        );


    const stringScore =
        safeNumber(
            bestString
                ?.ranking
                ?.overall_score
        );


    let score = 0;
    let count = 0;

    const positive = [];
    const negative = [];


    if (
        racquetScore !== null
    ) {
        score +=
            racquetScore;

        count += 1;

        if (
            racquetScore >= 85
        ) {
            positive.push(
                "Strong racquet candidate."
            );
        }

        if (
            racquetScore < 65
        ) {
            negative.push(
                "Racquet match is relatively weak."
            );
        }
    }


    if (
        stringScore !== null
    ) {
        score +=
            stringScore;

        count += 1;

        if (
            stringScore >= 85
        ) {
            positive.push(
                "Strong string candidate."
            );
        }

        if (
            stringScore < 65
        ) {
            negative.push(
                "String match is relatively weak."
            );
        }
    }


    return {
        score:
            count > 0
                ? Math.round(
                    score /
                    count
                )
                : 50,

        positive,
        negative
    };
}


/**
 * ============================================================
 * Recommendation Stability
 * ============================================================
 */

function evaluateRecommendationStability(
    recommendationResult
) {
    if (
        !recommendationResult ||
        typeof recommendationResult !== "object"
    ) {
        return {
            score: 50,
            positive: [],
            negative: [
                "Recommendation result unavailable."
            ]
        };
    }


    let score = 70;

    const positive = [];
    const negative = [];


    if (
        recommendationResult
            ?.racquet_decision
            ?.recommended
    ) {
        score += 5;

        positive.push(
            "Racquet recommendation resolved."
        );
    }


    if (
        recommendationResult
            ?.string_setup
            ?.main
    ) {
        score += 8;

        positive.push(
            "Primary string recommendation resolved."
        );
    }


    if (
        recommendationResult
            ?.string_setup
            ?.main
            ?.gauge_mm
    ) {
        score += 4;
    }


    if (
        recommendationResult
            ?.tension
            ?.main_lbs
    ) {
        score += 5;

        positive.push(
            "Specific tension recommendation available."
        );
    } else {
        score -= 8;

        negative.push(
            "Specific tension could not be resolved."
        );
    }


    if (
        recommendationResult
            ?.string_setup
            ?.type === "hybrid" &&
        !recommendationResult
            ?.string_setup
            ?.cross
    ) {
        score -= 12;

        negative.push(
            "Hybrid architecture selected but cross string is unresolved."
        );
    }


    if (
        Array.isArray(
            recommendationResult.tradeoffs
        ) &&
        recommendationResult
            .tradeoffs
            .length > 0
    ) {
        score += 3;
    }


    return {
        score:
            clamp(score),

        positive,
        negative
    };
}


/**
 * ============================================================
 * Alternative Stability
 * ============================================================
 */

function evaluateAlternativeQuality(
    alternativeResult
) {
    if (
        !alternativeResult ||
        typeof alternativeResult !== "object"
    ) {
        return {
            score: 60,
            positive: [],
            negative: []
        };
    }


    const racquetCount =
        alternativeResult
            ?.counts
            ?.racquet_alternatives ??
        0;


    const stringCount =
        alternativeResult
            ?.counts
            ?.string_alternatives ??
        0;


    const total =
        racquetCount +
        stringCount;


    if (
        total >= 3
    ) {
        return {
            score: 90,
            positive: [
                "Multiple meaningful alternatives available."
            ],
            negative: []
        };
    }


    if (
        total >= 1
    ) {
        return {
            score: 75,
            positive: [
                "At least one meaningful alternative available."
            ],
            negative: []
        };
    }


    return {
        score: 60,
        positive: [],
        negative: [
            "Few meaningful alternatives available."
        ]
    };
}


/**
 * ============================================================
 * Assumption Risk
 * ============================================================
 */

function evaluateAssumptionRisk(
    playerProfile
) {
    const missing =
        playerProfile
            ?.metadata
            ?.missing_information ?? [];


    const assumptions = [];

    let penalty = 0;


    if (
        missing.includes(
            "current_racquet"
        )
    ) {
        penalty += 15;

        assumptions.push(
            "Current racquet is unknown."
        );
    }


    if (
        missing.includes(
            "primary_goal"
        )
    ) {
        penalty += 15;

        assumptions.push(
            "Primary goal is unclear."
        );
    }


    if (
        missing.includes(
            "playing_style"
        )
    ) {
        penalty += 8;

        assumptions.push(
            "Playing style is unknown."
        );
    }


    if (
        missing.includes(
            "swing_speed"
        )
    ) {
        penalty += 8;

        assumptions.push(
            "Swing speed is unknown."
        );
    }


    if (
        missing.includes(
            "current_string"
        )
    ) {
        penalty += 5;

        assumptions.push(
            "Current string is unknown."
        );
    }


    if (
        missing.includes(
            "current_tension"
        )
    ) {
        penalty += 4;

        assumptions.push(
            "Current tension is unknown."
        );
    }


    return {
        penalty:
            Math.min(
                penalty,
                35
            ),

        assumptions
    };
}


/**
 * ============================================================
 * Confidence Level
 * ============================================================
 */

function getConfidenceLevel(score) {
    if (
        score >= 95
    ) {
        return "Exceptional";
    }

    if (
        score >= 90
    ) {
        return "Very High";
    }

    if (
        score >= 80
    ) {
        return "High";
    }

    if (
        score >= 70
    ) {
        return "Good";
    }

    if (
        score >= 60
    ) {
        return "Moderate";
    }

    if (
        score >= 50
    ) {
        return "Low";
    }

    return "Insufficient Information";
}


/**
 * ============================================================
 * Follow-Up Logic
 * ============================================================
 */

function determineFollowUp(
    confidence,
    completeness
) {
    if (
        confidence >= 90
    ) {
        return {
            required: false,
            optional: false,
            reason: null
        };
    }


    if (
        confidence >= 80
    ) {
        return {
            required: false,
            optional: true,
            reason:
                "One additional high-value answer may improve precision."
        };
    }


    if (
        confidence >= 70
    ) {
        return {
            required: true,
            optional: false,
            reason:
                "Additional information would materially improve recommendation quality."
        };
    }


    if (
        completeness.score < 60
    ) {
        return {
            required: true,
            optional: false,
            reason:
                "Player profile is incomplete."
        };
    }


    return {
        required: true,
        optional: false,
        reason:
            "Recommendation uncertainty remains too high."
    };
}


/**
 * ============================================================
 * Best Missing Question
 * ============================================================
 */

function determineBestMissingField(
    missingFields
) {
    const priority = [
        "primary_goal",
        "current_racquet",
        "playing_style",
        "swing_speed",
        "current_string",
        "current_tension",
        "current_setup_feedback",
        "preferences"
    ];


    for (
        const field
        of priority
    ) {
        if (
            missingFields.includes(
                field
            )
        ) {
            return field;
        }
    }

    return null;
}


/**
 * ============================================================
 * Recommendation Limitation
 * ============================================================
 */

function determineRecommendationMode(
    confidence
) {
    if (
        confidence >= 80
    ) {
        return "Full Personalized";
    }

    if (
        confidence >= 60
    ) {
        return "Profile-Based";
    }

    return "General Direction";
}


/**
 * ============================================================
 * Load Confidence Knowledge
 * ============================================================
 */

async function loadConfidenceKnowledge() {
    try {
        return await loadKnowledgeJson(
            "inference/confidence_scoring.json"
        );
    } catch {
        return null;
    }
}


/**
 * ============================================================
 * Main Confidence Engine
 * ============================================================
 */

export async function calculateConfidence(
    playerProfile,
    {
        conflictResult = null,
        rankingResult = null,
        alternativeResult = null,
        recommendationResult = null
    } = {}
) {
    /**
     * ----------------------------------
     * STEP 1
     * Validate
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
            "EveryCourtAI Confidence Engine: invalid player profile."
        );
    }


    /**
     * ----------------------------------
     * STEP 2
     * Load Knowledge
     * ----------------------------------
     */

    const confidenceKnowledge =
        await loadConfidenceKnowledge();


    /**
     * ----------------------------------
     * STEP 3
     * Evaluate Components
     * ----------------------------------
     */

    const completeness =
        calculateProfileCompleteness(
            playerProfile
        );


    const physical =
        evaluatePhysicalStatus(
            playerProfile
        );


    const conflicts =
        evaluateConflicts(
            conflictResult
        );


    const ranking =
        evaluateRankingQuality(
            rankingResult
        );


    const stability =
        evaluateRecommendationStability(
            recommendationResult
        );


    const alternatives =
        evaluateAlternativeQuality(
            alternativeResult
        );


    const assumptionRisk =
        evaluateAssumptionRisk(
            playerProfile
        );


    /**
     * ----------------------------------
     * STEP 4
     * Weighted Confidence
     * ----------------------------------
     *
     * Profile        28%
     * Ranking        24%
     * Stability      24%
     * Alternatives   10%
     * Physical known  6%
     * Base            8%
     *
     * 然后减：
     * Conflict Penalty
     * Assumption Penalty
     * ----------------------------------
     */

    let confidence = 0;


    confidence +=
        completeness.score *
        0.28;


    confidence +=
        ranking.score *
        0.24;


    confidence +=
        stability.score *
        0.24;


    confidence +=
        alternatives.score *
        0.10;


    confidence +=
        (
            physical.known
                ? 100
                : 70
        ) *
        0.06;


    confidence +=
        100 *
        0.08;


    confidence -=
        conflicts.penalty;


    confidence -=
        assumptionRisk.penalty;


    confidence =
        clamp(
            Math.round(
                confidence
            )
        );


    /**
     * ----------------------------------
     * STEP 5
     * Hard Conflict Cap
     * ----------------------------------
     */

    if (
        conflicts
            .unresolved_hard_conflicts >
        0
    ) {
        confidence =
            Math.min(
                confidence,
                49
            );
    }


    /**
     * ----------------------------------
     * STEP 6
     * Level
     * ----------------------------------
     */

    const level =
        getConfidenceLevel(
            confidence
        );


    /**
     * ----------------------------------
     * STEP 7
     * Factors Increasing Confidence
     * ----------------------------------
     */

    const positiveFactors = [];


    if (
        completeness.score >= 85
    ) {
        positiveFactors.push(
            "Player profile is highly complete."
        );
    }


    if (
        completeness
            .known
            .includes(
                "current_racquet"
            )
    ) {
        positiveFactors.push(
            "Current racquet is known."
        );
    }


    if (
        completeness
            .known
            .includes(
                "current_string"
            )
    ) {
        positiveFactors.push(
            "Current string is known."
        );
    }


    if (
        completeness
            .known
            .includes(
                "current_tension"
            )
    ) {
        positiveFactors.push(
            "Current tension is known."
        );
    }


    if (
        physical.known
    ) {
        positiveFactors.push(
            "Physical profile has been considered."
        );
    }


    positiveFactors.push(
        ...ranking.positive,
        ...stability.positive,
        ...alternatives.positive
    );


    /**
     * ----------------------------------
     * STEP 8
     * Factors Reducing Confidence
     * ----------------------------------
     */

    const negativeFactors = [
        ...assumptionRisk.assumptions,
        ...conflicts.factors,
        ...ranking.negative,
        ...stability.negative,
        ...alternatives.negative
    ];


    /**
     * ----------------------------------
     * STEP 9
     * Follow-Up
     * ----------------------------------
     */

    const followUp =
        determineFollowUp(
            confidence,
            completeness
        );


    const bestMissingField =
        determineBestMissingField(
            completeness.missing
        );


    /**
     * ----------------------------------
     * STEP 10
     * Recommendation Mode
     * ----------------------------------
     */

    const recommendationMode =
        determineRecommendationMode(
            confidence
        );


    /**
     * ----------------------------------
     * STEP 11
     * Output
     * ----------------------------------
     */

    return {
        engine:
            "confidence_engine",

        version:
            ENGINE_VERSION,

        generated_at:
            new Date()
                .toISOString(),

        confidence_knowledge_loaded:
            Boolean(
                confidenceKnowledge
            ),

        score:
            confidence,

        level,

        recommendation_mode:
            recommendationMode,

        components: {
            profile_completeness:
                completeness.score,

            ranking_quality:
                ranking.score,

            recommendation_stability:
                stability.score,

            alternative_quality:
                alternatives.score,

            physical_profile_known:
                physical.known,

            conflict_penalty:
                conflicts.penalty,

            assumption_penalty:
                assumptionRisk.penalty
        },

        profile_status: {
            known_fields:
                completeness.known,

            missing_fields:
                completeness.missing,

            active_physical_constraints:
                physical.active
        },

        conflict_status: {
            major_conflicts:
                conflicts
                    .major_conflicts,

            minor_conflicts:
                conflicts
                    .minor_conflicts,

            unresolved_hard_conflicts:
                conflicts
                    .unresolved_hard_conflicts
        },

        factors_increasing_confidence:
            uniqueArray(
                positiveFactors
            ),

        factors_reducing_confidence:
            uniqueArray(
                negativeFactors
            ),

        follow_up: {
            required:
                followUp.required,

            optional:
                followUp.optional,

            reason:
                followUp.reason,

            best_missing_field:
                bestMissingField
        },

        restrictions: {
            allow_specific_product_recommendation:
                confidence >= 60,

            allow_high_precision_setup:
                confidence >= 80,

            only_general_direction:
                confidence < 50
        }
    };
}


/**
 * ============================================================
 * Debug / Test Helpers
 * ============================================================
 */

export const confidenceHelpers = {
    calculateProfileCompleteness,

    evaluatePhysicalStatus,

    evaluateConflicts,

    evaluateRankingQuality,

    evaluateRecommendationStability,

    evaluateAlternativeQuality,

    evaluateAssumptionRisk,

    getConfidenceLevel,

    determineFollowUp,

    determineBestMissingField,

    determineRecommendationMode
};
