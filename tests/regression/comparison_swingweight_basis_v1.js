import {
    analyzeRacquetComparison
} from "../../engine/comparison_analysis_engine_v1.js";


function product(
    id,
    swingweight,
    basis
) {

    return {
        id,

        identity: {
            brand:
                "Test",

            model:
                id
        },

        specifications: {
            swingweight,
            swingweight_basis:
                basis
        },

        core_dna: {},

        data_quality: {}
    };
}


const sameUnstrung =
    analyzeRacquetComparison(
        product(
            "a",
            290,
            "unstrung"
        ),

        product(
            "b",
            300,
            "unstrung"
        )
    );


const sameStrung =
    analyzeRacquetComparison(
        product(
            "a",
            320,
            "strung"
        ),

        product(
            "b",
            335,
            "strung"
        )
    );


const mismatch =
    analyzeRacquetComparison(
        product(
            "a",
            290,
            "unstrung"
        ),

        product(
            "b",
            335,
            "strung"
        )
    );


const unknownPair =
    analyzeRacquetComparison(
        product(
            "a",
            290,
            "unknown"
        ),

        product(
            "b",
            335,
            "unknown"
        )
    );


const partialUnknown =
    analyzeRacquetComparison(
        product(
            "a",
            290,
            "unstrung"
        ),

        product(
            "b",
            335,
            "unknown"
        )
    );


const tests = [

    {
        id:
            "same_unstrung_available",

        pass:
            sameUnstrung
                ?.specifications
                ?.swingweight
                ?.available ===
            true
    },

    {
        id:
            "same_unstrung_basis_preserved",

        pass:
            sameUnstrung
                ?.specifications
                ?.swingweight
                ?.basis_a ===
            "unstrung" &&
            sameUnstrung
                ?.specifications
                ?.swingweight
                ?.basis_b ===
            "unstrung"
    },

    {
        id:
            "same_strung_available",

        pass:
            sameStrung
                ?.specifications
                ?.swingweight
                ?.available ===
            true
    },

    {
        id:
            "basis_mismatch_unavailable",

        pass:
            mismatch
                ?.specifications
                ?.swingweight
                ?.available ===
            false
    },

    {
        id:
            "basis_mismatch_has_reason",

        pass:
            mismatch
                ?.specifications
                ?.swingweight
                ?.reason ===
            "measurement_basis_unverified"
    },

    {
        id:
            "unknown_pair_unavailable",

        pass:
            unknownPair
                ?.specifications
                ?.swingweight
                ?.available ===
            false
    },

    {
        id:
            "partial_unknown_unavailable",

        pass:
            partialUnknown
                ?.specifications
                ?.swingweight
                ?.available ===
            false
    },

    {
        id:
            "unavailable_preserves_raw_values",

        pass:
            mismatch
                ?.specifications
                ?.swingweight
                ?.value_a ===
            290 &&
            mismatch
                ?.specifications
                ?.swingweight
                ?.value_b ===
            335
    }
];


console.log(
    "========================================"
);

console.log(
    "COMPARISON SWINGWEIGHT BASIS V1"
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
