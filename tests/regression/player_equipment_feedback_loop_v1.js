import {
    buildPlayerEquipmentFeedbackLoop
} from "../../engine/player_equipment_feedback_loop_v1.js";

const cases = [
    [
        "await_action",
        {},
        "await_action"
    ],
    [
        "await_feedback",
        {
            userAction: {
                status: "applied"
            }
        },
        "await_feedback"
    ],
    [
        "retain_learning",
        {
            userAction: {
                status: "applied"
            },
            feedback: {
                outcome: "improved"
            }
        },
        "retain_learning"
    ],
    [
        "reassess",
        {
            userAction: {
                status: "applied"
            },
            feedback: {
                outcome: "worse"
            }
        },
        "reassess"
    ]
];

let passed = 0;

for (const [name, input, expected] of cases) {
    const result =
        buildPlayerEquipmentFeedbackLoop(input);

    if (result.next_step !== expected) {
        console.log("FAIL", name);
        process.exit(1);
    }

    console.log("PASS", name);
    passed += 1;
}

console.log(`RESULT: ${passed}/${cases.length} PASS`);
