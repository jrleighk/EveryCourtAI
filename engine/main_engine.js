/**
 * ============================================================
 * EveryCourtAI
 * Main Engine
 * Version: 1.0
 * ============================================================
 * Purpose:
 * Central entry point for the EveryCourtAI Recommendation Engine.
 * Responsible for orchestrating all AI engines.
 * ============================================================
 */

import { buildPlayerProfile } from "./player_engine.js";
import { runMatchingEngine } from "./matching_engine.js";
import { rankRecommendations } from "./ranking_engine.js";
import { generateRecommendation } from "./recommendation_engine.js";
import { generateExplanation } from "./explanation_engine.js";

/**
 * Main Recommendation Engine
 *
 * @param {Object} playerInput
 * @returns {Object}
 */
export async function runEveryCourtAI(playerInput) {

    console.log("====================================");
    console.log("EveryCourtAI Engine Started");
    console.log("====================================");

    /**
     * ----------------------------------
     * STEP 1
     * Build Player Profile
     * ----------------------------------
     */

    const playerProfile = await buildPlayerProfile(playerInput);

    /**
     * ----------------------------------
     * STEP 2
     * Find Matching Candidates
     * ----------------------------------
     */

    const candidates = await runMatchingEngine(playerProfile);

    /**
     * ----------------------------------
     * STEP 3
     * Rank Candidates
     * ----------------------------------
     */

    const rankedCandidates = await rankRecommendations(
        candidates,
        playerProfile
    );

    /**
     * ----------------------------------
     * STEP 4
     * Generate Recommendation
     * ----------------------------------
     */

    const recommendation = await generateRecommendation(
        rankedCandidates,
        playerProfile
    );

    /**
     * ----------------------------------
     * STEP 5
     * Generate Explanation
     * ----------------------------------
     */

    const explanation = await generateExplanation(
        recommendation,
        playerProfile
    );

    /**
     * ----------------------------------
     * Final Output
     * ----------------------------------
     */

    return {

        success: true,

        engine: "EveryCourtAI",

        version: "1.0",

        timestamp: new Date().toISOString(),

        player_profile: playerProfile,

        candidates: candidates,

        ranked_candidates: rankedCandidates,

        recommendation: recommendation,

        explanation: explanation

    };

}
