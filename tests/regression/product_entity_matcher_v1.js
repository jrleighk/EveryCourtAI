import {
    RACQUET_PRODUCT_REGISTRY
} from "../../engine/product_registry.generated.js";

import {
    rankProductEntities,
    resolveProductEntity
} from "../../engine/product_entity_matcher_v1.js";


const cases = [

    {
        id:
            "spectra_without_edition",

        query:
            "Pure Drive Spectra 2026",

        status:
            "resolved",

        expected:
            "babolat_pure_drive_spectra_edition_2026"
    },

    {
        id:
            "spectra_brand_without_edition",

        query:
            "Babolat Pure Drive Spectra 2026",

        status:
            "resolved",

        expected:
            "babolat_pure_drive_spectra_edition_2026"
    },

    {
        id:
            "spectra_word_order",

        query:
            "Pure Drive 2026 Spectra",

        status:
            "resolved",

        expected:
            "babolat_pure_drive_spectra_edition_2026"
    },

    {
        id:
            "spectra_short",

        query:
            "Pure Drive Spectra",

        status:
            "resolved",

        expected:
            "babolat_pure_drive_spectra_edition_2026"
    },

    {
        id:
            "spectra_team",

        query:
            "Pure Drive Team Spectra 2026",

        status:
            "resolved",

        expected:
            "babolat_pure_drive_team_spectra_edition_2026"
    },

    {
        id:
            "rf01_classic_compact",

        query:
            "RF01 Pro Classic",

        status:
            "resolved",

        expected:
            "wilson_rf_01_pro_classic"
    },

    {
        id:
            "rf01_generic",

        query:
            "RF01",

        status:
            "resolved",

        expected:
            "wilson_rf_01_2024"
    },

    {
        id:
            "pure_drive_generic",

        query:
            "Pure Drive",

        status:
            "ambiguous",

        expected:
            null
    },

    {
        id:
            "babolat_pure_drive_generic",

        query:
            "Babolat Pure Drive",

        status:
            "ambiguous",

        expected:
            null
    },

    {
        id:
            "unknown_product",

        query:
            "Completely Unknown Tennis XYZ 999",

        status:
            "not_found",

        expected:
            null
    }
];


const results =
    cases.map(
        testCase => {

            const result =
                resolveProductEntity(
                    testCase.query,
                    RACQUET_PRODUCT_REGISTRY
                );

            return {
                id:
                    testCase.id,

                query:
                    testCase.query,

                expected_status:
                    testCase.status,

                actual_status:
                    result.status,

                expected:
                    testCase.expected,

                actual:
                    result.match?.id ??
                    null,

                confidence:
                    result.confidence ??
                    null,

                margin:
                    result.margin ??
                    null,

                pass:
                    result.status ===
                        testCase.status &&
                    (
                        testCase.expected ===
                            null ||
                        result.match?.id ===
                            testCase.expected
                    )
            };
        }
    );


console.log(
    "========================================"
);

console.log(
    "PRODUCT ENTITY MATCHER V1 - DECISION"
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


console.log("");
console.log(
    `Total: ${results.length}`
);

console.log(
    `Passed: ${passed}`
);

console.log(
    `Failed: ${failed}`
);

console.log("");

console.log(
    failed === 0
        ? "RESULT: PASS"
        : "RESULT: FAIL"
);


console.log("");
console.log(
    "PURE DRIVE GENERIC CANDIDATES"
);

console.table(
    rankProductEntities(
        "Pure Drive",
        RACQUET_PRODUCT_REGISTRY
    )
        .slice(
            0,
            8
        )
        .map(
            item => ({
                id:
                    item.product.id,

                model:
                    item.product.model,

                score:
                    item.score,

                coverage:
                    item.coverage
            })
        )
);


console.log("");
console.log(
    "SPECTRA 2026 CANDIDATES"
);

console.table(
    rankProductEntities(
        "Pure Drive Spectra 2026",
        RACQUET_PRODUCT_REGISTRY
    )
        .slice(
            0,
            6
        )
        .map(
            item => ({
                id:
                    item.product.id,

                model:
                    item.product.model,

                score:
                    item.score,

                coverage:
                    item.coverage,

                matched:
                    item
                        .matched_discriminators
                        .join(", "),

                missing:
                    item
                        .missing_discriminators
                        .join(", ")
            })
        )
);


if (
    failed >
    0
) {
    process.exitCode =
        1;
}
