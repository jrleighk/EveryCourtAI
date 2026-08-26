import {
  buildPlayerProfile
} from "../../engine/player_engine.js";

import {
  runMatchingEngine
} from "../../engine/matching_engine.js";


const CASES = [
  {
    id: "control_medium_current_hawk",
    title: "More Control / Medium Swing / Current HAWK TOUCH",

    input: {
      current_racquet: {
        id: "wilson_rf_01_pro_classic",
        brand: "Wilson",
        model: "RF 01 Pro Classic"
      },

      current_string: {
        id: "head_hawk_touch",
        brand: "HEAD",
        model: "HAWK TOUCH",
        gauge_mm: 1.25
      },

      current_tension: 54,
      primary_goal: "more_control",
      playing_style: "baseline",
      swing_speed: "medium",
      feel_preference: "connected"
    },

    expectations: {
      top_goal_min: 7,
      current_string_allowed_top10: true,
      expected_keywords: [
        "control",
        "tour",
        "precision",
        "hawk",
        "lynx",
        "4g"
      ]
    }
  },


  {
    id: "comfort_medium_current_hawk",
    title: "More Comfort / Medium Swing / Current HAWK TOUCH",

    input: {
      current_racquet: {
        id: "wilson_rf_01_pro_classic",
        brand: "Wilson",
        model: "RF 01 Pro Classic"
      },

      current_string: {
        id: "head_hawk_touch",
        brand: "HEAD",
        model: "HAWK TOUCH",
        gauge_mm: 1.25
      },

      current_tension: 55,
      primary_goal: "more_comfort",
      playing_style: "all_court",
      swing_speed: "medium",
      feel_preference: "soft"
    },

    expectations: {
      top_goal_min: 7.5,
      expected_keywords: [
        "soft",
        "comfort",
        "gut",
        "rexis",
        "xalt",
        "nxt",
        "rpm_soft"
      ]
    }
  },


  {
    id: "spin_fast_current_hawk",
    title: "More Spin / Fast Swing / Current HAWK TOUCH",

    input: {
      current_racquet: {
        id: "wilson_rf_01_pro_classic",
        brand: "Wilson",
        model: "RF 01 Pro Classic"
      },

      current_string: {
        id: "head_hawk_touch",
        brand: "HEAD",
        model: "HAWK TOUCH",
        gauge_mm: 1.25
      },

      current_tension: 50,
      primary_goal: "more_spin",
      playing_style: "baseline",
      swing_speed: "fast",
      feel_preference: "connected"
    },

    expectations: {
      top_goal_min: 7.5,
      expected_keywords: [
        "spin",
        "revolve",
        "rpm",
        "toro",
        "hex",
        "bite"
      ]
    }
  },


  {
    id: "power_medium_current_hawk",
    title: "More Power / Medium Swing / Current HAWK TOUCH",

    input: {
      current_racquet: {
        id: "wilson_rf_01_pro_classic",
        brand: "Wilson",
        model: "RF 01 Pro Classic"
      },

      current_string: {
        id: "head_hawk_touch",
        brand: "HEAD",
        model: "HAWK TOUCH",
        gauge_mm: 1.25
      },

      current_tension: 55,
      primary_goal: "more_power",
      playing_style: "all_court",
      swing_speed: "medium"
    },

    expectations: {
      top_goal_min: 7,
      expected_keywords: [
        "power",
        "gut",
        "synthetic",
        "fire",
        "eco_power"
      ]
    }
  },


  {
    id: "feel_medium_current_hawk",
    title: "More Feel / Medium Swing / Current HAWK TOUCH",

    input: {
      current_racquet: {
        id: "wilson_rf_01_pro_classic",
        brand: "Wilson",
        model: "RF 01 Pro Classic"
      },

      current_string: {
        id: "head_hawk_touch",
        brand: "HEAD",
        model: "HAWK TOUCH",
        gauge_mm: 1.25
      },

      current_tension: 53,
      primary_goal: "more_feel",
      playing_style: "all_court",
      swing_speed: "medium",
      feel_preference: "connected"
    },

    expectations: {
      top_goal_min: 7.5,
      expected_keywords: [
        "touch",
        "feel",
        "gut",
        "element",
        "alu"
      ]
    }
  },


  {
    id: "comfort_slow_no_current_string",
    title: "More Comfort / Slow Swing / No Current String",

    input: {
      current_racquet: {
        id: "wilson_rf_01_pro_classic",
        brand: "Wilson",
        model: "RF 01 Pro Classic"
      },

      primary_goal: "more_comfort",
      playing_style: "all_court",
      swing_speed: "slow",
      feel_preference: "soft"
    },

    expectations: {
      top_goal_min: 7.5,
      expected_keywords: [
        "gut",
        "soft",
        "comfort",
        "multi",
        "rexis",
        "nxt"
      ]
    }
  },


  {
    id: "power_slow_no_current_string",
    title: "More Power / Slow Swing / No Current String",

    input: {
      current_racquet: {
        id: "wilson_rf_01_pro_classic",
        brand: "Wilson",
        model: "RF 01 Pro Classic"
      },

      primary_goal: "more_power",
      playing_style: "all_court",
      swing_speed: "slow"
    },

    expectations: {
      top_goal_min: 7,
      expected_keywords: [
        "power",
        "gut",
        "synthetic",
        "multi"
      ]
    }
  },


  {
    id: "spin_fast_no_current_string",
    title: "More Spin / Fast Swing / No Current String",

    input: {
      current_racquet: {
        id: "wilson_rf_01_pro_classic",
        brand: "Wilson",
        model: "RF 01 Pro Classic"
      },

      primary_goal: "more_spin",
      playing_style: "baseline",
      swing_speed: "fast"
    },

    expectations: {
      top_goal_min: 8,
      expected_keywords: [
        "spin",
        "rpm",
        "revolve",
        "toro",
        "hex",
        "bite"
      ]
    }
  },


  {
    id: "control_fast_no_current_string",
    title: "More Control / Fast Swing / No Current String",

    input: {
      current_racquet: {
        id: "wilson_rf_01_pro_classic",
        brand: "Wilson",
        model: "RF 01 Pro Classic"
      },

      primary_goal: "more_control",
      playing_style: "baseline",
      swing_speed: "fast",
      feel_preference: "connected"
    },

    expectations: {
      top_goal_min: 7.5,
      expected_keywords: [
        "control",
        "tour",
        "precision",
        "4g",
        "hawk",
        "lynx"
      ]
    }
  },


  {
    id: "comfort_shoulder_moderate",
    title: "More Comfort / Moderate Shoulder Sensitivity",

    input: {
      current_racquet: {
        id: "wilson_rf_01_pro_classic",
        brand: "Wilson",
        model: "RF 01 Pro Classic"
      },

      current_string: {
        id: "head_hawk_touch",
        brand: "HEAD",
        model: "HAWK TOUCH",
        gauge_mm: 1.25
      },

      current_tension: 54,
      primary_goal: "more_comfort",
      playing_style: "all_court",
      swing_speed: "medium",
      feel_preference: "soft",

      physical: {
        shoulder: {
          active: true,
          severity: "moderate"
        }
      }
    },

    expectations: {
      top_goal_min: 7,
      physical_case: true,
      expected_keywords: [
        "gut",
        "soft",
        "comfort",
        "rexis",
        "nxt",
        "xalt"
      ]
    }
  },


  {
    id: "comfort_elbow_moderate",
    title: "More Comfort / Moderate Elbow Sensitivity",

    input: {
      current_racquet: {
        id: "wilson_rf_01_pro_classic",
        brand: "Wilson",
        model: "RF 01 Pro Classic"
      },

      current_string: {
        id: "head_hawk_touch",
        brand: "HEAD",
        model: "HAWK TOUCH",
        gauge_mm: 1.25
      },

      primary_goal: "more_comfort",
      playing_style: "all_court",
      swing_speed: "medium",
      feel_preference: "soft",

      physical: {
        elbow: {
          active: true,
          severity: "moderate"
        }
      }
    },

    expectations: {
      top_goal_min: 7,
      physical_case: true,
      expected_keywords: [
        "gut",
        "soft",
        "comfort",
        "multi",
        "rexis",
        "nxt"
      ]
    }
  },


  {
    id: "spin_fast_soft_feel",
    title: "More Spin / Fast Swing / Soft Feel Preference",

    input: {
      current_racquet: {
        id: "wilson_rf_01_pro_classic",
        brand: "Wilson",
        model: "RF 01 Pro Classic"
      },

      primary_goal: "more_spin",
      playing_style: "baseline",
      swing_speed: "fast",
      feel_preference: "soft"
    },

    expectations: {
      top_goal_min: 7.5,
      expected_keywords: [
        "soft",
        "spin",
        "rpm",
        "toro",
        "hex"
      ]
    }
  }
];


function normalizeText(
  value
) {

  return String(
    value ?? ""
  )
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      "_"
    );
}


function getGoalAdjustment(
  candidate
) {

  return Number(
    candidate
      ?.score_breakdown
      ?.goal ??
    0
  );
}


function topCandidateMatchesKeywords(
  candidate,
  keywords
) {

  const text =
    normalizeText(
      [
        candidate?.id,
        candidate?.brand,
        candidate?.model,
        candidate
          ?.product_data
          ?.description,
        candidate
          ?.product_data
          ?.design_profile
          ?.string_type
      ].join(
        " "
      )
    );


  return keywords.some(
    keyword =>
      text.includes(
        normalizeText(
          keyword
        )
      )
  );
}


async function runCase(
  testCase
) {

  const playerProfile =
    await buildPlayerProfile(
      testCase.input
    );


  const result =
    await runMatchingEngine(
      playerProfile
    );


  const topStrings =
    result.strings
      .slice(
        0,
        10
      );


  const top =
    topStrings[0];


  const topGoal =
    getGoalAdjustment(
      top
    );


  const keywordMatchCount =
    topStrings
      .slice(
        0,
        5
      )
      .filter(
        candidate =>
          topCandidateMatchesKeywords(
            candidate,
            testCase
              .expectations
              .expected_keywords
          )
      )
      .length;


  const failures = [];


  if (
    !top ||
    typeof top.id !== "string"
  ) {
    failures.push(
      "No valid Top-1 string candidate."
    );
  }


  if (
    topGoal <
    testCase
      .expectations
      .top_goal_min
  ) {
    failures.push(
      `Top-1 goal adjustment too low: ${topGoal}`
    );
  }


  if (
    keywordMatchCount < 1
  ) {
    failures.push(
      "No expected goal-oriented candidate found in Top 5."
    );
  }


  if (
    testCase
      .expectations
      .physical_case === true
  ) {

    const riskyTop =
      topStrings
        .slice(
          0,
          5
        )
        .filter(
          candidate =>
            Array.isArray(
              candidate?.risk_flags
            ) &&
            candidate.risk_flags.length > 0
        );


    if (
      riskyTop.length > 2
    ) {
      failures.push(
        `Too many risky candidates in Top 5: ${riskyTop.length}`
      );
    }
  }


  return {
    id:
      testCase.id,

    title:
      testCase.title,

    pass:
      failures.length === 0,

    top_string:
      top?.id ?? null,

    top_score:
      top?.match_score ?? null,

    top_goal:
      Number(
        topGoal.toFixed(
          2
        )
      ),

    top5_keyword_matches:
      keywordMatchCount,

    failures
  };
}


const results = [];


for (
  const testCase
  of CASES
) {

  results.push(
    await runCase(
      testCase
    )
  );
}


console.log(
  "\n========================================"
);

console.log(
  "STRING RANKING QUALITY V1"
);

console.log(
  "========================================"
);


console.table(
  results.map(
    result => ({
      id:
        result.id,

      pass:
        result.pass,

      top_string:
        result.top_string,

      score:
        result.top_score,

      goal:
        result.top_goal,

      keyword_hits:
        result.top5_keyword_matches
    })
  )
);


for (
  const result
  of results
) {

  if (
    result.pass
  ) {
    continue;
  }


  console.log(
    "\nFAILED:",
    result.id
  );


  for (
    const failure
    of result.failures
  ) {
    console.log(
      "-",
      failure
    );
  }
}


const passed =
  results.filter(
    result =>
      result.pass
  ).length;


const failed =
  results.length -
  passed;


console.log(
  "\n========================================"
);

console.log(
  "REGRESSION SUMMARY"
);

console.log(
  "========================================"
);

console.log(
  "Total:",
  results.length
);

console.log(
  "Passed:",
  passed
);

console.log(
  "Failed:",
  failed
);

console.log(
  "========================================"
);


if (
  failed > 0
) {
  process.exitCode = 1;
}
