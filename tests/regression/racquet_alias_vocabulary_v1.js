import {
    resolveRacquet
} from "../../engine/product_resolver.js";


const cases = [

    // Babolat
    ["pd_family", "PD", "ambiguous", null, "Pure Drive"],
    ["pa_family", "PA", "ambiguous", null, "Pure Aero"],
    ["pure_aero_family", "Pure Aero", "ambiguous", null, "Pure Aero"],
    ["pure_strike_family", "Pure Strike", "ambiguous", null, "Pure Strike"],

    // Wilson
    ["blade_family", "Blade", "ambiguous", null, "Blade"],
    ["pro_staff_family", "Pro Staff", "ambiguous", null, "Pro Staff"],
    ["ultra_family", "Ultra", "ambiguous", null, "Ultra"],
    ["clash_family", "Clash", "ambiguous", null, "Clash"],
    ["shift_family", "Shift", "ambiguous", null, "Shift"],
    ["defy_family", "Defy", "ambiguous", null, "Defy"],
    ["rf_family", "RF", "ambiguous", null, "RF"],

    // HEAD
    ["speed_family", "Speed", "ambiguous", null, "Speed"],
    ["boom_family", "Boom", "ambiguous", null, "Boom"],
    ["extreme_family", "Extreme", "ambiguous", null, "Extreme"],
    ["gravity_family", "Gravity", "ambiguous", null, "Gravity"],
    ["radical_family", "Radical", "ambiguous", null, "Radical"],

    // Yonex
    ["ezone_family", "EZONE", "ambiguous", null, "EZONE"],
    ["ezone_case_normalization", "Ezone", "ambiguous", null, "EZONE"],
    ["vcore_family", "VCORE", "ambiguous", null, "VCORE"],
    ["vcore_case_normalization", "Vcore", "ambiguous", null, "VCORE"],
    ["percept_family", "PERCEPT", "ambiguous", null, "PERCEPT"],
    ["percept_case_normalization", "Percept", "ambiguous", null, "PERCEPT"],
    ["muse_family", "MUSE", "ambiguous", null, "MUSE"],

    // Specific products must remain resolvable
    [
        "speed_mp_specific",
        "Speed MP",
        "resolved",
        "head_speed_mp_2026",
        null
    ],
    [
        "speed_pro_specific",
        "Speed Pro",
        "resolved",
        "head_speed_pro_2026",
        null
    ],
    [
        "rf01_specific",
        "RF01",
        "resolved",
        "wilson_rf_01_2024",
        null
    ],

    // Safety / intentionally unsupported
    ["ps_multi_meaning", "PS", "not_found", null, null],
    ["unsafe_nickname", "小黑拍", "not_found", null, null],
    ["player_association", "德约的拍子", "not_found", null, null],
    ["generation_inference", "上一代PD", "not_found", null, null]
];


const rows = [];
let passed = 0;


for (const [
    id,
    query,
    expectedStatus,
    expectedId,
    expectedSeries
] of cases) {

    const result =
        resolveRacquet(query);

    const actualStatus =
        result.status ?? null;

    const actualId =
        result.match?.id ?? null;

    const actualSeries =
        result.canonical_series ??
        result.alias?.canonical_series ??
        result.resolution?.canonical_series ??
        null;

    const statusPass =
        actualStatus === expectedStatus;

    const idPass =
        expectedId === null
            ? actualId === null
            : actualId === expectedId;

    /*
     * Alias resolver implementations may expose canonical_series
     * directly or only through candidate products.
     * For ambiguous series, verify candidate membership as fallback.
     */
    let seriesPass = true;

    if (expectedSeries !== null) {

        if (actualSeries !== null) {
            seriesPass =
                String(actualSeries).toLowerCase() ===
                String(expectedSeries).toLowerCase();
        } else {

            const candidates =
                result.candidates ?? [];

            seriesPass =
                candidates.length > 0 &&
                candidates.every(candidate => {

                    const series =
                        candidate.series ??
                        candidate.product?.series ??
                        null;

                    return (
                        series === null ||
                        String(series).toLowerCase() ===
                        String(expectedSeries).toLowerCase()
                    );
                });
        }
    }

    const pass =
        statusPass &&
        idPass &&
        seriesPass;

    if (pass) {
        passed += 1;
    }

    rows.push({
        id,
        query,
        status: actualStatus,
        id_value: actualId ?? "",
        expected_series: expectedSeries ?? "",
        pass
    });
}


console.log(
    "========================================"
);

console.log(
    "RACQUET ALIAS VOCABULARY V1"
);

console.log(
    "========================================"
);

console.table(rows);

console.log("");

console.log(
    "Total:",
    rows.length
);

console.log(
    "Passed:",
    passed
);

console.log(
    "Failed:",
    rows.length - passed
);

console.log("");

if (passed !== rows.length) {

    console.log(
        "RESULT: FAIL"
    );

    process.exit(1);
}

console.log(
    "RESULT: PASS"
);
