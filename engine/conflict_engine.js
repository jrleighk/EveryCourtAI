/**
 * ============================================================
 * EveryCourtAI
 * Conflict Engine
 * Version: 1.0
 * ============================================================
 *
 * 文件路径：
 * engine/conflict_engine.js
 *
 * 作用：
 * 1. 接收 Matching Engine 产生的候选方案
 * 2. 读取冲突规则
 * 3. 应用 Physical Hard Constraints
 * 4. 应用 Goal / Preference / Current Setup 冲突
 * 5. 排除严重冲突候选
 * 6. 对软冲突候选进行扣分
 * 7. 输出 Clean Candidates
 *
 * 注意：
 * - 本文件不负责最终排序
 * - 本文件不负责最终推荐
 * - 本文件不负责生成 Alternative
 *
 * ============================================================
 */

import {
    loadKnowledgeJson
} from "../utils/json_loader.js";

import {
    validatePlayerProfile,
    validateRecommendationCandidate
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
 * 获取 Active Physical Constraints
 * ============================================================
 */

function getActivePhysicalConstraints(
    playerProfile
) {
    const physical =
        playerProfile?.physical ?? {};

    const output = [];

    for (
        const [
            region,
            data
        ]
        of Object.entries(
            physical
        )
    ) {

        if (
            data?.active === true &&
            data?.severity &&
            data.severity !== "none"
        ) {
            output.push({
                region:
                    normalizeKey(region),

                severity:
                    normalizeKey(
                        data.severity
                    )
            });
        }
    }

    return output;
}


/**
 * ============================================================
 * Current Setup Issues
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
                active
            ]) =>
                active === true
        )
        .map(
            ([
                issue
            ]) =>
                normalizeKey(issue)
        );
}


/**
 * ============================================================
 * Candidate Search Text
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
 * Candidate Material Detection
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

        firm:
            text.includes("firm") ||
            text.includes("stiff"),

        very_firm:
            text.includes("very firm") ||
            text.includes("very stiff"),

        soft:
            text.includes("soft"),

        multifilament:
            text.includes("multifilament"),

        natural_gut:
            text.includes("natural gut"),

        shaped:
            text.includes("shaped") ||
            text.includes("pentagon") ||
            text.includes("hexagon") ||
            text.includes("octagon"),

        round:
            text.includes("round"),

        high_power:
            text.includes("high power") ||
            text.includes("powerful"),

        control:
            text.includes("control"),

        comfort:
            text.includes("comfort"),

        spin:
            text.includes("spin")
    };
}


/**
 * ============================================================
 * Racquet Traits Detection
 * ============================================================
 */

function detectRacquetTraits(
    candidate
) {

    const specs =
        candidate?.specifications ?? {};

    const weight =
        Number.isFinite(
            Number(
                specs.weight_g
            )
        )
            ? Number(
                specs.weight_g
            )
            : null;

    const swingweight =
        Number.isFinite(
            Number(
                specs.swingweight
            )
        )
            ? Number(
                specs.swingweight
            )
            : null;

    const stiffness =
        Number.isFinite(
            Number(
                specs.stiffness
            )
        )
            ? Number(
                specs.stiffness
            )
            : null;

    const headSize =
        Number.isFinite(
            Number(
                specs.head_size_sq_in
            )
        )
            ? Number(
                specs.head_size_sq_in
            )
            : null;

    const balanceText =
        safeString(
            specs.balance
        );

    return {
        weight_g:
            weight,

        swingweight,

        stiffness,

        head_size_sq_in:
            headSize,

        head_heavy:
            balanceText.includes(
                "head heavy"
            ) ||
            balanceText.includes(
                "head-heavy"
            ),

        head_light:
            balanceText.includes(
                "head light"
            ) ||
            balanceText.includes(
                "head-light"
            )
    };
}


/**
 * ============================================================
 * Hard Constraint — 球线
 * ============================================================
 */

function applyStringHardConstraints(
    candidate,
    physicalConstraints
) {

    const traits =
        detectStringTraits(
            candidate
        );

    const reasons = [];

    for (
        const physical
        of physicalConstraints
    ) {

        const high =
            physical.severity === "high";

        const moderateOrHigh =
            physical.severity === "moderate" ||
            physical.severity === "high";


        /**
         * Arm / Elbow
         */

        if (
            [
                "arm",
                "elbow"
            ].includes(
                physical.region
            )
        ) {

            if (
                high &&
                traits.polyester &&
                traits.very_firm
            ) {
                reasons.push(
                    "High arm/elbow sensitivity conflicts with very firm polyester."
                );
            }

            if (
                high &&
                traits.polyester &&
                traits.firm &&
                !traits.soft
            ) {
                reasons.push(
                    "High arm/elbow sensitivity conflicts with firm full-poly style response."
                );
            }
        }


        /**
         * Wrist
         */

        if (
            physical.region === "wrist"
        ) {

            if (
                high &&
                traits.very_firm
            ) {
                reasons.push(
                    "High wrist sensitivity conflicts with very firm string response."
                );
            }
        }


        /**
         * Shoulder / Neck
         */

        if (
            [
                "shoulder",
                "neck"
            ].includes(
                physical.region
            )
        ) {

            if (
                moderateOrHigh &&
                traits.very_firm
            ) {
                reasons.push(
                    "Upper-body sensitivity makes very firm string response undesirable."
                );
            }
        }
    }

    return {
        excluded:
            reasons.length > 0,

        reasons
    };
}


/**
 * ============================================================
 * Hard Constraint — 球拍
 * ============================================================
 */

function applyRacquetHardConstraints(
    candidate,
    physicalConstraints
) {

    const traits =
        detectRacquetTraits(
            candidate
        );

    const reasons = [];

    for (
        const physical
        of physicalConstraints
    ) {

        const high =
            physical.severity === "high";

        if (!high) {
            continue;
        }


        /**
         * Shoulder / Neck
         */

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
                traits.swingweight >= 340
            ) {
                reasons.push(
                    "High shoulder/neck sensitivity conflicts with excessive swingweight."
                );
            }

            if (
                traits.weight_g !== null &&
                traits.weight_g >= 325
            ) {
                reasons.push(
                    "High shoulder/neck sensitivity conflicts with excessive static weight."
                );
            }

            if (
                traits.head_heavy
            ) {
                reasons.push(
                    "High shoulder/neck sensitivity conflicts with strongly head-heavy balance."
                );
            }
        }


        /**
         * Wrist
         */

        if (
            physical.region === "wrist"
        ) {

            if (
                traits.swingweight !== null &&
                traits.swingweight >= 340
            ) {
                reasons.push(
                    "High wrist sensitivity conflicts with excessive swingweight."
                );
            }
        }


        /**
         * Arm / Elbow
         */

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
                traits.stiffness >= 72
            ) {
                reasons.push(
                    "High arm/elbow sensitivity conflicts with very stiff frame."
                );
            }
        }


        /**
         * Lower Back / Hip
         */

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
                traits.swingweight >= 345
            ) {
                reasons.push(
                    "High lower-back/hip sensitivity conflicts with very demanding swingweight."
                );
            }
        }


        /**
         * Knee / Ankle
         */

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
                traits.head_size_sq_in <= 95
            ) {
                reasons.push(
                    "High knee/ankle sensitivity conflicts with a very small, unforgiving head size."
                );
            }
        }
    }

    return {
        excluded:
            reasons.length > 0,

        reasons
    };
}


/**
 * ============================================================
 * Soft Physical Penalties — String
 * ============================================================
 */

function applyStringPhysicalPenalties(
    candidate,
    physicalConstraints
) {

    const traits =
        detectStringTraits(
            candidate
        );

    let adjustment = 0;

    const reasons = [];
    const riskFlags = [];


    for (
        const physical
        of physicalConstraints
    ) {

        const mild =
            physical.severity === "mild";

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
                traits.natural_gut ||
                traits.multifilament ||
                traits.soft ||
                traits.comfort
            ) {
                adjustment +=
                    mild
                        ? 3
                        : 6;

                reasons.push(
                    "Comfort-oriented string receives physical compatibility bonus."
                );
            }

            if (
                traits.firm &&
                !traits.soft
            ) {
                adjustment -=
                    mild
                        ? 4
                        : 8;

                riskFlags.push(
                    "Firm response may increase discomfort risk."
                );
            }
        }
    }


    return {
        adjustment,
        reasons,
        risk_flags:
            riskFlags
    };
}


/**
 * ============================================================
 * Soft Physical Penalties — Racquet
 * ============================================================
 */

function applyRacquetPhysicalPenalties(
    candidate,
    physicalConstraints
) {

    const traits =
        detectRacquetTraits(
            candidate
        );

    let adjustment = 0;

    const reasons = [];
    const riskFlags = [];


    for (
        const physical
        of physicalConstraints
    ) {

        const moderate =
            physical.severity === "moderate";

        const mild =
            physical.severity === "mild";


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
                adjustment -=
                    moderate
                        ? 8
                        : 4;

                riskFlags.push(
                    "Swingweight may increase shoulder/neck demand."
                );
            }

            if (
                traits.head_light
            ) {
                adjustment += 3;

                reasons.push(
                    "Head-light balance supports upper-body maneuverability."
                );
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
                adjustment -=
                    moderate
                        ? 8
                        : 4;

                riskFlags.push(
                    "Frame stiffness may increase arm/elbow stress."
                );
            }
        }


        if (
            physical.region === "wrist"
        ) {

            if (
                traits.swingweight !== null &&
                traits.swingweight > 330
            ) {
                adjustment -=
                    moderate
                        ? 6
                        : 3;
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
                adjustment -=
                    moderate
                        ? 6
                        : 3;
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
                adjustment += 4;

                reasons.push(
                    "Larger head size improves forgiveness when movement is limited."
                );
            }
        }
    }


    return {
        adjustment,
        reasons,
        risk_flags:
            riskFlags
    };
}


/**
 * ============================================================
 * Goal Conflict — String
 * ============================================================
 */

function applyStringGoalConflict(
    candidate,
    playerProfile
) {

    const goal =
        playerProfile?.primary_goal;

    const traits =
        detectStringTraits(
            candidate
        );

    let adjustment = 0;

    const reasons = [];


    if (
        goal === "more_comfort"
    ) {

        if (
            traits.soft ||
            traits.multifilament ||
            traits.natural_gut ||
            traits.comfort
        ) {
            adjustment += 7;
        }

        if (
            traits.very_firm
        ) {
            adjustment -= 12;

            reasons.push(
                "Very firm string conflicts with comfort goal."
            );
        }
    }


    if (
        goal === "more_spin"
    ) {

        if (
            traits.shaped ||
            traits.spin
        ) {
            adjustment += 6;
        }

        if (
            traits.multifilament &&
            !traits.shaped
        ) {
            adjustment -= 3;
        }
    }


    if (
        goal === "more_control"
    ) {

        if (
            traits.control ||
            traits.round
        ) {
            adjustment += 5;
        }

        if (
            traits.high_power
        ) {
            adjustment -= 4;

            reasons.push(
                "High-power string may conflict with control goal."
            );
        }
    }


    if (
        goal === "more_power"
    ) {

        if (
            traits.high_power ||
            traits.soft ||
            traits.natural_gut ||
            traits.multifilament
        ) {
            adjustment += 5;
        }

        if (
            traits.very_firm
        ) {
            adjustment -= 5;
        }
    }


    if (
        goal === "more_feel"
    ) {

        if (
            traits.natural_gut ||
            traits.multifilament ||
            traits.round
        ) {
            adjustment += 5;
        }
    }


    return {
        adjustment,
        reasons
    };
}


/**
 * ============================================================
 * Preference Conflicts
 * ============================================================
 */

function applyPreferenceConflicts(
    candidate,
    playerProfile
) {

    const feel =
        normalizeKey(
            playerProfile
                ?.preferences
                ?.feel
        );

    const currentIssues =
        getCurrentSetupIssues(
            playerProfile
        );

    const traits =
        detectStringTraits(
            candidate
        );

    let adjustment = 0;

    const reasons = [];


    /**
     * Firm Feel + Too Stiff
     */

    if (
        feel === "firm" &&
        currentIssues.includes(
            "too_stiff"
        ) &&
        traits.very_firm
    ) {
        adjustment -= 8;

        reasons.push(
            "Current setup is already too stiff, so firm preference is suppressed."
        );
    }


    /**
     * Soft Feel + Control Problem
     */

    if (
        feel === "soft" &&
        currentIssues.includes(
            "not_enough_control"
        ) &&
        traits.high_power
    ) {
        adjustment -= 4;
    }


    return {
        adjustment,
        reasons
    };
}


/**
 * ============================================================
 * Current Setup Problem Conflict
 * ============================================================
 */

function applyCurrentSetupProblemLogic(
    candidate,
    playerProfile
) {

    const issues =
        getCurrentSetupIssues(
            playerProfile
        );

    const traits =
        detectStringTraits(
            candidate
        );

    let adjustment = 0;

    const reasons = [];


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
            adjustment += 6;
        }

        if (
            traits.very_firm
        ) {
            adjustment -= 10;
        }
    }


    if (
        issues.includes(
            "not_enough_spin"
        )
    ) {
        if (
            traits.shaped ||
            traits.spin
        ) {
            adjustment += 6;
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
            adjustment += 5;
        }

        if (
            traits.high_power
        ) {
            adjustment -= 5;
        }
    }


    if (
        issues.includes(
            "not_enough_power"
        )
    ) {
        if (
            traits.high_power ||
            traits.soft ||
            traits.multifilament ||
            traits.natural_gut
        ) {
            adjustment += 5;
        }
    }


    return {
        adjustment,
        reasons
    };
}


/**
 * ============================================================
 * 单个 String Candidate 冲突处理
 * ============================================================
 */

function processStringCandidate(
    originalCandidate,
    playerProfile,
    physicalConstraints
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
        return {
            excluded: true,
            reason:
                "Invalid string candidate structure.",
            candidate: null
        };
    }


    /**
     * Hard Constraint
     */

    const hardConstraint =
        applyStringHardConstraints(
            candidate,
            physicalConstraints
        );

    if (
        hardConstraint.excluded
    ) {
        return {
            excluded: true,

            reason:
                hardConstraint.reasons,

            candidate: null
        };
    }


    let totalAdjustment = 0;

    const conflictReasons = [];
    const riskFlags = [
        ...(candidate.risk_flags ?? [])
    ];


    /**
     * Physical Soft Logic
     */

    const physical =
        applyStringPhysicalPenalties(
            candidate,
            physicalConstraints
        );

    totalAdjustment +=
        physical.adjustment;

    conflictReasons.push(
        ...physical.reasons
    );

    riskFlags.push(
        ...physical.risk_flags
    );


    /**
     * Goal
     */

    const goal =
        applyStringGoalConflict(
            candidate,
            playerProfile
        );

    totalAdjustment +=
        goal.adjustment;

    conflictReasons.push(
        ...goal.reasons
    );


    /**
     * Preferences
     */

    const preference =
        applyPreferenceConflicts(
            candidate,
            playerProfile
        );

    totalAdjustment +=
        preference.adjustment;

    conflictReasons.push(
        ...preference.reasons
    );


    /**
     * Current Setup
     */

    const setup =
        applyCurrentSetupProblemLogic(
            candidate,
            playerProfile
        );

    totalAdjustment +=
        setup.adjustment;

    conflictReasons.push(
        ...setup.reasons
    );


    /**
     * Score
     */

    const originalScore =
        Number(
            candidate.match_score ??
            0
        );

    const newScore =
        clamp(
            originalScore +
            totalAdjustment
        );


    candidate.pre_conflict_score =
        originalScore;

    candidate.conflict_adjustment =
        totalAdjustment;

    candidate.match_score =
        Math.round(
            newScore
        );

    candidate.conflict_reasons =
        uniqueArray(
            conflictReasons
        );

    candidate.risk_flags =
        uniqueArray(
            riskFlags
        );


    return {
        excluded: false,
        candidate
    };
}


/**
 * ============================================================
 * 单个 Racquet Candidate 冲突处理
 * ============================================================
 */

function processRacquetCandidate(
    originalCandidate,
    playerProfile,
    physicalConstraints
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
        return {
            excluded: true,
            reason:
                "Invalid racquet candidate structure.",
            candidate: null
        };
    }


    /**
     * Hard Constraint
     */

    const hardConstraint =
        applyRacquetHardConstraints(
            candidate,
            physicalConstraints
        );

    if (
        hardConstraint.excluded
    ) {
        return {
            excluded: true,

            reason:
                hardConstraint.reasons,

            candidate: null
        };
    }


    const physical =
        applyRacquetPhysicalPenalties(
            candidate,
            physicalConstraints
        );


    const originalScore =
        Number(
            candidate.match_score ??
            0
        );

    const newScore =
        clamp(
            originalScore +
            physical.adjustment
        );


    candidate.pre_conflict_score =
        originalScore;

    candidate.conflict_adjustment =
        physical.adjustment;

    candidate.match_score =
        Math.round(
            newScore
        );

    candidate.conflict_reasons =
        uniqueArray(
            physical.reasons
        );

    candidate.risk_flags =
        uniqueArray([
            ...(candidate.risk_flags ?? []),
            ...physical.risk_flags
        ]);


    return {
        excluded: false,
        candidate
    };
}


/**
 * ============================================================
 * 排序
 *
 * 这里只是保证输出顺序方便后续 Ranking。
 * 最终排序仍交给 ranking_engine.js。
 * ============================================================
 */

function sortCandidates(
    candidates
) {

    return [
        ...candidates
    ].sort(
        (
            a,
            b
        ) =>
            (
                b.match_score ?? 0
            ) -
            (
                a.match_score ?? 0
            )
    );
}


/**
 * ============================================================
 * Load Conflict Knowledge
 * ============================================================
 */

async function loadConflictKnowledge() {

    try {

        return await loadKnowledgeJson(
            "inference/conflict_resolution.json"
        );

    } catch {

        /**
         * V1 中代码本身已有默认逻辑。
         * 即使知识文件暂时无法加载，也允许继续运行。
         */

        return null;
    }
}


/**
 * ============================================================
 * Main Conflict Engine
 * ============================================================
 */

export async function runConflictEngine(
    matchingResult,
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
            "EveryCourtAI Conflict Engine: invalid player profile."
        );
    }


    /**
     * ----------------------------------
     * STEP 2
     * Validate Matching Result
     * ----------------------------------
     */

    if (
        !matchingResult ||
        typeof matchingResult !== "object"
    ) {
        throw new Error(
            "EveryCourtAI Conflict Engine: matchingResult must be an object."
        );
    }


    const racquetCandidates =
        Array.isArray(
            matchingResult.racquets
        )
            ? matchingResult.racquets
            : [];


    const stringCandidates =
        Array.isArray(
            matchingResult.strings
        )
            ? matchingResult.strings
            : [];


    /**
     * ----------------------------------
     * STEP 3
     * Load Knowledge
     * ----------------------------------
     */

    const conflictKnowledge =
        await loadConflictKnowledge();


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
     * Process Racquets
     * ----------------------------------
     */

    const cleanRacquets = [];

    const excludedRacquets = [];


    for (
        const candidate
        of racquetCandidates
    ) {

        const result =
            processRacquetCandidate(
                candidate,
                playerProfile,
                physicalConstraints
            );


        if (
            result.excluded
        ) {

            excludedRacquets.push({
                id:
                    candidate?.id ??
                    null,

                reason:
                    result.reason
            });

            continue;
        }


        cleanRacquets.push(
            result.candidate
        );
    }


    /**
     * ----------------------------------
     * STEP 6
     * Process Strings
     * ----------------------------------
     */

    const cleanStrings = [];

    const excludedStrings = [];


    for (
        const candidate
        of stringCandidates
    ) {

        const result =
            processStringCandidate(
                candidate,
                playerProfile,
                physicalConstraints
            );


        if (
            result.excluded
        ) {

            excludedStrings.push({
                id:
                    candidate?.id ??
                    null,

                reason:
                    result.reason
            });

            continue;
        }


        cleanStrings.push(
            result.candidate
        );
    }


    /**
     * ----------------------------------
     * STEP 7
     * Detect High-Level Conflicts
     * ----------------------------------
     */

    const conflictsDetected = [];

    const currentIssues =
        getCurrentSetupIssues(
            playerProfile
        );


    if (
        physicalConstraints.length > 0 &&
        playerProfile.primary_goal ===
            "more_control"
    ) {

        conflictsDetected.push({
            type:
                "physical_vs_control",

            resolution:
                "Physical compatibility takes priority over maximum control."
        });
    }


    if (
        physicalConstraints.length > 0 &&
        playerProfile.primary_goal ===
            "more_spin"
    ) {

        conflictsDetected.push({
            type:
                "physical_vs_spin",

            resolution:
                "Use safer spin generation before firm high-performance setups."
        });
    }


    if (
        currentIssues.includes(
            "too_stiff"
        ) &&
        normalizeKey(
            playerProfile
                ?.preferences
                ?.feel
        ) === "firm"
    ) {

        conflictsDetected.push({
            type:
                "current_setup_vs_firm_preference",

            resolution:
                "Current stiffness problem takes priority over firm feel preference."
        });
    }


    /**
     * ----------------------------------
     * STEP 8
     * Output
     * ----------------------------------
     */

    return {

        engine:
            "conflict_engine",

        version:
            ENGINE_VERSION,

        generated_at:
            new Date()
                .toISOString(),

        conflict_knowledge_loaded:
            Boolean(
                conflictKnowledge
            ),

        player_context: {
            primary_goal:
                playerProfile
                    ?.primary_goal ??
                null,

            physical_constraints:
                physicalConstraints,

            current_setup_issues:
                currentIssues,

            feel_preference:
                playerProfile
                    ?.preferences
                    ?.feel ??
                null
        },

        conflicts_detected:
            conflictsDetected,

        filtering: {
            racquets_before:
                racquetCandidates.length,

            racquets_after:
                cleanRacquets.length,

            racquets_excluded:
                excludedRacquets.length,

            strings_before:
                stringCandidates.length,

            strings_after:
                cleanStrings.length,

            strings_excluded:
                excludedStrings.length
        },

        excluded: {
            racquets:
                excludedRacquets,

            strings:
                excludedStrings
        },

        racquets:
            sortCandidates(
                cleanRacquets
            ),

        strings:
            sortCandidates(
                cleanStrings
            )
    };
}


/**
 * ============================================================
 * Test / Debug Helpers
 * ============================================================
 */

export const conflictHelpers = {

    getActivePhysicalConstraints,

    getCurrentSetupIssues,

    detectStringTraits,

    detectRacquetTraits,

    applyStringHardConstraints,

    applyRacquetHardConstraints,

    applyStringPhysicalPenalties,

    applyRacquetPhysicalPenalties,

    applyStringGoalConflict,

    applyPreferenceConflicts,

    applyCurrentSetupProblemLogic
};
