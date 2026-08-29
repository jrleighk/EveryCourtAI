import fs from "node:fs";
import path from "node:path";

const root =
    process.cwd();

const html =
    fs.readFileSync(
        path.join(
            root,
            "index.html"
        ),
        "utf8"
    );

const chat =
    fs.readFileSync(
        path.join(
            root,
            "scripts/chat_manager.js"
        ),
        "utf8"
    );

const languageFiles = {
    en:
        "language/en.json",

    "zh-CN":
        "language/zh.json",

    "zh-HK":
        "language/zh-tc.json",

    fr:
        "language/fr.json",

    es:
        "language/es.json",

    ja:
        "language/ja.json"
};

const expectedLabels = {
    en:
        "New Analysis",

    "zh-CN":
        "新分析",

    "zh-HK":
        "新分析",

    fr:
        "Nouvelle analyse",

    es:
        "Nuevo análisis",

    ja:
        "新しい分析"
};

const checks = [];

function check(
    id,
    pass
) {

    checks.push({
        id,
        pass:
            Boolean(pass)
    });
}

check(
    "new_analysis_button_exists",
    html.includes(
        'id="newAnalysisButton"'
    )
);

check(
    "new_analysis_uses_i18n",
    html.includes(
        'data-i18n="chat.new_analysis"'
    )
);

check(
    "new_analysis_initially_hidden",
    /id="newAnalysisButton"[\s\S]*?hidden[\s\S]*?>/.test(
        html
    )
);

check(
    "visibility_helper_exists",
    chat.includes(
        "function setNewAnalysisButtonVisible("
    )
);

check(
    "successful_response_shows_new_analysis",
    /updateConversationStateFromResult\([\s\S]*?setNewAnalysisButtonVisible\(\s*true\s*\)/.test(
        chat
    )
);

check(
    "clear_conversation_hides_new_analysis",
    /clearConversation\(\)[\s\S]*?setNewAnalysisButtonVisible\(\s*false\s*\)/.test(
        chat
    )
);

check(
    "clear_conversation_restores_welcome",
    /clearConversation\(\)[\s\S]*?t\(\s*"chat\.welcome"/.test(
        chat
    )
);

check(
    "clear_conversation_restores_recommendation_panel",
    /clearConversation\(\)[\s\S]*?setRecommendationPanelVisible\(\s*true\s*\)/.test(
        chat
    )
);

for (
    const [
        locale,
        filename
    ]
    of Object.entries(
        languageFiles
    )
) {

    const data =
        JSON.parse(
            fs.readFileSync(
                path.join(
                    root,
                    filename
                ),
                "utf8"
            )
        );

    check(
        `new_analysis_translation_${locale}`,
        data
            ?.chat
            ?.new_analysis ===
            expectedLabels[
                locale
            ]
    );
}

console.log(
    "========================================"
);

console.log(
    "NEW ANALYSIS UI V1"
);

console.log(
    "========================================"
);

console.table(
    checks
);

const passed =
    checks.filter(
        item =>
            item.pass
    ).length;

const failed =
    checks.length -
    passed;

console.log("");
console.log(
    "Total:",
    checks.length
);

console.log(
    "Passed:",
    passed
);

console.log(
    "Failed:",
    failed
);

if (
    failed >
    0
) {

    console.log("");
    console.log(
        "RESULT: FAIL"
    );

    process.exit(
        1
    );
}

console.log("");
console.log(
    "RESULT: PASS"
);
