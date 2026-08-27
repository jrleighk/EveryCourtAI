import {
  buildIntentResponse
} from "../../engine/intent_response_engine_v1.js";


console.log(
  "========================================"
);
console.log(
  "INTENT RESPONSE ENGINE V1"
);
console.log(
  "========================================"
);


const engineResult = {
  recommendation: {
    tension_decision: {
      action: "adjust",
      current_tension_lbs: 54,
      recommended_tension_lbs: 52,
      delta_lbs: -2,
      reason:
        "A moderate tension adjustment is recommended."
    },

    tension: {
      main_lbs: 52,
      cross_lbs: null,
      working_range_lbs: {
        minimum_lbs: 50,
        maximum_lbs: 54
      }
    }
  },

  explanation: {
    recommendation: {
      tension: {
        reason: {
          zh:
            "磅数保持在适中区间，以兼顾控制与球线移动。",
          en:
            "Tension is kept moderate to preserve control and string movement."
        }
      }
    }
  }
};


const cases = [

  {
    id:
      "tension_handled",

    intent:
      "adjust_tension",

    expected_mode:
      "tension_focused",

    expected_handled:
      true,

    expected_reason:
      null
  },

  {
    id:
      "recommend_passthrough",

    intent:
      "recommend_setup",

    expected_mode:
      "full_recommendation",

    expected_handled:
      false,

    expected_reason:
      "specialized_builder_not_connected"
  },

  {
    id:
      "explanation_unavailable",

    intent:
      "explain_current_setup",

    expected_mode:
      "explanation_focused",

    expected_handled:
      false,

    expected_reason:
      "explanation_unavailable"
  },

  {
    id:
      "comparison_pending",

    intent:
      "compare_products",

    expected_mode:
      "comparison_pending",

    expected_handled:
      false,

    expected_reason:
      "capability_pending"
  },

  {
    id:
      "general_pending",

    intent:
      "general_tennis_question",

    expected_mode:
      "general_question_pending",

    expected_handled:
      false,

    expected_reason:
      "capability_pending"
  },

  {
    id:
      "unknown_fallback",

    intent:
      "unknown",

    expected_mode:
      "default",

    expected_handled:
      false,

    expected_reason:
      "fallback"
  }

];


let passed = 0;
let failed = 0;

const rows = [];


for (const test of cases) {

  const result =
    buildIntentResponse({
      questionIntentResult: {
        primary_intent:
          test.intent,

        context:
          {}
      },

      engineResult,

      language:
        "zh"
    });


  const reason =
    result.reason ??
    null;


  const tensionAnswerPass =
    test.intent !==
      "adjust_tension" ||
    (
      typeof result.answer ===
        "string" &&
      result.answer.includes(
        "建议磅数：52 lbs。"
      ) &&
      result.data
        ?.recommended_tension_lbs ===
        52 &&
      result.data
        ?.current_tension_lbs ===
        54 &&
      result.data
        ?.delta_lbs ===
        -2
    );


  const pass =
    result.response_mode ===
      test.expected_mode &&
    result.handled ===
      test.expected_handled &&
    reason ===
      test.expected_reason &&
    tensionAnswerPass;


  if (pass) {
    passed++;
  } else {
    failed++;
  }


  rows.push({
    id:
      test.id,

    mode:
      result.response_mode,

    handled:
      result.handled,

    reason,

    pass
  });
}


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
  `Total: ${cases.length}`
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
