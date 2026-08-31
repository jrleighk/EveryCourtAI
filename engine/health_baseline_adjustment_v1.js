/**
 * EveryCourtAI Health Baseline Adjustment V1
 * Personal baseline deviations -> conservative recovery adjustment.
 */

export function buildBaselineRecoveryAdjustment(
    baselineAnalysis = {}
) {
    const deviations =
        baselineAnalysis.deviations ?? {};

    const available =
        baselineAnalysis.available_signal_count ?? 0;

    if (
        !baselineAnalysis.baseline_available ||
        available < 2
    ) {
        return {
            adjustment_version: "1.0",
            evidence_sufficient: false,
            recovery_adjustment: 0,
            baseline_status: "insufficient_data"
        };
    }

    let penalty = 0;

    const hrv =
        deviations.hrv_percent;

    if (typeof hrv === "number") {
        if (hrv <= -20) penalty += 15;
        else if (hrv <= -10) penalty += 8;
    }

    const restingHr =
        deviations.resting_heart_rate_percent;

    if (typeof restingHr === "number") {
        if (restingHr >= 15) penalty += 15;
        else if (restingHr >= 8) penalty += 8;
    }

    const sleep =
        deviations.sleep_percent;

    if (typeof sleep === "number") {
        if (sleep <= -20) penalty += 12;
        else if (sleep <= -10) penalty += 6;
    }

    const load =
        deviations.training_load_7d_percent;

    if (typeof load === "number") {
        if (load >= 40) penalty += 12;
        else if (load >= 20) penalty += 6;
    }

    penalty =
        Math.min(
            penalty,
            30
        );

    return {
        adjustment_version: "1.0",
        evidence_sufficient: true,
        recovery_adjustment:
            -penalty,
        baseline_status:
            penalty >= 20
                ? "recovery_pressure"
                : penalty > 0
                    ? "caution"
                    : "stable"
    };
}
