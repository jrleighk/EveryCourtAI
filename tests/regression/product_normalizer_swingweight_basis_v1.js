import {
    normalizeRacquetRecord
} from "../../engine/product_normalizer.js";


function normalize(
    specifications
) {

    return normalizeRacquetRecord(
        {
            id:
                "test_racquet",

            brand:
                "Test",

            model:
                "Test Racquet",

            specifications
        }
    );
}


const explicitUnstrung =
    normalize({
        swingweight_unstrung:
            290
    });


const explicitStrung =
    normalize({
        swingweight_strung:
            325
    });


const legacyGeneric =
    normalize({
        swing_weight:
            "around 335"
    });


const noSwingweight =
    normalize({});


const tests = [

    {
        id:
            "explicit_unstrung_value",

        pass:
            explicitUnstrung
                ?.specifications
                ?.swingweight ===
            290
    },

    {
        id:
            "explicit_unstrung_basis",

        pass:
            explicitUnstrung
                ?.specifications
                ?.swingweight_basis ===
            "unstrung"
    },

    {
        id:
            "explicit_strung_value",

        pass:
            explicitStrung
                ?.specifications
                ?.swingweight ===
            325
    },

    {
        id:
            "explicit_strung_basis",

        pass:
            explicitStrung
                ?.specifications
                ?.swingweight_basis ===
            "strung"
    },

    {
        id:
            "legacy_generic_value_preserved",

        pass:
            legacyGeneric
                ?.specifications
                ?.swingweight ===
            335
    },

    {
        id:
            "legacy_generic_basis_unknown",

        pass:
            legacyGeneric
                ?.specifications
                ?.swingweight_basis ===
            "unknown"
    },

    {
        id:
            "missing_value_null",

        pass:
            noSwingweight
                ?.specifications
                ?.swingweight ===
            null
    },

    {
        id:
            "missing_basis_null",

        pass:
            noSwingweight
                ?.specifications
                ?.swingweight_basis ===
            null
    }
];


console.log(
    "========================================"
);

console.log(
    "PRODUCT NORMALIZER SWINGWEIGHT BASIS V1"
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
