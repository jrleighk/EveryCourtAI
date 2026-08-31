/**
 * EveryCourtAI Health Baseline Engine V1
 * Compares current health signals against personal baseline.
 */

function deviationPercent(current, baseline) {
    if (
        typeof current !== "number" ||
        typeof baseline !== "number" ||
        baseline <= 0
    ) {
        return null;
    }

    return Math.round(
        ((current - baseline) / baseline) * 100
    );
}

export function analyzeHealthBaseline(
    health = {},
    baseline = {}
) {
    const currentRecovery =
        health.recovery ?? {};

    const hrvDeviation =
        deviationPercent(
            currentRecovery.hrv_ms,
            baseline.hrv_ms
        );

    const restingHrDeviation =
        deviationPercent(
            currentRecovery.resting_heart_rate_bpm,
            baseline.resting_heart_rate_bpm
        );

    const sleepDeviation =
        deviationPercent(
            currentRecovery.sleep_duration_hours,
            baseline.sleep_duration_hours
        );

    const loadDeviation =
        deviationPercent(
            health.training_load?.recent_load_7d,
            baseline.training_load_7d
        );

    const availableSignals = [
        hrvDeviation,
        restingHrDeviation,
        sleepDeviation,
        loadDeviation
    ].filter(value => value !== null).length;

    return {
        engine_version: "1.0",
        baseline_available:
            availableSignals > 0,
        available_signal_count:
            availableSignals,

        deviations: {
            hrv_percent:
                hrvDeviation,
            resting_heart_rate_percent:
                restingHrDeviation,
            sleep_percent:
                sleepDeviation,
            training_load_7d_percent:
                loadDeviation
        }
    };
}
