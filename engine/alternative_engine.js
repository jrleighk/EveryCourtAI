/**
 * ============================================================
 * EveryCourtAI
 * Alternative Engine
 * Version: 1.0
 * ============================================================
 *
 * 文件路径：
 * engine/alternative_engine.js
 *
 * 作用：
 * 1. 接收 Ranking Engine 排序后的候选
 * 2. 保留 Best Overall
 * 3. 生成不同方向的 Alternative
 * 4. Comfort Alternative
 * 5. Performance Alternative
 * 6. Minimal Change Alternative
 * 7. Value Alternative
 * 8. Racquet Change Alternative
 * 9. 防止多个 Alternative 实际上只是重复答案
 *
 * 注意：
 * - 本文件不重新执行完整 Matching
 * - 本文件不替代 Ranking Engine
 * - Physical Constraint 永远不能被 Alternative 绕过
 * - Alternative 必须与 Best Overall 存在真正有意义的差异
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

const ENGINE_VERSION = "1.0";

const DEFAULT_MAX_ALTERNATIVES = 3;

const MIN_SCORE = 0;
const MAX_SCORE = 100;


/**
 * ============================================================
 * Alternative 类型
 * ============================================================
 */

const ALTERNATIVE_TYPES = {
    COMFORT: "comfort_alternative",
    PERFORMANCE: "performance_alternative",
    MINIMAL_CHANGE: "minimal_change_alternative",
    VALUE: "value_alternative",
    PREMIUM: "premium_alternative",
    RACQUET_CHANGE: "racquet_change_alternative"
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
 * Player Physical
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
 * 当前装备
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

        natural_gut:
            text.includes("natural gut"),

        multifilament:
            text.includes("multifilament"),

        soft:
            text.includes("soft"),

        comfort:
            text.includes("comfort"),

        firm:
            text.includes("firm") ||
            text.includes("stiff"),

        control:
            text.includes("control"),

        spin:
            text.includes("spin"),

        power:
            text.includes("power"),

        feel:
            text.includes("feel") ||
            text.includes("touch"),

        durable:
            text.includes("durability") ||
            text.includes("durable"),

        shaped:
            text.includes("shaped") ||
            text.includes("pentagon") ||
            text.includes("hexagon") ||
            text.includes("octagon"),

        round:
            text.includes("round"),

        premium:
            text.includes("natural gut") ||
            text.includes("premium"),

        responsive:
            text.includes("responsive") ||
            text.includes("lively")
    };
}


function detectRacquetTraits(
    candidate
) {
    const specs =
        candidate?.specifications ?? {};

    const text =
        buildCandidateText(
            candidate
        );

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

        control:
            text.includes("control"),

        spin:
            text.includes("spin"),

        power:
            text.includes("power"),

        comfort:
            text.includes("comfort"),

        forgiveness:
            text.includes("forgiveness") ||
            text.includes("forgiving"),

        feel:
            text.includes("feel") ||
            text.includes("touch"),

        maneuverability:
            text.includes("maneuver"),

        premium:
            text.includes("premium")
    };
}


/**
 * ============================================================
 * Ranking Score Helpers
 * ============================================================
 */

function getOverallScore(
    candidate
) {
    return safeNumber(
        candidate
            ?.ranking
            ?.overall_score
    ) ??
    safeNumber(
        candidate?.match_score
    ) ??
    0;
}


function getPhysicalScore(
    candidate
) {
    return safeNumber(
        candidate
            ?.ranking
            ?.physical_compatibility
    ) ?? 70;
}


function getGoalScore(
    candidate
) {
    return safeNumber(
        candidate
            ?.ranking
            ?.goal_alignment
    ) ?? 70;
}


function getProblemResolutionScore(
    candidate
) {
    return safeNumber(
        candidate
            ?.ranking
            ?.current_problem_resolution
    ) ?? 70;
}


function getPreferenceScore(
    candidate
) {
    return safeNumber(
        candidate
            ?.ranking
            ?.preference_match
    ) ?? 70;
}


function getConfidenceScore(
    candidate
) {
    return safeNumber(
        candidate
            ?.ranking
            ?.confidence
    ) ?? 70;
}


function getAdaptationCost(
    candidate
) {
    return safeNumber(
        candidate
            ?.ranking
            ?.adaptation_cost
    ) ?? 5;
}


/**
 * ============================================================
 * Physical Safe Check
 *
 * Alternative 不允许重新引入 Conflict Engine 已经排除的风险。
 * ============================================================
 */

function passesPhysicalSafety(
    candidate,
    candidateType,
    physicalConstraints
) {

    const physicalScore =
        getPhysicalScore(
            candidate
        );

    if (
        physicalScore < 55
    ) {
        return false;
    }


    if (
        physicalConstraints.length === 0
    ) {
        return true;
    }


    if (
        candidateType === "string"
    ) {

        const traits =
            detectStringTraits(
                candidate
            );

        const highUpperBody =
            physicalConstraints.some(
                item =>
                    [
                        "arm",
                        "elbow",
                        "wrist",
                        "shoulder",
                        "neck"
                    ].includes(
                        item.region
                    ) &&
                    item.severity === "high"
            );


        if (
            highUpperBody &&
            traits.firm &&
            traits.polyester &&
            !traits.soft
        ) {
            return false;
        }
    }


    if (
        candidateType === "racquet"
    ) {

        const traits =
            detectRacquetTraits(
                candidate
            );

        const highShoulderOrNeck =
            physicalConstraints.some(
                item =>
                    [
                        "shoulder",
                        "neck"
                    ].includes(
                        item.region
                    ) &&
                    item.severity === "high"
            );


        if (
            highShoulderOrNeck &&
            traits.swingweight !== null &&
            traits.swingweight >= 340
        ) {
            return false;
        }
    }


    return true;
}


/**
 * ============================================================
 * Comfort Score
 * ============================================================
 */

function calculateComfortAlternativeScore(
    candidate,
    candidateType
) {

    let score =
        getOverallScore(
            candidate
        ) * 0.45;

    score +=
        getPhysicalScore(
            candidate
        ) * 0.25;


    if (
        candidateType === "string"
    ) {

        const traits =
            detectStringTraits(
                candidate
            );

        if (
            traits.natural_gut
        ) {
            score += 12;
        }

        if (
            traits.multifilament
        ) {
            score += 10;
        }

        if (
            traits.soft
        ) {
            score += 8;
        }

        if (
            traits.comfort
        ) {
            score += 7;
        }

        if (
            traits.firm &&
            traits.polyester
        ) {
            score -= 8;
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
            traits.comfort
        ) {
            score += 10;
        }

        if (
            traits.forgiveness
        ) {
            score += 7;
        }

        if (
            traits.stiffness !== null &&
            traits.stiffness <= 66
        ) {
            score += 6;
        }
    }


    return score;
}


/**
 * ============================================================
 * Performance Score
 * ============================================================
 */

function calculatePerformanceAlternativeScore(
    candidate,
    candidateType,
    playerProfile
) {

    let score =
        getOverallScore(
            candidate
        ) * 0.45;

    score +=
        getGoalScore(
            candidate
        ) * 0.30;

    score +=
        getProblemResolutionScore(
            candidate
        ) * 0.15;

    score +=
        getConfidenceScore(
            candidate
        ) * 0.10;


    const goal =
        playerProfile
            ?.primary_goal;


    if (
        candidateType === "string"
    ) {

        const traits =
            detectStringTraits(
                candidate
            );


        if (
            goal === "more_control" &&
            traits.control
        ) {
            score += 8;
        }


        if (
            goal === "more_spin" &&
            (
                traits.spin ||
                traits.shaped
            )
        ) {
            score += 8;
        }


        if (
            goal === "more_power" &&
            traits.power
        ) {
            score += 8;
        }


        if (
            goal === "more_feel" &&
            traits.feel
        ) {
            score += 8;
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
            goal === "more_control" &&
            traits.control
        ) {
            score += 8;
        }


        if (
            goal === "more_spin" &&
            traits.spin
        ) {
            score += 8;
        }


        if (
            goal === "more_power" &&
            traits.power
        ) {
            score += 8;
        }


        if (
            goal === "more_feel" &&
            traits.feel
        ) {
            score += 8;
        }
    }


    return score;
}


/**
 * ============================================================
 * Minimal Change Score
 * ============================================================
 */

function calculateMinimalChangeScore(
    candidate,
    candidateType,
    playerProfile
) {

    let score =
        getOverallScore(
            candidate
        ) * 0.40;

    const adaptationCost =
        getAdaptationCost(
            candidate
        );


    score +=
        (
            10 -
            Math.min(
                adaptationCost,
                10
            )
        ) * 6;


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
            score += 20;
        }
    }


    if (
        candidateType === "string"
    ) {

        const currentId =
            getCurrentStringId(
                playerProfile
            );

        if (
            currentId &&
            normalizeKey(
                candidate.id
            ) === currentId
        ) {
            score += 20;
        }
    }


    return score;
}


/**
 * ============================================================
 * Value Score
 *
 * V1 目前没有真实产品价格数据库，
 * 因此 Value 只能根据耐久、适应成本和非 Premium 属性估算。
 * 后续有价格数据库后再升级。
 * ============================================================
 */

function calculateValueAlternativeScore(
    candidate,
    candidateType
) {

    let score =
        getOverallScore(
            candidate
        ) * 0.55;

    score +=
        getConfidenceScore(
            candidate
        ) * 0.15;

    score +=
        (
            10 -
            Math.min(
                getAdaptationCost(
                    candidate
                ),
                10
            )
        ) * 2;


    if (
        candidateType === "string"
    ) {

        const traits =
            detectStringTraits(
                candidate
            );

        if (
            traits.durable
        ) {
            score += 10;
        }

        if (
            traits.premium
        ) {
            score -= 6;
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
            traits.premium
        ) {
            score -= 4;
        }
    }


    return score;
}


/**
 * ============================================================
 * Premium Score
 * ============================================================
 */

function calculatePremiumAlternativeScore(
    candidate,
    candidateType
) {

    let score =
        getOverallScore(
            candidate
        ) * 0.60;

    score +=
        getPreferenceScore(
            candidate
        ) * 0.15;

    score +=
        getConfidenceScore(
            candidate
        ) * 0.15;


    if (
        candidateType === "string"
    ) {

        const traits =
            detectStringTraits(
                candidate
            );

        if (
            traits.natural_gut
        ) {
            score += 15;
        }

        if (
            traits.feel
        ) {
            score += 8;
        }

        if (
            traits.premium
        ) {
            score += 5;
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
            traits.feel
        ) {
            score += 8;
        }

        if (
            traits.premium
        ) {
            score += 5;
        }
    }


    return score;
}


/**
 * ============================================================
 * Candidate Difference
 * ============================================================
 */

function calculateMeaningfulDifference(
    primaryCandidate,
    alternativeCandidate,
    candidateType
) {

    if (
        !primaryCandidate ||
        !alternativeCandidate
    ) {
        return {
            meaningful: false,
            differences: []
        };
    }


    const differences = [];


    if (
        normalizeKey(
            primaryCandidate.id
        ) !==
        normalizeKey(
            alternativeCandidate.id
        )
    ) {
        differences.push(
            "Different Product"
        );
    }


    if (
        candidateType === "string"
    ) {

        const primaryTraits =
            detectStringTraits(
                primaryCandidate
            );

        const alternativeTraits =
            detectStringTraits(
                alternativeCandidate
            );


        if (
            primaryTraits.polyester !==
            alternativeTraits.polyester
        ) {
            differences.push(
                "Different String Family"
            );
        }


        if (
            primaryTraits.multifilament !==
            alternativeTraits.multifilament
        ) {
            differences.push(
                "Different Comfort Architecture"
            );
        }


        if (
            primaryTraits.natural_gut !==
            alternativeTraits.natural_gut
        ) {
            differences.push(
                "Different Material"
            );
        }


        if (
            primaryTraits.shaped !==
            alternativeTraits.shaped
        ) {
            differences.push(
                "Different Spin Geometry"
            );
        }


        const primaryGauge =
            safeNumber(
                primaryCandidate
                    ?.recommended_gauge_mm
            );

        const alternativeGauge =
            safeNumber(
                alternativeCandidate
                    ?.recommended_gauge_mm
            );


        if (
            primaryGauge !== null &&
            alternativeGauge !== null &&
            Math.abs(
                primaryGauge -
                alternativeGauge
            ) >= 0.03
        ) {
            differences.push(
                "Different Gauge Direction"
            );
        }
    }


    if (
        candidateType === "racquet"
    ) {

        const primaryTraits =
            detectRacquetTraits(
                primaryCandidate
            );

        const alternativeTraits =
            detectRacquetTraits(
                alternativeCandidate
            );


        if (
            primaryTraits.weight_g !== null &&
            alternativeTraits.weight_g !== null &&
            Math.abs(
                primaryTraits.weight_g -
                alternativeTraits.weight_g
            ) >= 10
        ) {
            differences.push(
                "Different Weight Class"
            );
        }


        if (
            primaryTraits.head_size_sq_in !== null &&
            alternativeTraits.head_size_sq_in !== null &&
            Math.abs(
                primaryTraits.head_size_sq_in -
                alternativeTraits.head_size_sq_in
            ) >= 2
        ) {
            differences.push(
                "Different Head Size"
            );
        }


        if (
            primaryTraits.swingweight !== null &&
            alternativeTraits.swingweight !== null &&
            Math.abs(
                primaryTraits.swingweight -
                alternativeTraits.swingweight
            ) >= 8
        ) {
            differences.push(
                "Different Swingweight Demand"
            );
        }
    }


    const primaryScore =
        getOverallScore(
            primaryCandidate
        );

    const alternativeScore =
        getOverallScore(
            alternativeCandidate
        );


    if (
        Math.abs(
            primaryScore -
            alternativeScore
        ) >= 3
    ) {
        differences.push(
            "Different Performance Tradeoff"
        );
    }


    return {
        meaningful:
            differences.length >= 1,

        differences:
            uniqueArray(
                differences
            )
    };
}


/**
 * ============================================================
 * 选取 Alternative Candidate
 * ============================================================
 */

function selectAlternativeCandidate({
    candidates,
    primaryCandidate,
    candidateType,
    playerProfile,
    physicalConstraints,
    scoreFunction,
    usedIds = []
}) {

    const ranked = [];


    for (
        const candidate
        of candidates
    ) {

        if (
            !candidate ||
            !candidate.id
        ) {
            continue;
        }


        const candidateId =
            normalizeKey(
                candidate.id
            );


        if (
            candidateId ===
            normalizeKey(
                primaryCandidate?.id
            )
        ) {
            continue;
        }


        if (
            usedIds.includes(
                candidateId
            )
        ) {
            continue;
        }


        if (
            !passesPhysicalSafety(
                candidate,
                candidateType,
                physicalConstraints
            )
        ) {
            continue;
        }


        const difference =
            calculateMeaningfulDifference(
                primaryCandidate,
                candidate,
                candidateType
            );


        if (
            !difference.meaningful
        ) {
            continue;
        }


        const alternativeScore =
            scoreFunction(
                candidate,
                candidateType,
                playerProfile
            );


        ranked.push({
            candidate,
            alternative_score:
                alternativeScore,
            differences:
                difference.differences
        });
    }


    ranked.sort(
        (
            a,
            b
        ) =>
            b.alternative_score -
            a.alternative_score
    );


    return ranked[0] ?? null;
}


/**
 * ============================================================
 * Alternative Tradeoff
 * ============================================================
 */

function compareCandidateMetrics(
    primary,
    alternative
) {

    const gains = [];
    const tradeoffs = [];


    const dimensions = [
        {
            key: "physical_compatibility",
            label: "Physical Compatibility"
        },
        {
            key: "goal_alignment",
            label: "Goal Alignment"
        },
        {
            key: "current_problem_resolution",
            label: "Problem Resolution"
        },
        {
            key: "preference_match",
            label: "Preference Match"
        },
        {
            key: "confidence",
            label: "Confidence"
        }
    ];


    for (
        const dimension
        of dimensions
    ) {

        const primaryValue =
            safeNumber(
                primary
                    ?.ranking
                    ?.[dimension.key]
            );

        const alternativeValue =
            safeNumber(
                alternative
                    ?.ranking
                    ?.[dimension.key]
            );


        if (
            primaryValue === null ||
            alternativeValue === null
        ) {
            continue;
        }


        const difference =
            alternativeValue -
            primaryValue;


        if (
            difference >= 5
        ) {
            gains.push(
                dimension.label
            );
        }


        if (
            difference <= -5
        ) {
            tradeoffs.push(
                dimension.label
            );
        }
    }


    return {
        gains:
            uniqueArray(
                gains
            ),

        tradeoffs:
            uniqueArray(
                tradeoffs
            )
    };
}


/**
 * ============================================================
 * Alternative Object
 * ============================================================
 */

function buildAlternative({
    type,
    selection,
    primaryCandidate,
    candidateType
}) {

    if (
        !selection
    ) {
        return null;
    }


    const candidate =
        deepClone(
            selection.candidate
        );


    const comparison =
        compareCandidateMetrics(
            primaryCandidate,
            candidate
        );


    return {
        type,

        candidate_type:
            candidateType,

        candidate_id:
            candidate.id,

        brand:
            candidate.brand ??
            null,

        model:
            candidate.model ??
            null,

        overall_score:
            getOverallScore(
                candidate
            ),

        alternative_score:
            Number(
                selection
                    .alternative_score
                    .toFixed(1)
            ),

        confidence:
            getConfidenceScore(
                candidate
            ),

        meaningful_differences:
            selection.differences,

        advantages:
            comparison.gains,

        tradeoffs:
            comparison.tradeoffs,

        candidate
    };
}


/**
 * ============================================================
 * String Alternatives
 * ============================================================
 */

function generateStringAlternatives(
    strings,
    primaryString,
    playerProfile,
    physicalConstraints
) {

    if (
        !primaryString
    ) {
        return [];
    }


    const output = [];

    const usedIds = [];


    /**
     * Comfort
     */

    const comfort =
        selectAlternativeCandidate({
            candidates:
                strings,

            primaryCandidate:
                primaryString,

            candidateType:
                "string",

            playerProfile,

            physicalConstraints,

            scoreFunction:
                calculateComfortAlternativeScore,

            usedIds
        });


    if (
        comfort
    ) {

        const alternative =
            buildAlternative({
                type:
                    ALTERNATIVE_TYPES.COMFORT,

                selection:
                    comfort,

                primaryCandidate:
                    primaryString,

                candidateType:
                    "string"
            });


        output.push(
            alternative
        );

        usedIds.push(
            normalizeKey(
                alternative.candidate_id
            )
        );
    }


    /**
     * Performance
     */

    const performance =
        selectAlternativeCandidate({
            candidates:
                strings,

            primaryCandidate:
                primaryString,

            candidateType:
                "string",

            playerProfile,

            physicalConstraints,

            scoreFunction:
                calculatePerformanceAlternativeScore,

            usedIds
        });


    if (
        performance
    ) {

        const alternative =
            buildAlternative({
                type:
                    ALTERNATIVE_TYPES.PERFORMANCE,

                selection:
                    performance,

                primaryCandidate:
                    primaryString,

                candidateType:
                    "string"
            });


        output.push(
            alternative
        );

        usedIds.push(
            normalizeKey(
                alternative.candidate_id
            )
        );
    }


    /**
     * Minimal Change
     */

    const minimal =
        selectAlternativeCandidate({
            candidates:
                strings,

            primaryCandidate:
                primaryString,

            candidateType:
                "string",

            playerProfile,

            physicalConstraints,

            scoreFunction:
                calculateMinimalChangeScore,

            usedIds
        });


    if (
        minimal
    ) {

        const alternative =
            buildAlternative({
                type:
                    ALTERNATIVE_TYPES.MINIMAL_CHANGE,

                selection:
                    minimal,

                primaryCandidate:
                    primaryString,

                candidateType:
                    "string"
            });


        output.push(
            alternative
        );
    }


    return output
        .filter(Boolean)
        .slice(
            0,
            DEFAULT_MAX_ALTERNATIVES
        );
}


/**
 * ============================================================
 * Racquet Alternatives
 * ============================================================
 */

function generateRacquetAlternatives(
    racquets,
    primaryRacquet,
    playerProfile,
    physicalConstraints
) {

    if (
        !primaryRacquet
    ) {
        return [];
    }


    const output = [];

    const usedIds = [];


    /**
     * Comfort
     */

    const comfort =
        selectAlternativeCandidate({
            candidates:
                racquets,

            primaryCandidate:
                primaryRacquet,

            candidateType:
                "racquet",

            playerProfile,

            physicalConstraints,

            scoreFunction:
                calculateComfortAlternativeScore,

            usedIds
        });


    if (
        comfort
    ) {

        const alternative =
            buildAlternative({
                type:
                    ALTERNATIVE_TYPES.COMFORT,

                selection:
                    comfort,

                primaryCandidate:
                    primaryRacquet,

                candidateType:
                    "racquet"
            });


        output.push(
            alternative
        );

        usedIds.push(
            normalizeKey(
                alternative.candidate_id
            )
        );
    }


    /**
     * Performance
     */

    const performance =
        selectAlternativeCandidate({
            candidates:
                racquets,

            primaryCandidate:
                primaryRacquet,

            candidateType:
                "racquet",

            playerProfile,

            physicalConstraints,

            scoreFunction:
                calculatePerformanceAlternativeScore,

            usedIds
        });


    if (
        performance
    ) {

        const alternative =
            buildAlternative({
                type:
                    ALTERNATIVE_TYPES.PERFORMANCE,

                selection:
                    performance,

                primaryCandidate:
                    primaryRacquet,

                candidateType:
                    "racquet"
            });


        output.push(
            alternative
        );

        usedIds.push(
            normalizeKey(
                alternative.candidate_id
            )
        );
    }


    /**
     * Minimal Change
     */

    const minimal =
        selectAlternativeCandidate({
            candidates:
                racquets,

            primaryCandidate:
                primaryRacquet,

            candidateType:
                "racquet",

            playerProfile,

            physicalConstraints,

            scoreFunction:
                calculateMinimalChangeScore,

            usedIds
        });


    if (
        minimal
    ) {

        const alternative =
            buildAlternative({
                type:
                    ALTERNATIVE_TYPES.MINIMAL_CHANGE,

                selection:
                    minimal,

                primaryCandidate:
                    primaryRacquet,

                candidateType:
                    "racquet"
            });


        output.push(
            alternative
        );
    }


    return output
        .filter(Boolean)
        .slice(
            0,
            DEFAULT_MAX_ALTERNATIVES
        );
}


/**
 * ============================================================
 * Value Option
 * ============================================================
 */

function generateValueOption(
    candidates,
    primaryCandidate,
    candidateType,
    playerProfile,
    physicalConstraints
) {

    return selectAlternativeCandidate({
        candidates,

        primaryCandidate,

        candidateType,

        playerProfile,

        physicalConstraints,

        scoreFunction:
            calculateValueAlternativeScore,

        usedIds: []
    });
}


/**
 * ============================================================
 * Premium Option
 * ============================================================
 */

function generatePremiumOption(
    candidates,
    primaryCandidate,
    candidateType,
    playerProfile,
    physicalConstraints
) {

    return selectAlternativeCandidate({
        candidates,

        primaryCandidate,

        candidateType,

        playerProfile,

        physicalConstraints,

        scoreFunction:
            calculatePremiumAlternativeScore,

        usedIds: []
    });
}


/**
 * ============================================================
 * Load Alternative Knowledge
 * ============================================================
 */

async function loadAlternativeKnowledge() {

    try {

        return await loadKnowledgeJson(
            "inference/alternative_generation.json"
        );

    } catch {

        return null;
    }
}


/**
 * ============================================================
 * Main Alternative Engine
 * ============================================================
 */

export async function generateAlternatives(
    rankingResult,
    playerProfile
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
            "EveryCourtAI Alternative Engine: invalid player profile."
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
            "EveryCourtAI Alternative Engine: rankingResult must be an object."
        );
    }


    const racquets =
        Array.isArray(
            rankingResult.racquets
        )
            ? rankingResult.racquets
            : [];


    const strings =
        Array.isArray(
            rankingResult.strings
        )
            ? rankingResult.strings
            : [];


    /**
     * ----------------------------------
     * STEP 3
     * Load Knowledge
     * ----------------------------------
     */

    const alternativeKnowledge =
        await loadAlternativeKnowledge();


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
     * Primary Candidates
     * ----------------------------------
     */

    const primaryRacquet =
        rankingResult
            ?.best_matches
            ?.racquet ??
        racquets[0] ??
        null;


    const primaryString =
        rankingResult
            ?.best_matches
            ?.string ??
        strings[0] ??
        null;


    /**
     * ----------------------------------
     * STEP 6
     * Generate Racquet Alternatives
     * ----------------------------------
     */

    const racquetAlternatives =
        generateRacquetAlternatives(
            racquets,
            primaryRacquet,
            playerProfile,
            physicalConstraints
        );


    /**
     * ----------------------------------
     * STEP 7
     * Generate String Alternatives
     * ----------------------------------
     */

    const stringAlternatives =
        generateStringAlternatives(
            strings,
            primaryString,
            playerProfile,
            physicalConstraints
        );


    /**
     * ----------------------------------
     * STEP 8
     * Value Options
     * ----------------------------------
     */

    const racquetValueSelection =
        primaryRacquet
            ? generateValueOption(
                racquets,
                primaryRacquet,
                "racquet",
                playerProfile,
                physicalConstraints
            )
            : null;


    const stringValueSelection =
        primaryString
            ? generateValueOption(
                strings,
                primaryString,
                "string",
                playerProfile,
                physicalConstraints
            )
            : null;


    const valueOptions = {
        racquet:
            racquetValueSelection
                ? buildAlternative({
                    type:
                        ALTERNATIVE_TYPES.VALUE,

                    selection:
                        racquetValueSelection,

                    primaryCandidate:
                        primaryRacquet,

                    candidateType:
                        "racquet"
                })
                : null,

        string:
            stringValueSelection
                ? buildAlternative({
                    type:
                        ALTERNATIVE_TYPES.VALUE,

                    selection:
                        stringValueSelection,

                    primaryCandidate:
                        primaryString,

                    candidateType:
                        "string"
                })
                : null
    };


    /**
     * ----------------------------------
     * STEP 9
     * Premium Options
     * ----------------------------------
     */

    const racquetPremiumSelection =
        primaryRacquet
            ? generatePremiumOption(
                racquets,
                primaryRacquet,
                "racquet",
                playerProfile,
                physicalConstraints
            )
            : null;


    const stringPremiumSelection =
        primaryString
            ? generatePremiumOption(
                strings,
                primaryString,
                "string",
                playerProfile,
                physicalConstraints
            )
            : null;


    const premiumOptions = {
        racquet:
            racquetPremiumSelection
                ? buildAlternative({
                    type:
                        ALTERNATIVE_TYPES.PREMIUM,

                    selection:
                        racquetPremiumSelection,

                    primaryCandidate:
                        primaryRacquet,

                    candidateType:
                        "racquet"
                })
                : null,

        string:
            stringPremiumSelection
                ? buildAlternative({
                    type:
                        ALTERNATIVE_TYPES.PREMIUM,

                    selection:
                        stringPremiumSelection,

                    primaryCandidate:
                        primaryString,

                    candidateType:
                        "string"
                })
                : null
    };


    /**
     * ----------------------------------
     * STEP 10
     * Output
     * ----------------------------------
     */

    return {

        engine:
            "alternative_engine",

        version:
            ENGINE_VERSION,

        generated_at:
            new Date()
                .toISOString(),

        alternative_knowledge_loaded:
            Boolean(
                alternativeKnowledge
            ),

        player_context: {
            primary_goal:
                playerProfile
                    ?.primary_goal ??
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

        primary: {
            racquet:
                primaryRacquet,

            string:
                primaryString
        },

        alternatives: {
            racquets:
                racquetAlternatives,

            strings:
                stringAlternatives
        },

        value_options:
            valueOptions,

        premium_options:
            premiumOptions,

        counts: {
            racquet_alternatives:
                racquetAlternatives.length,

            string_alternatives:
                stringAlternatives.length
        }
    };
}


/**
 * ============================================================
 * Test / Debug Helpers
 * ============================================================
 */

export const alternativeHelpers = {

    getActivePhysicalConstraints,

    detectStringTraits,

    detectRacquetTraits,

    passesPhysicalSafety,

    calculateComfortAlternativeScore,

    calculatePerformanceAlternativeScore,

    calculateMinimalChangeScore,

    calculateValueAlternativeScore,

    calculatePremiumAlternativeScore,

    calculateMeaningfulDifference,

    compareCandidateMetrics,

    selectAlternativeCandidate,

    generateStringAlternatives,

    generateRacquetAlternatives
};
