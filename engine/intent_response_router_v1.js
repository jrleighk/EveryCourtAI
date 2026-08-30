/**
 * ============================================================
 * EveryCourtAI
 * Intent Response Router V1
 * ============================================================
 *
 * Purpose:
 *
 * Convert Question Intent into a response mode.
 *
 * This router does NOT:
 *
 * - run recommendation engines
 * - compare products directly
 * - generate final human answers
 * - modify conversation state
 *
 * It only decides which response behavior should be used.
 *
 * ============================================================
 */

const ENGINE_NAME =
    "intent_response_router";

const ENGINE_VERSION =
    "1.0";


export const RESPONSE_MODES =
    Object.freeze({

        FULL_RECOMMENDATION:
            "full_recommendation",

        TENSION_FOCUSED:
            "tension_focused",

        EXPLANATION_FOCUSED:
            "explanation_focused",

        PREFERENCE_UPDATE:
            "preference_update",

        PHYSICAL_FOCUSED:
            "physical_focused",

        COMPARISON_PENDING:
            "comparison_pending",

        GENERAL_QUESTION_PENDING:
            "general_question_pending",

        DEFAULT:
            "default"
    });


const INTENT_TO_RESPONSE_MODE =
    Object.freeze({

        recommend_setup:
            RESPONSE_MODES
                .FULL_RECOMMENDATION,

        adjust_tension:
            RESPONSE_MODES
                .TENSION_FOCUSED,

        explain_current_setup:
            RESPONSE_MODES
                .EXPLANATION_FOCUSED,

        update_preferences:
            RESPONSE_MODES
                .PREFERENCE_UPDATE,

        physical_comfort:
            RESPONSE_MODES
                .PHYSICAL_FOCUSED,

        compare_products:
            RESPONSE_MODES
                .COMPARISON_PENDING,

        general_tennis_question:
            RESPONSE_MODES
                .GENERAL_QUESTION_PENDING,

        unknown:
            RESPONSE_MODES
                .DEFAULT
    });


export function routeQuestionIntent(
    questionIntentResult = null,
    effectiveIntent = null
) {

    const primaryIntent =
        effectiveIntent ??
        questionIntentResult
            ?.primary_intent ??
        questionIntentResult
            ?.intent ??
        "unknown";


    const responseMode =
        INTENT_TO_RESPONSE_MODE[
            primaryIntent
        ] ??
        RESPONSE_MODES.DEFAULT;


    return {

        engine:
            ENGINE_NAME,

        version:
            ENGINE_VERSION,

        primary_intent:
            primaryIntent,

        response_mode:
            responseMode,

        context:
            questionIntentResult
                ?.context ??
            {},

        capability_status:
            resolveCapabilityStatus(
                responseMode
            )
    };
}


function resolveCapabilityStatus(
    responseMode
) {

    if (
        responseMode ===
            RESPONSE_MODES
                .COMPARISON_PENDING ||
        responseMode ===
            RESPONSE_MODES
                .GENERAL_QUESTION_PENDING
    ) {

        return "pending";
    }


    if (
        responseMode ===
            RESPONSE_MODES.DEFAULT
    ) {

        return "fallback";
    }


    return "available";
}


export default {
    routeQuestionIntent,
    RESPONSE_MODES
};
