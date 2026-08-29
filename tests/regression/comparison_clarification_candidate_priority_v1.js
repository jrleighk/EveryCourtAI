import {
    extractComparisonTargets
} from "../../engine/comparison_target_extractor_v1.js";

import {
    buildComparisonClarificationAnswer
} from "../../engine/comparison_clarification_answer_builder_v1.js";


function build(
    query
) {

    const extraction =
        extractComparisonTargets(
            query
        );


    const target =
        extraction
            ?.targets
            ?.[0];


    return buildComparisonClarificationAnswer({
        unresolvedTargets: [
            target
        ],

        locale:
            "en",

        maxCandidates:
            5
    });
}


const blade =
    build(
        "比较 Blade 和 RF01 Pro Classic"
    );


const speed =
    build(
        "比较 Speed 和 RF01 Pro Classic"
    );


const ezone =
    build(
        "比较 EZONE 和 RF01 Pro Classic"
    );


const bladeLabels =
    blade.candidates.map(
        item =>
            item.label
    );


const speedLabels =
    speed.candidates.map(
        item =>
            item.label
    );


const ezoneLabels =
    ezone.candidates.map(
        item =>
            item.label
    );


const tests = [

    {
        id:
            "blade_core_before_kith",

        pass:
            bladeLabels.length >
                0 &&
            !bladeLabels[0]
                .toLowerCase()
                .includes(
                    "kith"
                )
    },

    {
        id:
            "blade_special_not_first",

        pass:
            !bladeLabels
                .slice(
                    0,
                    3
                )
                .some(
                    label =>
                        label
                            .toLowerCase()
                            .includes(
                                "kith"
                            ) ||
                        label
                            .toLowerCase()
                            .includes(
                                "us open"
                            )
                )
    },

    {
        id:
            "speed_mp_first",

        pass:
            speedLabels[0]
                ?.includes(
                    "Speed MP 2026"
                ) ===
            true
    },

    {
        id:
            "speed_standard_before_gucci",

        pass:
            speedLabels.length >
                0 &&
            !speedLabels[0]
                .toLowerCase()
                .includes(
                    "gucci"
                ) &&
            (
                !speedLabels.some(
                    label =>
                        label
                            .toLowerCase()
                            .includes(
                                "gucci"
                            )
                ) ||
                speedLabels.findIndex(
                    label =>
                        label
                            .toLowerCase()
                            .includes(
                                "gucci"
                            )
                ) >
                speedLabels.findIndex(
                    label =>
                        label
                            .toLowerCase()
                            .includes(
                                "speed mp 2026"
                            )
                )
            )
    },

    {
        id:
            "speed_legend_not_first",

        pass:
            !speedLabels[0]
                ?.toLowerCase()
                .includes(
                    "legend"
                )
    },

    {
        id:
            "ezone_special_not_first",

        pass:
            !ezoneLabels[0]
                ?.toLowerCase()
                .includes(
                    "osaka"
                )
    },

    {
        id:
            "ezone_core_visible",

        pass:
            ezoneLabels.some(
                label =>
                    label.includes(
                        "EZONE 100"
                    ) ||
                    label.includes(
                        "EZONE 98"
                    )
            )
    }
];


console.log(
    "========================================"
);

console.log(
    "COMPARISON CLARIFICATION CANDIDATE PRIORITY V1"
);

console.log(
    "========================================"
);

console.log("");

console.log(
    "BLADE:",
    bladeLabels
);

console.log(
    "SPEED:",
    speedLabels
);

console.log(
    "EZONE:",
    ezoneLabels
);

console.log("");

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

if (
    failed >
    0
) {

    console.log(
        "RESULT: FAIL"
    );

    process.exitCode =
        1;

} else {

    console.log(
        "RESULT: PASS"
    );
}
