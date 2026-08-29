/**
 * ============================================================
 * EveryCourtAI
 * Product Resolver
 * Version: 1.0
 * ============================================================
 *
 * Responsibilities:
 *
 * 1. Resolve racquet names from natural language
 * 2. Resolve string names from natural language
 * 3. Handle year / edition / gauge disambiguation
 * 4. Prefer normal production model when special edition
 *    is not explicitly requested
 * 5. Never silently guess when candidates remain ambiguous
 *
 * ============================================================
 */

import {
    RACQUET_PRODUCT_REGISTRY,
    STRING_PRODUCT_REGISTRY,
    PRODUCT_REGISTRY_COUNTS
} from "./product_registry.generated.js";

import {
    resolveProductEntity
} from "./product_entity_matcher_v1.js";


const RESOLVER_VERSION =
    "1.0";


/**
 * ============================================================
 * Normalization
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

    return String(value)
        .trim();
}


function normalizeText(
    value
) {
    return safeString(
        value
    )
        .toLowerCase()
        .replace(
            /([a-z])(\d)/g,
            "$1 $2"
        )
        .replace(
            /(\d)([a-z])/g,
            "$1 $2"
        )
        .replace(
            /[_\-–—]+/g,
            " "
        )
        .replace(
            /[，。！？、；：,.!?;:()[\]{}"'`]/g,
            " "
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim();
}


/**
 * ============================================================
 * Numeric / Gauge
 * ============================================================
 */

function safeNumber(
    value
) {
    const parsed =
        Number(value);

    return Number.isFinite(
        parsed
    )
        ? parsed
        : null;
}


function extractGaugeMm(
    message
) {
    const original =
        safeString(
            message
        )
            .toLowerCase();


    /**
     * Explicit metric:
     *
     * 1.18
     * 1.20
     * 1.25 mm
     * 1.30mm
     */

    const metricMatch =
        original.match(
            /\b(1\.(?:10|15|18|20|22|23|24|25|27|28|30|32|35|38|40))\s*(?:mm)?\b/i
        );


    if (
        metricMatch
    ) {
        return safeNumber(
            metricMatch[1]
        );
    }


    /**
     * Common shorthand:
     *
     * 118 → 1.18
     * 120 → 1.20
     * 125 → 1.25
     * 130 → 1.30
     */

    const shorthandMatch =
        original.match(
            /\b(110|115|118|120|122|123|124|125|127|128|130|132|135|138|140)\b/
        );


    if (
        shorthandMatch
    ) {
        return (
            Number(
                shorthandMatch[1]
            ) /
            100
        );
    }


    return null;
}


function gaugeDistance(
    target,
    gauges
) {
    if (
        target === null ||
        !Array.isArray(
            gauges
        ) ||
        gauges.length === 0
    ) {
        return null;
    }


    let minimum =
        Infinity;


    for (
        const gauge
        of gauges
    ) {
        const numericGauge =
            safeNumber(
                gauge
            );


        if (
            numericGauge === null
        ) {
            continue;
        }


        minimum =
            Math.min(
                minimum,
                Math.abs(
                    numericGauge -
                    target
                )
            );
    }


    return Number.isFinite(
        minimum
    )
        ? minimum
        : null;
}


/**
 * ============================================================
 * Query Context
 * ============================================================
 */

function extractYear(
    message
) {
    const match =
        safeString(
            message
        )
            .match(
                /\b(19\d{2}|20\d{2})\b/
            );


    return match
        ? Number(
            match[1]
        )
        : null;
}


function hasSpecialEditionIntent(
    normalizedMessage
) {
    const keywords = [
        "limited",
        "limited edition",
        "special edition",
        "collector",
        "anniversary",
        "laver cup",
        "wimbledon",
        "us open",
        "roland garros",
        "osaka",
        "kith",
        "gucci",
        "minions",
        "rafa",
        "hall of fame",
        "classic",
        "autograph",
        "reverse",
        "desert",
        "year of",
        "snake",
        "horse",
        "edition",
        "联名",
        "限定",
        "限量",
        "纪念版",
        "特别版"
    ];


    return keywords.some(
        keyword =>
            normalizedMessage.includes(
                normalizeText(
                    keyword
                )
            )
    );
}


function sourceLooksSpecial(
    product
) {
    const source =
        normalizeText(
            product?.source_file
        );


    return (
        source.includes(
            "special editions"
        ) ||
        source.includes(
            "collaborations"
        )
    );
}


/**
 * ============================================================
 * Match Scoring
 * ============================================================
 */

function calculatePatternScore(
    message,
    pattern,
    strength
) {
    if (
        !pattern ||
        !message.includes(
            pattern
        )
    ) {
        return null;
    }


    const wordCount =
        pattern
            .split(" ")
            .filter(Boolean)
            .length;


    const lengthScore =
        Math.min(
            pattern.length,
            80
        );


    const base =
        strength ===
        "strong"
            ? 100
            : 45;


    return (
        base +
        lengthScore +
        wordCount * 4
    );
}


function scoreProduct(
    product,
    normalizedMessage,
    context
) {
    let bestPatternScore =
        null;

    let matchedPattern =
        null;

    let matchedStrength =
        null;


    for (
        const pattern
        of product
            .strong_patterns ??
        []
    ) {
        const score =
            calculatePatternScore(
                normalizedMessage,
                pattern,
                "strong"
            );


        if (
            score !== null &&
            (
                bestPatternScore ===
                    null ||
                score >
                    bestPatternScore
            )
        ) {
            bestPatternScore =
                score;

            matchedPattern =
                pattern;

            matchedStrength =
                "strong";
        }
    }


    for (
        const pattern
        of product
            .weak_patterns ??
        []
    ) {
        const score =
            calculatePatternScore(
                normalizedMessage,
                pattern,
                "weak"
            );


        if (
            score !== null &&
            (
                bestPatternScore ===
                    null ||
                score >
                    bestPatternScore
            )
        ) {
            bestPatternScore =
                score;

            matchedPattern =
                pattern;

            matchedStrength =
                "weak";
        }
    }


    if (
        bestPatternScore ===
        null
    ) {
        return null;
    }


    let score =
        bestPatternScore;


    /**
     * Brand confirmation
     */

    const brand =
        normalizeText(
            product.brand
        );


    if (
        brand &&
        normalizedMessage.includes(
            brand
        )
    ) {
        score += 20;
    }


    /**
     * Model confirmation
     */

    const model =
        normalizeText(
            product.model
        );


    if (
        model &&
        normalizedMessage.includes(
            model
        )
    ) {
        score += 25;
    }


    /**
     * Year
     */

    if (
        context.year !==
        null
    ) {
        if (
            product.release_year ===
            context.year
        ) {
            score += 35;
        } else if (
            product.release_year !==
            null
        ) {
            score -= 20;
        }
    }


    /**
     * Special Edition
     *
     * If the user did NOT ask for a special edition,
     * standard production models receive priority.
     */

    const special =
        sourceLooksSpecial(
            product
        );


    if (
        special &&
        !context.specialEditionIntent
    ) {
        score -= 28;
    }


    if (
        special &&
        context.specialEditionIntent
    ) {
        score += 10;
    }


    /**
     * Gauge
     */

    let gaugeDifference =
        null;


    if (
        product.product_type ===
            "string" &&
        context.gaugeMm !==
            null
    ) {
        gaugeDifference =
            gaugeDistance(
                context.gaugeMm,
                product.gauges_mm
            );


        if (
            gaugeDifference !==
            null
        ) {
            if (
                gaugeDifference <=
                0.005
            ) {
                score += 35;
            } else if (
                gaugeDifference <=
                0.02
            ) {
                score += 20;
            } else if (
                gaugeDifference <=
                0.05
            ) {
                score += 5;
            } else {
                score -= 15;
            }
        }


        /**
         * IDs such as:
         * tecnifibre_x_one_biphase_118
         */

        const gaugeToken =
            String(
                Math.round(
                    context.gaugeMm *
                    100
                )
            );


        const normalizedProductId =
            normalizeText(
                product.id
            );


        const productIdTokens =
            normalizedProductId
                .split(
                    " "
                )
                .filter(Boolean);


        if (
            productIdTokens.includes(
                gaugeToken
            )
        ) {
            /**
             * Explicit gauge-specific SKU.
             *
             * Example:
             * tecnifibre_x_one_biphase_118
             *
             * If the user explicitly says 1.18,
             * this SKU should outrank the generic family record.
             */
            score += 55;
        }
    }


    return {
        product,

        score:
            Number(
                score.toFixed(2)
            ),

        matched_pattern:
            matchedPattern,

        matched_strength:
            matchedStrength,

        gauge_difference:
            gaugeDifference
    };
}


/**
 * ============================================================
 * Resolution
 * ============================================================
 */

function resolveFromRegistry(
    message,
    registry,
    productType
) {
    const normalizedMessage =
        normalizeText(
            message
        );


    if (
        !normalizedMessage
    ) {
        return {
            status:
                "not_found",

            product_type:
                productType,

            match:
                null,

            candidates:
                []
        };
    }


    const context = {
        year:
            extractYear(
                message
            ),

        gaugeMm:
            productType ===
                "string"
                ? extractGaugeMm(
                    message
                )
                : null,

        specialEditionIntent:
            hasSpecialEditionIntent(
                normalizedMessage
            )
    };


    const scored =
        registry
            .map(
                product =>
                    scoreProduct(
                        product,
                        normalizedMessage,
                        context
                    )
            )
            .filter(Boolean)
            .sort(
                (
                    a,
                    b
                ) =>
                    b.score -
                    a.score
            );


    if (
        scored.length ===
        0
    ) {
        return {
            status:
                "not_found",

            product_type:
                productType,

            match:
                null,

            candidates:
                [],

            context
        };
    }


    const best =
        scored[0];


    const second =
        scored[1] ??
        null;


    const margin =
        second
            ? best.score -
                second.score
            : Infinity;


    /**
     * Only weak match and low confidence.
     */

    if (
        best.matched_strength ===
            "weak" &&
        best.score <
            85
    ) {
        return {
            status:
                "not_found",

            product_type:
                productType,

            match:
                null,

            candidates:
                scored.slice(
                    0,
                    5
                ),

            context
        };
    }


    /**
     * Near-identical candidates:
     * don't silently guess.
     */

    if (
        second &&
        margin <
            8 &&
        best.product.id !==
            second.product.id
    ) {
        return {
            status:
                "ambiguous",

            product_type:
                productType,

            match:
                null,

            candidates:
                scored.slice(
                    0,
                    5
                ),

            context
        };
    }


    return {
        status:
            "resolved",

        product_type:
            productType,

        confidence:
            best.matched_strength ===
                "strong"
                ? (
                    margin >= 25
                        ? "high"
                        : "medium"
                )
                : "medium",

        match: {
            id:
                best.product.id,

            brand:
                best.product.brand,

            model:
                best.product.model,

            release_year:
                best.product
                    .release_year ??
                null,

            gauge_mm:
                productType ===
                    "string"
                    ? context.gaugeMm
                    : null,

            score:
                best.score,

            matched_pattern:
                best.matched_pattern
        },

        candidates:
            scored
                .slice(
                    0,
                    5
                )
                .map(
                    item => ({
                        id:
                            item.product.id,

                        brand:
                            item.product.brand,

                        model:
                            item.product.model,

                        score:
                            item.score,

                        matched_pattern:
                            item.matched_pattern
                    })
                ),

        context
    };
}


/**
 * ============================================================
 * Public API
 * ============================================================
 */

export function resolveRacquet(
    message
) {
    /**
     * Stage 1:
     * Preserve established registry resolution.
     *
     * Existing exact / strong-pattern matches remain
     * authoritative.
     */
    const registryResolution =
        resolveFromRegistry(
            message,
            RACQUET_PRODUCT_REGISTRY,
            "racquet"
        );


    if (
        registryResolution.status ===
            "resolved"
    ) {
        return registryResolution;
    }


    /**
     * Stage 2:
     * Natural-language Product Entity fallback.
     *
     * This layer handles useful product language that does not
     * exactly match generated registry patterns.
     *
     * Examples:
     * Pure Drive Spectra 2026
     * Pure Drive 2026 Spectra
     * Pure Drive Spectra
     *
     * Generic family phrases remain ambiguous rather than
     * silently selecting a SKU.
     */
    const entityResolution =
        resolveProductEntity(
            message,
            RACQUET_PRODUCT_REGISTRY
        );


    if (
        entityResolution.status ===
            "resolved"
    ) {
        return {
            status:
                "resolved",

            product_type:
                "racquet",

            confidence:
                entityResolution
                    .confidence,

            match: {
                ...entityResolution.match,

                resolution_source:
                    "entity_matcher_v1"
            },

            candidates:
                entityResolution
                    .candidates,

            context:
                registryResolution
                    .context ??
                null,

            resolution_source:
                "entity_matcher_v1"
        };
    }


    /**
     * Entity ambiguity is useful information.
     *
     * Example:
     * "Pure Drive"
     *
     * means the family is understood, but a specific SKU
     * cannot safely be selected.
     */
    if (
        entityResolution.status ===
            "ambiguous"
    ) {
        return {
            status:
                "ambiguous",

            product_type:
                "racquet",

            match:
                null,

            candidates:
                entityResolution
                    .candidates,

            context:
                registryResolution
                    .context ??
                null,

            resolution_source:
                "entity_matcher_v1"
        };
    }


    /**
     * Entity matching could not improve the established result.
     */
    return registryResolution;
}


export function resolveString(
    message
) {
    return resolveFromRegistry(
        message,
        STRING_PRODUCT_REGISTRY,
        "string"
    );
}


export function resolveProducts(
    message
) {
    return {
        resolver:
            "EveryCourtAI Product Resolver",

        version:
            RESOLVER_VERSION,

        racquet:
            resolveRacquet(
                message
            ),

        string:
            resolveString(
                message
            )
    };
}


export function getProductResolverInfo() {
    return {
        name:
            "EveryCourtAI Product Resolver",

        version:
            RESOLVER_VERSION,

        products:
            PRODUCT_REGISTRY_COUNTS
    };
}


export const productResolverHelpers = {
    normalizeText,
    extractYear,
    extractGaugeMm,
    hasSpecialEditionIntent,
    sourceLooksSpecial
};
