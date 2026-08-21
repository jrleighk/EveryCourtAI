/**
 * ============================================================
 * EveryCourtAI
 * Recommendation Regression Matrix
 * Version: 1.0
 * ============================================================
 *
 * 路径：
 * tests/regression/recommendation_matrix_v1.js
 *
 * 目标：
 * 验证 Matching / Ranking / Recommendation Engine 修改后，
 * 核心推荐行为没有发生非预期回归。
 *
 * 当前重点：
 * - Minimum Effective Change
 * - Structured String Traits
 * - Physical Compatibility
 * - Goal Alignment
 * - Current Equipment Continuity
 * ============================================================
 */

import {
    runDeepAnalysis
} from "../../engine/main_engine.js";


/**
 * ============================================================
 * Helpers
 * ============================================================
 */

function getRecommendation(
    result
) {
    return result?.recommendation ?? {};
}


function getRecommendedRacquetId(
    result
) {
    return getRecommendation(result)
        ?.racquet_decision
        ?.recommended
        ?.id ??
        null;
}


function getRecommendedStringId(
    result
) {
    return getRecommendation(result)
        ?.string_setup
        ?.main
        ?.id ??
        null;
}


function getRacquetAction(
    result
) {
    return getRecommendation(result)
        ?.racquet_decision
        ?.action ??
        null;
}


function getStringAction(
    result
) {
    return getRecommendation(result)
        ?.string_decision
        ?.action ??
        null;
}


function getTensionAction(
    result
) {
    return getRecommendation(result)
        ?.tension_decision
        ?.action ??
        null;
}


function getStrategy(
    result
) {
    return getRecommendation(result)
        ?.change_strategy
        ?.strategy ??
        null;
}


function getChangeCount(
    result
) {
    return getRecommendation(result)
        ?.change_strategy
        ?.recommended_change_count ??
        null;
}


function getRecommendedTension(
    result
) {
    return getRecommendation(result)
        ?.tension
        ?.main_lbs ??
        null;
}


function getTopStrings(
    result,
    limit = 5
) {
    const ranking =
        result
            ?.intermediate_results
            ?.ranking ??
        result
            ?.ranking ??
        null;

    return (
        ranking?.strings ?? []
    )
        .slice(
            0,
            limit
        )
        .map(
            item => ({
                id:
                    item?.id ?? null,

                model:
                    item?.model ?? null,

                score:
                    item
                        ?.ranking
                        ?.overall_score ??
                    null,

                physical:
                    item
                        ?.ranking
                        ?.physical_compatibility ??
                    null,

                goal:
                    item
                        ?.ranking
                        ?.goal_alignment ??
                    null
            })
        );
}


/**
 * ============================================================
 * Common Setup
 * ============================================================
 */

const RF01 = {
    id:
        "wilson_rf_01_pro_classic",

    brand:
        "Wilson",

    model:
        "RF 01 Pro Classic"
};


const HAWK_TOUCH = {
    id:
        "head_hawk_touch",

    brand:
        "HEAD",

    model:
        "HAWK TOUCH",

    gauge_mm:
        1.25
};


const NATURAL_GUT = {
    id:
        "wilson_natural_gut_17",

    brand:
        "Wilson",

    model:
        "Natural Gut 17",

    gauge_mm:
        1.25
};


/**
 * ============================================================
 * Test Cases
 * ============================================================
 *
 * assertions 返回：
 *
 * {
 *   pass: boolean,
 *   warnings: string[]
 * }
 *
 * Regression V1 不强制所有场景只能出现某一个具体产品，
 * 而是优先验证策略方向是否合理。
 * ============================================================
 */

const cases = [

    /**
     * CASE 1
     *
     * Moderate shoulder + comfort + firm poly
     *
     * 应优先改变球线，而不是换球拍。
     */

    {
        id:
            "comfort_moderate_hawk",

        title:
            "Comfort / Moderate Shoulder / HAWK TOUCH",

        input: {
            current_racquet:
                RF01,

            current_string:
                HAWK_TOUCH,

            current_tension:
                55,

            primary_goal:
                "more_comfort",

            playing_style:
                "all_court",

            swing_speed:
                "medium",

            feel_preference:
                "connected",

            physical: {
                shoulder: {
                    active:
                        true,

                    severity:
                        "moderate"
                }
            }
        },

        evaluate(result) {

            const racquetAction =
                getRacquetAction(
                    result
                );

            const stringAction =
                getStringAction(
                    result
                );

            const strategy =
                getStrategy(
                    result
                );

            const stringId =
                getRecommendedStringId(
                    result
                );

            const changeCount =
                getChangeCount(
                    result
                );

            const warnings = [];

            const pass =
                racquetAction ===
                    "keep" &&
                stringAction ===
                    "change" &&
                strategy ===
                    "string_first" &&
                stringId !==
                    "head_hawk_touch" &&
                changeCount ===
                    1;

            return {
                pass,
                warnings
            };
        }
    },


    /**
     * CASE 2
     *
     * Comfort goal, no physical issue.
     *
     * 不应该因为用户只说 comfort，
     * 就强制把所有 polyester 换成 Natural Gut。
     */

    {
        id:
            "comfort_no_physical_hawk",

        title:
            "Comfort / No Physical Constraint / HAWK TOUCH",

        input: {
            current_racquet:
                RF01,

            current_string:
                HAWK_TOUCH,

            current_tension:
                52,

            primary_goal:
                "more_comfort",

            playing_style:
                "all_court",

            swing_speed:
                "medium",

            feel_preference:
                "connected",

            physical:
                {}
        },

        evaluate(result) {

            const racquetAction =
                getRacquetAction(
                    result
                );

            const strategy =
                getStrategy(
                    result
                );

            const warnings = [];

            /**
             * 这里只要求：
             *
             * 不应该因为 comfort 目标就换掉球拍。
             *
             * String 是否更换允许 Engine 自己判断。
             */

            const pass =
                racquetAction ===
                    "keep" &&
                strategy !==
                    "full_setup_change";

            return {
                pass,
                warnings
            };
        }
    },


    /**
     * CASE 3
     *
     * Control goal + HAWK TOUCH
     *
     * HAWK TOUCH 本身是控制型 poly，
     * 不应该无理由被换掉。
     */

    {
        id:
            "control_hawk",

        title:
            "Control / No Physical Constraint / HAWK TOUCH",

        input: {
            current_racquet:
                RF01,

            current_string:
                HAWK_TOUCH,

            current_tension:
                52,

            primary_goal:
                "more_control",

            playing_style:
                "all_court",

            swing_speed:
                "medium",

            feel_preference:
                "connected",

            physical:
                {}
        },

        evaluate(result) {

            const stringAction =
                getStringAction(
                    result
                );

            const recommendedString =
                getRecommendedStringId(
                    result
                );

            const warnings = [];

            const pass =
                (
                    stringAction ===
                        "keep"
                ) ||
                (
                    recommendedString ===
                        "head_hawk_touch"
                );

            return {
                pass,
                warnings
            };
        }
    },


    /**
     * CASE 4
     *
     * Spin goal.
     *
     * 应避免 Natural Gut 因舒适度权重
     * 无条件统治 spin 推荐。
     */

    {
        id:
            "spin_hawk",

        title:
            "Spin / No Physical Constraint / HAWK TOUCH",

        input: {
            current_racquet:
                RF01,

            current_string:
                HAWK_TOUCH,

            current_tension:
                50,

            primary_goal:
                "more_spin",

            playing_style:
                "baseline",

            swing_speed:
                "fast",

            feel_preference:
                "connected",

            physical:
                {}
        },

        evaluate(result) {

            const stringId =
                getRecommendedStringId(
                    result
                );

            const warnings = [];

            const naturalGutIds =
                new Set([
                    "wilson_natural_gut_17",
                    "luxilon_natural_gut"
                ]);

            const pass =
                !naturalGutIds.has(
                    stringId
                );

            return {
                pass,
                warnings
            };
        }
    },


    /**
     * CASE 5
     *
     * Power goal.
     *
     * 应允许 power-oriented / gut / multi
     * 上升，但不应换球拍作为第一反应。
     */

    {
        id:
            "power_hawk",

        title:
            "Power / No Physical Constraint / HAWK TOUCH",

        input: {
            current_racquet:
                RF01,

            current_string:
                HAWK_TOUCH,

            current_tension:
                52,

            primary_goal:
                "more_power",

            playing_style:
                "all_court",

            swing_speed:
                "medium",

            feel_preference:
                "connected",

            physical:
                {}
        },

        evaluate(result) {

            const racquetAction =
                getRacquetAction(
                    result
                );

            const strategy =
                getStrategy(
                    result
                );

            const warnings = [];

            const pass =
                racquetAction ===
                    "keep" &&
                strategy !==
                    "full_setup_change";

            return {
                pass,
                warnings
            };
        }
    },


    /**
     * CASE 6
     *
     * Feel goal + Natural Gut.
     *
     * Natural Gut 本身已经非常强，
     * 应该保持。
     */

    {
        id:
            "feel_natural_gut",

        title:
            "Feel / Natural Gut",

        input: {
            current_racquet:
                RF01,

            current_string:
                NATURAL_GUT,

            current_tension:
                53,

            primary_goal:
                "more_feel",

            playing_style:
                "all_court",

            swing_speed:
                "medium",

            feel_preference:
                "connected",

            physical:
                {}
        },

        evaluate(result) {

            const stringAction =
                getStringAction(
                    result
                );

            const stringId =
                getRecommendedStringId(
                    result
                );

            const warnings = [];

            const pass =
                stringAction ===
                    "keep" &&
                stringId ===
                    "wilson_natural_gut_17";

            return {
                pass,
                warnings
            };
        }
    },


    /**
     * CASE 7
     *
     * Mild shoulder + Natural Gut.
     *
     * 不应该因为 physical constraint
     * 反而把已经舒适的配置换掉。
     */

    {
        id:
            "comfort_mild_natural_gut",

        title:
            "Comfort / Mild Shoulder / Natural Gut",

        input: {
            current_racquet:
                RF01,

            current_string:
                NATURAL_GUT,

            current_tension:
                53,

            primary_goal:
                "more_comfort",

            playing_style:
                "all_court",

            swing_speed:
                "medium",

            feel_preference:
                "connected",

            physical: {
                shoulder: {
                    active:
                        true,

                    severity:
                        "mild"
                }
            }
        },

        evaluate(result) {

            const racquetAction =
                getRacquetAction(
                    result
                );

            const stringAction =
                getStringAction(
                    result
                );

            const warnings = [];

            const pass =
                racquetAction ===
                    "keep" &&
                stringAction ===
                    "keep";

            return {
                pass,
                warnings
            };
        }
    },


    /**
     * CASE 8
     *
     * Moderate shoulder + Natural Gut.
     *
     * 当前线已经是 arm-friendly，
     * 应优先保持。
     */

    {
        id:
            "comfort_moderate_natural_gut",

        title:
            "Comfort / Moderate Shoulder / Natural Gut",

        input: {
            current_racquet:
                RF01,

            current_string:
                NATURAL_GUT,

            current_tension:
                53,

            primary_goal:
                "more_comfort",

            playing_style:
                "all_court",

            swing_speed:
                "medium",

            feel_preference:
                "connected",

            physical: {
                shoulder: {
                    active:
                        true,

                    severity:
                        "moderate"
                }
            }
        },

        evaluate(result) {

            const racquetAction =
                getRacquetAction(
                    result
                );

            const stringAction =
                getStringAction(
                    result
                );

            const recommendedString =
                getRecommendedStringId(
                    result
                );

            const warnings = [];

            const pass =
                racquetAction ===
                    "keep" &&
                stringAction ===
                    "keep" &&
                recommendedString ===
                    "wilson_natural_gut_17";

            return {
                pass,
                warnings
            };
        }
    }
];


/**
 * ============================================================
 * Execute
 * ============================================================
 */

let passed = 0;
let failed = 0;
let warningCount = 0;


console.log("");
console.log("============================================================");
console.log("EveryCourtAI Recommendation Regression Matrix V1");
console.log("============================================================");
console.log("");


for (
    const testCase
    of cases
) {

    console.log(
        `CASE: ${testCase.id}`
    );

    console.log(
        testCase.title
    );


    let result;


    try {

        result =
            await runDeepAnalysis(
                testCase.input
            );

    } catch (
        error
    ) {

        console.log(
            "RESULT: FAIL"
        );

        console.log(
            "Engine Error:",
            error instanceof Error
                ? error.message
                : String(error)
        );

        failed += 1;

        console.log(
            "------------------------------------------------------------"
        );

        continue;
    }


    if (
        !result?.success
    ) {

        console.log(
            "RESULT: FAIL"
        );

        console.log(
            "Engine returned success=false"
        );

        console.log(
            JSON.stringify(
                result?.error ?? null,
                null,
                2
            )
        );

        failed += 1;

        console.log(
            "------------------------------------------------------------"
        );

        continue;
    }


    const evaluation =
        testCase.evaluate(
            result
        );


    const recommendation =
        getRecommendation(
            result
        );


    const summary = {
        racquet:
            getRecommendedRacquetId(
                result
            ),

        racquet_action:
            getRacquetAction(
                result
            ),

        string:
            getRecommendedStringId(
                result
            ),

        string_action:
            getStringAction(
                result
            ),

        tension:
            getRecommendedTension(
                result
            ),

        tension_action:
            getTensionAction(
                result
            ),

        strategy:
            getStrategy(
                result
            ),

        change_count:
            getChangeCount(
                result
            )
    };


    console.log(
        JSON.stringify(
            summary,
            null,
            2
        )
    );


    console.log(
        "Top Strings:"
    );

    console.table(
        getTopStrings(
            result,
            5
        )
    );


    if (
        evaluation.pass
    ) {

        console.log(
            "RESULT: PASS"
        );

        passed += 1;

    } else {

        console.log(
            "RESULT: FAIL"
        );

        failed += 1;
    }


    const warnings =
        evaluation.warnings ?? [];


    for (
        const warning
        of warnings
    ) {

        console.log(
            "WARNING:",
            warning
        );

        warningCount += 1;
    }


    /**
     * Defensive information:
     * Useful when debugging a failed case.
     */

    if (
        !evaluation.pass
    ) {

        console.log(
            "Change Strategy:"
        );

        console.log(
            JSON.stringify(
                recommendation
                    ?.change_strategy ??
                null,
                null,
                2
            )
        );
    }


    console.log(
        "------------------------------------------------------------"
    );
}


/**
 * ============================================================
 * Summary
 * ============================================================
 */

console.log("");
console.log("============================================================");
console.log("REGRESSION SUMMARY");
console.log("============================================================");

console.log(
    `Total:    ${cases.length}`
);

console.log(
    `Passed:   ${passed}`
);

console.log(
    `Failed:   ${failed}`
);

console.log(
    `Warnings: ${warningCount}`
);

console.log("============================================================");
console.log("");


if (
    failed > 0
) {
    process.exitCode =
        1;
}
