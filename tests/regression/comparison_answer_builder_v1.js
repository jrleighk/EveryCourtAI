import {
  RACQUET_PRODUCT_REGISTRY
} from "../../engine/product_registry.generated.js";

import {
  matchingHelpers
} from "../../engine/matching_engine.js";

import {
  loadComparisonPair
} from "../../engine/comparison_product_loader_v1.js";

import {
  buildComparisonResult
} from "../../engine/comparison_result_engine_v1.js";

import {
  buildComparisonAnswer
} from "../../engine/comparison_answer_builder_v1.js";

import {
  loadKnowledgeJson
} from "../../utils/runtime_json_loader.js";


const PRODUCT_A =
  "babolat_pure_drive_spectra_edition_2026";

const PRODUCT_B =
  "wilson_rf_01_pro_classic";


async function loadMatchingRacquet(
  id
) {

  const registry =
    RACQUET_PRODUCT_REGISTRY.find(
      item =>
        item.id === id
    );


  if (
    !registry?.source_file
  ) {
    throw new Error(
      `Missing registry entry: ${id}`
    );
  }


  const raw =
    await loadKnowledgeJson(
      registry.source_file
    );


  return matchingHelpers
    .extractRacquetData(
      raw
    );
}


function createPlayerProfile() {

  return {
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

    physical:
      {},

    current_setup: {
      racquet: {
        id:
          PRODUCT_B
      }
    }
  };
}


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


const loaded =
  await loadComparisonPair(
    PRODUCT_A,
    PRODUCT_B
  );


if (
  loaded.success !== true
) {
  throw new Error(
    "Comparison pair load failed."
  );
}


const matchingA =
  await loadMatchingRacquet(
    PRODUCT_A
  );


const matchingB =
  await loadMatchingRacquet(
    PRODUCT_B
  );


const comparisonResult =
  buildComparisonResult(
    loaded.product_a.product,
    loaded.product_b.product,
    matchingA,
    matchingB,
    createPlayerProfile()
  );


const answer =
  buildComparisonAnswer(
    comparisonResult
  );


const objectiveOnlyResult =
  buildComparisonResult(
    loaded.product_a.product,
    loaded.product_b.product,
    null,
    null,
    null
  );


const objectiveOnlyAnswer =
  buildComparisonAnswer(
    objectiveOnlyResult
  );


const invalidAnswer =
  buildComparisonAnswer(
    null
  );


const cases = [
  test(
    "answer_success",
    answer.success === true
  ),

  test(
    "answer_status",
    answer.status ===
      "comparison_answer_ready"
  ),

  test(
    "product_a_identity",
    answer.products
      ?.product_a
      ?.id === PRODUCT_A
  ),

  test(
    "product_b_identity",
    answer.products
      ?.product_b
      ?.id === PRODUCT_B
  ),

  test(
    "product_a_display_name",
    answer.products
      ?.product_a
      ?.display_name ===
        "Babolat Pure Drive Spectra Edition 2026"
  ),

  test(
    "product_b_display_name",
    answer.products
      ?.product_b
      ?.display_name ===
        "Wilson RF 01 Pro Classic"
  ),

  test(
    "objective_available",
    answer.objective
      ?.available === true
  ),

  test(
    "dna_row_count",
    answer.objective
      ?.dna
      ?.length === 4
  ),

  test(
    "specification_row_count",
    answer.objective
      ?.specifications
      ?.length === 6
  ),

  test(
    "metric_availability_preserved",
    answer
        ?.objective
        ?.dna
        ?.find(
            row =>
                row.key ===
                "power"
        )
        ?.available ===
        true
),


test(
    "spec_availability_preserved",
    answer
        ?.objective
        ?.specifications
        ?.find(
            row =>
                row.key ===
                "weight_unstrung_g"
        )
        ?.available ===
        true
),


test(
    "power_row",
    answer.objective
      ?.dna
      ?.find(
        item =>
          item.key === "power"
      )
      ?.higher_product === "a"
  ),

  test(
    "control_row",
    answer.objective
      ?.dna
      ?.find(
        item =>
          item.key === "control"
      )
      ?.higher_product === "b"
  ),

  test(
    "spin_equal",
    answer.objective
      ?.dna
      ?.find(
        item =>
          item.key === "spin"
      )
      ?.higher_product === "equal"
  ),

  test(
    "weight_row",
    answer.objective
      ?.specifications
      ?.find(
        item =>
          item.key ===
            "weight_unstrung_g"
      )
      ?.higher_product === "b"
  ),

  test(
    "swingweight_row_suppressed",
    answer.objective
      ?.specifications
      ?.some(
        item =>
          item.key ===
            "swingweight"
      ) === false
  ),

  test(
    "player_fit_available",
    answer.player_fit
      ?.available === true
  ),

  test(
    "pure_drive_performance_fit",
    answer.player_fit
      ?.product_a
      ?.performance_fit_score === 65
  ),

  test(
    "rf01_performance_fit",
    answer.player_fit
      ?.product_b
      ?.performance_fit_score === 64
  ),

  test(
    "rf01_continuity_bonus",
    answer.player_fit
      ?.product_b
      ?.continuity_bonus === 6
  ),

  test(
    "performance_prefers_a",
    answer.decision
      ?.performance_preference
      ?.preferred_product === "a"
  ),

  test(
    "performance_delta",
    answer.decision
      ?.performance_preference
      ?.delta === 1
  ),

  test(
    "practical_prefers_b",
    answer.decision
      ?.practical_preference
      ?.preferred_product === "b"
  ),

  test(
    "practical_delta",
    answer.decision
      ?.practical_preference
      ?.delta === -5
  ),

  test(
    "objective_only_success",
    objectiveOnlyAnswer
      ?.success === true
  ),

  test(
    "objective_only_available",
    objectiveOnlyAnswer
      ?.objective
      ?.available === true
  ),

  test(
    "objective_only_player_fit_unavailable",
    objectiveOnlyAnswer
      ?.player_fit
      ?.available === false
  ),

  test(
    "invalid_input_rejected",
    invalidAnswer
      ?.success === false &&
    invalidAnswer
      ?.status ===
        "comparison_answer_not_ready"
  )
];


console.log(
  "========================================"
);

console.log(
  "COMPARISON ANSWER BUILDER V1"
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
  ""
);

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
  process.exitCode = 1;
}
