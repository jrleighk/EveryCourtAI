const PHYSICAL_SEVERITY_SCORE = {
  none: 0,
  mild: 1,
  moderate: 2,
  high: 3,
  severe: 4
};

const PHYSICAL_FIELDS = [
  "shoulder_sensitivity",
  "elbow_sensitivity",
  "wrist_sensitivity",
  "lower_back_sensitivity",
  "hip_sensitivity",
  "knee_sensitivity",
  "ankle_sensitivity",
  "neck_sensitivity"
];

const DEFAULT_PROFILE_VALUES = {
  physicalSeverity: "none",
  fatigueLevel: "none",
  fatigueTiming: "none",
  changeTolerance: "moderate"
};

function normalizeSeverity(value) {
  if (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(
      PHYSICAL_SEVERITY_SCORE,
      value
    )
  ) {
    return value;
  }

  return DEFAULT_PROFILE_VALUES.physicalSeverity;
}

function getPhysicalConstraints(physicalCondition = {}) {
  const constraints = {};

  for (const field of PHYSICAL_FIELDS) {
    const severity = normalizeSeverity(
      physicalCondition[field]
    );

    constraints[field] = {
      severity,
      score: PHYSICAL_SEVERITY_SCORE[severity]
    };
  }

  return constraints;
}

function getHighestPhysicalConstraint(
  physicalCondition = {}
) {
  const constraints =
    getPhysicalConstraints(physicalCondition);

  let highest = {
    field: null,
    body_part: null,
    severity: "none",
    score: 0
  };

  for (const [field, data] of Object.entries(
    constraints
  )) {
    if (data.score > highest.score) {
      highest = {
        field,
        body_part: field.replace(
          "_sensitivity",
          ""
        ),
        severity: data.severity,
        score: data.score
      };
    }
  }

  return highest;
}

function getActivePhysicalConstraints(
  physicalCondition = {}
) {
  const constraints =
    getPhysicalConstraints(physicalCondition);

  return Object.entries(constraints)
    .filter(([, data]) => data.score > 0)
    .map(([field, data]) => ({
      field,
      body_part: field.replace(
        "_sensitivity",
        ""
      ),
      severity: data.severity,
      score: data.score
    }))
    .sort((a, b) => b.score - a.score);
}

function normalizeCurrentSetup(
  currentSetup = {}
) {
  return {
    racquet_id:
      currentSetup.racquet_id ?? null,

    string_id:
      currentSetup.string_id ?? null,

    tension_lbs:
      typeof currentSetup.tension_lbs ===
      "number"
        ? currentSetup.tension_lbs
        : null,

    string_setup_type:
      currentSetup.string_setup_type ??
      null
  };
}

function normalizePlayingLoad(
  playingLoad = {}
) {
  return {
    weekly_frequency:
      typeof playingLoad.weekly_frequency ===
      "number"
        ? playingLoad.weekly_frequency
        : null,

    session_duration_minutes:
      typeof playingLoad
        .session_duration_minutes === "number"
        ? playingLoad
            .session_duration_minutes
        : null,

    fatigue_level:
      playingLoad.fatigue_level ??
      DEFAULT_PROFILE_VALUES.fatigueLevel,

    fatigue_timing:
      playingLoad.fatigue_timing ??
      DEFAULT_PROFILE_VALUES.fatigueTiming
  };
}

function normalizePreferences(
  preferences = {}
) {
  return {
    preferred_racquet_weight:
      preferences.preferred_racquet_weight ??
      null,

    preferred_string_feel:
      Array.isArray(
        preferences.preferred_string_feel
      )
        ? [...preferences.preferred_string_feel]
        : [],

    change_tolerance:
      preferences.change_tolerance ??
      DEFAULT_PROFILE_VALUES.changeTolerance
  };
}

function determinePhysicalPriority(
  highestConstraint
) {
  if (!highestConstraint) {
    return "none";
  }

  if (highestConstraint.score >= 3) {
    return "high";
  }

  if (highestConstraint.score === 2) {
    return "moderate";
  }

  if (highestConstraint.score === 1) {
    return "mild";
  }

  return "none";
}

function determineChangeStrategyHint({
  changeTolerance,
  highestPhysicalConstraint,
  fatigueLevel
}) {
  const physicalScore =
    highestPhysicalConstraint?.score ?? 0;

  if (
    physicalScore >= 3 ||
    fatigueLevel === "high"
  ) {
    return "comfort_and_safety_first";
  }

  if (changeTolerance === "minimal") {
    return "minimal_change";
  }

  if (
    physicalScore === 2 ||
    fatigueLevel === "moderate"
  ) {
    return "conservative_adjustment";
  }

  if (changeTolerance === "open") {
    return "full_setup_optimization";
  }

  return "balanced_adjustment";
}

function validateRequiredProfileFields(
  profile
) {
  if (
    !profile ||
    typeof profile !== "object" ||
    Array.isArray(profile)
  ) {
    throw new TypeError(
      "Player profile must be an object."
    );
  }

  if (profile.profile_version !== "1.0") {
    throw new Error(
      "Unsupported player profile version."
    );
  }

  if (!profile.playing_level) {
    throw new Error(
      "Missing required field: playing_level."
    );
  }

  if (!profile.primary_goal) {
    throw new Error(
      "Missing required field: primary_goal."
    );
  }
}

/**
 * Convert Player Profile V1 into normalized
 * Recommendation Matrix input.
 *
 * This adapter intentionally does not modify
 * recommendation scoring logic.
 */
export function adaptPlayerProfileV1(
  profile
) {
  validateRequiredProfileFields(profile);

  const currentSetup =
    normalizeCurrentSetup(
      profile.current_setup
    );

  const physicalConstraints =
    getPhysicalConstraints(
      profile.physical_condition
    );

  const activePhysicalConstraints =
    getActivePhysicalConstraints(
      profile.physical_condition
    );

  const highestPhysicalConstraint =
    getHighestPhysicalConstraint(
      profile.physical_condition
    );

  const playingLoad =
    normalizePlayingLoad(
      profile.playing_load
    );

  const preferences =
    normalizePreferences(
      profile.preferences
    );

  const physicalPriority =
    determinePhysicalPriority(
      highestPhysicalConstraint
    );

  const changeStrategyHint =
    determineChangeStrategyHint({
      changeTolerance:
        preferences.change_tolerance,

      highestPhysicalConstraint,

      fatigueLevel:
        playingLoad.fatigue_level
    });

  return {
    adapter_version: "1.0",

    source: {
      profile_type: "player_profile",
      profile_version:
        profile.profile_version
    },

    player: {
      playing_level:
        profile.playing_level,

      playing_style:
        Array.isArray(
          profile.playing_style
        )
          ? [...profile.playing_style]
          : []
    },

    goal: {
      primary:
        profile.primary_goal,

      secondary:
        Array.isArray(
          profile.secondary_goals
        )
          ? [...profile.secondary_goals]
          : []
    },

    current_setup: {
      ...currentSetup
    },

    physical: {
      constraints:
        physicalConstraints,

      active_constraints:
        activePhysicalConstraints,

      highest_constraint:
        highestPhysicalConstraint,

      priority:
        physicalPriority
    },

    playing_load: {
      ...playingLoad
    },

    preferences: {
      ...preferences
    },

    recommendation_context: {
      goal:
        profile.primary_goal,

      racquet_id:
        currentSetup.racquet_id,

      string_id:
        currentSetup.string_id,

      tension_lbs:
        currentSetup.tension_lbs,

      physical_constraint:
        highestPhysicalConstraint
          .body_part,

      physical_severity:
        highestPhysicalConstraint
          .severity,

      physical_score:
        highestPhysicalConstraint
          .score,

      fatigue_level:
        playingLoad.fatigue_level,

      fatigue_timing:
        playingLoad.fatigue_timing,

      change_tolerance:
        preferences.change_tolerance,

      change_strategy_hint:
        changeStrategyHint
    }
  };
}

export {
  PHYSICAL_FIELDS,
  PHYSICAL_SEVERITY_SCORE,
  getPhysicalConstraints,
  getActivePhysicalConstraints,
  getHighestPhysicalConstraint,
  normalizeCurrentSetup,
  normalizePlayingLoad,
  normalizePreferences
};

export default adaptPlayerProfileV1;
