import {
  buildPlayerProfile
} from "../../engine/player_engine.js";

import {
  runMatchingEngine
} from "../../engine/matching_engine.js";

import {
  generateSetupScenarios
} from "../../engine/setup_scenario_engine.js";


console.log(
  "========================================"
);

console.log(
  "CROSS BRAND PHYSICAL SAFETY V1"
);

console.log(
  "========================================"
);


const cases = [
  {
    id:
      "rpm_blast_moderate_shoulder",

    severity:
      "moderate",

    expectRpmPresent:
      true,

    expectStrategy:
      "change_string_only"
  },

  {
    id:
      "rpm_blast_high_shoulder",

    severity:
      "high",

    expectRpmPresent:
      false,

    expectStrategy:
      "change_string_only"
  }
];


let passed = 0;
let failed = 0;


for (
  const testCase
  of cases
) {

  const profile =
    await buildPlayerProfile({
      current_racquet: {
        id:
          "babolat_pure_drive_spectra_edition_2026"
      },

      current_string: {
        id:
          "babolat_rpm_blast",

        gauge_mm:
          1.25
      },

      current_tension:
        52,

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


  const result =
    generateSetupScenarios({
      playerProfile:
        profile,

      matchingResult:
        matching
    });


  const rpmPresent =
    matching.strings.some(
      item =>
        item.id ===
        "babolat_rpm_blast"
    );


  const minimal =
    result.scenarios.find(
      scenario =>
        scenario.type ===
        "minimal_change"
    );


  const pass =
    rpmPresent ===
      testCase.expectRpmPresent &&

    minimal?.string?.id ===
      "luxilon_natural_gut" &&

    minimal?.decision?.strategy ===
      testCase.expectStrategy &&

    minimal?.decision?.unsafe_components ===
      0;


  if (
    pass
  ) {
    passed += 1;
  } else {
    failed += 1;
  }


  console.log({
    id:
      testCase.id,

    pass,

    rpm_present:
      rpmPresent,

    minimal_racquet:
      minimal?.racquet?.id,

    minimal_string:
      minimal?.string?.id,

    strategy:
      minimal?.decision?.strategy,

    unsafe:
      minimal?.decision?.unsafe_components
  });
}


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


if (
  failed > 0
) {
  process.exitCode = 1;
}
