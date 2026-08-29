import {
    resolveRacquet
} from "../../engine/product_resolver.js";

const cases = [
    {
        id: "blade_98_requires_variant",
        input: "Blade 98",
        expected_status: "ambiguous"
    },
    {
        id: "blade_98_v10_requires_variant",
        input: "Blade 98 V10",
        expected_status: "ambiguous"
    },
    {
        id: "blade_98_16x19_specific",
        input: "Blade 98 16x19",
        expected_status: "resolved",
        expected_id: "wilson_blade_98_16x19_v10"
    },
    {
        id: "blade_98_18x20_specific",
        input: "Blade 98 18x20",
        expected_status: "resolved",
        expected_id: "wilson_blade_98_18x20_v10"
    },
    {
        id: "blade_98s_specific",
        input: "Blade 98S",
        expected_status: "resolved",
        expected_id: "wilson_blade_98s_v10"
    },
    {
        id: "blade_100_standard",
        input: "Blade 100",
        expected_status: "resolved",
        expected_id: "wilson_blade_100_v10"
    },
    {
        id: "blade_100_v10_standard",
        input: "Blade 100 V10",
        expected_status: "resolved",
        expected_id: "wilson_blade_100_v10"
    },
    {
        id: "speed_year_family",
        input: "Speed 2026",
        expected_status: "ambiguous"
    },
    {
        id: "speed_mp_specific",
        input: "Speed MP",
        expected_status: "resolved",
        expected_id: "head_speed_mp_2026"
    },
    {
        id: "speed_pro_specific",
        input: "Speed Pro",
        expected_status: "resolved",
        expected_id: "head_speed_pro_2026"
    },
    {
        id: "ezone_100_standard",
        input: "EZONE 100",
        expected_status: "resolved",
        expected_id: "yonex_ezone_100_blast_blue_2025"
    },
    {
        id: "ezone_98_2025_standard",
        input: "EZONE 98 2025",
        expected_status: "resolved",
        expected_id: "yonex_ezone_98_blast_blue_2025"
    }
];

let passed = 0;
let failed = 0;

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
        ok =
            result?.match?.id ===
            testCase.expected_id;
    }

    if (ok) {
        passed += 1;

        console.log(
            "PASS",
            testCase.id,
            "=>",
            result?.status,
            result?.match?.id ?? ""
        );
    } else {
        failed += 1;

        console.log(
            "FAIL",
            testCase.id,
            "=>",
            JSON.stringify({
                status:
                    result?.status ?? null,

                match:
                    result?.match?.id ?? null,

                candidates:
                    (result?.candidates ?? [])
                        .slice(0, 5)
                        .map(
                            candidate =>
                                candidate?.id ??
                                null
                        )
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
