/**
 * ============================================================
 * EveryCourtAI
 * Product Entity Matcher V1
 * ============================================================
 *
 * Purpose:
 * Convert natural product language into structured evidence
 * against canonical Product Registry records.
 *
 * This module does NOT load product data.
 * This module does NOT silently guess.
 * This module is currently experimental and is not yet wired
 * into the production Product Resolver.
 * ============================================================
 */


const GENERIC_TOKENS = new Set([
    "edition",
    "series",
    "racquet",
    "racket",
    "tennis",
    "the",
    "系列",
    "特别版"
]);


function normalizeEntityText(
    value
) {
    return String(
        value ?? ""
    )
        .toLowerCase()
        .replace(
            /[_/\\-]+/g,
            " "
        )
        .replace(
            /([a-z])(\d)/g,
            "$1 $2"
        )
        .replace(
            /(\d)([a-z])/g,
            "$1 $2"
        )
        .replace(
            /[^\p{L}\p{N}.]+/gu,
            " "
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim();
}


function tokenizeEntityText(
    value
) {
    return normalizeEntityText(
        value
    )
        .split(" ")
        .map(
            token =>
                token.trim()
        )
        .filter(
            token =>
                token &&
                !GENERIC_TOKENS.has(
                    token
                )
        );
}


function unique(
    values
) {
    return [
        ...new Set(
            values
        )
    ];
}


function extractYearToken(
    value
) {
    const match =
        normalizeEntityText(
            value
        ).match(
            /\b(20\d{2})\b/
        );

    return match
        ? Number(
            match[1]
        )
        : null;
}


function buildProductIdentity(
    product
) {
    const brandTokens =
        tokenizeEntityText(
            product?.brand
        );

    const brandCnTokens =
        tokenizeEntityText(
            product?.brand_cn
        );

    const seriesTokens =
        tokenizeEntityText(
            product?.series
        );

    const modelTokens =
        tokenizeEntityText(
            product?.model
        );

    const modelCnTokens =
        tokenizeEntityText(
            product?.model_cn
        );

    const strongPatternTokens =
        unique(
            (
                product
                    ?.strong_patterns ??
                []
            ).flatMap(
                tokenizeEntityText
            )
        );


    const allIdentityTokens =
        unique([
            ...brandTokens,
            ...brandCnTokens,
            ...seriesTokens,
            ...modelTokens,
            ...modelCnTokens,
            ...strongPatternTokens
        ]);


    const baseTokens =
        new Set([
            ...brandTokens,
            ...brandCnTokens,
            ...seriesTokens
        ]);


    const discriminatingTokens =
        allIdentityTokens.filter(
            token =>
                !baseTokens.has(
                    token
                ) &&
                !/^\d{4}$/.test(
                    token
                )
        );


    return {
        brand_tokens:
            unique([
                ...brandTokens,
                ...brandCnTokens
            ]),

        series_tokens:
            seriesTokens,

        identity_tokens:
            allIdentityTokens,

        discriminating_tokens:
            discriminatingTokens,

        release_year:
            Number.isFinite(
                Number(
                    product?.release_year
                )
            )
                ? Number(
                    product.release_year
                )
                : null
    };
}


function scoreProductEntity(
    query,
    product
) {
    const normalizedQuery =
        normalizeEntityText(
            query
        );

    const queryTokens =
        tokenizeEntityText(
            query
        );

    const querySet =
        new Set(
            queryTokens
        );

    const identity =
        buildProductIdentity(
            product
        );


    if (
        !normalizedQuery ||
        queryTokens.length ===
            0
    ) {
        return null;
    }


    const matchedTokens =
        identity.identity_tokens.filter(
            token =>
                querySet.has(
                    token
                )
        );


    if (
        matchedTokens.length ===
        0
    ) {
        return null;
    }


    /**
     * A shared year alone is not product identity evidence.
     *
     * Example:
     * "Pure Drive Spectra 2026"
     *
     * must never create a meaningful candidate merely because
     * an unrelated product was also released in 2026.
     */

    const nonYearMatchedTokens =
        matchedTokens.filter(
            token =>
                !/^\d{4}$/.test(
                    token
                )
        );


    if (
        nonYearMatchedTokens.length ===
        0
    ) {
        return null;
    }


    let score = 0;


    /**
     * Token evidence.
     */

    score +=
        matchedTokens.length *
        12;


    /**
     * Brand evidence.
     */

    const brandMatched =
        identity.brand_tokens.some(
            token =>
                querySet.has(
                    token
                )
        );

    if (
        brandMatched
    ) {
        score += 18;
    }


    /**
     * Series evidence.
     */

    const seriesMatchedCount =
        identity.series_tokens.filter(
            token =>
                querySet.has(
                    token
                )
        ).length;

    score +=
        seriesMatchedCount *
        10;


    /**
     * Year evidence.
     */

    const queryYear =
        extractYearToken(
            query
        );

    let yearMatch =
        null;

    if (
        queryYear !==
        null
    ) {
        if (
            identity.release_year ===
            queryYear
        ) {
            score += 30;
            yearMatch = true;
        } else if (
            identity.release_year !==
            null
        ) {
            score -= 35;
            yearMatch = false;
        }
    }


    /**
     * Discriminating model / variant evidence.
     *
     * Examples:
     * spectra
     * team
     * pro
     * classic
     * wimbledon
     */

    const matchedDiscriminators =
        identity.discriminating_tokens.filter(
            token =>
                querySet.has(
                    token
                )
        );

    score +=
        matchedDiscriminators.length *
        24;


    /**
     * Missing discriminator penalty.
     *
     * If a candidate contains an extra meaningful variant
     * token that the user did not mention, slightly reduce
     * its score.
     *
     * This helps:
     *
     * Pure Drive Spectra 2026
     *
     * prefer:
     * Pure Drive Spectra Edition 2026
     *
     * over:
     * Pure Drive Team Spectra Edition 2026
     */

    const missingDiscriminators =
        identity.discriminating_tokens.filter(
            token =>
                !querySet.has(
                    token
                )
        );


    score -=
        missingDiscriminators.length *
        7;


    /**
     * Coverage:
     * how much of the meaningful user phrase is explained
     * by this product identity.
     */

    const meaningfulQueryTokens =
        queryTokens.filter(
            token =>
                !/^\d{4}$/.test(
                    token
                )
        );


    const explainedQueryTokens =
        meaningfulQueryTokens.filter(
            token =>
                identity.identity_tokens.includes(
                    token
                )
        );


    const coverage =
        meaningfulQueryTokens.length >
        0
            ? explainedQueryTokens.length /
                meaningfulQueryTokens.length
            : 0;


    score +=
        coverage *
        35;


    return {
        product,
        score:
            Number(
                score.toFixed(
                    2
                )
            ),

        coverage:
            Number(
                coverage.toFixed(
                    3
                )
            ),

        brand_matched:
            brandMatched,

        year_match:
            yearMatch,

        matched_tokens:
            matchedTokens,

        matched_discriminators:
            matchedDiscriminators,

        missing_discriminators:
            missingDiscriminators
    };
}


function rankProductEntities(
    query,
    registry
) {
    return (
        Array.isArray(
            registry
        )
            ? registry
            : []
    )
        .map(
            product =>
                scoreProductEntity(
                    query,
                    product
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
}


function resolveProductEntity(
    query,
    registry
) {
    const ranked =
        rankProductEntities(
            query,
            registry
        );


    if (
        ranked.length ===
        0
    ) {
        return {
            status:
                "not_found",

            confidence:
                null,

            match:
                null,

            candidates:
                []
        };
    }


    const best =
        ranked[0];

    const second =
        ranked[1] ??
        null;

    const margin =
        second
            ? Number(
                (
                    best.score -
                    second.score
                ).toFixed(
                    2
                )
            )
            : Infinity;


    /**
     * Minimum evidence gate.
     *
     * A candidate must explain most of the user's meaningful
     * product phrase before it may be automatically resolved.
     */

    if (
        best.coverage <
            0.6 ||
        best.score <
            70
    ) {
        return {
            status:
                "not_found",

            confidence:
                null,

            match:
                null,

            candidates:
                ranked.slice(
                    0,
                    5
                ),

            margin
        };
    }


    /**
     * Strong identity evidence.
     *
     * Explicit discriminator tokens such as:
     * spectra / team / pro / classic / 98
     *
     * allow resolution even when a related family candidate
     * remains numerically close.
     */

    const hasStrongDiscriminator =
        best
            .matched_discriminators
            .length >
        0;


    /**
     * Missing variant discriminator guard.
     *
     * A high numerical score must not manufacture product
     * specificity that the user did not provide.
     *
     * Example:
     *
     * Blade 98 V10
     *
     * may still describe:
     * - Blade 98S V10
     * - Blade 98 16x19 V10
     * - Blade 98 18x20 V10
     *
     * The best candidate therefore remains ambiguous when its
     * remaining identity is one of several competing variants.
     *
     * Standard products remain resolvable when the best candidate
     * has no residual variant identity after common family metadata
     * and generation tokens are removed.
     */

    const matchedSignature =
        values =>
            [
                ...new Set(
                    values ??
                    []
                )
            ]
                .sort()
                .join(
                    "|"
                );


    const generationTokens =
        product => {
            const normalizedModel =
                normalizeEntityText(
                    product?.model ??
                    ""
                );

            const match =
                normalizedModel.match(
                    /\bv\s+(\d+)\b/
                );

            return new Set(
                match
                    ? [
                        "v",
                        match[1]
                    ]
                    : []
            );
        };


    const residualMissingTokens =
        item => {
            const generations =
                generationTokens(
                    item?.product
                );

            return (
                item
                    ?.missing_discriminators ??
                []
            ).filter(
                token =>
                    !generations.has(
                        token
                    )
            );
        };


    const bestMatchedSignature =
        matchedSignature(
            best
                .matched_discriminators
        );

    const queryYear =
        extractYearToken(
            query
        );


    const variantPeers =
        ranked.filter(
            item =>
                item?.product?.series ===
                    best?.product?.series &&
                item.coverage >=
                    0.95 &&
                matchedSignature(
                    item
                        .matched_discriminators
                ) ===
                    bestMatchedSignature &&
                (
                    queryYear ===
                        null ||
                    item.year_match ===
                        best.year_match
                )
        );


    if (
        variantPeers.length >
        1
    ) {
        const residualSets =
            variantPeers.map(
                item =>
                    new Set(
                        residualMissingTokens(
                            item
                        )
                    )
            );

        const commonResidualTokens =
            residualSets.length >
            0
                ? [
                    ...residualSets[0]
                ].filter(
                    token =>
                        residualSets.every(
                            set =>
                                set.has(
                                    token
                                )
                        )
                )
                : [];


        const commonResidualSet =
            new Set(
                commonResidualTokens
            );


        const effectiveResidual =
            item =>
                residualMissingTokens(
                    item
                ).filter(
                    token =>
                        !commonResidualSet.has(
                            token
                        )
                );


        const bestResidual =
            effectiveResidual(
                best
            );


        const bestResidualSignature =
            matchedSignature(
                bestResidual
            );


        const hasCompetingVariant =
            bestResidual.length >
                0 &&
            variantPeers.some(
                item => {
                    if (
                        item ===
                        best
                    ) {
                        return false;
                    }

                    const peerResidual =
                        effectiveResidual(
                            item
                        );

                    return (
                        peerResidual.length >
                            0 &&
                        matchedSignature(
                            peerResidual
                        ) !==
                            bestResidualSignature
                    );
                }
            );


        if (
            hasCompetingVariant
        ) {
            return {
                status:
                    "ambiguous",

                confidence:
                    null,

                match:
                    null,

                candidates:
                    ranked.slice(
                        0,
                        5
                    ),

                margin
            };
        }
    }


    /**
     * Generic family phrases must not silently select a SKU.
     *
     * Example:
     * "Pure Drive"
     *
     * may describe many products in the same family.
     */

    if (
        !hasStrongDiscriminator &&
        second &&
        margin <
            12
    ) {
        return {
            status:
                "ambiguous",

            confidence:
                null,

            match:
                null,

            candidates:
                ranked.slice(
                    0,
                    5
                ),

            margin
        };
    }


    /**
     * A discriminator may resolve a close family pair when the
     * best candidate fully explains the phrase and the competing
     * candidate contains additional unrequested variant identity.
     */

    const closeButStructured =
        hasStrongDiscriminator &&
        best.coverage >=
            0.95 &&
        (
            !second ||
            margin >=
                5
        );


    if (
        second &&
        margin <
            12 &&
        !closeButStructured
    ) {
        return {
            status:
                "ambiguous",

            confidence:
                null,

            match:
                null,

            candidates:
                ranked.slice(
                    0,
                    5
                ),

            margin
        };
    }


    return {
        status:
            "resolved",

        confidence:
            margin >=
                20
                ? "high"
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

            score:
                best.score,

            coverage:
                best.coverage
        },

        candidates:
            ranked.slice(
                0,
                5
            ),

        margin
    };
}


export {
    normalizeEntityText,
    tokenizeEntityText,
    buildProductIdentity,
    scoreProductEntity,
    rankProductEntities,
    resolveProductEntity
};
