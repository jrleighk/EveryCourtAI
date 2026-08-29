import {
    extractComparisonTargets
} from "../../engine/comparison_target_extractor_v1.js";


const cases = [
    {
        id:
            "simplified_spectra_alias_ready",

        query:
            "比较 光谱PD 和 RF01 Pro Classic",

        expected_ready:
            true,

        expected_statuses:
            [
                "resolved",
                "resolved"
            ],

        expected_ids:
            [
                "babolat_pure_drive_spectra_edition_2026",
                "wilson_rf_01_pro_classic"
            ]
    },

    {
        id:
            "traditional_spectra_alias_ready",

        query:
            "比較 光譜PD 與 RF01 Pro Classic",

        expected_ready:
            true,

        expected_statuses:
            [
                "resolved",
                "resolved"
            ],

        expected_ids:
            [
                "babolat_pure_drive_spectra_edition_2026",
                "wilson_rf_01_pro_classic"
            ]
    },

    {
        id:
            "pd_alias_requires_clarification",

        query:
            "比较 PD 和 RF01 Pro Classic",

        expected_ready:
            false,

        expected_statuses:
            [
                "ambiguous",
                "resolved"
            ],

        expected_ids:
            [
                null,
                "wilson_rf_01_pro_classic"
            ]
    },

    {
        id:
            "pure_drive_family_stays_ambiguous",

        query:
            "比较 Pure Drive 和 RF01 Pro Classic",

        expected_ready:
            false,

        expected_statuses:
            [
                "ambiguous",
                "resolved"
            ],

        expected_ids:
            [
                null,
                "wilson_rf_01_pro_classic"
            ]
    },

    {
        id:
            "unsafe_nickname_not_guessed",

        query:
            "比较 小黑拍 和 RF01 Pro Classic",

        expected_ready:
            false,

        expected_statuses:
            [
                "not_found",
                "resolved"
            ],

        expected_ids:
            [
                null,
                "wilson_rf_01_pro_classic"
            ]
    }
];


const results =
    cases.map(
        testCase => {

            const result =
                extractComparisonTargets(
                    testCase.query
                );


            const statuses =
                result.targets.map(
                    target =>
                        target.status
                );


            const ids =
                result.targets.map(
                    target =>
                        target.match?.id ??
                        null
                );


            const pass =
                result.comparison_ready ===
                    testCase.expected_ready &&
                JSON.stringify(
                    statuses
                ) ===
                    JSON.stringify(
                        testCase.expected_statuses
                    ) &&
                JSON.stringify(
                    ids
                ) ===
                    JSON.stringify(
                        testCase.expected_ids
                    );


            return {
                id:
                    testCase.id,

                ready:
                    result.comparison_ready,

                statuses:
                    statuses.join(
                        " | "
                    ),

                ids:
                    ids
                        .map(
                            id =>
                                id ?? ""
                        )
                        .join(
                            " | "
                        ),

                pass
            };
        }
    );


console.log(
    "========================================"
);

console.log(
    "COMPARISON ALIAS RESOLUTION V1"
);

console.log(
    "========================================"
);

console.table(
    results
);


const passed =
    results.filter(
        result =>
            result.pass
    ).length;

const failed =
    results.length -
    passed;


console.log(
    `\nTotal: ${results.length}`
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
    console.log(
        "\nRESULT: FAIL"
    );

    process.exit(1);
}


console.log(
    "\nRESULT: PASS"
);
