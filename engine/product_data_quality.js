/**
 * ============================================================
 * EveryCourtAI
 * Product Data Quality
 * Version: 1.0
 * ============================================================
 *
 * Purpose:
 *
 * Evaluate normalized product data quality without changing
 * the underlying product facts.
 *
 * Principles:
 *
 * 1. Missing data is NOT negative product performance.
 * 2. Missing data lowers evidence confidence only.
 * 3. Racquets and strings use different quality rules.
 * 4. Ranking eligibility is based on minimum usable evidence.
 *
 * ============================================================
 */


const DATA_QUALITY_VERSION =
  "1.0";


/**
 * ============================================================
 * Generic Helpers
 * ============================================================
 */

function isPlainObject(
  value
) {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}


function isPopulated(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return false;
  }


  if (
    Array.isArray(value)
  ) {
    return value.length > 0;
  }


  return true;
}


function clamp01(
  value
) {
  return Math.min(
    1,
    Math.max(
      0,
      value
    )
  );
}


function round4(
  value
) {
  return Number(
    value.toFixed(4)
  );
}


function weightedCompleteness(
  object,
  weights
) {
  if (
    !isPlainObject(object)
  ) {
    return 0;
  }


  let possible = 0;
  let earned = 0;


  for (
    const [
      field,
      weight
    ]
    of Object.entries(
      weights
    )
  ) {
    possible += weight;


    if (
      isPopulated(
        object[field]
      )
    ) {
      earned += weight;
    }
  }


  if (
    possible <= 0
  ) {
    return 0;
  }


  return round4(
    clamp01(
      earned /
      possible
    )
  );
}


function collectMissingFields(
  object,
  fields
) {
  const missing = [];


  for (
    const field
    of fields
  ) {
    if (
      !isPopulated(
        object?.[field]
      )
    ) {
      missing.push(
        field
      );
    }
  }


  return missing;
}


/**
 * ============================================================
 * Confidence Tier
 * ============================================================
 */

function getConfidenceTier(
  score
) {
  if (
    score >= 0.8
  ) {
    return "high";
  }


  if (
    score >= 0.55
  ) {
    return "medium";
  }


  return "low";
}


/**
 * ============================================================
 * Racquet Quality Rules
 * ============================================================
 */

const RACQUET_SPEC_WEIGHTS = {
  head_size_sq_in: 1.2,
  weight_unstrung_g: 1.4,
  weight_strung_g: 0.5,
  balance_unstrung_mm: 1.0,
  balance_strung_mm: 0.2,
  length_in: 0.4,
  string_pattern: 1.0,
  swingweight: 1.2,
  stiffness_ra: 1.0,
  beam_mm: 0.5
};


const RACQUET_DNA_WEIGHTS = {
  power: 1.0,
  control: 1.2,
  spin: 1.0,
  comfort: 1.0,
  stability: 0.8,
  maneuverability: 0.8,
  forgiveness: 0.3
};


const RACQUET_CRITICAL_FIELDS = [
  "head_size_sq_in",
  "weight_unstrung_g",
  "string_pattern"
];


const RACQUET_CORE_DNA_FIELDS = [
  "power",
  "control",
  "spin",
  "comfort"
];


export function evaluateRacquetDataQuality(
  normalizedRacquet
) {
  if (
    !normalizedRacquet ||
    normalizedRacquet
      .product_type !==
      "racquet"
  ) {
    throw new Error(
      "EveryCourtAI Product Data Quality: invalid normalized racquet."
    );
  }


  const specifications =
    normalizedRacquet
      .specifications ??
    {};


  const coreDna =
    normalizedRacquet
      .core_dna ??
    {};


  const specificationCompleteness =
    weightedCompleteness(
      specifications,
      RACQUET_SPEC_WEIGHTS
    );


  const performanceCompleteness =
    weightedCompleteness(
      coreDna,
      RACQUET_DNA_WEIGHTS
    );


  const missingCriticalFields =
    collectMissingFields(
      specifications,
      RACQUET_CRITICAL_FIELDS
    );


  const missingCoreDnaFields =
    collectMissingFields(
      coreDna,
      RACQUET_CORE_DNA_FIELDS
    );


  /**
   * Overall evidence score:
   *
   * Specifications = 55%
   * Performance DNA = 45%
   */

  const evidenceScore =
    round4(
      (
        specificationCompleteness *
        0.55
      ) +
      (
        performanceCompleteness *
        0.45
      )
    );


  const confidenceTier =
    getConfidenceTier(
      evidenceScore
    );


  /**
   * Ranking eligibility:
   *
   * Minimum:
   * - head size available
   * - at least one of:
   *     weight
   *     core performance DNA
   */

  const hasHeadSize =
    isPopulated(
      specifications
        .head_size_sq_in
    );


  const hasWeight =
    isPopulated(
      specifications
        .weight_unstrung_g
    );


  const hasCorePerformance =
    RACQUET_CORE_DNA_FIELDS
      .some(
        field =>
          isPopulated(
            coreDna[field]
          )
      );


  const rankingEligible =
    Boolean(
      hasHeadSize &&
      (
        hasWeight ||
        hasCorePerformance
      )
    );


  const warnings = [];


  if (
    missingCriticalFields.length >
    0
  ) {
    warnings.push(
      `Missing critical racquet fields: ${missingCriticalFields.join(", ")}`
    );
  }


  if (
    missingCoreDnaFields.length ===
    RACQUET_CORE_DNA_FIELDS.length
  ) {
    warnings.push(
      "No core racquet performance DNA available."
    );
  }


  if (
    !rankingEligible
  ) {
    warnings.push(
      "Racquet has insufficient evidence for normal ranking."
    );
  }


  return {
    product_id:
      normalizedRacquet.id,

    product_type:
      "racquet",

    specification_completeness:
      specificationCompleteness,

    performance_completeness:
      performanceCompleteness,

    evidence_score:
      evidenceScore,

    confidence_tier:
      confidenceTier,

    ranking_eligible:
      rankingEligible,

    missing_critical_fields:
      missingCriticalFields,

    missing_core_dna_fields:
      missingCoreDnaFields,

    warnings
  };
}


/**
 * ============================================================
 * String Quality Rules
 * ============================================================
 */

const STRING_SPEC_WEIGHTS = {
  material: 0.4,
  available_gauges_mm: 1.6
};


const STRING_CORE_DNA_WEIGHTS = {
  power: 1.0,
  control: 1.2,
  spin: 1.0,
  comfort: 1.2,
  feel: 0.8,
  durability: 0.6,
  tension_maintenance: 0.8
};


const STRING_ADVANCED_DNA_WEIGHTS = {
  string_stiffness: 1.1,
  snapback: 0.9,
  ball_pocketing: 0.8,
  tension_stability: 0.9,
  predictability: 1.0,
  string_movement: 0.5,
  arm_friendliness: 1.1,
  spin_window: 0.5,
  directional_precision: 0.9
};


const STRING_DESIGN_DNA_WEIGHTS = {
  string_type: 1.0,
  target_player: 0.7,
  arm_friendly: 1.0,
  spin_focus: 0.8,
  control_focus: 0.8,
  power_focus: 0.7,
  comfort_focus: 0.9,
  durability_focus: 0.6,
  feel_focus: 0.6,
  tension_stability_focus: 0.6,
  response_focus: 0.5
};


const STRING_CORE_DNA_FIELDS = [
  "power",
  "control",
  "spin",
  "comfort"
];


export function evaluateStringDataQuality(
  normalizedString
) {
  if (
    !normalizedString ||
    normalizedString
      .product_type !==
      "string"
  ) {
    throw new Error(
      "EveryCourtAI Product Data Quality: invalid normalized string."
    );
  }


  const specifications =
    normalizedString
      .specifications ??
    {};


  const coreDna =
    normalizedString
      .core_dna ??
    {};


  const advancedDna =
    normalizedString
      .advanced_dna ??
    {};


  const designDna =
    normalizedString
      .design_dna ??
    {};


  const specificationCompleteness =
    weightedCompleteness(
      specifications,
      STRING_SPEC_WEIGHTS
    );


  const coreDnaCompleteness =
    weightedCompleteness(
      coreDna,
      STRING_CORE_DNA_WEIGHTS
    );


  const advancedDnaCompleteness =
    weightedCompleteness(
      advancedDna,
      STRING_ADVANCED_DNA_WEIGHTS
    );


  const designDnaCompleteness =
    weightedCompleteness(
      designDna,
      STRING_DESIGN_DNA_WEIGHTS
    );


  /**
   * Overall String Evidence:
   *
   * Specs       15%
   * Core DNA    35%
   * Advanced    25%
   * Design DNA  25%
   *
   * Design DNA matters because many valid products
   * do not yet have numeric AI ratings.
   */

  const evidenceScore =
    round4(
      (
        specificationCompleteness *
        0.15
      ) +
      (
        coreDnaCompleteness *
        0.35
      ) +
      (
        advancedDnaCompleteness *
        0.25
      ) +
      (
        designDnaCompleteness *
        0.25
      )
    );


  const confidenceTier =
    getConfidenceTier(
      evidenceScore
    );


  const hasGauge =
    isPopulated(
      specifications
        .available_gauges_mm
    );


  const hasCorePerformance =
    STRING_CORE_DNA_FIELDS
      .some(
        field =>
          isPopulated(
            coreDna[field]
          )
      );


  const hasDesignEvidence =
    [
      "string_type",
      "spin_focus",
      "control_focus",
      "power_focus",
      "comfort_focus",
      "arm_friendly"
    ]
      .some(
        field =>
          isPopulated(
            designDna[field]
          )
      );


  /**
   * String ranking is allowed when:
   *
   * numeric performance exists
   * OR
   * useful design evidence exists.
   */

  const rankingEligible =
    Boolean(
      hasCorePerformance ||
      hasDesignEvidence
    );


  const missingCoreDnaFields =
    collectMissingFields(
      coreDna,
      STRING_CORE_DNA_FIELDS
    );


  const warnings = [];


  if (
    !hasGauge
  ) {
    warnings.push(
      "No normalized string gauge data available."
    );
  }


  if (
    !hasCorePerformance &&
    hasDesignEvidence
  ) {
    warnings.push(
      "String ranking relies on design DNA because numeric core DNA is unavailable."
    );
  }


  if (
    !rankingEligible
  ) {
    warnings.push(
      "String has insufficient evidence for normal ranking."
    );
  }


  return {
    product_id:
      normalizedString.id,

    product_type:
      "string",

    specification_completeness:
      specificationCompleteness,

    core_dna_completeness:
      coreDnaCompleteness,

    advanced_dna_completeness:
      advancedDnaCompleteness,

    design_dna_completeness:
      designDnaCompleteness,

    evidence_score:
      evidenceScore,

    confidence_tier:
      confidenceTier,

    ranking_eligible:
      rankingEligible,

    missing_core_dna_fields:
      missingCoreDnaFields,

    warnings
  };
}


/**
 * ============================================================
 * Generic Evaluator
 * ============================================================
 */

export function evaluateProductDataQuality(
  normalizedProduct
) {
  const type =
    normalizedProduct
      ?.product_type;


  if (
    type === "racquet"
  ) {
    return evaluateRacquetDataQuality(
      normalizedProduct
    );
  }


  if (
    type === "string"
  ) {
    return evaluateStringDataQuality(
      normalizedProduct
    );
  }


  throw new Error(
    `EveryCourtAI Product Data Quality: unsupported product type "${type ?? "unknown"}".`
  );
}


/**
 * ============================================================
 * Engine Info
 * ============================================================
 */

export function getProductDataQualityInfo() {
  return {
    name:
      "EveryCourtAI Product Data Quality",

    version:
      DATA_QUALITY_VERSION,

    supported_product_types: [
      "racquet",
      "string"
    ],

    confidence_tiers: [
      "high",
      "medium",
      "low"
    ]
  };
}


export default evaluateProductDataQuality;
