/**
 * ============================================================
 * EveryCourtAI
 * Comparison Orchestrator V1
 * ============================================================
 *
 * Purpose:
 *
 * Provide one stable runtime entry point for the complete
 * Comparison V1 stack.
 *
 * Responsibilities:
 *
 * 1. Extract comparison targets
 * 2. Resolve product identities
 * 3. Load normalized comparison products
 * 4. Load Matching Engine racquet records when player context
 *    is available
 * 5. Build objective + player-aware comparison
 * 6. Build answer, semantics, synthesis and narrative layers
 *
 * This layer does NOT own:
 *
 * - question intent detection
 * - product scoring mathematics
 * - player-fit scoring mathematics
 * - semantic interpretation rules
 * - narrative wording rules
 *
 * ============================================================
 */

import {
  extractComparisonTargets
} from "./comparison_target_extractor_v1.js";

import {
  resolveComparisonTargets
} from "./comparison_resolution_engine_v1.js";

import {
  loadComparisonPair
} from "./comparison_product_loader_v1.js";

import {
  buildComparisonResult
} from "./comparison_result_engine_v1.js";

import {
  buildComparisonAnswer
} from "./comparison_answer_builder_v1.js";

import {
  buildComparisonLanguage
} from "./comparison_language_builder_v1.js";

import {
  buildComparisonSemantics
} from "./comparison_semantic_engine_v1.js";

import {
  buildSemanticLanguage
} from "./comparison_semantic_language_v1.js";

import {
  buildComparisonExplanationSynthesis
} from "./comparison_explanation_synthesis_v1.js";

import {
  buildComparisonExplanationNarrative
} from "./comparison_explanation_narrative_v1.js";

import {
  buildPlayerDecisionNarrative
} from "./comparison_player_decision_narrative_v1.js";

import {
  adaptComparisonPlayerProfile
} from "./comparison_player_profile_adapter_v1.js";

import {
  RACQUET_PRODUCT_REGISTRY
} from "./product_registry.generated.js";

import {
  matchingHelpers
} from "./matching_engine.js";

import {
  loadKnowledgeJson
} from "../utils/runtime_json_loader.js";


const ENGINE_NAME =
  "comparison_orchestrator";

const ENGINE_VERSION =
  "1.0";


function buildNotReady(
  status,
  stage,
  data = {}
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

    status,

    stage,

    ...data
  };
}


function findRegistryEntry(
  id
) {

  return (
    RACQUET_PRODUCT_REGISTRY.find(
      item =>
        item.id === id
    ) ??
    null
  );
}


async function loadMatchingRacquet(
  id
) {

  const registry =
    findRegistryEntry(
      id
    );


  if (
    !registry?.source_file
  ) {

    return null;
  }


  const raw =
    await loadKnowledgeJson(
      registry.source_file
    );


  if (
    !raw
  ) {

    return null;
  }


  return matchingHelpers
    .extractRacquetData(
      raw
    );
}


/**
 * ============================================================
 * Resolved Comparison Runtime API
 * ============================================================
 *
 * Used when both comparison product identities have already
 * been resolved.
 *
 * Primary use case:
 *
 * multi-turn comparison clarification.
 *
 * This entry skips:
 *
 * - target extraction
 * - target resolution
 *
 * and reuses the exact same downstream Comparison V1 pipeline.
 *
 * ============================================================
 */

export async function runResolvedComparisonOrchestrator({
  productAId = null,
  productBId = null,
  playerProfile = null,
  language = "en",
  extraction = null,
  resolution = null
} = {}) {

  if (
    !productAId ||
    !productBId
  ) {

    return buildNotReady(
      "comparison_product_ids_unavailable",
      "resolved_pair_input",
      {
        extraction:
          extraction ?? null,

        resolution:
          resolution ?? null
      }
    );
  }


  if (
    productAId ===
    productBId
  ) {

    return buildNotReady(
      "comparison_products_must_be_distinct",
      "resolved_pair_input",
      {
        product_a_id:
          productAId,

        product_b_id:
          productBId
      }
    );
  }


  /**
   * ==========================================================
   * STEP 3
   * Comparison Product Loading
   * ==========================================================
   */

  const pair =
    await loadComparisonPair(
      productAId,
      productBId
    );


  if (
    !pair ||
    pair.success !== true ||
    pair
      ?.product_a
      ?.status !== "ready" ||
    pair
      ?.product_b
      ?.status !== "ready" ||
    !pair
      ?.product_a
      ?.product ||
    !pair
      ?.product_b
      ?.product
  ) {

    return buildNotReady(
      "comparison_product_load_failed",
      "product_loading",
      {
        extraction,
        resolution,

        pair:
          pair ?? null
      }
    );
  }


  const productA =
    pair.product_a.product;


  const productB =
    pair.product_b.product;


  /**
   * ==========================================================
   * STEP 4
   * Player Profile Normalization + Matching Representation
   *
   * Comparison Runtime may receive:
   *
   * - conversation-state player input
   * - Player Profile V1 style input
   * - already canonical matching-engine input
   *
   * Normalize once here before player-fit scoring.
   * ==========================================================
   */

  const adaptedPlayerProfile =
    playerProfile
      ? adaptComparisonPlayerProfile(
          playerProfile
        )
      : null;


  const comparisonPlayerProfile =
    adaptedPlayerProfile
        ?.success === true &&
    adaptedPlayerProfile
        ?.status ===
        "comparison_player_profile_ready"
      ? adaptedPlayerProfile
          .player_profile
      : null;


  let matchingRacquetA =
    null;

  let matchingRacquetB =
    null;


  if (
    comparisonPlayerProfile
  ) {

    [
      matchingRacquetA,
      matchingRacquetB
    ] =
      await Promise.all([
        loadMatchingRacquet(
          productAId
        ),

        loadMatchingRacquet(
          productBId
        )
      ]);
  }


  /**
   * ==========================================================
   * STEP 5
   * Comparison Result
   * ==========================================================
   */

  const comparisonResult =
    buildComparisonResult(
      productA,
      productB,
      matchingRacquetA,
      matchingRacquetB,
      comparisonPlayerProfile
    );


  if (
    !comparisonResult ||
    comparisonResult.success !== true ||
    comparisonResult.status !==
      "comparison_result_ready"
  ) {

    return buildNotReady(
      "comparison_result_failed",
      "comparison_result",
      {
        extraction,
        resolution,

        comparison_result:
          comparisonResult ?? null
      }
    );
  }


  /**
   * ==========================================================
   * STEP 6
   * Stable Answer Contract
   * ==========================================================
   */

  const comparisonAnswer =
    buildComparisonAnswer(
      comparisonResult
    );


  if (
    !comparisonAnswer ||
    comparisonAnswer.success !== true ||
    comparisonAnswer.status !==
      "comparison_answer_ready"
  ) {

    return buildNotReady(
      "comparison_answer_failed",
      "comparison_answer",
      {
        comparison_result:
          comparisonResult,

        comparison_answer:
          comparisonAnswer ?? null
      }
    );
  }


  /**
   * ==========================================================
   * STEP 7
   * Deterministic Comparison Language
   * ==========================================================
   */

  const comparisonLanguage =
    buildComparisonLanguage(
      comparisonAnswer
    );


  /**
   * ==========================================================
   * STEP 8
   * Objective Semantics
   * ==========================================================
   */

  const semantics =
    buildComparisonSemantics(
      comparisonAnswer
    );


  /**
   * ==========================================================
   * STEP 9
   * Semantic Language
   * ==========================================================
   */

  const semanticLanguage =
    buildSemanticLanguage(
      semantics
    );


  /**
   * ==========================================================
   * STEP 10
   * Higher-Level Explanation Synthesis
   * ==========================================================
   */

  const synthesis =
    buildComparisonExplanationSynthesis(
      comparisonAnswer,
      semantics
    );


  /**
   * ==========================================================
   * STEP 11
   * Objective Narrative
   * ==========================================================
   */

  const narrative =
    buildComparisonExplanationNarrative(
      synthesis
    );


  /**
   * ==========================================================
   * STEP 12
   * Player Decision Narrative
   * ==========================================================
   */

  const playerDecisionNarrative =
    buildPlayerDecisionNarrative(
      synthesis
    );


  /**
   * ==========================================================
   * Final Stable Runtime Contract
   * ==========================================================
   */

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
      "comparison_orchestrator_ready",

    language,

    products:
      comparisonAnswer.products,

    comparison: {
      extraction,
      resolution,
      result:
        comparisonResult,
      answer:
        comparisonAnswer
    },

    interpretation: {
      language:
        comparisonLanguage,

      semantics,

      semantic_language:
        semanticLanguage,

      synthesis,

      narrative,

      player_decision_narrative:
        playerDecisionNarrative
    }
  };
}


/**
 * ============================================================
 * Public Runtime API
 * ============================================================
 */

export async function runComparisonOrchestrator({
  message = "",
  playerProfile = null,
  language = "en"
} = {}) {

  const text =
    typeof message === "string"
      ? message.trim()
      : "";


  /**
   * ==========================================================
   * STEP 0
   * Input
   * ==========================================================
   */

  if (!text) {

    return buildNotReady(
      "comparison_orchestrator_invalid_input",
      "input"
    );
  }


  /**
   * ==========================================================
   * STEP 1
   * Comparison Target Extraction
   * ==========================================================
   */

  const extraction =
    extractComparisonTargets(
      text
    );


  if (
    !extraction ||
    extraction.detected !== true
  ) {

    return buildNotReady(
      "comparison_not_detected",
      "target_extraction",
      {
        extraction:
          extraction ?? null
      }
    );
  }


  /**
   * ==========================================================
   * STEP 2
   * Comparison Target Resolution
   * ==========================================================
   */

  const resolution =
    resolveComparisonTargets(
      extraction
    );


  if (
    !resolution ||
    resolution.ready !== true ||
    resolution.status !==
      "comparison_ready"
  ) {

    return buildNotReady(
      resolution?.status ??
        "comparison_targets_not_ready",
      "target_resolution",
      {
        extraction,

        resolution:
          resolution ?? null
      }
    );
  }


  const productAId =
    resolution
      ?.product_a
      ?.id ??
    null;


  const productBId =
    resolution
      ?.product_b
      ?.id ??
    null;


  if (
    !productAId ||
    !productBId
  ) {

    return buildNotReady(
      "comparison_product_ids_unavailable",
      "target_resolution",
      {
        extraction,
        resolution
      }
    );
  }


  /**
   * ==========================================================
   * STEP 3+
   * Delegate To Resolved Pair Runtime
   * ==========================================================
   */

  return runResolvedComparisonOrchestrator({
    productAId,
    productBId,
    playerProfile,
    language,
    extraction,
    resolution
  });

}


export function getComparisonOrchestratorInfo() {

  return {
    name:
      ENGINE_NAME,

    version:
      ENGINE_VERSION,

    status:
      "ready",

    player_aware:
      true,

    objective_only:
      true
  };
}


export default {
  runComparisonOrchestrator,
  getComparisonOrchestratorInfo
};
