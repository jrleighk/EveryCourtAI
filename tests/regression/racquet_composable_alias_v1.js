import {
    resolveRacquet
} from "../../engine/product_resolver.js";

const cases = [
    {
        input: "PD 2026",
        expected_status: "ambiguous",
        expected_series: "Pure Drive",
        expected_candidate_year: 2026
    },
    {
        input: "PA 2026",
        expected_status: "ambiguous",
        expected_series: "Pure Aero",
        expected_candidate_year: 2026
    },
    {
        input: "PD",
        expected_status: "ambiguous",
        expected_series: "Pure Drive"
    },
    {
        input: "PA",
        expected_status: "ambiguous",
        expected_series: "Pure Aero"
    },
    {
        input: "光谱PD",
        expected_status: "resolved",
        expected_id: "babolat_pure_drive_spectra_edition_2026"
    },
    {
        input: "PS",
        expected_status: "not_found"
    },
    {
        input: "小黑拍",
        expected_status: "not_found"
    },
    {
        input: "德约的拍子",
        expected_status: "not_found"
    },
    {
        input: "上一代PD",
        expected_status: "not_found"
    }
];

let passed = 0;
let failed = 0;

function candidateSeries(result) {
    const candidates =
        Array.isArray(result?.candidates)
            ? result.candidates
            : [];

    const series =
        new Set();

    for (const candidate of candidates) {
        const value =
            candidate?.series ??
            candidate?.product?.series ??
            null;

        if (value) {
            series.add(value);
        }
    }

    return [...series];
}

for (const testCase of cases) {
    const result =
        resolveRacquet(
            testCase.input
        );

    let ok =
        result?.status ===
        testCase.expected_status;

    if (
        ok &&
        testCase.expected_id
    ) {
        const id =
            result?.match?.id ??
            result?.product?.id ??
            result?.resolved_product?.id ??
            null;

        ok =
            id ===
            testCase.expected_id;
    }

    if (
        ok &&
        testCase.expected_series
    ) {
        const aliasSeries =
            result?.alias
                ?.canonical_series ??
            null;

        const series =
            candidateSeries(
                result
            );

        ok =
            aliasSeries ===
                testCase.expected_series ||
            series.includes(
                testCase.expected_series
            );
    }

    if (
        ok &&
        testCase.expected_candidate_year
    ) {
        const candidates =
            Array.isArray(
                result?.candidates
            )
                ? result.candidates
                : [];

        ok =
            candidates.length > 0 &&
            candidates.every(
                candidate =>
                    Number(
                        candidate?.release_year
                    ) ===
                    testCase.expected_candidate_year
            );
    }

    if (ok) {
        passed += 1;

        console.log(
            "PASS",
            testCase.input,
            "=>",
            result.status
        );
    } else {
        failed += 1;

        console.log(
            "FAIL",
            testCase.input,
            "=>",
            JSON.stringify({
                status:
                    result?.status ??
                    null,

                match:
                    result?.match ??
                    null,

                alias:
                    result?.alias ??
                    null,

                candidates:
                    result?.candidates
                        ?.slice?.(
                            0,
                            5
                        ) ??
                    []
            })
        );
    }
}

console.log("");
console.log(
    `Total ${cases.length} Passed ${passed} Failed ${failed}`
);

process.exit(
    failed === 0
        ? 0
        : 1
);
