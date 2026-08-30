import {
  routeQuestionIntent
} from "../../engine/intent_response_router_v1.js";


console.log(
  "========================================"
);
console.log(
  "INTENT RESPONSE ROUTER V1"
);
console.log(
  "========================================"
);


const cases = [

  {
    id:
      "recommend_setup",

    intent:
      "recommend_setup",

    expected_mode:
      "full_recommendation",

    expected_capability:
      "available"
  },

  {
    id:
      "adjust_tension",

    intent:
      "adjust_tension",

    expected_mode:
      "tension_focused",

    expected_capability:
      "available"
  },

  {
    id:
      "explain_current_setup",

    intent:
      "explain_current_setup",

    expected_mode:
      "explanation_focused",

    expected_capability:
      "available"
  },

  {
    id:
      "update_preferences",

    intent:
      "update_preferences",

    expected_mode:
      "preference_update",

    expected_capability:
      "available"
  },

  {
    id:
      "physical_comfort",

    intent:
      "physical_comfort",

    expected_mode:
      "physical_focused",

    expected_capability:
      "available"
  },

  {
    id:
      "compare_products",

    intent:
      "compare_products",

    expected_mode:
      "comparison_pending",

    expected_capability:
      "pending"
  },

  {
    id:
      "general_tennis_question",

    intent:
      "general_tennis_question",

    expected_mode:
      "general_question_pending",

    expected_capability:
      "pending"
  },

  {
    id:
      "unknown",

    intent:
      "unknown",

    expected_mode:
      "default",

    expected_capability:
      "fallback"
  },

  /**
   * Backward compatibility:
   *
   * Question Intent V1 currently exposes both:
   *
   * - primary_intent
   * - intent
   *
   * Router should still work when only legacy
   * intent is supplied.
   */

  {
    id:
      "legacy_intent_fallback",

    legacy_intent:
      "adjust_tension",

    expected_mode:
      "tension_focused",

    expected_capability:
      "available"
  },

  /**
   * Unknown / unsupported future intent
   * must fail safely into default mode.
   */

  {
    id:
      "effective_intent_override",

    intent:
      "general_tennis_question",

    effective_intent:
      "recommend_setup",

    expected_primary_intent:
      "recommend_setup",

    expected_mode:
      "full_recommendation",

    expected_capability:
      "available"
  },

  {
    id:
      "unsupported_future_intent",

    intent:
      "some_future_intent",

    expected_mode:
      "default",

    expected_capability:
      "fallback"
  }

];


let passed = 0;
let failed = 0;

const rows = [];


for (const test of cases) {

  const input =
    test.legacy_intent
      ? {
          intent:
            test.legacy_intent,

          context:
            {}
        }
      : {
          primary_intent:
            test.intent,

          context:
            {}
        };


  const result =
    routeQuestionIntent(
      input,
      test.effective_intent ?? null
    );


  const modePass =
    result.response_mode ===
    test.expected_mode;


  const capabilityPass =
    result.capability_status ===
    test.expected_capability;


  const primaryIntentPass =
    result.primary_intent ===
    (
      test.expected_primary_intent ??
      test.intent ??
      test.legacy_intent
    );


  const pass =
    modePass &&
    capabilityPass &&
    primaryIntentPass;


  if (pass) {
    passed++;
  } else {
    failed++;
  }


  rows.push({

    id:
      test.id,

    intent:
      test.intent ??
      test.legacy_intent,

    expected_mode:
      test.expected_mode,

    actual_mode:
      result.response_mode,

    expected_capability:
      test.expected_capability,

    actual_capability:
      result.capability_status,

    pass
  });
}


console.table(
  rows
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
  `Total: ${cases.length}`
);

console.log(
  `Passed: ${passed}`
);

console.log(
  `Failed: ${failed}`
);


if (failed > 0) {

  console.log("");
  console.log(
    "RESULT: FAIL"
  );

  process.exit(1);
}


console.log("");
console.log(
  "RESULT: PASS"
);
