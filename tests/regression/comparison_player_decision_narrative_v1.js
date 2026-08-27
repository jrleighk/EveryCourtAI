import {
  buildPlayerDecisionNarrative
} from "../../engine/comparison_player_decision_narrative_v1.js";


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


const base = {
  engine:
    "comparison_explanation_synthesis",

  version:
    "1.0",

  success:
    true,

  status:
    "comparison_explanation_synthesis_ready",

  products: {
    product_a: {
      id:
        "babolat_pure_drive_spectra_edition_2026",

      display_name:
        "Babolat Pure Drive Spectra Edition 2026"
    },

    product_b: {
      id:
        "wilson_rf_01_pro_classic",

      display_name:
        "Wilson RF 01 Pro Classic"
    }
  }
};


const conflict =
  buildPlayerDecisionNarrative({
    ...base,

    clusters: {
      player_decision: {
        id:
          "player_decision",

        available:
          true,

        performance_preference: {
          preferred_product:
            "a",

          reason:
            "higher_performance_fit",

          delta:
            4
        },

        practical_preference: {
          preferred_product:
            "b",

          reason:
            "higher_practical_score",

          delta:
            -2
        },

        decision_conflict:
          true
      }
    }
  });


test(
  "conflict_success",
  conflict.success === true
);


test(
  "conflict_available",
  conflict.available === true
);


test(
  "conflict_status",
  conflict.status ===
    "player_decision_narrative_ready"
);


test(
  "conflict_detected",
  conflict.decision_conflict === true
);


test(
  "performance_a_preserved",
  conflict
    ?.performance_preference
    ?.preferred_product ===
      "a"
);


test(
  "practical_b_preserved",
  conflict
    ?.practical_preference
    ?.preferred_product ===
      "b"
);


test(
  "conflict_cn_contains_both",
  conflict.cn.includes(
    "Pure Drive Spectra Edition 2026"
  ) &&
  conflict.cn.includes(
    "RF 01 Pro Classic"
  )
);


test(
  "conflict_cn_performance",
  conflict.cn.includes(
    "性能匹配"
  )
);


test(
  "conflict_cn_practical",
  conflict.cn.includes(
    "实际使用"
  )
);


test(
  "conflict_en_contains_both",
  conflict.en.includes(
    "Pure Drive Spectra Edition 2026"
  ) &&
  conflict.en.includes(
    "RF 01 Pro Classic"
  )
);


const aligned =
  buildPlayerDecisionNarrative({
    ...base,

    clusters: {
      player_decision: {
        id:
          "player_decision",

        available:
          true,

        performance_preference: {
          preferred_product:
            "a",

          reason:
            "higher_performance_fit",

          delta:
            3
        },

        practical_preference: {
          preferred_product:
            "a",

          reason:
            "higher_practical_score",

          delta:
            2
        },

        decision_conflict:
          false
      }
    }
  });


test(
  "aligned_available",
  aligned.available === true
);


test(
  "aligned_no_conflict",
  aligned.decision_conflict === false
);


test(
  "aligned_cn_consistent",
  aligned.cn.includes(
    "一致偏好"
  )
);


test(
  "aligned_en_consistent",
  aligned.en.includes(
    "Both performance fit"
  )
);


const unavailable =
  buildPlayerDecisionNarrative({
    ...base,

    clusters: {
      player_decision: {
        id:
          "player_decision",

        available:
          false,

        performance_preference:
          null,

        practical_preference:
          null,

        decision_conflict:
          false
      }
    }
  });


test(
  "unavailable_preserved",
  unavailable.available === false &&
  unavailable.status ===
    "player_decision_narrative_unavailable"
);


const invalid =
  buildPlayerDecisionNarrative(
    null
  );


test(
  "invalid_rejected",
  invalid.success === false &&
  invalid.status ===
    "player_decision_narrative_not_ready"
);


console.log(
  "========================================"
);

console.log(
  "COMPARISON PLAYER DECISION NARRATIVE V1"
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


console.log("");

console.log(
  "========================================"
);

console.log(
  "CONFLICT LANGUAGE PROBE"
);

console.log(
  "========================================"
);

console.log(
  conflict.cn
);

console.log(
  conflict.en
);


if (
  failed > 0
) {
  process.exitCode = 1;
}
