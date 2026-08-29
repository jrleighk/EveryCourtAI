import fs from "node:fs";

const worker =
    fs.readFileSync(
        "cloudflare/worker.js",
        "utf8"
    );

let passed = 0;
let failed = 0;

function check(
    id,
    condition
) {
    const pass =
        Boolean(condition);

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


/**
 * Canonical locale outputs
 */

check(
    "canonical_zh_cn_output",
    worker.includes(
        'return "zh-CN";'
    )
);

check(
    "canonical_zh_hk_output",
    worker.includes(
        'return "zh-HK";'
    )
);

check(
    "canonical_zh_tw_output",
    worker.includes(
        'return "zh-TW";'
    )
);

check(
    "canonical_en_output",
    worker.includes(
        'return "en";'
    )
);

check(
    "canonical_ja_output",
    worker.includes(
        'return "ja";'
    )
);


/**
 * Simplified Chinese aliases
 */

for (
    const alias
    of [
        "zh",
        "zh-cn",
        "zh-sg",
        "zh-hans"
    ]
) {
    check(
        `simplified_alias_${alias}`,
        worker.includes(
            `normalized === "${alias}"`
        )
    );
}


/**
 * Hong Kong / Traditional aliases
 */

for (
    const alias
    of [
        "zh-hk",
        "zh-mo",
        "zh-tc",
        "zh-hant"
    ]
) {
    check(
        `hk_alias_${alias}`,
        worker.includes(
            `normalized === "${alias}"`
        )
    );
}


/**
 * Taiwan remains distinct
 */

check(
    "taiwan_alias_preserved",
    worker.includes(
        'normalized === "zh-tw"'
    )
);


/**
 * Regional English / Japanese
 */

check(
    "english_region_normalization",
    worker.includes(
        '"en-"'
    )
);

check(
    "japanese_region_normalization",
    worker.includes(
        '"ja-"'
    )
);


/**
 * Canonical downstream branches
 */

check(
    "followup_accepts_zh_cn",
    worker.includes(
        'normalizedLanguage === "zh-CN"'
    )
);

check(
    "followup_accepts_zh_hk",
    worker.includes(
        'normalizedLanguage === "zh-HK"'
    )
);

check(
    "followup_accepts_zh_tw",
    worker.includes(
        'normalizedLanguage === "zh-TW"'
    )
);


/**
 * Legacy downstream comparisons must be gone.
 */

const legacyBranchPatterns = [
    'normalizedLanguage === "zh"',
    'normalizedLanguage === "zh-cn"',
    'normalizedLanguage === "zh-tc"',
    'normalizedLanguage === "zh-tw"',
    'normalizedLanguage === "zh-hk"'
];

for (
    const pattern
    of legacyBranchPatterns
) {
    check(
        `legacy_branch_removed_${pattern}`,
        !worker.includes(
            pattern
        )
    );
}


/**
 * API request language must still be resolved
 * through normalizeLanguage().
 */

check(
    "request_language_normalized",
    worker.includes(
        "normalizeLanguage("
    )
);


/**
 * Canonical contract must preserve
 * HK and TW as separate identities.
 */

check(
    "hk_tw_are_distinct",
    worker.includes(
        'return "zh-HK";'
    ) &&
    worker.includes(
        'return "zh-TW";'
    )
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
