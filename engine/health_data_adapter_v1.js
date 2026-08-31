/**
 * EveryCourtAI Health Data Adapter V1
 * External health/wearable data -> canonical health data contract.
 */

function numberOrNull(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return null;
    }

    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

function stringOrNull(value) {
    return typeof value === "string" && value.trim()
        ? value.trim()
        : null;
}

function normalizeZoneMinutes(zones = {}) {
    return {
        zone1: numberOrNull(zones.zone1),
        zone2: numberOrNull(zones.zone2),
        zone3: numberOrNull(zones.zone3),
        zone4: numberOrNull(zones.zone4),
        zone5: numberOrNull(zones.zone5)
    };
}

export function normalizeHealthData(
    raw = {},
    options = {}
) {
    const source =
        options.source ??
        raw.source ??
        "manual";

    return {
        schema_version: "1.0",

        source,

        recorded_at:
            stringOrNull(
                raw.recorded_at
            ) ??
            new Date().toISOString(),

        session: {
            sport:
                raw.session?.sport === "tennis"
                    ? "tennis"
                    : "other",

            duration_minutes:
                numberOrNull(
                    raw.session?.duration_minutes
                ),

            active_energy_kcal:
                numberOrNull(
                    raw.session?.active_energy_kcal
                )
        },

        heart_rate: {
            average_bpm:
                numberOrNull(
                    raw.heart_rate?.average_bpm
                ),

            max_bpm:
                numberOrNull(
                    raw.heart_rate?.max_bpm
                ),

            zone_minutes:
                normalizeZoneMinutes(
                    raw.heart_rate?.zone_minutes
                )
        },

        training_load: {
            session_load:
                numberOrNull(
                    raw.training_load?.session_load
                ),

            recent_load_7d:
                numberOrNull(
                    raw.training_load?.recent_load_7d
                )
        },

        recovery: {
            sleep_duration_hours:
                numberOrNull(
                    raw.recovery?.sleep_duration_hours
                ),

            resting_heart_rate_bpm:
                numberOrNull(
                    raw.recovery?.resting_heart_rate_bpm
                ),

            hrv_ms:
                numberOrNull(
                    raw.recovery?.hrv_ms
                )
        },

        subjective_feedback: {
            fatigue_level:
                stringOrNull(
                    raw.subjective_feedback?.fatigue_level
                ),

            perceived_exertion:
                numberOrNull(
                    raw.subjective_feedback?.perceived_exertion
                )
        }
    };
}
