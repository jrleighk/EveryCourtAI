/**
 * ============================================================
 * EveryCourtAI
 * Comparison Multi-Turn Worker Regression V1
 * ============================================================
 *
 * Contract:
 *
 * Turn 1:
 * Ambiguous comparison target must create a pending
 * comparison context.
 *
 * Turn 2:
 * A short clarification message may have primary intent
 * "unknown", but must resolve against the pending comparison
 * context and complete the original comparison.
 *
 * Safety:
 *
 * - recommendation engine must not run
 * - follow-up engine must not run
 * - pending comparison context must be cleared after success
 *
 * ============================================================
 */

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


    const json =
        await response.json();


    return {
        http:
            response.status,

        body:
            json
    };
}


/**
 * ============================================================
 * Turn 1
 * ============================================================
 */

const turn1 =
    await send({
        message:
            "Pure Drive 和 Wilson RF 01 Pro Classic 哪个更适合我？",

        language:
            "zh"
    });


/**
 * ============================================================
 * Turn 2
 * ============================================================
 */

const turn2 =
    await send({
        message:
            "Spectra Edition 2026",

        language:
            "zh",

        conversation_state:
            turn1
                ?.body
                ?.conversation_state
    });


/**
 * ============================================================
 * Assertions
 * ============================================================
 */

const tests = [

    {
        id:
            "turn1_http_200",

        pass:
            turn1.http ===
            200
    },

    {
        id:
            "turn1_compare_intent",

        pass:
            turn1
                ?.body
                ?.question_intent
                ?.primary_intent ===
            "compare_products"
    },

    {
        id:
            "turn1_clarification_required",

        pass:
            turn1
                ?.body
                ?.status ===
            "comparison_clarification_required"
    },

    {
        id:
            "turn1_pending_active",

        pass:
            turn1
                ?.body
                ?.conversation_state
                ?.pending_comparison_context
                ?.active ===
            true
    },

    {
        id:
            "turn1_resolved_rf01_preserved",

        pass:
            turn1
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
            "turn1_unresolved_pure_drive_preserved",

        pass:
            turn1
                ?.body
                ?.conversation_state
                ?.pending_comparison_context
                ?.unresolved_targets
                ?.some(
                    item =>
                        item?.raw_text ===
                        "Pure Drive"
                ) ===
            true
    },

    {
        id:
            "turn2_http_200",

        pass:
            turn2.http ===
            200
    },

    {
        id:
            "turn2_short_message_intent_unknown",

        pass:
            turn2
                ?.body
                ?.question_intent
                ?.primary_intent ===
            "unknown"
    },

    {
        id:
            "turn2_comparison_ready",

        pass:
            turn2
                ?.body
                ?.status ===
            "comparison_ready"
    },

    {
        id:
            "turn2_clarification_resolved",

        pass:
            turn2
                ?.body
                ?.comparison_clarification
                ?.status ===
            "comparison_clarification_resolved"
    },

    {
        id:
            "turn2_product_a_spectra",

        pass:
            turn2
                ?.body
                ?.comparison
                ?.products
                ?.product_a
                ?.id ===
            "babolat_pure_drive_spectra_edition_2026"
    },

    {
        id:
            "turn2_product_b_rf01",

        pass:
            turn2
                ?.body
                ?.comparison
                ?.products
                ?.product_b
                ?.id ===
            "wilson_rf_01_pro_classic"
    },

    {
        id:
            "turn2_pending_cleared",

        pass:
            turn2
                ?.body
                ?.conversation_state
                ?.pending_comparison_context ===
            null
    },

    {
        id:
            "turn2_recommendation_not_run",

        pass:
            turn2
                ?.body
                ?.recommendation ===
            null
    },

    {
        id:
            "turn2_follow_up_not_run",

        pass:
            turn2
                ?.body
                ?.follow_up ===
            null
    }
];


console.log(
    "========================================"
);

console.log(
    "COMPARISON MULTI-TURN WORKER V1"
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


console.log(
    ""
);

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
    `Total: ${tests.length}`
);

console.log(
    `Passed: ${passed}`
);

console.log(
    `Failed: ${failed}`
);

console.log(
    ""
);

console.log(
    `RESULT: ${failed === 0 ? "PASS" : "FAIL"}`
);


if (
    failed >
    0
) {

    process.exitCode =
        1;
}
