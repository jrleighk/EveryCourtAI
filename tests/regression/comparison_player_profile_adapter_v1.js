import {
  adaptComparisonPlayerProfile
} from "../../engine/comparison_player_profile_adapter_v1.js";


function test(
  id,
  condition
) {

  return {
    id,
    pass:
      condition === true
  };
}


/**
 * ============================================================
 * CASE 1
 * Conversation / raw player profile
 * ============================================================
 */

const raw =
  adaptComparisonPlayerProfile({

    primary_goal:
      "more_comfort",

    playing_style:
      "all_court",

    swing_speed:
      "medium",

    physical_condition: {

      shoulder_sensitivity:
        "moderate",

      elbow_sensitivity:
        "none"
    },

    current_setup: {

      racquet_id:
        "wilson_rf_01_pro_classic"
    }
  });


/**
 * ============================================================
 * CASE 2
 * Player Profile V1 array-style playing_style
 * ============================================================
 */

const profileV1 =
  adaptComparisonPlayerProfile({

    primary_goal:
      "more_spin",

    playing_style: [
      "baseline_aggressive",
      "all_court"
    ],

    physical_condition: {

      wrist_sensitivity:
        "mild"
    }
  });


/**
 * ============================================================
 * CASE 3
 * Already canonical Matching Engine profile
 * ============================================================
 */

const canonical =
  adaptComparisonPlayerProfile({

    primary_goal:
      "more_control",

    playing_style: {

      primary:
        "all_court"
    },

    swing_speed: {

      overall:
        "fast"
    },

    physical: {

      shoulder: {

        active:
          true,

        severity:
          "high"
      }
    },

    current_setup: {

      racquet: {

        id:
          "wilson_rf_01_pro_classic"
      }
    }
  });


/**
 * ============================================================
 * CASE 4
 * Player Profile Adapter-style physical active constraints
 * ============================================================
 */

const adapterStyle =
  adaptComparisonPlayerProfile({

    playing_style: [
      "all_court"
    ],

    physical: {

      active_constraints: [

        {
          field:
            "lower_back_sensitivity",

          body_part:
            "lower_back",

          severity:
            "moderate",

          score:
            2
        }
      ]
    }
  });


/**
 * ============================================================
 * CASE 5
 * Invalid
 * ============================================================
 */

const invalid =
  adaptComparisonPlayerProfile(
    null
  );


const cases = [

  test(
    "raw_success",
    raw.success ===
      true
  ),

  test(
    "raw_status",
    raw.status ===
      "comparison_player_profile_ready"
  ),

  test(
    "raw_playing_style",
    raw.player_profile
      ?.playing_style
      ?.primary ===
      "all_court"
  ),

  test(
    "raw_swing_speed",
    raw.player_profile
      ?.swing_speed
      ?.overall ===
      "medium"
  ),

  test(
    "raw_shoulder_active",
    raw.player_profile
      ?.physical
      ?.shoulder
      ?.active ===
      true
  ),

  test(
    "raw_shoulder_severity",
    raw.player_profile
      ?.physical
      ?.shoulder
      ?.severity ===
      "moderate"
  ),

  test(
    "raw_elbow_none",
    raw.player_profile
      ?.physical
      ?.elbow
      ?.active ===
      false &&
    raw.player_profile
      ?.physical
      ?.elbow
      ?.severity ===
      "none"
  ),

  test(
    "raw_current_racquet",
    raw.player_profile
      ?.current_setup
      ?.racquet
      ?.id ===
      "wilson_rf_01_pro_classic"
  ),

  test(
    "profile_v1_style_array",
    profileV1.player_profile
      ?.playing_style
      ?.primary ===
      "baseline_aggressive"
  ),

  test(
    "profile_v1_wrist",
    profileV1.player_profile
      ?.physical
      ?.wrist
      ?.active ===
      true &&
    profileV1.player_profile
      ?.physical
      ?.wrist
      ?.severity ===
      "mild"
  ),

  test(
    "canonical_style_preserved",
    canonical.player_profile
      ?.playing_style
      ?.primary ===
      "all_court"
  ),

  test(
    "canonical_swing_preserved",
    canonical.player_profile
      ?.swing_speed
      ?.overall ===
      "fast"
  ),

  test(
    "canonical_physical_preserved",
    canonical.player_profile
      ?.physical
      ?.shoulder
      ?.active ===
      true &&
    canonical.player_profile
      ?.physical
      ?.shoulder
      ?.severity ===
      "high"
  ),

  test(
    "canonical_current_setup_preserved",
    canonical.player_profile
      ?.current_setup
      ?.racquet
      ?.id ===
      "wilson_rf_01_pro_classic"
  ),

  test(
    "adapter_style_physical",
    adapterStyle.player_profile
      ?.physical
      ?.lower_back
      ?.active ===
      true &&
    adapterStyle.player_profile
      ?.physical
      ?.lower_back
      ?.severity ===
      "moderate"
  ),

  test(
    "invalid_rejected",
    invalid.success ===
      false &&
    invalid.status ===
      "invalid_player_profile"
  )
];


console.log(
  "========================================"
);

console.log(
  "COMPARISON PLAYER PROFILE ADAPTER V1"
);

console.log(
  "========================================"
);

console.table(
  cases
);


const passed =
  cases.filter(
    item =>
      item.pass
  ).length;


const failed =
  cases.length -
  passed;


console.log(
  "\n========================================"
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

console.log(
  ""
);

console.log(
  failed === 0
    ? "RESULT: PASS"
    : "RESULT: FAIL"
);


if (
  failed > 0
) {

  process.exitCode =
    1;
}
