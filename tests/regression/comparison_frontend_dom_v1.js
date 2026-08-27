import fs from "fs";


const chatManager =
  fs.readFileSync(
    "scripts/chat_manager.js",
    "utf8"
  );


const indexHtml =
  fs.readFileSync(
    "index.html",
    "utf8"
  );


const checks = [

  {
    id:
      "renderer_exists",

    pass:
      chatManager.includes(
        "export function renderComparisonView"
      )
  },

  {
    id:
      "renderer_uses_comparison_view_ready",

    pass:
      chatManager.includes(
        '"comparison_view_ready"'
      )
  },

  {
    id:
      "response_routes_comparison_ready",

    pass:
      chatManager.includes(
        'result.status ==='
      ) &&
      chatManager.includes(
        '"comparison_ready"'
      )
  },

  {
    id:
      "response_calls_renderer",

    pass:
      chatManager.includes(
        "renderComparisonView("
      )
  },

  {
    id:
      "comparison_card_class_exists",

    pass:
      chatManager.includes(
        '"comparison-card"'
      )
  },

  {
    id:
      "comparison_products_class_exists",

    pass:
      chatManager.includes(
        '"comparison-products"'
      )
  },

  {
    id:
      "comparison_table_class_exists",

    pass:
      chatManager.includes(
        '"comparison-table"'
      )
  },

  {
    id:
      "comparison_narrative_class_exists",

    pass:
      chatManager.includes(
        "comparison-narrative"
      )
  },

  {
    id:
      "css_comparison_card",

    pass:
      indexHtml.includes(
        ".comparison-card {"
      )
  },

  {
    id:
      "css_comparison_products",

    pass:
      indexHtml.includes(
        ".comparison-products {"
      )
  },

  {
    id:
      "css_comparison_row",

    pass:
      indexHtml.includes(
        ".comparison-row {"
      )
  },

  {
    id:
      "css_comparison_narrative",

    pass:
      indexHtml.includes(
        ".comparison-narrative-item {"
      )
  },

  {
    id:
      "responsive_comparison_card",

    pass:
      indexHtml.includes(
        ".comparison-card {"
      ) &&
      indexHtml.includes(
        "width:\n          100%;"
      )
  }

];


let passed = 0;
let failed = 0;


for (
  const item
  of checks
) {

  if (
    item.pass
  ) {

    passed++;

  } else {

    failed++;
  }
}


console.log(
  "========================================"
);

console.log(
  "COMPARISON FRONTEND DOM V1"
);

console.log(
  "========================================"
);


console.table(
  checks
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
  `Total: ${checks.length}`
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
