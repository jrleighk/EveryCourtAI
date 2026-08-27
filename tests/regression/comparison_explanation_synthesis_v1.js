import {
  buildComparisonExplanationSynthesis
} from "../../engine/comparison_explanation_synthesis_v1.js";


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


const comparisonAnswer = {
  engine:
    "comparison_answer_builder",

  version:
    "1.0",

  success:
    true,

  status:
    "comparison_answer_ready",

  products: {
    product_a: {
      id:
        "babolat_pure_drive_spectra_edition_2026",

      brand:
        "Babolat",

      model:
        "Pure Drive Spectra Edition 2026"
    },

    product_b: {
      id:
        "wilson_rf_01_pro_classic",

      brand:
        "Wilson",

      model:
        "RF 01 Pro Classic"
    }
  },

  objective: {
    available:
      true,

    dna: [
      {
        key:
          "power",

        available:
          true,

        value_a:
          9,

        value_b:
          8,

        relation:
          "a_higher",

        higher_product:
          "a"
      },

      {
        key:
          "control",

        available:
          true,

        value_a:
          7,

        value_b:
          9,

        relation:
          "b_higher",

        higher_product:
          "b"
      },

      {
        key:
          "spin",

        available:
          true,

        value_a:
          8,

        value_b:
          8,

        relation:
          "equal",

        higher_product:
          "equal"
      },

      {
        key:
          "comfort",

        available:
          true,

        value_a:
          8,

        value_b:
          8,

        relation:
          "equal",

        higher_product:
          "equal"
      }
    ],

    specifications: [
      {
        key:
          "head_size_sq_in",

        available:
          true,

        value_a:
          100,

        value_b:
          98,

        relation:
          "a_higher",

        higher_product:
          "a"
      },

      {
        key:
          "weight_unstrung_g",

        available:
          true,

        value_a:
          300,

        value_b:
          320,

        relation:
          "b_higher",

        higher_product:
          "b"
      },

      {
        key:
          "balance_unstrung_mm",

        available:
          true,

        value_a:
          320,

        value_b:
          310,

        relation:
          "a_higher",

        higher_product:
          "a"
      },

      {
        key:
          "swingweight",

        available:
          true,

        value_a:
          290,

        value_b:
          335,

        relation:
          "b_higher",

        higher_product:
          "b"
      }
    ]
  },

  player_fit: {
    available:
      true
  },

  decision: {
    performance_preference: {
      available:
        true,

      preferred_product:
        "a",

      reason:
        "higher_player_fit",

      delta:
        1
    },

    practical_preference: {
      available:
        true,

      preferred_product:
        "b",

      reason:
        "higher_practical_score",

      delta:
        -5
    }
  }
};


const semanticResult = {
  engine:
    "comparison_semantic_engine",

  version:
    "1.0",

  success:
    true,

  status:
    "comparison_semantics_ready",

  semantics: {
    head_size: {
      key:
        "head_size_sq_in",

      available:
        true,

      higher_product:
        "a",

      lower_product:
        "b",

      implications: [
        "larger_head_more_forgiveness_potential",
        "larger_head_larger_effective_hitting_area",
        "smaller_head_more_compact_response"
      ]
    },

    static_weight: {
      key:
        "weight_unstrung_g",

      available:
        true,

      higher_product:
        "b",

      lower_product:
        "a",

      implications: [
        "heavier_frame_more_mass",
        "heavier_frame_more_swing_demand",
        "lighter_frame_easier_acceleration"
      ]
    },

    balance: {
      key:
        "balance_unstrung_mm",

      available:
        true,

      higher_product:
        "a",

      lower_product:
        "b",

      implications: [
        "higher_balance_more_headward",
        "lower_balance_more_head_light",
        "more_head_light_supports_maneuverability"
      ]
    },

    swingweight: {
      key:
        "swingweight",

      available:
        true,

      higher_product:
        "b",

      lower_product:
        "a",

      implications: [
        "higher_swingweight_more_dynamic_mass",
        "higher_swingweight_more_stability_potential",
        "higher_swingweight_more_plow_through_potential",
        "higher_swingweight_more_swing_demand",
        "lower_swingweight_easier_acceleration"
      ]
    },

    stiffness: {
      key:
        "stiffness_ra",

      available:
        false,

      higher_product:
        null,

      lower_product:
        null,

      implications: []
    }
  }
};


const result =
  buildComparisonExplanationSynthesis(
    comparisonAnswer,
    semanticResult
  );


test(
  "synthesis_success",
  result.success === true
);


test(
  "synthesis_status",
  result.status ===
    "comparison_explanation_synthesis_ready"
);


test(
  "ease_cluster_available",
  result.clusters
    ?.ease_and_demand
    ?.available === true
);


test(
  "ease_cluster_prefers_a",
  result.clusters
    ?.ease_and_demand
    ?.primary_product === "a"
);


test(
  "ease_cluster_higher_demand_b",
  result.clusters
    ?.ease_and_demand
    ?.secondary_product === "b"
);


test(
  "ease_cluster_has_weight",
  result.clusters
    ?.ease_and_demand
    ?.evidence
    ?.some(
      item =>
        item.key ===
        "weight_unstrung_g"
    )
);


test(
  "ease_cluster_has_swingweight",
  result.clusters
    ?.ease_and_demand
    ?.evidence
    ?.some(
      item =>
        item.key ===
        "swingweight"
    )
);


test(
  "forgiveness_cluster_available",
  result.clusters
    ?.forgiveness
    ?.available === true
);


test(
  "forgiveness_cluster_prefers_a",
  result.clusters
    ?.forgiveness
    ?.primary_product === "a"
);


test(
  "stability_cluster_available",
  result.clusters
    ?.stability_and_plow
    ?.available === true
);


test(
  "stability_cluster_prefers_b",
  result.clusters
    ?.stability_and_plow
    ?.primary_product === "b"
);


test(
  "performance_identity_available",
  result.clusters
    ?.performance_identity
    ?.available === true
);


test(
  "performance_identity_power_a",
  result.clusters
    ?.performance_identity
    ?.evidence
    ?.find(
      item =>
        item.key === "power"
    )
    ?.higher_product === "a"
);


test(
  "performance_identity_control_b",
  result.clusters
    ?.performance_identity
    ?.evidence
    ?.find(
      item =>
        item.key === "control"
    )
    ?.higher_product === "b"
);


test(
  "decision_cluster_available",
  result.clusters
    ?.player_decision
    ?.available === true
);


test(
  "performance_pref_preserved",
  result.clusters
    ?.player_decision
    ?.performance_preference
    ?.preferred_product === "a"
);


test(
  "practical_pref_preserved",
  result.clusters
    ?.player_decision
    ?.practical_preference
    ?.preferred_product === "b"
);


test(
  "decision_conflict_detected",
  result.clusters
    ?.player_decision
    ?.decision_conflict === true
);


const invalid =
  buildComparisonExplanationSynthesis(
    null,
    null
  );


test(
  "invalid_input_rejected",
  invalid.success === false &&
  invalid.status ===
    "comparison_explanation_synthesis_not_ready"
);


console.log(
  "========================================"
);

console.log(
  "COMPARISON EXPLANATION SYNTHESIS V1"
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


const failed =
  tests.length -
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
  `Total: ${tests.length}`
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


if (
  failed > 0
) {
  process.exitCode = 1;
}
