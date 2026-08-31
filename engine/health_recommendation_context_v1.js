/**
 * EveryCourtAI Health Recommendation Context V1
 * Recovery intelligence -> safe equipment recommendation signals.
 */

export function buildHealthRecommendationContext(
    recovery = {}
) {
    const status =
        recovery.recovery_status ??
        "unknown";

    if (status === "recovery_priority") {
        return {
            context_version: "1.0",
            health_context_available: true,
            fatigue_level: "high",
            load_adjustment: "reduce",
            comfort_priority_boost: true,
            equipment_change_caution: true,
            recommendation_bias:
                "lower_physical_load"
        };
    }

    if (status === "caution") {
        return {
            context_version: "1.0",
            health_context_available: true,
            fatigue_level: "moderate",
            load_adjustment: "moderate",
            comfort_priority_boost: true,
            equipment_change_caution: true,
            recommendation_bias:
                "comfort_first"
        };
    }

    if (status === "ready") {
        return {
            context_version: "1.0",
            health_context_available: true,
            fatigue_level: "low",
            load_adjustment: "normal",
            comfort_priority_boost: false,
            equipment_change_caution: false,
            recommendation_bias:
                "neutral"
        };
    }

    return {
        context_version: "1.0",
        health_context_available: false,
        fatigue_level: null,
        load_adjustment: null,
        comfort_priority_boost: false,
        equipment_change_caution: false,
        recommendation_bias:
            "neutral"
    };
}
