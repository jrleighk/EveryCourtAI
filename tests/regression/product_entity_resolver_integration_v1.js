import {
    resolveRacquet,
    resolveString
} from "../../engine/product_resolver.js";


const racquetCases = [

    {
        id:
            "existing_full_name_preserved",

        query:
            "Babolat Pure Drive Spectra Edition 2026",

        expected_status:
            "resolved",

        expected_id:
            "babolat_pure_drive_spectra_edition_2026"
    },

    {
        id:
            "spectra_without_edition",

        query:
            "Pure Drive Spectra 2026",

        expected_status:
            "resolved",

        expected_id:
            "babolat_pure_drive_spectra_edition_2026"
    },

    {
        id:
            "spectra_word_order",

        query:
            "Pure Drive 2026 Spectra",

        expected_status:
            "resolved",

        expected_id:
            "babolat_pure_drive_spectra_edition_2026"
    },

    {
        id:
            "spectra_short",

        query:
            "Pure Drive Spectra",

        expected_status:
            "resolved",

        expected_id:
            "babolat_pure_drive_spectra_edition_2026"
    },

    {
        id:
            "team_spectra",

        query:
            "Pure Drive Team Spectra 2026",

        expected_status:
            "resolved",

        expected_id:
            "babolat_pure_drive_team_spectra_edition_2026"
    },

    {
        id:
            "rf01_generic_preserved",

        query:
            "RF01",

        expected_status:
            "resolved",

        expected_id:
            "wilson_rf_01_2024"
    },

    {
        id:
            "rf01_classic",

        query:
            "RF01 Pro Classic",

        expected_status:
            "resolved",

        expected_id:
            "wilson_rf_01_pro_classic"
    },

    {
        id:
            "pd_alias_remains_ambiguous",

        query:
            "PD",

        expected_status:
            "ambiguous",

        expected_id:
            null
    },

    {
        id:
            "spectra_pd_simplified_alias",

        query:
            "光谱PD",

        expected_status:
            "resolved",

        expected_id:
            "babolat_pure_drive_spectra_edition_2026"
    },

    {
        id:
            "spectra_pd_traditional_alias",

        query:
            "光譜PD",

        expected_status:
            "resolved",

        expected_id:
            "babolat_pure_drive_spectra_edition_2026"
    },

    {
        id:
            "pure_drive_spectra_cn_alias",

        query:
            "Pure Drive 光谱",

        expected_status:
            "resolved",

        expected_id:
            "babolat_pure_drive_spectra_edition_2026"
    },

    {
        id:
            "pure_drive_remains_ambiguous",

        query:
            "Pure Drive",

        expected_status:
            "ambiguous",

        expected_id:
            null
    },

    {
        id:
            "unknown_remains_not_found",

        query:
            "Completely Unknown Tennis XYZ 999",

        expected_status:
            "not_found",

        expected_id:
            null
    }
];


const racquetResults =
    racquetCases.map(
        testCase => {

            const result =
                resolveRacquet(
                    testCase.query
                );

            return {
                id:
                    testCase.id,

                query:
                    testCase.query,

                expected_status:
                    testCase.expected_status,

                actual_status:
                    result.status,

                expected_id:
                    testCase.expected_id,

                actual_id:
                    result.match?.id ??
                    null,

                source:
                    result.resolution_source ??
                    result.match
                        ?.resolution_source ??
                    "registry",

                pass:
                    result.status ===
                        testCase.expected_status &&
                    (
                        testCase.expected_id ===
                            null ||
                        result.match?.id ===
                            testCase.expected_id
                    )
            };
        }
    );


/**
 * String smoke test.
 *
 * 8N-4A must not alter resolveString().
 */

const stringQueries = [
    "HEAD HAWK TOUCH 1.25",
    "Wilson Natural Gut 17"
];


const stringResults =
    stringQueries.map(
        query => {

            const result =
                resolveString(
                    query
                );

            return {
                query,
                status:
                    result?.status ??
                    null,

                id:
                    result?.match?.id ??
                    null,

                pass:
                    result !==
                    null &&
                    typeof result ===
                        "object"
            };
        }
    );


console.log(
    "========================================"
);

console.log(
    "PRODUCT ENTITY RESOLVER INTEGRATION V1"
);

console.log(
    "========================================"
);

console.table(
    racquetResults
);


console.log("");
console.log(
    "STRING RESOLVER SMOKE"
);

console.table(
    stringResults
);


const passed =
    racquetResults.filter(
        item =>
            item.pass
    ).length;

const failed =
    racquetResults.length -
    passed;

const stringPassed =
    stringResults.every(
        item =>
            item.pass
    );


console.log("");
console.log(
    `Racquet Total: ${racquetResults.length}`
);

console.log(
    `Racquet Passed: ${passed}`
);

console.log(
    `Racquet Failed: ${failed}`
);

console.log(
    `String Smoke: ${
        stringPassed
            ? "PASS"
            : "FAIL"
    }`
);

console.log("");

console.log(
    failed === 0 &&
    stringPassed
        ? "RESULT: PASS"
        : "RESULT: FAIL"
);


if (
    failed >
        0 ||
    !stringPassed
) {
    process.exitCode =
        1;
}
