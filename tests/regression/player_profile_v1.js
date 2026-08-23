import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Ajv2020 from "ajv/dist/2020.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaPath = path.resolve(
  __dirname,
  "../../knowledge/schemas/player_profile_schema_v1.json"
);

const schema = JSON.parse(
  fs.readFileSync(schemaPath, "utf8")
);

const ajv = new Ajv2020({
  allErrors: true,
  strict: false
});

const validate = ajv.compile(schema);

const cases = [
  {
    id: "valid_full_profile",
    description: "Valid complete player profile",
    shouldPass: true,
    data: {
      profile_version: "1.0",
      playing_level: "intermediate",
      playing_style: ["all_court"],
      primary_goal: "comfort",
      secondary_goals: ["feel"],
      current_setup: {
        racquet_id: "wilson_rf_01_pro_classic",
        string_id: "head_hawk_touch",
        tension_lbs: 52,
        string_setup_type: "full_bed"
      },
      physical_condition: {
        shoulder_sensitivity: "moderate",
        elbow_sensitivity: "none",
        wrist_sensitivity: "none",
        lower_back_sensitivity: "none",
        hip_sensitivity: "none",
        knee_sensitivity: "none",
        ankle_sensitivity: "none",
        neck_sensitivity: "none"
      },
      playing_load: {
        weekly_frequency: 3,
        session_duration_minutes: 120,
        fatigue_level: "moderate",
        fatigue_timing: "late"
      },
      preferences: {
        preferred_racquet_weight: "medium",
        preferred_string_feel: ["soft", "connected"],
        change_tolerance: "minimal"
      }
    }
  },
  {
    id: "valid_minimal_profile",
    description: "Valid minimal required profile",
    shouldPass: true,
    data: {
      profile_version: "1.0",
      playing_level: "beginner",
      primary_goal: "comfort"
    }
  },
  {
    id: "invalid_playing_level",
    description: "Reject unsupported playing level",
    shouldPass: false,
    data: {
      profile_version: "1.0",
      playing_level: "professional_superstar",
      primary_goal: "control"
    }
  },
  {
    id: "invalid_primary_goal",
    description: "Reject unsupported primary goal",
    shouldPass: false,
    data: {
      profile_version: "1.0",
      playing_level: "intermediate",
      primary_goal: "accuracy"
    }
  },
  {
    id: "invalid_tension_too_low",
    description: "Reject tension below minimum",
    shouldPass: false,
    data: {
      profile_version: "1.0",
      playing_level: "intermediate",
      primary_goal: "comfort",
      current_setup: {
        racquet_id: "wilson_rf_01_pro_classic",
        string_id: "head_hawk_touch",
        tension_lbs: 20,
        string_setup_type: "full_bed"
      }
    }
  },
  {
    id: "invalid_tension_too_high",
    description: "Reject tension above maximum",
    shouldPass: false,
    data: {
      profile_version: "1.0",
      playing_level: "intermediate",
      primary_goal: "control",
      current_setup: {
        racquet_id: "wilson_rf_01_pro_classic",
        string_id: "head_hawk_touch",
        tension_lbs: 75,
        string_setup_type: "full_bed"
      }
    }
  },
  {
    id: "invalid_physical_severity",
    description: "Reject unsupported physical severity",
    shouldPass: false,
    data: {
      profile_version: "1.0",
      playing_level: "advanced",
      primary_goal: "comfort",
      physical_condition: {
        shoulder_sensitivity: "extreme"
      }
    }
  },
  {
    id: "invalid_unknown_top_level_field",
    description: "Reject unknown top-level field",
    shouldPass: false,
    data: {
      profile_version: "1.0",
      playing_level: "intermediate",
      primary_goal: "spin",
      unknown_field: true
    }
  },
  {
    id: "invalid_unknown_nested_field",
    description: "Reject unknown nested field",
    shouldPass: false,
    data: {
      profile_version: "1.0",
      playing_level: "intermediate",
      primary_goal: "power",
      preferences: {
        change_tolerance: "moderate",
        secret_preference: "magic"
      }
    }
  },
  {
    id: "invalid_duplicate_playing_style",
    description: "Reject duplicate playing styles",
    shouldPass: false,
    data: {
      profile_version: "1.0",
      playing_level: "intermediate",
      playing_style: ["baseline", "baseline"],
      primary_goal: "spin"
    }
  },
  {
    id: "invalid_profile_version",
    description: "Reject unsupported profile version",
    shouldPass: false,
    data: {
      profile_version: "2.0",
      playing_level: "intermediate",
      primary_goal: "feel"
    }
  }
];

let passed = 0;
let failed = 0;

console.log("");
console.log("============================================================");
console.log("EveryCourtAI Player Profile Regression V1");
console.log("============================================================");

for (const testCase of cases) {
  const valid = validate(testCase.data);
  const result = testCase.shouldPass === valid ? "PASS" : "FAIL";

  console.log("");
  console.log(`CASE: ${testCase.id}`);
  console.log(testCase.description);
  console.log(`Expected: ${testCase.shouldPass ? "VALID" : "INVALID"}`);
  console.log(`Actual:   ${valid ? "VALID" : "INVALID"}`);
  console.log(`RESULT: ${result}`);

  if (!valid && validate.errors) {
    console.log("Validation Errors:");

    for (const error of validate.errors) {
      console.log(`- ${error.instancePath || "/"} ${error.message}`);
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
