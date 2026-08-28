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
  },



  {
    id:
      "player_fit_renderer_exists",

    pass:
      chatManager.includes(
        "comparison-player-fit"
      )
  },

  {
    id:
      "player_fit_available_gate",

    pass:
      chatManager.includes(
        "playerFit?.available"
      )
  },

  {
    id:
      "player_fit_swing_signal",

    pass:
      chatManager.includes(
        "swing_compatibility"
      )
  },

  {
    id:
      "player_fit_weight_signal",

    pass:
      chatManager.includes(
        "weight_compatibility"
      )
  },

  {
    id:
      "player_fit_physical_signal",

    pass:
      chatManager.includes(
        "physical_demand"
      )
  },

  {
    id:
      "player_fit_physical_risk",

    pass:
      chatManager.includes(
        "physical_risk"
      )
  },

  {
    id:
      "player_fit_goal_signal",

    pass:
      chatManager.includes(
        "goal_alignment"
      )
  },

  {
    id:
      "player_fit_css_exists",

    pass:
      indexHtml.includes(
        ".comparison-player-fit {"
      ) &&
      indexHtml.includes(
        ".comparison-player-fit-table {"
      )
  },

  {
    id:
      "player_fit_mobile_css_exists",

    pass:
      indexHtml.includes(
        ".comparison-player-fit-row {"
      )
  },

  {
    id:
      "player_fit_no_score_breakdown",

    pass:
      !chatManager.includes(
        "score_breakdown"
      )
  },

  {
    id:
      "player_fit_no_internal_evidence",

    pass:
      !chatManager.includes(
        ".evidence"
      )
  },

  {
    id:
      "player_fit_personalized_gate",

    pass:
      chatManager.includes(
        "playerFit?.personalized"
      )
  },

  {
    id:
      "player_fit_profile_prompt_exists",

    pass:
      chatManager.includes(
        "comparison-player-fit-prompt"
      ) &&
      chatManager.includes(
        "获得你的个性化匹配"
      ) &&
      chatManager.includes(
        "Complete your player profile"
      )
  },

  {
    id:
      "player_fit_profile_prompt_css",

    pass:
      indexHtml.includes(
        ".comparison-player-fit-prompt {"
      ) &&
      indexHtml.includes(
        ".comparison-player-fit-prompt-text {"
      )
  },

  {
    id:
      "player_fit_table_still_exists",

    pass:
      chatManager.includes(
        "comparison-player-fit-table"
      ) &&
      chatManager.includes(
        "swing_compatibility"
      ) &&
      chatManager.includes(
        "goal_alignment"
      )
  }
,

  {
    id:
      "physical_profile_shoulder_field_exists",

    pass:
      indexHtml.includes(
        'id="playerShoulderSensitivity"'
      ) &&
      indexHtml.includes(
        'value="moderate"'
      )
  },

  {
    id:
      "physical_profile_shoulder_reader_exists",

    pass:
      chatManager.includes(
        '"playerShoulderSensitivity"'
      ) &&
      chatManager.includes(
        "shoulderSensitivity"
      )
  },

  {
    id:
      "physical_profile_condition_payload_exists",

    pass:
      chatManager.includes(
        "playerInput.physical_condition"
      ) &&
      chatManager.includes(
        "shoulder_sensitivity"
      )
  },

  {
    id:
      "physical_profile_condition_uses_selected_value",

    pass:
      chatManager.includes(
        "shoulder_sensitivity:"
      ) &&
      chatManager.includes(
        "shoulderSensitivity"
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
