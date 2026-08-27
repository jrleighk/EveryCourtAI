import {
  buildComparisonLanguage
} from "../../engine/comparison_language_builder_v1.js";


function createAnswerFixture() {
  return {
    engine:
      "comparison_answer_builder",

    version:
      "1.0",

    success:
      true,

    status:
      "comparison_answer_ready",

    products: {
      product_a: {
        id:
          "babolat_pure_drive_spectra_edition_2026",

        brand:
          "Babolat",

        model:
          "Pure Drive Spectra Edition 2026",

        release_year:
          2026,

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

        release_year:
          null,

        display_name:
          "Wilson RF 01 Pro Classic"
      }
    },

    objective: {
      available:
        true,

      dna: [
        {
          key:
            "power",

          label: {
            en:
              "Power",

            cn:
              "力量"
          },

          value_a:
            9,

          value_b:
            8,

          delta:
            1,

          relation:
            "a_higher",

          higher_product:
            "a"
        },

        {
          key:
            "control",

          label: {
            en:
              "Control",

            cn:
              "控制"
          },

          value_a:
            7,

          value_b:
            9,

          delta:
            -2,

          relation:
            "b_higher",

          higher_product:
            "b"
        },

        {
          key:
            "spin",

          label: {
            en:
              "Spin",

            cn:
              "旋转"
          },

          value_a:
            8,

          value_b:
            8,

          delta:
            0,

          relation:
            "equal",

          higher_product:
            "equal"
        }
      ],

      specifications: [
        {
          key:
            "head_size_sq_in",

          label: {
            en:
              "Head Size",

            cn:
              "拍面"
          },

          value_a:
            100,

          value_b:
            98,

          delta:
            2,

          relation:
            "a_higher",

          higher_product:
            "a"
        },

        {
          key:
            "weight_unstrung_g",

          label: {
            en:
              "Unstrung Weight",

            cn:
              "空拍重量"
          },

          value_a:
            300,

          value_b:
            320,

          delta:
            -20,

          relation:
            "b_higher",

          higher_product:
            "b"
        },

        {
          key:
            "swingweight",

          label: {
            en:
              "Swingweight",

            cn:
              "挥重"
          },

          value_a:
            290,

          value_b:
            335,

          delta:
            -45,

          relation:
            "b_higher",

          higher_product:
            "b"
        },

        {
          key:
            "string_pattern",

          label: {
            en:
              "String Pattern",

            cn:
              "线床"
          },

          value_a:
            "16x19",

          value_b:
            "16x19",

          delta:
            null,

          relation:
            "equal",

          higher_product:
            "equal"
        }
      ],

      data_quality:
        null
    },

    player_fit: {
      available:
        true
    },

    decision: {
      performance_preference: {
        available:
          true,

        preferred_product:
          "a",

        reason:
          "higher_player_fit",

        delta:
          1
      },

      practical_preference: {
        available:
          true,

        preferred_product:
          "b",

        reason:
          "higher_practical_score",

        delta:
          -5
      }
    }
  };
}


const answer =
  createAnswerFixture();


const result =
  buildComparisonLanguage(
    answer
  );


const tests = [
  {
    id:
      "language_success",

    pass:
      result.success ===
      true
  },

  {
    id:
      "language_status",

    pass:
      result.status ===
      "comparison_language_ready"
  },

  {
    id:
      "chinese_title",

    pass:
      result.cn?.title ===
      "Babolat Pure Drive Spectra Edition 2026 与 Wilson RF 01 Pro Classic 对比"
  },

  {
    id:
      "english_title",

    pass:
      result.en?.title ===
      "Babolat Pure Drive Spectra Edition 2026 vs Wilson RF 01 Pro Classic"
  },

  {
    id:
      "chinese_dna_count",

    pass:
      result.cn
        ?.objective
        ?.dna
        ?.length ===
      3
  },

  {
    id:
      "english_dna_count",

    pass:
      result.en
        ?.objective
        ?.dna
        ?.length ===
      3
  },

  {
    id:
      "chinese_specification_count",

    pass:
      result.cn
        ?.objective
        ?.specifications
        ?.length ===
      4
  },

  {
    id:
      "english_specification_count",

    pass:
      result.en
        ?.objective
        ?.specifications
        ?.length ===
      4
  },

  {
    id:
      "chinese_power_sentence",

    pass:
      result.cn
        ?.objective
        ?.dna
        ?.[0] ===
      "力量方面，Pure Drive Spectra Edition 2026为9，高于RF 01 Pro Classic的8。"
  },

  {
    id:
      "english_power_sentence",

    pass:
      result.en
        ?.objective
        ?.dna
        ?.[0] ===
      "For power, Pure Drive Spectra Edition 2026 is 9, higher than RF 01 Pro Classic at 8."
  },

  {
    id:
      "chinese_equal_sentence",

    pass:
      result.cn
        ?.objective
        ?.dna
        ?.[2] ===
      "旋转方面，两支球拍相同，均为8。"
  },

  {
    id:
      "english_equal_sentence",

    pass:
      result.en
        ?.objective
        ?.dna
        ?.[2] ===
      "For spin, both racquets are equal at 8."
  },

  {
    id:
      "chinese_weight_units",

    pass:
      result.cn
        ?.objective
        ?.specifications
        ?.[1]
        ?.includes(
          "320 g"
        ) ===
      true
  },

  {
    id:
      "english_head_size_units",

    pass:
      result.en
        ?.objective
        ?.specifications
        ?.[0]
        ?.includes(
          "100 sq in"
        ) ===
      true
  },

  {
    id:
      "chinese_player_decision_count",

    pass:
      result.cn
        ?.player_fit
        ?.decision
        ?.length ===
      2
  },

  {
    id:
      "english_player_decision_count",

    pass:
      result.en
        ?.player_fit
        ?.decision
        ?.length ===
      2
  },

  {
    id:
      "performance_decision",

    pass:
      result.cn
        ?.player_fit
        ?.decision
        ?.[0]
        ?.includes(
          "Babolat Pure Drive Spectra Edition 2026"
        ) ===
      true
  },

  {
    id:
      "practical_decision",

    pass:
      result.cn
        ?.player_fit
        ?.decision
        ?.[1]
        ?.includes(
          "Wilson RF 01 Pro Classic"
        ) ===
      true
  }
];


const invalid =
  buildComparisonLanguage(
    null
  );


tests.push(
  {
    id:
      "invalid_input_rejected",

    pass:
      invalid.success ===
        false &&
      invalid.status ===
        "comparison_language_not_ready"
  }
);


console.log(
  "========================================"
);

console.log(
  "COMPARISON LANGUAGE BUILDER V1"
);

console.log(
  "========================================"
);


console.table(
  tests
);


const passed =
  tests.filter(
    test =>
      test.pass
  ).length;


const failed =
  tests.length -
  passed;


console.log(
  ""
);

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


if (
  failed > 0
) {

  console.log(
    ""
  );

  console.log(
    "RESULT: FAIL"
  );

  process.exit(
    1
  );
}


console.log(
  ""
);

console.log(
  "RESULT: PASS"
);
