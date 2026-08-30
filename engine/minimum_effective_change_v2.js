export const MEC_VERSION = "2.0";

const INTERVENTION_LEVELS = {
    keep_both: 0,
    adjust_tension_only: 1,
    change_string_only: 2,
    change_racquet_only: 3,
    change_both: 4
};

export function buildMinimumEffectiveChangeDecision({
    scenarioDecision
} = {}) {

    const strategy =
        scenarioDecision?.strategy ??
        "keep_both";

    const interventionLevel =
        INTERVENTION_LEVELS[strategy] ??
        0;

    const unsafeComponents =
        Number(
            scenarioDecision?.unsafe_components ??
            0
        );

    const physicalImprovementRaw =
        scenarioDecision?.physical_improvement;

    const hasPhysicalBaseline =
        physicalImprovementRaw !== null &&
        physicalImprovementRaw !== undefined;

    const physicalImprovement =
        hasPhysicalBaseline
            ? Number(physicalImprovementRaw)
            : null;

    const effective =
        strategy === "keep_both"
            ? unsafeComponents === 0
            : strategy === "adjust_tension_only"
                ? unsafeComponents === 0
                : !hasPhysicalBaseline
                    ? null
                    : (
                        unsafeComponents === 0 &&
                        physicalImprovement > 0
                    );

    const escalationRequired =
        unsafeComponents > 0;

    const assessmentStatus =
        effective === null
            ? "insufficient_baseline"
            : "assessed";

    return {
        engine:
            "Minimum Effective Change V2",

        version:
            MEC_VERSION,

        strategy,

        intervention_level:
            interventionLevel,

        assessment_status:
            assessmentStatus,

        effective_at_current_level:
            effective,

        stop_here:
            effective === true &&
            !escalationRequired,

        escalation_required:
            escalationRequired,

        escalation_reason:
            escalationRequired
                ? "unsafe_component_remaining"
                : null
    };
}

export default
    buildMinimumEffectiveChangeDecision;
