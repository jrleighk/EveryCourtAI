/**
 * ============================================================
 * EveryCourtAI
 * Validator Utility
 * Version: 1.0
 * ============================================================
 * Purpose:
 * Shared validation helpers for EveryCourtAI.
 *
 * Responsibilities:
 * 1. Validate common JavaScript values
 * 2. Validate player profiles
 * 3. Validate racquet JSON records
 * 4. Validate string JSON records
 * 5. Validate recommendation candidates
 * 6. Return structured errors and warnings
 *
 * Important:
 * This utility validates structure and basic data quality.
 * It does NOT make recommendation decisions.
 * ============================================================
 */

/**
 * ============================================================
 * Generic Helpers
 * ============================================================
 */

function isObject(value) {
    return (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
    );
}

function isNonEmptyString(value) {
    return (
        typeof value === "string" &&
        value.trim().length > 0
    );
}

function isFiniteNumber(value) {
    return (
        typeof value === "number" &&
        Number.isFinite(value)
    );
}

function isBoolean(value) {
    return typeof value === "boolean";
}

function isArray(value) {
    return Array.isArray(value);
}

function isNumberInRange(
    value,
    minimum,
    maximum
) {
    return (
        isFiniteNumber(value) &&
        value >= minimum &&
        value <= maximum
    );
}

function normalizeValidationResult(
    errors = [],
    warnings = [],
    metadata = {}
) {
    return {
        valid: errors.length === 0,
        errors,
        warnings,
        metadata
    };
}

/**
 * ============================================================
 * Required Field Helpers
 * ============================================================
 */

function requireObject(
    object,
    field,
    errors,
    label = field
) {
    if (!isObject(object?.[field])) {
        errors.push(
            `${label} must be an object.`
        );

        return false;
    }

    return true;
}

function requireString(
    object,
    field,
    errors,
    label = field
) {
    if (!isNonEmptyString(object?.[field])) {
        errors.push(
            `${label} must be a non-empty string.`
        );

        return false;
    }

    return true;
}

function optionalNumber(
    value,
    warnings,
    label
) {
    if (
        value !== null &&
        value !== undefined &&
        !isFiniteNumber(value)
    ) {
        warnings.push(
            `${label} should be a number when provided.`
        );

        return false;
    }

    return true;
}

/**
 * ============================================================
 * Player Profile Validator
 * ============================================================
 */

export function validatePlayerProfile(
    profile
) {
    const errors = [];
    const warnings = [];

    if (!isObject(profile)) {
        return normalizeValidationResult(
            [
                "Player profile must be an object."
            ]
        );
    }

    if (
        !isNonEmptyString(
            profile.primary_goal
        )
    ) {
        warnings.push(
            "Primary goal is missing."
        );
    }

    if (
        !isObject(
            profile.playing_style
        )
    ) {
        warnings.push(
            "Playing style object is missing."
        );
    } else if (
        !isNonEmptyString(
            profile.playing_style.primary
        )
    ) {
        warnings.push(
            "Primary playing style is missing."
        );
    }

    if (
        !isObject(
            profile.swing_speed
        )
    ) {
        warnings.push(
            "Swing speed object is missing."
        );
    } else if (
        !isNonEmptyString(
            profile.swing_speed.overall
        )
    ) {
        warnings.push(
            "Overall swing speed is missing."
        );
    }

    if (
        !isObject(
            profile.current_setup
        )
    ) {
        warnings.push(
            "Current setup is missing."
        );
    } else {
        const racquet =
            profile.current_setup.racquet;

        if (
            !isObject(racquet)
        ) {
            warnings.push(
                "Current racquet information is missing."
            );
        } else if (
            !isNonEmptyString(
                racquet.id
            ) &&
            !isNonEmptyString(
                racquet.model
            )
        ) {
            warnings.push(
                "Current racquet ID or model is missing."
            );
        }

        const stringSetup =
            profile.current_setup.string;

        if (
            !isObject(stringSetup)
        ) {
            warnings.push(
                "Current string setup is missing."
            );
        }
    }

    if (
        profile.physical !== undefined &&
        !isObject(profile.physical)
    ) {
        errors.push(
            "Physical profile must be an object."
        );
    }

    if (
        profile.preferences !== undefined &&
        !isObject(profile.preferences)
    ) {
        errors.push(
            "Preferences must be an object."
        );
    }

    if (
        profile.metadata !== undefined &&
        !isObject(profile.metadata)
    ) {
        warnings.push(
            "Player metadata should be an object."
        );
    }

    return normalizeValidationResult(
        errors,
        warnings,
        {
            type: "player_profile"
        }
    );
}

/**
 * ============================================================
 * Racquet Record Validator
 * ============================================================
 */

export function validateRacquetRecord(
    racquet
) {
    const errors = [];
    const warnings = [];

    if (!isObject(racquet)) {
        return normalizeValidationResult(
            [
                "Racquet record must be an object."
            ]
        );
    }

    requireString(
        racquet,
        "id",
        errors,
        "Racquet id"
    );

    const brand =
        racquet.brand ??
        racquet.manufacturer;

    if (
        !isNonEmptyString(brand)
    ) {
        warnings.push(
            "Racquet brand is missing."
        );
    }

    const model =
        racquet.model ??
        racquet.name;

    if (
        !isNonEmptyString(model)
    ) {
        warnings.push(
            "Racquet model/name is missing."
        );
    }

    const headSize =
        racquet.head_size_sq_in ??
        racquet.head_size ??
        racquet.specs?.head_size_sq_in ??
        racquet.specs?.head_size;

    if (
        headSize !== null &&
        headSize !== undefined &&
        !isFiniteNumber(headSize) &&
        !isNonEmptyString(headSize)
    ) {
        warnings.push(
            "Racquet head size has an unsupported format."
        );
    }

    const weight =
        racquet.weight_g ??
        racquet.unstrung_weight_g ??
        racquet.specs?.weight_g ??
        racquet.specs?.unstrung_weight_g;

    if (
        weight !== null &&
        weight !== undefined &&
        !isFiniteNumber(weight)
    ) {
        warnings.push(
            "Racquet weight should be numeric."
        );
    }

    const swingweight =
        racquet.swingweight ??
        racquet.swing_weight ??
        racquet.specs?.swingweight;

    optionalNumber(
        swingweight,
        warnings,
        "Racquet swingweight"
    );

    const stiffness =
        racquet.stiffness ??
        racquet.ra ??
        racquet.specs?.stiffness ??
        racquet.specs?.ra;

    if (
        stiffness !== null &&
        stiffness !== undefined &&
        !isFiniteNumber(stiffness) &&
        !isNonEmptyString(stiffness)
    ) {
        warnings.push(
            "Racquet stiffness has an unsupported format."
        );
    }

    return normalizeValidationResult(
        errors,
        warnings,
        {
            type: "racquet",
            id:
                racquet.id ??
                null
        }
    );
}

/**
 * ============================================================
 * String Record Validator
 * ============================================================
 */

export function validateStringRecord(
    stringRecord
) {
    const errors = [];
    const warnings = [];

    if (!isObject(stringRecord)) {
        return normalizeValidationResult(
            [
                "String record must be an object."
            ]
        );
    }

    requireString(
        stringRecord,
        "id",
        errors,
        "String id"
    );

    const brand =
        stringRecord.brand ??
        stringRecord.manufacturer;

    if (
        !isNonEmptyString(brand)
    ) {
        warnings.push(
            "String brand is missing."
        );
    }

    const model =
        stringRecord.model ??
        stringRecord.name;

    if (
        !isNonEmptyString(model)
    ) {
        warnings.push(
            "String model/name is missing."
        );
    }

    const material =
        stringRecord.material ??
        stringRecord.type ??
        stringRecord.string_type;

    if (
        material !== null &&
        material !== undefined &&
        !isNonEmptyString(material) &&
        !isArray(material)
    ) {
        warnings.push(
            "String material/type has an unsupported format."
        );
    }

    const gauge =
        stringRecord.gauge_mm ??
        stringRecord.gauge ??
        stringRecord.specs?.gauge_mm;

    if (
        gauge !== null &&
        gauge !== undefined &&
        !isFiniteNumber(gauge) &&
        !isArray(gauge) &&
        !isNonEmptyString(gauge)
    ) {
        warnings.push(
            "String gauge has an unsupported format."
        );
    }

    return normalizeValidationResult(
        errors,
        warnings,
        {
            type: "string",
            id:
                stringRecord.id ??
                null
        }
    );
}

/**
 * ============================================================
 * Candidate Validator
 * ============================================================
 */

export function validateRecommendationCandidate(
    candidate
) {
    const errors = [];
    const warnings = [];

    if (!isObject(candidate)) {
        return normalizeValidationResult(
            [
                "Recommendation candidate must be an object."
            ]
        );
    }

    if (
        !isNonEmptyString(
            candidate.id
        ) &&
        !isNonEmptyString(
            candidate.candidate_id
        ) &&
        !isNonEmptyString(
            candidate.string_id
        ) &&
        !isNonEmptyString(
            candidate.racquet_id
        )
    ) {
        errors.push(
            "Candidate must contain an identifiable ID."
        );
    }

    const score =
        candidate.match_score ??
        candidate.score ??
        candidate.overall_score;

    if (
        score !== null &&
        score !== undefined &&
        !isNumberInRange(
            score,
            0,
            100
        )
    ) {
        warnings.push(
            "Candidate score should be between 0 and 100."
        );
    }

    if (
        candidate.tradeoffs !== undefined &&
        !isArray(
            candidate.tradeoffs
        )
    ) {
        warnings.push(
            "Candidate tradeoffs should be an array."
        );
    }

    if (
        candidate.risk_flags !== undefined &&
        !isArray(
            candidate.risk_flags
        )
    ) {
        warnings.push(
            "Candidate risk_flags should be an array."
        );
    }

    return normalizeValidationResult(
        errors,
        warnings,
        {
            type: "recommendation_candidate"
        }
    );
}

/**
 * ============================================================
 * Engine Output Validator
 * ============================================================
 */

export function validateEngineOutput(
    output
) {
    const errors = [];
    const warnings = [];

    if (!isObject(output)) {
        return normalizeValidationResult(
            [
                "Engine output must be an object."
            ]
        );
    }

    if (
        output.success !== undefined &&
        !isBoolean(
            output.success
        )
    ) {
        errors.push(
            "Engine output success must be boolean."
        );
    }

    if (
        output.candidates !== undefined &&
        !isArray(
            output.candidates
        ) &&
        !isObject(
            output.candidates
        )
    ) {
        warnings.push(
            "Engine candidates should be an array or object."
        );
    }

    if (
        output.recommendation !== undefined &&
        output.recommendation !== null &&
        !isObject(
            output.recommendation
        )
    ) {
        warnings.push(
            "Engine recommendation should be an object."
        );
    }

    return normalizeValidationResult(
        errors,
        warnings,
        {
            type: "engine_output"
        }
    );
}

/**
 * ============================================================
 * Validate Collection
 * ============================================================
 */

export function validateCollection(
    records,
    validator
) {
    if (!isArray(records)) {
        return {
            valid: false,
            total: 0,
            valid_count: 0,
            invalid_count: 0,
            warning_count: 0,
            results: [],
            errors: [
                "Records must be an array."
            ]
        };
    }

    if (
        typeof validator !== "function"
    ) {
        return {
            valid: false,
            total:
                records.length,
            valid_count: 0,
            invalid_count:
                records.length,
            warning_count: 0,
            results: [],
            errors: [
                "Validator must be a function."
            ]
        };
    }

    const results = [];

    let validCount = 0;
    let invalidCount = 0;
    let warningCount = 0;

    for (
        let index = 0;
        index < records.length;
        index += 1
    ) {
        const record =
            records[index]?.data ??
            records[index];

        const result =
            validator(record);

        if (result.valid) {
            validCount += 1;
        } else {
            invalidCount += 1;
        }

        warningCount +=
            result.warnings?.length ??
            0;

        results.push({
            index,
            id:
                record?.id ??
                null,
            ...result
        });
    }

    return {
        valid:
            invalidCount === 0,

        total:
            records.length,

        valid_count:
            validCount,

        invalid_count:
            invalidCount,

        warning_count:
            warningCount,

        results,
        errors: []
    };
}

/**
 * ============================================================
 * Knowledge Snapshot Validator
 * ============================================================
 */

export function validateKnowledgeSnapshot(
    snapshot
) {
    const errors = [];
    const warnings = [];

    if (!isObject(snapshot)) {
        return normalizeValidationResult(
            [
                "Knowledge snapshot must be an object."
            ]
        );
    }

    const requiredCollections = [
        "racquets",
        "strings",
        "players",
        "recommendations",
        "decision_rules",
        "inference"
    ];

    for (
        const collection of requiredCollections
    ) {
        if (
            !isArray(
                snapshot[collection]
            )
        ) {
            errors.push(
                `Knowledge snapshot collection "${collection}" is missing or invalid.`
            );
        }
    }

    if (
        isObject(snapshot.counts)
    ) {
        for (
            const [
                key,
                value
            ] of Object.entries(
                snapshot.counts
            )
        ) {
            if (
                !Number.isInteger(value) ||
                value < 0
            ) {
                warnings.push(
                    `Knowledge count "${key}" should be a non-negative integer.`
                );
            }
        }
    } else {
        warnings.push(
            "Knowledge snapshot counts are missing."
        );
    }

    return normalizeValidationResult(
        errors,
        warnings,
        {
            type: "knowledge_snapshot"
        }
    );
}

/**
 * ============================================================
 * Validate Tension
 * ============================================================
 */

export function validateTension(
    tension,
    options = {}
) {
    const {
        minimum = 30,
        maximum = 70
    } = options;

    if (
        tension === null ||
        tension === undefined
    ) {
        return {
            valid: true,
            value: null,
            warning:
                "Tension is unknown."
        };
    }

    const numeric =
        Number(tension);

    if (
        !Number.isFinite(numeric)
    ) {
        return {
            valid: false,
            value: null,
            error:
                "Tension must be numeric."
        };
    }

    if (
        numeric < minimum ||
        numeric > maximum
    ) {
        return {
            valid: false,
            value: numeric,
            error:
                `Tension must be between ${minimum} and ${maximum} lbs.`
        };
    }

    return {
        valid: true,
        value: numeric
    };
}

/**
 * ============================================================
 * Validation Summary
 * ============================================================
 */

export function createValidationSummary(
    results = []
) {
    if (!isArray(results)) {
        return {
            total: 0,
            valid: 0,
            invalid: 0,
            warnings: 0
        };
    }

    let valid = 0;
    let invalid = 0;
    let warnings = 0;

    for (
        const result of results
    ) {
        if (
            result?.valid
        ) {
            valid += 1;
        } else {
            invalid += 1;
        }

        warnings +=
            result?.warnings?.length ??
            0;
    }

    return {
        total:
            results.length,
        valid,
        invalid,
        warnings
    };
}

/**
 * ============================================================
 * Generic Export Helpers
 * ============================================================
 */

export const validators = {
    isObject,
    isNonEmptyString,
    isFiniteNumber,
    isBoolean,
    isArray,
    isNumberInRange
};
