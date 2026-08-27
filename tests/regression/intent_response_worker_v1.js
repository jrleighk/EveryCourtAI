import worker from "../../cloudflare/worker.js";


console.log(
  "========================================"
);
console.log(
  "INTENT RESPONSE WORKER V1"
);
console.log(
  "========================================"
);


async function postAI(
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


  const body =
    await response.json();


  return {
    response,
    body
  };
}


const failures = [];


/**
 * ============================================================
 * CASE 1
 * Tension-focused request
 * ============================================================
 */

const tensionCase =
  await postAI({

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


const tensionBody =
  tensionCase.body;


const tensionReady =
  tensionBody?.status ===
    "recommendation_ready";


const tensionIntentPass =
  tensionBody
    ?.question_intent
    ?.primary_intent ===
    "adjust_tension";


const tensionModePass =
  tensionBody
    ?.intent_response
    ?.response_mode ===
    "tension_focused";


const tensionHandledPass =
  tensionBody
    ?.intent_response
    ?.handled ===
    true;


const tensionAnswerPass =
  typeof tensionBody?.answer ===
    "string" &&
  tensionBody.answer.includes(
    "建议磅数"
  );


const tensionDataPass =
  tensionBody
    ?.intent_response
    ?.data
    ?.recommended_tension_lbs !==
    null &&
  tensionBody
    ?.intent_response
    ?.data
    ?.recommended_tension_lbs !==
    undefined;


if (
  !tensionReady
) {
  failures.push(
    "Tension case did not reach recommendation_ready"
  );
}


if (
  !tensionIntentPass
) {
  failures.push(
    "Tension question intent incorrect"
  );
}


if (
  !tensionModePass
) {
  failures.push(
    "Tension response mode incorrect"
  );
}


if (
  !tensionHandledPass
) {
  failures.push(
    "Tension intent was not handled"
  );
}


if (
  !tensionAnswerPass
) {
  failures.push(
    "Tension-focused answer not used"
  );
}


if (
  !tensionDataPass
) {
  failures.push(
    "Recommended tension missing"
  );
}


/**
 * ============================================================
 * CASE 2
 * Normal recommendation must preserve old answer flow
 * ============================================================
 */

const recommendationCase =
  await postAI({

    message:
      "帮我推荐一个更适合控制的球拍和球线配置。",

    language:
      "zh",

    player_input: {
      playing_level:
        "intermediate",

      playing_style:
        "all_court",

      primary_goal:
        "more_control",

      current_racquet: {
        id:
          "wilson_rf_01_pro_classic"
      },

      current_string: {
        id:
          "head_hawk_touch",

        gauge_mm:
          1.25
      },

      current_tension:
        54
    }
  });


const recommendationBody =
  recommendationCase.body;


const recommendationStatusPass =
  recommendationBody?.status ===
    "follow_up_required" ||
  recommendationBody?.status ===
    "recommendation_ready";


const recommendationIntentPass =
  recommendationBody
    ?.question_intent
    ?.primary_intent ===
    "recommend_setup";


const recommendationNotTensionFocused =
  recommendationBody
    ?.intent_response
    ?.response_mode !==
    "tension_focused";


const recommendationNotHandledAsTension =
  recommendationBody
    ?.intent_response
    ?.handled !==
    true;


const recommendationAnswerPass =
  typeof recommendationBody?.answer ===
    "string" &&
  recommendationBody.answer.length >
    0;


if (
  !recommendationStatusPass
) {
  failures.push(
    "Recommendation case returned invalid status"
  );
}


if (
  !recommendationIntentPass
) {
  failures.push(
    "Recommendation question intent incorrect"
  );
}


if (
  !recommendationNotTensionFocused
) {
  failures.push(
    "Recommendation incorrectly routed to tension_focused"
  );
}


if (
  !recommendationNotHandledAsTension
) {
  failures.push(
    "Recommendation incorrectly handled as tension response"
  );
}


if (
  !recommendationAnswerPass
) {
  failures.push(
    "Normal recommendation or follow-up answer missing"
  );
}


/**
 * ============================================================
 * Summary
 * ============================================================
 */

console.table([
  {
    id:
      "tension_focused",

    http:
      tensionCase.response.status,

    status:
      tensionBody?.status,

    intent:
      tensionBody
        ?.question_intent
        ?.primary_intent,

    mode:
      tensionBody
        ?.intent_response
        ?.response_mode,

    handled:
      tensionBody
        ?.intent_response
        ?.handled,

    answer_preview:
      tensionBody
        ?.answer
        ?.slice(
          0,
          60
        )
  },

  {
    id:
      "recommend_passthrough",

    http:
      recommendationCase
        .response
        .status,

    status:
      recommendationBody?.status,

    intent:
      recommendationBody
        ?.question_intent
        ?.primary_intent,

    mode:
      recommendationBody
        ?.intent_response
        ?.response_mode,

    handled:
      recommendationBody
        ?.intent_response
        ?.handled,

    answer_preview:
      recommendationBody
        ?.answer
        ?.slice(
          0,
          60
        )
  }
]);


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


if (
  failures.length ===
  0
) {

  console.log(
    "Total: 2"
  );

  console.log(
    "Passed: 2"
  );

  console.log(
    "Failed: 0"
  );

  console.log("");
  console.log(
    "RESULT: PASS"
  );

} else {

  console.log(
    "Total: 2"
  );

  console.log(
    `Failed checks: ${failures.length}`
  );

  console.log("");

  for (
    const failure
    of failures
  ) {

    console.log(
      `- ${failure}`
    );
  }

  console.log("");
  console.log(
    "RESULT: FAIL"
  );

  process.exit(1);
}
