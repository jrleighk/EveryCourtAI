/**
 * ============================================================
 * EveryCourtAI
 * Product Normalizer
 * Version: 1.0
 * ============================================================
 *
 * File:
 * engine/product_normalizer.js
 *
 * Purpose:
 *
 * Convert heterogeneous raw racquet / string knowledge records
 * into the canonical ECL Product DNA V1 contract.
 *
 * Principles:
 *
 * 1. Never invent missing data.
 * 2. Missing values become null.
 * 3. Approximate numeric values may be normalized, but warnings
 *    are preserved.
 * 4. Original extended traits are preserved.
 * 5. Racquet and string normalization remain deterministic.
 *
 * ============================================================
 */


const NORMALIZER_VERSION =
    "1.1";


/**
 * ============================================================
 * Generic Helpers
 * ============================================================
 */

function isPlainObject(
    value
) {
    return Boolean(
        value &&
        typeof value === "object" &&
        !Array.isArray(value)
    );
}


function safeString(
    value
) {
    if (
        value === null ||
        value === undefined
    ) {
        return null;
    }

    const clean =
        String(value)
            .trim();

    return clean
        ? clean
        : null;
}


function safeNumber(
    value
) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return null;
    }

    if (
        typeof value === "number"
    ) {
        return Number.isFinite(value)
            ? value
            : null;
    }

    const clean =
        String(value)
            .trim();

    if (!clean) {
        return null;
    }

    const match =
        clean.match(
            /-?\d+(?:\.\d+)?/
        );

    if (!match) {
        return null;
    }

    const parsed =
        Number(match[0]);

    return Number.isFinite(parsed)
        ? parsed
        : null;
}


function safeInteger(
    value
) {
    const number =
        safeNumber(value);

    if (
        number === null
    ) {
        return null;
    }

    return Number.isInteger(number)
        ? number
        : Math.round(number);
}


function safeBoolean(
    value
) {
    if (
        typeof value === "boolean"
    ) {
        return value;
    }

    return null;
}


function getObjectValue(
    value
) {
    if (
        isPlainObject(value) &&
        Object.prototype.hasOwnProperty.call(
            value,
            "value"
        )
    ) {
        return value.value;
    }

    return value;
}


function normalizeNumericField(
    value
) {
    return safeNumber(
        getObjectValue(
            value
        )
    );
}


function normalizeStringField(
    value
) {
    const raw =
        getObjectValue(
            value
        );

    return safeString(
        raw
    );
}


function normalizeRating(
    value
) {
    let raw =
        value;

    if (
        isPlainObject(value)
    ) {
        raw =
            value.rating ??
            value.value ??
            null;
    }

    const number =
        safeNumber(raw);

    if (
        number === null
    ) {
        return null;
    }

    if (
        number < 0 ||
        number > 10
    ) {
        return null;
    }

    return number;
}


function calculateCompleteness(
    object
) {
    if (
        !isPlainObject(object)
    ) {
        return 0;
    }

    const values =
        Object.values(
            object
        );

    if (
        values.length === 0
    ) {
        return 0;
    }

    let populated = 0;

    for (
        const value
        of values
    ) {
        if (
            Array.isArray(value)
        ) {
            if (
                value.length > 0
            ) {
                populated += 1;
            }

            continue;
        }

        if (
            value !== null &&
            value !== undefined &&
            value !== ""
        ) {
            populated += 1;
        }
    }

    return Number(
        (
            populated /
            values.length
        ).toFixed(4)
    );
}


/**
 * ============================================================
 * Release Year
 * ============================================================
 */

function normalizeReleaseYear(
    raw
) {
    const candidates = [
        raw?.release_year,
        raw?.year,
        raw?.model_year
    ];

    for (
        const candidate
        of candidates
    ) {
        const year =
            safeInteger(
                candidate
            );

        if (
            year !== null &&
            year >= 1900 &&
            year <= 2100
        ) {
            return year;
        }
    }

    return null;
}


/**
 * ============================================================
 * Approximation Detection
 * ============================================================
 */

function looksApproximate(
    value
) {
    if (
        typeof value !== "string"
    ) {
        return false;
    }

    const normalized =
        value
            .toLowerCase();

    return (
        normalized.includes("around") ||
        normalized.includes("approx") ||
        normalized.includes("approximately") ||
        normalized.includes("about") ||
        normalized.includes("~") ||
        normalized.includes("约")
    );
}


function collectApproximationWarning(
    warnings,
    field,
    rawValue
) {
    const value =
        getObjectValue(
            rawValue
        );

    if (
        looksApproximate(value)
    ) {
        warnings.push(
            `${field}: approximate source value "${value}"`
        );
    }
}


/**
 * ============================================================
 * Gauge Normalization
 * ============================================================
 */

function normalizeGaugeValue(
    value
) {
    if (
        typeof value === "number"
    ) {
        return (
            value >= 0.8 &&
            value <= 2.0
        )
            ? value
            : null;
    }

    if (
        isPlainObject(value)
    ) {
        return normalizeGaugeValue(
            value.gauge_mm ??
            value.mm ??
            value.value ??
            null
        );
    }

    const number =
        safeNumber(value);

    if (
        number === null
    ) {
        return null;
    }

    return (
        number >= 0.8 &&
        number <= 2.0
    )
        ? number
        : null;
}


function normalizeAvailableGauges(
    raw
) {
    const collections = [
        raw?.specifications
            ?.available_gauges,

        raw?.available_gauges,

        raw?.manufacturer_data
            ?.available_gauges
    ];

    const gauges = [];

    for (
        const collection
        of collections
    ) {
        if (
            !Array.isArray(
                collection
            )
        ) {
            continue;
        }

        for (
            const item
            of collection
        ) {
            const gauge =
                normalizeGaugeValue(
                    item
                );

            if (
                gauge !== null
            ) {
                gauges.push(
                    gauge
                );
            }
        }
    }

    const directCandidates = [
        raw?.gauge_mm,
        raw?.specifications
            ?.gauge_mm
    ];

    for (
        const candidate
        of directCandidates
    ) {
        const gauge =
            normalizeGaugeValue(
                candidate
            );

        if (
            gauge !== null
        ) {
            gauges.push(
                gauge
            );
        }
    }

    return [
        ...new Set(
            gauges
        )
    ].sort(
        (a, b) =>
            a - b
    );
}


/**
 * ============================================================
 * Racquet Helpers
 * ============================================================
 */

function getRacquetBalanceUnstrung(
    raw
) {
    return normalizeNumericField(
        raw?.specifications
            ?.balance_unstrung ??
        raw?.specifications
            ?.balance_mm_unstrung ??
        raw?.specifications
            ?.balance
    );
}


function getRacquetBalanceStrung(
    raw
) {
    return normalizeNumericField(
        raw?.specifications
            ?.balance_strung ??
        raw?.specifications
            ?.balance_mm_strung
    );
}


function getRacquetSwingweight(
    raw
) {
    return normalizeNumericField(
        raw?.specifications
            ?.swingweight_unstrung ??
        raw?.specifications
            ?.swing_weight_unstrung ??
        raw?.specifications
            ?.swingweight_strung ??
        raw?.specifications
            ?.swing_weight_strung ??
        raw?.specifications
            ?.swing_weight ??
        raw?.specifications
            ?.swingweight
    );
}


function getRacquetSwingweightBasis(
    raw
) {

    const explicitBasis =
        raw?.verification
            ?.swingweight_basis;

    if (
        explicitBasis === "strung" ||
        explicitBasis === "unstrung" ||
        explicitBasis === "unknown"
    ) {
        return explicitBasis;
    }


    const specifications =
        raw?.specifications ??
        {};


    if (
        specifications
            ?.swingweight_unstrung !==
            undefined ||
        specifications
            ?.swing_weight_unstrung !==
            undefined
    ) {

        return "unstrung";
    }


    if (
        specifications
            ?.swingweight_strung !==
            undefined ||
        specifications
            ?.swing_weight_strung !==
            undefined
    ) {

        return "strung";
    }


    if (
        specifications
            ?.swing_weight !==
            undefined ||
        specifications
            ?.swingweight !==
            undefined
    ) {

        return "unknown";
    }


    return null;
}


function getRacquetStiffness(
    raw
) {
    return normalizeNumericField(
        raw?.specifications
            ?.stiffness_ra ??
        raw?.specifications
            ?.stiffness
    );
}


/**
 * ============================================================
 * Racquet Normalization
 * ============================================================
 */

export function normalizeRacquetRecord(
    raw = {},
    options = {}
) {
    const warnings = [];

    const specifications = {
        head_size_sq_in:
            normalizeNumericField(
                raw?.specifications
                    ?.head_size_sq_in ??
                raw?.specifications
                    ?.head_size
            ),

        weight_unstrung_g:
            normalizeNumericField(
                raw?.specifications
                    ?.weight_unstrung ??
                raw?.specifications
                    ?.weight_g_unstrung ??
                raw?.specifications
                    ?.weight_g
            ),

        weight_strung_g:
            normalizeNumericField(
                raw?.specifications
                    ?.weight_strung ??
                raw?.specifications
                    ?.weight_g_strung
            ),

        balance_unstrung_mm:
            getRacquetBalanceUnstrung(
                raw
            ),

        balance_strung_mm:
            getRacquetBalanceStrung(
                raw
            ),

        length_in:
            normalizeNumericField(
                raw?.specifications
                    ?.length_in ??
                raw?.specifications
                    ?.length
            ),

        string_pattern:
            normalizeStringField(
                raw?.specifications
                    ?.string_pattern
            ),

        swingweight:
            getRacquetSwingweight(
                raw
            ),

        swingweight_basis:
            getRacquetSwingweightBasis(
                raw
            ),

        stiffness_ra:
            getRacquetStiffness(
                raw
            ),

        beam_mm:
            normalizeStringField(
                raw?.specifications
                    ?.beam_mm ??
                raw?.specifications
                    ?.beam
            )
    };


    collectApproximationWarning(
        warnings,
        "swingweight",
        raw?.specifications
            ?.swing_weight ??
        raw?.specifications
            ?.swingweight
    );


    collectApproximationWarning(
        warnings,
        "stiffness_ra",
        raw?.specifications
            ?.stiffness
    );


    const performance =
        isPlainObject(
            raw?.performance
        )
            ? raw.performance
            : (
                isPlainObject(
                    raw?.playing_characteristics
                )
                    ? raw.playing_characteristics
                    : {}
            );


    const coreDna = {
        power:
            normalizeRating(
                performance.power
            ),

        control:
            normalizeRating(
                performance.control
            ),

        spin:
            normalizeRating(
                performance.spin
            ),

        comfort:
            normalizeRating(
                performance.comfort
            ),

        stability:
            normalizeRating(
                performance.stability
            ),

        maneuverability:
            normalizeRating(
                performance.maneuverability
            ),

        forgiveness:
            normalizeRating(
                performance.forgiveness
            )
    };


    const knownPerformanceKeys =
        new Set([
            "power",
            "control",
            "spin",
            "comfort",
            "stability",
            "maneuverability",
            "forgiveness"
        ]);


    const extendedTraits = {};

    for (
        const [
            key,
            value
        ]
        of Object.entries(
            performance
        )
    ) {
        if (
            knownPerformanceKeys.has(
                key
            )
        ) {
            continue;
        }

        extendedTraits[key] =
            value;
    }


    return {
        schema_version:
            "1.0",

        product_type:
            "racquet",

        id:
            safeString(
                raw?.id
            ) ??
            "",

        identity: {
            brand:
                safeString(
                    raw?.brand
                ),

            model:
                safeString(
                    raw?.model
                ),

            release_year:
                normalizeReleaseYear(
                    raw
                )
        },

        specifications,

        core_dna:
            coreDna,

        extended_traits:
            extendedTraits,

        data_quality: {
            specification_completeness:
                calculateCompleteness(
                    specifications
                ),

            performance_completeness:
                calculateCompleteness(
                    coreDna
                ),

            source_file:
                safeString(
                    options?.source_file
                ),

            warnings
        }
    };
}


/**
 * ============================================================
 * String Normalization
 * ============================================================
 */

export function normalizeStringRecord(
    raw = {},
    options = {}
) {
    const warnings = [];

    const aiRating =
        isPlainObject(
            raw?.ai_rating
        )
            ? raw.ai_rating
            : {};


    const performanceProfile =
        isPlainObject(
            raw?.performance_profile
        )
            ? raw.performance_profile
            : {};


    const designProfile =
        isPlainObject(
            raw?.design_profile
        )
            ? raw.design_profile
            : {};


    const specifications = {
        material:
            normalizeStringField(
                raw?.specifications
                    ?.material ??
                raw?.string_type
            ),

        available_gauges_mm:
            normalizeAvailableGauges(
                raw
            )
    };


    const coreDna = {
        power:
            normalizeRating(
                aiRating.power
            ),

        control:
            normalizeRating(
                aiRating.control
            ),

        spin:
            normalizeRating(
                aiRating.spin
            ),

        comfort:
            normalizeRating(
                aiRating.comfort
            ),

        feel:
            normalizeRating(
                aiRating.feel
            ),

        durability:
            normalizeRating(
                aiRating.durability
            ),

        tension_maintenance:
            normalizeRating(
                aiRating
                    .tension_maintenance
            )
    };


    const advancedDna = {
        string_stiffness:
            safeString(
                performanceProfile
                    .string_stiffness
            ),

        snapback:
            normalizeRating(
                performanceProfile
                    .snapback
            ),

        ball_pocketing:
            normalizeRating(
                performanceProfile
                    .ball_pocketing
            ),

        tension_stability:
            normalizeRating(
                performanceProfile
                    .tension_stability
            ),

        predictability:
            normalizeRating(
                performanceProfile
                    .predictability
            ),

        string_movement:
            normalizeRating(
                performanceProfile
                    .string_movement
            ),

        arm_friendliness:
            normalizeRating(
                performanceProfile
                    .arm_friendliness
            ),

        spin_window:
            safeString(
                performanceProfile
                    .spin_window
            ),

        directional_precision:
            normalizeRating(
                performanceProfile
                    .directional_precision
            )
    };


    const designDna = {
        string_type:
            safeString(
                designProfile
                    .string_type
            ),

        target_player:
            safeString(
                designProfile
                    .target_player
            ),

        arm_friendly:
            safeBoolean(
                designProfile
                    .arm_friendly
            ),

        spin_focus:
            safeBoolean(
                designProfile
                    .spin_focus
            ),

        control_focus:
            safeBoolean(
                designProfile
                    .control_focus
            ),

        power_focus:
            safeBoolean(
                designProfile
                    .power_focus
            ),

        comfort_focus:
            safeBoolean(
                designProfile
                    .comfort_focus
            ),

        durability_focus:
            safeBoolean(
                designProfile
                    .durability_focus
            ),

        feel_focus:
            safeBoolean(
                designProfile
                    .feel_focus
            ),

        tension_stability_focus:
            safeBoolean(
                designProfile
                    .tension_stability_focus
            ),

        response_focus:
            safeBoolean(
                designProfile
                    .response_focus
            )
    };


    const knownAdvancedKeys =
        new Set([
            "string_stiffness",
            "snapback",
            "ball_pocketing",
            "tension_stability",
            "predictability",
            "string_movement",
            "arm_friendliness",
            "spin_window",
            "directional_precision"
        ]);


    const extendedTraits = {};

    for (
        const [
            key,
            value
        ]
        of Object.entries(
            performanceProfile
        )
    ) {
        if (
            knownAdvancedKeys.has(
                key
            )
        ) {
            continue;
        }

        extendedTraits[key] =
            value;
    }


    return {
        schema_version:
            "1.0",

        product_type:
            "string",

        id:
            safeString(
                raw?.id
            ) ??
            "",

        identity: {
            brand:
                safeString(
                    raw?.brand
                ),

            model:
                safeString(
                    raw?.model
                ),

            release_year:
                normalizeReleaseYear(
                    raw
                )
        },

        specifications,

        core_dna:
            coreDna,

        advanced_dna:
            advancedDna,

        design_dna:
            designDna,

        extended_traits:
            extendedTraits,

        data_quality: {
            specification_completeness:
                calculateCompleteness(
                    specifications
                ),

            core_dna_completeness:
                calculateCompleteness(
                    coreDna
                ),

            advanced_dna_completeness:
                calculateCompleteness(
                    advancedDna
                ),

            design_dna_completeness:
                calculateCompleteness(
                    designDna
                ),

            source_file:
                safeString(
                    options?.source_file
                ),

            warnings
        }
    };
}


/**
 * ============================================================
 * Generic Product Normalization
 * ============================================================
 */

export function normalizeProductRecord(
    raw = {},
    productType = null,
    options = {}
) {
    const normalizedType =
        safeString(
            productType ??
            raw?.product_type
        )
            ?.toLowerCase();


    if (
        normalizedType ===
        "racquet"
    ) {
        return normalizeRacquetRecord(
            raw,
            options
        );
    }


    if (
        normalizedType ===
        "string"
    ) {
        return normalizeStringRecord(
            raw,
            options
        );
    }


    throw new Error(
        `EveryCourtAI Product Normalizer: unsupported product type "${normalizedType ?? "unknown"}".`
    );
}


/**
 * ============================================================
 * Engine Info
 * ============================================================
 */

export function getProductNormalizerInfo() {
    return {
        name:
            "EveryCourtAI Product Normalizer",

        version:
            NORMALIZER_VERSION,

        schema_version:
            "1.0",

        supported_product_types: [
            "racquet",
            "string"
        ]
    };
}


export default normalizeProductRecord;
