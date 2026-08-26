import {
  detectQuestionIntent
} from "../../engine/question_intent_engine.js";


console.log(
  "========================================"
);
console.log(
  "QUESTION INTENT V1"
);
console.log(
  "========================================"
);


const cases = [

  {
    id: "recommend_cn",
    message: "帮我推荐一个适合我的球拍和球线配置。",
    expected: "recommend_setup"
  },

  {
    id: "recommend_en",
    message: "What setup would you recommend for me?",
    expected: "recommend_setup"
  },

  {
    id: "compare_cn",
    message: "Pure Drive 和 RF01 哪个更适合我？",
    expected: "compare_products"
  },

  {
    id: "compare_en",
    message: "Compare Pure Drive and RF01. Which is better for me?",
    expected: "compare_products"
  },

  {
    id: "tension_cn",
    message: "我这个配置应该拉多少磅？",
    expected: "adjust_tension"
  },

  {
    id: "tension_en",
    message: "What tension should I use?",
    expected: "adjust_tension"
  },

  {
    id: "explain_cn",
    message: "为什么你推荐我换成天然肠线？",
    expected: "explain_current_setup"
  },

  {
    id: "explain_en",
    message: "Why are you recommending natural gut?",
    expected: "explain_current_setup"
  },

  {
    id: "physical_cn",
    message: "我的肩膀打两个小时以后会累。",
    expected: "physical_comfort"
  },

  {
    id: "physical_en",
    message: "My shoulder gets tired after two hours.",
    expected: "physical_comfort"
  },

  {
    id: "preference_cn",
    message: "球拍不要换，但是球线可以换。",
    expected: "update_preferences"
  },

  {
    id: "preference_en",
    message: "Keep my racquet, but you can change the string.",
    expected: "update_preferences"
  },

  {
    id: "general_cn",
    message: "网球里面旋转是怎么产生的？",
    expected: "general_tennis_question"
  },

  {
    id: "general_en",
    message: "How does topspin work in tennis?",
    expected: "general_tennis_question"
  },

  {
    id: "unknown",
    message: "你好。",
    expected: "unknown"
  },


  /**
   * ========================================================
   * Priority / Conflict Cases
   * ========================================================
   */


  {
    id: "compare_with_tension",
    message:
      "Pure Drive 和 RF01 哪个更好？它们的磅数应该怎么调整？",

    expected:
      "compare_products"
  },

  {
    id: "physical_with_tension",
    message:
      "我的肩膀会痛，现在54磅是不是太高？",

    expected:
      "adjust_tension"
  },

  {
    id: "explain_recommendation",
    message:
      "为什么你推荐我换成天然肠线？",

    expected:
      "explain_current_setup"
  },

  {
    id: "preference_override",
    message:
      "我想增加旋转，但球拍不要换，球线可以换。",

    expected:
      "update_preferences"
  },

  {
    id: "single_product_fit_cn",
    message:
      "Pure Drive 适合我吗？",

    expected:
      "recommend_setup"
  },

  {
    id: "explain_compare_cn",
    message:
      "为什么 Pure Drive 比 RF01 更适合我？",

    expected:
      "compare_products",

    expected_context: {
      comparison: true,
      explanation_requested: true
    }
  },

  {
    id: "physical_recommend_cn",
    message:
      "肩膀不舒服，我应该换什么线？",

    expected:
      "recommend_setup",

    expected_context: {
      physical: true
    }
  },

  {
    id: "preference_plus_recommend_cn",
    message:
      "球拍不换，帮我推荐一条更舒服的线。",

    expected:
      "recommend_setup",

    expected_context: {
      preserve_racquet: true
    }
  },

  {
    id: "single_product_fit_en",
    message:
      "Is the Pure Drive suitable for me?",

    expected:
      "recommend_setup"
  },

  {
    id: "physical_recommend_en",
    message:
      "My shoulder hurts. What string should I switch to?",

    expected:
      "recommend_setup",

    expected_context: {
      physical: true
    }
  },

  {
    id: "preference_plus_recommend_en",
    message:
      "Keep my racquet and recommend a more comfortable string.",

    expected:
      "recommend_setup",

    expected_context: {
      physical: true,
      preserve_racquet: true
    }
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
    result.intent ===
    test.expected &&
    result.primary_intent ===
    test.expected;


  const contextPass =
    !test.expected_context ||
    Object.entries(
      test.expected_context
    ).every(
      ([key, value]) =>
        result.context?.[key] ===
        value
    );


  const pass =
    intentPass &&
    contextPass;


  if (pass) {
    passed++;
  } else {
    failed++;
  }


  rows.push({
    id:
      test.id,

    expected:
      test.expected,

    actual:
      result.intent,

    primary:
      result.primary_intent,

    confidence:
      result.confidence,

    context_ok:
      contextPass,

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
