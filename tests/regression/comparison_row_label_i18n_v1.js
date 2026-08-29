import {
    COMPARISON_I18N
} from "../../scripts/comparison_i18n_v1.js";

import fs from "node:fs";


const REQUIRED_KEYS = [
    "power",
    "control",
    "spin",
    "comfort",
    "head_size_sq_in",
    "weight_unstrung_g",
    "weight_strung_g",
    "balance_unstrung_mm",
    "length_in",
    "string_pattern"
];


const LOCALES = [
    "en",
    "zh-CN",
    "zh-HK",
    "fr",
    "es",
    "ja"
];


const results = [];


for (const locale of LOCALES) {

    const labels =
        COMPARISON_I18N[
            locale
        ]?.row_labels;


    for (const key of REQUIRED_KEYS) {

        results.push({
            id:
                `${locale}_${key}`,
            pass:
                typeof labels?.[key] ===
                    "string" &&
                labels[key].trim().length >
                    0
        });
    }
}


results.push({
    id: "french_power_localized",
    pass:
        COMPARISON_I18N.fr
            .row_labels.power ===
        "Puissance"
});


results.push({
    id: "french_head_size_localized",
    pass:
        COMPARISON_I18N.fr
            .row_labels.head_size_sq_in ===
        "Taille du tamis"
});


results.push({
    id: "japanese_power_not_english",
    pass:
        COMPARISON_I18N.ja
            .row_labels.power !==
        COMPARISON_I18N.en
            .row_labels.power
});


results.push({
    id: "spanish_spin_not_english",
    pass:
        COMPARISON_I18N.es
            .row_labels.spin !==
        COMPARISON_I18N.en
            .row_labels.spin
});


const renderer =
    fs.readFileSync(
        new URL(
            "../../scripts/chat_manager.js",
            import.meta.url
        ),
        "utf8"
    );


results.push({
    id: "renderer_accepts_row_labels",
    pass:
        renderer.includes(
            "rowLabels = {}"
        )
});


results.push({
    id: "renderer_uses_canonical_key",
    pass:
        renderer.includes(
            "rowLabels?.["
        ) &&
        renderer.includes(
            "item.key"
        )
});


results.push({
    id: "renderer_passes_comparison_row_labels",
    pass:
        renderer.includes(
            ".row_labels"
        )
});


console.table(
    results
);


const failed =
    results.filter(
        item =>
            !item.pass
    );


console.log("");
console.log(
    `Total: ${results.length}`
);
console.log(
    `Passed: ${results.length - failed.length}`
);
console.log(
    `Failed: ${failed.length}`
);


if (
    failed.length >
    0
) {

    console.log("");
    console.log(
        "RESULT: FAIL"
    );

    process.exitCode =
        1;

} else {

    console.log("");
    console.log(
        "RESULT: PASS"
    );
}
