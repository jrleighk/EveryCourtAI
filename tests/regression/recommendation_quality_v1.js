import {
  buildPlayerProfile
} from "../../engine/player_engine.js";

import {
  runMatchingEngine
} from "../../engine/matching_engine.js";

import {
  generateSetupScenarios
} from "../../engine/setup_scenario_engine.js";


const CASES = [
  {
    id: "control_rf01_hawk",

    title:
      "RF01 + HAWK TOUCH / More Control",

    input: {
      current_racquet: {
        id: "wilson_rf_01_pro_classic",
        brand: "Wilson",
        model: "RF 01 Pro Classic"
      },

      current_string: {
        id: "head_hawk_touch",
        brand: "HEAD",
        model: "HAWK TOUCH",
        gauge_mm: 1.25
      },

      current_tension: 54,

      primary_goal:
        "more_control",

      playing_style:
        "baseline",

      swing_speed:
        "medium",

      feel_preference:
        "connected"
    }
  },

  {
    id: "comfort_rf01_hawk",

    title:
      "RF01 + HAWK TOUCH / More Comfort",

    input: {
      current_racquet: {
        id: "wilson_rf_01_pro_classic",
        brand: "Wilson",
        model: "RF 01 Pro Classic"
      },

      current_string: {
        id: "head_hawk_touch",
        brand: "HEAD",
        model: "HAWK TOUCH",
        gauge_mm: 1.25
      },

      current_tension: 55,

      primary_goal:
        "more_comfort",

      playing_style:
        "all_court",

      swing_speed:
        "medium",

      feel_preference:
        "connected",

      physical: {
        shoulder: {
          active: true,
          severity: "moderate"
        }
      }
    }
  },

  {
    id: "spin_rf01_hawk",

    title:
      "RF01 + HAWK TOUCH / More Spin",

    input: {
      current_racquet: {
        id: "wilson_rf_01_pro_classic",
        brand: "Wilson",
        model: "RF 01 Pro Classic"
      },

      current_string: {
        id: "head_hawk_touch",
        brand: "HEAD",
        model: "HAWK TOUCH",
        gauge_mm: 1.25
      },

      current_tension: 50,

      primary_goal:
        "more_spin",

      playing_style:
        "baseline",

      swing_speed:
        "fast",

      feel_preference:
        "connected"
    }
  },

  {
    id: "power_rf01_hawk",

    title:
      "RF01 + HAWK TOUCH / More Power",

    input: {
      current_racquet: {
        id: "wilson_rf_01_pro_classic",
        brand: "Wilson",
        model: "RF 01 Pro Classic"
      },

      current_string: {
        id: "head_hawk_touch",
        brand: "HEAD",
        model: "HAWK TOUCH",
        gauge_mm: 1.25
      },

      current_tension: 55,

      primary_goal:
        "more_power",

      playing_style:
        "all_court",

      swing_speed:
        "medium",

      feel_preference:
        "connected"
    }
  },

  {
    id: "minimal_change_rf01_hawk",

    title:
      "RF01 + HAWK TOUCH / Minimal Change",

    input: {
      current_racquet: {
        id: "wilson_rf_01_pro_classic",
        brand: "Wilson",
        model: "RF 01 Pro Classic"
      },

      current_string: {
        id: "head_hawk_touch",
        brand: "HEAD",
        model: "HAWK TOUCH",
        gauge_mm: 1.25
      },

      current_tension: 54,

      primary_goal:
        "more_control",

      playing_style:
        "all_court",

      swing_speed:
        "medium",

      feel_preference:
        "connected",

      change_tolerance:
        "minimal"
    }
  },

  {
    id: "comfort_physical_rf01",

    title:
      "RF01 + HAWK TOUCH / Shoulder Sensitivity",

    input: {
      current_racquet: {
        id: "wilson_rf_01_pro_classic",
        brand: "Wilson",
        model: "RF 01 Pro Classic"
      },

      current_string: {
        id: "head_hawk_touch",
        brand: "HEAD",
        model: "HAWK TOUCH",
        gauge_mm: 1.25
      },

      current_tension: 54,

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
          active: true,
          severity: "moderate"
        }
      },

      change_tolerance:
        "moderate"
    }
  }
];


function scenarioSummary(
  scenario
) {
  return {
    type:
      scenario.type,

    racquet:
      scenario
        ?.racquet
        ?.model ??
      scenario
        ?.racquet
        ?.id ??
      null,

    string:
      scenario
        ?.string
        ?.model ??
      scenario
        ?.string
        ?.id ??
      null,

    gauge_mm:
      scenario
        ?.string
        ?.gauge_mm ??
      null,

    tension_lbs:
      scenario
        ?.tension
        ?.recommended_lbs ??
      scenario
        ?.tension
        ?.lbs ??
      null,

    range:
      (
        scenario
          ?.tension
          ?.working_range_lbs
          ?.minimum_lbs !==
        undefined
      )
        ? `${
            scenario
              .tension
              .working_range_lbs
              .minimum_lbs
          }-${
            scenario
              .tension
              .working_range_lbs
              .maximum_lbs
          }`
        : null
  };
}


for (
  const testCase
  of CASES
) {
  console.log(
    "\n\n========================================"
  );

  console.log(
    `CASE: ${testCase.id}`
  );

  console.log(
    testCase.title
  );

  console.log(
    "========================================"
  );


  try {
    const playerProfile =
      await buildPlayerProfile(
        testCase.input
      );


    const matchingResult =
      await runMatchingEngine(
        playerProfile
      );


    const scenarioResult =
      generateSetupScenarios({
        playerProfile,
        matchingResult
      });


    console.log(
      "\nPLAYER PROFILE"
    );

    console.dir(
      playerProfile,
      {
        depth: 4
      }
    );


    console.log(
      "\nCANDIDATE COUNTS"
    );

    console.log(
      matchingResult
        ?.candidate_counts ??
      null
    );


    console.log(
      "\nSCENARIOS"
    );

    console.table(
      (
        scenarioResult
          ?.scenarios ??
        []
      )
        .map(
          scenarioSummary
        )
    );


    if (
      testCase.id === "comfort_physical_rf01"
    ) {
      console.log(
        "\nMINIMAL CHANGE SCORE DIAGNOSTIC"
      );

      const minimal =
        scenarioResult?.scenarios?.find?.(
          x =>
            x?.type ===
            "minimal_change"
        );

      console.log(
        JSON.stringify(
          {
            racquet:
              minimal?.racquet
                ? {
                    id: minimal.racquet.id,
                    scenario_score:
                      minimal.racquet.scenario_score,
                    components:
                      minimal.racquet.score_components
                  }
                : null,

            string:
              minimal?.string
                ? {
                    id: minimal.string.id,
                    scenario_score:
                      minimal.string.scenario_score,
                    components:
                      minimal.string.score_components
                  }
                : null
          },
          null,
          2
        )
      );
    }

    console.log(
      "\nRAW SCENARIO META"
    );

    console.dir(
      {
        version:
          scenarioResult
            ?.version ??
          scenarioResult
            ?.engine_version ??
          null,

        scenario_count:
          scenarioResult
            ?.scenarios
            ?.length ??
          0
      },
      {
        depth: 3
      }
    );

  } catch (error) {
    console.error(
      "CASE FAILED:",
      error instanceof Error
        ? error.message
        : String(error)
    );
  }
}
