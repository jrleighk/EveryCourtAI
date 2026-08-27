import {
  runComparisonOrchestrator
} from "../../engine/comparison_orchestrator_v1.js";


const tests = [];


function test(
  id,
  pass
) {

  tests.push({
    id,
    pass:
      Boolean(
        pass
      )
  });
}


/**
 * ============================================================
 * Objective Comparison
 * ============================================================
 */

const objective =
  await runComparisonOrchestrator({
    message:
      "Babolat Pure Drive Spectra Edition 2026 和 Wilson RF 01 Pro Classic 对比",

    language:
      "zh"
  });


test(
  "objective_success",
  objective.success === true
);


test(
  "objective_ready",
  objective.ready === true
);


test(
  "objective_status",
  objective.status ===
    "comparison_orchestrator_ready"
);


test(
  "objective_product_a",
  objective
    ?.products
    ?.product_a
    ?.id ===
    "babolat_pure_drive_spectra_edition_2026"
);


test(
  "objective_product_b",
  objective
    ?.products
    ?.product_b
    ?.id ===
    "wilson_rf_01_pro_classic"
);


test(
  "objective_answer_ready",
  objective
    ?.comparison
    ?.answer
    ?.status ===
    "comparison_answer_ready"
);


test(
  "objective_semantics_ready",
  objective
    ?.interpretation
    ?.semantics
    ?.status ===
    "comparison_semantics_ready"
);


test(
  "objective_synthesis_ready",
  objective
    ?.interpretation
    ?.synthesis
    ?.status ===
    "comparison_explanation_synthesis_ready"
);


test(
  "objective_narrative_ready",
  objective
    ?.interpretation
    ?.narrative
    ?.status ===
    "comparison_explanation_narrative_ready"
);


test(
  "objective_player_decision_unavailable",
  objective
    ?.interpretation
    ?.player_decision_narrative
    ?.available !== true
);


/**
 * ============================================================
 * Player-Aware Comparison
 * ============================================================
 */

const playerProfile = {
  primary_goal:
    "more_control",

  playing_style: {
    primary:
      "all_court"
  },

  swing_speed: {
    overall:
      "medium"
  },

  preferences: {
    feel:
      null,

    launch_angle:
      null
  },

  physical: {},

  current_setup: {
    racquet: {
      id:
        "wilson_rf_01_pro_classic"
    }
  }
};


const playerAware =
  await runComparisonOrchestrator({
    message:
      "Babolat Pure Drive Spectra Edition 2026 和 Wilson RF 01 Pro Classic 对比",

    playerProfile,

    language:
      "zh"
  });


test(
  "player_aware_success",
  playerAware.success === true
);


test(
  "player_fit_available",
  playerAware
    ?.comparison
    ?.answer
    ?.player_fit
    ?.available === true
);


test(
  "performance_preference_a",
  playerAware
    ?.comparison
    ?.answer
    ?.decision
    ?.performance_preference
    ?.preferred_product ===
    "a"
);


test(
  "practical_preference_b",
  playerAware
    ?.comparison
    ?.answer
    ?.decision
    ?.practical_preference
    ?.preferred_product ===
    "b"
);


test(
  "decision_conflict",
  playerAware
    ?.interpretation
    ?.synthesis
    ?.clusters
    ?.player_decision
    ?.decision_conflict ===
    true
);


test(
  "decision_narrative_available",
  playerAware
    ?.interpretation
    ?.player_decision_narrative
    ?.available ===
    true
);


test(
  "decision_cn_generated",
  typeof playerAware
    ?.interpretation
    ?.player_decision_narrative
    ?.cn ===
    "string" &&
  playerAware
    .interpretation
    .player_decision_narrative
    .cn
    .length > 0
);


test(
  "decision_en_generated",
  typeof playerAware
    ?.interpretation
    ?.player_decision_narrative
    ?.en ===
    "string" &&
  playerAware
    .interpretation
    .player_decision_narrative
    .en
    .length > 0
);


/**
 * ============================================================
 * Invalid Input
 * ============================================================
 */

const invalid =
  await runComparisonOrchestrator({
    message:
      ""
  });


test(
  "invalid_input_rejected",
  invalid.success === false
);


test(
  "invalid_input_not_ready",
  invalid.ready === false
);


/**
 * ============================================================
 * Summary
 * ============================================================
 */

console.log(
  "========================================"
);

console.log(
  "COMPARISON ORCHESTRATOR V1"
);

console.log(
  "========================================"
);


console.table(
  tests
);


const passed =
  tests.filter(
    item =>
      item.pass
  ).length;


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
  `Total: ${tests.length}`
);

console.log(
  `Passed: ${passed}`
);

console.log(
  `Failed: ${tests.length - passed}`
);

console.log("");

console.log(
  passed === tests.length
    ? "RESULT: PASS"
    : "RESULT: FAIL"
);


if (
  passed !== tests.length
) {

  process.exitCode =
    1;
}
