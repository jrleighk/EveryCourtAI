/**
 * ============================================================
 * EveryCourtAI
 * Theme Manager
 * Version: 1.0
 * ============================================================
 *
 * 文件路径：
 * scripts/theme_manager.js
 *
 * 作用：
 * 1. 管理 EveryCourtAI Court Themes
 * 2. 支持 Grass / Clay / Hard
 * 3. 自动记忆用户选择
 * 4. 自动恢复上次主题
 * 5. 动态更新 Theme Button 状态
 * 6. 为未来 Night / RF / Laver Cup 等主题预留接口
 *
 * ============================================================
 */


/**
 * ============================================================
 * 基础配置
 * ============================================================
 */

const THEME_STORAGE_KEY =
    "everycourt-theme";

const DEFAULT_THEME =
    "grass";


/**
 * ============================================================
 * 支持主题
 * ============================================================
 */

export const SUPPORTED_THEMES = {
    grass: {
        code: "grass",
        label: "Grass",

        colors: {
            background: "#102A24",
            background_soft: "#15362F",
            card: "#18342E",
            card_strong: "#1F443B",
            primary: "#47C77A",
            primary_strong: "#31AC64",
            accent: "#D9FF3F"
        }
    },

    clay: {
        code: "clay",
        label: "Clay",

        colors: {
            background: "#8E452B",
            background_soft: "#9D5032",
            card: "#A45738",
            card_strong: "#B76745",
            primary: "#FF9D62",
            primary_strong: "#EF7D3C",
            accent: "#FFE1B8"
        }
    },

    hard: {
        code: "hard",
        label: "Hard",

        colors: {
            background: "#0D355F",
            background_soft: "#123F6C",
            card: "#164B79",
            card_strong: "#1C5A8E",
            primary: "#40A8FF",
            primary_strong: "#278FE4",
            accent: "#D7F5FF"
        }
    }
};


/**
 * ============================================================
 * 内部状态
 * ============================================================
 */

let currentTheme =
    DEFAULT_THEME;


/**
 * ============================================================
 * 通用工具
 * ============================================================
 */

function normalizeThemeCode(
    themeCode
) {
    if (
        !themeCode ||
        typeof themeCode !== "string"
    ) {
        return DEFAULT_THEME;
    }

    return themeCode
        .trim()
        .toLowerCase();
}


/**
 * ============================================================
 * 获取初始主题
 * ============================================================
 */

function getInitialTheme() {
    const savedTheme =
        localStorage.getItem(
            THEME_STORAGE_KEY
        );

    if (
        savedTheme &&
        SUPPORTED_THEMES[
            savedTheme
        ]
    ) {
        return savedTheme;
    }

    return DEFAULT_THEME;
}


/**
 * ============================================================
 * 更新 Body Theme
 * ============================================================
 */

function updateBodyTheme(
    themeCode
) {
    document.body.dataset.theme =
        themeCode;

    document.documentElement.dataset.theme =
        themeCode;
}


/**
 * ============================================================
 * 更新按钮状态
 *
 * HTML：
 *
 * data-theme-button="grass"
 * data-theme-button="clay"
 * data-theme-button="hard"
 * ============================================================
 */

function updateThemeButtonState(
    themeCode
) {
    const buttons =
        document.querySelectorAll(
            "[data-theme-button]"
        );

    buttons.forEach(
        button => {

            const buttonTheme =
                button.getAttribute(
                    "data-theme-button"
                );

            button.classList.toggle(
                "active",
                buttonTheme ===
                    themeCode
            );

            /**
             * Accessibility
             */

            button.setAttribute(
                "aria-pressed",
                buttonTheme === themeCode
                    ? "true"
                    : "false"
            );
        }
    );


    /**
     * 当前主题显示
     *
     * HTML:
     *
     * data-current-theme
     */

    const currentThemeLabels =
        document.querySelectorAll(
            "[data-current-theme]"
        );

    const label =
        SUPPORTED_THEMES[
            themeCode
        ]?.label ??
        themeCode;


    currentThemeLabels.forEach(
        element => {

            element.textContent =
                label;
        }
    );
}


/**
 * ============================================================
 * 应用 Theme CSS Variables
 *
 * 当前 index.html 已经通过：
 *
 * body[data-theme="clay"]
 * body[data-theme="hard"]
 *
 * 控制颜色。
 *
 * 此函数为未来 Theme 扩展预留。
 * ============================================================
 */

function applyThemeVariables(
    themeCode
) {
    const theme =
        SUPPORTED_THEMES[
            themeCode
        ];

    if (!theme) {
        return;
    }

    /**
     * 当前 V1 暂时不覆盖 CSS Variables，
     * 因为 index.html 已定义主题 CSS。
     *
     * 后续拆分 theme.css 时，
     * 可以在这里动态设置：
     *
     * document.documentElement.style.setProperty(...)
     */
}


/**
 * ============================================================
 * Theme Change Event
 * ============================================================
 */

function dispatchThemeChange(
    themeCode
) {
    const theme =
        SUPPORTED_THEMES[
            themeCode
        ];

    window.dispatchEvent(
        new CustomEvent(
            "everycourt:theme-change",
            {
                detail: {
                    theme:
                        themeCode,

                    config:
                        theme
                }
            }
        )
    );
}


/**
 * ============================================================
 * 设置 Theme
 * ============================================================
 */

export function setTheme(
    themeCode,
    {
        savePreference = true
    } = {}
) {
    const normalized =
        normalizeThemeCode(
            themeCode
        );


    const finalTheme =
        SUPPORTED_THEMES[
            normalized
        ]
            ? normalized
            : DEFAULT_THEME;


    currentTheme =
        finalTheme;


    /**
     * ----------------------------------
     * Apply
     * ----------------------------------
     */

    updateBodyTheme(
        finalTheme
    );

    applyThemeVariables(
        finalTheme
    );

    updateThemeButtonState(
        finalTheme
    );


    /**
     * ----------------------------------
     * Save
     * ----------------------------------
     */

    if (
        savePreference
    ) {
        localStorage.setItem(
            THEME_STORAGE_KEY,
            finalTheme
        );
    }


    /**
     * ----------------------------------
     * Event
     * ----------------------------------
     */

    dispatchThemeChange(
        finalTheme
    );


    return {
        success: true,

        theme:
            finalTheme,

        config:
            SUPPORTED_THEMES[
                finalTheme
            ]
    };
}


/**
 * ============================================================
 * 获取当前主题
 * ============================================================
 */

export function getCurrentTheme() {
    return currentTheme;
}


/**
 * ============================================================
 * 获取当前 Theme Config
 * ============================================================
 */

export function getCurrentThemeConfig() {
    return (
        SUPPORTED_THEMES[
            currentTheme
        ] ??
        SUPPORTED_THEMES[
            DEFAULT_THEME
        ]
    );
}


/**
 * ============================================================
 * 判断 Theme 是否支持
 * ============================================================
 */

export function isThemeSupported(
    themeCode
) {
    const normalized =
        normalizeThemeCode(
            themeCode
        );

    return Boolean(
        SUPPORTED_THEMES[
            normalized
        ]
    );
}


/**
 * ============================================================
 * 注册未来新 Theme
 *
 * 以后例如：
 *
 * registerTheme(
 *   "night",
 *   {
 *     label: "Night",
 *     colors: {...}
 *   }
 * )
 *
 * ============================================================
 */

export function registerTheme(
    themeCode,
    configuration
) {
    const normalized =
        normalizeThemeCode(
            themeCode
        );


    if (
        !normalized ||
        !configuration ||
        typeof configuration !== "object"
    ) {
        return {
            success: false,
            error:
                "Invalid theme configuration."
        };
    }


    SUPPORTED_THEMES[
        normalized
    ] = {
        code:
            normalized,

        label:
            configuration.label ??
            normalized,

        colors:
            configuration.colors ??
            {}
    };


    return {
        success: true,

        theme:
            normalized,

        config:
            SUPPORTED_THEMES[
                normalized
            ]
    };
}


/**
 * ============================================================
 * 初始化 Theme Manager
 * ============================================================
 */

export function initializeThemeManager() {
    const initialTheme =
        getInitialTheme();


    /**
     * ----------------------------------
     * 给 Theme Buttons 自动绑定
     * ----------------------------------
     */

    document
        .querySelectorAll(
            "[data-theme-button]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const theme =
                            button.getAttribute(
                                "data-theme-button"
                            );


                        if (
                            theme
                        ) {
                            setTheme(
                                theme
                            );
                        }
                    }
                );
            }
        );


    /**
     * ----------------------------------
     * Initialize
     * ----------------------------------
     */

    return setTheme(
        initialTheme,
        {
            savePreference:
                false
        }
    );
}


/**
 * ============================================================
 * 自动初始化
 *
 * HTML:
 *
 * <script
 *   type="module"
 *   src="scripts/theme_manager.js">
 * </script>
 *
 * ============================================================
 */

if (
    document.readyState ===
    "loading"
) {
    document.addEventListener(
        "DOMContentLoaded",
        () => {

            initializeThemeManager();

        }
    );

} else {

    initializeThemeManager();

}


/**
 * ============================================================
 * 全局接口
 *
 * Browser Console:
 *
 * EveryCourtTheme.setTheme("clay")
 * EveryCourtTheme.getCurrentTheme()
 *
 * ============================================================
 */

window.EveryCourtTheme = {
    setTheme,
    getCurrentTheme,
    getCurrentThemeConfig,
    isThemeSupported,
    registerTheme,
    supportedThemes:
        SUPPORTED_THEMES
};
