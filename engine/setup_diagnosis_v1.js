import adaptPlayerProfileV1 from "../src/adapters/player_profile_adapter_v1.js";
import {
    buildMinimumEffectiveChangeDecision
} from "./minimum_effective_change_v2.js";

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

    const adapterProfile =
        playerProfile
            ? {
                ...playerProfile,
                playing_level:
                    playerProfile.playing_level ??
                    playerProfile?.level?.id,
                physical_condition:
                    playerProfile.physical_condition ??
                    playerProfile.physical
            }
            : null;

    const adaptedProfile =
        adapterProfile
            ? adaptPlayerProfileV1(adapterProfile)
            : null;

    const physicalContext =
        adaptedProfile?.physical ?? null;

    const playingLoad =
        adaptedProfile?.playing_load ?? null;

    const unsafeComponents =
        Number(decision?.unsafe_components ?? 0);

    const strategy =
        decision?.strategy ?? "unknown";

    const highestPhysical =
        physicalContext?.highest_constraint ?? null;

    const physicalSeverity =
        highestPhysical?.severity ?? "none";

    const fatigueLevel =
        playingLoad?.fatigue_level ?? "none";

    const severity =
        unsafeComponents > 0
            ? "high"
            : physicalSeverity === "high" ||
              physicalSeverity === "severe"
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

    if (
        physicalSeverity !== "none"
    ) {
        riskFlags.push("physical_constraint");
    }

    if (
        fatigueLevel !== "none"
    ) {
        riskFlags.push("fatigue_load");
    }

    const minimumEffectiveChange =
        buildMinimumEffectiveChangeDecision({
            scenarioDecision:
                decision
        });

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

        player_context: {
            physical: physicalContext,
            fatigue: {
                level:
                    playingLoad?.fatigue_level ?? "none",
                timing:
                    playingLoad?.fatigue_timing ?? "none"
            }
        },

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

        minimum_effective_change:
            minimumEffectiveChange,

        findings,

        physical_context: {
            body_part:
                highestPhysical?.body_part ?? null,
            severity:
                physicalSeverity,
            fatigue_level:
                fatigueLevel
        },

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
