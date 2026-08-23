import {
  resolveRacquet,
  resolveString
} from "./product_resolver.js";

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function normalizeResolvedRacquet(value) {
  if (!value) {
    return value;
  }

  if (
    isPlainObject(value) &&
    value.id
  ) {
    return value;
  }

  if (typeof value !== "string") {
    return value;
  }

  const resolved =
    resolveRacquet(value);

  if (
    resolved?.status !== "resolved" ||
    !resolved?.match?.id
  ) {
    return value;
  }

  return {
    id:
      resolved.match.id,

    brand:
      resolved.match.brand ?? null,

    model:
      resolved.match.model ?? null
  };
}

function normalizeResolvedString(value) {
  if (!value) {
    return value;
  }

  if (
    isPlainObject(value) &&
    value.id
  ) {
    return value;
  }

  if (typeof value !== "string") {
    return value;
  }

  const resolved =
    resolveString(value);

  if (
    resolved?.status !== "resolved" ||
    !resolved?.match?.id
  ) {
    return value;
  }

  return {
    id:
      resolved.match.id,

    brand:
      resolved.match.brand ?? null,

    model:
      resolved.match.model ?? null,

    gauge_mm:
      resolved.match.gauge_mm ?? null
  };
}

export function normalizeStructuredProductInput(
  playerInput = {}
) {
  if (!isPlainObject(playerInput)) {
    return playerInput;
  }

  return {
    ...playerInput,

    current_racquet:
      normalizeResolvedRacquet(
        playerInput.current_racquet
      ),

    current_string:
      normalizeResolvedString(
        playerInput.current_string
      )
  };
}

export {
  normalizeResolvedRacquet,
  normalizeResolvedString
};

export default normalizeStructuredProductInput;
