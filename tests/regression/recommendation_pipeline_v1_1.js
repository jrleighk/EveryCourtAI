import runRecommendationPipelineV1_1 from "../../src/pipelines/recommendation_pipeline_v1_1.js";

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

function buildProfile({
  goal,
  swingSpeed,
  playingStyle = "all_court",
  tension = 52,
  physicalCondition = {}
}) {
  const profile = {
    profile_version: "1.1",
    playing_level: "intermediate",
    playing_style: [playingStyle],
    primary_goal: goal,

    current_setup: {
      racquet_id: "wilson_rf_01_pro_classic",
      string_id: "head_hawk_touch",
      tension_lbs: tension,
      string_setup_type: "full_bed"
    },

    physical_condition: physicalCondition,

    preferences: {
      preferred_string_feel: ["connected"],
      change_tolerance: "moderate"
    }
  };

  if (swingSpeed !== undefined) {
    profile.swing_speed = swingSpeed;
  }

  return profile;
}

const options = {
  engine_overrides: {
    current_racquet: RF01,
    current_string: HAWK_TOUCH
  }
};

const cases = [
  {
    id: "spin_fast",
    profile: buildProfile({
      goal: "spin",
      swingSpeed: "fast",
      playingStyle: "baseline",
      tension: 50
    }),
    expectedEngine: {
      primary_goal: "more_spin",
      playing_style: "baseline",
      swing_speed: "fast"
    },
    expectedSummary: {
      racquet_action: "keep",
      string_action: "keep",
      tension: 50,
      tension_action: "keep",
      strategy: "keep_current_setup",
      change_count: 0
    }
  },

  {
    id: "spin_medium",
    profile: buildProfile({
      goal: "spin",
      swingSpeed: "medium",
      playingStyle: "baseline",
      tension: 50
    }),
    expectedEngine: {
      primary_goal: "more_spin",
      playing_style: "baseline",
      swing_speed: "medium"
    }
  },

  {
    id: "comfort_moderate_shoulder",
    profile: buildProfile({
      goal: "comfort",
      swingSpeed: "medium",
      tension: 55,
      physicalCondition: {
        shoulder_sensitivity: "moderate"
      }
    }),
    expectedEngine: {
      primary_goal: "more_comfort",
      swing_speed: "medium"
    },
    expectedSummary: {
      racquet_action: "keep",
      string_action: "change",
      tension: 52,
      tension_action: "adjust",
      strategy: "string_first",
      change_count: 1
    }
  },

  {
    id: "control_medium",
    profile: buildProfile({
      goal: "control",
      swingSpeed: "medium",
      tension: 52
    }),
    expectedEngine: {
      primary_goal: "more_control",
      swing_speed: "medium"
    },
    expectedSummary: {
      racquet_action: "keep",
      string_action: "keep",
      tension: 51,
      tension_action: "optional_adjust",
      strategy: "maintain_or_minor_tension_adjustment",
      change_count: 0
    }
  },

  {
    id: "power_medium",
    profile: buildProfile({
      goal: "power",
      swingSpeed: "medium",
      tension: 52
    }),
    expectedEngine: {
      primary_goal: "more_power",
      swing_speed: "medium"
    },
    expectedSummary: {
      racquet_action: "keep",
      string_action: "keep",
      tension: 49,
      tension_action: "adjust",
      strategy: "tension_only",
      change_count: 1
    }
  },

  {
    id: "missing_swing_speed_defaults_medium",
    profile: buildProfile({
      goal: "comfort",
      tension: 52
    }),
    expectedEngine: {
      primary_goal: "more_comfort",
      swing_speed: "medium"
    }
  }
];

let passed = 0;
let failed = 0;

console.log("");
console.log("============================================================");
console.log("EveryCourtAI Recommendation Pipeline Regression V1.1");
console.log("============================================================");

for (const testCase of cases) {
  console.log("");
  console.log(`CASE: ${testCase.id}`);

  let result;

  try {
    result = await runRecommendationPipelineV1_1(
      testCase.profile,
      options
    );
  } catch (error) {
    console.log("RESULT: FAIL");
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

  const mismatches = [];

  for (
    const [key, expectedValue]
    of Object.entries(
      testCase.expectedEngine ?? {}
    )
  ) {
    const actualValue =
      result.engine_input?.[key];

    if (actualValue !== expectedValue) {
      mismatches.push({
        key: `engine_input.${key}`,
        expected: expectedValue,
        actual: actualValue
      });
    }
  }

  for (
    const [key, expectedValue]
    of Object.entries(
      testCase.expectedSummary ?? {}
    )
  ) {
    const actualValue =
      result.summary?.[key];

    if (actualValue !== expectedValue) {
      mismatches.push({
        key: `summary.${key}`,
        expected: expectedValue,
        actual: actualValue
      });
    }
  }

  console.log("ENGINE:");
  console.log({
    primary_goal:
      result.engine_input?.primary_goal,
    playing_style:
      result.engine_input?.playing_style,
    swing_speed:
      result.engine_input?.swing_speed
  });

  console.log("SUMMARY:");
  console.log(
    JSON.stringify(
      result.summary,
      null,
      2
    )
  );

  if (mismatches.length === 0) {
    console.log("RESULT: PASS");
    passed += 1;
  } else {
    console.log("RESULT: FAIL");
    console.log("Mismatches:");

    for (const mismatch of mismatches) {
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
console.log(`Total:  ${cases.length}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log("============================================================");

if (failed > 0) {
  process.exitCode = 1;
}
