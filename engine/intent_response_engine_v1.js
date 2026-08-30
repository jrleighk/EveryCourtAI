import {
  routeQuestionIntent,
  RESPONSE_MODES
} from "./intent_response_router_v1.js";

import {
  buildTensionFocusedAnswer,
  buildExplanationFocusedAnswer
} from "./intent_answer_builder_v1.js";

const ENGINE_NAME = "intent_response_engine";
const ENGINE_VERSION = "1.0";

export function buildIntentResponse({
  questionIntentResult = null,
  effectiveIntent = null,
  engineResult = null,
  language = "en"
} = {}) {

  const routing =
    routeQuestionIntent(
      questionIntentResult,
      effectiveIntent
    );

  if (
    routing.response_mode ===
    RESPONSE_MODES.TENSION_FOCUSED
  ) {

    const focused =
      buildTensionFocusedAnswer(
        engineResult,
        language
      );

    return {
      engine: ENGINE_NAME,
      version: ENGINE_VERSION,
      handled: true,
      routing,
      response_mode:
        routing.response_mode,
      answer:
        focused.answer,
      data:
        focused.data,
      builder:
        focused
    };
  }

  if (
    routing.response_mode ===
    RESPONSE_MODES.EXPLANATION_FOCUSED
  ) {

    const focused =
      buildExplanationFocusedAnswer(
        engineResult,
        routing.context
          ?.explanation_target ??
          null,
        language
      );

    return {
      engine: ENGINE_NAME,
      version: ENGINE_VERSION,
      handled:
        focused.available === true,
      routing,
      response_mode:
        routing.response_mode,
      answer:
        focused.answer,
      data:
        focused.data,
      builder:
        focused,
      reason:
        focused.available === true
          ? null
          : "explanation_unavailable"
    };
  }


  if (
    routing.capability_status ===
    "available"
  ) {
    return {
      engine: ENGINE_NAME,
      version: ENGINE_VERSION,
      handled: false,
      routing,
      response_mode:
        routing.response_mode,
      answer: null,
      data: null,
      reason:
        "specialized_builder_not_connected"
    };
  }

  if (
    routing.capability_status ===
    "pending"
  ) {
    return {
      engine: ENGINE_NAME,
      version: ENGINE_VERSION,
      handled: false,
      routing,
      response_mode:
        routing.response_mode,
      answer: null,
      data: null,
      reason:
        "capability_pending"
    };
  }

  return {
    engine: ENGINE_NAME,
    version: ENGINE_VERSION,
    handled: false,
    routing,
    response_mode:
      routing.response_mode,
    answer: null,
    data: null,
    reason:
      "fallback"
  };
}

export default {
  buildIntentResponse
};
