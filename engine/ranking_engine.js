/**
 * ============================================================
 * EveryCourtAI
 * Ranking Engine
 * Version: 1.1
 * ============================================================
 *
 * 文件路径：
 * engine/ranking_engine.js
 *
 * 作用：
 * 1. 接收 Conflict Engine 清理后的候选
 * 2. 结合 Player Profile 重新计算最终排序分数
 * 3. 引入 Physical / Goal / Current Problem / Preference
 * 4. 引入 Confidence 与 Adaptation Cost
 * 5. 强化 Current Racquet Continuity / Minimal Change
 * 6. 输出 Top Ranked Racquets / Strings
 *
 * 核心原则：
 *
 * 如果当前球拍不存在明显硬性不匹配：
 *
 * 保留当前球拍
 * ↓
 * 优先调整球线
 * ↓
 * 调整 Gauge
 * ↓
 * 调整 Tension
 * ↓
 * 最后才考虑换拍
 *
 * ============================================================
 */

import {
    loadKnowledgeJson
} from "../utils/runtime_json_loader.js";

import {
    validatePlayerProfile,
    validateRecommendationCandidate
} from "../utils/validator.js";


/**
 * ============================================================
 * 基础配置
 * ============================================================
 */

const ENGINE_VERSION = "1.1";

const MIN_SCORE = 0;
const MAX_SCORE = 100;

const DEFAULT_CONFIDENCE = 70;

const RACQUET_FINAL_LIMIT = 10;
const STRING_FINAL_LIMIT = 12;


/**
 * ============================================================
 * Ranking Weights
 * ============================================================
 */

const DEFAULT_WEIGHTS = {
    base_match_score: 0.28,
    physical_compatibility: 0.22,
    goal_alignment: 0.17,
    current_problem_resolution: 0.10,
    playing_style_match: 0.05,
    swing_speed_match: 0.04,
    preference_match: 0.03,
    confidence: 0.03,
    adaptation_score: 0.03,
    continuity_score: 0.05
};


/**
 * ============================================================
 * Continuity 配置
 * ============================================================
 */

const CONTINUITY_RULES = {
    current_racquet_bonus: 22,

    current_string_bonus: 6,

    current_racquet_min_physical_score: 65,

    current_racquet_min_goal_score: 55,

    racquet_change_penalty_default: 6,

    racquet_change_penalty_when_current_is_good: 12,

    strong_current_racquet_threshold: 75
};


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


function uniqueArray(values) {
    return [
        ...new Set(
            values.filter(Boolean)
        )
    ];
}


function deepClone(value) {
    return structuredClone(value);
}


/**
 * ============================================================
 * Active Physical Constraints
 * ============================================================
 */

function getActivePhysicalConstraints(
    playerProfile
) {
    const output = [];

    const physical =
        playerProfile?.physical ?? {};

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
 * Current Setup Problems
 * ============================================================
 */

function getCurrentSetupIssues(
    playerProfile
) {
    const issues =
        playerProfile
            ?.current_setup_feedback
            ?.issues ?? {};

    return Object.entries(
        issues
    )
        .filter(
            ([
                ,
                value
            ]) =>
                value === true
        )
        .map(
            ([
                key
            ]) =>
                normalizeKey(key)
        );
}


/**
 * ============================================================
 * Candidate Text
 * ============================================================
 */

function buildCandidateText(
    candidate
) {
    try {
        return JSON.stringify(
            candidate
        )
            .toLowerCase();
    } catch {
        return "";
    }
}


/**
 * ============================================================
 * Candidate Traits
 * ============================================================
 */

function detectStringTraits(
    candidate
) {
    const text =
        buildCandidateText(
            candidate
        );

    return {
        polyester:
            text.includes("polyester") ||
            text.includes("co-poly"),

        multifilament:
            text.includes("multifilament"),

        natural_gut:
            text.includes("natural gut"),

        soft:
            text.includes("soft"),

        firm:
            text.includes("firm"),

        shaped:
            text.includes("shaped") ||
            text.includes("pentagon") ||
            text.includes("hexagon") ||
            text.includes("octagon"),

        round:
            text.includes("round"),

        control:
            text.includes("control"),

        spin:
            text.includes("spin"),

        power:
            text.includes("power"),

        comfort:
            text.includes("comfort"),

        feel:
            text.includes("feel"),

        durable:
            text.includes("durable") ||
            text.includes("durability")
    };
}


function detectRacquetTraits(
    candidate
) {
    const specs =
        candidate?.specifications ?? {};

    return {
        weight_g:
            safeNumber(
                specs.weight_g
            ),

        swingweight:
            safeNumber(
                specs.swingweight
            ),

        stiffness:
            safeNumber(
                specs.stiffness
            ),

        head_size_sq_in:
            safeNumber(
                specs.head_size_sq_in
            ),

        balance:
            safeString(
                specs.balance
            ),

        string_pattern:
            safeString(
                specs.string_pattern
            )
    };
}


/**
 * ============================================================
 * Current IDs
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


/**
 * ============================================================
 * Physical Score
 * ============================================================
 */

function calculatePhysicalScore(
    candidate,
    candidateType,
    physicalConstraints
) {
    if (
        physicalConstraints.length === 0
    ) {
        return {
            score: 100,
            reasons: []
        };
    }

    let score = 100;

    const reasons = [];


    if (
        candidateType === "string"
    ) {
        const traits =
            detectStringTraits(
                candidate
            );

        for (
            const physical
            of physicalConstraints
        ) {
            const high =
                physical.severity === "high";

            const moderate =
                physical.severity === "moderate";


            if (
                [
                    "arm",
                    "elbow",
                    "wrist",
                    "shoulder",
                    "neck"
                ].includes(
                    physical.region
                )
            ) {
                if (
                    traits.soft ||
                    traits.multifilament ||
                    traits.natural_gut ||
                    traits.comfort
                ) {
                    score +=
                        high
                            ? 4
                            : 2;
                }

                if (
                    traits.firm &&
                    traits.polyester
                ) {
                    score -=
                        high
                            ? 20
                            : (
                                moderate
                                    ? 12
                                    : 5
                            );

                    reasons.push(
                        "Firm polyester reduces physical compatibility."
                    );
                }
            }
        }
    }


    if (
        candidateType === "racquet"
    ) {
        const traits =
            detectRacquetTraits(
                candidate
            );

        for (
            const physical
            of physicalConstraints
        ) {
            const high =
                physical.severity === "high";

            const moderate =
                physical.severity === "moderate";


            if (
                [
                    "shoulder",
                    "neck"
                ].includes(
                    physical.region
                )
            ) {
                if (
                    traits.swingweight !== null &&
                    traits.swingweight > 330
                ) {
                    score -=
                        high
                            ? 18
                            : (
                                moderate
                                    ? 10
                                    : 5
                            );
                }

                if (
                    traits.balance.includes(
                        "head-light"
                    ) ||
                    traits.balance.includes(
                        "head light"
                    )
                ) {
                    score += 4;
                }
            }


            if (
                [
                    "arm",
                    "elbow"
                ].includes(
                    physical.region
                )
            ) {
                if (
                    traits.stiffness !== null &&
                    traits.stiffness >= 68
                ) {
                    score -=
                        high
                            ? 18
                            : (
                                moderate
                                    ? 10
                                    : 4
                            );
                }
            }


            if (
                [
                    "lower_back",
                    "hip"
                ].includes(
                    physical.region
                )
            ) {
                if (
                    traits.swingweight !== null &&
                    traits.swingweight > 330
                ) {
                    score -=
                        high
                            ? 12
                            : 6;
                }
            }


            if (
                [
                    "knee",
                    "ankle"
                ].includes(
                    physical.region
                )
            ) {
                if (
                    traits.head_size_sq_in !== null &&
                    traits.head_size_sq_in >= 100
                ) {
                    score += 5;
                }

                if (
                    traits.head_size_sq_in !== null &&
                    traits.head_size_sq_in <= 95
                ) {
                    score -=
                        high
                            ? 12
                            : 5;
                }
            }
        }
    }


    return {
        score:
            clamp(score),

        reasons:
            uniqueArray(
                reasons
            )
    };
}


/**
 * ============================================================
 * Goal Alignment
 * ============================================================
 */

function calculateGoalAlignment(
    candidate,
    candidateType,
    playerProfile
) {
    const goal =
        playerProfile?.primary_goal;

    if (!goal) {
        return {
            score: 70,
            reasons: []
        };
    }

    let score = 70;

    const reasons = [];


    if (
        candidateType === "string"
    ) {
        const traits =
            detectStringTraits(
                candidate
            );

        switch (goal) {
            case "more_control":

                if (
                    traits.control ||
                    traits.round
                ) {
                    score += 20;
                }

                if (
                    traits.power &&
                    !traits.control
                ) {
                    score -= 10;
                }

                break;


            case "more_power":

                if (
                    traits.power ||
                    traits.soft ||
                    traits.multifilament ||
                    traits.natural_gut
                ) {
                    score += 20;
                }

                if (
                    traits.firm &&
                    traits.polyester
                ) {
                    score -= 8;
                }

                break;


            case "more_spin":

                if (
                    traits.spin ||
                    traits.shaped
                ) {
                    score += 20;
                }

                if (
                    traits.multifilament &&
                    !traits.shaped
                ) {
                    score -= 5;
                }

                break;


            case "more_comfort":

                if (
                    traits.soft ||
                    traits.comfort ||
                    traits.multifilament ||
                    traits.natural_gut
                ) {
                    score += 22;
                }

                if (
                    traits.firm &&
                    traits.polyester
                ) {
                    score -= 15;
                }

                break;


            case "more_feel":

                if (
                    traits.feel ||
                    traits.natural_gut ||
                    traits.multifilament ||
                    traits.round
                ) {
                    score += 20;
                }

                break;

            default:
                break;
        }
    }


    if (
        candidateType === "racquet"
    ) {
        const text =
            buildCandidateText(
                candidate
            );

        switch (goal) {
            case "more_control":

                if (
                    text.includes(
                        "control"
                    )
                ) {
                    score += 18;
                }

                break;


            case "more_power":

                if (
                    text.includes(
                        "power"
                    )
                ) {
                    score += 18;
                }

                break;


            case "more_spin":

                if (
                    text.includes(
                        "spin"
                    )
                ) {
                    score += 18;
                }

                break;


            case "more_comfort":

                if (
                    text.includes(
                        "comfort"
                    ) ||
                    text.includes(
                        "forgiveness"
                    )
                ) {
                    score += 18;
                }

                break;


            case "more_feel":

                if (
                    text.includes(
                        "feel"
                    ) ||
                    text.includes(
                        "touch"
                    )
                ) {
                    score += 18;
                }

                break;

            default:
                break;
        }
    }


    if (
        score > 85
    ) {
        reasons.push(
            `Strong alignment with primary goal: ${goal}.`
        );
    }


    return {
        score:
            clamp(score),

        reasons
    };
}


/**
 * ============================================================
 * Current Problem Resolution
 * ============================================================
 */

function calculateProblemResolution(
    candidate,
    candidateType,
    playerProfile
) {
    const issues =
        getCurrentSetupIssues(
            playerProfile
        );

    if (
        issues.length === 0
    ) {
        return {
            score: 75,
            reasons: []
        };
    }

    let score = 70;

    const reasons = [];


    if (
        candidateType === "string"
    ) {
        const traits =
            detectStringTraits(
                candidate
            );


        if (
            issues.includes(
                "too_stiff"
            )
        ) {
            if (
                traits.soft ||
                traits.multifilament ||
                traits.natural_gut
            ) {
                score += 20;
            }

            if (
                traits.firm
            ) {
                score -= 15;
            }
        }


        if (
            issues.includes(
                "not_enough_spin"
            )
        ) {
            if (
                traits.spin ||
                traits.shaped
            ) {
                score += 20;
            }
        }


        if (
            issues.includes(
                "not_enough_control"
            )
        ) {
            if (
                traits.control ||
                traits.round
            ) {
                score += 20;
            }

            if (
                traits.power &&
                !traits.control
            ) {
                score -= 8;
            }
        }


        if (
            issues.includes(
                "not_enough_power"
            )
        ) {
            if (
                traits.power ||
                traits.soft ||
                traits.multifilament ||
                traits.natural_gut
            ) {
                score += 20;
            }
        }


        if (
            issues.includes(
                "poor_durability"
            )
        ) {
            if (
                traits.durable ||
                traits.polyester
            ) {
                score += 12;
            }
        }
    }


    if (
        candidateType === "racquet"
    ) {
        const traits =
            detectRacquetTraits(
                candidate
            );


        if (
            issues.includes(
                "not_enough_power"
            ) &&
            traits.head_size_sq_in !== null &&
            traits.head_size_sq_in >= 100
        ) {
            score += 12;
        }


        if (
            issues.includes(
                "poor_comfort"
            ) &&
            traits.stiffness !== null &&
            traits.stiffness <= 66
        ) {
            score += 15;
        }


        if (
            issues.includes(
                "too_powerful"
            ) &&
            traits.head_size_sq_in !== null &&
            traits.head_size_sq_in <= 98
        ) {
            score += 10;
        }
    }


    if (
        score >= 85
    ) {
        reasons.push(
            "Candidate directly addresses current setup problems."
        );
    }


    return {
        score:
            clamp(score),

        reasons
    };
}


/**
 * ============================================================
 * Playing Style Match
 * ============================================================
 */

function calculatePlayingStyleMatch(
    candidate,
    playerProfile
) {
    const style =
        normalizeKey(
            playerProfile
                ?.playing_style
                ?.primary
        );

    if (!style) {
        return 70;
    }

    const text =
        buildCandidateText(
            candidate
        );

    let score = 70;


    if (
        style === "baseline_aggressive"
    ) {
        if (
            text.includes("control") ||
            text.includes("spin") ||
            text.includes("stability")
        ) {
            score += 18;
        }
    }


    if (
        style === "baseline_counterpuncher"
    ) {
        if (
            text.includes("control") ||
            text.includes("forgiveness") ||
            text.includes("stability")
        ) {
            score += 16;
        }
    }


    if (
        style === "baseline_grinder"
    ) {
        if (
            text.includes("comfort") ||
            text.includes("durability") ||
            text.includes("forgiveness")
        ) {
            score += 16;
        }
    }


    if (
        style === "all_court"
    ) {
        if (
            text.includes("feel") ||
            text.includes("control") ||
            text.includes("maneuver")
        ) {
            score += 18;
        }
    }


    if (
        style === "serve_volley"
    ) {
        if (
            text.includes("feel") ||
            text.includes("touch") ||
            text.includes("maneuver")
        ) {
            score += 20;
        }
    }


    return clamp(score);
}


/**
 * ============================================================
 * Swing Speed Match
 * ============================================================
 */

function calculateSwingSpeedMatch(
    candidate,
    candidateType,
    playerProfile
) {
    const swingSpeed =
        normalizeKey(
            playerProfile
                ?.swing_speed
                ?.overall
        );

    if (!swingSpeed) {
        return 70;
    }

    let score = 70;


    if (
        candidateType === "string"
    ) {
        const traits =
            detectStringTraits(
                candidate
            );


        if (
            swingSpeed === "slow"
        ) {
            if (
                traits.soft ||
                traits.multifilament ||
                traits.natural_gut ||
                traits.power
            ) {
                score += 20;
            }

            if (
                traits.firm &&
                traits.polyester
            ) {
                score -= 10;
            }
        }


        if (
            swingSpeed === "medium"
        ) {
            if (
                traits.soft ||
                traits.control ||
                traits.spin
            ) {
                score += 12;
            }
        }


        if (
            swingSpeed === "fast"
        ) {
            if (
                traits.control ||
                traits.polyester ||
                traits.spin
            ) {
                score += 18;
            }

            if (
                traits.power &&
                !traits.control
            ) {
                score -= 8;
            }
        }
    }


    if (
        candidateType === "racquet"
    ) {
        const traits =
            detectRacquetTraits(
                candidate
            );


        if (
            swingSpeed === "slow"
        ) {
            if (
                traits.weight_g !== null &&
                traits.weight_g <= 295
            ) {
                score += 18;
            }

            if (
                traits.weight_g !== null &&
                traits.weight_g > 315
            ) {
                score -= 12;
            }
        }


        if (
            swingSpeed === "medium"
        ) {
            if (
                traits.weight_g !== null &&
                traits.weight_g >= 285 &&
                traits.weight_g <= 310
            ) {
                score += 15;
            }
        }


        if (
            swingSpeed === "fast"
        ) {
            if (
                traits.weight_g !== null &&
                traits.weight_g >= 295 &&
                traits.weight_g <= 325
            ) {
                score += 18;
            }
        }
    }


    return clamp(score);
}


/**
 * ============================================================
 * Preference Match
 * ============================================================
 */

function calculatePreferenceMatch(
    candidate,
    playerProfile
) {
    let score = 70;

    const text =
        buildCandidateText(
            candidate
        );

    const feel =
        normalizeKey(
            playerProfile
                ?.preferences
                ?.feel
        );


    if (feel) {
        const feelMap = {
            plush: [
                "plush",
                "pocket",
                "natural gut",
                "multifilament"
            ],

            soft: [
                "soft",
                "comfort",
                "elastic"
            ],

            connected: [
                "connected",
                "control",
                "feedback"
            ],

            crisp: [
                "crisp",
                "responsive"
            ],

            firm: [
                "firm",
                "control",
                "stable"
            ],

            muted: [
                "muted",
                "damp"
            ]
        };


        for (
            const keyword
            of feelMap[feel] ?? []
        ) {
            if (
                text.includes(
                    keyword
                )
            ) {
                score += 5;
            }
        }
    }


    return clamp(score);
}


/**
 * ============================================================
 * Confidence
 * ============================================================
 */

function calculateCandidateConfidence(
    candidate,
    playerProfile
) {
    let confidence =
        DEFAULT_CONFIDENCE;


    if (
        candidate.id
    ) {
        confidence += 5;
    }


    if (
        candidate.match_score !== null &&
        candidate.match_score !== undefined
    ) {
        confidence += 5;
    }


    if (
        playerProfile.primary_goal
    ) {
        confidence += 4;
    }


    if (
        playerProfile
            ?.playing_style
            ?.primary
    ) {
        confidence += 3;
    }


    if (
        playerProfile
            ?.swing_speed
            ?.overall
    ) {
        confidence += 3;
    }


    if (
        playerProfile
            ?.current_setup
            ?.racquet
            ?.id ||
        playerProfile
            ?.current_setup
            ?.racquet
            ?.model
    ) {
        confidence += 3;
    }


    const risks =
        candidate.risk_flags ?? [];

    confidence -=
        risks.length * 3;


    return clamp(
        confidence
    );
}


/**
 * ============================================================
 * Adaptation Cost
 * ============================================================
 */

function calculateAdaptationCost(
    candidate,
    candidateType,
    playerProfile
) {
    if (
        candidateType === "racquet"
    ) {
        const currentId =
            getCurrentRacquetId(
                playerProfile
            );

        if (
            currentId &&
            normalizeKey(
                candidate.id
            ) === currentId
        ) {
            return 1;
        }

        return 8;
    }


    if (
        candidateType === "string"
    ) {
        const currentStringId =
            getCurrentStringId(
                playerProfile
            );

        if (
            currentStringId &&
            normalizeKey(
                candidate.id
            ) === currentStringId
        ) {
            return 1;
        }

        return 4;
    }


    return 5;
}


function convertAdaptationCostToScore(
    cost
) {
    const mapping = {
        1: 100,
        2: 92,
        3: 86,
        4: 78,
        5: 70,
        6: 62,
        7: 54,
        8: 44,
        9: 34,
        10: 24
    };

    return mapping[cost] ?? 50;
}


/**
 * ============================================================
 * Current Racquet Continuity
 * ============================================================
 */

function calculateContinuityScore(
    candidate,
    candidateType,
    playerProfile,
    physicalScore,
    goalScore
) {
    if (
        candidateType === "racquet"
    ) {
        const currentId =
            getCurrentRacquetId(
                playerProfile
            );

        const candidateId =
            normalizeKey(
                candidate.id
            );


        if (
            !currentId
        ) {
            return {
                score: 50,
                bonus: 0,
                penalty: 0,
                is_current: false,
                current_racquet_acceptable: false
            };
        }


        const isCurrent =
            currentId === candidateId;


        const currentRacquetAcceptable =
            physicalScore >=
                CONTINUITY_RULES
                    .current_racquet_min_physical_score &&
            goalScore >=
                CONTINUITY_RULES
                    .current_racquet_min_goal_score;


        if (
            isCurrent &&
            currentRacquetAcceptable
        ) {
            return {
                score: 100,
                bonus:
                    CONTINUITY_RULES
                        .current_racquet_bonus,
                penalty: 0,
                is_current: true,
                current_racquet_acceptable: true
            };
        }


        if (
            isCurrent &&
            !currentRacquetAcceptable
        ) {
            return {
                score: 60,
                bonus: 4,
                penalty: 0,
                is_current: true,
                current_racquet_acceptable: false
            };
        }


        return {
            score: 35,
            bonus: 0,
            penalty:
                CONTINUITY_RULES
                    .racquet_change_penalty_default,
            is_current: false,
            current_racquet_acceptable: false
        };
    }


    if (
        candidateType === "string"
    ) {
        const currentId =
            getCurrentStringId(
                playerProfile
            );

        const candidateId =
            normalizeKey(
                candidate.id
            );


        if (
            currentId &&
            currentId === candidateId
        ) {
            return {
                score: 95,
                bonus:
                    CONTINUITY_RULES
                        .current_string_bonus,
                penalty: 0,
                is_current: true
            };
        }


        return {
            score: 60,
            bonus: 0,
            penalty: 0,
            is_current: false
        };
    }


    return {
        score: 50,
        bonus: 0,
        penalty: 0,
        is_current: false
    };
}


/**
 * ============================================================
 * Current Racquet Quality Context
 * ============================================================
 */

function evaluateCurrentRacquetContext(
    candidates,
    playerProfile,
    physicalConstraints
) {
    const currentId =
        getCurrentRacquetId(
            playerProfile
        );

    if (
        !currentId
    ) {
        return {
            found: false,
            candidate: null,
            score: null,
            physical_score: null,
            goal_score: null,
            strong_enough_to_keep: false
        };
    }


    const currentCandidate =
        candidates.find(
            candidate =>
                normalizeKey(
                    candidate.id
                ) === currentId
        );


    if (
        !currentCandidate
    ) {
        return {
            found: false,
            candidate: null,
            score: null,
            physical_score: null,
            goal_score: null,
            strong_enough_to_keep: false
        };
    }


    const physical =
        calculatePhysicalScore(
            currentCandidate,
            "racquet",
            physicalConstraints
        );


    const goal =
        calculateGoalAlignment(
            currentCandidate,
            "racquet",
            playerProfile
        );


    const base =
        safeNumber(
            currentCandidate.match_score
        ) ?? 50;


    const contextScore =
        (
            base * 0.45
        ) +
        (
            physical.score * 0.35
        ) +
        (
            goal.score * 0.20
        );


    return {
        found: true,

        candidate:
            currentCandidate,

        score:
            Number(
                contextScore
                    .toFixed(1)
            ),

        physical_score:
            physical.score,

        goal_score:
            goal.score,

        strong_enough_to_keep:
            contextScore >=
                CONTINUITY_RULES
                    .strong_current_racquet_threshold &&
            physical.score >=
                CONTINUITY_RULES
                    .current_racquet_min_physical_score
    };
}


/**
 * ============================================================
 * Risk Penalty
 * ============================================================
 */

function calculateRiskPenalty(
    candidate
) {
    const risks =
        Array.isArray(
            candidate.risk_flags
        )
            ? candidate.risk_flags
            : [];


    const conflicts =
        Array.isArray(
            candidate.conflict_reasons
        )
            ? candidate.conflict_reasons
            : [];


    let penalty = 0;

    penalty +=
        risks.length * 2;

    penalty +=
        conflicts.length * 1;


    return Math.min(
        penalty,
        15
    );
}


/**
 * ============================================================
 * 单候选 Ranking
 * ============================================================
 */

function rankCandidate(
    originalCandidate,
    candidateType,
    playerProfile,
    physicalConstraints,
    currentRacquetContext = null
) {
    const candidate =
        deepClone(
            originalCandidate
        );


    const validation =
        validateRecommendationCandidate(
            candidate
        );


    if (
        !validation.valid
    ) {
        return null;
    }


    const baseMatchScore =
        safeNumber(
            candidate.match_score
        ) ?? 50;


    const physical =
        calculatePhysicalScore(
            candidate,
            candidateType,
            physicalConstraints
        );


    const goal =
        calculateGoalAlignment(
            candidate,
            candidateType,
            playerProfile
        );


    const problem =
        calculateProblemResolution(
            candidate,
            candidateType,
            playerProfile
        );


    const style =
        calculatePlayingStyleMatch(
            candidate,
            playerProfile
        );


    const swing =
        calculateSwingSpeedMatch(
            candidate,
            candidateType,
            playerProfile
        );


    const preference =
        calculatePreferenceMatch(
            candidate,
            playerProfile
        );


    const confidence =
        calculateCandidateConfidence(
            candidate,
            playerProfile
        );


    const adaptationCost =
        calculateAdaptationCost(
            candidate,
            candidateType,
            playerProfile
        );


    const adaptationScore =
        convertAdaptationCostToScore(
            adaptationCost
        );


    const continuity =
        calculateContinuityScore(
            candidate,
            candidateType,
            playerProfile,
            physical.score,
            goal.score
        );


    const riskPenalty =
        calculateRiskPenalty(
            candidate
        );


    /**
     * ========================================================
     * Weighted Score
     * ========================================================
     */

    let finalScore =

        (
            baseMatchScore *
            DEFAULT_WEIGHTS.base_match_score
        )

        +

        (
            physical.score *
            DEFAULT_WEIGHTS.physical_compatibility
        )

        +

        (
            goal.score *
            DEFAULT_WEIGHTS.goal_alignment
        )

        +

        (
            problem.score *
            DEFAULT_WEIGHTS.current_problem_resolution
        )

        +

        (
            style *
            DEFAULT_WEIGHTS.playing_style_match
        )

        +

        (
            swing *
            DEFAULT_WEIGHTS.swing_speed_match
        )

        +

        (
            preference *
            DEFAULT_WEIGHTS.preference_match
        )

        +

        (
            confidence *
            DEFAULT_WEIGHTS.confidence
        )

        +

        (
            adaptationScore *
            DEFAULT_WEIGHTS.adaptation_score
        )

        +

        (
            continuity.score *
            DEFAULT_WEIGHTS.continuity_score
        );


    /**
     * ========================================================
     * Continuity Bonus
     * ========================================================
     */

    finalScore +=
        continuity.bonus;


    /**
     * ========================================================
     * Change Penalty
     * ========================================================
     *
     * 如果当前球拍已经足够好，
     * 新球拍必须明显更优秀才值得换。
     * ========================================================
     */

    let changePenalty =
        continuity.penalty;


    if (
        candidateType === "racquet" &&
        currentRacquetContext
            ?.strong_enough_to_keep === true &&
        continuity.is_current === false
    ) {
        changePenalty =
            Math.max(
                changePenalty,
                CONTINUITY_RULES
                    .racquet_change_penalty_when_current_is_good
            );
    }


    finalScore -=
        changePenalty;


    /**
     * Risk Penalty
     */

    finalScore -=
        riskPenalty;


    finalScore =
        clamp(
            finalScore
        );


    candidate.ranking = {
        overall_score:
            Number(
                finalScore
                    .toFixed(1)
            ),

        base_match_score:
            baseMatchScore,

        physical_compatibility:
            physical.score,

        goal_alignment:
            goal.score,

        current_problem_resolution:
            problem.score,

        playing_style_match:
            style,

        swing_speed_match:
            swing,

        preference_match:
            preference,

        confidence,

        adaptation_cost:
            adaptationCost,

        adaptation_score:
            adaptationScore,

        continuity_score:
            continuity.score,

        continuity_bonus:
            continuity.bonus,

        change_penalty:
            changePenalty,

        risk_penalty:
            riskPenalty,

        is_current_equipment:
            continuity.is_current === true
    };


    const reasons = [
        ...physical.reasons,
        ...goal.reasons,
        ...problem.reasons
    ];


    if (
        continuity.is_current === true &&
        continuity.bonus > 0
    ) {
        reasons.push(
            candidateType === "racquet"
                ? "Current racquet receives a strong continuity bonus because it remains compatible."
                : "Current string receives continuity bonus."
        );
    }


    if (
        candidateType === "racquet" &&
        currentRacquetContext
            ?.strong_enough_to_keep === true &&
        continuity.is_current === false
    ) {
        reasons.push(
            "Racquet-change penalty applied because the current frame remains a strong match."
        );
    }


    candidate.ranking_reasons =
        uniqueArray(
            reasons
        );


    return candidate;
}


/**
 * ============================================================
 * Sort Final Candidates
 * ============================================================
 */

function sortRankedCandidates(
    candidates
) {
    return [
        ...candidates
    ].sort(
        (
            a,
            b
        ) => {
            const scoreA =
                a
                    ?.ranking
                    ?.overall_score ??
                0;

            const scoreB =
                b
                    ?.ranking
                    ?.overall_score ??
                0;


            if (
                scoreB !== scoreA
            ) {
                return (
                    scoreB -
                    scoreA
                );
            }


            /**
             * Tie-break #1
             * Current equipment wins if safe
             */

            const currentA =
                a
                    ?.ranking
                    ?.is_current_equipment ===
                true;

            const currentB =
                b
                    ?.ranking
                    ?.is_current_equipment ===
                true;


            if (
                currentA !== currentB
            ) {
                return currentA
                    ? -1
                    : 1;
            }


            /**
             * Tie-break #2
             * Physical
             */

            const physicalA =
                a
                    ?.ranking
                    ?.physical_compatibility ??
                0;

            const physicalB =
                b
                    ?.ranking
                    ?.physical_compatibility ??
                0;


            if (
                physicalB !==
                physicalA
            ) {
                return (
                    physicalB -
                    physicalA
                );
            }


            /**
             * Tie-break #3
             * Confidence
             */

            const confidenceA =
                a
                    ?.ranking
                    ?.confidence ??
                0;

            const confidenceB =
                b
                    ?.ranking
                    ?.confidence ??
                0;


            if (
                confidenceB !==
                confidenceA
            ) {
                return (
                    confidenceB -
                    confidenceA
                );
            }


            /**
             * Tie-break #4
             * Adaptation Cost
             */

            const adaptationA =
                a
                    ?.ranking
                    ?.adaptation_cost ??
                99;

            const adaptationB =
                b
                    ?.ranking
                    ?.adaptation_cost ??
                99;


            return (
                adaptationA -
                adaptationB
            );
        }
    );
}


/**
 * ============================================================
 * Rank Labels
 * ============================================================
 */

function assignRankLabels(
    candidates,
    candidateType
) {
    return candidates.map(
        (
            candidate,
            index
        ) => {
            const output =
                deepClone(
                    candidate
                );


            output.rank =
                index + 1;


            if (
                index === 0
            ) {
                output.rank_label =
                    candidateType === "racquet"
                        ? "Best Racquet Match"
                        : "Best String Match";
            } else if (
                index === 1
            ) {
                output.rank_label =
                    "Strong Alternative";
            } else if (
                index === 2
            ) {
                output.rank_label =
                    "Alternative";
            } else {
                output.rank_label =
                    "Candidate";
            }


            return output;
        }
    );
}


/**
 * ============================================================
 * Load Ranking Knowledge
 * ============================================================
 */

async function loadRankingKnowledge() {
    try {
        return await loadKnowledgeJson(
            "inference/recommendation_ranking.json"
        );
    } catch {
        return null;
    }
}


/**
 * ============================================================
 * Main Ranking Engine
 * ============================================================
 */

export async function rankRecommendations(
    conflictResult,
    playerProfile
) {
    /**
     * ----------------------------------
     * STEP 1
     * Validate Profile
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
            "EveryCourtAI Ranking Engine: invalid player profile."
        );
    }


    /**
     * ----------------------------------
     * STEP 2
     * Validate Conflict Result
     * ----------------------------------
     */

    if (
        !conflictResult ||
        typeof conflictResult !== "object"
    ) {
        throw new Error(
            "EveryCourtAI Ranking Engine: conflictResult must be an object."
        );
    }


    const rawRacquets =
        Array.isArray(
            conflictResult.racquets
        )
            ? conflictResult.racquets
            : [];


    const rawStrings =
        Array.isArray(
            conflictResult.strings
        )
            ? conflictResult.strings
            : [];


    /**
     * ----------------------------------
     * STEP 3
     * Load Ranking Knowledge
     * ----------------------------------
     */

    const rankingKnowledge =
        await loadRankingKnowledge();


    /**
     * ----------------------------------
     * STEP 4
     * Physical Context
     * ----------------------------------
     */

    const physicalConstraints =
        getActivePhysicalConstraints(
            playerProfile
        );


    /**
     * ----------------------------------
     * STEP 5
     * Evaluate Current Racquet
     * ----------------------------------
     */

    const currentRacquetContext =
        evaluateCurrentRacquetContext(
            rawRacquets,
            playerProfile,
            physicalConstraints
        );


    /**
     * ----------------------------------
     * STEP 6
     * Rank Racquets
     * ----------------------------------
     */

    const rankedRacquets = [];


    for (
        const candidate
        of rawRacquets
    ) {
        const ranked =
            rankCandidate(
                candidate,
                "racquet",
                playerProfile,
                physicalConstraints,
                currentRacquetContext
            );


        if (ranked) {
            rankedRacquets.push(
                ranked
            );
        }
    }


    /**
     * ----------------------------------
     * STEP 7
     * Rank Strings
     * ----------------------------------
     */

    const rankedStrings = [];


    for (
        const candidate
        of rawStrings
    ) {
        const ranked =
            rankCandidate(
                candidate,
                "string",
                playerProfile,
                physicalConstraints,
                currentRacquetContext
            );


        if (ranked) {
            rankedStrings.push(
                ranked
            );
        }
    }


    /**
     * ----------------------------------
     * STEP 8
     * Sort + Limit
     * ----------------------------------
     */

    const finalRacquets =
        assignRankLabels(
            sortRankedCandidates(
                rankedRacquets
            )
                .slice(
                    0,
                    RACQUET_FINAL_LIMIT
                ),
            "racquet"
        );


    const finalStrings =
        assignRankLabels(
            sortRankedCandidates(
                rankedStrings
            )
                .slice(
                    0,
                    STRING_FINAL_LIMIT
                ),
            "string"
        );


    /**
     * ----------------------------------
     * STEP 9
     * Best Matches
     * ----------------------------------
     */

    const bestRacquet =
        finalRacquets[0] ??
        null;


    const bestString =
        finalStrings[0] ??
        null;


    /**
     * ----------------------------------
     * STEP 10
     * Output
     * ----------------------------------
     */

    return {
        engine:
            "ranking_engine",

        version:
            ENGINE_VERSION,

        generated_at:
            new Date()
                .toISOString(),

        ranking_knowledge_loaded:
            Boolean(
                rankingKnowledge
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
                physicalConstraints
        },

        continuity_context: {
            current_racquet_id:
                getCurrentRacquetId(
                    playerProfile
                ) || null,

            current_racquet_found:
                currentRacquetContext
                    .found,

            current_racquet_context_score:
                currentRacquetContext
                    .score,

            current_racquet_physical_score:
                currentRacquetContext
                    .physical_score,

            current_racquet_goal_score:
                currentRacquetContext
                    .goal_score,

            current_racquet_strong_enough_to_keep:
                currentRacquetContext
                    .strong_enough_to_keep
        },

        candidate_counts: {
            racquets_received:
                rawRacquets.length,

            racquets_ranked:
                finalRacquets.length,

            strings_received:
                rawStrings.length,

            strings_ranked:
                finalStrings.length
        },

        best_matches: {
            racquet:
                bestRacquet,

            string:
                bestString
        },

        racquets:
            finalRacquets,

        strings:
            finalStrings
    };
}


/**
 * ============================================================
 * Debug / Test Helpers
 * ============================================================
 */

export const rankingHelpers = {
    calculatePhysicalScore,

    calculateGoalAlignment,

    calculateProblemResolution,

    calculatePlayingStyleMatch,

    calculateSwingSpeedMatch,

    calculatePreferenceMatch,

    calculateCandidateConfidence,

    calculateAdaptationCost,

    convertAdaptationCostToScore,

    calculateContinuityScore,

    evaluateCurrentRacquetContext,

    calculateRiskPenalty,

    rankCandidate,

    sortRankedCandidates
};
