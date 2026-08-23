import adaptPlayerProfileV1 from "../../src/adapters/player_profile_adapter_v1.js";

const baseProfile = {
  profile_version: "1.0",
  playing_level: "intermediate",
  playing_style: ["all_court"],
  primary_goal: "comfort",
  secondary_goals: ["feel"],

  current_setup: {
    racquet_id: "wilson_rf_01_pro_classic",
    string_id: "head_hawk_touch",
    tension_lbs: 52,
    string_setup_type: "full_bed"
  }
};

function makeProfile(overrides = {}) {
  return {
    ...baseProfile,
    ...overrides,

    current_setup: {
      ...baseProfile.current_setup,
      ...(overrides.current_setup || {})
    }
  };
}

const cases = [
  {
    id: "no_physical_constraint",
    profile: makeProfile(),
    expected: {
      physical_constraint: null,
      physical_severity: "none",
      physical_score: 0,
      change_strategy_hint: "balanced_adjustment"
    }
  },

  {
    id: "mild_shoulder",
    profile: makeProfile({
      physical_condition: {
        shoulder_sensitivity: "mild"
      }
    }),
    expected: {
      physical_constraint: "shoulder",
      physical_severity: "mild",
      physical_score: 1,
      change_strategy_hint: "balanced_adjustment"
    }
  },

  {
    id: "moderate_shoulder",
    profile: makeProfile({
      physical_condition: {
        shoulder_sensitivity: "moderate"
      }
    }),
    expected: {
      physical_constraint: "shoulder",
      physical_severity: "moderate",
      physical_score: 2,
      change_strategy_hint: "conservative_adjustment"
    }
  },

  {
    id: "high_elbow",
    profile: makeProfile({
      physical_condition: {
        elbow_sensitivity: "high"
      }
    }),
    expected: {
      physical_constraint: "elbow",
      physical_severity: "high",
      physical_score: 3,
      change_strategy_hint: "comfort_and_safety_first"
    }
  },

  {
    id: "severe_wrist",
    profile: makeProfile({
      physical_condition: {
        wrist_sensitivity: "severe"
      }
    }),
    expected: {
      physical_constraint: "wrist",
      physical_severity: "severe",
      physical_score: 4,
      change_strategy_hint: "comfort_and_safety_first"
    }
  },

  {
    id: "moderate_lower_back",
    profile: makeProfile({
      physical_condition: {
        lower_back_sensitivity: "moderate"
      }
    }),
    expected: {
      physical_constraint: "lower_back",
      physical_severity: "moderate",
      physical_score: 2,
      change_strategy_hint: "conservative_adjustment"
    }
  },

  {
    id: "high_knee",
    profile: makeProfile({
      physical_condition: {
        knee_sensitivity: "high"
      }
    }),
    expected: {
      physical_constraint: "knee",
      physical_severity: "high",
      physical_score: 3,
      change_strategy_hint: "comfort_and_safety_first"
    }
  },

  {
    id: "multiple_constraints_highest_wins",
    profile: makeProfile({
      physical_condition: {
        shoulder_sensitivity: "mild",
        elbow_sensitivity: "moderate",
        knee_sensitivity: "high",
        ankle_sensitivity: "mild"
      }
    }),
    expected: {
      physical_constraint: "knee",
      physical_severity: "high",
      physical_score: 3,
      change_strategy_hint: "comfort_and_safety_first"
    }
  },

  {
    id: "moderate_fatigue",
    profile: makeProfile({
      playing_load: {
        fatigue_level: "moderate",
        fatigue_timing: "late"
      }
    }),
    expected: {
      physical_constraint: null,
      physical_severity: "none",
      physical_score: 0,
      fatigue_level: "moderate",
      fatigue_timing: "late",
      change_strategy_hint: "conservative_adjustment"
    }
  },

  {
    id: "high_fatigue",
    profile: makeProfile({
      playing_load: {
        fatigue_level: "high",
        fatigue_timing: "mid"
      }
    }),
    expected: {
      physical_constraint: null,
      physical_severity: "none",
      physical_score: 0,
      fatigue_level: "high",
      fatigue_timing: "mid",
      change_strategy_hint: "comfort_and_safety_first"
    }
  },

  {
    id: "minimal_change_tolerance",
    profile: makeProfile({
      preferences: {
        change_tolerance: "minimal"
      }
    }),
    expected: {
      change_tolerance: "minimal",
      change_strategy_hint: "minimal_change"
    }
  },

  {
    id: "moderate_change_tolerance",
    profile: makeProfile({
      preferences: {
        change_tolerance: "moderate"
      }
    }),
    expected: {
      change_tolerance: "moderate",
      change_strategy_hint: "balanced_adjustment"
    }
  },

  {
    id: "open_change_tolerance",
    profile: makeProfile({
      preferences: {
        change_tolerance: "open"
      }
    }),
    expected: {
      change_tolerance: "open",
      change_strategy_hint: "full_setup_optimization"
    }
  },

  {
    id: "minimal_change_with_moderate_physical",
    profile: makeProfile({
      physical_condition: {
        shoulder_sensitivity: "moderate"
      },
      preferences: {
        change_tolerance: "minimal"
      }
    }),
    expected: {
      physical_constraint: "shoulder",
      physical_severity: "moderate",
      physical_score: 2,
      change_tolerance: "minimal",
      change_strategy_hint: "minimal_change"
    }
  },

  {
    id: "minimal_change_overridden_by_high_physical",
    profile: makeProfile({
      physical_condition: {
        elbow_sensitivity: "high"
      },
      preferences: {
        change_tolerance: "minimal"
      }
    }),
    expected: {
      physical_constraint: "elbow",
      physical_severity: "high",
      physical_score: 3,
      change_tolerance: "minimal",
      change_strategy_hint: "comfort_and_safety_first"
    }
  }
];

let passed = 0;
let failed = 0;

console.log("");
console.log("============================================================");
console.log("EveryCourtAI Player Profile Adapter Regression V1");
console.log("============================================================");

for (const testCase of cases) {
  let result;

  try {
    result = adaptPlayerProfileV1(testCase.profile);
  } catch (error) {
    failed += 1;

    console.log("");
    console.log(`CASE: ${testCase.id}`);
    console.log("RESULT: FAIL");
    console.log(`Adapter Error: ${error.message}`);
    console.log("------------------------------------------------------------");

    continue;
  }

  const context = result.recommendation_context;

  const mismatches = [];

  for (const [key, expectedValue] of Object.entries(
    testCase.expected
  )) {
    const actualValue = context[key];

    if (actualValue !== expectedValue) {
      mismatches.push({
        key,
        expected: expectedValue,
        actual: actualValue
      });
    }
  }

  console.log("");
  console.log(`CASE: ${testCase.id}`);

  console.log({
    physical_constraint: context.physical_constraint,
    physical_severity: context.physical_severity,
    physical_score: context.physical_score,
    fatigue_level: context.fatigue_level,
    fatigue_timing: context.fatigue_timing,
    change_tolerance: context.change_tolerance,
    change_strategy_hint: context.change_strategy_hint
  });

  if (mismatches.length === 0) {
    passed += 1;
    console.log("RESULT: PASS");
  } else {
    failed += 1;
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
  }

  console.log("------------------------------------------------------------");
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
