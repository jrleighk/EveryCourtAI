/**
 * ============================================================
 * EveryCourtAI
 * Comparison Resolution Engine V1
 * ============================================================
 *
 * Responsibilities:
 *
 * 1. Consume Comparison Target Extractor V1 output
 * 2. Determine whether comparison targets are fully resolved
 * 3. Preserve resolved product identity
 * 4. Surface unresolved / ambiguous targets for clarification
 * 5. Never guess an unresolved product
 *
 * This engine does NOT:
 *
 * - rank products
 * - decide which product is better
 * - generate recommendation scores
 * - mutate player profile
 * - run the main recommendation engine
 *
 * ============================================================
 */

const ENGINE_NAME =
    "comparison_resolution_engine";

const ENGINE_VERSION =
    "1.0";


export function resolveComparisonTargets(
    extraction = null
) {

    const targets =
        Array.isArray(
            extraction?.targets
        )
            ? extraction.targets
            : [];


    /**
     * ========================================================
     * Not a valid two-product comparison
     * ========================================================
     */

    if (
        extraction?.detected !== true ||
        targets.length !== 2
    ) {

        return {
            engine:
                ENGINE_NAME,

            version:
                ENGINE_VERSION,

            ready:
                false,

            status:
                "comparison_not_ready",

            comparison_subtype:
                extraction
                    ?.comparison_subtype ??
                null,

            products:
                [],

            unresolved_targets:
                []
        };
    }


    const resolvedTargets =
        targets.filter(
            target =>
                target?.status ===
                    "resolved" &&
                target?.match?.id
        );


    const unresolvedTargets =
        targets
            .map(
                (
                    target,
                    index
                ) => ({
                    index,
                    raw_text:
                        target
                            ?.raw_text ??
                        null,
                    status:
                        target
                            ?.status ??
                        "unresolved",
                    candidates:
                        Array.isArray(
                            target?.candidates
                        )
                            ? target.candidates
                            : []
                })
            )
            .filter(
                target =>
                    target.status !==
                        "resolved"
            );


    /**
     * ========================================================
     * Clarification required
     * ========================================================
     */

    if (
        resolvedTargets.length !== 2
    ) {

        return {
            engine:
                ENGINE_NAME,

            version:
                ENGINE_VERSION,

            ready:
                false,

            status:
                "clarification_required",

            comparison_subtype:
                extraction
                    ?.comparison_subtype ??
                null,

            products:
                resolvedTargets.map(
                    target =>
                        target.match
                ),

            unresolved_targets:
                unresolvedTargets
        };
    }


    /**
     * ========================================================
     * Comparison ready
     * ========================================================
     */

    return {
        engine:
            ENGINE_NAME,

        version:
            ENGINE_VERSION,

        ready:
            true,

        status:
            "comparison_ready",

        comparison_subtype:
            extraction
                ?.comparison_subtype ??
            null,

        products:
            resolvedTargets.map(
                target =>
                    target.match
            ),

        product_a:
            resolvedTargets[0]
                .match,

        product_b:
            resolvedTargets[1]
                .match,

        unresolved_targets:
            []
    };
}


export default {
    resolveComparisonTargets
};
