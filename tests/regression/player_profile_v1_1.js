import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Ajv2020 from "ajv/dist/2020.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaPath = path.resolve(
  __dirname,
  "../../knowledge/schemas/player_profile_schema_v1_1.json"
);

const schema = JSON.parse(
  fs.readFileSync(schemaPath, "utf8")
);

const ajv = new Ajv2020({
  allErrors: true,
  strict: false
});

const validate = ajv.compile(schema);

const baseProfile = {
  profile_version: "1.1",
  playing_level: "intermediate",
  primary_goal: "comfort"
};

const cases = [
  {
    id: "valid_swing_speed_slow",
    shouldPass: true,
    data: {
      ...baseProfile,
      swing_speed: "slow"
    }
  },
  {
    id: "valid_swing_speed_medium",
    shouldPass: true,
    data: {
      ...baseProfile,
      swing_speed: "medium"
    }
  },
  {
    id: "valid_swing_speed_fast",
    shouldPass: true,
    data: {
      ...baseProfile,
      swing_speed: "fast"
    }
  },
  {
    id: "valid_without_swing_speed",
    shouldPass: true,
    data: {
      ...baseProfile
    }
  },
  {
    id: "invalid_swing_speed",
    shouldPass: false,
    data: {
      ...baseProfile,
      swing_speed: "very_fast"
    }
  },
  {
    id: "invalid_old_profile_version",
    shouldPass: false,
    data: {
      profile_version: "1.0",
      playing_level: "intermediate",
      primary_goal: "comfort",
      swing_speed: "medium"
    }
  }
];

let passed = 0;
let failed = 0;

console.log("");
console.log("============================================================");
console.log("EveryCourtAI Player Profile Regression V1.1");
console.log("============================================================");

for (const testCase of cases) {
  const valid = validate(testCase.data);

  const result =
    valid === testCase.shouldPass
      ? "PASS"
      : "FAIL";

  console.log("");
  console.log(`CASE: ${testCase.id}`);
  console.log(`Expected: ${testCase.shouldPass ? "VALID" : "INVALID"}`);
  console.log(`Actual:   ${valid ? "VALID" : "INVALID"}`);
  console.log(`RESULT: ${result}`);

  if (!valid && validate.errors) {
    console.log("Validation Errors:");

    for (const error of validate.errors) {
      console.log(
        `- ${error.instancePath || "/"} ${error.message}`
      );
    }
  }

  if (result === "PASS") {
    passed += 1;
  } else {
    failed += 1;
  }

  console.log("------------------------------------------------------------");
}

console.log("");
console.log("============================================================");
console.log("REGRESSION SUMMARY");
console.log("============================================================");
console.log(`Total:  ${cases.length}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log("============================================================");

if (failed > 0) {
  process.exitCode = 1;
}
