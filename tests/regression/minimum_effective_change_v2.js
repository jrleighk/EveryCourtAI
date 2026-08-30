import {
    buildMinimumEffectiveChangeDecision
} from "../../engine/minimum_effective_change_v2.js";

const cases = [
    {
        id: "keep_setup",
        decision: {
            strategy: "keep_both",
            unsafe_components: 0,
            physical_improvement: 0
        },
        level: 0,
        stop: true
    },
    {
        id: "tension_only",
        decision: {
            strategy: "adjust_tension_only",
            unsafe_components: 0,
            physical_improvement: 0
        },
        level: 1,
        stop: true
    },
    {
        id: "string_change",
        decision: {
            strategy: "change_string_only",
            unsafe_components: 0,
            physical_improvement: 12
        },
        level: 2,
        stop: true
    },
    {
        id: "unsafe_requires_escalation",
        decision: {
            strategy: "change_racquet_only",
            unsafe_components: 1,
            physical_improvement: 20
        },
        level: 3,
        stop: false
    }
];

let passed = 0;

for (const test of cases) {

    const result =
        buildMinimumEffectiveChangeDecision({
            scenarioDecision:
                test.decision
        });

    const ok =
        result.intervention_level ===
            test.level &&
        result.stop_here ===
            test.stop;

    console.log(
        ok ? "PASS" : "FAIL",
        test.id
    );

    if (ok) passed++;
}

console.log(
    `RESULT: ${passed}/${cases.length} PASS`
);

if (passed !== cases.length) {
    process.exit(1);
}

const insufficient =
    buildMinimumEffectiveChangeDecision({
        scenarioDecision: {
            strategy: "change_both",
            unsafe_components: 0,
            physical_improvement: null
        }
    });

if (
    insufficient.assessment_status !==
        "insufficient_baseline" ||
    insufficient.effective_at_current_level !==
        null ||
    insufficient.stop_here !==
        false
) {
    console.log(
        "FAIL insufficient_baseline_contract"
    );
    process.exit(1);
}

console.log(
    "PASS insufficient_baseline_contract"
);
