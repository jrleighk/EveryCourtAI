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

import {
    isExplicitMultilingualComparisonQuery
} from "./multilingual_comparison_query_v1.js";


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
 * Comparison Intent V1
 * ============================================================
 *
 * Important:
 *
 * Chinese "比较" can also mean "relatively":
 *
 * - 比较舒服
 * - 比较直接
 * - 比较硬
 *
 * Those are NOT comparison tasks.
 *
 * Likewise, the single character "比" must not be treated as
 * a comparison signal without comparative structure.
 * ============================================================
 */

function detectComparisonIntent(
    text
) {

    /**
     * Explicit multilingual comparison command.
     *
     * This shared gate keeps the Question Intent Engine and the
     * Comparison Target Extractor aligned across all supported
     * frontend locales.
     */

    if (
        isExplicitMultilingualComparisonQuery(
            text
        )
    ) {
        return true;
    }


    /**
     * Strong explicit comparison signals.
     */

    if (
        containsAny(
            text,
            [
                "对比",
                "区别",
                "哪个好",
                "哪一个好",
                "哪个更好",
                "哪一个更好",
                "哪个更适合我",
                "哪一个更适合我",
                "哪个更适合",
                "哪一个更适合",
                "有什么区别",
                "有何区别",
                "vs",
                "versus",
                "compare",
                "comparison",
                "difference between",
                "which is better"
            ]
        )
    ) {

        return true;
    }


    /**
     * Explicit Chinese "compare" task wording.
     *
     * Do NOT match:
     *
     * - 比较舒服
     * - 比较直接
     * - 比较硬
     */

    if (
        containsAny(
            text,
            [
                "请比较",
                "帮我比较",
                "麻烦比较",
                "比较一下",
                "我想比较",
                "想比较"
            ]
        )
    ) {

        return true;
    }


    /**
     * Bare Chinese comparison command:
     *
     * 比较 A 和 B
     * 比较 A 与 B
     * 比较 A 跟 B
     * 比较 A vs B
     *
     * Important:
     *
     * Require an explicit two-target separator so phrases such
     * as "比较舒服" / "比较硬" / "比较直接" are NOT treated
     * as comparison tasks.
     */

    if (
        /^比较\s*.+(?:和|与|跟|\s+vs\.?\s+|\s+versus\s+).+/i.test(
            text
        )
    ) {

        return true;
    }


    /**
     * Chinese comparative structure:
     *
     * A 比 B 更...
     *
     * Example:
     * Pure Drive 比 RF01 更适合我
     *
     * This does not match "比较舒服" because there is no
     * separate A 比 B 更... structure.
     */

    if (
        /.+比.+更.+/.test(
            text
        )
    ) {

        return true;
    }


    return false;
}


/**
 * ============================================================
 * Tension Intent V1
 * ============================================================
 *
 * A tension value appearing in the user's current setup is
 * context, not automatically a tension-adjustment task.
 *
 * Examples:
 *
 * "HAWK TOUCH 54磅"
 * → setup information
 *
 * "我应该拉多少磅？"
 * → tension task
 *
 * "帮我降低2磅"
 * → tension task
 *
 * Bare words such as:
 *
 * - 磅
 * - lbs
 * - pounds
 *
 * must NOT independently trigger adjust_tension.
 * ============================================================
 */

function detectTensionIntent(
    text
) {

    /**
     * Chinese explicit tension questions / actions.
     */

    if (
        containsAny(
            text,
            [
                "拉多少磅",
                "拉多少",
                "多少磅",
                "应该拉多少",
                "应该用多少磅",
                "用多少磅",
                "建议多少磅",
                "建议拉多少",
                "磅数怎么调",
                "磅数怎么调整",
                "怎么调磅数",
                "怎么调整磅数",
                "调整磅数",
                "调低磅数",
                "调高磅数",
                "降低磅数",
                "提高磅数",
                "降磅",
                "升磅",
                "加磅",
                "减磅",
                "张力怎么调",
                "调整张力"
            ]
        )
    ) {

        return true;
    }


    /**
     * More natural Chinese action wording:
     *
     * "帮我把现在的磅数调低一点"
     * "把54磅降低到52磅"
     */

    if (
        /磅数.*(调低|调高|降低|提高|调整)/.test(
            text
        ) ||
        /(调低|调高|降低|提高|调整).*(磅数|磅)/.test(
            text
        ) ||
        /(磅数|磅|张力).*(太高|太低|过高|过低)/.test(
            text
        ) ||
        /(太高|太低|过高|过低).*(磅数|张力)/.test(
            text
        )
    ) {

        return true;
    }


    /**
     * English explicit tension questions / actions.
     *
     * Bare "54 lbs" is intentionally NOT enough.
     */

    if (
        containsAny(
            text,
            [
                "what tension",
                "which tension",
                "what string tension",
                "how much tension",
                "how many lbs",
                "what lbs",
                "adjust tension",
                "change tension",
                "lower tension",
                "lower the tension",
                "raise tension",
                "raise the tension",
                "increase tension",
                "increase the tension",
                "decrease tension",
                "decrease the tension",
                "reduce tension",
                "reduce the tension",
                "tension should i use",
                "tension should i string",
                "what tension should i use"
            ]
        )
    ) {

        return true;
    }


    /**
     * Natural English tension evaluation:
     *
     * - Is 54 lbs too high?
     * - Is this tension too low?
     */

    if (
        /(lbs|pounds|tension).*(too high|too low)/.test(
            text
        ) ||
        /(too high|too low).*(tension)/.test(
            text
        )
    ) {

        return true;
    }


    return false;
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
            detectComparisonIntent(
                text
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

        explanation_target:
            detectExplanationTarget(
                text
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
        detectTensionIntent(
            text
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
     * Explicit explanation request.
     *
     * Comparison has already been resolved above, so:
     *
     * "Why is A better than B?"
     * remains compare_products + explanation context.
     *
     * Explanation also takes priority over a tension keyword:
     *
     * "Why this tension?"
     * is an explanation task.
     *
     * "What tension should I use?"
     * remains an adjust_tension task.
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
     * Explicit tension request remains tension-specific
     * when the user is asking for a tension decision rather
     * than an explanation of an existing recommendation.
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
 * Explanation Target V1
 * ============================================================
 */

function detectExplanationTarget(
    text
) {

    if (
        containsAny(
            text,
            [
                "球线",
                "线",
                "string",
                "natural gut",
                "poly",
                "polyester"
            ]
        )
    ) {

        return "string";
    }


    if (
        containsAny(
            text,
            [
                "球拍",
                "拍子",
                "racquet",
                "racket",
                "frame"
            ]
        )
    ) {

        return "racquet";
    }


    if (
        containsAny(
            text,
            [
                "磅数",
                "磅",
                "张力",
                "tension",
                "lbs",
                "pounds"
            ]
        )
    ) {

        return "tension";
    }


    if (
        containsAny(
            text,
            [
                "配置",
                "整套",
                "setup",
                "combination"
            ]
        )
    ) {

        return "setup";
    }


    return null;
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

        explanation_target:
            null,

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
