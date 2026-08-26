import { parsePlayerInput } from "../../engine/input_parser.js";
import { buildPlayerProfile } from "../../engine/player_engine.js";
import { runMatchingEngine } from "../../engine/matching_engine.js";
import { generateSetupScenarios } from "../../engine/setup_scenario_engine.js";

const failures = [];

function check(ok, msg) {
  if (!ok) failures.push(msg);
}

/* Parser */
const parsed = parsePlayerInput(
  "我愿意换球拍和球线，只要效果最好。"
);

check(
  parsed.player_input?.preferences?.change_tolerance === "open",
  "Parser change_tolerance"
);

check(
  parsed.player_input?.change_intent?.preserve_racquet === false,
  "Parser preserve_racquet"
);

check(
  parsed.player_input?.change_intent?.preserve_string === false,
  "Parser preserve_string"
);

check(
  parsed.player_input?.change_intent?.preferred_change === "best_overall",
  "Parser preferred_change"
);

/* Scenario */
const profile = await buildPlayerProfile({
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

  preferences: {
    change_tolerance: "open"
  },

  change_intent: {
    change_tolerance: "open",
    preserve_racquet: false,
    preserve_string: false,
    preferred_change: "best_overall"
  }
});

const matching =
  await runMatchingEngine(profile);

const result =
  generateSetupScenarios({
    playerProfile: profile,
    matchingResult: matching
  });

const best =
  result.scenarios.find(
    s => s.type === "best_overall"
  );

check(
  best != null,
  "Missing best_overall scenario"
);

check(
  best?.decision?.equipment_change_count > 0,
  "Best Overall did not exercise equipment-change freedom"
);

console.log("========================================");
console.log("OPEN CHANGE INTENT V1");
console.log("========================================");

console.table(
  result.scenarios.map(s => ({
    type: s.type,
    strategy: s.decision?.strategy,
    equipment_changes:
      s.decision?.equipment_change_count,
    racquet:
      s.setup?.racquet?.id,
    string:
      s.setup?.string?.id
  }))
);

if (failures.length) {
  console.log("RESULT: FAIL");
  failures.forEach(x => console.log("-", x));
  process.exitCode = 1;
} else {
  console.log("RESULT: PASS");
}
