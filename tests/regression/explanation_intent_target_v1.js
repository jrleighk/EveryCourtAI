import {
  detectQuestionIntent
} from "../../engine/question_intent_engine.js";


console.log(
  "========================================"
);
console.log(
  "EXPLANATION INTENT TARGET V1"
);
console.log(
  "========================================"
);


const cases = [

  {
    id: "why_string_cn",
    message:
      "为什么你推荐我换这条球线？",
    expected_intent:
      "explain_current_setup",
    expected_target:
      "string",
    expected_explanation:
      true
  },

  {
    id: "why_racquet_cn",
    message:
      "为什么这个球拍更适合我？",
    expected_intent:
      "explain_current_setup",
    expected_target:
      "racquet",
    expected_explanation:
      true
  },

  {
    id: "why_tension_cn",
    message:
      "为什么建议我降低磅数？",
    expected_intent:
      "explain_current_setup",
    expected_target:
      "tension",
    expected_explanation:
      true
  },

  {
    id: "why_setup_cn",
    message:
      "为什么你推荐这个配置？",
    expected_intent:
      "explain_current_setup",
    expected_target:
      "setup",
    expected_explanation:
      true
  },

  {
    id: "tension_request_cn",
    message:
      "我这个配置应该拉多少磅？",
    expected_intent:
      "adjust_tension",
    expected_target:
      "tension",
    expected_explanation:
      false
  },

  {
    id: "tension_adjust_cn",
    message:
      "帮我把现在的磅数调低一点。",
    expected_intent:
      "adjust_tension",
    expected_target:
      "tension",
    expected_explanation:
      false
  },

  {
    id: "comparison_explanation_cn",
    message:
      "为什么 Pure Drive 比 RF01 更适合我？",
    expected_intent:
      "compare_products",
    expected_target:
      null,
    expected_explanation:
      true
  },

  {
    id: "why_tension_en",
    message:
      "Why this tension?",
    expected_intent:
      "explain_current_setup",
    expected_target:
      "tension",
    expected_explanation:
      true
  },

  {
    id: "tension_request_en",
    message:
      "What tension should I use?",
    expected_intent:
      "adjust_tension",
    expected_target:
      "tension",
    expected_explanation:
      false
  }

];


let passed = 0;
let failed = 0;

const rows = [];


for (const test of cases) {

  const result =
    detectQuestionIntent(
      test.message
    );


  const intentPass =
    result.primary_intent ===
    test.expected_intent;


  const targetPass =
    result.context
      ?.explanation_target ===
    test.expected_target;


  const explanationPass =
    result.context
      ?.explanation_requested ===
    test.expected_explanation;


  const pass =
    intentPass &&
    targetPass &&
    explanationPass;


  if (pass) {
    passed++;
  } else {
    failed++;
  }


  rows.push({
    id:
      test.id,

    intent:
      result.primary_intent,

    target:
      result.context
        ?.explanation_target,

    explanation:
      result.context
        ?.explanation_requested,

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
