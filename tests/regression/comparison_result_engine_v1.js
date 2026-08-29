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


function createTest(
  id,
  pass
) {

  return {
    id,
    pass:
      pass === true
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


const playerResult =
  buildComparisonResult(
    loaded.product_a.product,
    loaded.product_b.product,
    matchingA,
    matchingB,
    createPlayerProfile()
  );


const objectiveOnlyResult =
  buildComparisonResult(
    loaded.product_a.product,
    loaded.product_b.product,
    null,
    null,
    null
  );


const tests = [];


/**
 * ============================================================
 * Result Contract
 * ============================================================
 */

tests.push(
  createTest(
    "result_success",
    playerResult.success === true
  )
);


tests.push(
  createTest(
    "result_status",
    playerResult.status ===
      "comparison_result_ready"
  )
);


/**
 * ============================================================
 * Product Identity
 * ============================================================
 */

tests.push(
  createTest(
    "product_a_identity",
    playerResult.products
      ?.product_a
      ?.id === PRODUCT_A
  )
);


tests.push(
  createTest(
    "product_b_identity",
    playerResult.products
      ?.product_b
      ?.id === PRODUCT_B
  )
);


/**
 * ============================================================
 * Objective Comparison
 * ============================================================
 */

tests.push(
  createTest(
    "objective_available",
    playerResult.objective_analysis
      ?.success === true
  )
);


tests.push(
  createTest(
    "pure_drive_more_power",
    playerResult.objective_analysis
      ?.dna
      ?.power
      ?.relation ===
        "a_higher"
  )
);


tests.push(
  createTest(
    "rf01_more_control",
    playerResult.objective_analysis
      ?.dna
      ?.control
      ?.relation ===
        "b_higher"
  )
);


tests.push(
  createTest(
    "spin_equal",
    playerResult.objective_analysis
      ?.dna
      ?.spin
      ?.relation ===
        "equal"
  )
);


tests.push(
  createTest(
    "rf01_heavier",
    playerResult.objective_analysis
      ?.specifications
      ?.weight_unstrung_g
      ?.relation ===
        "b_higher"
  )
);


tests.push(
  createTest(
    "swingweight_basis_unverified",
    playerResult.objective_analysis
      ?.specifications
      ?.swingweight
      ?.available === false &&
    playerResult.objective_analysis
      ?.specifications
      ?.swingweight
      ?.relation ===
        "unavailable" &&
    playerResult.objective_analysis
      ?.specifications
      ?.swingweight
      ?.reason ===
        "measurement_basis_unverified"
  )
);


/**
 * ============================================================
 * Player Fit
 * ============================================================
 */

tests.push(
  createTest(
    "player_fit_available",
    playerResult.player_fit
      ?.available === true
  )
);


tests.push(
  createTest(
    "pure_drive_performance_fit",
    playerResult.player_fit
      ?.analysis
      ?.product_a
      ?.performance_fit_score ===
        65
  )
);


tests.push(
  createTest(
    "rf01_performance_fit",
    playerResult.player_fit
      ?.analysis
      ?.product_b
      ?.performance_fit_score ===
        64
  )
);


tests.push(
  createTest(
    "rf01_continuity_bonus",
    playerResult.player_fit
      ?.analysis
      ?.product_b
      ?.continuity_bonus ===
        6
  )
);


/**
 * ============================================================
 * Performance Preference
 * ============================================================
 */

tests.push(
  createTest(
    "performance_prefers_pure_drive",
    playerResult.player_fit
      ?.performance_preference
      ?.preferred_product ===
        "a"
  )
);


tests.push(
  createTest(
    "performance_fit_delta",
    playerResult.player_fit
      ?.performance_preference
      ?.fit_delta ===
        1
  )
);


/**
 * ============================================================
 * Practical Preference
 * ============================================================
 */

tests.push(
  createTest(
    "practical_prefers_rf01",
    playerResult.player_fit
      ?.practical_preference
      ?.preferred_product ===
        "b"
  )
);


tests.push(
  createTest(
    "practical_score_delta",
    playerResult.player_fit
      ?.practical_preference
      ?.score_delta ===
        -5
  )
);


/**
 * ============================================================
 * Objective-Only Mode
 * ============================================================
 */

tests.push(
  createTest(
    "objective_only_success",
    objectiveOnlyResult.success === true
  )
);


tests.push(
  createTest(
    "objective_only_analysis_available",
    objectiveOnlyResult
      .objective_analysis
      ?.success === true
  )
);


tests.push(
  createTest(
    "objective_only_player_fit_unavailable",
    objectiveOnlyResult
      .player_fit
      ?.available === false
  )
);


tests.push(
  createTest(
    "objective_only_no_performance_preference",
    objectiveOnlyResult
      .player_fit
      ?.performance_preference
      ?.preferred_product === null
  )
);


tests.push(
  createTest(
    "objective_only_no_practical_preference",
    objectiveOnlyResult
      .player_fit
      ?.practical_preference
      ?.preferred_product === null
  )
);


/**
 * ============================================================
 * Report
 * ============================================================
 */

console.log(
  "========================================"
);

console.log(
  "COMPARISON RESULT ENGINE V1"
);

console.log(
  "========================================"
);


console.table(
  tests
);


const passed =
  tests.filter(
    test =>
      test.pass
  ).length;


const failed =
  tests.length -
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
  `Total: ${tests.length}`
);

console.log(
  `Passed: ${passed}`
);

console.log(
  `Failed: ${failed}`
);


if (
  failed > 0
) {

  console.log(
    ""
  );

  console.log(
    "RESULT: FAIL"
  );

  process.exitCode =
    1;

} else {

  console.log(
    ""
  );

  console.log(
    "RESULT: PASS"
  );
}
