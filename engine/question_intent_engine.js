/**
 * ============================================================
 * EveryCourtAI
 * Question Intent Engine V1
 * ============================================================
 *
 * Purpose:
 *
 * Detect what the user is asking EveryCourtAI to do.
 *
 * This engine is intentionally separate from:
 *
 * - input_parser.js
 * - player_engine.js
 * - conversation_state_engine.js
 * - recommendation engines
 *
 * It classifies request intent only.
 *
 * ============================================================
 */

const ENGINE_NAME =
    "question_intent_engine";

const ENGINE_VERSION =
    "1.0";


export const QUESTION_INTENTS = Object.freeze({
    RECOMMEND_SETUP:
        "recommend_setup",

    COMPARE_PRODUCTS:
        "compare_products",

    ADJUST_TENSION:
        "adjust_tension",

    EXPLAIN_CURRENT_SETUP:
        "explain_current_setup",

    PHYSICAL_COMFORT:
        "physical_comfort",

    UPDATE_PREFERENCES:
        "update_preferences",

    GENERAL_TENNIS_QUESTION:
        "general_tennis_question",

    UNKNOWN:
        "unknown"
});


function normalizeMessage(
    message
) {
    return String(
        message ??
        ""
    )
        .trim()
        .toLowerCase();
}


function containsAny(
    message,
    patterns = []
) {
    return patterns.some(
        pattern =>
            message.includes(
                pattern
            )
    );
}


/**
 * ============================================================
 * Main Intent Detection
 * ============================================================
 */

export function detectQuestionIntent(
    message
) {
    const text =
        normalizeMessage(
            message
        );


    if (!text) {
        return buildResult(
            QUESTION_INTENTS.UNKNOWN,
            0,
            createEmptyContext()
        );
    }


    /**
     * ========================================================
     * Context Detection
     * ========================================================
     *
     * Context describes constraints / signals contained in the
     * question. It does NOT by itself determine the main task.
     * ========================================================
     */

    const context = {

        physical:
            containsAny(
                text,
                [
                    "肩",
                    "手肘",
                    "肘",
                    "手腕",
                    "手臂",
                    "腰",
                    "膝",
                    "脚踝",
                    "疼",
                    "痛",
                    "不舒服",
                    "疲劳",
                    "累",
                    "comfort",
                    "comfortable",
                    "shoulder",
                    "elbow",
                    "wrist",
                    "arm pain",
                    "fatigue",
                    "hurts",
                    "hurt"
                ]
            ),

        comparison:
            containsAny(
                text,
                [
                    "比较",
                    "对比",
                    "区别",
                    "哪个好",
                    "哪一个好",
                    "哪个更好",
                    "哪个更适合我",
                    "哪一个更适合我",
                    "哪个更适合",
                    "哪一个更适合",
                    "比",
                    "vs",
                    "versus",
                    "compare",
                    "comparison",
                    "difference between",
                    "which is better"
                ]
            ),

        explanation_requested:
            containsAny(
                text,
                [
                    "为什么",
                    "原因",
                    "解释",
                    "why",
                    "explain"
                ]
            ),

        preserve_racquet:
            containsAny(
                text,
                [
                    "球拍不换",
                    "不要换球拍",
                    "保持球拍",
                    "keep my racquet",
                    "keep my racket"
                ]
            ),

        preserve_string:
            containsAny(
                text,
                [
                    "球线不换",
                    "不要换球线",
                    "保持球线",
                    "keep my string"
                ]
            )
    };


    /**
     * ========================================================
     * Primary Task Signals
     * ========================================================
     */

    const recommendationRequested =
        containsAny(
            text,
            [
                "推荐",
                "建议",
                "怎么配",
                "怎么搭配",
                "适合什么",
                "应该换什么",
                "应该用什么",
                "适合我吗",
                "合适吗",
                "recommend",
                "recommendation",
                "suggest",
                "what should i use",
                "what should i change",
                "what string should i",
                "what racquet should i",
                "what racket should i",
                "suitable for me"
            ]
        );


    const tensionRequested =
        containsAny(
            text,
            [
                "磅数",
                "磅",
                "张力",
                "拉多少",
                "多少磅",
                "调低",
                "调高",
                "tension",
                "lbs",
                "pounds"
            ]
        );


    const preferenceUpdateRequested =
        containsAny(
            text,
            [
                "不想换",
                "可以换",
                "不要换",
                "保持球拍",
                "保持球线",
                "只换球线",
                "只换球拍",
                "只调磅数",
                "keep my racquet",
                "keep my racket",
                "keep my string",
                "change the string",
                "change the racquet",
                "change the racket"
            ]
        );


    const currentSetupExplanationRequested =
        containsAny(
            text,
            [
                "这个配置怎么样",
                "现在这个配置",
                "is this setup good",
                "is this suitable",
                "current setup"
            ]
        );


    const generalTennisSignal =
        containsAny(
            text,
            [
                "网球",
                "球拍",
                "球线",
                "正手",
                "反手",
                "发球",
                "旋转",
                "控制",
                "力量",
                "tennis",
                "racquet",
                "racket",
                "string",
                "forehand",
                "backhand",
                "serve",
                "spin"
            ]
        );


    /**
     * ========================================================
     * Primary Intent Resolution
     * ========================================================
     *
     * Priority represents the action EveryCourtAI must perform.
     *
     * Context such as physical discomfort does not automatically
     * replace a recommendation / comparison task.
     * ========================================================
     */


    /**
     * Comparison is a task.
     *
     * "Why is A better than B for me?"
     * remains comparison, with explanation_requested context.
     */

    if (
        context.comparison
    ) {
        return buildResult(
            QUESTION_INTENTS.COMPARE_PRODUCTS,
            0.95,
            context
        );
    }


    /**
     * Explicit tension request remains tension-specific.
     */

    if (
        tensionRequested
    ) {
        return buildResult(
            QUESTION_INTENTS.ADJUST_TENSION,
            0.9,
            context
        );
    }


    /**
     * Explicit explanation request.
     *
     * Comparison has already been resolved above, so:
     *
     * "Why is A better than B?"
     * remains compare_products + explanation context.
     *
     * But:
     *
     * "Why are you recommending natural gut?"
     * is an explanation task, not a new recommendation request.
     */

    if (
        context.explanation_requested
    ) {
        return buildResult(
            QUESTION_INTENTS.EXPLAIN_CURRENT_SETUP,
            0.9,
            context
        );
    }


    /**
     * Recommendation takes priority over physical / preference
     * context when the user explicitly asks what to use/change.
     */

    if (
        recommendationRequested
    ) {
        return buildResult(
            QUESTION_INTENTS.RECOMMEND_SETUP,
            0.9,
            context
        );
    }


    /**
     * Pure preference update without another requested task.
     */

    if (
        preferenceUpdateRequested
    ) {
        return buildResult(
            QUESTION_INTENTS.UPDATE_PREFERENCES,
            0.9,
            context
        );
    }


    /**
     * Explicit current setup explanation.
     */

    if (
        currentSetupExplanationRequested ||
        context.explanation_requested
    ) {
        return buildResult(
            QUESTION_INTENTS.EXPLAIN_CURRENT_SETUP,
            0.85,
            context
        );
    }


    /**
     * Physical concern without another explicit task.
     */

    if (
        context.physical
    ) {
        return buildResult(
            QUESTION_INTENTS.PHYSICAL_COMFORT,
            0.9,
            context
        );
    }


    if (
        generalTennisSignal
    ) {
        return buildResult(
            QUESTION_INTENTS.GENERAL_TENNIS_QUESTION,
            0.6,
            context
        );
    }


    return buildResult(
        QUESTION_INTENTS.UNKNOWN,
        0.2,
        context
    );
}


/**
 * ============================================================
 * Context Builder
 * ============================================================
 */

function createEmptyContext() {
    return {
        physical:
            false,

        comparison:
            false,

        explanation_requested:
            false,

        preserve_racquet:
            false,

        preserve_string:
            false
    };
}


/**
 * ============================================================
 * Result Builder
 * ============================================================
 */

function buildResult(
    intent,
    confidence,
    context = createEmptyContext()
) {
    return {
        engine:
            ENGINE_NAME,

        version:
            ENGINE_VERSION,

        /**
         * Backward-compatible field.
         */
        intent,

        /**
         * Canonical V1 task field.
         */
        primary_intent:
            intent,

        confidence,

        context
    };
}


export default {
    detectQuestionIntent,
    QUESTION_INTENTS
};
