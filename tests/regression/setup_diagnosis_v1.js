import {
    diagnoseCurrentSetup
} from "../../engine/setup_diagnosis_v1.js";

function runCase({
    id,
    decision,
    expected
}) {
    const result =
        diagnoseCurrentSetup({
            scenarioResult: {
                current_equipment: {
                    racquet_id:
                        "wilson_rf_01_pro_classic",
                    string_id:
                        "head_hawk_touch"
                },
                scenarios: [
                    {
                        type:
                            "minimal_change",
                        decision,
                        explanation: {
                            summary: id
                        }
                    }
                ]
            }
        });

    const checks = [
        result.next_action === expected.next_action,
        result.severity === expected.severity,
        result.findings.length === expected.findings,
        result.risk_flags.includes(
            expected.risk_flag
        ) === Boolean(expected.risk_flag)
    ];

    return {
        id,
        passed:
            checks.every(Boolean)
    };
}

const results = [
    runCase({
        id: "keep_setup",
        decision: {
            strategy: "keep_both",
            setup_change_count: 0,
            unsafe_components: 0,
            tension_changed: false
        },
        expected: {
            next_action: "keep_both",
            severity: "none",
            findings: 0,
            risk_flag: null
        }
    }),

    runCase({
        id: "tension_only",
        decision: {
            strategy: "adjust_tension_only",
            setup_change_count: 1,
            unsafe_components: 0,
            tension_changed: true,
            current_tension_lbs: 54,
            recommended_tension_lbs: 51,
            tension_delta_lbs: -3
        },
        expected: {
            next_action: "adjust_tension_only",
            severity: "low",
            findings: 1,
            risk_flag: "tension_mismatch"
        }
    }),

    runCase({
        id: "string_change",
        decision: {
            strategy: "change_string_only",
            setup_change_count: 1,
            unsafe_components: 0,
            tension_changed: false
        },
        expected: {
            next_action: "change_string_only",
            severity: "moderate",
            findings: 1,
            risk_flag: null
        }
    }),

    runCase({
        id: "unsafe_setup",
        decision: {
            strategy: "change_both",
            setup_change_count: 2,
            unsafe_components: 1,
            tension_changed: false
        },
        expected: {
            next_action: "change_both",
            severity: "high",
            findings: 1,
            risk_flag: "unsafe_component"
        }
    })
];

const passed =
    results.filter(
        item => item.passed
    ).length;

for (const result of results) {
    console.log(
        `${result.passed ? "PASS" : "FAIL"} ${result.id}`
    );
}

console.log(`Total: ${results.length}`);
console.log(`Passed: ${passed}`);
console.log(
    `Failed: ${results.length - passed}`
);
console.log(
    passed === results.length
        ? "RESULT: PASS"
        : "RESULT: FAIL"
);

if (passed !== results.length) {
    process.exit(1);
}
