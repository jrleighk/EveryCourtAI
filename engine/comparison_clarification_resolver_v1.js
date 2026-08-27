/**
 * ============================================================
 * EveryCourtAI
 * Comparison Clarification Resolver V1
 * ============================================================
 *
 * Purpose:
 *
 * Resolve a follow-up clarification message against an existing
 * pending comparison context.
 *
 * Example:
 *
 * Turn 1:
 * "Pure Drive 和 RF 01 Pro Classic 哪个更适合我？"
 *
 * Pending context contains:
 * - one resolved product
 * - one unresolved target: "Pure Drive"
 *
 * Turn 2:
 * "Spectra 2026"
 *
 * This resolver combines the unresolved target context with the
 * clarification message and attempts to resolve the missing
 * product only.
 *
 * This engine does NOT:
 *
 * - detect primary question intent
 * - run recommendation engines
 * - score player fit
 * - generate final comparison prose
 * - mutate conversation state
 *
 * ============================================================
 */

import {
  resolveRacquet
} from "./product_resolver.js";


const ENGINE_NAME =
  "comparison_clarification_resolver";

const ENGINE_VERSION =
  "1.0";


function isObject(
  value
) {

  return (
    value !== null &&
    typeof value ===
      "object" &&
    !Array.isArray(
      value
    )
  );
}


function normalizeText(
  value
) {

  return typeof value ===
    "string"
      ? value.trim()
      : "";
}


function cloneValue(
  value
) {

  try {

    return structuredClone(
      value
    );

  } catch {

    try {

      return JSON.parse(
        JSON.stringify(
          value
        )
      );

    } catch {

      return value;
    }
  }
}


function normalizeResolvedProduct(
  product
) {

  if (
    !isObject(
      product
    ) ||
    !product.id
  ) {

    return null;
  }


  return cloneValue(
    product
  );
}


function normalizePendingContext(
  pendingContext
) {

  if (
    !isObject(
      pendingContext
    ) ||
    pendingContext.active !==
      true
  ) {

    return null;
  }


  const products =
    Array.isArray(
      pendingContext.products
    )
      ? pendingContext.products
          .map(
            normalizeResolvedProduct
          )
          .filter(
            Boolean
          )
      : [];


  const unresolvedTargets =
    Array.isArray(
      pendingContext
        .unresolved_targets
    )
      ? cloneValue(
          pendingContext
            .unresolved_targets
        )
      : [];


  return {
    active:
      true,

    source_turn:
      pendingContext
        ?.source_turn ??
      null,

    comparison_subtype:
      pendingContext
        ?.comparison_subtype ??
      null,

    products,

    unresolved_targets:
      unresolvedTargets,

    source_message:
      pendingContext
        ?.source_message ??
      null,

    created_at:
      pendingContext
        ?.created_at ??
      null
  };
}


function buildResolutionQuery(
  unresolvedTarget,
  clarificationMessage
) {

  const originalTarget =
    normalizeText(
      unresolvedTarget
        ?.raw_text
    );


  const clarification =
    normalizeText(
      clarificationMessage
    );


  if (
    !originalTarget
  ) {

    return clarification;
  }


  if (
    !clarification
  ) {

    return originalTarget;
  }


  return `${originalTarget} ${clarification}`
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}


function normalizeResolverMatch(
  resolved
) {

  if (
    resolved?.status !==
      "resolved" ||
    !resolved
      ?.match
      ?.id
  ) {

    return null;
  }


  return cloneValue(
    resolved.match
  );
}


function buildUnresolvedResult(
  unresolvedTarget,
  query,
  resolverResult
) {

  return {
    index:
      unresolvedTarget
        ?.index ??
      null,

    raw_text:
      unresolvedTarget
        ?.raw_text ??
      null,

    clarification_query:
      query,

    status:
      resolverResult
        ?.status ??
      "unresolved",

    candidates:
      Array.isArray(
        resolverResult
          ?.candidates
      )
        ? cloneValue(
            resolverResult.candidates
          )
        : []
  };
}


/**
 * ============================================================
 * Public API
 * ============================================================
 */

export function resolveComparisonClarification({
  pendingContext = null,
  message = ""
} = {}) {

  const normalizedPending =
    normalizePendingContext(
      pendingContext
    );


  const clarificationMessage =
    normalizeText(
      message
    );


  if (
    !normalizedPending ||
    !clarificationMessage
  ) {

    return {
      engine:
        ENGINE_NAME,

      version:
        ENGINE_VERSION,

      success:
        false,

      ready:
        false,

      status:
        "comparison_clarification_invalid_input"
    };
  }


  const unresolvedTargets =
    normalizedPending
      .unresolved_targets;


  if (
    unresolvedTargets.length ===
      0
  ) {

    return {
      engine:
        ENGINE_NAME,

      version:
        ENGINE_VERSION,

      success:
        false,

      ready:
        false,

      status:
        "comparison_clarification_no_pending_target",

      pending_context:
        normalizedPending
    };
  }


  /**
   * V1 intentionally supports one unresolved target.
   *
   * If both products are unresolved, user must provide a more
   * complete comparison request instead of guessing how the
   * clarification maps to two targets.
   */

  if (
    unresolvedTargets.length !==
      1
  ) {

    return {
      engine:
        ENGINE_NAME,

      version:
        ENGINE_VERSION,

      success:
        false,

      ready:
        false,

      status:
        "comparison_clarification_multiple_targets",

      pending_context:
        normalizedPending,

      unresolved_targets:
        cloneValue(
          unresolvedTargets
        )
    };
  }


  const unresolvedTarget =
    unresolvedTargets[0];


  const resolutionQuery =
    buildResolutionQuery(
      unresolvedTarget,
      clarificationMessage
    );


  const resolverResult =
    resolveRacquet(
      resolutionQuery
    );


  const resolvedProduct =
    normalizeResolverMatch(
      resolverResult
    );


  if (
    !resolvedProduct
  ) {

    return {
      engine:
        ENGINE_NAME,

      version:
        ENGINE_VERSION,

      success:
        true,

      ready:
        false,

      status:
        "comparison_clarification_still_unresolved",

      pending_context:
        normalizedPending,

      attempted_query:
        resolutionQuery,

      unresolved_targets: [
        buildUnresolvedResult(
          unresolvedTarget,
          resolutionQuery,
          resolverResult
        )
      ]
    };
  }


  const existingProducts =
    normalizedPending
      .products;


  const targetIndex =
    Number.isFinite(
      Number(
        unresolvedTarget
          ?.index
      )
    )
      ? Number(
          unresolvedTarget.index
        )
      : null;


  const productsByPosition =
    [
      null,
      null
    ];


  /**
   * Preserve known product position whenever possible.
   */

  if (
    existingProducts.length ===
      1 &&
    targetIndex !==
      null &&
    (
      targetIndex === 0 ||
      targetIndex === 1
    )
  ) {

    productsByPosition[
      targetIndex
    ] =
      resolvedProduct;


    productsByPosition[
      targetIndex === 0
        ? 1
        : 0
    ] =
      existingProducts[0];

  } else {

    const combined =
      [
        ...existingProducts,
        resolvedProduct
      ];


    for (
      let index = 0;
      index <
        Math.min(
          combined.length,
          2
        );
      index++
    ) {

      productsByPosition[
        index
      ] =
        combined[index];
    }
  }


  const finalProducts =
    productsByPosition
      .filter(
        product =>
          product?.id
      );


  const uniqueIds =
    new Set(
      finalProducts.map(
        product =>
          product.id
      )
    );


  if (
    finalProducts.length !==
      2 ||
    uniqueIds.size !==
      2
  ) {

    return {
      engine:
        ENGINE_NAME,

      version:
        ENGINE_VERSION,

      success:
        true,

      ready:
        false,

      status:
        "comparison_clarification_incomplete",

      pending_context:
        normalizedPending,

      attempted_query:
        resolutionQuery,

      products:
        finalProducts,

      resolved_product:
        resolvedProduct
    };
  }


  return {
    engine:
      ENGINE_NAME,

    version:
      ENGINE_VERSION,

    success:
      true,

    ready:
      true,

    status:
      "comparison_clarification_resolved",

    comparison_subtype:
      normalizedPending
        .comparison_subtype,

    source_turn:
      normalizedPending
        .source_turn,

    source_message:
      normalizedPending
        .source_message,

    clarification_message:
      clarificationMessage,

    attempted_query:
      resolutionQuery,

    products:
      finalProducts,

    product_a:
      productsByPosition[0],

    product_b:
      productsByPosition[1],

    unresolved_targets:
      []
  };
}


export function getComparisonClarificationResolverInfo() {

  return {
    name:
      ENGINE_NAME,

    version:
      ENGINE_VERSION,

    status:
      "ready",

    supports_single_unresolved_target:
      true
  };
}


export default {
  resolveComparisonClarification,
  getComparisonClarificationResolverInfo
};
