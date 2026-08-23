import runRecommendationPipelineV1 from "../../src/pipelines/recommendation_pipeline_v1.js";

/**
 * ============================================================
 * EveryCourtAI
 * Recommendation Pipeline Regression V1
 * ============================================================
 *
 * Tests:
 *
 * Player Profile
 *      ↓
 * Adapter V1
 *      ↓
 * Pipeline V1
 *      ↓
 * Main Engine
 *      ↓
 * Final Recommendation
 *
 * Goal:
 * Lock core end-to-end recommendation behavior without
 * modifying the existing Recommendation Matrix V1.
 * ============================================================
 */

const RF01 = {
  id: "wilson_rf_01_pro_classic",
  brand: "Wilson",
  model: "RF 01 Pro Classic"
};

const HAWK_TOUCH = {
  id: "head_hawk_touch",
  brand: "HEAD",
  model: "HAWK TOUCH",
  gauge_mm: 1.25
};

const NATURAL_GUT = {
  id: "wilson_natural_gut_17",
  brand: "Wilson",
  model: "Natural Gut 17",
  gauge_mm: 1.25
};

function buildProfile({
  goal,
  stringId = "head_hawk_touch",
  tension = 52,
  physicalCondition = {},
  feel = "connected"
}) {
  return {
    profile_version: "1.0",

    playing_level: "intermediate",

    playing_style: [
      "all_court"
    ],

    primary_goal: goal,

    current_setup: {
      racquet_id:
        "wilson_rf_01_pro_classic",

      string_id:
        stringId,

      tension_lbs:
        tension,

      string_setup_type:
        "full_bed"
    },

    physical_condition:
      physicalCondition,

    preferences: {
      preferred_string_feel: [
        feel
      ],

      change_tolerance:
        "moderate"
    }
  };
}

function buildOptions(
  currentString
) {
  return {
    engine_overrides: {
      current_racquet:
        RF01,

      current_string:
        currentString,

      swing_speed:
        "medium"
    }
  };
}

const cases = [
  {
    id:
      "comfort_moderate_hawk",

    title:
      "Comfort / Moderate Shoulder / HAWK TOUCH",

    profile:
      buildProfile({
        goal: "comfort",

        tension: 55,

        physicalCondition: {
          shoulder_sensitivity:
            "moderate"
        }
      }),

    options:
      buildOptions(
        HAWK_TOUCH
      ),

    expected: {
      racquet:
        "wilson_rf_01_pro_classic",

      racquet_action:
        "keep",

      string_action:
        "change",

      tension:
        52,

      tension_action:
        "adjust",

      strategy:
        "string_first",

      change_count:
        1
    },

    customCheck(summary) {
      return (
        summary.string !==
        "head_hawk_touch"
      );
    }
  },

  {
    id:
      "comfort_no_physical_hawk",

    title:
      "Comfort / No Physical Constraint / HAWK TOUCH",

    profile:
      buildProfile({
        goal: "comfort",
        tension: 52
      }),

    options:
      buildOptions(
        HAWK_TOUCH
      ),

    expected: {
      racquet:
        "wilson_rf_01_pro_classic",

      racquet_action:
        "keep",

      string:
        "head_hawk_touch",

      string_action:
        "keep",

      tension:
        49,

      tension_action:
        "adjust",

      strategy:
        "tension_only",

      change_count:
        1
    }
  },

  {
    id:
      "control_hawk",

    title:
      "Control / No Physical Constraint / HAWK TOUCH",

    profile:
      buildProfile({
        goal: "control",
        tension: 52
      }),

    options:
      buildOptions(
        HAWK_TOUCH
      ),

    expected: {
      racquet:
        "wilson_rf_01_pro_classic",

      racquet_action:
        "keep",

      string:
        "head_hawk_touch",

      string_action:
        "keep",

      tension:
        51,

      tension_action:
        "optional_adjust",

      strategy:
        "maintain_or_minor_tension_adjustment",

      change_count:
        0
    }
  },

  {
    id:
      "spin_hawk",

    title:
      "Spin / No Physical Constraint / HAWK TOUCH",

    profile:
      buildProfile({
        goal: "spin",
        tension: 50
      }),

    options: {
      engine_overrides: {
        current_racquet:
          RF01,

        current_string:
          HAWK_TOUCH,

        playing_style:
          "baseline",

        swing_speed:
          "fast"
      }
    },

    expected: {
      racquet:
        "wilson_rf_01_pro_classic",

      racquet_action:
        "keep",

      string:
        "head_hawk_touch",

      string_action:
        "keep",

      tension:
        50,

      tension_action:
        "keep",

      strategy:
        "keep_current_setup",

      change_count:
        0
    }
  },

  {
    id:
      "power_hawk",

    title:
      "Power / No Physical Constraint / HAWK TOUCH",

    profile:
      buildProfile({
        goal: "power",
        tension: 52
      }),

    options:
      buildOptions(
        HAWK_TOUCH
      ),

    expected: {
      racquet:
        "wilson_rf_01_pro_classic",

      racquet_action:
        "keep",

      string:
        "head_hawk_touch",

      string_action:
        "keep",

      tension:
        49,

      tension_action:
        "adjust",

      strategy:
        "tension_only",

      change_count:
        1
    }
  },

  {
    id:
      "feel_natural_gut",

    title:
      "Feel / Natural Gut",

    profile:
      buildProfile({
        goal: "feel",

        stringId:
          "wilson_natural_gut_17",

        tension:
          55
      }),

    options:
      buildOptions(
        NATURAL_GUT
      ),

    expected: {
      racquet:
        "wilson_rf_01_pro_classic",

      racquet_action:
        "keep",

      string:
        "wilson_natural_gut_17",

      string_action:
        "keep",

      tension:
        54,

      tension_action:
        "optional_adjust",

      strategy:
        "maintain_or_minor_tension_adjustment",

      change_count:
        0
    }
  }
];

let passed = 0;
let failed = 0;

console.log("");
console.log("============================================================");
console.log("EveryCourtAI Recommendation Pipeline Regression V1");
console.log("============================================================");

for (const testCase of cases) {
  console.log("");
  console.log(
    `CASE: ${testCase.id}`
  );

  console.log(
    testCase.title
  );

  let result;

  try {
    result =
      await runRecommendationPipelineV1(
        testCase.profile,
        testCase.options
      );
  } catch (error) {
    console.log(
      "RESULT: FAIL"
    );

    console.log(
      "Pipeline Error:",
      error instanceof Error
        ? error.message
        : String(error)
    );

    failed += 1;

    console.log(
      "------------------------------------------------------------"
    );

    continue;
  }

  const summary =
    result?.summary ?? {};

  console.log(
    JSON.stringify(
      summary,
      null,
      2
    )
  );

  const mismatches = [];

  for (
    const [
      key,
      expectedValue
    ]
    of Object.entries(
      testCase.expected
    )
  ) {
    const actualValue =
      summary[key];

    if (
      actualValue !==
      expectedValue
    ) {
      mismatches.push({
        key,
        expected:
          expectedValue,
        actual:
          actualValue
      });
    }
  }

  if (
    typeof testCase.customCheck ===
    "function"
  ) {
    const customPass =
      testCase.customCheck(
        summary,
        result
      );

    if (!customPass) {
      mismatches.push({
        key:
          "customCheck",

        expected:
          true,

        actual:
          false
      });
    }
  }

  if (
    mismatches.length === 0
  ) {
    console.log(
      "RESULT: PASS"
    );

    passed += 1;
  } else {
    console.log(
      "RESULT: FAIL"
    );

    console.log(
      "Mismatches:"
    );

    for (
      const mismatch
      of mismatches
    ) {
      console.log(
        `- ${mismatch.key}: expected=${JSON.stringify(
          mismatch.expected
        )}, actual=${JSON.stringify(
          mismatch.actual
        )}`
      );
    }

    failed += 1;
  }

  console.log(
    "------------------------------------------------------------"
  );
}

console.log("");
console.log("============================================================");
console.log("REGRESSION SUMMARY");
console.log("============================================================");
console.log(
  `Total:  ${cases.length}`
);
console.log(
  `Passed: ${passed}`
);
console.log(
  `Failed: ${failed}`
);
console.log("============================================================");

if (failed > 0) {
  process.exitCode = 1;
}
