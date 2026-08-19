/**
 * ============================================================
 * EveryCourtAI
 * Explanation Engine
 * Version: 1.0
 * ============================================================
 *
 * 文件路径：
 * engine/explanation_engine.js
 *
 * 作用：
 * 1. 接收 Recommendation / Confidence / Alternative 结果
 * 2. 生成用户可读的解释结构
 * 3. 解释为什么推荐当前球拍/球线/磅数
 * 4. 解释 Physical Override
 * 5. 解释 Tradeoffs
 * 6. 解释 Alternative 为什么不是第一推荐
 * 7. 输出中英文结构
 *
 * 注意：
 * - 本文件不重新计算推荐
 * - 本文件不重新执行 Ranking
 * - 本文件只负责“解释已有决策”
 * ============================================================
 */

import {
    loadKnowledgeJson
} from "../utils/runtime_json_loader.js";

import {
    validatePlayerProfile
} from "../utils/validator.js";


/**
 * ============================================================
 * 基础配置
 * ============================================================
 */

const ENGINE_VERSION = "1.0";


/**
 * ============================================================
 * 通用工具
 * ============================================================
 */

function safeString(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .trim();
}


function normalizeKey(value) {
    return safeString(value)
        .toLowerCase()
        .replace(/[\s-]+/g, "_");
}


function safeNumber(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return null;
    }

    const parsed =
        Number(value);

    return Number.isFinite(parsed)
        ? parsed
        : null;
}


function uniqueArray(values) {
    return [
        ...new Set(
            values.filter(Boolean)
        )
    ];
}


/**
 * ============================================================
 * 中文名称
 * ============================================================
 */

const GOAL_LABELS = {
    more_control: "更多控制",
    more_power: "更多力量",
    more_spin: "更多旋转",
    more_comfort: "更多舒适",
    more_feel: "更好手感"
};


const STYLE_LABELS = {
    baseline_aggressive: "积极底线型",
    baseline_counterpuncher: "底线反击型",
    baseline_grinder: "底线相持型",
    all_court: "全场型",
    serve_volley: "发球上网型"
};


const SWING_LABELS = {
    slow: "慢速挥拍",
    medium: "中速挥拍",
    fast: "快速挥拍"
};


const PHYSICAL_LABELS = {
    arm: "手臂",
    elbow: "肘部",
    wrist: "手腕",
    shoulder: "肩部",
    neck: "颈部",
    lower_back: "腰部",
    hip: "髋部",
    knee: "膝部",
    ankle: "脚踝"
};


/**
 * ============================================================
 * Physical Context
 * ============================================================
 */

function getActivePhysicalConstraints(
    playerProfile
) {
    const output = [];

    const physical =
        playerProfile?.physical ?? {};

    for (
        const [
            region,
            value
        ]
        of Object.entries(
            physical
        )
    ) {
        if (
            value?.active === true &&
            value?.severity &&
            value.severity !== "none"
        ) {
            output.push({
                region:
                    normalizeKey(region),

                severity:
                    normalizeKey(
                        value.severity
                    )
            });
        }
    }

    return output;
}


/**
 * ============================================================
 * Recommendation Summary
 * ============================================================
 */

function buildRecommendationSummary(
    recommendationResult,
    playerProfile
) {
    const racquet =
        recommendationResult
            ?.racquet_decision
            ?.recommended;

    const main =
        recommendationResult
            ?.string_setup
            ?.main;

    const cross =
        recommendationResult
            ?.string_setup
            ?.cross;

    const setupType =
        recommendationResult
            ?.string_setup
            ?.type;

    const goal =
        normalizeKey(
            playerProfile?.primary_goal
        );

    const goalZh =
        GOAL_LABELS[goal] ??
        "当前目标";


    const enParts = [];
    const zhParts = [];


    if (racquet) {
        enParts.push(
            `${racquet.brand ?? ""} ${racquet.model ?? ""}`.trim()
        );

        zhParts.push(
            `${racquet.brand ?? ""} ${racquet.model ?? ""}`.trim()
        );
    }


    if (main) {
        enParts.push(
            `${main.brand ?? ""} ${main.model ?? ""} ${main.gauge_mm ?? ""} mm`.trim()
        );

        zhParts.push(
            `${main.brand ?? ""} ${main.model ?? ""} ${main.gauge_mm ?? ""} mm`.trim()
        );
    }


    if (
        setupType === "hybrid" &&
        cross
    ) {
        enParts.push(
            `hybrid with ${cross.brand ?? ""} ${cross.model ?? ""}`.trim()
        );

        zhParts.push(
            `混线搭配 ${cross.brand ?? ""} ${cross.model ?? ""}`.trim()
        );
    }


    return {
        en:
            enParts.length > 0
                ? `This setup is the best overall match for your goal of ${goal.replace(/_/g, " ")}. ${enParts.join(" / ")}.`
                : "A complete setup could not be fully resolved.",

        zh:
            zhParts.length > 0
                ? `这套配置目前最符合你的「${goalZh}」目标：${zhParts.join(" / ")}。`
                : "目前还无法完整确定最终配置。"
    };
}


/**
 * ============================================================
 * 为什么推荐球拍
 * ============================================================
 */

function explainRacquetDecision(
    recommendationResult,
    playerProfile
) {
    const decision =
        recommendationResult
            ?.racquet_decision;

    if (!decision) {
        return null;
    }

    const racquet =
        decision.recommended;

    if (!racquet) {
        return null;
    }

    const action =
        decision.action;

    const reasonsEn = [];
    const reasonsZh = [];


    if (
        action === "keep"
    ) {
        reasonsEn.push(
            "Your current racquet remains compatible with the recommended direction."
        );

        reasonsZh.push(
            "你目前的球拍仍然与推荐方向高度兼容，因此没有必要为了改变而换拍。"
        );
    }


    if (
        action === "change"
    ) {
        reasonsEn.push(
            "The recommended racquet provides a stronger overall fit than the current frame."
        );

        reasonsZh.push(
            "推荐球拍在整体匹配度上优于目前球拍，因此换拍可以带来更明显的改善。"
        );
    }


    if (
        action === "optional_change"
    ) {
        reasonsEn.push(
            "The new racquet offers advantages, but the adaptation cost is significant enough that changing is optional rather than mandatory."
        );

        reasonsZh.push(
            "新球拍有明显优势，但适应成本也较高，因此属于可选换拍，而不是必须更换。"
        );
    }


    if (
        racquet.score !== null &&
        racquet.score !== undefined
    ) {
        reasonsEn.push(
            `Racquet ranking score: ${racquet.score}.`
        );

        reasonsZh.push(
            `球拍综合匹配分：${racquet.score}。`
        );
    }


    return {
        action,

        product: {
            id:
                racquet.id ?? null,

            brand:
                racquet.brand ?? null,

            model:
                racquet.model ?? null
        },

        reason: {
            en:
                reasonsEn.join(" "),

            zh:
                reasonsZh.join(" ")
        }
    };
}


/**
 * ============================================================
 * 为什么推荐球线
 * ============================================================
 */

function explainStringDecision(
    recommendationResult,
    playerProfile
) {
    const setup =
        recommendationResult
            ?.string_setup;

    if (!setup?.main) {
        return null;
    }

    const main =
        setup.main;

    const goal =
        normalizeKey(
            playerProfile?.primary_goal
        );

    const reasonsEn = [];
    const reasonsZh = [];


    if (
        goal === "more_control"
    ) {
        reasonsEn.push(
            "The selected string emphasizes a more predictable and controlled response."
        );

        reasonsZh.push(
            "这条球线优先强化可预测性与控制表现。"
        );
    }


    if (
        goal === "more_power"
    ) {
        reasonsEn.push(
            "The selected string is intended to provide easier depth and energy return."
        );

        reasonsZh.push(
            "这条球线主要帮助你更轻松获得深度与力量回馈。"
        );
    }


    if (
        goal === "more_spin"
    ) {
        reasonsEn.push(
            "The selected string better supports spin generation while keeping the setup within the player's compatibility limits."
        );

        reasonsZh.push(
            "这条球线更有利于旋转生成，同时仍保持在你的身体与装备兼容范围内。"
        );
    }


    if (
        goal === "more_comfort"
    ) {
        reasonsEn.push(
            "The selected string reduces overall stringbed harshness and prioritizes comfort."
        );

        reasonsZh.push(
            "这条球线优先降低线床生硬感，并提高整体舒适性。"
        );
    }


    if (
        goal === "more_feel"
    ) {
        reasonsEn.push(
            "The selected string prioritizes ball connection, pocketing and impact feedback."
        );

        reasonsZh.push(
            "这条球线更强调触球连接感、包球感与击球反馈。"
        );
    }


    if (
        main.score !== null &&
        main.score !== undefined
    ) {
        reasonsEn.push(
            `String ranking score: ${main.score}.`
        );

        reasonsZh.push(
            `球线综合匹配分：${main.score}。`
        );
    }


    return {
        setup_type:
            setup.type,

        main: {
            id:
                main.id ?? null,

            brand:
                main.brand ?? null,

            model:
                main.model ?? null,

            gauge_mm:
                main.gauge_mm ?? null
        },

        cross:
            setup.cross ?? null,

        reason: {
            en:
                reasonsEn.join(" "),

            zh:
                reasonsZh.join(" ")
        }
    };
}


/**
 * ============================================================
 * 为什么是这个磅数
 * ============================================================
 */

function explainTension(
    recommendationResult,
    playerProfile
) {
    const tension =
        recommendationResult
            ?.tension;

    if (
        !tension ||
        tension.main_lbs === null ||
        tension.main_lbs === undefined
    ) {
        return null;
    }

    const reasonsEn = [];
    const reasonsZh = [];


    const goal =
        normalizeKey(
            playerProfile?.primary_goal
        );


    if (
        goal === "more_comfort" ||
        goal === "more_power"
    ) {
        reasonsEn.push(
            "Tension is kept relatively moderate to improve elasticity, comfort and usable depth."
        );

        reasonsZh.push(
            "磅数保持在相对适中的区间，以提高弹性、舒适性和有效深度。"
        );
    }


    if (
        goal === "more_control"
    ) {
        reasonsEn.push(
            "Tension is selected to preserve directional control without relying on an excessively firm stringbed."
        );

        reasonsZh.push(
            "磅数用于保持方向控制，同时避免通过过硬线床来强行获得控制。"
        );
    }


    if (
        goal === "more_spin"
    ) {
        reasonsEn.push(
            "Tension avoids being unnecessarily high so the stringbed can still support movement and snapback."
        );

        reasonsZh.push(
            "磅数不会设得过高，以保留球线移动与回弹空间，有利于旋转。"
        );
    }


    if (
        goal === "more_feel"
    ) {
        reasonsEn.push(
            "Tension is chosen to preserve pocketing and clear impact feedback."
        );

        reasonsZh.push(
            "磅数用于保留包球感与清晰的触球反馈。"
        );
    }


    const current =
        safeNumber(
            playerProfile
                ?.current_setup
                ?.string
                ?.tension
                ?.main_lbs
        );


    if (
        current !== null
    ) {
        const difference =
            tension.main_lbs -
            current;

        if (
            difference !== 0
        ) {
            reasonsEn.push(
                `This represents a ${Math.abs(difference)} lb ${difference > 0 ? "increase" : "decrease"} from your current main tension.`
            );

            reasonsZh.push(
                `相比目前主线磅数，建议${difference > 0 ? "提高" : "降低"}约 ${Math.abs(difference)} 磅。`
            );
        }
    }


    return {
        main_lbs:
            tension.main_lbs,

        cross_lbs:
            tension.cross_lbs,

        working_range_lbs:
            tension.working_range_lbs,

        reason: {
            en:
                reasonsEn.join(" "),

            zh:
                reasonsZh.join(" ")
        }
    };
}


/**
 * ============================================================
 * Physical Override 解释
 * ============================================================
 */

function explainPhysicalOverrides(
    playerProfile
) {
    const constraints =
        getActivePhysicalConstraints(
            playerProfile
        );

    if (
        constraints.length === 0
    ) {
        return {
            active: false,
            items: []
        };
    }

    const items = [];


    for (
        const constraint
        of constraints
    ) {
        const regionZh =
            PHYSICAL_LABELS[
                constraint.region
            ] ??
            constraint.region;


        items.push({
            region:
                constraint.region,

            severity:
                constraint.severity,

            explanation: {
                en:
                    `${constraint.region.replace(/_/g, " ")} sensitivity is treated as a higher-priority constraint than maximum equipment performance.`,

                zh:
                    `${regionZh}敏感属于高优先级限制条件，因此其优先级高于单纯追求最大性能。`
            }
        });
    }


    return {
        active: true,
        items
    };
}


/**
 * ============================================================
 * Tradeoffs
 * ============================================================
 */

function explainTradeoffs(
    recommendationResult
) {
    const tradeoffs =
        Array.isArray(
            recommendationResult
                ?.tradeoffs
        )
            ? recommendationResult
                .tradeoffs
            : [];


    const output = [];


    for (
        const tradeoff
        of tradeoffs
    ) {
        output.push({
            en:
                safeString(
                    tradeoff
                ),

            zh:
                translateTradeoff(
                    tradeoff
                )
        });
    }


    return output;
}


/**
 * ============================================================
 * Tradeoff 简单翻译
 * ============================================================
 */

function translateTradeoff(
    value
) {
    const text =
        safeString(
            value
        );


    const map = {
        "Potentially lower maximum durability.":
            "可能会降低极限耐久性。",

        "Potentially firmer impact response.":
            "击球反馈可能会更加硬朗。",

        "Potentially shorter peak playability window.":
            "最佳性能维持时间可能更短。",

        "Additional power may slightly reduce directional margin.":
            "力量增加后，方向控制余量可能略有下降。",

        "Higher spin potential may change launch behavior.":
            "更高旋转潜力可能改变出球弹道。"
    };


    return map[text] ??
        text;
}


/**
 * ============================================================
 * Alternative Explanation
 * ============================================================
 */

function explainAlternatives(
    recommendationResult
) {
    const alternatives =
        Array.isArray(
            recommendationResult
                ?.alternatives
        )
            ? recommendationResult
                .alternatives
            : [];


    return alternatives.map(
        alternative => {

            const type =
                normalizeKey(
                    alternative.type
                );


            let titleEn =
                "Alternative";

            let titleZh =
                "备选方案";


            if (
                type ===
                "comfort_alternative"
            ) {
                titleEn =
                    "Comfort Alternative";

                titleZh =
                    "舒适型备选";
            }


            if (
                type ===
                "performance_alternative"
            ) {
                titleEn =
                    "Performance Alternative";

                titleZh =
                    "性能型备选";
            }


            if (
                type ===
                "minimal_change_alternative"
            ) {
                titleEn =
                    "Minimal Change Alternative";

                titleZh =
                    "最小改动备选";
            }


            if (
                type ===
                "value_alternative"
            ) {
                titleEn =
                    "Value Alternative";

                titleZh =
                    "性价比备选";
            }


            return {
                type,

                title: {
                    en:
                        titleEn,

                    zh:
                        titleZh
                },

                product: {
                    candidate_type:
                        alternative
                            .candidate_type ??
                        null,

                    id:
                        alternative.id ??
                        null,

                    brand:
                        alternative.brand ??
                        null,

                    model:
                        alternative.model ??
                        null
                },

                why_not_first: {
                    en:
                        alternative
                            ?.tradeoffs
                            ?.length
                            ? `This option offers a different tradeoff profile, but the primary setup remains the stronger overall balance.`
                            : `This option is valid, but the primary recommendation provides the stronger total match.`,

                    zh:
                        alternative
                            ?.tradeoffs
                            ?.length
                            ? "这个方案拥有不同的性能取舍，但首选方案在整体平衡上仍然更优。"
                            : "这个方案同样可行，但首选推荐的综合匹配度更高。"
                },

                advantages:
                    alternative
                        ?.advantages ??
                    [],

                tradeoffs:
                    alternative
                        ?.tradeoffs ??
                    []
            };
        }
    );
}


/**
 * ============================================================
 * Confidence Explanation
 * ============================================================
 */

function explainConfidence(
    confidenceResult
) {
    if (
        !confidenceResult
    ) {
        return null;
    }


    const score =
        safeNumber(
            confidenceResult.score
        );


    return {
        score,

        level:
            confidenceResult.level ??
            null,

        recommendation_mode:
            confidenceResult
                .recommendation_mode ??
            null,

        summary: {
            en:
                score !== null
                    ? `Recommendation confidence is ${score}%.`
                    : "Recommendation confidence is unavailable.",

            zh:
                score !== null
                    ? `本次推荐可信度为 ${score}%。`
                    : "目前无法计算完整推荐可信度。"
        },

        factors_increasing:
            confidenceResult
                .factors_increasing_confidence ??
            [],

        factors_reducing:
            confidenceResult
                .factors_reducing_confidence ??
            [],

        missing_information:
            confidenceResult
                ?.profile_status
                ?.missing_fields ??
            []
    };
}


/**
 * ============================================================
 * Next Step
 * ============================================================
 */

function buildNextStep(
    recommendationResult,
    confidenceResult
) {
    const score =
        safeNumber(
            confidenceResult?.score
        );


    if (
        score !== null &&
        score < 60
    ) {
        return {
            en:
                "Provide the missing high-value information before treating this as a precise final setup.",

            zh:
                "建议先补充关键缺失信息，再把当前结果作为精准最终配置。"
        };
    }


    const hours =
        recommendationResult
            ?.next_test
            ?.recommended_test_duration_hours ??
        "6-10";


    return {
        en:
            `Test the recommended setup for approximately ${hours} hours, then report control, launch, spin, comfort and stringbed changes.`,

        zh:
            `建议先实际测试约 ${hours} 小时，再反馈控制、弹道、旋转、舒适性以及线床变化。`
    };
}


/**
 * ============================================================
 * Why This Setup
 * ============================================================
 */

function buildWhyThisSetup(
    recommendationResult,
    playerProfile
) {
    const reasons = [];

    const rawReasons =
        recommendationResult
            ?.primary_reasons ??
        [];


    for (
        const reason
        of rawReasons
    ) {
        reasons.push({
            en:
                safeString(
                    reason
                ),

            zh:
                translateReason(
                    reason,
                    playerProfile
                )
        });
    }


    return reasons;
}


/**
 * ============================================================
 * Reason Translation
 * ============================================================
 */

function translateReason(
    reason,
    playerProfile
) {
    const text =
        safeString(reason);


    if (
        text.startsWith(
            "Supports primary goal:"
        )
    ) {
        const goal =
            normalizeKey(
                playerProfile
                    ?.primary_goal
            );

        return `符合你的主要目标：${
            GOAL_LABELS[goal] ??
            goal
        }。`;
    }


    const map = {
        "High physical compatibility.":
            "身体兼容性较高。",

        "Strong string alignment with player goal.":
            "球线与主要目标匹配度较高。",

        "Directly addresses current setup problems.":
            "能够直接改善目前配置存在的问题。",

        "High recommendation confidence.":
            "该推荐具有较高可信度。"
    };


    return map[text] ??
        text;
}


/**
 * ============================================================
 * Context Summary
 * ============================================================
 */

function buildPlayerContextSummary(
    playerProfile
) {
    const goal =
        normalizeKey(
            playerProfile?.primary_goal
        );

    const style =
        normalizeKey(
            playerProfile
                ?.playing_style
                ?.primary
        );

    const swing =
        normalizeKey(
            playerProfile
                ?.swing_speed
                ?.overall
        );


    return {
        primary_goal: {
            id:
                goal || null,

            zh:
                GOAL_LABELS[goal] ??
                null
        },

        playing_style: {
            id:
                style || null,

            zh:
                STYLE_LABELS[style] ??
                null
        },

        swing_speed: {
            id:
                swing || null,

            zh:
                SWING_LABELS[swing] ??
                null
        }
    };
}


/**
 * ============================================================
 * Load Explanation Knowledge
 * ============================================================
 */

async function loadExplanationKnowledge() {
    try {
        return await loadKnowledgeJson(
            "inference/decision_explanation.json"
        );
    } catch {
        return null;
    }
}


/**
 * ============================================================
 * Main Explanation Engine
 * ============================================================
 */

export async function generateExplanation(
    recommendationResult,
    playerProfile,
    confidenceResult = null
) {
    /**
     * ----------------------------------
     * STEP 1
     * Validate Profile
     * ----------------------------------
     */

    const profileValidation =
        validatePlayerProfile(
            playerProfile
        );


    if (
        !profileValidation.valid
    ) {
        throw new Error(
            "EveryCourtAI Explanation Engine: invalid player profile."
        );
    }


    /**
     * ----------------------------------
     * STEP 2
     * Validate Recommendation
     * ----------------------------------
     */

    if (
        !recommendationResult ||
        typeof recommendationResult !==
            "object"
    ) {
        throw new Error(
            "EveryCourtAI Explanation Engine: recommendationResult must be an object."
        );
    }


    /**
     * ----------------------------------
     * STEP 3
     * Load Knowledge
     * ----------------------------------
     */

    const explanationKnowledge =
        await loadExplanationKnowledge();


    /**
     * ----------------------------------
     * STEP 4
     * Build Sections
     * ----------------------------------
     */

    const summary =
        buildRecommendationSummary(
            recommendationResult,
            playerProfile
        );


    const racquetExplanation =
        explainRacquetDecision(
            recommendationResult,
            playerProfile
        );


    const stringExplanation =
        explainStringDecision(
            recommendationResult,
            playerProfile
        );


    const tensionExplanation =
        explainTension(
            recommendationResult,
            playerProfile
        );


    const physicalExplanation =
        explainPhysicalOverrides(
            playerProfile
        );


    const whyThisSetup =
        buildWhyThisSetup(
            recommendationResult,
            playerProfile
        );


    const tradeoffs =
        explainTradeoffs(
            recommendationResult
        );


    const alternatives =
        explainAlternatives(
            recommendationResult
        );


    const confidence =
        explainConfidence(
            confidenceResult
        );


    const nextStep =
        buildNextStep(
            recommendationResult,
            confidenceResult
        );


    /**
     * ----------------------------------
     * STEP 5
     * Final Output
     * ----------------------------------
     */

    return {
        engine:
            "explanation_engine",

        version:
            ENGINE_VERSION,

        generated_at:
            new Date()
                .toISOString(),

        explanation_knowledge_loaded:
            Boolean(
                explanationKnowledge
            ),

        player_context:
            buildPlayerContextSummary(
                playerProfile
            ),

        summary,

        recommendation: {
            racquet:
                racquetExplanation,

            string:
                stringExplanation,

            tension:
                tensionExplanation
        },

        why_this_setup:
            whyThisSetup,

        physical_override:
            physicalExplanation,

        tradeoffs,

        alternatives,

        confidence,

        next_step:
            nextStep,

        app_sections: [
            "summary",
            "recommended_setup",
            "why_this_setup",
            "physical_override",
            "tradeoffs",
            "alternatives",
            "confidence",
            "next_step"
        ]
    };
}


/**
 * ============================================================
 * Debug / Test Helpers
 * ============================================================
 */

export const explanationHelpers = {
    getActivePhysicalConstraints,

    buildRecommendationSummary,

    explainRacquetDecision,

    explainStringDecision,

    explainTension,

    explainPhysicalOverrides,

    explainTradeoffs,

    explainAlternatives,

    explainConfidence,

    buildNextStep,

    buildWhyThisSetup,

    buildPlayerContextSummary
};
