import fs from "node:fs";

const manager =
    fs.readFileSync(
        "scripts/language_manager.js",
        "utf8"
    );

const html =
    fs.readFileSync(
        "index.html",
        "utf8"
    );

let passed = 0;
let failed = 0;

function check(
    id,
    condition
) {
    const pass =
        Boolean(
            condition
        );

    console.log({
        id,
        pass
    });

    if (pass) {
        passed++;
    } else {
        failed++;
    }
}


const canonicalLocales = [
    "en",
    "zh-CN",
    "zh-HK",
    "fr",
    "es",
    "ja"
];


for (
    const locale
    of canonicalLocales
) {
    check(
        `supported_${locale}`,
        manager.includes(
            `code: "${locale}"`
        )
    );

    check(
        `menu_${locale}`,
        html.includes(
            `data-language-button="${locale}"`
        )
    );
}


check(
    "six_language_menu",
    (
        html.match(
            /data-language-button="/g
        ) || []
    ).length === 6
);


check(
    "traditional_chinese_label",
    html.includes(
        "繁體中文"
    ) &&
    !html.includes(
        "繁體中文（香港）"
    ) &&
    !html.includes(
        "繁體中文（台灣）"
    )
);


check(
    "zh_tw_removed_from_menu",
    !html.includes(
        'data-language-button="zh-TW"'
    )
);


check(
    "zh_tw_removed_from_supported_languages",
    !manager.includes(
        'code: "zh-TW"'
    )
);


check(
    "zh_tw_alias_to_traditional_chinese",
    manager.includes(
        'normalized === "zh-tw"'
    ) &&
    manager.includes(
        'return "zh-HK";'
    )
);


check(
    "zh_alias_to_simplified_chinese",
    manager.includes(
        'normalized === "zh"'
    ) &&
    manager.includes(
        'return "zh-CN";'
    )
);


check(
    "zh_hk_supported",
    manager.includes(
        'normalized === "zh-hk"'
    ) &&
    manager.includes(
        'return "zh-HK";'
    )
);


check(
    "zh_hant_to_traditional_chinese",
    manager.includes(
        'normalized === "zh-hant"'
    ) &&
    manager.includes(
        'return "zh-HK";'
    )
);


check(
    "french_supported",
    manager.includes(
        'code: "fr"'
    ) &&
    manager.includes(
        'file: "language/fr.json"'
    )
);


check(
    "spanish_supported",
    manager.includes(
        'code: "es"'
    ) &&
    manager.includes(
        'file: "language/es.json"'
    )
);


check(
    "japanese_supported",
    manager.includes(
        'code: "ja"'
    ) &&
    manager.includes(
        'file: "language/ja.json"'
    )
);


check(
    "saved_legacy_locale_is_normalized",
    manager.includes(
        "normalizedSavedLanguage"
    ) &&
    manager.includes(
        "normalizeLanguageCode("
    ) &&
    manager.includes(
        "return normalizedSavedLanguage;"
    )
);


check(
    "browser_detection_uses_canonical_registry",
    manager.includes(
        "SUPPORTED_LANGUAGES["
    ) &&
    manager.includes(
        "return normalized;"
    )
);


console.log("");
console.log(
    "========================================"
);
console.log(
    "LANGUAGE LOCALE CONTRACT V1"
);
console.log(
    "========================================"
);
console.log(`Total: ${passed + failed}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failed > 0) {
    console.log("");
    console.log("RESULT: FAIL");
    process.exitCode = 1;
} else {
    console.log("");
    console.log("RESULT: PASS");
}
