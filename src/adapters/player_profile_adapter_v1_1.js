import adaptPlayerProfileV1 from "./player_profile_adapter_v1.js";

const VALID_SWING_SPEEDS = new Set([
  "slow",
  "medium",
  "fast"
]);

const DEFAULT_SWING_SPEED = "medium";

function normalizeSwingSpeed(value) {
  if (
    typeof value === "string" &&
    VALID_SWING_SPEEDS.has(value)
  ) {
    return value;
  }

  return DEFAULT_SWING_SPEED;
}

function validateProfileV1_1(profile) {
  if (
    !profile ||
    typeof profile !== "object" ||
    Array.isArray(profile)
  ) {
    throw new TypeError(
      "Player Profile V1.1 must be an object."
    );
  }

  if (profile.profile_version !== "1.1") {
    throw new Error(
      "Unsupported player profile version for Adapter V1.1."
    );
  }
}

export function adaptPlayerProfileV1_1(profile) {
  validateProfileV1_1(profile);

  const compatibleV1Profile = {
    ...profile,
    profile_version: "1.0"
  };

  const base =
    adaptPlayerProfileV1(
      compatibleV1Profile
    );

  const swingSpeed =
    normalizeSwingSpeed(
      profile.swing_speed
    );

  return {
    ...base,

    adapter_version: "1.1",

    source: {
      ...(base.source ?? {}),
      profile_version: "1.1"
    },

    player: {
      ...(base.player ?? {}),
      swing_speed: swingSpeed
    },

    recommendation_context: {
      ...(base.recommendation_context ?? {}),
      swing_speed: swingSpeed
    }
  };
}

export {
  VALID_SWING_SPEEDS,
  DEFAULT_SWING_SPEED,
  normalizeSwingSpeed
};

export default adaptPlayerProfileV1_1;
