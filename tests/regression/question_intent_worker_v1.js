import worker from "../../cloudflare/worker.js";


console.log(
  "========================================"
);

console.log(
  "QUESTION INTENT WORKER V1"
);

console.log(
  "========================================"
);


const cases = [

  {
    id:
      "physical_recommend_cn",

    message:
      "肩膀不舒服，我应该换什么线？",

    expected_intent:
      "recommend_setup",

    expected_context: {
      physical:
        true
    }
  },

  {
    id:
      "explain_recommendation_cn",

    message:
      "为什么你推荐我换成天然肠线？",

    expected_intent:
      "explain_current_setup",

    expected_context: {
      explanation_requested:
        true
    }
  },

  {
    id:
      "compare_products_cn",

    message:
      "Pure Drive 和 RF01 哪个更适合我？",

    expected_intent:
      "compare_products",

    expected_context: {
      comparison:
        true
    }
  }

];


let passed =
  0;

let failed =
  0;

const rows =
  [];


for (const test of cases) {

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
            message:
              test.message,

            language:
              "zh"
          })
      }
    );


  let response;
  let body;


  try {

    response =
      await worker.fetch(
        request,
        {},
        {}
      );


    body =
      await response.json();

  } catch (error) {

    failed++;


    rows.push({

      id:
        test.id,

      http:
        "CRASH",

      success:
        false,

      status:
        null,

      expected:
        test.expected_intent,

      actual:
        null,

      context_ok:
        false,

      pass:
        false,

      error:
        error?.message ??
        String(error)

    });


    continue;
  }


  const actualIntent =
    body
      ?.question_intent
      ?.primary_intent ??
    body
      ?.question_intent
      ?.intent ??
    null;


  const actualContext =
    body
      ?.question_intent
      ?.context ??
    {};


  const contextOk =
    Object.entries(
      test.expected_context ??
      {}
    )
      .every(
        ([key, expectedValue]) =>
          actualContext?.[key] ===
          expectedValue
      );


  const validStatus =
    body?.status ===
      "follow_up_required" ||
    body?.status ===
      "recommendation_ready";


  const pass =
    response.status ===
      200 &&
    body?.success ===
      true &&
    actualIntent ===
      test.expected_intent &&
    contextOk &&
    validStatus;


  if (pass) {

    passed++;

  } else {

    failed++;
  }


  rows.push({

    id:
      test.id,

    http:
      response.status,

    success:
      body?.success,

    status:
      body?.status ??
      null,

    expected:
      test.expected_intent,

    actual:
      actualIntent,

    context_ok:
      contextOk,

    pass

  });


  if (!pass) {

    console.log("");
    console.log(
      `FAIL DETAIL: ${test.id}`
    );

    console.dir(
      body,
      {
        depth:
          6
      }
    );
  }
}


console.table(
  rows
);


console.log("");
console.log(
  "========================================"
);

console.log(
  "WORKER REGRESSION SUMMARY"
);

console.log(
  "========================================"
);

console.log(
  `Total: ${cases.length}`
);

console.log(
  `Passed: ${passed}`
);

console.log(
  `Failed: ${failed}`
);


if (failed > 0) {

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
