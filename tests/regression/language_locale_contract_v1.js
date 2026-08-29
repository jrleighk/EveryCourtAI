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
    "zh-TW",
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
    "legacy_menu_zh_removed",
    !html.includes(
        'data-language-button="zh"'
    )
);

check(
    "legacy_menu_zh_tc_removed",
    !html.includes(
        'data-language-button="zh-tc"'
    )
);

check(
    "fr_not_v1_menu",
    !html.includes(
        'data-language-button="fr"'
    )
);

check(
    "es_not_v1_menu",
    !html.includes(
        'data-language-button="es"'
    )
);

check(
    "zh_alias_to_zh_cn",
    manager.includes(
        'normalized === "zh"'
    ) &&
    manager.includes(
        'return "zh-CN";'
    )
);

check(
    "zh_hk_alias_supported",
    manager.includes(
        'normalized === "zh-hk"'
    ) &&
    manager.includes(
        'return "zh-HK";'
    )
);

check(
    "zh_tc_alias_supported",
    manager.includes(
        'normalized === "zh-tc"'
    )
);

check(
    "zh_tw_preserved",
    manager.includes(
        'normalized === "zh-tw"'
    ) &&
    manager.includes(
        'return "zh-TW";'
    )
);

check(
    "english_region_aliases",
    manager.includes(
        'normalized.startsWith('
    ) &&
    manager.includes(
        '"en-"'
    )
);

check(
    "japanese_region_aliases",
    manager.includes(
        '"ja-"'
    )
);

check(
    "hk_translation_fallback",
    manager.includes(
        '"zh-HK":'
    ) &&
    manager.includes(
        'file: "language/zh-tc.json"'
    )
);

check(
    "tw_translation_fallback",
    manager.includes(
        '"zh-TW":'
    ) &&
    manager.match(
        /file: "language\/zh-tc\.json"/g
    )?.length >= 2
);

console.log("");
console.log(
    "========================================"
);
console.log(
    "REGRESSION SUMMARY"
);
console.log(
    "========================================"
);
console.log(
    `Total: ${passed + failed}`
);
console.log(
    `Passed: ${passed}`
);
console.log(
    `Failed: ${failed}`
);

console.log(
    failed === 0
        ? "RESULT: PASS"
        : "RESULT: FAIL"
);

if (
    failed > 0
) {
    process.exitCode = 1;
}
