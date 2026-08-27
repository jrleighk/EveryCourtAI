import {
  resolveComparisonClarification
} from "../../engine/comparison_clarification_resolver_v1.js";


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


const pendingContext = {

  active:
    true,

  source_turn:
    1,

  comparison_subtype:
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

  unresolved_targets: [
    {
      index:
        0,

      raw_text:
        "Pure Drive",

      status:
        "not_found",

      candidates:
        []
    }
  ],

  source_message:
    "Pure Drive 和 Wilson RF 01 Pro Classic 哪个更适合我？"
};


const resolved =
  resolveComparisonClarification({
    pendingContext,

    message:
      "Spectra Edition 2026"
  });


test(
  "clarification_success",
  resolved
    ?.success ===
    true
);


test(
  "clarification_ready",
  resolved
    ?.ready ===
    true
);


test(
  "clarification_status",
  resolved
    ?.status ===
    "comparison_clarification_resolved"
);


test(
  "resolved_product_a",
  resolved
    ?.product_a
    ?.id ===
    "babolat_pure_drive_spectra_edition_2026"
);


test(
  "preserved_product_b",
  resolved
    ?.product_b
    ?.id ===
    "wilson_rf_01_pro_classic"
);


test(
  "two_unique_products",
  Array.isArray(
    resolved
      ?.products
  ) &&
  resolved.products.length ===
    2 &&
  new Set(
    resolved.products.map(
      item =>
        item.id
    )
  ).size ===
    2
);


test(
  "clarification_message_preserved",
  resolved
    ?.clarification_message ===
    "Spectra Edition 2026"
);


test(
  "source_turn_preserved",
  resolved
    ?.source_turn ===
    1
);


const stillUnresolved =
  resolveComparisonClarification({
    pendingContext,

    message:
      "蓝色那个"
  });


test(
  "still_unresolved_success",
  stillUnresolved
    ?.success ===
    true
);


test(
  "still_unresolved_not_ready",
  stillUnresolved
    ?.ready ===
    false
);


test(
  "still_unresolved_status",
  stillUnresolved
    ?.status ===
    "comparison_clarification_still_unresolved"
);


const invalid =
  resolveComparisonClarification({
    pendingContext:
      null,

    message:
      "Spectra 2026"
  });


test(
  "invalid_input_rejected",
  invalid
    ?.success ===
    false &&
  invalid
    ?.ready ===
    false
);


const multipleTargets =
  resolveComparisonClarification({
    pendingContext: {
      ...pendingContext,

      products:
        [],

      unresolved_targets: [
        {
          index:
            0,

          raw_text:
            "Pure Drive",

          status:
            "not_found"
        },

        {
          index:
            1,

          raw_text:
            "另一个球拍",

          status:
            "not_found"
        }
      ]
    },

    message:
      "Spectra 2026"
  });


test(
  "multiple_targets_not_guessed",
  multipleTargets
    ?.status ===
    "comparison_clarification_multiple_targets"
);


console.log(
  "========================================"
);

console.log(
  "COMPARISON CLARIFICATION RESOLVER V1"
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
