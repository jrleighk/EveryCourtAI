import worker from "../../cloudflare/worker.js";


async function send(
    message,
    language
) {

    const request =
        new Request(
            "https://everycourt.test/ai",
            {
                method:
                    "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify({
                        message,
                        language
                    })
            }
        );


    const response =
        await worker.fetch(
            request,
            {},
            {}
        );


    return {
        http:
            response.status,

        body:
            await response.json()
    };
}


const blade =
    await send(
        "比较 Blade 和 RF01 Pro Classic",
        "zh-CN"
    );


const clarification =
    blade
        ?.body
        ?.comparison_clarification;


const candidates =
    Array.isArray(
        clarification?.candidates
    )
        ? clarification.candidates
        : [];


const tests = [

    {
        id:
            "http_200",

        pass:
            blade.http ===
            200
    },

    {
        id:
            "status_required",

        pass:
            blade
                ?.body
                ?.status ===
            "comparison_clarification_required"
    },

    {
        id:
            "structured_present",

        pass:
            clarification &&
            typeof clarification ===
                "object"
    },

    {
        id:
            "structured_available",

        pass:
            clarification
                ?.available ===
            true
    },

    {
        id:
            "structured_locale",

        pass:
            clarification
                ?.locale ===
            "zh-CN"
    },

    {
        id:
            "target_is_blade",

        pass:
            clarification
                ?.target
                ?.raw_text ===
            "Blade"
    },

    {
        id:
            "target_ambiguous",

        pass:
            clarification
                ?.target
                ?.status ===
            "ambiguous"
    },

    {
        id:
            "candidates_present",

        pass:
            candidates.length >=
            3
    },

    {
        id:
            "candidate_has_id",

        pass:
            typeof candidates[0]
                ?.id ===
            "string" &&
            candidates[0].id.length >
            0
    },

    {
        id:
            "candidate_has_label",

        pass:
            typeof candidates[0]
                ?.label ===
            "string" &&
            candidates[0].label.length >
            0
    },

    {
        id:
            "candidate_has_brand",

        pass:
            candidates[0]
                ?.brand ===
            "Wilson"
    },

    {
        id:
            "candidate_has_model",

        pass:
            typeof candidates[0]
                ?.model ===
            "string" &&
            candidates[0].model
                .includes(
                    "Blade"
                )
    },

    {
        id:
            "special_not_first",

        pass:
            !candidates[0]
                ?.label
                ?.toLowerCase()
                ?.includes(
                    "kith"
                ) &&
            !candidates[0]
                ?.label
                ?.toLowerCase()
                ?.includes(
                    "us open"
                )
    },

    {
        id:
            "answer_preserved",

        pass:
            blade
                ?.body
                ?.answer ===
            clarification
                ?.answer
    },

    {
        id:
            "pending_context_preserved",

        pass:
            blade
                ?.body
                ?.conversation_state
                ?.pending_comparison_context
                ?.active ===
            true
    }
];


console.log(
    "========================================"
);

console.log(
    "COMPARISON CLARIFICATION STRUCTURED CONTRACT V1"
);

console.log(
    "========================================"
);


console.table(
    tests
);


console.log("");

console.log(
    "FIRST CANDIDATES:"
);

console.table(
    candidates.slice(
        0,
        5
    )
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


if (
    failed > 0
) {

    console.log(
        "\nRESULT: FAIL"
    );

    process.exit(1);
}


console.log(
    "\nRESULT: PASS"
);
