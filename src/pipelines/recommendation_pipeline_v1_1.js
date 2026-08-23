import adaptPlayerProfileV1_1 from "../adapters/player_profile_adapter_v1_1.js";
import { runDeepAnalysis } from "../../engine/main_engine.js";

const GOAL_MAP = {
  comfort: "more_comfort",
  control: "more_control",
  spin: "more_spin",
  power: "more_power",
  feel: "more_feel",
  stability: "more_stability",
  maneuverability: "more_maneuverability"
};

const DEFAULT_ENGINE_VALUES = {
  playing_style: "all_court",
  swing_speed: "medium",
  feel_preference: "connected"
};

function mapGoalToEngineGoal(goal) {
  return GOAL_MAP[goal] ?? goal ?? null;
}

function getPrimaryPlayingStyle(player = {}) {
  const styles = player.playing_style;

  if (
    Array.isArray(styles) &&
    styles.length > 0
  ) {
    return styles[0];
  }

  return DEFAULT_ENGINE_VALUES.playing_style;
}

function getPrimaryFeelPreference(
  preferences = {}
) {
  const feels =
    preferences.preferred_string_feel;

  if (
    Array.isArray(feels) &&
    feels.length > 0
  ) {
    return feels[0];
  }

  return DEFAULT_ENGINE_VALUES.feel_preference;
}

function buildEnginePhysicalInput(
  activeConstraints = []
) {
  const physical = {};

  for (const item of activeConstraints) {
    if (
      !item?.body_part ||
      item?.severity === "none"
    ) {
      continue;
    }

    physical[item.body_part] = {
      active: true,
      severity: item.severity
    };
  }

  return physical;
}

export function buildEngineInputV1_1(
  adaptedProfile,
  overrides = {}
) {
  const context =
    adaptedProfile?.recommendation_context ?? {};

  const player =
    adaptedProfile?.player ?? {};

  const goal =
    adaptedProfile?.goal ?? {};

  const physical =
    adaptedProfile?.physical ?? {};

  const preferences =
    adaptedProfile?.preferences ?? {};

  const input = {
    current_racquet:
      context.racquet_id
        ? { id: context.racquet_id }
        : null,

    current_string:
      context.string_id
        ? { id: context.string_id }
        : null,

    current_tension:
      context.tension_lbs ?? null,

    primary_goal:
      mapGoalToEngineGoal(
        goal.primary
      ),

    playing_style:
      getPrimaryPlayingStyle(
        player
      ),

    swing_speed:
      context.swing_speed ??
      player.swing_speed ??
      DEFAULT_ENGINE_VALUES.swing_speed,

    feel_preference:
      getPrimaryFeelPreference(
        preferences
      ),

    physical:
      buildEnginePhysicalInput(
        physical.active_constraints ?? []
      )
  };

  return {
    ...input,
    ...overrides
  };
}

export function extractPipelineSummaryV1_1(
  result
) {
  const recommendation =
    result?.recommendation ?? {};

  return {
    racquet:
      recommendation
        ?.racquet_decision
        ?.recommended
        ?.id ?? null,

    racquet_action:
      recommendation
        ?.racquet_decision
        ?.action ?? null,

    string:
      recommendation
        ?.string_setup
        ?.main
        ?.id ?? null,

    string_action:
      recommendation
        ?.string_decision
        ?.action ?? null,

    tension:
      recommendation
        ?.tension
        ?.main_lbs ?? null,

    tension_action:
      recommendation
        ?.tension_decision
        ?.action ?? null,

    strategy:
      recommendation
        ?.change_strategy
        ?.strategy ?? null,

    change_count:
      recommendation
        ?.change_strategy
        ?.recommended_change_count ?? null
  };
}

export async function runRecommendationPipelineV1_1(
  profile,
  options = {}
) {
  const adaptedProfile =
    adaptPlayerProfileV1_1(
      profile
    );

  const engineInput =
    buildEngineInputV1_1(
      adaptedProfile,
      options.engine_overrides ?? {}
    );

  const engineResult =
    await runDeepAnalysis(
      engineInput
    );

  return {
    pipeline_version: "1.1",

    source: {
      profile_version:
        profile?.profile_version ?? null,

      adapter_version:
        adaptedProfile?.adapter_version ?? null
    },

    adapted_profile:
      adaptedProfile,

    engine_input:
      engineInput,

    engine_result:
      engineResult,

    summary:
      extractPipelineSummaryV1_1(
        engineResult
      )
  };
}

export {
  GOAL_MAP,
  DEFAULT_ENGINE_VALUES,
  mapGoalToEngineGoal,
  getPrimaryPlayingStyle,
  getPrimaryFeelPreference,
  buildEnginePhysicalInput
};

export default runRecommendationPipelineV1_1;
