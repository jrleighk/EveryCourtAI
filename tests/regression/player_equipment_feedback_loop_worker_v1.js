import worker from "../../cloudflare/worker.js";

async function post(payload) {
    const response = await worker.fetch(
        new Request(
            "https://everycourt.test/ai",
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json"
                },
                body:
                    JSON.stringify(payload)
            }
        ),
        {},
        {}
    );

    return response.json();
}

const base = {
    level: "intermediate",
    primary_goal: "more_comfort",
    playing_style: "all_court",
    swing_speed: "medium",
    current_racquet: {
        id: "wilson_rf_01_pro_classic"
    },
    current_string: {
        id: "head_hawk_touch",
        gauge_mm: 1.25
    },
    current_tension: 54
};

const turn1 = await post({
    player_input: base
});

const turn2 = await post({
    player_input: {
        ...base,
        equipment_change_feedback: {
            status: "applied",
            changes_made: [
                "tension_54_to_52"
            ],
            outcome: "improved"
        }
    },
    conversation_state:
        turn1.conversation_state
});

const turn3 = await post({
    player_input: base,
    conversation_state:
        turn2.conversation_state
});

const checks = {
    turn1_ready:
        turn1.status ===
        "recommendation_ready",

    previous_recommendation_present:
        Boolean(
            turn2.feedback_loop
                ?.previous_recommendation
        ),

    retain_learning:
        turn2.feedback_loop
            ?.next_step ===
        "retain_learning",

    action_preserved:
        turn2.feedback_loop
            ?.user_action
            ?.status ===
        "applied",

    outcome_preserved:
        turn2.feedback_loop
            ?.feedback
            ?.outcome ===
        "improved",

    stale_feedback_not_replayed:
        turn3.feedback_loop === null
};

const failed =
    Object.entries(checks)
        .filter(([, pass]) => !pass);

for (const [name, pass] of Object.entries(checks)) {
    console.log(
        `${pass ? "PASS" : "FAIL"} ${name}`
    );
}

if (failed.length > 0) {
    process.exit(1);
}

console.log("RESULT: 6/6 PASS");
