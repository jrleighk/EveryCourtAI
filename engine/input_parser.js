/**
 * ============================================================
 * EveryCourtAI
 * Natural Language Input Parser
 * Version: 1.0
 * ============================================================
 *
 * 文件路径：
 * engine/input_parser.js
 *
 * 功能：
 * 将用户自然语言转换为 EveryCourtAI Engine 可以理解的
 * player_input 结构。
 *
 * 第一阶段：
 * - 不依赖 OpenRouter
 * - 不依赖外部 AI
 * - 使用确定性规则解析
 * - 支持中文 / 英文
 *
 * 后续阶段：
 * - 接入 OpenRouter
 * - AI 语义解析
 * - 多轮对话补充资料
 * - Product Lookup 自动产品识别
 * ============================================================
 */


/**
 * ------------------------------------------------------------
 * 基础工具
 * ------------------------------------------------------------
 */

function normalizeText(value) {
    if (typeof value !== "string") {
        return "";
    }

    return value
        .trim()
        .toLowerCase()
        .replace(/[’']/g, "")
        .replace(/\s+/g, " ");
}


function includesAny(text, keywords = []) {
    return keywords.some((keyword) =>
        text.includes(normalizeText(keyword))
    );
}


/**
 * ------------------------------------------------------------
 * 球拍识别
 * ------------------------------------------------------------
 *
 * 第一版先覆盖当前测试最重要的型号。
 * 后续会改成直接读取 product_lookup.json。
 * ------------------------------------------------------------
 */

const RACQUET_RULES = [

    {
        id: "wilson_rf_01_pro_classic",
        brand: "Wilson",
        model: "RF 01 Pro Classic",
        keywords: [
            "wilson rf 01 pro classic",
            "rf 01 pro classic",
            "rf01 pro classic",
            "rf01 classic",
            "rf 01 classic"
        ]
    },

    {
        id: "wilson_rf_01_pro",
        brand: "Wilson",
        model: "RF 01 Pro",
        keywords: [
            "wilson rf 01 pro",
            "rf 01 pro",
            "rf01 pro"
        ]
    },

    {
        id: "wilson_rf_01_2024",
        brand: "Wilson",
        model: "RF 01",
        keywords: [
            "wilson rf 01",
            "rf 01",
            "rf01"
        ]
    },

    {
        id: "babolat_pure_drive_spectra_edition_2026",
        brand: "Babolat",
        model: "Pure Drive Spectra Edition 2026",
        keywords: [
            "pure drive spectra",
            "pure drive spectra edition",
            "babolat pure drive spectra",
            "pd spectra"
        ]
    },

    {
        id: "babolat_pure_drive_98_2025",
        brand: "Babolat",
        model: "Pure Drive 98 2025",
        keywords: [
            "pure drive 98",
            "babolat pure drive 98"
        ]
    },

    {
        id: "head_speed_mp_2026",
        brand: "HEAD",
        model: "Speed MP 2026",
        keywords: [
            "head speed mp",
            "speed mp 2026",
            "speed mp"
        ]
    }

];


/**
 * ------------------------------------------------------------
 * 当前球拍解析
 * ------------------------------------------------------------
 */

function detectCurrentRacquet(text) {

    for (const racquet of RACQUET_RULES) {

        if (includesAny(text, racquet.keywords)) {

            return {
                id: racquet.id,
                brand: racquet.brand,
                model: racquet.model
            };

        }

    }

    return null;
}


/**
 * ------------------------------------------------------------
 * Primary Goal
 * 主要目标解析
 * ------------------------------------------------------------
 */

function detectPrimaryGoal(text) {

    /*
     * 舒适性优先
     */

    if (
        includesAny(text, [
            "more comfort",
            "more comfortable",
            "comfort",
            "less harsh",
            "softer",
            "less fatigue",
            "fatigue",
            "舒服",
            "舒适",
            "更舒服",
            "减少疲劳",
            "容易累",
            "打久了累",
            "手臂累",
            "肩膀累"
        ])
    ) {
        return "more_comfort";
    }


    /*
     * 控制
     */

    if (
        includesAny(text, [
            "more control",
            "better control",
            "control",
            "precision",
            "精准",
            "控制",
            "更多控制",
            "提高控制"
        ])
    ) {
        return "more_control";
    }


    /*
     * 旋转
     */

    if (
        includesAny(text, [
            "more spin",
            "spin",
            "topspin",
            "旋转",
            "上旋",
            "更多旋转"
        ])
    ) {
        return "more_spin";
    }


    /*
     * 力量
     */

    if (
        includesAny(text, [
            "more power",
            "power",
            "easy power",
            "力量",
            "借力",
            "更有力量",
            "增加力量"
        ])
    ) {
        return "more_power";
    }


    return null;
}


/**
 * ------------------------------------------------------------
 * Playing Style
 * 打法类型
 * ------------------------------------------------------------
 */

function detectPlayingStyle(text) {

    if (
        includesAny(text, [
            "all court",
            "all-court",
            "全场型",
            "全场打法"
        ])
    ) {
        return "all_court";
    }


    if (
        includesAny(text, [
            "baseline",
            "baseliner",
            "底线",
            "底线型"
        ])
    ) {
        return "baseline";
    }


    if (
        includesAny(text, [
            "serve and volley",
            "serve-and-volley",
            "发球上网",
            "上网型"
        ])
    ) {
        return "serve_volley";
    }


    if (
        includesAny(text, [
            "aggressive",
            "attacking",
            "攻击型",
            "进攻型"
        ])
    ) {
        return "aggressive";
    }


    return null;
}


/**
 * ------------------------------------------------------------
 * Swing Speed
 * 挥拍速度
 * ------------------------------------------------------------
 */

function detectSwingSpeed(text) {

    if (
        includesAny(text, [
            "fast swing",
            "fast swing speed",
            "快速挥拍",
            "挥拍快"
        ])
    ) {
        return "fast";
    }


    if (
        includesAny(text, [
            "medium swing",
            "medium swing speed",
            "moderate swing",
            "中速挥拍",
            "挥拍中等"
        ])
    ) {
        return "medium";
    }


    if (
        includesAny(text, [
            "slow swing",
            "slow swing speed",
            "挥拍慢",
            "慢速挥拍"
        ])
    ) {
        return "slow";
    }


    return null;
}


/**
 * ------------------------------------------------------------
 * Feel Preference
 * 手感偏好
 * ------------------------------------------------------------
 */

function detectFeelPreference(text) {

    if (
        includesAny(text, [
            "connected feel",
            "connected",
            "direct feel",
            "直接手感",
            "连接感",
            "扎实手感"
        ])
    ) {
        return "connected";
    }


    if (
        includesAny(text, [
            "soft feel",
            "plush feel",
            "柔软手感",
            "柔和手感"
        ])
    ) {
        return "soft";
    }


    if (
        includesAny(text, [
            "crisp feel",
            "crisp",
            "清脆",
            "脆"
        ])
    ) {
        return "crisp";
    }


    return null;
}


/**
 * ------------------------------------------------------------
 * Physical Constraints
 * 身体限制
 * ------------------------------------------------------------
 */

function detectPhysical(text) {

    const physical = {};


    /*
     * 肩部
     */

    if (
        includesAny(text, [
    "shoulder pain",
    "shoulder discomfort",
    "shoulder fatigue",
    "shoulder sensitive",
    "shoulder sensitivity",
    "shoulder tired",

    "肩膀痛",
    "肩痛",
    "肩膀不舒服",
    "肩部不适",
    "肩膀累",
    "肩膀有点累",
    "肩部疲劳",
    "肩膀疲劳",
    "打久了肩膀累",
    "打久了肩膀有点累",
    "肩部敏感"
])
    ) {

        physical.shoulder = {
            active: true,
            severity: "mild"
        };

    }


    /*
     * 手肘
     */

    if (
        includesAny(text, [
            "elbow pain",
            "elbow discomfort",
            "tennis elbow",
            "elbow sensitive",
            "elbow sensitivity",
            "手肘痛",
            "肘痛",
            "网球肘",
            "手肘不舒服",
            "肘部敏感"
        ])
    ) {

        physical.elbow = {
            active: true,
            severity: "mild"
        };

    }


    /*
     * 手腕
     */

    if (
        includesAny(text, [
            "wrist pain",
            "wrist discomfort",
            "wrist sensitive",
            "wrist sensitivity",
            "手腕痛",
            "腕痛",
            "手腕不舒服",
            "手腕敏感"
        ])
    ) {

        physical.wrist = {
            active: true,
            severity: "mild"
        };

    }


    /*
     * 下背
     */

    if (
        includesAny(text, [
            "lower back pain",
            "lower back discomfort",
            "lower back sensitive",
            "腰痛",
            "腰部不适",
            "下背痛",
            "下背部敏感"
        ])
    ) {

        physical.lower_back = {
            active: true,
            severity: "mild"
        };

    }


    /*
     * 膝盖
     */

    if (
        includesAny(text, [
            "knee pain",
            "knee discomfort",
            "knee sensitive",
            "膝盖痛",
            "膝痛",
            "膝盖不舒服",
            "膝盖敏感"
        ])
    ) {

        physical.knee = {
            active: true,
            severity: "mild"
        };

    }


    /*
     * 脚踝
     */

    if (
        includesAny(text, [
            "ankle pain",
            "ankle discomfort",
            "ankle sensitive",
            "脚踝痛",
            "脚踝不舒服",
            "脚踝敏感"
        ])
    ) {

        physical.ankle = {
            active: true,
            severity: "mild"
        };

    }


    /*
     * 颈部
     */

    if (
        includesAny(text, [
            "neck pain",
            "neck discomfort",
            "neck sensitive",
            "颈部痛",
            "脖子痛",
            "颈部不适",
            "颈部敏感"
        ])
    ) {

        physical.neck = {
            active: true,
            severity: "mild"
        };

    }


    return physical;
}


/**
 * ------------------------------------------------------------
 * 严重程度
 * ------------------------------------------------------------
 */

function detectSeverity(text) {

    if (
        includesAny(text, [
            "severe",
            "very painful",
            "serious pain",
            "严重",
            "很痛",
            "非常痛"
        ])
    ) {
        return "severe";
    }


    if (
        includesAny(text, [
            "moderate",
            "moderately",
            "中等",
            "比较明显"
        ])
    ) {
        return "moderate";
    }


    return "mild";
}


/**
 * ------------------------------------------------------------
 * 将严重程度应用到身体限制
 * ------------------------------------------------------------
 */

function applyPhysicalSeverity(physical, text) {

    const severity = detectSeverity(text);

    for (const key of Object.keys(physical)) {

        physical[key].severity = severity;

    }

    return physical;
}


/**
 * ------------------------------------------------------------
 * Missing Fields
 * 缺失资料
 * ------------------------------------------------------------
 */

function detectMissingFields(playerInput) {

    const missing = [];


    if (!playerInput.current_racquet) {
        missing.push("current_racquet");
    }


    if (!playerInput.primary_goal) {
        missing.push("primary_goal");
    }


    if (!playerInput.playing_style) {
        missing.push("playing_style");
    }


    if (!playerInput.swing_speed) {
        missing.push("swing_speed");
    }


    if (!playerInput.feel_preference) {
        missing.push("feel_preference");
    }


    return missing;
}


/**
 * ------------------------------------------------------------
 * Parser 主函数
 * ------------------------------------------------------------
 */

export function parsePlayerInput(message) {

    if (
        typeof message !== "string" ||
        message.trim().length === 0
    ) {

        return {
            success: false,

            error: {
                type: "validation",
                message: "message must be a non-empty string."
            },

            player_input: null,

            missing_fields: []
        };

    }


    const text = normalizeText(message);


    let physical = detectPhysical(text);

    physical = applyPhysicalSeverity(
        physical,
        text
    );


    const playerInput = {

        current_racquet:
            detectCurrentRacquet(text),

        primary_goal:
            detectPrimaryGoal(text),

        playing_style:
            detectPlayingStyle(text),

        swing_speed:
            detectSwingSpeed(text),

        feel_preference:
            detectFeelPreference(text),

        physical
    };


    const missingFields =
        detectMissingFields(playerInput);


    return {

        success: true,

        parser: {
            name: "EveryCourtAI Input Parser",
            version: "1.0",
            mode: "rule_based"
        },

        original_message: message,

        player_input: playerInput,

        missing_fields: missingFields,

        requires_follow_up:
            missingFields.length > 0
    };

}


/**
 * ------------------------------------------------------------
 * 默认导出
 * ------------------------------------------------------------
 */

export default {
    parsePlayerInput
};