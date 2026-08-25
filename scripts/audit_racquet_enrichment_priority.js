import fs from "node:fs";
import path from "node:path";

import {
  normalizeRacquetRecord
} from "../engine/product_normalizer.js";

import {
  evaluateRacquetDataQuality
} from "../engine/product_data_quality.js";


const ROOT =
  process.cwd();

const RACQUET_ROOT =
  path.join(
    ROOT,
    "knowledge",
    "racquets"
  );


function walk(directory) {
  const files = [];

  for (
    const entry
    of fs.readdirSync(
      directory,
      {
        withFileTypes: true
      }
    )
  ) {
    const full =
      path.join(
        directory,
        entry.name
      );

    if (
      entry.isDirectory()
    ) {
      files.push(
        ...walk(full)
      );

      continue;
    }

    if (
      entry.isFile() &&
      entry.name.endsWith(".json")
    ) {
      files.push(full);
    }
  }

  return files;
}


function canonicalBrand(
  brand
) {
  const key =
    String(
      brand ?? ""
    )
      .trim()
      .toLowerCase();

  const mapping = {
    head: "HEAD",
    wilson: "Wilson",
    babolat: "Babolat",
    yonex: "Yonex",
    dunlop: "Dunlop",
    tecnifibre: "Tecnifibre",
    lacoste: "Lacoste"
  };

  return (
    mapping[key] ??
    brand ??
    "UNKNOWN"
  );
}


function isSpecialProduct(
  file
) {
  const normalized =
    file
      .toLowerCase()
      .replaceAll("\\", "/");

  return (
    normalized.includes(
      "/special_editions/"
    ) ||
    normalized.includes(
      "/collaborations/"
    )
  );
}


function normalizedProductText(
  id,
  model
) {
  return `${id ?? ""} ${model ?? ""}`
    .toLowerCase()
    .replace(
      /[_\-]+/g,
      " "
    );
}


function isJuniorOrCollector(
  id,
  model
) {
  const text =
    normalizedProductText(
      id,
      model
    );

  const patterns = [
    "tour 26",
    "junior",
    "jr ",
    "26 inch",
    "25 inch",
    "23 inch",
    "collector",
    "tennis set"
  ];

  return patterns.some(
    pattern =>
      text.includes(
        pattern
      )
  );
}


/**
 * ============================================================
 * Core Recommendation Families
 *
 * These are not performance scores.
 * They only define enrichment priority.
 * ============================================================
 */

function isCoreRecommendationFamily(
  brand,
  id,
  model
) {
  const text =
    normalizedProductText(
      id,
      model
    );

  const normalizedBrand =
    canonicalBrand(
      brand
    );


  if (
    normalizedBrand === "Yonex"
  ) {
    return (
      text.includes("ezone") ||
      text.includes("vcore") ||
      text.includes("percept")
    );
  }


  if (
    normalizedBrand === "Dunlop"
  ) {
    return (
      text.includes("fx 500") ||
      text.includes("cx 200") ||
      text.includes("sx 300")
    );
  }


  if (
    normalizedBrand === "HEAD"
  ) {
    return (
      text.includes("gravity") ||
      text.includes("radical") ||
      text.includes("boom")
    );
  }


  if (
    normalizedBrand === "Tecnifibre"
  ) {
    return (
      text.includes("t fight") ||
      text.includes("tf 40")
    );
  }


  if (
    normalizedBrand === "Babolat"
  ) {
    return (
      text.includes("pure drive") ||
      text.includes("pure aero") ||
      text.includes("pure strike")
    );
  }


  if (
    normalizedBrand === "Wilson"
  ) {
    return (
      text.includes("blade") ||
      text.includes("pro staff") ||
      text.includes("rf 01") ||
      text.includes("clash") ||
      text.includes("ultra") ||
      text.includes("shift")
    );
  }


  return false;
}


/**
 * ============================================================
 * Secondary / Lightweight Variants
 *
 * These remain valid products, but they are not Phase 1
 * enrichment priorities unless separately promoted later.
 * ============================================================
 */

function isSecondaryVariant(
  id,
  model
) {
  const text =
    normalizedProductText(
      id,
      model
    );


  const patterns = [
    " team",
    " team ",
    " lite",
    " light",
    " mp l",
    " 100l",
    " 98l",
    " 97l",
    " 100sl",
    " alpha",
    " muse",
    " 260",
    " 265",
    " 270",
    " 275",
    " 285",
    " ls",
    " os",
    " plus",
    "100+",
    "98+"
  ];


  return patterns.some(
    pattern =>
      text.includes(
        pattern
      )
  );
}


/**
 * ============================================================
 * Priority Classification
 * ============================================================
 */

function classifyPriority({
  file,
  normalized,
  quality
}) {
  const brand =
    canonicalBrand(
      normalized
        ?.identity
        ?.brand
    );


  const id =
    normalized.id;


  const model =
    normalized
      ?.identity
      ?.model;


  if (
    isSpecialProduct(
      file
    ) ||
    isJuniorOrCollector(
      id,
      model
    )
  ) {
    return {
      tier: "C",
      priority_score: 0,
      reason:
        "collector_collaboration_or_junior"
    };
  }


  const coreFamily =
    isCoreRecommendationFamily(
      brand,
      id,
      model
    );


  const secondary =
    isSecondaryVariant(
      id,
      model
    );


  /**
   * Tier A:
   * Mainline adult performance models.
   */

  if (
    coreFamily &&
    !secondary
  ) {
    return {
      tier: "A",
      priority_score: 100,
      reason:
        "core_mainline_performance"
    };
  }


  /**
   * Tier B:
   * Valid production products, but lower first-pass priority.
   */

  return {
    tier: "B",
    priority_score: 50,
    reason:
      secondary
        ? "secondary_or_lightweight_variant"
        : "extended_production_model"
  };
}


const products = [];


for (
  const file
  of walk(
    RACQUET_ROOT
  )
) {
  const raw =
    JSON.parse(
      fs.readFileSync(
        file,
        "utf8"
      )
    );

  const relativeFile =
    path.relative(
      ROOT,
      file
    );

  const normalized =
    normalizeRacquetRecord(
      raw,
      {
        source_file:
          relativeFile
      }
    );

  const quality =
    evaluateRacquetDataQuality(
      normalized
    );

  if (
    quality.confidence_tier !==
    "low"
  ) {
    continue;
  }

  const classification =
    classifyPriority({
      file:
        relativeFile,

      normalized,

      quality
    });


  products.push({
    tier:
      classification.tier,

    priority_score:
      classification
        .priority_score,

    priority_reason:
      classification.reason,

    id:
      normalized.id,

    brand:
      canonicalBrand(
        normalized
          ?.identity
          ?.brand
      ),

    model:
      normalized
        ?.identity
        ?.model,

    evidence:
      quality
        .evidence_score,

    ranking_eligible:
      quality
        .ranking_eligible,

    special:
      isSpecialProduct(
        relativeFile
      ),

    missing_critical:
      (
        quality
          .missing_critical_fields ??
        []
      ).join(", "),

    missing_dna:
      (
        quality
          .missing_core_dna_fields ??
        []
      ).join(", "),

    file:
      relativeFile
  });
}


products.sort(
  (a, b) =>
    b.priority_score -
    a.priority_score ||
    a.brand.localeCompare(
      b.brand
    ) ||
    a.model.localeCompare(
      b.model
    )
);


console.log(
  "\n========================================"
);

console.log(
  "ECL RACQUET ENRICHMENT PRIORITY V1"
);

console.log(
  "========================================\n"
);


const summary = {
  tier_A:
    products.filter(
      item =>
        item.tier === "A"
    ).length,

  tier_B:
    products.filter(
      item =>
        item.tier === "B"
    ).length,

  tier_C:
    products.filter(
      item =>
        item.tier === "C"
    ).length,

  total_low_confidence:
    products.length
};


console.table(
  summary
);


for (
  const tier
  of [
    "A",
    "B",
    "C"
  ]
) {
  console.log(
    `\n========================================`
  );

  console.log(
    `TIER ${tier}`
  );

  console.log(
    `========================================`
  );

  console.table(
    products
      .filter(
        item =>
          item.tier === tier
      )
      .map(
        item => ({
          brand:
            item.brand,

          model:
            item.model,

          score:
            item.priority_score,

          evidence:
            item.evidence,

          eligible:
            item.ranking_eligible,

          special:
            item.special,

          file:
            item.file
        })
      )
  );
}
