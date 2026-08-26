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
    primary_goal: "more_comfort",
    playing_style: "all_court",
    swing_speed: "medium",
    feel_preference: "soft",

    physical: {
      shoulder: {
        active: true,
        severity: "moderate"
      }
    }
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
    x => x.type === "minimal_change"
  );


const failures = [];


if (
  minimal?.decision?.strategy !==
  "change_string_only"
) {
  failures.push(
    "Expected strategy change_string_only"
  );
}


if (
  !minimal?.explanation?.reasons?.includes(
    "replace_string_for_better_fit"
  )
) {
  failures.push(
    "Missing replace_string_for_better_fit reason"
  );
}


const detail =
  minimal
    ?.explanation
    ?.reason_details
    ?.find(
      item =>
        item.code ===
        "replace_string_for_better_fit"
    );


if (
  !detail?.en ||
  !detail?.zh
) {
  failures.push(
    "Missing bilingual reason detail"
  );
}


console.log(
  "========================================"
);

console.log(
  "SCENARIO EXPLANATION V1"
);

console.log(
  "========================================"
);

console.log({
  strategy:
    minimal?.decision?.strategy ?? null,

  reasons:
    minimal?.explanation?.reasons ?? [],

  bilingual:
    Boolean(
      detail?.en &&
      detail?.zh
    )
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
