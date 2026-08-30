export const FEEDBACK_LOOP_VERSION = "1.0";

function clone(value) {
    return value == null
        ? null
        : JSON.parse(JSON.stringify(value));
}

export function buildPlayerEquipmentFeedbackLoop({
    recommendation = null,
    userAction = null,
    feedback = null
} = {}) {
    const actionStatus =
        userAction?.status ?? "not_reported";

    const outcome =
        feedback?.outcome ?? "unknown";

    let nextStep = "await_action";

    if (
        actionStatus === "applied" ||
        actionStatus === "partially_applied"
    ) {
        nextStep =
            outcome === "unknown"
                ? "await_feedback"
                : (
                    outcome === "improved"
                        ? "retain_learning"
                        : "reassess"
                );
    }

    if (actionStatus === "rejected") {
        nextStep = "reassess";
    }

    return {
        engine: "Player Equipment Feedback Loop V1",
        version: FEEDBACK_LOOP_VERSION,

        previous_recommendation:
            clone(recommendation),

        user_action: {
            status: actionStatus,
            changes_made:
                clone(userAction?.changes_made ?? [])
        },

        feedback: {
            outcome,
            likes:
                clone(feedback?.likes ?? []),
            dislikes:
                clone(feedback?.dislikes ?? []),
            free_text:
                feedback?.free_text ?? null
        },

        next_step: nextStep
    };
}

export default buildPlayerEquipmentFeedbackLoop;
