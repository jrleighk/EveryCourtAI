import { parsePlayerInput } from "../../engine/input_parser.js";
import { runConversationStateEngine } from "../../engine/conversation_state_engine.js";
import { buildPlayerProfile } from "../../engine/player_engine.js";
import { runMatchingEngine } from "../../engine/matching_engine.js";
import { generateSetupScenarios } from "../../engine/setup_scenario_engine.js";

const failures = [];

function check(ok, message) {
  if (!ok) failures.push(message);
}

let state = null;

/* TURN 1 */
const m1 =
  "我现在用 Wilson RF 01 Pro Classic，HAWK TOUCH 1.25，54磅，想增加旋转。";

state =
  runConversationStateEngine({
    previousState: state,
    parserResult: parsePlayerInput(m1),
    message: m1
  }).conversation_state;

/* TURN 2 */
const m2 =
  "我不想换球拍和球线，只想调整磅数。";

state =
  runConversationStateEngine({
    previousState: state,
    parserResult: parsePlayerInput(m2),
    message: m2
  }).conversation_state;

check(
  state.player_input?.change_intent?.preserve_racquet === true,
  "Turn 2 preserve_racquet"
);

check(
  state.player_input?.change_intent?.preserve_string === true,
  "Turn 2 preserve_string"
);

/* TURN 3 */
const m3 =
  "我现在主要想增加旋转。";

state =
  runConversationStateEngine({
    previousState: state,
    parserResult: parsePlayerInput(m3),
    message: m3
  }).conversation_state;

check(
  state.player_input?.preferences?.change_tolerance === "minimal",
  "Unrelated turn changed change_tolerance"
);

check(
  state.player_input?.change_intent?.preferred_change === "tension_only",
  "Unrelated turn cleared change intent"
);

/* TURN 4 */
const m4 =
  "球拍不换，但球线可以换。";

state =
  runConversationStateEngine({
    previousState: state,
    parserResult: parsePlayerInput(m4),
    message: m4
  }).conversation_state;

check(
  state.player_input?.change_intent?.preserve_racquet === true,
  "Turn 4 preserve_racquet"
);

check(
  state.player_input?.change_intent?.preserve_string === false,
  "Turn 4 preserve_string override"
);

check(
  state.player_input?.change_intent?.preferred_change === "string_first",
  "Turn 4 preferred_change"
);

/* END TO END */
const profile =
  await buildPlayerProfile(
    state.player_input
  );

const matching =
  await runMatchingEngine(
    profile
  );

const result =
  generateSetupScenarios({
    playerProfile: profile,
    matchingResult: matching
  });

for (const scenario of result.scenarios) {

  check(
    scenario.racquet?.id === "wilson_rf_01_pro_classic",
    `${scenario.type}: racquet was not preserved`
  );
}

console.log("========================================");
console.log("MULTITURN CHANGE INTENT V1");
console.log("========================================");

console.table(
  result.scenarios.map(s => ({
    type: s.type,
    strategy: s.decision?.strategy,
    racquet: s.racquet?.id,
    string: s.string?.id
  }))
);

if (failures.length) {
  console.log("RESULT: FAIL");
  failures.forEach(x => console.log("-", x));
  process.exitCode = 1;
} else {
  console.log("RESULT: PASS");
}
