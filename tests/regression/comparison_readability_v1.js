import fs from "node:fs";


const indexHtml =
    fs.readFileSync(
        "index.html",
        "utf8"
    );


const chatManager =
    fs.readFileSync(
        "scripts/chat_manager.js",
        "utf8"
    );


const comparisonI18n =
    fs.readFileSync(
        "scripts/comparison_i18n_v1.js",
        "utf8"
    );


let passed = 0;
let failed = 0;


function check(
    id,
    condition
) {

    const pass =
        Boolean(
            condition
        );


    console.log({
        id,
        pass
    });


    if (pass) {
        passed++;
    } else {
        failed++;
    }
}


console.log(
    "========================================"
);

console.log(
    "COMPARISON READABILITY V1"
);

console.log(
    "========================================"
);


check(
    "renderer_uses_semantic_narrative_id",
    chatManager.includes(
        "item?.id"
    )
);


check(
    "renderer_uses_narrative_labels",
    chatManager.includes(
        "narrative_labels"
    )
);


check(
    "narrative_label_element_exists",
    chatManager.includes(
        "comparison-narrative-label"
    )
);


check(
    "narrative_text_element_exists",
    chatManager.includes(
        "comparison-narrative-text"
    )
);


check(
    "existing_narrative_item_preserved",
    chatManager.includes(
        '"comparison-narrative-item"'
    )
);


check(
    "narrative_label_css_exists",
    indexHtml.includes(
        ".comparison-narrative-label {"
    )
);


check(
    "narrative_text_css_exists",
    indexHtml.includes(
        ".comparison-narrative-text {"
    )
);


check(
    "mobile_narrative_css_exists",
    indexHtml.includes(
        "@media (max-width: 760px)"
    ) &&
    indexHtml.includes(
        ".comparison-narrative-text {"
    )
);


const requiredIds = [
    "ease_and_demand",
    "forgiveness",
    "stability_and_plow",
    "performance_identity"
];


for (
    const id
    of requiredIds
) {

    check(
        `semantic_label_${id}`,
        comparisonI18n.includes(
            id
        )
    );
}


const expectedLabels = [
    "Swing Demand",
    "Forgiveness",
    "Stability & Plow",
    "Playing Style",

    "挥拍负担",
    "容错",
    "稳定与质量感",
    "球拍取向",

    "揮拍負擔",
    "容錯",
    "穩定與質量感",
    "球拍取向",

    "Exigence du swing",
    "Tolérance",
    "Stabilité et inertie",
    "Style de jeu",

    "Exigencia de swing",
    "Tolerancia",
    "Estabilidad e inercia",
    "Estilo de juego",

    "スイング負荷",
    "寛容性",
    "安定性と質量感",
    "プレースタイル"
];


for (
    const label
    of expectedLabels
) {

    check(
        `label_${label}`,
        comparisonI18n.includes(
            label
        )
    );
}


/**
 * Presentation only:
 * this layer must not move comparison reasoning
 * into frontend code.
 */

check(
    "frontend_has_no_scoring_logic",
    !chatManager.includes(
        "score_breakdown"
    )
);


check(
    "frontend_has_no_internal_evidence",
    !chatManager.includes(
        ".evidence"
    )
);


console.log("");
console.log(
    "========================================"
);

console.log(
    "SUMMARY"
);

console.log(
    "========================================"
);

console.log(
    `Total: ${passed + failed}`
);

console.log(
    `Passed: ${passed}`
);

console.log(
    `Failed: ${failed}`
);


if (
    failed > 0
) {

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
