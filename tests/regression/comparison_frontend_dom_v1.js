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
      "comparison_frontend_uses_locale_object_contract",

    pass:
      chatManager.includes(
        "?.locale"
      ) &&
      chatManager.includes(
        "?.code ??"
      ) &&
      chatManager.includes(
        "getComparisonPresentation"
      ) &&
      chatManager.includes(
        "comparisonI18n"
      )
  },

  {
    id:
      "comparison_frontend_legacy_locale_checks_removed",

    pass:
      !chatManager.includes(
        'language === "zh"'
      ) &&
      !chatManager.includes(
        'language === "zh-cn"'
      ) &&
      !chatManager.includes(
        'language === "zh-tw"'
      ) &&
      !chatManager.includes(
        'language === "zh-tc"'
      )
  },

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
        ".personalized_prompt_title"
      ) &&
      chatManager.includes(
        ".personalized_prompt_text"
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
      "physical_profile_all_region_fields_exist",

    pass:
      [
        "playerShoulderSensitivity",
        "playerElbowSensitivity",
        "playerWristSensitivity",
        "playerNeckSensitivity",
        "playerLowerBackSensitivity",
        "playerHipSensitivity",
        "playerKneeSensitivity",
        "playerAnkleSensitivity"
      ].every(
        (id) =>
          indexHtml.includes(
            `id="${id}"`
          )
      )
  },

  {
    id:
      "physical_profile_all_region_readers_exist",

    pass:
      [
        "playerShoulderSensitivity",
        "playerElbowSensitivity",
        "playerWristSensitivity",
        "playerNeckSensitivity",
        "playerLowerBackSensitivity",
        "playerHipSensitivity",
        "playerKneeSensitivity",
        "playerAnkleSensitivity"
      ].every(
        (id) =>
          chatManager.includes(
            `"${id}"`
          )
      )
  },

  {
    id:
      "physical_profile_all_canonical_fields_exist",

    pass:
      [
        "shoulder_sensitivity",
        "elbow_sensitivity",
        "wrist_sensitivity",
        "neck_sensitivity",
        "lower_back_sensitivity",
        "hip_sensitivity",
        "knee_sensitivity",
        "ankle_sensitivity"
      ].every(
        (field) =>
          chatManager.includes(
            field
          )
      )
  },

  {
    id:
      "physical_profile_dynamic_payload_exists",

    pass:
      chatManager.includes(
        "physicalSensitivityFields"
      ) &&
      chatManager.includes(
        "physicalCondition"
      ) &&
      chatManager.includes(
        "Object.entries"
      ) &&
      chatManager.includes(
        "playerInput.physical_condition"
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
