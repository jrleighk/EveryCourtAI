import {
  buildTensionFocusedAnswer
} from "../../engine/intent_answer_builder_v1.js";


console.log(
  "========================================"
);
console.log(
  "INTENT ANSWER BUILDER V1"
);
console.log(
  "========================================"
);


const baseEngineResult = {

  recommendation: {

    tension_decision: {
      action:
        "adjust",

      current_tension_lbs:
        54,

      recommended_tension_lbs:
        52,

      delta_lbs:
        -2,

      reason:
        "A moderate tension adjustment is recommended."
    },

    tension: {
      main_lbs:
        52,

      cross_lbs:
        null,

      working_range_lbs: {
        minimum_lbs:
          50,

        maximum_lbs:
          54
      }
    }
  },

  explanation: {

    recommendation: {

      tension: {

        main_lbs:
          52,

        cross_lbs:
          null,

        working_range_lbs: {
          minimum_lbs:
            50,

          maximum_lbs:
            54
        },

        reason: {
          en:
            "Tension is kept moderate to preserve control and string movement.",

          zh:
            "磅数保持在适中区间，以兼顾控制与球线移动。"
        }
      }
    }
  }
};


const cases = [

  {
    id:
      "zh_tension_focused",

    language:
      "zh",

    expected_available:
      true,

    expected_tension:
      52,

    expected_current:
      54,

    expected_delta:
      -2,

    expected_text:
      "建议磅数：52 lbs。"
  },

  {
    id:
      "en_tension_focused",

    language:
      "en",

    expected_available:
      true,

    expected_tension:
      52,

    expected_current:
      54,

    expected_delta:
      -2,

    expected_text:
      "Recommended tension: 52 lbs."
  },

  {
    id:
      "zh_tw_supported",

    language:
      "zh-tw",

    expected_available:
      true,

    expected_tension:
      52,

    expected_current:
      54,

    expected_delta:
      -2,

    expected_text:
      "建议磅数：52 lbs。"
  }

];


let passed = 0;
let failed = 0;

const rows = [];


for (const test of cases) {

  const result =
    buildTensionFocusedAnswer(
      baseEngineResult,
      test.language
    );


  const pass =
    result.response_mode ===
      "tension_focused" &&
    result.available ===
      test.expected_available &&
    result.data
      ?.recommended_tension_lbs ===
      test.expected_tension &&
    result.data
      ?.current_tension_lbs ===
      test.expected_current &&
    result.data
      ?.delta_lbs ===
      test.expected_delta &&
    result.answer
      ?.includes(
        test.expected_text
      );


  if (pass) {
    passed++;
  } else {
    failed++;
  }


  rows.push({
    id:
      test.id,

    available:
      result.available,

    recommended:
      result.data
        ?.recommended_tension_lbs,

    current:
      result.data
        ?.current_tension_lbs,

    delta:
      result.data
        ?.delta_lbs,

    pass
  });
}


/**
 * Missing recommendation fallback
 */

const unavailable =
  buildTensionFocusedAnswer(
    {
      recommendation: {},
      explanation: {}
    },
    "en"
  );


const unavailablePass =
  unavailable.available ===
    false &&
  unavailable.response_mode ===
    "tension_focused" &&
  unavailable.data
    ?.recommended_tension_lbs ===
    null;


if (unavailablePass) {
  passed++;
} else {
  failed++;
}


rows.push({
  id:
    "missing_tension_fallback",

  available:
    unavailable.available,

  recommended:
    unavailable.data
      ?.recommended_tension_lbs,

  current:
    unavailable.data
      ?.current_tension_lbs,

  delta:
    unavailable.data
      ?.delta_lbs,

  pass:
    unavailablePass
});


console.table(
  rows
);


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
  `Total: ${rows.length}`
);

console.log(
  `Passed: ${passed}`
);

console.log(
  `Failed: ${failed}`
);


if (failed > 0) {

  console.log("");
  console.log(
    "RESULT: FAIL"
  );

  process.exit(1);
}


console.log("");
console.log(
  "RESULT: PASS"
);
