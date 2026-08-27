import {
  RACQUET_PRODUCT_REGISTRY
} from "../../engine/product_registry.generated.js";

import {
  matchingHelpers
} from "../../engine/matching_engine.js";

import {
  analyzePlayerRacquetComparison
} from "../../engine/player_comparison_engine_v1.js";

import {
  loadKnowledgeJson
} from "../../utils/runtime_json_loader.js";


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

    physical: {},

    current_setup: {
      racquet: {
        id:
          "wilson_rf_01_pro_classic"
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


const pureDrive =
  await loadMatchingRacquet(
    "babolat_pure_drive_spectra_edition_2026"
  );

const rf01 =
  await loadMatchingRacquet(
    "wilson_rf_01_pro_classic"
  );

const playerProfile =
  createPlayerProfile();

const result =
  analyzePlayerRacquetComparison(
    pureDrive,
    rf01,
    playerProfile
  );


const cases = [
  test(
    "comparison_success",
    result.success === true &&
    result.status ===
      "player_comparison_ready"
  ),

  test(
    "product_identity",
    result.product_a?.id ===
      "babolat_pure_drive_spectra_edition_2026" &&
    result.product_b?.id ===
      "wilson_rf_01_pro_classic"
  ),

  test(
    "pure_drive_match_score",
    result.product_a?.match_score ===
      65
  ),

  test(
    "rf01_match_score",
    result.product_b?.match_score ===
      70
  ),

  test(
    "pure_drive_performance_fit",
    result.product_a
      ?.performance_fit_score ===
      65
  ),

  test(
    "rf01_continuity_bonus",
    result.product_b
      ?.continuity_bonus ===
      6
  ),

  test(
    "rf01_performance_fit_removes_continuity",
    result.product_b
      ?.performance_fit_score ===
      64
  ),

  test(
    "pure_drive_preferred",
    result.preferred_product ===
      "a"
  ),

  test(
    "preference_reason",
    result.preference_reason ===
      "higher_player_fit"
  ),

  test(
    "fit_delta",
    result.fit_delta ===
      1
  ),

  test(
    "pure_drive_static_weight_component",
    result.product_a
      ?.score_breakdown
      ?.static_weight_fit ===
      6
  ),

  test(
    "pure_drive_swingweight_component",
    result.product_a
      ?.score_breakdown
      ?.swingweight_fit ===
      3
  ),

  test(
    "rf01_swingweight_component",
    result.product_b
      ?.score_breakdown
      ?.swingweight_fit ===
      -1
  )
];


console.log(
  "========================================"
);

console.log(
  "PLAYER COMPARISON ENGINE V1"
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
  process.exitCode = 1;
}
