import adaptPlayerProfileV1_1 from "../../src/adapters/player_profile_adapter_v1_1.js";

function makeProfile(overrides = {}) {
  return {
    profile_version: "1.1",
    playing_level: "intermediate",
    playing_style: ["baseline"],
    primary_goal: "spin",

    current_setup: {
      racquet_id: "wilson_rf_01_pro_classic",
      string_id: "head_hawk_touch",
      tension_lbs: 50,
      string_setup_type: "full_bed"
    },

    physical_condition: {},

    playing_load: {
      fatigue_level: "none",
      fatigue_timing: "none"
    },

    preferences: {
      preferred_string_feel: ["connected"],
      change_tolerance: "moderate"
    },

    ...overrides
  };
}

const cases = [
  {
    id: "swing_speed_slow",
    profile: makeProfile({
      swing_speed: "slow"
    }),
    expectedSwingSpeed: "slow",
    shouldThrow: false
  },

  {
    id: "swing_speed_medium",
    profile: makeProfile({
      swing_speed: "medium"
    }),
    expectedSwingSpeed: "medium",
    shouldThrow: false
  },

  {
    id: "swing_speed_fast",
    profile: makeProfile({
      swing_speed: "fast"
    }),
    expectedSwingSpeed: "fast",
    shouldThrow: false
  },

  {
    id: "swing_speed_missing_defaults_medium",
    profile: makeProfile(),
    expectedSwingSpeed: "medium",
    shouldThrow: false
  },

  {
    id: "invalid_swing_speed_defaults_medium",
    profile: makeProfile({
      swing_speed: "very_fast"
    }),
    expectedSwingSpeed: "medium",
    shouldThrow: false
  },

  {
    id: "preserves_playing_style",
    profile: makeProfile({
      playing_style: ["all_court"],
      swing_speed: "fast"
    }),
    expectedSwingSpeed: "fast",
    expectedPlayingStyle: ["all_court"],
    shouldThrow: false
  },

  {
    id: "preserves_recommendation_context",
    profile: makeProfile({
      primary_goal: "comfort",
      swing_speed: "medium",
      physical_condition: {
        shoulder_sensitivity: "moderate"
      }
    }),
    expectedSwingSpeed: "medium",
    expectedContext: {
      goal: "comfort",
      physical_constraint: "shoulder",
      physical_severity: "moderate",
      physical_score: 2
    },
    shouldThrow: false
  },

  {
    id: "rejects_v1_profile",
    profile: {
      ...makeProfile({
        swing_speed: "medium"
      }),
      profile_version: "1.0"
    },
    shouldThrow: true
  },

  {
    id: "rejects_invalid_profile_object",
    profile: null,
    shouldThrow: true
  }
];

let passed = 0;
let failed = 0;

console.log("");
console.log("============================================================");
console.log("EveryCourtAI Player Profile Adapter Regression V1.1");
console.log("============================================================");

for (const testCase of cases) {
  console.log("");
  console.log(`CASE: ${testCase.id}`);

  let threw = false;
  let result = null;
  let error = null;

  try {
    result = adaptPlayerProfileV1_1(
      testCase.profile
    );
  } catch (err) {
    threw = true;
    error = err;
  }

  const mismatches = [];

  if (testCase.shouldThrow) {
    if (!threw) {
      mismatches.push({
        key: "throw",
        expected: true,
        actual: false
      });
    }
  } else {
    if (threw) {
      mismatches.push({
        key: "throw",
        expected: false,
        actual: true
      });
    } else {
      const playerSwingSpeed =
        result?.player?.swing_speed;

      const contextSwingSpeed =
        result
          ?.recommendation_context
          ?.swing_speed;

      if (
        playerSwingSpeed !==
        testCase.expectedSwingSpeed
      ) {
        mismatches.push({
          key: "player.swing_speed",
          expected:
            testCase.expectedSwingSpeed,
          actual:
            playerSwingSpeed
        });
      }

      if (
        contextSwingSpeed !==
        testCase.expectedSwingSpeed
      ) {
        mismatches.push({
          key:
            "recommendation_context.swing_speed",
          expected:
            testCase.expectedSwingSpeed,
          actual:
            contextSwingSpeed
        });
      }

      if (
        testCase.expectedPlayingStyle
      ) {
        const actual =
          result?.player?.playing_style;

        if (
          JSON.stringify(actual) !==
          JSON.stringify(
            testCase.expectedPlayingStyle
          )
        ) {
          mismatches.push({
            key:
              "player.playing_style",
            expected:
              testCase.expectedPlayingStyle,
            actual
          });
        }
      }

      if (
        testCase.expectedContext
      ) {
        for (
          const [
            key,
            expectedValue
          ]
          of Object.entries(
            testCase.expectedContext
          )
        ) {
          const actualValue =
            result
              ?.recommendation_context
              ?.[key];

          if (
            actualValue !==
            expectedValue
          ) {
            mismatches.push({
              key:
                `recommendation_context.${key}`,
              expected:
                expectedValue,
              actual:
                actualValue
            });
          }
        }
      }
    }
  }

  if (mismatches.length === 0) {
    console.log("RESULT: PASS");

    if (!testCase.shouldThrow) {
      console.log({
        swing_speed:
          result?.player?.swing_speed,
        context_swing_speed:
          result
            ?.recommendation_context
            ?.swing_speed
      });
    } else {
      console.log(
        `Expected Error: ${error?.message ?? "thrown"}`
      );
    }

    passed += 1;
  } else {
    console.log("RESULT: FAIL");

    if (error) {
      console.log(
        `Adapter Error: ${error.message}`
      );
    }

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
