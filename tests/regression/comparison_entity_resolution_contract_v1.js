import {
    extractComparisonTargets
} from "../../engine/comparison_target_extractor_v1.js";

import {
    resolveComparisonTargets
} from "../../engine/comparison_resolution_engine_v1.js";


const cases = [

    {
        id:
            "spectra_natural_name",

        message:
            "比较 Pure Drive Spectra 2026 和 RF01 Pro Classic",

        expected_target_statuses: [
            "resolved",
            "resolved"
        ],

        expected_ids: [
            "babolat_pure_drive_spectra_edition_2026",
            "wilson_rf_01_pro_classic"
        ],

        expected_resolution_status:
            "comparison_ready"
    },

    {
        id:
            "spectra_without_year",

        message:
            "比较 Pure Drive Spectra 和 RF01 Pro Classic",

        expected_target_statuses: [
            "resolved",
            "resolved"
        ],

        expected_ids: [
            "babolat_pure_drive_spectra_edition_2026",
            "wilson_rf_01_pro_classic"
        ],

        expected_resolution_status:
            "comparison_ready"
    },

    {
        id:
            "spectra_word_order",

        message:
            "比较 Pure Drive 2026 Spectra 和 RF01 Pro Classic",

        expected_target_statuses: [
            "resolved",
            "resolved"
        ],

        expected_ids: [
            "babolat_pure_drive_spectra_edition_2026",
            "wilson_rf_01_pro_classic"
        ],

        expected_resolution_status:
            "comparison_ready"
    },

    {
        id:
            "team_spectra",

        message:
            "比较 Pure Drive Team Spectra 2026 和 RF01 Pro Classic",

        expected_target_statuses: [
            "resolved",
            "resolved"
        ],

        expected_ids: [
            "babolat_pure_drive_team_spectra_edition_2026",
            "wilson_rf_01_pro_classic"
        ],

        expected_resolution_status:
            "comparison_ready"
    },

    {
        id:
            "generic_family_requires_clarification",

        message:
            "比较 Pure Drive 和 RF01 Pro Classic",

        expected_target_statuses: [
            "ambiguous",
            "resolved"
        ],

        expected_ids: [
            null,
            "wilson_rf_01_pro_classic"
        ],

        expected_resolution_status:
            "clarification_required"
    },

    {
        id:
            "unknown_product_requires_clarification",

        message:
            "比较 Completely Unknown Tennis XYZ 999 和 RF01 Pro Classic",

        expected_target_statuses: [
            "not_found",
            "resolved"
        ],

        expected_ids: [
            null,
            "wilson_rf_01_pro_classic"
        ],

        expected_resolution_status:
            "clarification_required"
    }
];


const results =
    cases.map(
        testCase => {

            const extraction =
                extractComparisonTargets(
                    testCase.message
                );

            const resolution =
                resolveComparisonTargets(
                    extraction
                );


            const actualStatuses =
                extraction.targets
                    ?.map(
                        target =>
                            target.status
                    ) ??
                [];


            const actualIds =
                extraction.targets
                    ?.map(
                        target =>
                            target.match?.id ??
                            null
                    ) ??
                [];


            const statusesPass =
                JSON.stringify(
                    actualStatuses
                ) ===
                JSON.stringify(
                    testCase
                        .expected_target_statuses
                );


            const idsPass =
                JSON.stringify(
                    actualIds
                ) ===
                JSON.stringify(
                    testCase
                        .expected_ids
                );


            const resolutionPass =
                resolution?.status ===
                testCase
                    .expected_resolution_status;


            /**
             * Candidate compatibility contract:
             *
             * Candidate evidence is resolver-internal and may
             * currently use either of two valid shapes:
             *
             * Registry Resolver:
             * { id, brand, model, score, matched_pattern }
             *
             * Product Entity Matcher:
             * { product: { id, ... }, score, coverage, ... }
             *
             * Comparison only requires every candidate to expose
             * a valid canonical product identity through either
             * candidate.id or candidate.product.id.
             */
            const candidateContractPass =
                (
                    extraction.targets ??
                    []
                ).every(
                    target =>
                        (
                            target.candidates ??
                            []
                        ).every(
                            candidate => {

                                if (
                                    !candidate ||
                                    typeof candidate !==
                                        "object"
                                ) {
                                    return false;
                                }


                                const candidateId =
                                    typeof candidate.id ===
                                        "string"
                                        ? candidate.id
                                        : (
                                            typeof candidate
                                                ?.product
                                                ?.id ===
                                                "string"
                                                ? candidate
                                                    .product
                                                    .id
                                                : null
                                        );


                                return Boolean(
                                    candidateId
                                );
                            }
                        )
                );


            return {
                id:
                    testCase.id,

                statuses:
                    actualStatuses.join(
                        " | "
                    ),

                ids:
                    actualIds.join(
                        " | "
                    ),

                resolution:
                    resolution?.status ??
                    null,

                candidate_contract:
                    candidateContractPass,

                pass:
                    statusesPass &&
                    idsPass &&
                    resolutionPass &&
                    candidateContractPass
            };
        }
    );


console.log(
    "========================================"
);

console.log(
    "COMPARISON ENTITY RESOLUTION CONTRACT V1"
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


if (
    failed >
    0
) {
    process.exitCode =
        1;
}
