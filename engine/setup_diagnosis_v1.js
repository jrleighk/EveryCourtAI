export const SETUP_DIAGNOSIS_VERSION = "1.0";

export function diagnoseCurrentSetup({
    playerProfile = null,
    scenarioResult = null
} = {}) {

    const scenarios =
        Array.isArray(
            scenarioResult?.scenarios
        )
            ? scenarioResult.scenarios
            : [];

    const minimal =
        scenarios.find(
            item =>
                item?.type ===
                "minimal_change"
        ) ?? null;

    const decision =
        minimal?.decision ?? null;

    const unsafeComponents =
        Number(decision?.unsafe_components ?? 0);

    const strategy =
        decision?.strategy ?? "unknown";

    const severity =
        unsafeComponents > 0
            ? "high"
            : strategy === "change_both" ||
              strategy === "change_racquet_only" ||
              strategy === "change_string_only"
                ? "moderate"
                : strategy === "adjust_tension_only"
                    ? "low"
                    : "none";

    const riskFlags = [];

    if (unsafeComponents > 0) {
        riskFlags.push("unsafe_component");
    }

    if (decision?.tension_changed) {
        riskFlags.push("tension_mismatch");
    }

    const findings =
        strategy === "keep_both"
            ? []
            : [{
                issue: strategy,
                severity,
                source: "minimal_change_scenario",
                evidence: {
                    unsafe_components:
                        unsafeComponents,
                    physical_improvement:
                        decision?.physical_improvement ?? null,
                    tension_delta_lbs:
                        decision?.tension_delta_lbs ?? 0
                }
            }];

    return {
        engine:
            "Setup Diagnosis V1",

        version:
            SETUP_DIAGNOSIS_VERSION,

        current_setup: {
            racquet_id:
                scenarioResult
                    ?.current_equipment
                    ?.racquet_id ??
                null,

            string_id:
                scenarioResult
                    ?.current_equipment
                    ?.string_id ??
                null,

            tension_lbs:
                decision
                    ?.current_tension_lbs ??
                null
        },

        primary_diagnosis: {
            strategy:
                decision?.strategy ??
                "unknown",

            change_count:
                decision
                    ?.setup_change_count ??
                decision
                    ?.change_count ??
                0,

            unsafe_components:
                decision
                    ?.unsafe_components ??
                null,

            physical_improvement:
                decision
                    ?.physical_improvement ??
                null
        },

        findings,

        severity,

        risk_flags:
            riskFlags,

        next_action:
            strategy,

        evidence: {
            scenario_type:
                minimal?.type ?? null,

            explanation:
                minimal?.explanation ?? null,

            recommended_tension_lbs:
                decision
                    ?.recommended_tension_lbs ??
                null,

            tension_delta_lbs:
                decision
                    ?.tension_delta_lbs ??
                0
        }
    };
}

export default diagnoseCurrentSetup;
