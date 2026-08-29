import fs from "node:fs";


const source =
    fs.readFileSync(
        "./scripts/chat_manager.js",
        "utf8"
    );


const indexHtml =
    fs.readFileSync(
        "./index.html",
        "utf8"
    );


const tests = [

    {
        id:
            "visibility_helper_exists",

        pass:
            source.includes(
                "function setRecommendationPanelVisible("
            )
    },

    {
        id:
            "helper_targets_recommendation_panel",

        pass:
            source.includes(
                '".recommendation-panel"'
            )
    },

    {
        id:
            "comparison_hides_recommendation_panel",

        pass:
            /hasComparisonView[\s\S]*?setRecommendationPanelVisible\(\s*false\s*\)[\s\S]*?renderComparisonView/.test(
                source
            )
    },

    {
        id:
            "recommendation_restores_panel",

        pass:
            /result[\s\S]*?\.recommendation[\s\S]*?setRecommendationPanelVisible\(\s*true\s*\)[\s\S]*?updateRecommendationCard/.test(
                source
            )
    },

    {
        id:
            "visibility_uses_hidden_state",

        pass:
            source.includes(
                "panel.hidden ="
            )
    },

    {
        id:
            "hidden_css_contract_exists",

        pass:
            indexHtml.includes(
                ".recommendation-panel[hidden]"
            ) &&
            indexHtml.includes(
                "none !important"
            )
    }
];


console.log(
    "========================================"
);

console.log(
    "COMPARISON UI STATE CONTRACT V1"
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
