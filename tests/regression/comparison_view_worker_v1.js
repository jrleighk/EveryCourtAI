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
 * CASE 1
 * Single-turn comparison
 * ============================================================
 */

const single =
    await send({
        message:
            "比较 Babolat Pure Drive Spectra Edition 2026 和 Wilson RF 01 Pro Classic",

        language:
            "zh"
    });


/**
 * ============================================================
 * CASE 2
 * Multi-turn clarification
 * ============================================================
 */

const turn1 =
    await send({
        message:
            "Pure Drive 和 Wilson RF 01 Pro Classic 哪个更适合我？",

        language:
            "zh"
    });


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


const assertions = [

    {
        id:
            "single_http_200",

        pass:
            single.http === 200
    },

    {
        id:
            "single_comparison_ready",

        pass:
            single
                ?.body
                ?.status ===
            "comparison_ready"
    },

    {
        id:
            "single_view_ready",

        pass:
            single
                ?.body
                ?.comparison_view
                ?.status ===
            "comparison_view_ready"
    },

    {
        id:
            "single_view_success",

        pass:
            single
                ?.body
                ?.comparison_view
                ?.success ===
            true
    },

    {
        id:
            "single_products_preserved",

        pass:
            single
                ?.body
                ?.comparison_view
                ?.products
                ?.product_a
                ?.id ===
                "babolat_pure_drive_spectra_edition_2026" &&
            single
                ?.body
                ?.comparison_view
                ?.products
                ?.product_b
                ?.id ===
                "wilson_rf_01_pro_classic"
    },

    {
        id:
            "single_dimensions_available",

        pass:
            Array.isArray(
                single
                    ?.body
                    ?.comparison_view
                    ?.dimensions
            ) &&
            single
                .body
                .comparison_view
                .dimensions
                .length >
            0
    },

    {
        id:
            "single_internal_comparison_preserved",

        pass:
            single
                ?.body
                ?.comparison
                ?.status ===
            "comparison_orchestrator_ready"
    },

    {
        id:
            "single_recommendation_not_run",

        pass:
            single
                ?.body
                ?.recommendation ===
            null
    },

    {
        id:
            "single_follow_up_not_run",

        pass:
            single
                ?.body
                ?.follow_up ===
            null
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
            "turn2_comparison_ready",

        pass:
            turn2
                ?.body
                ?.status ===
            "comparison_ready"
    },

    {
        id:
            "turn2_view_ready",

        pass:
            turn2
                ?.body
                ?.comparison_view
                ?.status ===
            "comparison_view_ready"
    },

    {
        id:
            "turn2_products_preserved",

        pass:
            turn2
                ?.body
                ?.comparison_view
                ?.products
                ?.product_a
                ?.id ===
                "babolat_pure_drive_spectra_edition_2026" &&
            turn2
                ?.body
                ?.comparison_view
                ?.products
                ?.product_b
                ?.id ===
                "wilson_rf_01_pro_classic"
    },

    {
        id:
            "turn2_clarification_preserved",

        pass:
            turn2
                ?.body
                ?.comparison_clarification
                ?.status ===
            "comparison_clarification_resolved"
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
    "COMPARISON VIEW WORKER V1"
);

console.log(
    "========================================"
);


console.table(
    assertions
);


const passed =
    assertions.filter(
        item =>
            item.pass
    ).length;


const failed =
    assertions.length -
    passed;


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
    `Total: ${assertions.length}`
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
