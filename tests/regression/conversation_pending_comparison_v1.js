import {
  createConversationState,
  runConversationStateEngine,
  updatePendingComparisonContext,
  clearPendingComparisonContext
} from "../../engine/conversation_state_engine.js";


const tests = [];


function test(
  id,
  pass
) {

  tests.push({
    id,
    pass:
      Boolean(
        pass
      )
  });
}


const initialState =
  createConversationState();


test(
  "initial_pending_comparison_null",
  initialState
    ?.pending_comparison_context ===
    null
);


const storedState =
  updatePendingComparisonContext(
    initialState,
    {
      comparisonSubtype:
        "direct_comparison",

      products: [
        {
          id:
            "wilson_rf_01_pro_classic",

          brand:
            "Wilson",

          model:
            "RF 01 Pro Classic"
        }
      ],

      unresolvedTargets: [
        {
          index:
            0,

          raw_text:
            "Pure Drive",

          status:
            "not_found",

          candidates: [
            {
              product: {
                id:
                  "babolat_pure_drive_spectra_edition_2026"
              },

              score:
                63
            }
          ]
        }
      ],

      sourceMessage:
        "Pure Drive 和 RF 01 Pro Classic 哪个更适合我？",

      sourceTurn:
        1
    }
  );


test(
  "stored_pending_comparison_exists",
  storedState
    ?.pending_comparison_context
    ?.active ===
    true
);


test(
  "stored_subtype",
  storedState
    ?.pending_comparison_context
    ?.comparison_subtype ===
    "direct_comparison"
);


test(
  "stored_resolved_product",
  storedState
    ?.pending_comparison_context
    ?.products
    ?.[0]
    ?.id ===
    "wilson_rf_01_pro_classic"
);


test(
  "stored_unresolved_target",
  storedState
    ?.pending_comparison_context
    ?.unresolved_targets
    ?.[0]
    ?.raw_text ===
    "Pure Drive"
);


test(
  "stored_candidates_preserved",
  storedState
    ?.pending_comparison_context
    ?.unresolved_targets
    ?.[0]
    ?.candidates
    ?.[0]
    ?.product
    ?.id ===
    "babolat_pure_drive_spectra_edition_2026"
);


const nextTurn =
  runConversationStateEngine({
    previousState:
      storedState,

    parserResult: {
      success:
        true,

      player_input:
        {},

      missing_fields:
        []
    },

    message:
      "Spectra 2026",

    inputMode:
      "message"
  });


test(
  "next_turn_success",
  nextTurn
    ?.success ===
    true
);


test(
  "pending_context_survives_turn",
  nextTurn
    ?.conversation_state
    ?.pending_comparison_context
    ?.active ===
    true
);


test(
  "pending_source_message_survives",
  nextTurn
    ?.conversation_state
    ?.pending_comparison_context
    ?.source_message ===
    "Pure Drive 和 RF 01 Pro Classic 哪个更适合我？"
);


test(
  "pending_candidate_survives_turn",
  nextTurn
    ?.conversation_state
    ?.pending_comparison_context
    ?.unresolved_targets
    ?.[0]
    ?.candidates
    ?.[0]
    ?.product
    ?.id ===
    "babolat_pure_drive_spectra_edition_2026"
);


const clearedState =
  clearPendingComparisonContext(
    nextTurn
      ?.conversation_state
  );


test(
  "pending_context_cleared",
  clearedState
    ?.pending_comparison_context ===
    null
);


console.log(
  "========================================"
);

console.log(
  "CONVERSATION PENDING COMPARISON V1"
);

console.log(
  "========================================"
);

console.table(
  tests
);


const passed =
  tests.filter(
    item =>
      item.pass
  ).length;


const failed =
  tests.length -
  passed;


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
  `Total: ${tests.length}`
);

console.log(
  `Passed: ${passed}`
);

console.log(
  `Failed: ${failed}`
);

console.log("");

console.log(
  failed === 0
    ? "RESULT: PASS"
    : "RESULT: FAIL"
);


if (
  failed >
  0
) {

  process.exitCode =
    1;
}
