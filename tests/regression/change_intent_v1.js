import { parsePlayerInput } from "../../engine/input_parser.js";
import { buildPlayerProfile } from "../../engine/player_engine.js";
import { runMatchingEngine } from "../../engine/matching_engine.js";
import { generateSetupScenarios } from "../../engine/setup_scenario_engine.js";

const failures = [];

function check(ok, message) {
  if (!ok) failures.push(message);
}

/* Parser */
const parsed = parsePlayerInput(
  "我不想换球拍和球线，只想调整磅数。"
);

check(
  parsed.player_input?.preferences?.change_tolerance === "minimal",
  "Parser change_tolerance"
);

check(
  parsed.player_input?.change_intent?.preserve_racquet === true,
  "Parser preserve_racquet"
);

check(
  parsed.player_input?.change_intent?.preserve_string === true,
  "Parser preserve_string"
);

check(
  parsed.player_input?.change_intent?.preferred_change === "tension_only",
  "Parser preferred_change"
);

/* Scenario */
const profile = await buildPlayerProfile({
  current_racquet: { id: "wilson_rf_01_pro_classic" },
  current_string: {
    id: "head_hawk_touch",
    gauge_mm: 1.25
  },
  current_tension: 54,
  primary_goal: "more_spin",
  playing_style: "baseline",
  swing_speed: "fast",
  preferences: {
    change_tolerance: "minimal"
  },
  change_intent: {
    change_tolerance: "minimal",
    preserve_racquet: true,
    preserve_string: true,
    preferred_change: "tension_only"
  }
});

const matching = await runMatchingEngine(profile);

const result = generateSetupScenarios({
  playerProfile: profile,
  matchingResult: matching
});

for (const scenario of result.scenarios) {
  check(
    scenario.decision?.equipment_change_count === 0,
    `${scenario.type}: equipment changed`
  );

  check(
    scenario.decision?.strategy === "adjust_tension_only",
    `${scenario.type}: wrong strategy`
  );
}

console.log("========================================");
console.log("CHANGE INTENT V1");
console.log("========================================");

console.table(
  result.scenarios.map(s => ({
    type: s.type,
    strategy: s.decision?.strategy,
    equipment_changes:
      s.decision?.equipment_change_count
  }))
);

if (failures.length) {
  console.log("RESULT: FAIL");
  failures.forEach(x => console.log("-", x));
  process.exitCode = 1;
} else {
  console.log("RESULT: PASS");
}
