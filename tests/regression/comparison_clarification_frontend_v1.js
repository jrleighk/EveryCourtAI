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
                "export function renderComparisonClarification"
            )
    },

    {
        id:
            "renderer_requires_available",

        pass:
            chatManager.includes(
                "clarification.available"
            )
    },

    {
        id:
            "renderer_uses_candidates",

        pass:
            chatManager.includes(
                "clarification.candidates"
            )
    },

    {
        id:
            "candidate_button_created",

        pass:
            chatManager.includes(
                '"button"'
            ) &&
            chatManager.includes(
                '"comparison-clarification-candidate"'
            )
    },

    {
        id:
            "candidate_uses_label",

        pass:
            chatManager.includes(
                "candidate?.label"
            )
    },

    {
        id:
            "candidate_preserves_product_id",

        pass:
            chatManager.includes(
                "button.dataset.productId"
            )
    },

    {
        id:
            "candidate_click_listener",

        pass:
            chatManager.includes(
                'button.addEventListener('
            ) &&
            chatManager.includes(
                '"click"'
            )
    },

    {
        id:
            "click_reuses_prompt_input",

        pass:
            chatManager.includes(
                "promptInputElement.value ="
            ) &&
            chatManager.includes(
                "candidateLabel"
            )
    },

    {
        id:
            "click_reuses_submit_path",

        pass:
            chatManager.includes(
                "await submitCurrentPrompt();"
            )
    },

    {
        id:
            "clarification_status_routed",

        pass:
            chatManager.includes(
                '"comparison_clarification_required"'
            )
    },

    {
        id:
            "structured_contract_routed",

        pass:
            chatManager.includes(
                "hasComparisonClarification"
            ) &&
            chatManager.includes(
                "renderComparisonClarification("
            )
    },

    {
        id:
            "clarification_hides_recommendation_panel",

        pass:
            chatManager.includes(
                "hasComparisonClarification"
            ) &&
            chatManager.includes(
                "setRecommendationPanelVisible("
            )
    },

    {
        id:
            "css_card_exists",

        pass:
            indexHtml.includes(
                ".comparison-clarification-card {"
            )
    },

    {
        id:
            "css_candidate_exists",

        pass:
            indexHtml.includes(
                ".comparison-clarification-candidate {"
            )
    },

    {
        id:
            "css_hover_exists",

        pass:
            indexHtml.includes(
                ".comparison-clarification-candidate:hover:not(:disabled)"
            )
    },

    {
        id:
            "css_focus_visible_exists",

        pass:
            indexHtml.includes(
                ".comparison-clarification-candidate:focus-visible"
            )
    },

    {
        id:
            "css_disabled_exists",

        pass:
            indexHtml.includes(
                ".comparison-clarification-candidate:disabled"
            )
    }
];


console.log(
    "========================================"
);

console.log(
    "COMPARISON CLARIFICATION FRONTEND V1"
);

console.log(
    "========================================"
);


console.table(
    checks
);


const passed =
    checks.filter(
        check =>
            check.pass
    ).length;


const failed =
    checks.length -
    passed;


console.log(
    `\nTotal: ${checks.length}`
);

console.log(
    `Passed: ${passed}`
);

console.log(
    `Failed: ${failed}`
);


if (
    failed >
        0
) {

    console.log(
        "\nRESULT: FAIL"
    );

    process.exit(
        1
    );
}


console.log(
    "\nRESULT: PASS"
);
