import {
  buildExplanationFocusedAnswer
} from "../../engine/intent_answer_builder_v1.js";


console.log(
  "========================================"
);
console.log(
  "EXPLANATION ANSWER BUILDER V1"
);
console.log(
  "========================================"
);


const engineResult = {
  explanation: {
    summary: {
      en:
        "This setup provides the strongest overall fit.",
      zh:
        "这套配置目前具有更好的整体匹配度。"
    },

    recommendation: {
      racquet: {
        action:
          "keep",

        product: {
          id:
            "wilson_rf_01_pro_classic",
          brand:
            "Wilson",
          model:
            "RF 01 Pro Classic"
        },

        reason: {
          en:
            "Your current racquet remains compatible with the recommended direction.",
          zh:
            "你目前的球拍仍然与推荐方向高度兼容，因此没有必要为了改变而换拍。"
        }
      },

      string: {
        setup_type:
          "full_bed",

        main: {
          id:
            "luxilon_natural_gut",
          brand:
            "Luxilon",
          model:
            "Natural Gut",
          gauge_mm:
            1.25
        },

        cross:
          null,

        reason: {
          en:
            "The selected string reduces overall stringbed harshness and prioritizes comfort.",
          zh:
            "这条球线优先降低线床生硬感，并提高整体舒适性。"
        }
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
        },

        reason: {
          en:
            "Tension is selected to preserve directional control without relying on an excessively firm stringbed.",
          zh:
            "磅数用于保持方向控制，同时避免通过过硬线床来强行获得控制。"
        }
      }
    },

    why_this_setup: [
      {
        en:
          "Supports primary goal: more control.",
        zh:
          "符合你的主要目标：提升控制。"
      },

      {
        en:
          "Strong string alignment with player goal.",
        zh:
          "球线与主要目标匹配度较高。"
      }
    ]
  }
};


const cases = [

  {
    id:
      "racquet_zh",

    target:
      "racquet",

    language:
      "zh",

    expected_available:
      true,

    expected_text:
      "Wilson RF 01 Pro Classic"
  },

  {
    id:
      "string_zh",

    target:
      "string",

    language:
      "zh",

    expected_available:
      true,

    expected_text:
      "Luxilon Natural Gut"
  },

  {
    id:
      "tension_zh",

    target:
      "tension",

    language:
      "zh",

    expected_available:
      true,

    expected_text:
      "建议磅数：52 lbs"
  },

  {
    id:
      "setup_zh",

    target:
      "setup",

    language:
      "zh",

    expected_available:
      true,

    expected_text:
      "为什么推荐这套配置"
  },

  {
    id:
      "fallback_zh",

    target:
      null,

    language:
      "zh",

    expected_available:
      true,

    expected_text:
      "这套配置目前具有更好的整体匹配度"
  },

  {
    id:
      "tension_en",

    target:
      "tension",

    language:
      "en",

    expected_available:
      true,

    expected_text:
      "Recommended tension: 52 lbs"
  },

  {
    id:
      "missing_section",

    target:
      "racquet",

    language:
      "zh",

    engine_result: {
      explanation: {}
    },

    expected_available:
      false,

    expected_text:
      "目前还没有足够信息"
  }

];


let passed = 0;
let failed = 0;

const rows = [];


for (const test of cases) {

  const result =
    buildExplanationFocusedAnswer(
      test.engine_result ??
        engineResult,
      test.target,
      test.language
    );


  const pass =
    result.response_mode ===
      "explanation_focused" &&
    result.available ===
      test.expected_available &&
    typeof result.answer ===
      "string" &&
    result.answer.includes(
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

    target:
      result.target,

    available:
      result.available,

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
