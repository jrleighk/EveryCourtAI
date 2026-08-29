import worker from "../../cloudflare/worker.js";


async function send(
    body
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
                    JSON.stringify(
                        body
                    )
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


/**
 * ============================================================
 * Chinese clarification
 * ============================================================
 */

const zh =
    await send({
        message:
            "比较 Pure Drive 和 RF01 Pro Classic",

        language:
            "zh-CN"
    });


/**
 * ============================================================
 * English clarification
 *
 * Use the same comparison expression so this regression
 * verifies response locale independently from intent parsing.
 * ============================================================
 */

const en =
    await send({
        message:
            "比较 Pure Drive 和 RF01 Pro Classic",

        language:
            "en"
    });


/**
 * ============================================================
 * Tests
 * ============================================================
 */

const tests = [

    {
        id:
            "zh_http_200",

        pass:
            zh.http ===
            200
    },

    {
        id:
            "zh_clarification_required",

        pass:
            zh
                ?.body
                ?.status ===
            "comparison_clarification_required"
    },

    {
        id:
            "zh_language_preserved",

        pass:
            zh
                ?.body
                ?.language ===
            "zh-CN"
    },

    {
        id:
            "zh_mentions_pure_drive",

        pass:
            zh
                ?.body
                ?.answer
                ?.includes(
                    "Pure Drive"
                ) ===
            true
    },

    {
        id:
            "zh_lists_candidates",

        pass:
            zh
                ?.body
                ?.answer
                ?.includes(
                    "Pure Drive 98"
                ) ===
            true &&
            zh
                ?.body
                ?.answer
                ?.includes(
                    "光谱特别版 2026"
                ) ===
            true
    },

    {
        id:
            "zh_pending_active",

        pass:
            zh
                ?.body
                ?.conversation_state
                ?.pending_comparison_context
                ?.active ===
            true
    },

    {
        id:
            "zh_rf01_preserved",

        pass:
            zh
                ?.body
                ?.conversation_state
                ?.pending_comparison_context
                ?.products
                ?.some(
                    item =>
                        item?.id ===
                        "wilson_rf_01_pro_classic"
                ) ===
            true
    },

    {
        id:
            "en_http_200",

        pass:
            en.http ===
            200
    },

    {
        id:
            "en_clarification_required",

        pass:
            en
                ?.body
                ?.status ===
            "comparison_clarification_required"
    },

    {
        id:
            "en_language_preserved",

        pass:
            en
                ?.body
                ?.language ===
            "en"
    },

    {
        id:
            "en_prompt_is_english",

        pass:
            en
                ?.body
                ?.answer
                ?.includes(
                    "Which one do you mean?"
                ) ===
            true
    },

    {
        id:
            "en_lists_spectra",

        pass:
            en
                ?.body
                ?.answer
                ?.includes(
                    "Pure Drive Spectra Edition 2026"
                ) ===
            true
    }
];


console.log(
    "========================================"
);

console.log(
    "COMPARISON CLARIFICATION WORKER CONTRACT V1"
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
