import {
    COMPARISON_I18N,
    normalizeComparisonPresentationLocale,
    getComparisonPresentation
} from "../../scripts/comparison_i18n_v1.js";


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


const locales = [
    "en",
    "zh-CN",
    "zh-HK",
    "fr",
    "es",
    "ja"
];


for (
    const locale
    of locales
) {
    check(
        `dictionary_${locale}`,
        Boolean(
            COMPARISON_I18N[
                locale
            ]
        )
    );
}


check(
    "exact_six_canonical_dictionaries",
    Object.keys(
        COMPARISON_I18N
    ).length === 6
);


check(
    "legacy_zh_tw_to_zh_hk",
    normalizeComparisonPresentationLocale(
        "zh-TW"
    ) === "zh-HK"
);


check(
    "fr_region_normalized",
    normalizeComparisonPresentationLocale(
        "fr-FR"
    ) === "fr"
);


check(
    "es_region_normalized",
    normalizeComparisonPresentationLocale(
        "es-ES"
    ) === "es"
);


check(
    "ja_region_normalized",
    normalizeComparisonPresentationLocale(
        "ja-JP"
    ) === "ja"
);


const requiredKeys = [
    "performance",
    "specifications",
    "personalized_for_you",
    "player_fit",
    "swing_match",
    "weight_match",
    "physical_demand",
    "goal_match",
    "personalized_prompt_title",
    "personalized_prompt_text",
    "key_differences",
    "unknown",
    "strong",
    "moderate",
    "weak",
    "demanding",
    "neutral",
    "low",
    "high",
    "positive",
    "negative"
];


for (
    const locale
    of locales
) {
    const dictionary =
        getComparisonPresentation(
            locale
        );

    check(
        `required_keys_${locale}`,
        requiredKeys.every(
            key =>
                typeof dictionary[
                    key
                ] === "string" &&
                dictionary[
                    key
                ].length > 0
        )
    );
}


check(
    "japanese_is_not_english",
    getComparisonPresentation(
        "ja"
    ).performance !==
        getComparisonPresentation(
            "en"
        ).performance
);


check(
    "french_is_not_english",
    getComparisonPresentation(
        "fr"
    ).key_differences !==
        getComparisonPresentation(
            "en"
        ).key_differences
);


check(
    "spanish_is_not_english",
    getComparisonPresentation(
        "es"
    ).performance !==
        getComparisonPresentation(
            "en"
        ).performance
);


console.log("");
console.log(
    "========================================"
);
console.log(
    "COMPARISON I18N V1"
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


if (
    failed > 0
) {
    process.exitCode = 1;
}
