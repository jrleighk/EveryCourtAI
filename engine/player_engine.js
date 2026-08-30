/**
 * ============================================================
 * EveryCourtAI
 * Player Engine
 * Version: 1.0
 * ============================================================
 * Purpose:
 * Normalize raw user input into a standardized player profile.
 *
 * Responsibilities:
 * 1. Normalize user input
 * 2. Validate known fields
 * 3. Apply safe defaults
 * 4. Preserve unknown values as null
 * 5. Produce a standard playerProfile object for all other engines
 *
 * Important:
 * This engine does NOT make final equipment recommendations.
 * ============================================================
 */

/**
 * ------------------------------
 * Allowed Values
 * ------------------------------
 */

const ALLOWED_PLAYING_STYLES = [
    "baseline_aggressive",
    "baseline_counterpuncher",
    "baseline_grinder",
    "all_court",
    "serve_volley"
];

const PLAYING_STYLE_ALIASES = {
    baseline: "baseline_grinder",
    aggressive_baseline: "baseline_aggressive",
    baseline_aggressive: "baseline_aggressive",
    counterpuncher: "baseline_counterpuncher",
    baseline_counterpuncher: "baseline_counterpuncher",
    serve_and_volley: "serve_volley",
    serve_volley: "serve_volley",
    all_court: "all_court"
};

const ALLOWED_SWING_SPEEDS = [
    "slow",
    "medium",
    "fast"
];

const ALLOWED_GOALS = [
    "more_control",
    "more_power",
    "more_spin",
    "more_comfort",
    "more_feel"
];

const ALLOWED_FEEL_PREFERENCES = [
    "plush",
    "soft",
    "connected",
    "crisp",
    "firm",
    "muted"
];

const ALLOWED_LAUNCH_PREFERENCES = [
    "low",
    "medium_low",
    "medium",
    "medium_high",
    "high"
];

const ALLOWED_PHYSICAL_REGIONS = [
    "arm",
    "elbow",
    "wrist",
    "shoulder",
    "neck",
    "lower_back",
    "hip",
    "knee",
    "ankle"
];

const ALLOWED_SEVERITY_LEVELS = [
    "none",
    "mild",
    "moderate",
    "high"
];

/**
 * ============================================================
 * Utility Functions
 * ============================================================
 */

/**
 * Normalize plain text.
 */
function normalizeText(value) {
    if (typeof value !== "string") {
        return value;
    }

    return value
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, "_")
        .replace(/[^\w\u4e00-\u9fff]/g, "");
}

/**
 * Return a value only if it belongs to an allowed list.
 */
function validateAllowedValue(value, allowedValues) {
    if (!value) {
        return null;
    }

    const normalized = normalizeText(value);

    return allowedValues.includes(normalized)
        ? normalized
        : null;
}

function normalizePlayingStyleAlias(value) {
    if (!value) {
        return null;
    }

    const rawValue =
        typeof value === "object"
            ? value?.primary
            : value;

    const normalized =
        normalizeText(
            rawValue
        );

    if (!normalized) {
        return null;
    }

    return (
        PLAYING_STYLE_ALIASES[
            normalized
        ] ??
        normalized
    );
}

/**
 * Convert value safely to number.
 */
function toNumber(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return null;
    }

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : null;
}

/**
 * Convert value safely to boolean.
 */
function toBoolean(value) {
    if (typeof value === "boolean") {
        return value;
    }

    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();

        if (
            normalized === "true" ||
            normalized === "yes" ||
            normalized === "1"
        ) {
            return true;
        }

        if (
            normalized === "false" ||
            normalized === "no" ||
            normalized === "0"
        ) {
            return false;
        }
    }

    return null;
}

/**
 * Normalize array.
 */
function normalizeArray(value) {
    if (!value) {
        return [];
    }

    if (Array.isArray(value)) {
        return value
            .map(item => {
                if (typeof item === "string") {
                    return normalizeText(item);
                }

                return item;
            })
            .filter(Boolean);
    }

    if (typeof value === "string") {
        return value
            .split(",")
            .map(item => normalizeText(item))
            .filter(Boolean);
    }

    return [];
}

/**
 * ============================================================
 * Racquet Normalization
 * ============================================================
 */

function normalizeRacquet(rawRacquet = {}) {
    if (typeof rawRacquet === "string") {
        return {
            id: normalizeText(rawRacquet),
            brand: null,
            model: rawRacquet.trim(),
            year: null,
            weight_g: null
        };
    }

    return {
        id: rawRacquet.id
            ? normalizeText(rawRacquet.id)
            : null,

        brand: rawRacquet.brand
            ? rawRacquet.brand.trim()
            : null,

        model: rawRacquet.model
            ? rawRacquet.model.trim()
            : null,

        year: toNumber(rawRacquet.year),

        weight_g: toNumber(
            rawRacquet.weight_g ??
            rawRacquet.weight
        )
    };
}

/**
 * ============================================================
 * String Normalization
 * ============================================================
 */

function normalizeString(rawString = {}) {
    if (typeof rawString === "string") {
        return {
            id: normalizeText(rawString),
            brand: null,
            model: rawString.trim(),
            gauge_mm: null
        };
    }

    return {
        id: rawString.id
            ? normalizeText(rawString.id)
            : null,

        brand: rawString.brand
            ? rawString.brand.trim()
            : null,

        model: rawString.model
            ? rawString.model.trim()
            : null,

        gauge_mm: toNumber(
            rawString.gauge_mm ??
            rawString.gauge
        )
    };
}

/**
 * ============================================================
 * Physical Profile Normalization
 * ============================================================
 */

function normalizePhysicalProfile(rawPhysical = {}) {
    const output = {};

    for (const region of ALLOWED_PHYSICAL_REGIONS) {

        const rawValue = rawPhysical?.[region];

        if (!rawValue) {
            output[region] = {
                active: false,
                severity: "none"
            };

            continue;
        }

        if (typeof rawValue === "string") {
            const severity = validateAllowedValue(
                rawValue,
                ALLOWED_SEVERITY_LEVELS
            );

            output[region] = {
                active: severity !== "none",
                severity: severity || "none"
            };

            continue;
        }

        const severity = validateAllowedValue(
            rawValue.severity,
            ALLOWED_SEVERITY_LEVELS
        );

        const activeFromInput = toBoolean(
            rawValue.active
        );

        const active =
            activeFromInput !== null
                ? activeFromInput
                : severity !== "none";

        output[region] = {
            active,
            severity: severity || (
                active
                    ? "mild"
                    : "none"
            )
        };
    }

    return output;
}

/**
 * ============================================================
 * Current Setup Feedback
 * ============================================================
 */

function normalizeEquipmentChangeFeedback(rawFeedback = {}) {
    return {
        status:
            rawFeedback.status ?? "not_reported",

        changes_made:
            normalizeArray(
                rawFeedback.changes_made
            ),

        outcome:
            rawFeedback.outcome ?? "unknown",

        likes:
            normalizeArray(
                rawFeedback.likes
            ),

        dislikes:
            normalizeArray(
                rawFeedback.dislikes
            ),

        free_text:
            typeof rawFeedback.free_text === "string"
                ? rawFeedback.free_text.trim()
                : null
    };
}

function normalizeCurrentSetupFeedback(rawFeedback = {}) {
    return {
        likes: normalizeArray(
            rawFeedback.likes
        ),

        dislikes: normalizeArray(
            rawFeedback.dislikes
        ),

        issues: {
            too_powerful: Boolean(
                rawFeedback?.issues?.too_powerful
            ),

            not_enough_power: Boolean(
                rawFeedback?.issues?.not_enough_power
            ),

            too_stiff: Boolean(
                rawFeedback?.issues?.too_stiff
            ),

            too_soft: Boolean(
                rawFeedback?.issues?.too_soft
            ),

            too_high_launch: Boolean(
                rawFeedback?.issues?.too_high_launch
            ),

            too_low_launch: Boolean(
                rawFeedback?.issues?.too_low_launch
            ),

            not_enough_spin: Boolean(
                rawFeedback?.issues?.not_enough_spin
            ),

            not_enough_control: Boolean(
                rawFeedback?.issues?.not_enough_control
            ),

            poor_feel: Boolean(
                rawFeedback?.issues?.poor_feel
            ),

            poor_comfort: Boolean(
                rawFeedback?.issues?.poor_comfort
            ),

            poor_durability: Boolean(
                rawFeedback?.issues?.poor_durability
            ),

            poor_tension_maintenance: Boolean(
                rawFeedback?.issues?.poor_tension_maintenance
            )
        },

        free_text:
            typeof rawFeedback.free_text === "string"
                ? rawFeedback.free_text.trim()
                : null
    };
}

/**
 * ============================================================
 * Profile Completeness
 * ============================================================
 */

function calculateProfileCompleteness(profile) {
    let score = 0;
    let total = 0;

    const checks = [
        profile.primary_goal,
        profile.current_setup.racquet.id ||
            profile.current_setup.racquet.model,
        profile.playing_style.primary,
        profile.swing_speed.overall,
        profile.current_setup.string.main.id ||
            profile.current_setup.string.main.model,
        profile.current_setup.string.tension.main_lbs
    ];

    for (const value of checks) {
        total += 1;

        if (
            value !== null &&
            value !== undefined &&
            value !== ""
        ) {
            score += 1;
        }
    }

    return Math.round(
        (score / total) * 100
    );
}

/**
 * ============================================================
 * Missing Information
 * ============================================================
 */

function detectMissingInformation(profile) {
    const missing = [];

    if (!profile.primary_goal) {
        missing.push("primary_goal");
    }

    if (
        !profile.current_setup.racquet.id &&
        !profile.current_setup.racquet.model
    ) {
        missing.push("current_racquet");
    }

    if (!profile.playing_style.primary) {
        missing.push("playing_style");
    }

    if (!profile.swing_speed.overall) {
        missing.push("swing_speed");
    }

    if (
        !profile.current_setup.string.main.id &&
        !profile.current_setup.string.main.model
    ) {
        missing.push("current_string");
    }

    if (
        profile.current_setup.string.tension.main_lbs === null
    ) {
        missing.push("current_tension");
    }

    return missing;
}

/**
 * ============================================================
 * Main Player Engine
 * ============================================================
 */

export async function buildPlayerProfile(
    playerInput = {}
) {

    if (
        !playerInput ||
        typeof playerInput !== "object"
    ) {
        throw new Error(
            "EveryCourtAI Player Engine: playerInput must be an object."
        );
    }

    /**
     * ----------------------------------
     * Primary Goal
     * ----------------------------------
     */

    const primaryGoal =
        validateAllowedValue(
            playerInput.primary_goal ??
            playerInput.goal ??
            playerInput?.goals?.primary?.[0],
            ALLOWED_GOALS
        );

    /**
     * ----------------------------------
     * Playing Style
     * ----------------------------------
     */

    const primaryPlayingStyle =
        validateAllowedValue(
            normalizePlayingStyleAlias(
                playerInput.playing_style ??
                playerInput
                    ?.playing_style
                    ?.primary
            ),
            ALLOWED_PLAYING_STYLES
        );

    /**
     * ----------------------------------
     * Swing Speed
     * ----------------------------------
     */

    const swingSpeed =
        validateAllowedValue(
            playerInput.swing_speed ??
            playerInput?.swing_speed?.overall,
            ALLOWED_SWING_SPEEDS
        );

    /**
     * ----------------------------------
     * Current Racquet
     * ----------------------------------
     */

    const currentRacquet =
        normalizeRacquet(
            playerInput.current_racquet ??
            playerInput?.current_setup?.racquet ??
            {}
        );

    /**
     * ----------------------------------
     * Current Strings
     * ----------------------------------
     */

    const rawStringSetup =
        playerInput.current_string ??
        playerInput?.current_setup?.string ??
        {};

    let mainString;
    let crossString;

    if (typeof rawStringSetup === "string") {

        mainString =
            normalizeString(
                rawStringSetup
            );

        crossString = {
            id: null,
            brand: null,
            model: null,
            gauge_mm: null
        };

    } else {

        mainString =
            normalizeString(
                rawStringSetup.main ??
                rawStringSetup
            );

        crossString =
            normalizeString(
                rawStringSetup.cross ??
                {}
            );
    }

    /**
     * ----------------------------------
     * Setup Type
     * ----------------------------------
     */

    let setupType =
        normalizeText(
            rawStringSetup.setup_type ??
            playerInput.setup_type ??
            ""
        );

    if (
        setupType !== "full_bed" &&
        setupType !== "hybrid"
    ) {
        setupType =
            crossString.id ||
            crossString.model
                ? "hybrid"
                : "full_bed";
    }

    /**
     * ----------------------------------
     * Tension
     * ----------------------------------
     */

    const mainTension =
    toNumber(
        playerInput.current_tension_lbs ??
        playerInput.current_tension ??
        playerInput?.current_setup?.string?.tension?.main_lbs ??
        rawStringSetup?.tension?.main_lbs
    );

    const crossTension =
        toNumber(
            playerInput?.current_setup?.string?.tension?.cross_lbs ??
            rawStringSetup?.tension?.cross_lbs
        );

    /**
     * ----------------------------------
     * Preferences
     * ----------------------------------
     */

    const feelPreference =
        validateAllowedValue(
            playerInput.feel_preference ??
            playerInput?.preferences?.feel,
            ALLOWED_FEEL_PREFERENCES
        );

    const launchPreference =
        validateAllowedValue(
            playerInput.launch_preference ??
            playerInput?.preferences?.launch_angle,
            ALLOWED_LAUNCH_PREFERENCES
        );

    /**
     * ----------------------------------
     * Physical
     * ----------------------------------
     */

    const physical =
        normalizePhysicalProfile(
            playerInput.physical ??
            {}
        );

    /**
     * ----------------------------------
     * Feedback
     * ----------------------------------
     */

    const currentSetupFeedback =
        normalizeCurrentSetupFeedback(
            playerInput.current_setup_feedback ??
            {}
        );
    const equipmentChangeFeedback =
        normalizeEquipmentChangeFeedback(
            playerInput.equipment_change_feedback ??
            {}
        );


    /**
     * ----------------------------------
     * Build Standard Profile
     * ----------------------------------
     */

    const playerProfile = {

        profile_version: "1.0",

        created_at:
            new Date().toISOString(),

        player_id:
            playerInput.player_id ??
            null,

        basic: {
            name:
                playerInput?.basic?.name ??
                playerInput.name ??
                null,

            gender:
                playerInput?.basic?.gender ??
                playerInput.gender ??
                null,

            age:
                toNumber(
                    playerInput?.basic?.age ??
                    playerInput.age
                ),

            height_cm:
                toNumber(
                    playerInput?.basic?.height_cm ??
                    playerInput.height_cm
                ),

            weight_kg:
                toNumber(
                    playerInput?.basic?.weight_kg ??
                    playerInput.weight_kg
                ),

            age_group:
                playerInput?.basic?.age_group ??
                playerInput.age_group ??
                null,

            dominant_hand:
                playerInput?.basic?.dominant_hand ??
                playerInput.dominant_hand ??
                null,

            experience_years:
                toNumber(
                    playerInput?.basic?.experience_years ??
                    playerInput.experience_years
                ),

            training_frequency_per_week:
                toNumber(
                    playerInput?.basic?.training_frequency_per_week ??
                    playerInput.training_frequency_per_week
                ),

            match_frequency:
                playerInput?.basic?.match_frequency ??
                playerInput.match_frequency ??
                null
        },

        level: {
            id:
                playerInput?.level?.id ??
                playerInput.level ??
                null,

            confidence:
                toNumber(
                    playerInput?.level?.confidence
                )
        },

        playing_style: {
            primary:
                primaryPlayingStyle,

            secondary:
                normalizeArray(
                    playerInput?.playing_style?.secondary
                ),

            confidence:
                toNumber(
                    playerInput?.playing_style?.confidence
                )
        },

        swing_speed: {
            forehand:
                validateAllowedValue(
                    playerInput?.swing_speed?.forehand,
                    ALLOWED_SWING_SPEEDS
                ),

            backhand:
                validateAllowedValue(
                    playerInput?.swing_speed?.backhand,
                    ALLOWED_SWING_SPEEDS
                ),

            serve:
                validateAllowedValue(
                    playerInput?.swing_speed?.serve,
                    ALLOWED_SWING_SPEEDS
                ),

            overall:
                swingSpeed,

            confidence:
                toNumber(
                    playerInput?.swing_speed?.confidence
                )
        },

        goals: {
            primary:
                primaryGoal
                    ? [primaryGoal]
                    : [],

            secondary:
                normalizeArray(
                    playerInput?.goals?.secondary ??
                    playerInput.secondary_goals
                ).filter(
                    goal =>
                        ALLOWED_GOALS.includes(goal)
                )
        },

        primary_goal:
            primaryGoal,

        physical,

        preferences: {
            feel:
                feelPreference,

            launch_angle:
                launchPreference,

            string_break_frequency:
                normalizeText(
                    playerInput?.preferences?.string_break_frequency ??
                    playerInput.string_break_frequency ??
                    ""
                ) || null,

            brand:
                normalizeArray(
                    playerInput?.preferences?.brand
                ),

            avoid_brands:
                normalizeArray(
                    playerInput?.preferences?.avoid_brands
                ),

            change_tolerance:
                playerInput?.preferences?.change_tolerance ??
                playerInput?.change_tolerance ??
                "moderate",

            change_intent:
                playerInput?.change_intent ??
                null
        },

        current_setup: {
            racquet:
                currentRacquet,

            string: {
                setup_type:
                    setupType,

                main:
                    mainString,

                cross:
                    crossString,

                tension: {
                    main_lbs:
                        mainTension,

                    cross_lbs:
                        setupType === "hybrid"
                            ? crossTension
                            : null
                }
            }
        },

        current_setup_feedback:
            currentSetupFeedback,
        equipment_change_feedback:
            equipmentChangeFeedback,


        environment: {
            primary_court_surface:
                playerInput?.environment?.primary_court_surface ??
                null,

            typical_temperature_c:
                toNumber(
                    playerInput?.environment?.typical_temperature_c
                ),

            typical_humidity:
                toNumber(
                    playerInput?.environment?.typical_humidity
                ),

            altitude_category:
                playerInput?.environment?.altitude_category ??
                null,

            indoor_outdoor:
                playerInput?.environment?.indoor_outdoor ??
                null
        },

        matching_requirements: {
            must_have:
                normalizeArray(
                    playerInput?.matching_requirements?.must_have
                ),

            nice_to_have:
                normalizeArray(
                    playerInput?.matching_requirements?.nice_to_have
                ),

            avoid:
                normalizeArray(
                    playerInput?.matching_requirements?.avoid
                )
        }
    };

    /**
     * ----------------------------------
     * Profile Diagnostics
     * ----------------------------------
     */

    playerProfile.metadata = {
        completeness_score:
            calculateProfileCompleteness(
                playerProfile
            ),

        missing_information:
            detectMissingInformation(
                playerProfile
            ),

        normalization_status:
            "completed",

        safe_defaults_applied:
            true
    };

    /**
     * ----------------------------------
     * Final Return
     * ----------------------------------
     */

    return playerProfile;
}

/**
 * ============================================================
 * Optional Validator
 * ============================================================
 */

export function validatePlayerProfile(
    playerProfile
) {

    const errors = [];
    const warnings = [];

    if (
        !playerProfile ||
        typeof playerProfile !== "object"
    ) {
        errors.push(
            "Player profile is invalid."
        );

        return {
            valid: false,
            errors,
            warnings
        };
    }

    if (
        !playerProfile.primary_goal
    ) {
        warnings.push(
            "Primary goal is missing."
        );
    }

    if (
        !playerProfile?.current_setup?.racquet?.id &&
        !playerProfile?.current_setup?.racquet?.model
    ) {
        warnings.push(
            "Current racquet is missing."
        );
    }

    if (
        !playerProfile?.playing_style?.primary
    ) {
        warnings.push(
            "Playing style is missing."
        );
    }

    if (
        !playerProfile?.swing_speed?.overall
    ) {
        warnings.push(
            "Swing speed is missing."
        );
    }

    return {
        valid:
            errors.length === 0,

        errors,
        warnings
    };
}
