/**
 * EveryCourtAI Tennis Recovery Engine V1
 * Canonical health data -> tennis load / recovery intelligence.
 */

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function scoreSessionLoad(health = {}) {
    const duration =
        health.session?.duration_minutes;

    const rpe =
        health.subjective_feedback
            ?.perceived_exertion;

    if (
        typeof duration !== "number" ||
        typeof rpe !== "number"
    ) {
        return null;
    }

    return Math.round(
        clamp(
            duration * rpe,
            0,
            1200
        )
    );
}

function scoreRecovery(health = {}) {
    let score = 100;
    let evidence = 0;

    const sleep =
        health.recovery?.sleep_duration_hours;

    if (typeof sleep === "number") {
        evidence++;

        if (sleep < 5) score -= 35;
        else if (sleep < 6) score -= 25;
        else if (sleep < 7) score -= 12;
    }

    const fatigue =
        health.subjective_feedback
            ?.fatigue_level;

    if (fatigue) {
        evidence++;

        const penalty = {
            none: 0,
            low: 8,
            moderate: 20,
            high: 35
        }[fatigue];

        score -= penalty ?? 0;
    }

    const rpe =
        health.subjective_feedback
            ?.perceived_exertion;

    if (typeof rpe === "number") {
        evidence++;

        if (rpe >= 9) score -= 20;
        else if (rpe >= 7) score -= 10;
    }

    if (evidence === 0) {
        return null;
    }

    return Math.round(
        clamp(score, 0, 100)
    );
}

function classifyRecovery(score) {
    if (score === null) return "unknown";
    if (score >= 80) return "ready";
    if (score >= 60) return "caution";
    return "recovery_priority";
}

export function analyzeTennisRecovery(
    health = {}
) {
    const sessionLoad =
        scoreSessionLoad(health);

    const recoveryScore =
        scoreRecovery(health);

    const recoveryStatus =
        classifyRecovery(
            recoveryScore
        );

    return {
        engine_version: "1.0",

        session_load:
            sessionLoad,

        recovery_score:
            recoveryScore,

        recovery_status:
            recoveryStatus,

        fatigue_risk:
            recoveryStatus ===
                "recovery_priority"
                ? "high"
                : recoveryStatus ===
                  "caution"
                    ? "moderate"
                    : recoveryStatus ===
                      "ready"
                        ? "low"
                        : "unknown",

        next_session_guidance:
            recoveryStatus ===
                "recovery_priority"
                ? "reduce_intensity"
                : recoveryStatus ===
                  "caution"
                    ? "moderate_load"
                    : recoveryStatus ===
                      "ready"
                        ? "normal_training"
                        : "insufficient_data"
    };
}
