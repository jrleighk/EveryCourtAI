import adaptPlayerProfileV1 from "../adapters/player_profile_adapter_v1.js";
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

export function mapGoalToEngineGoal(goal) {
  return GOAL_MAP[goal] ?? goal ?? null;
}

export function buildEnginePhysicalInput(activeConstraints = []) {
  const physical = {};

  for (const item of activeConstraints) {
    if (!item?.body_part || item?.severity === "none") {
      continue;
    }

    physical[item.body_part] = {
      active: true,
      severity: item.severity
    };
  }

  return physical;
}

export function buildEngineInputFromProfileContext(
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

  const playingStyle =
    Array.isArray(player.playing_style) &&
    player.playing_style.length > 0
      ? player.playing_style[0]
      : DEFAULT_ENGINE_VALUES.playing_style;

  const feelPreference =
    Array.isArray(preferences.preferred_string_feel) &&
    preferences.preferred_string_feel.length > 0
      ? preferences.preferred_string_feel[0]
      : DEFAULT_ENGINE_VALUES.feel_preference;

  const input = {
    current_racquet: context.racquet_id
      ? { id: context.racquet_id }
      : null,

    current_string: context.string_id
      ? { id: context.string_id }
      : null,

    current_tension:
      context.tension_lbs ?? null,

    primary_goal:
      mapGoalToEngineGoal(goal.primary),

    playing_style:
      playingStyle,

    swing_speed:
      DEFAULT_ENGINE_VALUES.swing_speed,

    feel_preference:
      feelPreference,

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

export function extractPipelineSummary(result) {
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

export async function runRecommendationPipelineV1(
  profile,
  options = {}
) {
  const adaptedProfile =
    adaptPlayerProfileV1(profile);

  const engineInput =
    buildEngineInputFromProfileContext(
      adaptedProfile,
      options.engine_overrides ?? {}
    );

  const engineResult =
    await runDeepAnalysis(engineInput);

  return {
    pipeline_version: "1.0",
    adapted_profile: adaptedProfile,
    engine_input: engineInput,
    engine_result: engineResult,
    summary: extractPipelineSummary(engineResult)
  };
}

export default runRecommendationPipelineV1;
