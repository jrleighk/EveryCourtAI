import worker from "../../cloudflare/worker.js";


console.log(
  "========================================"
);
console.log(
  "PREVIOUS RECOMMENDATION RECALL V1"
);
console.log(
  "========================================"
);


async function postAI(
  payload
) {

  const response =
    await worker.fetch(
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
      ),
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


const turn1 =
  await postAI({

    language:
      "zh",

    message:
      "我现在使用 Wilson RF 01 Pro Classic，HEAD HAWK TOUCH 1.25，54磅。中级，全场型打法，挥拍速度中等，想要更多控制，同时保持比较直接的击球手感。请帮我推荐配置。"
  });


const turn1Context =
  turn1.body
    ?.conversation_state
    ?.last_recommendation_context;


const turn2 =
  await postAI({

    language:
      "zh",

    message:
      "为什么推荐这条球线？",

    conversation_state:
      turn1.body
        ?.conversation_state
  });


const turn2Context =
  turn2.body
    ?.conversation_state
    ?.last_recommendation_context;


const checks = {

  turn1_ready:
    turn1.body
      ?.status ===
      "recommendation_ready",

  turn1_intent:
    turn1.body
      ?.question_intent
      ?.primary_intent ===
      "recommend_setup",

  turn1_source:
    turn1Context
      ?.source_turn ===
      1,

  turn2_turn:
    turn2.body
      ?.turn ===
      2,

  turn2_intent:
    turn2.body
      ?.question_intent
      ?.primary_intent ===
      "explain_current_setup",

  turn2_target:
    turn2.body
      ?.question_intent
      ?.context
      ?.explanation_target ===
      "string",

  explanation_mode:
    turn2.body
      ?.intent_response
      ?.response_mode ===
      "explanation_focused",

  handled:
    turn2.body
      ?.intent_response
      ?.handled ===
      true,

  recall_used:
    turn2.body
      ?.recall
      ?.used ===
      true,

  recall_source:
    turn2.body
      ?.recall
      ?.source_turn ===
      1,

  context_source_preserved:
    turn2Context
      ?.source_turn ===
      1,

  recommendation_timestamp_preserved:
    Boolean(
      turn1Context
        ?.recommendation
        ?.generated_at
    ) &&
    turn2Context
      ?.recommendation
      ?.generated_at ===
    turn1Context
      ?.recommendation
      ?.generated_at,

  explanation_timestamp_preserved:
    Boolean(
      turn1Context
        ?.explanation
        ?.generated_at
    ) &&
    turn2Context
      ?.explanation
      ?.generated_at ===
    turn1Context
      ?.explanation
      ?.generated_at,

  no_player_update_on_explanation:
    Array.isArray(
      turn2.body
        ?.updated_fields
    ) &&
    turn2.body
      .updated_fields
      .length ===
      0
};


const rows =
  Object.entries(
    checks
  ).map(
    ([check, pass]) => ({
      check,
      pass
    })
  );


console.table(
  rows
);


const passed =
  rows
    .filter(
      row =>
        row.pass === true
    )
    .length;


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
  `Total: ${rows.length}`
);

console.log(
  `Passed: ${passed}`
);

console.log(
  `Failed: ${rows.length - passed}`
);


if (
  passed !==
  rows.length
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
