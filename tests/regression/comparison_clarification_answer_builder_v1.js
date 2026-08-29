import {
    buildComparisonClarificationAnswer
} from "../../engine/comparison_clarification_answer_builder_v1.js";


const pureDriveTarget = {
    index:
        0,

    raw_text:
        "Pure Drive",

    status:
        "ambiguous",

    candidates: [
        {
            product: {
                id:
                    "babolat_pure_drive_wimbledon_2026",

                brand:
                    "Babolat",

                brand_cn:
                    "百保力",

                model:
                    "Pure Drive Wimbledon 2026",

                model_cn:
                    "Pure Drive Wimbledon Edition 2026"
            }
        },
        {
            product: {
                id:
                    "babolat_pure_drive_98_2025",

                brand:
                    "Babolat",

                brand_cn:
                    "百保力",

                model:
                    "Pure Drive 98",

                model_cn:
                    "Pure Drive 98"
            }
        },
        {
            product: {
                id:
                    "babolat_pure_drive_spectra_edition_2026",

                brand:
                    "Babolat",

                brand_cn:
                    "百保力",

                model:
                    "Pure Drive Spectra Edition 2026",

                model_cn:
                    "Pure Drive 光谱特别版 2026"
            }
        }
    ]
};


const zh =
    buildComparisonClarificationAnswer({
        unresolvedTargets: [
            pureDriveTarget
        ],

        locale:
            "zh-CN"
    });


const en =
    buildComparisonClarificationAnswer({
        unresolvedTargets: [
            pureDriveTarget
        ],

        locale:
            "en"
    });


const notFound =
    buildComparisonClarificationAnswer({
        unresolvedTargets: [
            {
                raw_text:
                    "Unknown XYZ 999",

                status:
                    "not_found",

                candidates:
                    []
            }
        ],

        locale:
            "zh-CN"
    });


const tests = [

    {
        id:
            "zh_available",

        pass:
            zh.available ===
            true
    },

    {
        id:
            "zh_locale",

        pass:
            zh.locale ===
            "zh-CN"
    },

    {
        id:
            "zh_candidate_count",

        pass:
            zh.candidates.length ===
            3
    },

    {
        id:
            "zh_mentions_target",

        pass:
            zh.answer.includes(
                "Pure Drive"
            )
    },

    {
        id:
            "zh_lists_spectra",

        pass:
            zh.answer.includes(
                "光谱特别版 2026"
            )
    },

    {
        id:
            "zh_lists_98",

        pass:
            zh.answer.includes(
                "Pure Drive 98"
            )
    },

    {
        id:
            "en_available",

        pass:
            en.available ===
            true
    },

    {
        id:
            "en_candidate_count",

        pass:
            en.candidates.length ===
            3
    },

    {
        id:
            "en_lists_spectra",

        pass:
            en.answer.includes(
                "Pure Drive Spectra Edition 2026"
            )
    },

    {
        id:
            "not_found_no_candidates",

        pass:
            notFound.candidates.length ===
            0
    },

    {
        id:
            "not_found_mentions_query",

        pass:
            notFound.answer.includes(
                "Unknown XYZ 999"
            )
    }
];


console.log(
    "========================================"
);

console.log(
    "COMPARISON CLARIFICATION ANSWER BUILDER V1"
);

console.log(
    "========================================"
);


console.table(
    tests
);


const passed =
    tests.filter(
        item =>
            item.pass
    ).length;


const failed =
    tests.length -
    passed;


console.log("");
console.log(
    `Total: ${tests.length}`
);
console.log(
    `Passed: ${passed}`
);
console.log(
    `Failed: ${failed}`
);


if (
    failed >
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
