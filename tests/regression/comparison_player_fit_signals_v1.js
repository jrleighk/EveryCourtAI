import {
    runResolvedComparisonOrchestrator
} from "../../engine/comparison_orchestrator_v1.js";


console.log(
    "========================================"
);

console.log(
    "COMPARISON PLAYER FIT SIGNALS V1"
);

console.log(
    "========================================"
);


const result =
    await runResolvedComparisonOrchestrator({

        productAId:
            "babolat_pure_drive_spectra_edition_2026",

        productBId:
            "wilson_rf_01_pro_classic",

        language:
            "zh",

        playerProfile: {

            primary_goal:
                "more_comfort",

            playing_style: {
                primary:
                    "all_court"
            },

            swing_speed: {
                overall:
                    "medium"
            },

            physical_condition: {
                shoulder_sensitivity:
                    "moderate"
            }
        }
    });


const analysis =
    result
        ?.comparison
        ?.result
        ?.player_fit
        ?.analysis;


const signals =
    analysis
        ?.player_fit_signals;


const a =
    signals?.product_a;


const b =
    signals?.product_b;


const assertions = [

    {
        id:
            "comparison_ready",

        pass:
            result.success === true &&
            result.status ===
                "comparison_orchestrator_ready"
    },

    {
        id:
            "signals_available",

        pass:
            Boolean(
                a &&
                b
            )
    },

    {
        id:
            "pure_drive_swing_strong",

        pass:
            a
                ?.swing_compatibility
                ?.status ===
            "strong"
    },

    {
        id:
            "rf01_swing_moderate",

        pass:
            b
                ?.swing_compatibility
                ?.status ===
            "moderate"
    },

    {
        id:
            "pure_drive_weight_strong",

        pass:
            a
                ?.weight_compatibility
                ?.status ===
            "strong"
    },

    {
        id:
            "rf01_weight_moderate",

        pass:
            b
                ?.weight_compatibility
                ?.status ===
            "moderate"
    },

    {
        id:
            "pure_drive_physical_low",

        pass:
            a
                ?.physical_demand
                ?.status ===
            "low"
    },

    {
        id:
            "pure_drive_no_physical_risk",

        pass:
            a
                ?.physical_demand
                ?.risk ===
            false
    },

    {
        id:
            "rf01_physical_high",

        pass:
            b
                ?.physical_demand
                ?.status ===
            "high"
    },

    {
        id:
            "rf01_physical_risk",

        pass:
            b
                ?.physical_demand
                ?.risk ===
            true
    },

    {
        id:
            "pure_drive_goal_positive",

        pass:
            a
                ?.goal_alignment
                ?.status ===
            "positive"
    },

    {
        id:
            "rf01_goal_positive",

        pass:
            b
                ?.goal_alignment
                ?.status ===
            "positive"
    },

    {
        id:
            "pure_drive_raw_swing_evidence",

        pass:
            a
                ?.swing_compatibility
                ?.evidence
                ?.raw ===
            8.7
    },

    {
        id:
            "rf01_physical_evidence",

        pass:
            b
                ?.physical_demand
                ?.evidence
                ?.adjustment ===
            -20
    }
];


console.table(
    assertions
);


const passed =
    assertions.filter(
        item => item.pass
    ).length;


const failed =
    assertions.length -
    passed;


console.log("");
console.log(
    "========================================"
);

console.log(
    "REGRESSION SUMMARY"
);

console.log(
    "========================================"
);

console.log(
    `Total: ${assertions.length}`
);

console.log(
    `Passed: ${passed}`
);

console.log(
    `Failed: ${failed}`
);

console.log("");

console.log(
    failed === 0
        ? "RESULT: PASS"
        : "RESULT: FAIL"
);


console.log("");

console.dir(
    {
        product_a:
            a,

        product_b:
            b
    },
    {
        depth:
            null
    }
);


if (
    failed > 0
) {
    process.exitCode =
        1;
}
