import {
    runComparisonOrchestrator
} from "../../engine/comparison_orchestrator_v1.js";

import {
    buildComparisonViewModel
} from "../../engine/comparison_view_model_v1.js";


console.log(
    "========================================"
);

console.log(
    "COMPARISON VIEW MODEL V1"
);

console.log(
    "========================================"
);


const comparison =
    await runComparisonOrchestrator({
        message:
            "比较 Babolat Pure Drive Spectra Edition 2026 和 Wilson RF 01 Pro Classic",
        language:
            "zh"
    });


const view =
    buildComparisonViewModel(
        comparison,
        "zh"
    );


const invalidView =
    buildComparisonViewModel(
        null,
        "zh"
    );


const assertions = [

    {
        id: "view_success",
        pass:
            view.success === true
    },

    {
        id: "view_available",
        pass:
            view.available === true
    },

    {
        id: "view_status",
        pass:
            view.status ===
            "comparison_view_ready"
    },

    {
        id: "language_zh",
        pass:
            view.language === "zh"
    },

    {
        id: "product_a_identity",
        pass:
            view
                ?.products
                ?.product_a
                ?.id ===
            "babolat_pure_drive_spectra_edition_2026"
    },

    {
        id: "product_b_identity",
        pass:
            view
                ?.products
                ?.product_b
                ?.id ===
            "wilson_rf_01_pro_classic"
    },

    {
        id: "summary_title",
        pass:
            typeof view
                ?.summary
                ?.title ===
            "string"
    },

    {
        id: "summary_narrative",
        pass:
            Array.isArray(
                view
                    ?.summary
                    ?.narrative
            ) &&
            view
                .summary
                .narrative
                .length >= 4
    },

    {
        id: "dna_dimensions",
        pass:
            Array.isArray(
                view.dimensions
            ) &&
            view.dimensions.length === 4
    },

    {
        id: "power_dimension",
        pass:
            view.dimensions.some(
                item =>
                    item.key === "power" &&
                    item.product_a === 9 &&
                    item.product_b === 8
            )
    },

    {
        id: "specifications_available",
        pass:
            Array.isArray(
                view.specifications
            ) &&
            view.specifications.length > 0
    },

    {
        id: "weight_spec",
        pass:
            view.specifications.some(
                item =>
                    item.key ===
                        "weight_unstrung_g" &&
                    item.product_a === 300 &&
                    item.product_b === 320
            )
    },

    {
        id: "player_fit_contract",
        pass:
            typeof view
                ?.player_fit
                ?.available ===
            "boolean"
    },

    {
        id: "decision_contract",
        pass:
            typeof view
                ?.decision
                ?.status ===
            "string"
    },

    {
        id: "tradeoffs_available",
        pass:
            Array.isArray(
                view.tradeoffs
            ) &&
            view.tradeoffs.length >= 3
    },

    {
        id: "data_quality_available",
        pass:
            view
                ?.data_quality
                ?.available === true
    },

    {
        id: "source_file_hidden",
        pass:
            !Object.prototype.hasOwnProperty.call(
                view
                    ?.data_quality
                    ?.product_a ?? {},
                "source_file"
            )
    },

    {
        id: "internal_extraction_hidden",
        pass:
            !Object.prototype.hasOwnProperty.call(
                view,
                "extraction"
            )
    },

    {
        id: "internal_semantics_hidden",
        pass:
            !Object.prototype.hasOwnProperty.call(
                view,
                "semantics"
            )
    },

    {
        id: "invalid_rejected",
        pass:
            invalidView.success === false &&
            invalidView.available === false
    }

];


console.table(
    assertions
);


const passed =
    assertions.filter(
        item => item.pass
    ).length;

const failed =
    assertions.length -
    passed;


console.log("");
console.log(
    "========================================"
);

console.log(
    "REGRESSION SUMMARY"
);

console.log(
    "========================================"
);

console.log(
    `Total: ${assertions.length}`
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
    failed > 0
) {
    process.exitCode = 1;
}
