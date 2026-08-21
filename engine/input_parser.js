/**
 * ============================================================
 * EveryCourtAI
 * Input Parser
 * Version: 1.2
 * ============================================================
 *
 * 文件路径：
 * engine/input_parser.js
 *
 * V1.2 新增：
 * 1. 强化中文 swing_speed 识别
 * 2. 支持：
 *    - 挥拍速度中等
 *    - 挥拍中等
 *    - 中等挥拍
 *    - 速度中等
 * 3. 保留 V1.1 的球线 / 磅数 / 多轮补充能力
 *
 * ============================================================
 */

const PARSER_NAME =
    "EveryCourtAI Input Parser";

const PARSER_VERSION =
    "1.2";


/**
 * ============================================================
 * Racquet Dictionary
 * ============================================================
 */

const RACQUET_PATTERNS = [

    {
        id:
            "wilson_rf_01_pro_classic",

        brand:
            "Wilson",

        model:
            "RF 01 Pro Classic",

        patterns: [
            "wilson rf 01 pro classic",
            "rf 01 pro classic",
            "rf01 pro classic",
            "rf01pro classic"
        ]
    },

    {
        id:
            "wilson_rf_01_pro",

        brand:
            "Wilson",

        model:
            "RF 01 Pro",

        patterns: [
            "wilson rf 01 pro",
            "rf 01 pro",
            "rf01 pro"
        ]
    },

    {
        id:
            "wilson_rf_01",

        brand:
            "Wilson",

        model:
            "RF 01",

        patterns: [
            "wilson rf 01",
            "rf 01",
            "rf01"
        ]
    },

    {
        id:
            "babolat_pure_drive_spectra_edition_2026",

        brand:
            "Babolat",

        model:
            "Pure Drive Spectra Edition 2026",

        patterns: [
            "pure drive spectra edition 2026",
            "pure drive spectra",
            "babolat pure drive spectra"
        ]
    },

    {
        id:
            "babolat_pure_drive_98_2025",

        brand:
            "Babolat",

        model:
            "Pure Drive 98 2025",

        patterns: [
            "pure drive 98 2025",
            "babolat pure drive 98",
            "pure drive 98"
        ]
    },

    {
        id:
            "babolat_pure_aero_98_2026",

        brand:
            "Babolat",

        model:
            "Pure Aero 98 2026",

        patterns: [
            "pure aero 98 2026",
            "babolat pure aero 98",
            "pure aero 98"
        ]
    }

];


/**
 * ============================================================
 * String Dictionary
 * ============================================================
 */

const STRING_PATTERNS = [

    {
        id:
            "head_hawk_touch",

        brand:
            "HEAD",

        model:
            "HAWK TOUCH",

        gauge_mm:
            1.25,

        patterns: [
            "head hawk touch 1.25",
            "head hawk touch",
            "hawk touch 1.25",
            "hawk touch",
            "head hawk touch 125",
            "hawk touch 125"
        ]
    },

    {
        id:
            "wilson_natural_gut_17",

        brand:
            "Wilson",

        model:
            "Natural Gut 17",

        gauge_mm:
            1.25,

        patterns: [
            "wilson natural gut 17",
            "natural gut 17",
            "natural gut",
            "wilson natural gut",
            "牛肠 17",
            "牛肠线 17",
            "wilson 牛肠",
            "wilson牛肠"
        ]
    },

    {
        id:
            "wilson_revolve_17",

        brand:
            "Wilson",

        model:
            "Revolve 17",

        gauge_mm:
            1.25,

        patterns: [
            "wilson revolve 17",
            "revolve 17",
            "wilson revolve",
            "revolve"
        ]
    },

    {
        id:
            "wilson_revolve_spin_17",

        brand:
            "Wilson",

        model:
            "Revolve Spin 17",

        gauge_mm:
            1.25,

        patterns: [
            "wilson revolve spin 17",
            "revolve spin 17",
            "revolve spin"
        ]
    },

    {
        id:
            "babolat_rpm_blast_125",

        brand:
            "Babolat",

        model:
            "RPM Blast 1.25",

        gauge_mm:
            1.25,

        patterns: [
            "babolat rpm blast 1.25",
            "rpm blast 1.25",
            "rpm blast 125",
            "rpm blast"
        ]
    },

    {
        id:
            "luxilon_alu_power_125",

        brand:
            "Luxilon",

        model:
            "ALU Power 1.25",

        gauge_mm:
            1.25,

        patterns: [
            "luxilon alu power 1.25",
            "alu power 1.25",
            "alu power 125",
            "alu power"
        ]
    },

    {
        id:
            "solinco_hyper_g_125",

        brand:
            "Solinco",

        model:
            "Hyper-G 1.25",

        gauge_mm:
            1.25,

        patterns: [
            "solinco hyper-g 1.25",
            "solinco hyper g 1.25",
            "hyper-g 1.25",
            "hyper g 1.25",
            "hyper-g",
            "hyper g"
        ]
    },

    {
        id:
            "yonex_poly_tour_pro_125",

        brand:
            "Yonex",

        model:
            "Poly Tour Pro 1.25",

        gauge_mm:
            1.25,

        patterns: [
            "yonex poly tour pro 1.25",
            "poly tour pro 1.25",
            "poly tour pro"
        ]
    }

];


/**
 * ============================================================
 * Main Parser
 * ============================================================
 */

export function parsePlayerInput(
    message
) {

    const originalMessage =
        typeof message ===
            "string"
            ? message.trim()
            : "";


    const normalizedMessage =
        normalizeText(
            originalMessage
        );


    const currentRacquet =
        detectRacquet(
            normalizedMessage
        );


    const currentString =
        detectString(
            normalizedMessage
        );


    const currentTension =
        detectTension(
            originalMessage
        );


    const primaryGoal =
        detectPrimaryGoal(
            normalizedMessage
        );


    const playingStyle =
        detectPlayingStyle(
            normalizedMessage
        );


    const swingSpeed =
        detectSwingSpeed(
            normalizedMessage
        );


    const feelPreference =
        detectFeelPreference(
            normalizedMessage
        );


    const physical =
        detectPhysicalConstraints(
            normalizedMessage
        );


    const playerInput = {

        current_racquet:
            currentRacquet,

        current_string:
            currentString,

        current_tension:
            currentTension,

        primary_goal:
            primaryGoal,

        playing_style:
            playingStyle,

        swing_speed:
            swingSpeed,

        feel_preference:
            feelPreference,

        physical
    };


    const missingFields =
        detectMissingFields(
            playerInput
        );


    return {

        success:
            true,

        parser: {

            name:
                PARSER_NAME,

            version:
                PARSER_VERSION,

            mode:
                "rule_based"
        },

        original_message:
            originalMessage,

        player_input:
            playerInput,

        missing_fields:
            missingFields,

        requires_follow_up:
            missingFields.length >
            0
    };
}


/**
 * ============================================================
 * Detect Racquet
 * ============================================================
 */

function detectRacquet(
    message
) {

    const sortedPatterns =
        [...RACQUET_PATTERNS]
            .sort(
                (
                    a,
                    b
                ) =>
                    longestPatternLength(
                        b.patterns
                    ) -
                    longestPatternLength(
                        a.patterns
                    )
            );


    for (
        const racquet
        of sortedPatterns
    ) {

        const patterns =
            [...racquet.patterns]
                .sort(
                    (
                        a,
                        b
                    ) =>
                        b.length -
                        a.length
                );


        for (
            const pattern
            of patterns
        ) {

            if (
                message.includes(
                    normalizeText(
                        pattern
                    )
                )
            ) {

                return {

                    id:
                        racquet.id,

                    brand:
                        racquet.brand,

                    model:
                        racquet.model
                };
            }
        }
    }


    return null;
}


/**
 * ============================================================
 * Detect String
 * ============================================================
 */

function detectString(
    message
) {

    const candidates =
        [];


    for (
        const stringItem
        of STRING_PATTERNS
    ) {

        for (
            const pattern
            of stringItem.patterns
        ) {

            const normalizedPattern =
                normalizeText(
                    pattern
                );


            if (
                message.includes(
                    normalizedPattern
                )
            ) {

                candidates.push({

                    item:
                        stringItem,

                    matchedPattern:
                        normalizedPattern,

                    score:
                        normalizedPattern.length
                });
            }
        }
    }


    if (
        candidates.length ===
        0
    ) {

        return null;
    }


    candidates.sort(
        (
            a,
            b
        ) =>
            b.score -
            a.score
    );


    const best =
        candidates[0]
            .item;


    return {

        id:
            best.id,

        brand:
            best.brand,

        model:
            best.model,

        gauge_mm:
            best.gauge_mm ??
            null
    };
}


/**
 * ============================================================
 * Detect Tension
 * ============================================================
 */

function detectTension(
    message
) {

    if (
        typeof message !==
        "string"
    ) {

        return null;
    }


    const text =
        message
            .toLowerCase()
            .trim();


    /**
     * Pounds
     */

    const poundsMatch =
        text.match(
            /(\d{1,2}(?:\.\d+)?)\s*(?:磅|lbs?|pounds?)/i
        );


    if (
        poundsMatch
    ) {

        const value =
            Number(
                poundsMatch[1]
            );


        if (
            isReasonableTensionLbs(
                value
            )
        ) {

            return roundTension(
                value
            );
        }
    }


    /**
     * Kilograms
     */

    const kgMatch =
        text.match(
            /(\d{1,2}(?:\.\d+)?)\s*(?:kg|公斤|千克)/i
        );


    if (
        kgMatch
    ) {

        const kg =
            Number(
                kgMatch[1]
            );


        if (
            Number.isFinite(
                kg
            ) &&
            kg >=
                10 &&
            kg <=
                40
        ) {

            const lbs =
                kg *
                2.2046226218;


            return roundTension(
                lbs
            );
        }
    }


    return null;
}


/**
 * ============================================================
 * Primary Goal
 * ============================================================
 */

function detectPrimaryGoal(
    message
) {

    const comfortPatterns = [

        "more comfort",
        "more comfortable",
        "comfort",
        "comfortable",

        "更舒服",
        "舒服一点",
        "更舒适",
        "舒适一点",
        "提高舒适",
        "增加舒适",
        "减少疲劳",
        "不那么累",
        "容易累",
        "有点累"
    ];


    if (
        includesAny(
            message,
            comfortPatterns
        )
    ) {

        return "more_comfort";
    }


    const controlPatterns = [

        "more control",
        "better control",
        "control",

        "更多控制",
        "更好控制",
        "提高控制",
        "加强控制",
        "更精准",
        "精准一点"
    ];


    if (
        includesAny(
            message,
            controlPatterns
        )
    ) {

        return "more_control";
    }


    const spinPatterns = [

        "more spin",
        "spin",

        "更多旋转",
        "增加旋转",
        "加强旋转",
        "旋转更多"
    ];


    if (
        includesAny(
            message,
            spinPatterns
        )
    ) {

        return "more_spin";
    }


    const powerPatterns = [

        "more power",
        "power",
        "easy power",
        "easier power",
        "more depth",
        "easier depth",

        "更多力量",
        "更有力量",
        "增加力量",
        "增加一些力量",
        "轻松的力量",
        "轻松力量",
        "更轻松的力量",
        "更容易借力",
        "更容易发力",
        "更容易打深",
        "球更容易打深",
        "打得更深",
        "增加深度",
        "更省力",
        "省力一点",
        "出球更轻松",
        "更容易出球"
    ];


    if (
        includesAny(
            message,
            powerPatterns
        )
    ) {

        return "more_power";
    }


    return null;
}


/**
 * ============================================================
 * Playing Style
 * ============================================================
 */

function detectPlayingStyle(
    message
) {

    if (
        includesAny(
            message,
            [
                "all court",
                "all-court",

                "全场型",
                "全场打法",
                "打法偏全场",
                "偏全场型"
            ]
        )
    ) {

        return "all_court";
    }


    if (
        includesAny(
            message,
            [
                "baseline",
                "baseliner",

                "底线型",
                "底线打法",
                "底线球员",
                "偏底线"
            ]
        )
    ) {

        return "baseline";
    }


    if (
        includesAny(
            message,
            [
                "serve and volley",
                "serve-and-volley",

                "发球上网",
                "上网型"
            ]
        )
    ) {

        return "serve_volley";
    }


    if (
        includesAny(
            message,
            [
                "aggressive",

                "进攻型",
                "攻击型"
            ]
        )
    ) {

        return "aggressive";
    }


    return null;
}


/**
 * ============================================================
 * Swing Speed
 * ============================================================
 *
 * V1.2 重点升级区域。
 * ============================================================
 */

function detectSwingSpeed(
    message
) {

    /**
     * Fast
     */

    if (
        includesAny(
            message,
            [
                "fast swing",
                "high swing speed",
                "swing speed fast",

                "挥拍快",
                "挥速快",
                "快速挥拍",
                "挥拍速度快",
                "挥拍速度很快",
                "挥拍较快",
                "速度快"
            ]
        )
    ) {

        return "fast";
    }


    /**
     * Medium
     */

    if (
        includesAny(
            message,
            [
                "medium swing",
                "medium swing speed",
                "moderate swing",
                "moderate swing speed",

                "中速挥拍",
                "中等挥拍",
                "挥拍中等",
                "挥拍速度中等",
                "挥拍速度适中",
                "挥拍速度一般",
                "挥速中等",
                "中等挥速",
                "中等速度",
                "速度中等",
                "速度适中",
                "挥拍适中"
            ]
        )
    ) {

        return "medium";
    }


    /**
     * Slow
     */

    if (
        includesAny(
            message,
            [
                "slow swing",
                "low swing speed",
                "swing speed slow",

                "挥拍慢",
                "挥速慢",
                "慢速挥拍",
                "挥拍速度慢",
                "挥拍较慢",
                "速度慢"
            ]
        )
    ) {

        return "slow";
    }


    return null;
}


/**
 * ============================================================
 * Feel Preference
 * ============================================================
 */

function detectFeelPreference(
    message
) {

    if (
        includesAny(
            message,
            [
                "connected feel",
                "connected",

                "直接感",
                "连接感",
                "扎实感"
            ]
        )
    ) {

        return "connected";
    }


    if (
        includesAny(
            message,
            [
                "soft feel",
                "softer feel",

                "柔和手感",
                "更柔和",
                "柔软手感"
            ]
        )
    ) {

        return "soft";
    }


    if (
        includesAny(
            message,
            [
                "crisp feel",
                "crisp",

                "清脆手感",
                "清脆"
            ]
        )
    ) {

        return "crisp";
    }


    if (
        includesAny(
            message,
            [
                "muted feel",
                "muted",

                "减震感",
                "柔化反馈"
            ]
        )
    ) {

        return "muted";
    }


    return null;
}


/**
 * ============================================================
 * Physical Constraints
 * ============================================================
 */

function detectPhysicalConstraints(
    message
) {

    const physical =
        {};


    /**
     * Shoulder
     */

    if (
        includesAny(
            message,
            [
                "shoulder",
                "肩膀",
                "肩部"
            ]
        )
    ) {

        physical.shoulder = {

            active:
                true,

            severity:
                detectSeverity(
                    message
                )
        };
    }


    /**
     * Elbow
     */

    if (
        includesAny(
            message,
            [
                "elbow",
                "tennis elbow",
                "肘",
                "手肘",
                "网球肘"
            ]
        )
    ) {

        physical.elbow = {

            active:
                true,

            severity:
                detectSeverity(
                    message
                )
        };
    }


    /**
     * Wrist
     */

    if (
        includesAny(
            message,
            [
                "wrist",
                "手腕",
                "腕部"
            ]
        )
    ) {

        physical.wrist = {

            active:
                true,

            severity:
                detectSeverity(
                    message
                )
        };
    }


    /**
     * Lower Back
     */

    if (
        includesAny(
            message,
            [
                "lower back",
                "back pain",
                "腰",
                "腰部",
                "下背"
            ]
        )
    ) {

        physical.lower_back = {

            active:
                true,

            severity:
                detectSeverity(
                    message
                )
        };
    }


    /**
     * Knee
     */

    if (
        includesAny(
            message,
            [
                "knee",
                "膝盖",
                "膝部"
            ]
        )
    ) {

        physical.knee = {

            active:
                true,

            severity:
                detectSeverity(
                    message
                )
        };
    }


    return physical;
}


/**
 * ============================================================
 * Severity
 * ============================================================
 */

function detectSeverity(
    message
) {

    if (
        includesAny(
            message,
            [
                "severe",
                "very painful",
                "very bad",

                "严重",
                "很痛",
                "非常痛"
            ]
        )
    ) {

        return "severe";
    }


    if (
        includesAny(
            message,
            [
                "moderate",
                "medium pain",

                "明显疼",
                "比较疼",
                "中度"
            ]
        )
    ) {

        return "moderate";
    }


    return "mild";
}


/**
 * ============================================================
 * Missing Fields
 * ============================================================
 */

function detectMissingFields(
    playerInput
) {

    const missing =
        [];


    if (
        !playerInput
            .current_racquet
    ) {

        missing.push(
            "current_racquet"
        );
    }


    if (
        !playerInput
            .primary_goal
    ) {

        missing.push(
            "primary_goal"
        );
    }


    if (
        !playerInput
            .playing_style
    ) {

        missing.push(
            "playing_style"
        );
    }


    if (
        !playerInput
            .swing_speed
    ) {

        missing.push(
            "swing_speed"
        );
    }


    if (
        !playerInput
            .feel_preference
    ) {

        missing.push(
            "feel_preference"
        );
    }


    return missing;
}


/**
 * ============================================================
 * Helpers
 * ============================================================
 */

function normalizeText(
    value
) {

    if (
        typeof value !==
        "string"
    ) {

        return "";
    }


    return value
        .toLowerCase()
        .replace(
            /[，。！？、；：,.!?;:()[\]{}]/g,
            " "
        )
        /**
         * Remove accidental spaces between Chinese characters.
         *
         * Examples:
         * "希 望增加力量" -> "希望增加力量"
         * "更 舒服" -> "更舒服"
         */
        .replace(
            /([\u4e00-\u9fff])\s+(?=[\u4e00-\u9fff])/g,
            "$1"
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim();
}


function includesAny(
    message,
    patterns
) {

    return patterns.some(
        pattern =>
            message.includes(
                normalizeText(
                    pattern
                )
            )
    );
}


function longestPatternLength(
    patterns = []
) {

    if (
        !Array.isArray(
            patterns
        ) ||
        patterns.length ===
            0
    ) {

        return 0;
    }


    return Math.max(
        ...patterns.map(
            item =>
                String(
                    item
                )
                    .length
        )
    );
}


function isReasonableTensionLbs(
    value
) {

    return (
        Number.isFinite(
            value
        ) &&
        value >=
            25 &&
        value <=
            80
    );
}


function roundTension(
    value
) {

    return (
        Math.round(
            value *
            10
        ) /
        10
    );
}


/**
 * ============================================================
 * Parser Info
 * ============================================================
 */

export function getInputParserInfo() {

    return {

        name:
            PARSER_NAME,

        version:
            PARSER_VERSION,

        mode:
            "rule_based",

        capabilities: [

            "racquet_recognition",

            "string_recognition",

            "tension_recognition",

            "goal_recognition",

            "playing_style_recognition",

            "swing_speed_recognition",

            "feel_recognition",

            "physical_constraint_recognition",

            "chinese_input",

            "english_input",

            "multi_turn_supplement_input",

            "chinese_medium_swing_recognition"
        ]
    };
}