/**
 * ============================================================
 * EveryCourtAI
 * Comparison Player Profile Adapter V1
 * ============================================================
 *
 * Purpose:
 *
 * Convert conversation / Player Profile style input into the
 * canonical player profile contract expected by
 * matching_engine.js and player_comparison_engine_v1.js.
 *
 * This adapter does NOT:
 *
 * - score racquets
 * - change recommendation weights
 * - decide comparison winners
 * - infer missing player facts
 * - mutate the source profile
 *
 * It only normalizes profile structure.
 *
 * ============================================================
 */

const ENGINE_NAME =
    "comparison_player_profile_adapter";

const ENGINE_VERSION =
    "1.0";


const PHYSICAL_SUFFIX =
    "_sensitivity";


function isPlainObject(
    value
) {

    return (
        value !== null &&
        typeof value ===
            "object" &&
        !Array.isArray(
            value
        )
    );
}


function cloneValue(
    value
) {

    if (
        value === undefined
    ) {

        return undefined;
    }


    try {

        return structuredClone(
            value
        );

    } catch {

        try {

            return JSON.parse(
                JSON.stringify(
                    value
                )
            );

        } catch {

            return value;
        }
    }
}


function normalizeString(
    value
) {

    if (
        typeof value !==
            "string"
    ) {

        return null;
    }


    const normalized =
        value
            .trim();


    return (
        normalized ||
        null
    );
}


function normalizePlayingStyle(
    value
) {

    /**
     * Already canonical.
     */

    if (
        isPlainObject(
            value
        )
    ) {

        const primary =
            normalizeString(
                value.primary
            );


        return {

            ...cloneValue(
                value
            ),

            primary
        };
    }


    /**
     * Conversation-state string.
     */

    if (
        typeof value ===
            "string"
    ) {

        return {
            primary:
                normalizeString(
                    value
                )
        };
    }


    /**
     * Player Profile V1 array.
     */

    if (
        Array.isArray(
            value
        )
    ) {

        const first =
            value.find(
                item =>
                    typeof item ===
                        "string" &&
                    item.trim()
            );


        return {
            primary:
                normalizeString(
                    first
                )
        };
    }


    return {
        primary:
            null
    };
}


function normalizeSwingSpeed(
    value
) {

    /**
     * Already canonical.
     */

    if (
        isPlainObject(
            value
        )
    ) {

        const overall =
            normalizeString(
                value.overall
            );


        return {

            ...cloneValue(
                value
            ),

            overall
        };
    }


    /**
     * Conversation-state string.
     */

    if (
        typeof value ===
            "string"
    ) {

        return {
            overall:
                normalizeString(
                    value
                )
        };
    }


    return {
        overall:
            null
    };
}


function buildPhysicalRegion(
    severity
) {

    const normalizedSeverity =
        normalizeString(
            severity
        );


    if (
        !normalizedSeverity ||
        normalizedSeverity ===
            "none"
    ) {

        return {
            active:
                false,

            severity:
                "none"
        };
    }


    return {
        active:
            true,

        severity:
            normalizedSeverity
    };
}


function normalizeCanonicalPhysical(
    physical
) {

    if (
        !isPlainObject(
            physical
        )
    ) {

        return {};
    }


    const normalized =
        {};


    for (
        const [
            region,
            value
        ]
        of Object.entries(
            physical
        )
    ) {

        /**
         * Matching Engine canonical region:
         *
         * shoulder: {
         *   active: true,
         *   severity: "moderate"
         * }
         */

        if (
            isPlainObject(
                value
            ) &&
            (
                value.active !==
                    undefined ||
                value.severity !==
                    undefined
            )
        ) {

            const severity =
                normalizeString(
                    value.severity
                ) ??
                "none";


            normalized[
                region
            ] = {

                ...cloneValue(
                    value
                ),

                active:
                    value.active ===
                        true &&
                    severity !==
                        "none",

                severity
            };
        }
    }


    return normalized;
}


function normalizePhysicalCondition(
    physicalCondition
) {

    if (
        !isPlainObject(
            physicalCondition
        )
    ) {

        return {};
    }


    const normalized =
        {};


    for (
        const [
            field,
            severity
        ]
        of Object.entries(
            physicalCondition
        )
    ) {

        if (
            !field.endsWith(
                PHYSICAL_SUFFIX
            )
        ) {

            continue;
        }


        const region =
            field.slice(
                0,
                -PHYSICAL_SUFFIX.length
            );


        if (
            !region
        ) {

            continue;
        }


        normalized[
            region
        ] =
            buildPhysicalRegion(
                severity
            );
    }


    return normalized;
}


function normalizeAdapterPhysical(
    physical
) {

    if (
        !isPlainObject(
            physical
        ) ||
        !Array.isArray(
            physical.active_constraints
        )
    ) {

        return {};
    }


    const normalized =
        {};


    for (
        const constraint
        of physical
            .active_constraints
    ) {

        const region =
            normalizeString(
                constraint
                    ?.body_part
            ) ??
            normalizeString(
                constraint
                    ?.field
            )
                ?.replace(
                    /_sensitivity$/,
                    ""
                );


        const severity =
            normalizeString(
                constraint
                    ?.severity
            );


        if (
            !region ||
            !severity
        ) {

            continue;
        }


        normalized[
            region
        ] =
            buildPhysicalRegion(
                severity
            );
    }


    return normalized;
}


function mergePhysicalContracts(
    sourceProfile
) {

    /**
     * Priority:
     *
     * 1. Existing canonical Matching Engine profile
     * 2. Adapter active_constraints
     * 3. Player Profile / conversation physical_condition
     *
     * Existing canonical values must not be overwritten.
     */

    const fromCondition =
        normalizePhysicalCondition(
            sourceProfile
                ?.physical_condition
        );


    const fromAdapter =
        normalizeAdapterPhysical(
            sourceProfile
                ?.physical
        );


    const fromCanonical =
        normalizeCanonicalPhysical(
            sourceProfile
                ?.physical
        );


    return {

        ...fromCondition,

        ...fromAdapter,

        ...fromCanonical
    };
}


function normalizeCurrentSetup(
    sourceProfile
) {

    const currentSetup =
        isPlainObject(
            sourceProfile
                ?.current_setup
        )
            ? cloneValue(
                sourceProfile
                    .current_setup
            )
            : {};


    /**
     * Preserve canonical Matching Engine contract if present.
     */

    if (
        isPlainObject(
            currentSetup.racquet
        )
    ) {

        return currentSetup;
    }


    /**
     * Player Profile Adapter-style racquet_id.
     */

    const racquetId =
        normalizeString(
            currentSetup
                ?.racquet_id
        );


    if (
        racquetId
    ) {

        return {

            ...currentSetup,

            racquet: {
                id:
                    racquetId
            }
        };
    }


    return currentSetup;
}


/**
 * ============================================================
 * Public API
 * ============================================================
 */

export function adaptComparisonPlayerProfile(
    playerProfile
) {

    if (
        !isPlainObject(
            playerProfile
        )
    ) {

        return {
            engine:
                ENGINE_NAME,

            version:
                ENGINE_VERSION,

            success:
                false,

            status:
                "invalid_player_profile",

            player_profile:
                null
        };
    }


    const source =
        cloneValue(
            playerProfile
        );


    const canonical = {

        ...source,

        playing_style:
            normalizePlayingStyle(
                source
                    .playing_style
            ),

        swing_speed:
            normalizeSwingSpeed(
                source
                    .swing_speed
            ),

        physical:
            mergePhysicalContracts(
                source
            ),

        current_setup:
            normalizeCurrentSetup(
                source
            )
    };


    return {
        engine:
            ENGINE_NAME,

        version:
            ENGINE_VERSION,

        success:
            true,

        status:
            "comparison_player_profile_ready",

        player_profile:
            canonical
    };
}


export function getComparisonPlayerProfileAdapterInfo() {

    return {
        name:
            ENGINE_NAME,

        version:
            ENGINE_VERSION,

        status:
            "ready",

        target_contract:
            "matching_engine_player_profile"
    };
}


export default {
    adaptComparisonPlayerProfile,
    getComparisonPlayerProfileAdapterInfo
};
