import {
  detectQuestionIntent
} from "../../engine/question_intent_engine.js";


const cases = [

  /**
   * ==========================================================
   * Comparison false-positive protection
   * ==========================================================
   */

  {
    id:
      "relative_direct_cn",

    message:
      "我喜欢比较直接的击球手感。",

    must_not_be:
      "compare_products"
  },

  {
    id:
      "relative_comfort_cn",

    message:
      "我想要比较舒服的球线。",

    must_not_be:
      "compare_products"
  },

  {
    id:
      "relative_firm_cn",

    message:
      "这个配置感觉比较硬。",

    must_not_be:
      "compare_products"
  },

  {
    id:
      "explicit_compare_cn",

    message:
      "请比较 Pure Drive 和 RF01。",

    expected:
      "compare_products"
  },

  {
    id:
      "which_suitable_cn",

    message:
      "Pure Drive 和 RF01 哪个更适合我？",

    expected:
      "compare_products"
  },

  {
    id:
      "vs_compare",

    message:
      "Pure Drive vs RF01",

    expected:
      "compare_products"
  },

  {
    id:
      "difference_cn",

    message:
      "Pure Drive 和 RF01 有什么区别？",

    expected:
      "compare_products"
  },

  {
    id:
      "comparative_explanation_cn",

    message:
      "为什么 Pure Drive 比 RF01 更适合我？",

    expected:
      "compare_products"
  },


  /**
   * ==========================================================
   * Tension value vs tension intent
   * ==========================================================
   */

  {
    id:
      "setup_value_only_cn",

    message:
      "我现在 HAWK TOUCH 1.25，54磅。",

    must_not_be:
      "adjust_tension"
  },

  {
    id:
      "recommend_with_current_tension_cn",

    message:
      "我现在 HAWK TOUCH 1.25，54磅，请帮我推荐更适合控制的配置。",

    expected:
      "recommend_setup"
  },

  {
    id:
      "full_recommendation_cn",

    message:
      "我现在使用 Wilson RF 01 Pro Classic，HEAD HAWK TOUCH 1.25，54磅。中级，全场型打法，挥拍速度中等，想要更多控制，同时保持比较直接的击球手感。请帮我推荐配置。",

    expected:
      "recommend_setup"
  },

  {
    id:
      "tension_question_cn",

    message:
      "我这个配置应该拉多少磅？",

    expected:
      "adjust_tension"
  },

  {
    id:
      "tension_lower_cn",

    message:
      "帮我把现在的磅数调低一点。",

    expected:
      "adjust_tension"
  },

  {
    id:
      "physical_tension_cn",

    message:
      "我的肩膀会痛，现在54磅是不是太高？",

    expected:
      "adjust_tension",

    physical:
      true
  },

  {
    id:
      "why_tension_cn",

    message:
      "为什么建议我用52磅？",

    expected:
      "explain_current_setup",

    target:
      "tension"
  },


  /**
   * ==========================================================
   * English tension boundaries
   * ==========================================================
   */

  {
    id:
      "setup_value_only_en",

    message:
      "I currently use HAWK TOUCH 1.25 at 54 lbs.",

    must_not_be:
      "adjust_tension"
  },

  {
    id:
      "recommend_with_tension_en",

    message:
      "I use HAWK TOUCH 1.25 at 54 lbs. Recommend a setup with more control.",

    expected:
      "recommend_setup"
  },

  {
    id:
      "tension_question_en",

    message:
      "What tension should I use?",

    expected:
      "adjust_tension"
  },

  {
    id:
      "tension_lower_en",

    message:
      "Should I lower the tension?",

    expected:
      "adjust_tension"
  },

  {
    id:
      "tension_too_high_en",

    message:
      "Is 54 lbs too high?",

    expected:
      "adjust_tension"
  },

  {
    id:
      "why_tension_en",

    message:
      "Why did you recommend 52 lbs?",

    expected:
      "explain_current_setup",

    target:
      "tension"
  }

];


let passed =
  0;


const rows =
  cases.map(
    (
      test
    ) => {

      const result =
        detectQuestionIntent(
          test.message
        );


      let pass =
        true;


      if (
        test.expected
      ) {

        pass =
          pass &&
          result.primary_intent ===
            test.expected;
      }


      if (
        test.must_not_be
      ) {

        pass =
          pass &&
          result.primary_intent !==
            test.must_not_be;
      }


      if (
        test.target !==
        undefined
      ) {

        pass =
          pass &&
          result.context
            ?.explanation_target ===
              test.target;
      }


      if (
        test.physical !==
        undefined
      ) {

        pass =
          pass &&
          result.context
            ?.physical ===
              test.physical;
      }


      if (
        pass
      ) {

        passed++;
      }


      return {

        id:
          test.id,

        intent:
          result.primary_intent,

        target:
          result.context
            ?.explanation_target ??
          null,

        physical:
          result.context
            ?.physical ??
          false,

        comparison:
          result.context
            ?.comparison ??
          false,

        pass
      };
    }
  );


console.log(
  "========================================"
);

console.log(
  "QUESTION INTENT BOUNDARY V1"
);

console.log(
  "========================================"
);


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
  `Failed: ${cases.length - passed}`
);

console.log("");

console.log(
  passed ===
    cases.length
      ? "RESULT: PASS"
      : "RESULT: FAIL"
);


if (
  passed !==
  cases.length
) {

  process.exit(1);
}
