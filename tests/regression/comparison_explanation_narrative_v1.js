import {
  buildComparisonExplanationNarrative
} from "../../engine/comparison_explanation_narrative_v1.js";


const tests = [];


function test(
  id,
  pass
) {

  tests.push({
    id,
    pass:
      Boolean(
        pass
      )
  });
}


const synthesis = {
  engine:
    "comparison_explanation_synthesis",

  version:
    "1.0",

  success:
    true,

  status:
    "comparison_explanation_synthesis_ready",

  products: {
    product_a: {
      id:
        "babolat_pure_drive_spectra_edition_2026",

      brand:
        "Babolat",

      model:
        "Pure Drive Spectra Edition 2026",

      display_name:
        "Babolat Pure Drive Spectra Edition 2026"
    },

    product_b: {
      id:
        "wilson_rf_01_pro_classic",

      brand:
        "Wilson",

      model:
        "RF 01 Pro Classic",

      display_name:
        "Wilson RF 01 Pro Classic"
    }
  },

  clusters: {
    ease_and_demand: {
      id:
        "ease_and_demand",

      available:
        true,

      primary_product:
        "a",

      secondary_product:
        "b",

      evidence: [
        {
          key:
            "weight_unstrung_g",

          higher_product:
            "b",

          lower_product:
            "a"
        },

        {
          key:
            "balance_unstrung_mm",

          higher_product:
            "a",

          lower_product:
            "b"
        },

        {
          key:
            "swingweight",

          higher_product:
            "b",

          lower_product:
            "a"
        }
      ]
    },

    forgiveness: {
      id:
        "forgiveness",

      available:
        true,

      primary_product:
        "a",

      secondary_product:
        "b",

      evidence: [
        {
          key:
            "head_size_sq_in",

          higher_product:
            "a",

          lower_product:
            "b"
        }
      ]
    },

    stability_and_plow: {
      id:
        "stability_and_plow",

      available:
        true,

      primary_product:
        "b",

      secondary_product:
        "a",

      evidence: [
        {
          key:
            "weight_unstrung_g",

          higher_product:
            "b",

          lower_product:
            "a"
        },

        {
          key:
            "swingweight",

          higher_product:
            "b",

          lower_product:
            "a"
        }
      ]
    },

    performance_identity: {
      id:
        "performance_identity",

      available:
        true,

      evidence: [
        {
          key:
            "power",

          higher_product:
            "a",

          relation:
            "a_higher",

          value_a:
            9,

          value_b:
            8
        },

        {
          key:
            "control",

          higher_product:
            "b",

          relation:
            "b_higher",

          value_a:
            7,

          value_b:
            9
        },

        {
          key:
            "spin",

          higher_product:
            "equal",

          relation:
            "equal",

          value_a:
            8,

          value_b:
            8
        },

        {
          key:
            "comfort",

          higher_product:
            "equal",

          relation:
            "equal",

          value_a:
            8,

          value_b:
            8
        }
      ]
    }
  }
};


const result =
  buildComparisonExplanationNarrative(
    synthesis
  );


test(
  "narrative_success",
  result.success === true
);


test(
  "narrative_status",
  result.status ===
    "comparison_explanation_narrative_ready"
);


test(
  "cn_four_blocks",
  result.cn
    ?.blocks
    ?.length === 4
);


test(
  "en_four_blocks",
  result.en
    ?.blocks
    ?.length === 4
);


test(
  "cn_ease_block",
  result.cn
    ?.blocks
    ?.some(
      item =>
        item.id ===
          "ease_and_demand" &&
        item.text.includes(
          "更容易"
        )
    )
);


test(
  "cn_forgiveness_block",
  result.cn
    ?.blocks
    ?.some(
      item =>
        item.id ===
          "forgiveness" &&
        item.text.includes(
          "容错"
        )
    )
);


test(
  "cn_stability_block",
  result.cn
    ?.blocks
    ?.some(
      item =>
        item.id ===
          "stability_and_plow" &&
        item.text.includes(
          "稳定"
        )
    )
);


test(
  "cn_performance_identity",
  result.cn
    ?.blocks
    ?.some(
      item =>
        item.id ===
          "performance_identity" &&
        item.text.includes(
          "力量"
        ) &&
        item.text.includes(
          "控制"
        )
    )
);


test(
  "en_ease_block",
  result.en
    ?.blocks
    ?.some(
      item =>
        item.id ===
          "ease_and_demand" &&
        item.text.includes(
          "easier"
        )
    )
);


test(
  "en_forgiveness_block",
  result.en
    ?.blocks
    ?.some(
      item =>
        item.id ===
          "forgiveness" &&
        item.text.includes(
          "forgiveness"
        )
    )
);


test(
  "en_stability_block",
  result.en
    ?.blocks
    ?.some(
      item =>
        item.id ===
          "stability_and_plow" &&
        item.text.includes(
          "stability"
        )
    )
);


test(
  "product_a_name_present",
  result.cn
    ?.blocks
    ?.some(
      item =>
        item.text.includes(
          "Pure Drive Spectra Edition 2026"
        )
    )
);


test(
  "product_b_name_present",
  result.cn
    ?.blocks
    ?.some(
      item =>
        item.text.includes(
          "RF 01 Pro Classic"
        )
    )
);


test(
  "fr_native_blocks",
  Array.isArray(
    result.fr?.blocks
  ) &&
  result.fr.blocks.length > 0 &&
  result.fr.blocks.some(
    item =>
      typeof item?.text === "string" &&
      (
        item.text.includes("stabilité") ||
        item.text.includes("puissance") ||
        item.text.includes("tolérance") ||
        item.text.includes("swingweight")
      )
  )
);


test(
  "es_native_blocks",
  Array.isArray(
    result.es?.blocks
  ) &&
  result.es.blocks.length > 0 &&
  result.es.blocks.some(
    item =>
      typeof item?.text === "string" &&
      (
        item.text.includes("estabilidad") ||
        item.text.includes("potencia") ||
        item.text.includes("tolerancia") ||
        item.text.includes("swingweight")
      )
  )
);


test(
  "ja_native_blocks",
  Array.isArray(
    result.ja?.blocks
  ) &&
  result.ja.blocks.length > 0 &&
  result.ja.blocks.some(
    item =>
      typeof item?.text === "string" &&
      (
        item.text.includes("安定") ||
        item.text.includes("パワー") ||
        item.text.includes("寛容") ||
        item.text.includes("スイングウェイト")
      )
  )
);


test(
  "native_product_names_preserved",
  [
    result.fr,
    result.es,
    result.ja
  ].every(
    languageResult =>
      languageResult
        ?.blocks
        ?.some(
          item =>
            item.text.includes(
              "Pure Drive Spectra Edition 2026"
            ) ||
            item.text.includes(
              "RF 01 Pro Classic"
            )
        )
  )
);



const invalid =
  buildComparisonExplanationNarrative(
    null
  );


test(
  "invalid_input_rejected",
  invalid.success === false &&
  invalid.status ===
    "comparison_explanation_narrative_not_ready"
);


console.log(
  "========================================"
);

console.log(
  "COMPARISON EXPLANATION NARRATIVE V1"
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
  "========================================"
);

console.log(
  "REGRESSION SUMMARY"
);

console.log(
  "========================================"
);

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
  failed > 0
) {
  process.exitCode = 1;
}
