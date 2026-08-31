/**
 * ============================================================
 * EveryCourtAI
 * Main Engine
 * Version: 2.0
 * ============================================================
 *
 * 文件路径：
 * engine/main_engine.js
 *
 * 作用：
 * 统一调度整个 EveryCourtAI Recommendation Engine。
 *
 * 最终流程：
 *
 * User Input
 *    ↓
 * Player Engine
 *    ↓
 * Matching Engine
 *    ↓
 * Conflict Engine
 *    ↓
 * Ranking Engine
 *    ↓
 * Alternative Engine
 *    ↓
 * Recommendation Engine
 *    ↓
 * Confidence Engine
 *    ↓
 * Explanation Engine
 *    ↓
 * Final Output
 *
 * ============================================================
 */

import {
    buildPlayerProfile,
    validatePlayerProfile as validateNormalizedPlayerProfile
} from "./player_engine.js";

import {
    runMatchingEngine
} from "./matching_engine.js";

import {
    runConflictEngine
} from "./conflict_engine.js";

import {
    rankRecommendations
} from "./ranking_engine.js";

import {
    generateAlternatives
} from "./alternative_engine.js";

import {
    generateRecommendation
} from "./recommendation_engine.js";

import {
    generateSetupScenarios
} from "./setup_scenario_engine.js";

import {
    diagnoseCurrentSetup
} from "./setup_diagnosis_v1.js";

import {
    normalizeHealthData
} from "./health_data_adapter_v1.js";

import {
    analyzeTennisRecovery
} from "./tennis_recovery_engine_v1.js";

import {
    buildHealthRecommendationContext
} from "./health_recommendation_context_v1.js";

import {
    analyzeHealthBaseline
} from "./health_baseline_engine_v1.js";

import {
    buildBaselineRecoveryAdjustment
} from "./health_baseline_adjustment_v1.js";

import {
    calculateConfidence
} from "./confidence_engine.js";

import {
    generateExplanation
} from "./explanation_engine.js";

import {
    validateEngineOutput,
    validatePlayerProfile
} from "../utils/validator.js";


/**
 * ============================================================
 * 基础配置
 * ============================================================
 */

const ENGINE_NAME = "EveryCourtAI";

const ENGINE_VERSION = "2.0";


/**
 * ============================================================
 * 通用工具
 * ============================================================
 */

function createTimestamp() {
    return new Date()
        .toISOString();
}


function safeErrorMessage(error) {
    if (
        error instanceof Error
    ) {
        return error.message;
    }

    return String(error);
}


/**
 * ============================================================
 * Pipeline Status
 * ============================================================
 */

function createPipelineStatus() {
    return {
        player_engine: {
            status: "pending"
        },

        matching_engine: {
            status: "pending"
        },

        conflict_engine: {
            status: "pending"
        },

        ranking_engine: {
            status: "pending"
        },

        alternative_engine: {
            status: "pending"
        },

        recommendation_engine: {
            status: "pending"
        },

        setup_scenario_engine: {
            status: "pending"
        },

        confidence_engine: {
            status: "pending"
        },

        explanation_engine: {
            status: "pending"
        }
    };
}


/**
 * ============================================================
 * Engine Result Summary
 * ============================================================
 */

function buildResultSummary({
    playerProfile,
    matchingResult,
    conflictResult,
    rankingResult,
    alternativeResult,
    recommendationResult,
    confidenceResult
}) {
    return {

        profile: {
            completeness_score:
                playerProfile
                    ?.metadata
                    ?.completeness_score ??
                null,

            missing_information:
                playerProfile
                    ?.metadata
                    ?.missing_information ??
                []
        },

        matching: {
            racquet_candidates:
                matchingResult
                    ?.candidate_counts
                    ?.racquets ??
                0,

            string_candidates:
                matchingResult
                    ?.candidate_counts
                    ?.strings ??
                0
        },

        conflict: {
            racquets_excluded:
                conflictResult
                    ?.filtering
                    ?.racquets_excluded ??
                0,

            strings_excluded:
                conflictResult
                    ?.filtering
                    ?.strings_excluded ??
                0,

            conflicts_detected:
                conflictResult
                    ?.conflicts_detected
                    ?.length ??
                0
        },

        ranking: {
            best_racquet_id:
                rankingResult
                    ?.best_matches
                    ?.racquet
                    ?.id ??
                null,

            best_string_id:
                rankingResult
                    ?.best_matches
                    ?.string
                    ?.id ??
                null
        },

        alternatives: {
            racquet_alternatives:
                alternativeResult
                    ?.counts
                    ?.racquet_alternatives ??
                0,

            string_alternatives:
                alternativeResult
                    ?.counts
                    ?.string_alternatives ??
                0
        },

        recommendation: {
            setup_score:
                recommendationResult
                    ?.setup_score ??
                null,

            setup_type:
                recommendationResult
                    ?.string_setup
                    ?.type ??
                null,

            racquet_action:
                recommendationResult
                    ?.racquet_decision
                    ?.action ??
                null,

            main_string_id:
                recommendationResult
                    ?.string_setup
                    ?.main
                    ?.id ??
                null,

            cross_string_id:
                recommendationResult
                    ?.string_setup
                    ?.cross
                    ?.id ??
                null,

            main_tension_lbs:
                recommendationResult
                    ?.tension
                    ?.main_lbs ??
                null,

            cross_tension_lbs:
                recommendationResult
                    ?.tension
                    ?.cross_lbs ??
                null
        },

        confidence: {
            score:
                confidenceResult
                    ?.score ??
                null,

            level:
                confidenceResult
                    ?.level ??
                null,

            recommendation_mode:
                confidenceResult
                    ?.recommendation_mode ??
                null
        }
    };
}


/**
 * ============================================================
 * Main Engine
 * ============================================================
 */

export async function runEveryCourtAI(
    playerInput = {},
    options = {}
) {
    const startedAt =
        Date.now();

    const pipeline =
        createPipelineStatus();


    /**
     * ----------------------------------
     * Options
     * ----------------------------------
     */

    const {
        include_debug = false,
        include_intermediate_results = false
    } = options;


    try {

        /**
         * ====================================================
         * STEP 1
         * Player Engine
         * ====================================================
         */

        const playerProfile =
            await buildPlayerProfile(
                playerInput
            );


        pipeline.player_engine = {
            status: "completed"
        };


        /**
         * Double Validation
         */

        const normalizedValidation =
            validateNormalizedPlayerProfile(
                playerProfile
            );


        const sharedValidation =
            validatePlayerProfile(
                playerProfile
            );


        if (
            !normalizedValidation.valid ||
            !sharedValidation.valid
        ) {
            throw new Error(
                "EveryCourtAI Main Engine: normalized player profile failed validation."
            );
        }


        /**
         * ====================================================
         * STEP 2
         * Matching Engine
         * ====================================================
         */

        const matchingResult =
            await runMatchingEngine(
                playerProfile
            );


        pipeline.matching_engine = {
            status: "completed",

            racquet_candidates:
                matchingResult
                    ?.candidate_counts
                    ?.racquets ??
                0,

            string_candidates:
                matchingResult
                    ?.candidate_counts
                    ?.strings ??
                0
        };


        /**
         * ====================================================
         * STEP 3
         * Conflict Engine
         * ====================================================
         */

        const conflictResult =
            await runConflictEngine(
                matchingResult,
                playerProfile
            );


        pipeline.conflict_engine = {
            status: "completed",

            racquets_excluded:
                conflictResult
                    ?.filtering
                    ?.racquets_excluded ??
                0,

            strings_excluded:
                conflictResult
                    ?.filtering
                    ?.strings_excluded ??
                0
        };


        /**
         * ====================================================
         * STEP 4
         * Ranking Engine
         * ====================================================
         */

        const rankingResult =
            await rankRecommendations(
                conflictResult,
                playerProfile
            );


        pipeline.ranking_engine = {
            status: "completed",

            best_racquet:
                rankingResult
                    ?.best_matches
                    ?.racquet
                    ?.id ??
                null,

            best_string:
                rankingResult
                    ?.best_matches
                    ?.string
                    ?.id ??
                null
        };


        /**
         * ====================================================
         * STEP 5
         * Alternative Engine
         * ====================================================
         */

        const alternativeResult =
            await generateAlternatives(
                rankingResult,
                playerProfile
            );


        pipeline.alternative_engine = {
            status: "completed",

            racquet_alternatives:
                alternativeResult
                    ?.counts
                    ?.racquet_alternatives ??
                0,

            string_alternatives:
                alternativeResult
                    ?.counts
                    ?.string_alternatives ??
                0
        };


        /**
         * ====================================================
         * STEP 6
         * Recommendation Engine
         * ====================================================
         */

        const recommendationResult =
            await generateRecommendation(
                rankingResult,
                playerProfile,
                alternativeResult
            );


        pipeline.recommendation_engine = {
            status: "completed",

            setup_score:
                recommendationResult
                    ?.setup_score ??
                null,

            setup_type:
                recommendationResult
                    ?.string_setup
                    ?.type ??
                null
        };


        /**
         * ====================================================
         * STEP 7
         * Setup Scenario Engine
         * ====================================================
         */

        const setupScenarioResult =
            generateSetupScenarios({
                playerProfile,
                matchingResult,
                recommendationResult
            });


        pipeline.setup_scenario_engine = {
            status: "completed",

            scenario_count:
                setupScenarioResult
                    ?.scenarios
                    ?.length ??
                0
        };


        const setupDiagnosisResult =
            diagnoseCurrentSetup({
                playerProfile,
                scenarioResult:
                    setupScenarioResult
            });

        pipeline.setup_diagnosis_v1 = {
            status: "completed"
        };


        /**
         * ====================================================
         * STEP 8
         * Confidence Engine
         * ====================================================
         */

        const confidenceResult =
            await calculateConfidence(
                playerProfile,
                {
                    conflictResult,
                    rankingResult,
                    alternativeResult,
                    recommendationResult
                }
            );


        pipeline.confidence_engine = {
            status: "completed",

            score:
                confidenceResult
                    ?.score ??
                null,

            level:
                confidenceResult
                    ?.level ??
                null
        };


        /**
         * ====================================================
         * STEP 8
         * Explanation Engine
         * ====================================================
         */

        const explanationResult =
            await generateExplanation(
                recommendationResult,
                playerProfile,
                confidenceResult
            );


        pipeline.explanation_engine = {
            status: "completed"
        };


        /**
         * ====================================================
         * STEP 9
         * Final Output
         * ====================================================
         */

        const processingTimeMs =
            Date.now() -
            startedAt;


        const healthInput =
            playerInput
                ?.health_data;

        const hasHealthData =
            healthInput &&
            typeof healthInput === "object" &&
            Object.keys(
                healthInput
            ).length > 0;

        const normalizedHealthData =
            hasHealthData
                ? normalizeHealthData(
                    healthInput
                )
                : null;

        const healthBaseline =
            playerInput
                ?.health_baseline;

        const hasHealthBaseline =
            healthBaseline &&
            typeof healthBaseline === "object" &&
            Object.keys(
                healthBaseline
            ).length > 0;

        const baselineAnalysis =
            normalizedHealthData &&
            hasHealthBaseline
                ? analyzeHealthBaseline(
                    normalizedHealthData,
                    healthBaseline
                )
                : null;

        const baselineAdjustment =
            baselineAnalysis
                ? buildBaselineRecoveryAdjustment(
                    baselineAnalysis
                )
                : null;

        const rawRecoveryResult =
            normalizedHealthData
                ? analyzeTennisRecovery(
                    normalizedHealthData
                )
                : null;

        const recoveryResult =
            rawRecoveryResult
                ? {
                    ...rawRecoveryResult,
                    recovery_score:
                        typeof rawRecoveryResult.recovery_score === "number"
                            ? Math.max(
                                0,
                                rawRecoveryResult.recovery_score +
                                (
                                    baselineAdjustment?.recovery_adjustment ?? 0
                                )
                            )
                            : null
                }
                : null;

        if (
            recoveryResult &&
            typeof recoveryResult.recovery_score === "number"
        ) {
            const score =
                recoveryResult.recovery_score;

            recoveryResult.recovery_status =
                score >= 80
                    ? "ready"
                    : score >= 60
                        ? "caution"
                        : "recovery_priority";

            recoveryResult.fatigue_risk =
                recoveryResult.recovery_status === "ready"
                    ? "low"
                    : recoveryResult.recovery_status === "caution"
                        ? "moderate"
                        : "high";

            recoveryResult.next_session_guidance =
                recoveryResult.recovery_status === "ready"
                    ? "normal_training"
                    : recoveryResult.recovery_status === "caution"
                        ? "moderate_load"
                        : "reduce_intensity";
        }

        const healthContext =
            recoveryResult
                ? buildHealthRecommendationContext(
                    recoveryResult
                )
                : null;


        const summary =
            buildResultSummary({
                playerProfile,
                matchingResult,
                conflictResult,
                rankingResult,
                alternativeResult,
                recommendationResult,
                confidenceResult
            });


        const output = {

            success: true,

            engine: {
                name:
                    ENGINE_NAME,

                version:
                    ENGINE_VERSION
            },

            timestamp:
                createTimestamp(),

            processing_time_ms:
                processingTimeMs,

            summary,

            recommendation:
                recommendationResult,

            confidence:
                confidenceResult,

            explanation:
                explanationResult,

            setup_diagnosis:
                setupDiagnosisResult,

            health_data:
                normalizedHealthData,

            recovery:
                recoveryResult,

            health_baseline:
                baselineAnalysis,

            health_baseline_adjustment:
                baselineAdjustment,

            health_context:
                healthContext,

            player_profile:
                playerProfile,

            pipeline
        };


        /**
         * ----------------------------------
         * Optional Intermediate Results
         * ----------------------------------
         */

        if (
            include_intermediate_results
        ) {
            output.intermediate_results = {
                matching:
                    matchingResult,

                conflict:
                    conflictResult,

                ranking:
                    rankingResult,

                alternatives:
                    alternativeResult
            };
        }


        /**
         * ----------------------------------
         * Optional Debug
         * ----------------------------------
         */

        if (
            include_debug
        ) {
            output.debug = {
                engine_order: [
                    "player_engine",
                    "matching_engine",
                    "conflict_engine",
                    "ranking_engine",
                    "alternative_engine",
                    "recommendation_engine",
                    "confidence_engine",
                    "explanation_engine"
                ],

                input_received:
                    playerInput,

                options_received:
                    options
            };
        }


        /**
         * ----------------------------------
         * Final Validation
         * ----------------------------------
         */

        const outputValidation =
            validateEngineOutput(
                output
            );


        if (
            !outputValidation.valid
        ) {
            throw new Error(
                `EveryCourtAI Main Engine: final output failed validation: ${
                    outputValidation
                        .errors
                        ?.join("; ") ??
                    "unknown validation error"
                }`
            );
        }


        return output;

    } catch (error) {

        /**
         * ====================================================
         * Error Handling
         * ====================================================
         */

        const processingTimeMs =
            Date.now() -
            startedAt;


        /**
         * 找出目前执行到哪一层
         */

        for (
            const [
                engineName,
                status
            ]
            of Object.entries(
                pipeline
            )
        ) {
            if (
                status.status === "pending"
            ) {
                pipeline[engineName] = {
                    status: "failed"
                };

                break;
            }
        }


        return {

            success: false,

            engine: {
                name:
                    ENGINE_NAME,

                version:
                    ENGINE_VERSION
            },

            timestamp:
                createTimestamp(),

            processing_time_ms:
                processingTimeMs,

            error: {
                message:
                    safeErrorMessage(
                        error
                    ),

                type:
                    error
                        ?.name ??
                    "Error"
            },

            pipeline
        };
    }
}


/**
 * ============================================================
 * Quick Recommendation Mode
 * ============================================================
 *
 * 用于以后 App 快速模式。
 * 不返回所有中间数据。
 * ============================================================
 */

export async function runQuickRecommendation(
    playerInput = {}
) {
    const result =
        await runEveryCourtAI(
            playerInput,
            {
                include_debug:
                    false,

                include_intermediate_results:
                    false
            }
        );


    if (
        !result.success
    ) {
        return result;
    }


    return {
        success:
            true,

        engine:
            result.engine,

        timestamp:
            result.timestamp,

        recommendation:
            result.recommendation,

        confidence:
            result.confidence,

        explanation:
            result.explanation,

        setup_diagnosis:
            result.setup_diagnosis,

        health_data:
            result.health_data,

        recovery:
            result.recovery,

        health_baseline:
            result.health_baseline,

        health_baseline_adjustment:
            result.health_baseline_adjustment,

        health_context:
            result.health_context
    };
}


/**
 * ============================================================
 * Deep Analysis Mode
 * ============================================================
 *
 * 用于以后专业模式 / Debug / API 测试。
 * ============================================================
 */

export async function runDeepAnalysis(
    playerInput = {}
) {
    return runEveryCourtAI(
        playerInput,
        {
            include_debug:
                true,

            include_intermediate_results:
                true
        }
    );
}


/**
 * ============================================================
 * Engine Health
 * ============================================================
 */

export function getEngineInfo() {
    return {
        name:
            ENGINE_NAME,

        version:
            ENGINE_VERSION,

        architecture: [
            "player_engine",
            "matching_engine",
            "conflict_engine",
            "ranking_engine",
            "alternative_engine",
            "recommendation_engine",
            "confidence_engine",
            "explanation_engine"
        ],

        status:
            "ready_for_local_testing"
    };
}
