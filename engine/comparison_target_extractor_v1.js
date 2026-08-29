/**
 * ============================================================
 * EveryCourtAI
 * Comparison Target Extractor V1
 * ============================================================
 *
 * Responsibilities:
 *
 * 1. Extract multiple racquet targets from comparison questions.
 * 2. Resolve each target independently through Product Resolver.
 * 3. Preserve resolved / ambiguous / unresolved states.
 * 4. Never treat comparison targets as current equipment.
 * 5. Never silently guess an ambiguous product.
 *
 * This module does NOT:
 *
 * - update Player Input
 * - update Conversation State
 * - run recommendation ranking
 * - build the final comparison answer
 *
 * ============================================================
 */

import {
    resolveRacquet
} from "./product_resolver.js";


const EXTRACTOR_NAME =
    "comparison_target_extractor";

const EXTRACTOR_VERSION =
    "1.0";


/**
 * ============================================================
 * Helpers
 * ============================================================
 */

function safeString(
    value
) {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(
        value
    ).trim();
}


function cleanSegment(
    value
) {
    return safeString(
        value
    )
        .replace(
            /^[\s，。！？、；：,.!?;:]+|[\s，。！？、；：,.!?;:]+$/g,
            ""
        )
        .trim();
}


function stripComparisonLanguage(
    value
) {
    let text =
        cleanSegment(
            value
        );


    const patterns = [

        /^请(?:帮我)?比较\s*/i,

        /^帮我比较\s*/i,

        /^比较\s*/i,

        /^please\s+compare\s+/i,

        /^compare\s+/i,

        /\s*(?:哪个|哪一个)更适合我.*$/i,

        /\s*(?:哪个|哪一个)更好.*$/i,

        /\s*谁更适合我.*$/i,

        /\s*which\s+(?:one\s+)?is\s+(?:better|more\s+suitable).*$/i,

        /\s*which\s+(?:one\s+)?suits?\s+me\s+better.*$/i,

        /\s*which\s+(?:one\s+)?is\s+better\s+for\s+me.*$/i,

        /\s*更适合我.*$/i,

        /\s*更好.*$/i
    ];


    for (
        const pattern
        of patterns
    ) {
        text =
            text.replace(
                pattern,
                ""
            );
    }


    return cleanSegment(
        text
    );
}


/**
 * ============================================================
 * Comparison Subtype
 * ============================================================
 */

function detectComparisonSubtype(
    message
) {

    const text =
        safeString(
            message
        );


    if (!text) {
        return null;
    }


    /**
     * Comparative explanation:
     *
     * 为什么 A 比 B 更适合我？
     * 为什么 A 比 B 更好？
     */
    if (
        /为什么\s*.+?\s*比\s*.+?\s*更(?:适合我|适合|好|舒服|稳定|有力|容易|精准|可控)/i
            .test(
                text
            )
    ) {

        return "comparative_explanation";
    }


    /**
     * Direct comparison:
     *
     * A 和 B 哪个更适合？
     * 请比较 A 和 B
     * A vs B
     */
    if (
        /(?:和|与|跟|对比|相比)/i
            .test(
                text
            ) ||
        /\b(?:vs\.?|versus)\b/i
            .test(
                text
            ) ||
        /(?:请|帮我)?比较/i
            .test(
                text
            ) ||
        /\bcompare\b[\s\S]+?\b(?:and|with)\b/i
            .test(
                text
            )
    ) {

        return "direct_comparison";
    }


    return null;
}


/**
 * ============================================================
 * Comparison Split
 * ============================================================
 *
 * V1 intentionally supports explicit comparison separators.
 *
 * Examples:
 *
 * Pure Drive 和 RF01
 * Pure Drive 与 RF01
 * Pure Drive 跟 RF01
 * Pure Drive vs RF01
 * Pure Drive versus RF01
 *
 * ============================================================
 */

function splitComparisonTargets(
    message
) {

    const original =
        safeString(
            message
        );


    if (!original) {
        return [];
    }


    const subtype =
        detectComparisonSubtype(
            original
        );


    /**
     * ========================================================
     * Comparative Explanation
     * ========================================================
     *
     * A 比 B 更...
     *
     * Do NOT add bare "比" to the generic splitter because
     * Chinese uses 比 in many non-product comparative phrases.
     * ========================================================
     */

    if (
        subtype ===
        "comparative_explanation"
    ) {

        const comparativeMatch =
            original.match(
                /^(?:为什么\s*)?(.+?)\s*比\s*(.+?)\s*更(?:适合我|适合|好|舒服|稳定|有力|容易|精准|可控).*$/i
            );


        if (
            comparativeMatch
        ) {

            return [
                cleanSegment(
                    comparativeMatch[1]
                ),

                cleanSegment(
                    comparativeMatch[2]
                )
            ]
                .filter(
                    Boolean
                );
        }
    }


    /**
     * ========================================================
     * Direct Comparison
     * ========================================================
     */

    const stripped =
        stripComparisonLanguage(
            original
        );


    const parts =
        stripped
            .split(
                /\s+(?:vs\.?|versus|and|with)\s+|(?:和|与|跟|对比|相比)/i
            )
            .map(
                cleanSegment
            )
            .filter(
                Boolean
            );


    if (
        parts.length <
        2
    ) {

        return [];
    }


    return parts;
}


/**
 * ============================================================
 * Normalize Resolver Result
 * ============================================================
 */

function normalizeTargetResult(
    rawText
) {
    const resolved =
        resolveRacquet(
            rawText
        );


    return {

        raw_text:
            rawText,

        status:
            resolved
                ?.status ??
            "unresolved",

        product_type:
            resolved
                ?.product_type ??
            "racquet",

        confidence:
            resolved
                ?.confidence ??
            null,

        match:
            resolved
                ?.match ??
            null,

        candidates:
            Array.isArray(
                resolved
                    ?.candidates
            )
                ? resolved.candidates
                : [],

        context:
            resolved
                ?.context ??
            null
    };
}


/**
 * ============================================================
 * Public API
 * ============================================================
 */

export function extractComparisonTargets(
    message
) {

    const comparisonSubtype =
        detectComparisonSubtype(
            message
        );


    const rawTargets =
        splitComparisonTargets(
            message
        );


    const targets =
        rawTargets.map(
            normalizeTargetResult
        );


    const resolvedTargets =
        targets.filter(
            target =>
                target.status ===
                    "resolved" &&
                target.match
                    ?.id
        );


    const ambiguousTargets =
        targets.filter(
            target =>
                target.status ===
                    "ambiguous"
        );


    const notFoundTargets =
        targets.filter(
            target =>
                target.status ===
                    "not_found"
        );


    const unresolvedTargets =
        targets.filter(
            target =>
                target.status ===
                    "unresolved"
        );


    const uniqueResolvedIds =
        new Set(
            resolvedTargets.map(
                target =>
                    target.match.id
            )
        );


    const comparisonReady =
        targets.length >=
            2 &&
        resolvedTargets.length ===
            targets.length &&
        uniqueResolvedIds.size ===
            targets.length;


    return {

        extractor:
            EXTRACTOR_NAME,

        version:
            EXTRACTOR_VERSION,

        detected:
            rawTargets.length >=
            2,

        product_type:
            "racquet",

        comparison_subtype:
            comparisonSubtype,

        raw_targets:
            rawTargets,

        targets,

        resolved_count:
            resolvedTargets.length,

        ambiguous_count:
            ambiguousTargets.length,

        not_found_count:
            notFoundTargets.length,

        unresolved_count:
            unresolvedTargets.length,

        comparison_ready:
            comparisonReady
    };
}


export function getComparisonTargetExtractorInfo() {
    return {

        name:
            EXTRACTOR_NAME,

        version:
            EXTRACTOR_VERSION,

        product_type:
            "racquet"
    };
}


export default {
    extractComparisonTargets,
    getComparisonTargetExtractorInfo
};
