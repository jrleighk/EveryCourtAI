import {
  buildPlayerProfile
} from "../../engine/player_engine.js";

import {
  runMatchingEngine
} from "../../engine/matching_engine.js";

import {
  generateSetupScenarios
} from "../../engine/setup_scenario_engine.js";


const profile =
  await buildPlayerProfile({
    current_racquet: {
      id: "wilson_rf_01_pro_classic"
    },

    current_string: {
      id: "head_hawk_touch",
      gauge_mm: 1.25
    },

    current_tension: 54,
    primary_goal: "more_spin",
    playing_style: "baseline",
    swing_speed: "fast",
    feel_preference: "connected",
    physical: {}
  });


const matching =
  await runMatchingEngine(
    profile
  );


const result =
  generateSetupScenarios({
    playerProfile: profile,
    matchingResult: matching
  });


const minimal =
  result.scenarios.find(
    s =>
      s.type ===
      "minimal_change"
  );


const failures = [];


if (
  minimal?.decision?.strategy !==
  "adjust_tension_only"
) {
  failures.push(
    "Expected adjust_tension_only strategy"
  );
}


if (
  minimal?.decision
    ?.equipment_change_count !==
  0
) {
  failures.push(
    "Expected zero equipment changes"
  );
}


if (
  minimal?.decision
    ?.setup_change_count !==
  1
) {
  failures.push(
    "Expected one setup change"
  );
}


if (
  minimal?.decision
    ?.tension_changed !==
  true
) {
  failures.push(
    "Expected tension_changed true"
  );
}


if (
  !minimal?.explanation?.reasons?.includes(
    "adjust_tension_only"
  )
) {
  failures.push(
    "Missing adjust_tension_only explanation"
  );
}


console.log(
  "========================================"
);

console.log(
  "TENSION ONLY STRATEGY V1"
);

console.log(
  "========================================"
);

console.log({
  strategy:
    minimal?.decision?.strategy,

  equipment_changes:
    minimal?.decision
      ?.equipment_change_count,

  setup_changes:
    minimal?.decision
      ?.setup_change_count,

  tension_delta:
    minimal?.decision
      ?.tension_delta_lbs,

  explanation:
    minimal?.explanation?.reasons
});


if (
  failures.length === 0
) {

  console.log(
    "RESULT: PASS"
  );

} else {

  console.log(
    "RESULT: FAIL"
  );

  for (
    const failure
    of failures
  ) {
    console.log(
      `- ${failure}`
    );
  }

  process.exitCode =
    1;
}
