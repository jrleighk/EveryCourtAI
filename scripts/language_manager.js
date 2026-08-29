/**
 * ============================================================
 * EveryCourtAI
 * Language Manager
 * Version: 1.0
 * ============================================================
 *
 * 文件路径：
 * scripts/language_manager.js
 *
 * 作用：
 * 1. 管理网站多语言
 * 2. 加载 language/*.json
 * 3. 自动识别浏览器语言
 * 4. 保存用户语言偏好
 * 5. 动态更新页面文字
 * 6. 为未来 AI / API 提供当前语言状态
 *
 * ============================================================
 */


/**
 * ============================================================
 * 基础配置
 * ============================================================
 */

const LANGUAGE_STORAGE_KEY =
    "everycourt-language";

const DEFAULT_LANGUAGE =
    "en";


/**
 * ============================================================
 * 支持语言
 * ============================================================
 */

export const SUPPORTED_LANGUAGES = {
    en: {
        code: "en",
        label: "English",
        file: "language/en.json"
    },

    "zh-CN": {
        code: "zh-CN",
        label: "简体中文",
        file: "language/zh.json"
    },

    "zh-HK": {
        code: "zh-HK",
        label: "繁體中文",
        file: "language/zh-tc.json"
    },

    fr: {
        code: "fr",
        label: "Français",
        file: "language/fr.json"
    },

    es: {
        code: "es",
        label: "Español",
        file: "language/es.json"
    },

    ja: {
        code: "ja",
        label: "日本語",
        file: "language/ja.json"
    }
};


/**
 * ============================================================
 * 内部状态
 * ============================================================
 */

let currentLanguage =
    DEFAULT_LANGUAGE;

let currentTranslations =
    {};

const translationCache =
    new Map();


/**
 * ============================================================
 * 通用工具
 * ============================================================
 */

export function normalizeLanguageCode(
    languageCode
) {
    if (
        !languageCode ||
        typeof languageCode !== "string"
    ) {
        return DEFAULT_LANGUAGE;
    }

    const normalized =
        languageCode
            .trim()
            .toLowerCase()
            .replace(/_/g, "-");

    if (
        normalized === "zh" ||
        normalized === "zh-cn" ||
        normalized === "zh-sg" ||
        normalized === "zh-hans"
    ) {
        return "zh-CN";
    }

    if (
        normalized === "zh-hk" ||
        normalized === "zh-mo" ||
        normalized === "zh-tc"
    ) {
        return "zh-HK";
    }

    if (
        normalized === "zh-tw"
    ) {
        return "zh-HK";
    }

    if (
        normalized === "zh-hant"
    ) {
        return "zh-HK";
    }

    if (
        normalized === "en" ||
        normalized.startsWith(
            "en-"
        )
    ) {
        return "en";
    }

    if (
        normalized === "ja" ||
        normalized.startsWith(
            "ja-"
        )
    ) {
        return "ja";
    }

    if (
        normalized === "fr" ||
        normalized.startsWith(
            "fr-"
        )
    ) {
        return "fr";
    }

    if (
        normalized === "es" ||
        normalized.startsWith(
            "es-"
        )
    ) {
        return "es";
    }

    return normalized;
}


/**
 * ============================================================
 * 浏览器语言识别
 * ============================================================
 */

function detectBrowserLanguage() {
    const browserLanguages =
        navigator.languages?.length
            ? navigator.languages
            : [
                navigator.language
            ];


    for (
        const browserLanguage
        of browserLanguages
    ) {
        const normalized =
            normalizeLanguageCode(
                browserLanguage
            );


        if (
            SUPPORTED_LANGUAGES[
                normalized
            ]
        ) {
            return normalized;
        }
    }


    return DEFAULT_LANGUAGE;
}


/**
 * ============================================================
 * 获取初始语言
 * ============================================================
 */

function getInitialLanguage() {
    const savedLanguage =
        localStorage.getItem(
            LANGUAGE_STORAGE_KEY
        );


    if (
        savedLanguage
    ) {
        const normalizedSavedLanguage =
            normalizeLanguageCode(
                savedLanguage
            );


        if (
            SUPPORTED_LANGUAGES[
                normalizedSavedLanguage
            ]
        ) {
            return normalizedSavedLanguage;
        }
    }


    return detectBrowserLanguage();
}


/**
 * ============================================================
 * 加载语言 JSON
 * ============================================================
 */

async function loadLanguageFile(
    languageCode
) {
    if (
        translationCache.has(
            languageCode
        )
    ) {
        return translationCache.get(
            languageCode
        );
    }


    const language =
        SUPPORTED_LANGUAGES[
            languageCode
        ];


    if (!language) {
        throw new Error(
            `Unsupported language: ${languageCode}`
        );
    }


    const response =
        await fetch(
            language.file,
            {
                cache: "no-cache"
            }
        );


    if (
        !response.ok
    ) {
        throw new Error(
            `Unable to load language file: ${language.file}`
        );
    }


    const translations =
        await response.json();


    translationCache.set(
        languageCode,
        translations
    );


    return translations;
}


/**
 * ============================================================
 * 读取嵌套翻译
 *
 * 例如：
 *
 * getNestedValue(
 *   translations,
 *   "chat.title"
 * )
 *
 * ============================================================
 */

function getNestedValue(
    object,
    path
) {
    if (
        !object ||
        !path
    ) {
        return null;
    }


    return path
        .split(".")
        .reduce(
            (
                current,
                key
            ) => {

                if (
                    current === null ||
                    current === undefined
                ) {
                    return null;
                }

                return current[key];

            },
            object
        );
}


/**
 * ============================================================
 * 更新 Text Content
 *
 * HTML 示例：
 *
 * data-i18n="chat.title"
 * ============================================================
 */

function updateTextElements(
    translations
) {
    const elements =
        document.querySelectorAll(
            "[data-i18n]"
        );


    elements.forEach(
        element => {

            const key =
                element.getAttribute(
                    "data-i18n"
                );


            const value =
                getNestedValue(
                    translations,
                    key
                );


            if (
                typeof value === "string"
            ) {
                element.textContent =
                    value;
            }
        }
    );
}


/**
 * ============================================================
 * 更新 Placeholder
 *
 * HTML 示例：
 *
 * data-i18n-placeholder="chat.placeholder"
 * ============================================================
 */

function updatePlaceholderElements(
    translations
) {
    const elements =
        document.querySelectorAll(
            "[data-i18n-placeholder]"
        );


    elements.forEach(
        element => {

            const key =
                element.getAttribute(
                    "data-i18n-placeholder"
                );


            const value =
                getNestedValue(
                    translations,
                    key
                );


            if (
                typeof value === "string"
            ) {
                element.setAttribute(
                    "placeholder",
                    value
                );
            }
        }
    );
}


/**
 * ============================================================
 * 更新 Title / Tooltip
 *
 * HTML 示例：
 *
 * data-i18n-title="chat.button"
 * ============================================================
 */

function updateTitleElements(
    translations
) {
    const elements =
        document.querySelectorAll(
            "[data-i18n-title]"
        );


    elements.forEach(
        element => {

            const key =
                element.getAttribute(
                    "data-i18n-title"
                );


            const value =
                getNestedValue(
                    translations,
                    key
                );


            if (
                typeof value === "string"
            ) {
                element.setAttribute(
                    "title",
                    value
                );
            }
        }
    );
}


/**
 * ============================================================
 * 更新 Document 信息
 * ============================================================
 */

function updateDocumentLanguage(
    languageCode,
    translations
) {
    document.documentElement.lang =
        languageCode;


    const appName =
        getNestedValue(
            translations,
            "app.name"
        );


    const tagline =
        getNestedValue(
            translations,
            "app.tagline"
        );


    if (
        appName &&
        tagline
    ) {
        document.title =
            `${appName} — ${tagline}`;
    } else if (
        appName
    ) {
        document.title =
            appName;
    }
}


/**
 * ============================================================
 * 更新语言按钮状态
 *
 * HTML：
 *
 * data-language-button="en"
 * data-language-button="zh"
 * ============================================================
 */

function updateLanguageButtonState(
    languageCode
) {
    const buttons =
        document.querySelectorAll(
            "[data-language-button]"
        );


    buttons.forEach(
        button => {

            const buttonLanguage =
                button.getAttribute(
                    "data-language-button"
                );


            button.classList.toggle(
                "active",
                buttonLanguage ===
                    languageCode
            );
        }
    );


    /**
     * 当前语言显示
     */

    const currentLanguageLabels =
        document.querySelectorAll(
            "[data-current-language]"
        );


    const label =
        SUPPORTED_LANGUAGES[
            languageCode
        ]?.label ??
        languageCode;


    currentLanguageLabels.forEach(
        element => {

            element.textContent =
                label;

        }
    );
}


/**
 * ============================================================
 * 应用语言
 * ============================================================
 */

function applyTranslations(
    languageCode,
    translations
) {
    updateTextElements(
        translations
    );

    updatePlaceholderElements(
        translations
    );

    updateTitleElements(
        translations
    );

    updateDocumentLanguage(
        languageCode,
        translations
    );

    updateLanguageButtonState(
        languageCode
    );


    /**
     * 自定义事件
     *
     * 后面 Chat Manager / API Client
     * 可以监听语言变化。
     */

    window.dispatchEvent(
        new CustomEvent(
            "everycourt:language-change",
            {
                detail: {
                    language:
                        languageCode,

                    translations
                }
            }
        )
    );
}


/**
 * ============================================================
 * 设置语言
 * ============================================================
 */

export async function setLanguage(
    languageCode,
    {
        savePreference = true
    } = {}
) {
    const normalized =
        normalizeLanguageCode(
            languageCode
        );


    const finalLanguage =
        SUPPORTED_LANGUAGES[
            normalized
        ]
            ? normalized
            : DEFAULT_LANGUAGE;


    try {

        const translations =
            await loadLanguageFile(
                finalLanguage
            );


        currentLanguage =
            finalLanguage;

        currentTranslations =
            translations;


        applyTranslations(
            finalLanguage,
            translations
        );


        if (
            savePreference
        ) {
            localStorage.setItem(
                LANGUAGE_STORAGE_KEY,
                finalLanguage
            );
        }


        return {
            success: true,

            language:
                finalLanguage,

            translations
        };

    } catch (error) {

        console.error(
            "EveryCourtAI Language Manager:",
            error
        );


        /**
         * 英文 Fallback
         */

        if (
            finalLanguage !==
            DEFAULT_LANGUAGE
        ) {
            return setLanguage(
                DEFAULT_LANGUAGE,
                {
                    savePreference:
                        false
                }
            );
        }


        return {
            success: false,

            language:
                DEFAULT_LANGUAGE,

            error:
                error instanceof Error
                    ? error.message
                    : String(error)
        };
    }
}


/**
 * ============================================================
 * 获取当前语言
 * ============================================================
 */

export function getCurrentLanguage() {
    return currentLanguage;
}


/**
 * ============================================================
 * 获取当前完整翻译对象
 * ============================================================
 */

export function getCurrentTranslations() {
    return currentTranslations;
}


/**
 * ============================================================
 * 单独获取一个翻译
 *
 * 未来 JS 动态生成内容会用：
 *
 * t("chat.title")
 * t("system.thinking")
 * ============================================================
 */

export function t(
    key,
    fallback = ""
) {
    const value =
        getNestedValue(
            currentTranslations,
            key
        );


    if (
        typeof value === "string"
    ) {
        return value;
    }


    return (
        fallback ||
        key
    );
}


/**
 * ============================================================
 * 初始化 Language Manager
 * ============================================================
 */

export async function initializeLanguageManager() {
    const initialLanguage =
        getInitialLanguage();


    /**
     * 给所有语言按钮自动绑定事件
     */

    document
        .querySelectorAll(
            "[data-language-button]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const language =
                            button.getAttribute(
                                "data-language-button"
                            );


                        if (
                            language
                        ) {
                            await setLanguage(
                                language
                            );
                        }
                    }
                );
            }
        );


    /**
     * 初始化语言
     */

    return setLanguage(
        initialLanguage,
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
 * 当 script 以：
 *
 * <script type="module"
 * src="scripts/language_manager.js">
 * </script>
 *
 * 引入时会自动运行。
 * ============================================================
 */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            initializeLanguageManager();

        }
    );

} else {

    initializeLanguageManager();

}


/**
 * ============================================================
 * 全局接口
 *
 * 后面方便 Debug：
 *
 * EveryCourtLanguage.setLanguage("ja")
 * EveryCourtLanguage.t("chat.title")
 * ============================================================
 */

window.EveryCourtLanguage = {
    setLanguage,
    getCurrentLanguage,
    getCurrentTranslations,
    t,
    supportedLanguages:
        SUPPORTED_LANGUAGES
};
