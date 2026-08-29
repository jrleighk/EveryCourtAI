import {
    parsePlayerInput
} from "./input_parser.js";

import {
    detectQuestionIntent
} from "./question_intent_engine.js";

import {
    normalizeMultilingualComparisonQuery
} from "./multilingual_comparison_query_v1.js";

import {
    extractComparisonTargets
} from "./comparison_target_extractor_v1.js";


/**
 * ============================================================
 * EveryCourtAI Query Understanding V2
 * ============================================================
 *
 * Purpose
 * -------
 * Build one canonical understanding contract from the existing,
 * already validated intelligence modules.
 *
 * This module does NOT replace:
 *
 * - Input Parser
 * - Question Intent Engine
 * - Comparison Query Normalizer
 * - Comparison Target Extractor
 * - Product Resolver / Alias logic
 * - Conversation State Engine
 * - Change Intent
 * - Recommendation / Matching logic
 *
 * It only coordinates their outputs and resolves cross-module
 * boundaries.
 *
 * ============================================================
 */


export const QUERY_UNDERSTANDING_VERSION =
    "2.0";


function isPlainObject(
    value
) {

    return (
        value !== null &&
        typeof value ===
            "object" &&
        !Array.isArray(
            value
        )
    );
}


function hasOwnMeaningfulValue(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return false;
    }


    if (
        typeof value ===
            "string"
    ) {

        return (
            value.trim().length >
            0
        );
    }


    if (
        Array.isArray(
            value
        )
    ) {

        return (
            value.length >
            0
        );
    }


    if (
        isPlainObject(
            value
        )
    ) {

        return (
            Object.keys(
                value
            ).length >
            0
        );
    }


    return true;
}


function buildEquipmentContext(
    playerInput
) {

    const input =
        isPlainObject(
            playerInput
        )
            ? playerInput
            : {};


    return {

        current_racquet:
            input
                ?.current_racquet ??
            null,

        current_string:
            input
                ?.current_string ??
            null,

        current_tension:
            input
                ?.current_tension ??
            null
    };
}


function buildPlayerContext(
    playerInput
) {

    const input =
        isPlainObject(
            playerInput
        )
            ? playerInput
            : {};


    return {

        playing_level:
            input
                ?.playing_level ??
            null,

        playing_style:
            input
                ?.playing_style ??
            null,

        swing_speed:
            input
                ?.swing_speed ??
            null,

        feel_preference:
            input
                ?.feel_preference ??
            null
    };
}


function buildGoalContext(
    playerInput
) {

    const input =
        isPlainObject(
            playerInput
        )
            ? playerInput
            : {};


    return {

        primary_goal:
            input
                ?.primary_goal ??
            null
    };
}


function buildPhysicalContext(
    playerInput
) {

    const physical =
        isPlainObject(
            playerInput
                ?.physical
        )
            ? playerInput.physical
            : {};


    return {

        active:
            Object.values(
                physical
            ).some(
                region =>
                    region
                        ?.active ===
                    true
            ),

        regions:
            physical
    };
}


function buildChangeConstraints(
    playerInput,
    intentContext
) {

    const parsedChangeIntent =
        isPlainObject(
            playerInput
                ?.change_intent
        )
            ? playerInput
                .change_intent
            : null;


    const preferences =
        isPlainObject(
            playerInput
                ?.preferences
        )
            ? playerInput
                .preferences
            : {};


    return {

        change_tolerance:
            parsedChangeIntent
                ?.change_tolerance ??
            preferences
                ?.change_tolerance ??
            null,

        preserve_racquet:
            parsedChangeIntent
                ?.preserve_racquet ??
            (
                intentContext
                    ?.preserve_racquet ===
                true
            ),

        preserve_string:
            parsedChangeIntent
                ?.preserve_string ??
            (
                intentContext
                    ?.preserve_string ===
                true
            ),

        preferred_change:
            parsedChangeIntent
                ?.preferred_change ??
            null,

        source:
            parsedChangeIntent
                ? "input_parser"
                : (
                    intentContext
                        ?.preserve_racquet ===
                        true ||
                    intentContext
                        ?.preserve_string ===
                        true
                )
                    ? "question_intent"
                    : null
    };
}


function hasActionablePlayerContext(
    playerInput
) {

    if (
        !isPlainObject(
            playerInput
        )
    ) {

        return false;
    }


    return (
        hasOwnMeaningfulValue(
            playerInput
                .primary_goal
        ) ||
        hasOwnMeaningfulValue(
            playerInput
                .current_racquet
        ) ||
        hasOwnMeaningfulValue(
            playerInput
                .current_string
        ) ||
        hasOwnMeaningfulValue(
            playerInput
                .current_tension
        ) ||
        hasOwnMeaningfulValue(
            playerInput
                .playing_style
        ) ||
        hasOwnMeaningfulValue(
            playerInput
                .swing_speed
        ) ||
        hasOwnMeaningfulValue(
            playerInput
                .physical
        ) ||
        hasOwnMeaningfulValue(
            playerInput
                .change_intent
        )
    );
}


function deriveEffectiveIntent({
    rawIntent,
    playerInput,
    explicitComparison
}) {

    const primaryIntent =
        rawIntent
            ?.primary_intent ??
        rawIntent
            ?.intent ??
        "unknown";


    if (
        explicitComparison
    ) {

        return {
            primary:
                "compare_products",

            source:
                "comparison_signal",

            overridden:
                primaryIntent !==
                "compare_products",

            raw:
                primaryIntent
        };
    }


    if (
        (
            primaryIntent ===
                "general_tennis_question" ||
            primaryIntent ===
                "unknown"
        ) &&
        playerInput
            ?.primary_goal &&
        hasActionablePlayerContext(
            playerInput
        )
    ) {

        return {
            primary:
                "recommend_setup",

            source:
                "parser_context",

            overridden:
                true,

            raw:
                primaryIntent
        };
    }


    return {
        primary:
            primaryIntent,

        source:
            "question_intent",

        overridden:
            false,

        raw:
            primaryIntent
    };
}


function simplifyComparisonTarget(
    target
) {

    return {

        raw_text:
            target
                ?.raw_text ??
            null,

        status:
            target
                ?.status ??
            null,

        product_type:
            target
                ?.product_type ??
            null,

        confidence:
            target
                ?.confidence ??
            null,

        match:
            target
                ?.match
                ? {
                    id:
                        target.match
                            ?.id ??
                        null,

                    brand:
                        target.match
                            ?.brand ??
                        null,

                    model:
                        target.match
                            ?.model ??
                        null,

                    release_year:
                        target.match
                            ?.release_year ??
                        null
                }
                : null
    };
}


function buildComparisonContext({
    multilingualResult,
    extractionResult,
    intentResult
}) {

    const explicitSignal =
        (
            multilingualResult
                ?.detected ===
            true
        ) ||
        (
            intentResult
                ?.context
                ?.comparison ===
            true
        ) ||
        (
            intentResult
                ?.primary_intent ===
            "compare_products"
        );


    if (
        !explicitSignal
    ) {

        return {

            detected:
                false,

            explicit:
                false,

            locale:
                null,

            comparison_subtype:
                null,

            canonical_message:
                null,

            targets:
                [],

            resolved_count:
                0,

            ambiguous_count:
                0,

            not_found_count:
                0,

            comparison_ready:
                false,

            suppressed_extractor_result:
                extractionResult
                    ?.detected ===
                true
        };
    }


    return {

        detected:
            extractionResult
                ?.detected ===
            true,

        explicit:
            true,

        locale:
            multilingualResult
                ?.locale ??
            null,

        comparison_subtype:
            extractionResult
                ?.comparison_subtype ??
            multilingualResult
                ?.comparison_subtype ??
            null,

        canonical_message:
            multilingualResult
                ?.canonical_message ??
            null,

        targets:
            Array.isArray(
                extractionResult
                    ?.targets
            )
                ? extractionResult
                    .targets
                    .map(
                        simplifyComparisonTarget
                    )
                : [],

        resolved_count:
            extractionResult
                ?.resolved_count ??
            0,

        ambiguous_count:
            extractionResult
                ?.ambiguous_count ??
            0,

        not_found_count:
            extractionResult
                ?.not_found_count ??
            0,

        comparison_ready:
            extractionResult
                ?.comparison_ready ===
            true,

        suppressed_extractor_result:
            false
    };
}


export function understandTennisQuery(
    message,
    options = {}
) {

    const text =
        typeof message ===
            "string"
            ? message.trim()
            : "";


    const parserResult =
        parsePlayerInput(
            text
        );


    const intentResult =
        detectQuestionIntent(
            text
        );


    const multilingualResult =
        normalizeMultilingualComparisonQuery(
            text
        );


    const extractionResult =
        extractComparisonTargets(
            text
        );


    const currentTurnPlayerInput =
        isPlainObject(
            parserResult
                ?.player_input
        )
            ? parserResult
                .player_input
            : {};


    const accumulatedPlayerInput =
        isPlainObject(
            options
                ?.conversationState
                ?.player_input
        )
            ? options
                .conversationState
                .player_input
            : currentTurnPlayerInput;


    const comparison =
        buildComparisonContext({
            multilingualResult,
            extractionResult,
            intentResult
        });


    const effectiveIntent =
        deriveEffectiveIntent({
            rawIntent:
                intentResult,

            playerInput:
                currentTurnPlayerInput,

            explicitComparison:
                comparison.explicit
        });


    return {

        engine:
            "query_understanding_v2",

        version:
            QUERY_UNDERSTANDING_VERSION,

        message:
            text,

        intent: {

            primary:
                effectiveIntent
                    .primary,

            raw:
                effectiveIntent
                    .raw,

            confidence:
                intentResult
                    ?.confidence ??
                null,

            source:
                effectiveIntent
                    .source,

            overridden:
                effectiveIntent
                    .overridden,

            context:
                intentResult
                    ?.context ??
                {}
        },

        current_turn: {

            player_input:
                currentTurnPlayerInput,

            missing_fields:
                Array.isArray(
                    parserResult
                        ?.missing_fields
                )
                    ? parserResult
                        .missing_fields
                    : [],

            requires_follow_up:
                parserResult
                    ?.requires_follow_up ===
                true
        },

        accumulated_context: {

            source:
                isPlainObject(
                    options
                        ?.conversationState
                        ?.player_input
                )
                    ? "conversation_state"
                    : "current_turn",

            player_input:
                accumulatedPlayerInput
        },

        equipment:
            buildEquipmentContext(
                accumulatedPlayerInput
            ),

        player:
            buildPlayerContext(
                accumulatedPlayerInput
            ),

        goals:
            buildGoalContext(
                accumulatedPlayerInput
            ),

        physical:
            buildPhysicalContext(
                accumulatedPlayerInput
            ),

        change_constraints:
            buildChangeConstraints(
                accumulatedPlayerInput,
                intentResult
                    ?.context
            ),

        comparison,

        routing: {

            route:
                effectiveIntent
                    .primary,

            comparison_ready:
                comparison
                    .comparison_ready,

            requires_follow_up:
                parserResult
                    ?.requires_follow_up ===
                true
        },

        sources: {

            question_intent:
                intentResult
                    ?.engine ??
                "question_intent_engine",

            input_parser:
                parserResult
                    ?.parser
                    ?.name ??
                "EveryCourtAI Input Parser",

            multilingual_comparison:
                multilingualResult
                    ?.module ??
                "multilingual_comparison_query",

            comparison_extractor:
                extractionResult
                    ?.extractor ??
                "comparison_target_extractor"
        }
    };
}


export default
    understandTennisQuery;
