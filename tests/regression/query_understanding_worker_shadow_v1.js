import fs from "node:fs";

import worker from "../../cloudflare/worker.js";


console.log(
    "========================================"
);

console.log(
    "QUERY UNDERSTANDING WORKER SHADOW V1"
);

console.log(
    "========================================"
);


const failures =
    [];


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


    if (
        !pass
    ) {

        failures.push(
            id
        );
    }
}


/**
 * ============================================================
 * 1. Static architecture contract
 * ============================================================
 */

const workerSource =
    fs.readFileSync(
        "cloudflare/worker.js",
        "utf8"
    );


check(
    "imports_query_understanding_v2",
    workerSource.includes(
        'from "../engine/query_understanding_v2.js"'
    )
);


check(
    "calls_understand_tennis_query",
    workerSource.includes(
        "understandTennisQuery("
    )
);


check(
    "shadow_variable_exists",
    workerSource.includes(
        "const queryUnderstandingShadow ="
    )
);


check(
    "uses_conversation_state",
    workerSource.includes(
        "conversationResult\n                                ?.conversation_state"
    ) ||
    workerSource.includes(
        "conversationResult?.conversation_state"
    )
);


check(
    "explicit_shadow_noop",
    workerSource.includes(
        "void queryUnderstandingShadow;"
    )
);


/**
 * Shadow result must not currently become part of the
 * API response contract.
 */

check(
    "not_exposed_as_response_field",
    !workerSource.includes(
        "query_understanding:"
    ) &&
    !workerSource.includes(
        "query_understanding_shadow:"
    )
);


/**
 * Shadow result must not control routing.
 */

check(
    "not_used_in_if_condition",
    !/if\s*\([^)]*queryUnderstandingShadow/s.test(
        workerSource
    )
);


check(
    "not_used_in_switch",
    !/switch\s*\([^)]*queryUnderstandingShadow/s.test(
        workerSource
    )
);


/**
 * ============================================================
 * 2. Runtime production-behavior probes
 * ============================================================
 */

async function send(
    payload
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
                        payload
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
 * ------------------------------------------------------------
 * Case A
 * Existing tension routing must remain unchanged.
 * ------------------------------------------------------------
 */

const tension =
    await send({

        message:
            "我现在用 Wilson RF 01 Pro Classic，HAWK TOUCH 1.25，54磅。我这个配置应该拉多少磅？",

        language:
            "zh",

        player_input: {

            playing_level:
                "intermediate",

            playing_style:
                "all_court",

            primary_goal:
                "more_control"
        }
    });


check(
    "tension_http_200",
    tension.http ===
        200
);


check(
    "tension_recommendation_ready",
    tension
        ?.body
        ?.status ===
        "recommendation_ready"
);


check(
    "tension_intent_unchanged",
    tension
        ?.body
        ?.question_intent
        ?.primary_intent ===
        "adjust_tension"
);


check(
    "tension_response_mode_unchanged",
    tension
        ?.body
        ?.intent_response
        ?.response_mode ===
        "tension_focused"
);


/**
 * ------------------------------------------------------------
 * Case B
 * Genuine comparison must remain unchanged.
 * ------------------------------------------------------------
 */

const comparison =
    await send({

        message:
            "比较 Babolat Pure Drive Spectra Edition 2026 和 Wilson RF 01 Pro Classic",

        language:
            "zh"
    });


check(
    "comparison_http_200",
    comparison.http ===
        200
);


check(
    "comparison_ready",
    comparison
        ?.body
        ?.status ===
        "comparison_ready"
);


check(
    "comparison_intent_unchanged",
    comparison
        ?.body
        ?.question_intent
        ?.primary_intent ===
        "compare_products"
);


check(
    "comparison_view_ready",
    comparison
        ?.body
        ?.comparison_view
        ?.status ===
        "comparison_view_ready"
);


/**
 * ------------------------------------------------------------
 * Case C
 * Ambiguous comparison must preserve clarification contract.
 * ------------------------------------------------------------
 */

const clarification =
    await send({

        message:
            "比较 Pure Drive 和 RF01 Pro Classic",

        language:
            "zh-CN"
    });


check(
    "clarification_http_200",
    clarification.http ===
        200
);


check(
    "clarification_required",
    clarification
        ?.body
        ?.status ===
        "comparison_clarification_required"
);


check(
    "clarification_pending_context_preserved",
    clarification
        ?.body
        ?.conversation_state
        ?.pending_comparison_context
        ?.active ===
        true
);


/**
 * ------------------------------------------------------------
 * Case D
 * False comparison extractor case must NOT change production
 * routing during shadow integration.
 * ------------------------------------------------------------
 */

const minimalChange =
    await send({

        message:
            "我不想换球拍和球线，只想调整磅数。",

        language:
            "zh"
    });


check(
    "minimal_change_http_200",
    minimalChange.http ===
        200
);


check(
    "minimal_change_not_comparison_ready",
    minimalChange
        ?.body
        ?.status !==
        "comparison_ready" &&
    minimalChange
        ?.body
        ?.status !==
        "comparison_clarification_required"
);


check(
    "minimal_change_intent_remains_adjust_tension",
    minimalChange
        ?.body
        ?.question_intent
        ?.primary_intent ===
        "adjust_tension"
);


/**
 * ============================================================
 * Result
 * ============================================================
 */

console.log("");
console.log(
    "========================================"
);

console.log(
    "RESULT"
);

console.log(
    "========================================"
);

console.log(
    `Total: ${22}`
);

console.log(
    `Passed: ${22 - failures.length}`
);

console.log(
    `Failed: ${failures.length}`
);


if (
    failures.length >
    0
) {

    console.log("");
    console.log(
        "FAILURES"
    );

    failures.forEach(
        failure =>
            console.log(
                "-",
                failure
            )
    );

    console.log("");
    console.log(
        "RESULT: FAIL"
    );

    process.exitCode =
        1;

} else {

    console.log(
        "RESULT: PASS"
    );
}
