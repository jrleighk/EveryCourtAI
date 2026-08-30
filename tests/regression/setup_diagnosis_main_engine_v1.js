import {
  runEveryCourtAI,
  runQuickRecommendation
} from "../../engine/main_engine.js";

let passed = 0;
let failed = 0;

async function check(id, fn) {
  try {
    const r = await fn();

    if (
      !r.success ||
      !r.setup_diagnosis ||
      r.setup_diagnosis.engine !== "Setup Diagnosis V1"
    ) {
      throw new Error("Missing setup diagnosis");
    }

    console.log("PASS", id);
    passed++;
  } catch (error) {
    console.log("FAIL", id, error.message);
    failed++;
  }
}

const input = {
  level: "intermediate",
  primary_goal: "more_comfort"
};

await check(
  "main_engine_setup_diagnosis",
  async () => {
    const r = await runEveryCourtAI(input);

    if (
      r.pipeline?.setup_diagnosis_v1?.status !==
      "completed"
    ) {
      throw new Error("Diagnosis pipeline not completed");
    }

    return r;
  }
);

await check(
  "quick_recommendation_setup_diagnosis",
  () => runQuickRecommendation(input)
);

console.log("Total:", passed + failed);
console.log("Passed:", passed);
console.log("Failed:", failed);

if (failed) process.exit(1);

console.log("RESULT: PASS");
