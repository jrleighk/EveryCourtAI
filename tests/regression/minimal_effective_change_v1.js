import {
  buildPlayerProfile
} from "../../engine/player_engine.js";

import {
  runMatchingEngine
} from "../../engine/matching_engine.js";

import {
  generateSetupScenarios
} from "../../engine/setup_scenario_engine.js";


const CURRENT_RACQUET =
  "wilson_rf_01_pro_classic";

const CURRENT_STRING =
  "head_hawk_touch";


const cases = [

  {
    id:
      "mild_should_keep_current_setup",

    severity:
      "mild",

    validate({
      minimal
    }) {

      const failures = [];


      if (
        minimal?.racquet?.id !==
        CURRENT_RACQUET
      ) {

        failures.push(
          `Expected current racquet ${CURRENT_RACQUET}, got ${minimal?.racquet?.id}`
        );
      }


      if (
        minimal?.string?.id !==
        CURRENT_STRING
      ) {

        failures.push(
          `Expected current string ${CURRENT_STRING}, got ${minimal?.string?.id}`
        );
      }


      return failures;
    }
  },


  {
    id:
      "moderate_should_change_string_only",

    severity:
      "moderate",

    validate({
      minimal
    }) {

      const failures = [];


      if (
        minimal?.racquet?.id !==
        CURRENT_RACQUET
      ) {

        failures.push(
          `Expected racquet to remain ${CURRENT_RACQUET}, got ${minimal?.racquet?.id}`
        );
      }


      if (
        minimal?.string?.id ===
        CURRENT_STRING
      ) {

        failures.push(
          "Expected current string to change under moderate physical constraint."
        );
      }


      const stringPhysical =
        Number(
          minimal
            ?.string
            ?.source_candidate
            ?.score_breakdown
            ?.physical ??
          0
        );


      if (
        stringPhysical <= 0
      ) {

        failures.push(
          `Expected safer replacement string physical score > 0, got ${stringPhysical}`
        );
      }


      return failures;
    }
  },


  {
    id:
      "high_should_not_preserve_unsafe_setup",

    severity:
      "high",

    validate({
      minimal,
      matching
    }) {

      const failures = [];


      if (
        minimal?.string?.id ===
        CURRENT_STRING
      ) {

        failures.push(
          "Excluded current string must not return in high severity minimal-change scenario."
        );
      }


      if (
        minimal?.racquet?.id ===
        CURRENT_RACQUET
      ) {

        failures.push(
          "High severity should not preserve the physically demanding current racquet."
        );
      }


      const upstreamCurrentString =
        matching.strings.find(
          candidate =>
            candidate.id ===
            CURRENT_STRING
        );


      if (
        upstreamCurrentString
      ) {

        failures.push(
          "Expected current string to be excluded upstream for high severity."
        );
      }


      const racquetPhysical =
        Number(
          minimal
            ?.racquet
            ?.source_candidate
            ?.score_breakdown
            ?.physical ??
          0
        );


      const stringPhysical =
        Number(
          minimal
            ?.string
            ?.source_candidate
            ?.score_breakdown
            ?.physical ??
          0
        );


      if (
        racquetPhysical < 0
      ) {

        failures.push(
          `Expected high-severity replacement racquet physical score >= 0, got ${racquetPhysical}`
        );
      }


      if (
        stringPhysical < 0
      ) {

        failures.push(
          `Expected high-severity replacement string physical score >= 0, got ${stringPhysical}`
        );
      }


      return failures;
    }
  }
];


const results = [];


console.log(
  "========================================"
);

console.log(
  "MINIMAL EFFECTIVE CHANGE V1"
);

console.log(
  "========================================"
);


for (
  const testCase
  of cases
) {

  const profile =
    await buildPlayerProfile({

      current_racquet: {
        id:
          CURRENT_RACQUET,

        brand:
          "Wilson",

        model:
          "RF 01 Pro Classic"
      },

      current_string: {
        id:
          CURRENT_STRING,

        brand:
          "HEAD",

        model:
          "HAWK TOUCH",

        gauge_mm:
          1.25
      },

      current_tension:
        54,

      primary_goal:
        "more_comfort",

      playing_style:
        "all_court",

      swing_speed:
        "medium",

      feel_preference:
        "soft",

      physical: {
        shoulder: {
          active:
            true,

          severity:
            testCase.severity
        }
      }
    });


  const matching =
    await runMatchingEngine(
      profile
    );


  const scenarioResult =
    generateSetupScenarios({

      playerProfile:
        profile,

      matchingResult:
        matching,

      recommendationResult:
        null
    });


  const minimal =
    scenarioResult
      .scenarios
      .find(
        scenario =>
          scenario.type ===
          "minimal_change"
      );


  const failures =
    minimal
      ? testCase.validate({
          profile,
          matching,
          minimal
        })
      : [
          "Minimal change scenario was not generated."
        ];


  const pass =
    failures.length ===
    0;


  results.push({
    id:
      testCase.id,

    severity:
      testCase.severity,

    pass,

    racquet:
      minimal?.racquet?.id ??
      null,

    string:
      minimal?.string?.id ??
      null,

    tension:
      minimal
        ?.tension
        ?.recommended_lbs ??
      null,

    racquet_physical:
      minimal
        ?.racquet
        ?.source_candidate
        ?.score_breakdown
        ?.physical ??
      null,

    string_physical:
      minimal
        ?.string
        ?.source_candidate
        ?.score_breakdown
        ?.physical ??
      null
  });


  if (
    !pass
  ) {

    console.log("");
    console.log(
      `CASE FAILED: ${testCase.id}`
    );


    for (
      const failure
      of failures
    ) {

      console.log(
        `- ${failure}`
      );
    }
  }
}


console.log("");

console.table(
  results
);


const failed =
  results.filter(
    result =>
      !result.pass
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
  `Total: ${results.length}`
);

console.log(
  `Passed: ${results.length - failed.length}`
);

console.log(
  `Failed: ${failed.length}`
);


if (
  failed.length > 0
) {

  process.exitCode =
    1;
}
