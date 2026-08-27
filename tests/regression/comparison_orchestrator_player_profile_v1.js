import {
  runComparisonOrchestrator
} from "../../engine/comparison_orchestrator_v1.js";


function test(
  id,
  condition
) {

  return {
    id,
    pass:
      condition === true
  };
}


const result =
  await runComparisonOrchestrator({

    message:
      "比较 Babolat Pure Drive Spectra Edition 2026 和 Wilson RF 01 Pro Classic",

    language:
      "zh",

    playerProfile: {

      primary_goal:
        "more_comfort",

      playing_style:
        "all_court",

      swing_speed:
        "medium",

      physical_condition: {

        shoulder_sensitivity:
          "moderate"
      }
    }
  });


const playerFit =
  result
    ?.comparison
    ?.answer
    ?.player_fit;


const productA =
  playerFit
    ?.product_a;


const productB =
  playerFit
    ?.product_b;


const decision =
  result
    ?.comparison
    ?.answer
    ?.decision;


const playerDecision =
  result
    ?.interpretation
    ?.player_decision_narrative;


const cases = [

  test(
    "orchestrator_success",
    result.success ===
      true
  ),

  test(
    "orchestrator_ready",
    result.status ===
      "comparison_orchestrator_ready"
  ),

  test(
    "player_fit_available",
    playerFit?.available ===
      true
  ),

  test(
    "pure_drive_score",
    productA
      ?.match_score ===
      69
  ),

  test(
    "rf01_score",
    productB
      ?.match_score ===
      45
  ),

  test(
    "pure_drive_swing_signal",
    result
      ?.comparison
      ?.result
      ?.player_fit
      ?.analysis
      ?.product_a
      ?.score_breakdown
      ?.swing_speed ===
      8.7
  ),

  test(
    "pure_drive_weight_signal",
    result
      ?.comparison
      ?.result
      ?.player_fit
      ?.analysis
      ?.product_a
      ?.score_breakdown
      ?.static_weight_fit ===
      6
  ),

  test(
    "rf01_physical_penalty",
    result
      ?.comparison
      ?.result
      ?.player_fit
      ?.analysis
      ?.product_b
      ?.score_breakdown
      ?.physical ===
      -20
  ),

  test(
    "rf01_risk_flag",
    Array.isArray(
      productB
        ?.risk_flags
    ) &&
    productB
      .risk_flags
      .some(
        item =>
          String(
            item
          )
            .includes(
              "upper-body demand"
            )
      )
  ),

  test(
    "performance_prefers_a",
    decision
      ?.performance_preference
      ?.preferred_product ===
      "a"
  ),

  test(
    "practical_prefers_a",
    decision
      ?.practical_preference
      ?.preferred_product ===
      "a"
  ),

  test(
    "decision_narrative_ready",
    playerDecision
      ?.available ===
      true &&
    playerDecision
      ?.status ===
      "player_decision_narrative_ready"
  ),

  test(
    "decision_narrative_prefers_pure_drive",
    playerDecision
      ?.performance_preference
      ?.product_name ===
      "Babolat Pure Drive Spectra Edition 2026"
  )
];


console.log(
  "========================================"
);

console.log(
  "COMPARISON ORCHESTRATOR PLAYER PROFILE V1"
);

console.log(
  "========================================"
);

console.table(
  cases
);


const passed =
  cases.filter(
    item =>
      item.pass
  ).length;


const failed =
  cases.length -
  passed;


console.log(
  "\n========================================"
);

console.log(
  "REGRESSION SUMMARY"
);

console.log(
  "========================================"
);

console.log(
  `Total: ${cases.length}`
);

console.log(
  `Passed: ${passed}`
);

console.log(
  `Failed: ${failed}`
);

console.log(
  ""
);

console.log(
  failed === 0
    ? "RESULT: PASS"
    : "RESULT: FAIL"
);


if (
  failed > 0
) {

  console.dir(
    {
      player_fit:
        playerFit,

      decision,

      player_decision:
        playerDecision
    },
    {
      depth:
        10
    }
  );


  process.exitCode =
    1;
}
