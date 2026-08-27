import fs from "fs";


const source =
    fs.readFileSync(
        "scripts/api_client.js",
        "utf8"
    );


const checks = [

    {
        id:
            "comparison_preserved",

        pass:
            source.includes(
                "comparison:"
            ) &&
            source.includes(
                "data.comparison"
            )
    },

    {
        id:
            "comparison_view_preserved",

        pass:
            source.includes(
                "comparison_view:"
            ) &&
            source.includes(
                "data.comparison_view"
            )
    },

    {
        id:
            "comparison_clarification_preserved",

        pass:
            source.includes(
                "comparison_clarification:"
            ) &&
            source.includes(
                "data.comparison_clarification"
            )
    },

    {
        id:
            "question_intent_preserved",

        pass:
            source.includes(
                "question_intent:"
            ) &&
            source.includes(
                "data.question_intent"
            )
    },

    {
        id:
            "comparison_view_renderer_exists",

        pass:
            fs
                .readFileSync(
                    "scripts/chat_manager.js",
                    "utf8"
                )
                .includes(
                    "renderComparisonView("
                )
    },

    {
        id:
            "comparison_view_ready_gate_exists",

        pass:
            fs
                .readFileSync(
                    "scripts/chat_manager.js",
                    "utf8"
                )
                .includes(
                    '"comparison_view_ready"'
                )
    }

];


let passed =
    0;

let failed =
    0;


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
    "COMPARISON API CLIENT CONTRACT V1"
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
