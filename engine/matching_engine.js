/**
 * ============================================================
 * EveryCourtAI
 * Matching Engine
 * Version: 1.0
 * ============================================================
 *
 * 文件路径：
 * engine/matching_engine.js
 *
 * 作用：
 * 1. 读取标准化后的 Player Profile
 * 2. 读取 racquets / strings Knowledge
 * 3. 应用基础 Player DNA 匹配
 * 4. 应用身体限制
 * 5. 应用 Goal / Playing Style / Swing Speed / Preference
 * 6. 生成第一轮 Racquet Candidates
 * 7. 生成第一轮 String Candidates
 *
 * 注意：
 * - 本文件只负责“候选生成”
 * - 不负责最终 Ranking
 * - 不负责最终 Recommendation
 * - 不负责最终 Conflict Resolution
 *
 * ============================================================
 */

import {
    loadKnowledgeDirectory
} from "../utils/runtime_json_loader.js";

import {
    validatePlayerProfile,
    validateRacquetRecord,
    validateStringRecord
} from "../utils/validator.js";


/**
 * ============================================================
 * 基础配置
 * ============================================================
 */

const ENGINE_VERSION = "1.0";

const DEFAULT_BASE_SCORE = 50;

const MIN_SCORE = 0;
const MAX_SCORE = 100;

const RACQUET_CANDIDATE_LIMIT = 30;
const STRING_CANDIDATE_LIMIT = 40;


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


    const direct =
        Number(
            value
        );


    if (
        Number.isFinite(
            direct
        )
    ) {
        return direct;
    }


    if (
        typeof value ===
            "string"
    ) {

        const match =
            value.match(
                /-?\d+(?:\.\d+)?/
            );


        if (
            match
        ) {

            const parsed =
                Number(
                    match[0]
                );


            return Number.isFinite(
                parsed
            )
                ? parsed
                : null;
        }
    }


    return null;
}


function safeString(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    if (
        typeof value === "string"
    ) {
        return value
            .trim()
            .toLowerCase();
    }

    return String(value)
        .trim()
        .toLowerCase();
}


function normalizeKey(value) {
    return safeString(value)
        .replace(/[\s-]+/g, "_");
}


function normalizeArray(value) {
    if (!value) {
        return [];
    }

    if (Array.isArray(value)) {
        return value
            .map(item => normalizeKey(item))
            .filter(Boolean);
    }

    return [
        normalizeKey(value)
    ].filter(Boolean);
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
 * 通用字段读取
 *
 * 因为现有不同品牌 JSON 可能字段并不完全一致，
 * Matching Engine 必须允许多种字段结构。
 * ============================================================
 */

function getFirstValue(
    object,
    paths = []
) {
    for (const path of paths) {

        const keys =
            path.split(".");

        let current =
            object;

        let valid = true;

        for (const key of keys) {

            if (
                current === null ||
                current === undefined ||
                typeof current !== "object" ||
                !(key in current)
            ) {
                valid = false;
                break;
            }

            current =
                current[key];
        }

        if (
            valid &&
            current !== null &&
            current !== undefined
        ) {
            return current;
        }
    }

    return null;
}


/**
 * ============================================================
 * DNA 值标准化
 *
 * 支持：
 *
 * 10
 * 8.5
 * "high"
 * "medium-high"
 * "medium"
 * "low"
 *
 * 最终统一转换成 0-10
 * ============================================================
 */

function normalizeDnaValue(value) {

    /**
     * Structured Performance DNA
     *
     * Newer racquet knowledge records may store ratings as:
     *
     * power: {
     *     rating: 9,
     *     cn: "力量输出：9/10"
     * }
     *
     * Preserve compatibility with legacy scalar DNA values.
     */
    if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value)
    ) {
        value =
            value?.rating ??
            value?.score ??
            value?.value ??
            null;
    }


    if (
        typeof value === "number" &&
        Number.isFinite(value)
    ) {
        if (value <= 1) {
            return value * 10;
        }

        return clamp(
            value,
            0,
            10
        );
    }

    const text =
        safeString(value)
            .replace(/_/g, "-");

    const mapping = {
        "very-low": 2,
        "low": 3,
        "low-medium": 4,
        "medium-low": 4,
        "medium": 5,
        "medium-high": 7,
        "high-medium": 7,
        "high": 8,
        "very-high": 10,
        "maximum": 10,
        "excellent": 9
    };

    return mapping[text] ?? null;
}


/**
 * ============================================================
 * 产品文字索引
 *
 * 用于处理现有 JSON 中还没有完全统一 DNA 字段的产品。
 * ============================================================
 */

function buildSearchText(data) {
    try {
        return JSON.stringify(data)
            .toLowerCase();
    } catch {
        return "";
    }
}


/**
 * ============================================================
 * 球拍字段适配
 * ============================================================
 */

function extractRacquetData(raw) {

    const id =
        getFirstValue(
            raw,
            [
                "id",
                "product_id",
                "slug"
            ]
        );

    const brand =
        getFirstValue(
            raw,
            [
                "brand",
                "manufacturer"
            ]
        );

    const model =
        getFirstValue(
            raw,
            [
                "model",
                "name",
                "product_name"
            ]
        );

    const weight =
        safeNumber(
            getFirstValue(
                raw,
                [
                    "weight_g",
                    "unstrung_weight_g",
                    "specs.weight_g",
                    "specs.unstrung_weight_g",
                    "specifications.weight_g",
                    "specifications.unstrung_weight_g",
                    "specifications.weight_unstrung.value"
                ]
            )
        );

    const headSize =
        safeNumber(
            getFirstValue(
                raw,
                [
                    "head_size_sq_in",
                    "head_size",
                    "specs.head_size_sq_in",
                    "specs.head_size",
                    "specifications.head_size_sq_in",
                    "specifications.head_size.value"
                ]
            )
        );

    const swingweight =
        safeNumber(
            getFirstValue(
                raw,
                [
                    "swingweight",
                    "swing_weight",
                    "specs.swingweight",
                    "specifications.swingweight",
                    "specifications.swing_weight.value"
                ]
            )
        );

    const stiffness =
        safeNumber(
            getFirstValue(
                raw,
                [
                    "stiffness",
                    "ra",
                    "specs.stiffness",
                    "specs.ra",
                    "specifications.ra",
                    "specifications.stiffness.value",
                    "specifications.ra.value"
                ]
            )
        );

    const stringPattern =
        getFirstValue(
            raw,
            [
                "string_pattern",
                "pattern",
                "specs.string_pattern",
                "specifications.string_pattern.value",
                "specifications.string_pattern"
            ]
        );

    const balance =
        getFirstValue(
            raw,
            [
                "balance",
                "balance_point",
                "specs.balance",
                "specifications.balance.value",
                "specifications.balance"
            ]
        );

    const dna =
        getFirstValue(
            raw,
            [
                "dna",
                "performance_dna",
                "racquet_dna",
                "ratings",
                "performance"
            ]
        ) ?? {};

    return {
        raw,

        id:
            id
                ? normalizeKey(id)
                : null,

        brand:
            brand
                ? String(brand).trim()
                : null,

        model:
            model
                ? String(model).trim()
                : null,

        weight_g:
            weight,

        head_size_sq_in:
            headSize,

        swingweight,

        stiffness,

        string_pattern:
            stringPattern
                ? String(stringPattern)
                : null,

        balance:
            balance
                ? String(balance)
                : null,

        dna,

        search_text:
            buildSearchText(raw)
    };
}


/**
 * ============================================================
 * 球线字段适配
 * ============================================================
 */

function extractStringData(raw) {

    const id =
        getFirstValue(
            raw,
            [
                "id",
                "product_id",
                "slug"
            ]
        );

    const brand =
        getFirstValue(
            raw,
            [
                "brand",
                "manufacturer"
            ]
        );

    const model =
        getFirstValue(
            raw,
            [
                "model",
                "name",
                "product_name"
            ]
        );

    const material =
        getFirstValue(
            raw,
            [
                "material",
                "string_type",
                "type",
                "specs.material"
            ]
        );

    const gauges =
        getFirstValue(
            raw,
            [
                "gauges_mm",
                "gauge_mm",
                "gauge",
                "specs.gauge_mm",
                "specifications.gauge_mm"
            ]
        );

    const shape =
        getFirstValue(
            raw,
            [
                "shape",
                "profile",
                "geometry",
                "specs.shape"
            ]
        );

    const stiffness =
        getFirstValue(
            raw,
            [
                "stiffness",
                "dna.stiffness",
                "performance_dna.stiffness"
            ]
        );

    const dna =
        getFirstValue(
            raw,
            [
                "dna",
                "performance_dna",
                "string_dna",
                "ratings",
                "performance"
            ]
        ) ?? {};

    return {
        raw,

        id:
            id
                ? normalizeKey(id)
                : null,

        brand:
            brand
                ? String(brand).trim()
                : null,

        model:
            model
                ? String(model).trim()
                : null,

        category:
            raw?.category ??
            null,

        material,

        string_family:
            raw?.string_family ??
            raw?.specifications?.string_family ??
            null,

        gauges_mm:
            Array.isArray(gauges)
                ? gauges
                    .map(safeNumber)
                    .filter(value => value !== null)
                : (
                    safeNumber(gauges) !== null
                        ? [safeNumber(gauges)]
                        : []
                ),

        shape:
            shape
                ? String(shape)
                : null,

        stiffness:
            normalizeDnaValue(stiffness),

        specifications:
            raw?.specifications ??
            null,

        design_profile:
            raw?.design_profile ??
            null,

        ai_rating:
            raw?.ai_rating ??
            null,

        performance_profile:
            raw?.performance_profile ??
            null,

        dna,

        search_text:
            buildSearchText(raw)
    };
}


/**
 * ============================================================
 * DNA 字段读取
 * ============================================================
 */

function readDna(
    candidate,
    field
) {

    const dna =
        candidate?.dna ?? {};

    const possibleFields = [
        field,
        normalizeKey(field)
    ];

    for (
        const possibleField
        of possibleFields
    ) {
        if (
            dna[possibleField] !== undefined
        ) {
            return normalizeDnaValue(
                dna[possibleField]
            );
        }
    }

    return null;
}


/**
 * ============================================================
 * Player 当前 Physical 状态
 * ============================================================
 */

function getActivePhysicalConstraints(
    playerProfile
) {
    const active = [];

    const physical =
        playerProfile?.physical ?? {};

    for (
        const [
            region,
            value
        ]
        of Object.entries(physical)
    ) {

        if (
            value?.active === true &&
            value?.severity &&
            value.severity !== "none"
        ) {
            active.push({
                region,
                severity:
                    normalizeKey(
                        value.severity
                    )
            });
        }
    }

    return active;
}


/**
 * ============================================================
 * Goal → 理想 DNA
 * ============================================================
 */

const GOAL_DNA = {

    more_control: {
        control: 10,
        predictability: 9,
        stability: 8,
        power: 5,
        launch_angle: 5
    },

    more_power: {
        power: 10,
        comfort: 8,
        forgiveness: 8,
        ball_pocketing: 8,
        control: 6
    },

    more_spin: {
        spin: 10,
        snapback: 10,
        control: 8,
        maneuverability: 8,
        launch_angle: 8
    },

    more_comfort: {
        comfort: 10,
        ball_pocketing: 9,
        forgiveness: 9,
        power: 7,
        stiffness: 3
    },

    more_feel: {
        feel: 10,
        control: 9,
        ball_pocketing: 9,
        comfort: 8,
        stability: 8
    }
};


/**
 * ============================================================
 * Playing Style → 理想 DNA
 * ============================================================
 */

const STYLE_DNA = {

    baseline_aggressive: {
        control: 9,
        spin: 9,
        stability: 9,
        predictability: 9
    },

    baseline_counterpuncher: {
        control: 8,
        forgiveness: 9,
        stability: 9,
        comfort: 8
    },

    baseline_grinder: {
        comfort: 9,
        forgiveness: 9,
        durability: 8,
        consistency: 9
    },

    all_court: {
        control: 9,
        feel: 9,
        maneuverability: 9,
        stability: 8
    },

    serve_volley: {
        maneuverability: 10,
        feel: 10,
        control: 9,
        stability: 8
    }
};


/**
 * ============================================================
 * Swing Speed → 理想 DNA
 * ============================================================
 */

const SWING_DNA = {

    slow: {
        power: 9,
        forgiveness: 9,
        comfort: 9,
        maneuverability: 9
    },

    medium: {
        power: 8,
        control: 8,
        spin: 8,
        comfort: 8
    },

    fast: {
        control: 10,
        stability: 9,
        spin: 9,
        predictability: 10,
        power: 5
    }
};


/**
 * ============================================================
 * DNA 相似度评分
 * ============================================================
 */

function calculateDnaMatch(
    candidate,
    targetDna,
    weight = 1
) {

    let totalScore = 0;
    let matchedFields = 0;

    for (
        const [
            field,
            targetValue
        ]
        of Object.entries(
            targetDna ?? {}
        )
    ) {

        const candidateValue =
            readDna(
                candidate,
                field
            );

        if (
            candidateValue === null
        ) {
            continue;
        }

        const difference =
            Math.abs(
                candidateValue -
                targetValue
            );

        const similarity =
            Math.max(
                0,
                10 - difference
            );

        totalScore +=
            similarity * weight;

        matchedFields += 1;
    }

    if (
        matchedFields === 0
    ) {
        return {
            score: 0,
            matched_fields: 0
        };
    }

    return {
        score:
            totalScore /
            matchedFields,

        matched_fields:
            matchedFields
    };
}


/**
 * ============================================================
 * 文本 Traits 辅助评分
 *
 * 当某个产品 JSON 暂时没有完整 DNA 时，
 * 允许使用原始描述提供较低权重的辅助匹配。
 * ============================================================
 */

function keywordBonus(
    candidate,
    keywords,
    bonusPerMatch = 1
) {

    const text =
        candidate.search_text;

    if (!text) {
        return 0;
    }

    let bonus = 0;

    for (
        const keyword of keywords
    ) {

        if (
            text.includes(
                safeString(keyword)
            )
        ) {
            bonus +=
                bonusPerMatch;
        }
    }

    return bonus;
}


/**
 * ============================================================
 * Structured String Physical Traits
 * ============================================================
 */

function getStructuredStringPhysicalTraits(
    stringCandidate
) {
    const designProfile =
        stringCandidate?.design_profile ?? {};

    const aiRating =
        stringCandidate?.ai_rating ?? {};

    const performanceProfile =
        stringCandidate?.performance_profile ?? {};

    const specifications =
        stringCandidate?.specifications ?? {};

    const structuralText =
        [
            safeString(
                stringCandidate?.category
            ),

            safeString(
                stringCandidate?.material
            ),

            safeString(
                stringCandidate?.string_family
            ),

            safeString(
                specifications?.construction
            ),

            safeString(
                designProfile?.string_type
            )
        ]
            .filter(Boolean)
            .join(" ");

    const stiffnessText =
        safeString(
            performanceProfile
                ?.string_stiffness
        );

    const comfortScore =
        safeNumber(
            aiRating?.comfort
        );

    const armFriendlinessScore =
        safeNumber(
            performanceProfile
                ?.arm_friendliness
        );

    const naturalGut =
        structuralText.includes(
            "natural gut"
        );

    const multifilament =
        structuralText.includes(
            "multifilament"
        );

    const polyester =
        (
            structuralText.includes(
                "polyester"
            ) ||
            structuralText.includes(
                "co-poly"
            ) ||
            structuralText.includes(
                "co poly"
            )
        );

    const firm =
        (
            stiffnessText.includes(
                "firm"
            ) ||
            stiffnessText.includes(
                "stiff"
            )
        );

    const soft =
        (
            stiffnessText.includes(
                "soft"
            ) &&
            !firm
        );

    const explicitArmFriendly =
        designProfile
            ?.arm_friendly;

    const armFriendly =
        explicitArmFriendly === true
            ? true
            : (
                explicitArmFriendly === false
                    ? false
                    : (
                        armFriendlinessScore !== null &&
                        armFriendlinessScore >= 8
                    )
            );

    const comfortOriented =
        naturalGut ||
        multifilament ||
        soft ||
        armFriendly ||
        (
            comfortScore !== null &&
            comfortScore >= 9
        );

    return {
        natural_gut:
            naturalGut,

        multifilament,

        polyester,

        firm,

        soft,

        arm_friendly:
            armFriendly,

        comfort_oriented:
            comfortOriented,

        comfort_score:
            comfortScore,

        arm_friendliness_score:
            armFriendlinessScore,

        stiffness_text:
            stiffnessText
    };
}


/**
 * ============================================================
 * Physical 球线限制
 * ============================================================
 */

function evaluateStringPhysicalCompatibility(
    stringCandidate,
    physicalConstraints
) {

    let scoreAdjustment = 0;

    const reasons = [];
    const riskFlags = [];

    if (
        physicalConstraints.length === 0
    ) {
        return {
            adjustment: 0,
            excluded: false,
            reasons,
            risk_flags:
                riskFlags
        };
    }


    const traits =
        getStructuredStringPhysicalTraits(
            stringCandidate
        );


    const hasModerateOrHigh =
        physicalConstraints.some(
            item =>
                item.severity === "moderate" ||
                item.severity === "high"
        );


    const hasHigh =
        physicalConstraints.some(
            item =>
                item.severity === "high"
        );


    const upperBodyRegions = [
        "arm",
        "elbow",
        "wrist",
        "shoulder",
        "neck"
    ];


    const hasUpperBodyConstraint =
        physicalConstraints.some(
            item =>
                upperBodyRegions.includes(
                    item.region
                )
        );


    if (
        hasUpperBodyConstraint
    ) {

        if (
            traits.comfort_oriented
        ) {
            scoreAdjustment += 8;

            reasons.push(
                "Comfort-oriented string construction supports active physical constraints."
            );
        }


        if (
            traits.polyester &&
            traits.firm
        ) {
            scoreAdjustment -=
                hasModerateOrHigh
                    ? 18
                    : 8;

            riskFlags.push(
                "Firm polyester may reduce comfort for upper-body sensitivity."
            );
        }


        if (
            traits.arm_friendliness_score !== null &&
            traits.arm_friendliness_score <= 6
        ) {
            scoreAdjustment -=
                hasModerateOrHigh
                    ? 8
                    : 4;

            riskFlags.push(
                "Low arm-friendliness rating reduces physical compatibility."
            );
        }


        if (
            traits.natural_gut
        ) {
            scoreAdjustment += 4;
        }


        if (
            traits.arm_friendly
        ) {
            scoreAdjustment += 3;
        }
    }


    if (
        hasHigh &&
        traits.polyester &&
        traits.firm &&
        traits.arm_friendly !== true
    ) {
        return {
            adjustment:
                -100,

            excluded:
                true,

            reasons,

            risk_flags: [
                ...riskFlags,
                "Excluded because firm polyester conflicts with high upper-body sensitivity."
            ]
        };
    }


    return {
        adjustment:
            scoreAdjustment,

        excluded:
            false,

        reasons,

        risk_flags:
            uniqueArray(
                riskFlags
            )
    };
}


/**
 * ============================================================
 * Physical 球拍限制
 * ============================================================
 */

function evaluateRacquetPhysicalCompatibility(
    racquetCandidate,
    physicalConstraints
) {

    let scoreAdjustment = 0;

    const reasons = [];
    const riskFlags = [];

    if (
        physicalConstraints.length === 0
    ) {
        return {
            adjustment: 0,
            excluded: false,
            reasons,
            risk_flags:
                riskFlags
        };
    }

    const weight =
        racquetCandidate.weight_g;

    const swingweight =
        racquetCandidate.swingweight;

    const stiffness =
        racquetCandidate.stiffness;

    for (
        const constraint
        of physicalConstraints
    ) {

        const severity =
            constraint.severity;

        const severe =
            severity === "high";

        const moderateOrHigh =
            severity === "moderate" ||
            severity === "high";

        switch (
            constraint.region
        ) {

            case "shoulder":
            case "neck":

                if (
                    swingweight !== null &&
                    swingweight > 330
                ) {
                    scoreAdjustment -=
                        moderateOrHigh
                            ? 15
                            : 7;

                    riskFlags.push(
                        "High swingweight may increase upper-body demand."
                    );
                }

                if (
                    weight !== null &&
                    weight >= 315
                ) {
                    scoreAdjustment -=
                        severe
                            ? 15
                            : 5;
                }

                break;


            case "wrist":

                if (
                    swingweight !== null &&
                    swingweight > 330
                ) {
                    scoreAdjustment -= 10;
                }

                if (
                    stiffness !== null &&
                    stiffness >= 70
                ) {
                    scoreAdjustment -=
                        moderateOrHigh
                            ? 10
                            : 4;
                }

                break;


            case "elbow":
            case "arm":

                if (
                    stiffness !== null &&
                    stiffness >= 70
                ) {
                    scoreAdjustment -=
                        severe
                            ? 18
                            : 8;

                    riskFlags.push(
                        "High frame stiffness may conflict with arm/elbow sensitivity."
                    );
                }

                break;


            case "lower_back":
            case "hip":

                if (
                    swingweight !== null &&
                    swingweight > 330
                ) {
                    scoreAdjustment -=
                        moderateOrHigh
                            ? 10
                            : 5;
                }

                break;


            case "knee":
            case "ankle":

                if (
                    racquetCandidate.head_size_sq_in !== null &&
                    racquetCandidate.head_size_sq_in < 98
                ) {
                    scoreAdjustment -=
                        moderateOrHigh
                            ? 8
                            : 3;
                }

                if (
                    swingweight !== null &&
                    swingweight > 330
                ) {
                    scoreAdjustment -= 5;
                }

                break;

            default:
                break;
        }
    }

    return {
        adjustment:
            scoreAdjustment,

        excluded: false,

        reasons,

        risk_flags:
            uniqueArray(
                riskFlags
            )
    };
}


/**
 * ============================================================
 * Swing Speed × 球拍重量
 * ============================================================
 */

function evaluateRacquetWeightFit(
    racquet,
    swingSpeed
) {

    if (
        racquet.weight_g === null ||
        !swingSpeed
    ) {
        return 0;
    }

    const weight =
        racquet.weight_g;

    if (
        swingSpeed === "slow"
    ) {

        if (
            weight >= 260 &&
            weight <= 295
        ) {
            return 6;
        }

        if (
            weight > 310
        ) {
            return -8;
        }
    }

    if (
        swingSpeed === "medium"
    ) {

        if (
            weight >= 285 &&
            weight <= 310
        ) {
            return 6;
        }

        if (
            weight > 320
        ) {
            return -5;
        }
    }

    if (
        swingSpeed === "fast"
    ) {

        if (
            weight >= 295 &&
            weight <= 325
        ) {
            return 6;
        }

        if (
            weight < 270
        ) {
            return -5;
        }
    }

    return 0;
}


/**
 * ============================================================
 * String Gauge × Swing Speed
 * ============================================================
 */

function evaluateStringGaugeFit(
    stringCandidate,
    playerProfile
) {

    const gauges =
        stringCandidate.gauges_mm;

    if (
        !Array.isArray(gauges) ||
        gauges.length === 0
    ) {
        return {
            adjustment: 0,
            recommended_gauge_mm:
                null
        };
    }

    const swing =
        playerProfile?.swing_speed?.overall;

    const breakFrequency =
        normalizeKey(
            playerProfile?.preferences
                ?.string_break_frequency
        );

    let targets;

    if (
        breakFrequency === "very_frequent" ||
        breakFrequency === "frequent"
    ) {
        targets = [
            1.25,
            1.30
        ];
    } else if (
        swing === "slow"
    ) {
        targets = [
            1.20,
            1.25
        ];
    } else if (
        swing === "fast"
    ) {
        targets = [
            1.25,
            1.30
        ];
    } else {
        targets = [
            1.23,
            1.25
        ];
    }

    let bestGauge = null;
    let bestDifference =
        Infinity;

    for (
        const gauge of gauges
    ) {

        for (
            const target of targets
        ) {

            const difference =
                Math.abs(
                    gauge -
                    target
                );

            if (
                difference <
                bestDifference
            ) {
                bestDifference =
                    difference;

                bestGauge =
                    gauge;
            }
        }
    }

    const adjustment =
        bestDifference <= 0.02
            ? 5
            : (
                bestDifference <= 0.05
                    ? 2
                    : 0
            );

    return {
        adjustment,
        recommended_gauge_mm:
            bestGauge
    };
}


/**
 * ============================================================
 * Feel Preference 辅助
 * ============================================================
 */

function evaluateFeelPreference(
    candidate,
    feelPreference
) {

    if (!feelPreference) {
        return 0;
    }

    const mapping = {

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
            "feedback",
            "predictable"
        ],

        crisp: [
            "crisp",
            "responsive",
            "response"
        ],

        firm: [
            "firm",
            "control",
            "stable"
        ],

        muted: [
            "muted",
            "damp",
            "shock absorption"
        ]
    };

    return keywordBonus(
        candidate,
        mapping[feelPreference] ?? [],
        1.5
    );
}


/**
 * ============================================================
 * Launch Preference 辅助
 * ============================================================
 */

function evaluateLaunchPreference(
    candidate,
    launchPreference
) {

    if (!launchPreference) {
        return 0;
    }

    const launch =
        readDna(
            candidate,
            "launch_angle"
        );

    if (
        launch === null
    ) {
        return 0;
    }

    const targets = {
        low: 3,
        medium_low: 4,
        medium: 6,
        medium_high: 8,
        high: 10
    };

    const target =
        targets[launchPreference];

    if (
        target === undefined
    ) {
        return 0;
    }

    const difference =
        Math.abs(
            launch - target
        );

    return Math.max(
        -4,
        5 - difference
    );
}


/**
 * ============================================================
 * 球拍单候选评分
 * ============================================================
 */

function scoreRacquet(
    racquet,
    playerProfile,
    physicalConstraints
) {

    let score =
        DEFAULT_BASE_SCORE;

    const reasons = [];
    const riskFlags = [];
    const scoreBreakdown = {};


    /**
     * Goal
     */

    const goal =
        playerProfile.primary_goal;

    if (
        goal &&
        GOAL_DNA[goal]
    ) {

        const result =
            calculateDnaMatch(
                racquet,
                GOAL_DNA[goal]
            );

        const adjustment =
            result.matched_fields > 0
                ? (
                    result.score - 5
                ) * 1.8
                : keywordBonus(
                    racquet,
                    goal
                        .replace(
                            "more_",
                            ""
                        )
                        .split("_"),
                    1.5
                );

        score += adjustment;

        scoreBreakdown.goal =
            adjustment;

        if (
            adjustment > 2
        ) {
            reasons.push(
                `Supports primary goal: ${goal}.`
            );
        }
    }


    /**
     * Playing Style
     */

    const playingStyle =
        playerProfile
            ?.playing_style
            ?.primary;

    if (
        playingStyle &&
        STYLE_DNA[playingStyle]
    ) {

        const result =
            calculateDnaMatch(
                racquet,
                STYLE_DNA[
                    playingStyle
                ]
            );

        const adjustment =
            result.matched_fields > 0
                ? (
                    result.score - 5
                ) * 1.2
                : 0;

        score += adjustment;

        scoreBreakdown
            .playing_style =
            adjustment;
    }


    /**
     * Swing Speed
     */

    const swingSpeed =
        playerProfile
            ?.swing_speed
            ?.overall;

    if (
        swingSpeed &&
        SWING_DNA[swingSpeed]
    ) {

        const result =
            calculateDnaMatch(
                racquet,
                SWING_DNA[
                    swingSpeed
                ]
            );

        const dnaAdjustment =
            result.matched_fields > 0
                ? (
                    result.score - 5
                )
                : 0;

        const weightAdjustment =
            evaluateRacquetWeightFit(
                racquet,
                swingSpeed
            );

        const totalAdjustment =
            dnaAdjustment +
            weightAdjustment;

        score +=
            totalAdjustment;

        scoreBreakdown.swing_speed =
            totalAdjustment;
    }


    /**
     * Feel Preference
     */

    const feelAdjustment =
        evaluateFeelPreference(
            racquet,
            playerProfile
                ?.preferences
                ?.feel
        );

    score +=
        feelAdjustment;

    scoreBreakdown.feel_preference =
        feelAdjustment;


    /**
     * Launch Preference
     */

    const launchAdjustment =
        evaluateLaunchPreference(
            racquet,
            playerProfile
                ?.preferences
                ?.launch_angle
        );

    score +=
        launchAdjustment;

    scoreBreakdown.launch_preference =
        launchAdjustment;


    /**
     * Physical
     */

    const physical =
        evaluateRacquetPhysicalCompatibility(
            racquet,
            physicalConstraints
        );

    score +=
        physical.adjustment;

    reasons.push(
        ...physical.reasons
    );

    riskFlags.push(
        ...physical.risk_flags
    );

    scoreBreakdown.physical =
        physical.adjustment;


    /**
     * Current Racquet 保留奖励
     *
     * 遵守“最小有效改动”原则。
     */

    const currentRacquetId =
        normalizeKey(
            playerProfile
                ?.current_setup
                ?.racquet
                ?.id
        );

    if (
        currentRacquetId &&
        racquet.id === currentRacquetId
    ) {
        score += 6;

        scoreBreakdown
            .current_setup_continuity =
            6;

        reasons.push(
            "Current racquet receives continuity bonus."
        );
    }


    return {
        excluded:
            physical.excluded,

        candidate: {
            candidate_type:
                "racquet",

            id:
                racquet.id,

            brand:
                racquet.brand,

            model:
                racquet.model,

            match_score:
                Math.round(
                    clamp(score)
                ),

            specifications: {
                weight_g:
                    racquet.weight_g,

                head_size_sq_in:
                    racquet.head_size_sq_in,

                swingweight:
                    racquet.swingweight,

                stiffness:
                    racquet.stiffness,

                string_pattern:
                    racquet.string_pattern,

                balance:
                    racquet.balance
            },

            product_data:
                racquet.raw,

            score_breakdown:
                scoreBreakdown,

            reasons:
                uniqueArray(
                    reasons
                ),

            risk_flags:
                uniqueArray(
                    riskFlags
                )
        }
    };
}


/**
 * ============================================================
 * 球线单候选评分
 * ============================================================
 */

function scoreString(
    stringCandidate,
    playerProfile,
    physicalConstraints
) {

    let score =
        DEFAULT_BASE_SCORE;

    const reasons = [];
    const riskFlags = [];
    const scoreBreakdown = {};


    /**
     * Goal
     */

    const goal =
        playerProfile.primary_goal;

    if (
        goal &&
        GOAL_DNA[goal]
    ) {

        const result =
            calculateDnaMatch(
                stringCandidate,
                GOAL_DNA[goal]
            );

        let adjustment;

        if (
            result.matched_fields > 0
        ) {
            adjustment =
                (
                    result.score - 5
                ) * 2;
        } else {

            const goalKeyword =
                goal.replace(
                    "more_",
                    ""
                );

            adjustment =
                keywordBonus(
                    stringCandidate,
                    [
                        goalKeyword
                    ],
                    2
                );
        }

        score += adjustment;

        scoreBreakdown.goal =
            adjustment;

        if (
            adjustment > 2
        ) {
            reasons.push(
                `Supports primary goal: ${goal}.`
            );
        }
    }


    /**
     * Playing Style
     */

    const playingStyle =
        playerProfile
            ?.playing_style
            ?.primary;

    if (
        playingStyle &&
        STYLE_DNA[playingStyle]
    ) {

        const result =
            calculateDnaMatch(
                stringCandidate,
                STYLE_DNA[
                    playingStyle
                ]
            );

        const adjustment =
            result.matched_fields > 0
                ? (
                    result.score - 5
                )
                : 0;

        score += adjustment;

        scoreBreakdown
            .playing_style =
            adjustment;
    }


    /**
     * Swing Speed
     */

    const swingSpeed =
        playerProfile
            ?.swing_speed
            ?.overall;

    if (
        swingSpeed &&
        SWING_DNA[swingSpeed]
    ) {

        const result =
            calculateDnaMatch(
                stringCandidate,
                SWING_DNA[
                    swingSpeed
                ]
            );

        let adjustment =
            result.matched_fields > 0
                ? (
                    result.score - 5
                )
                : 0;


        /**
         * 文字类别辅助
         */

        const text =
            stringCandidate.search_text;

        if (
            swingSpeed === "slow"
        ) {

            if (
                text.includes(
                    "multifilament"
                ) ||
                text.includes(
                    "natural gut"
                ) ||
                text.includes(
                    "soft"
                )
            ) {
                adjustment += 5;
            }

            if (
                text.includes(
                    "firm polyester"
                )
            ) {
                adjustment -= 7;
            }
        }


        if (
            swingSpeed === "fast"
        ) {

            if (
                text.includes(
                    "polyester"
                ) ||
                text.includes(
                    "control"
                ) ||
                text.includes(
                    "spin"
                )
            ) {
                adjustment += 4;
            }
        }


        score += adjustment;

        scoreBreakdown
            .swing_speed =
            adjustment;
    }


    /**
     * Gauge
     */

    const gaugeFit =
        evaluateStringGaugeFit(
            stringCandidate,
            playerProfile
        );

    score +=
        gaugeFit.adjustment;

    scoreBreakdown.gauge =
        gaugeFit.adjustment;


    /**
     * Feel
     */

    const feelAdjustment =
        evaluateFeelPreference(
            stringCandidate,
            playerProfile
                ?.preferences
                ?.feel
        );

    score +=
        feelAdjustment;

    scoreBreakdown.feel_preference =
        feelAdjustment;


    /**
     * Launch
     */

    const launchAdjustment =
        evaluateLaunchPreference(
            stringCandidate,
            playerProfile
                ?.preferences
                ?.launch_angle
        );

    score +=
        launchAdjustment;

    scoreBreakdown.launch_preference =
        launchAdjustment;


    /**
     * Physical
     */

    const physical =
        evaluateStringPhysicalCompatibility(
            stringCandidate,
            physicalConstraints
        );

    score +=
        physical.adjustment;

    reasons.push(
        ...physical.reasons
    );

    riskFlags.push(
        ...physical.risk_flags
    );

    scoreBreakdown.physical =
        physical.adjustment;


    /**
     * Current String 连续性奖励
     */

    const currentStringId =
        normalizeKey(
            playerProfile
                ?.current_setup
                ?.string
                ?.main
                ?.id
        );

    if (
        currentStringId &&
        stringCandidate.id ===
            currentStringId
    ) {

        score += 3;

        scoreBreakdown
            .current_setup_continuity =
            3;

        reasons.push(
            "Current string receives continuity bonus."
        );
    }


    return {
        excluded:
            physical.excluded,

        candidate: {
            candidate_type:
                "string",

            id:
                stringCandidate.id,

            brand:
                stringCandidate.brand,

            model:
                stringCandidate.model,

            match_score:
                Math.round(
                    clamp(score)
                ),

            recommended_gauge_mm:
                gaugeFit
                    .recommended_gauge_mm,

            material:
                stringCandidate.material,

            shape:
                stringCandidate.shape,

            /**
             * =================================================
             * Structured Product Data
             * =================================================
             *
             * Ranking Engine 需要真实产品属性，
             * 不能只依赖精简 candidate。
             *
             * 这些字段来自原始 Knowledge JSON，
             * 用于后续：
             *
             * - material family
             * - stiffness
             * - comfort
             * - arm friendliness
             * - performance traits
             *
             * =================================================
             */

            product_data: {
                category:
                    stringCandidate.category ??
                    null,

                material:
                    stringCandidate.material ??
                    null,

                string_family:
                    stringCandidate.string_family ??
                    null,

                specifications:
                    stringCandidate.specifications ??
                    null,

                design_profile:
                    stringCandidate.design_profile ??
                    null,

                ai_rating:
                    stringCandidate.ai_rating ??
                    null,

                performance_profile:
                    stringCandidate.performance_profile ??
                    null
            },

            score_breakdown:
                scoreBreakdown,

            reasons:
                uniqueArray(
                    reasons
                ),

            risk_flags:
                uniqueArray(
                    riskFlags
                )
        }
    };
}


/**
 * ============================================================
 * Candidate 排序
 *
 * 注意：
 * 这里只是 Matching 层内部，
 * 为了截取候选数量。
 *
 * 真正最终排序仍由 ranking_engine.js 完成。
 * ============================================================
 */

function sortByMatchScore(
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
 * 加载并验证 Knowledge
 * ============================================================
 */

async function loadMatchingKnowledge() {

    const [
        rawRacquets,
        rawStrings
    ] = await Promise.all([
        loadKnowledgeDirectory(
            "racquets"
        ),

        loadKnowledgeDirectory(
            "strings"
        )
    ]);


    const racquets = [];

    const strings = [];


    /**
     * Racquets
     */

    for (
        const record
        of rawRacquets
    ) {

        const raw =
            record?.data ??
            record;

        const validation =
            validateRacquetRecord(
                raw
            );

        if (
            !validation.valid
        ) {
            continue;
        }

        racquets.push(
            extractRacquetData(
                raw
            )
        );
    }


    /**
     * Strings
     */

    for (
        const record
        of rawStrings
    ) {

        const raw =
            record?.data ??
            record;

        const validation =
            validateStringRecord(
                raw
            );

        if (
            !validation.valid
        ) {
            continue;
        }

        strings.push(
            extractStringData(
                raw
            )
        );
    }


    return {
        racquets,
        strings,

        source_counts: {
            raw_racquets:
                rawRacquets.length,

            usable_racquets:
                racquets.length,

            raw_strings:
                rawStrings.length,

            usable_strings:
                strings.length
        }
    };
}


/**
 * ============================================================
 * Preserve Current Equipment Candidate
 *
 * Recommendation Quality V1:
 *
 * Preserve the player's current product after Top-N
 * truncation when that product remains otherwise eligible.
 *
 * This does NOT:
 * - restore physically excluded products
 * - modify candidate scores
 * - modify configured Top-N limits
 *
 * It may add at most one candidate beyond the normal limit.
 * ============================================================
 */

function preserveCurrentCandidate(
    limitedCandidates,
    allEligibleCandidates,
    currentProductId
) {

    if (
        !Array.isArray(
            limitedCandidates
        ) ||
        !Array.isArray(
            allEligibleCandidates
        ) ||
        !currentProductId
    ) {
        return limitedCandidates;
    }


    const normalizedCurrentId =
        normalizeKey(
            currentProductId
        );


    const alreadyPresent =
        limitedCandidates.some(
            candidate =>
                normalizeKey(
                    candidate?.id
                ) ===
                normalizedCurrentId
        );


    if (
        alreadyPresent
    ) {
        return limitedCandidates;
    }


    const currentCandidate =
        allEligibleCandidates.find(
            candidate =>
                normalizeKey(
                    candidate?.id
                ) ===
                normalizedCurrentId
        );


    if (
        !currentCandidate
    ) {
        return limitedCandidates;
    }


    return [
        ...limitedCandidates,
        currentCandidate
    ];
}


/**
 * ============================================================
 * Main Matching Engine
 * ============================================================
 */

export async function runMatchingEngine(
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
            "EveryCourtAI Matching Engine: invalid player profile."
        );
    }


    /**
     * ----------------------------------
     * STEP 2
     * Load Knowledge
     * ----------------------------------
     */

    const knowledge =
        await loadMatchingKnowledge();


    /**
     * ----------------------------------
     * STEP 3
     * Physical Constraints
     * ----------------------------------
     */

    const physicalConstraints =
        getActivePhysicalConstraints(
            playerProfile
        );


    /**
     * ----------------------------------
     * STEP 4
     * Score Racquets
     * ----------------------------------
     */

    const racquetCandidates = [];

    let racquetsExcluded = 0;

    for (
        const racquet
        of knowledge.racquets
    ) {

        const result =
            scoreRacquet(
                racquet,
                playerProfile,
                physicalConstraints
            );

        if (
            result.excluded
        ) {
            racquetsExcluded += 1;
            continue;
        }

        racquetCandidates.push(
            result.candidate
        );
    }


    /**
     * ----------------------------------
     * STEP 5
     * Score Strings
     * ----------------------------------
     */

    const stringCandidates = [];

    let stringsExcluded = 0;

    for (
        const stringCandidate
        of knowledge.strings
    ) {

        const result =
            scoreString(
                stringCandidate,
                playerProfile,
                physicalConstraints
            );

        if (
            result.excluded
        ) {
            stringsExcluded += 1;
            continue;
        }

        stringCandidates.push(
            result.candidate
        );
    }


    /**
     * ----------------------------------
     * STEP 6
     * Candidate Limit
     * ----------------------------------
     */

    const rankedRacquets =
        sortByMatchScore(
            racquetCandidates
        );


    const rankedStrings =
        sortByMatchScore(
            stringCandidates
        );


    const limitedRacquets =
        rankedRacquets
            .slice(
                0,
                RACQUET_CANDIDATE_LIMIT
            );


    const limitedStrings =
        rankedStrings
            .slice(
                0,
                STRING_CANDIDATE_LIMIT
            );


    const topRacquets =
        preserveCurrentCandidate(
            limitedRacquets,
            rankedRacquets,
            playerProfile
                ?.current_setup
                ?.racquet
                ?.id
        );


    const topStrings =
        preserveCurrentCandidate(
            limitedStrings,
            rankedStrings,
            playerProfile
                ?.current_setup
                ?.string
                ?.main
                ?.id
        );


    /**
     * ----------------------------------
     * STEP 7
     * Output
     * ----------------------------------
     */

    return {

        engine:
            "matching_engine",

        version:
            ENGINE_VERSION,

        generated_at:
            new Date()
                .toISOString(),

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

            feel_preference:
                playerProfile
                    ?.preferences
                    ?.feel ??
                null,

            launch_preference:
                playerProfile
                    ?.preferences
                    ?.launch_angle ??
                null,

            physical_constraints:
                physicalConstraints
        },

        source_counts:
            knowledge.source_counts,

        filtering: {
            racquets_excluded:
                racquetsExcluded,

            strings_excluded:
                stringsExcluded
        },

        candidate_counts: {
            racquets:
                topRacquets.length,

            strings:
                topStrings.length
        },

        racquets:
            topRacquets,

        strings:
            topStrings
    };
}


/**
 * ============================================================
 * Optional Exports
 *
 * 后面测试时可以单独调用。
 * ============================================================
 */

export const matchingHelpers = {

    extractRacquetData,

    extractStringData,

    calculateDnaMatch,

    evaluateRacquetWeightFit,

    evaluateStringGaugeFit,

    evaluateRacquetPhysicalCompatibility,

    evaluateStringPhysicalCompatibility
};
