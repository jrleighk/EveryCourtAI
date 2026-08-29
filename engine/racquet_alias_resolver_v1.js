/**
 * ============================================================
 * EveryCourtAI
 * Racquet Alias Resolver V1
 * ============================================================
 *
 * Responsibilities:
 *
 * 1. Resolve explicit, curated racquet aliases.
 * 2. Preserve ambiguity when an alias represents a family.
 * 3. Never infer player associations or relative generations.
 * 4. Return no_match when alias knowledge does not apply.
 *
 * ============================================================
 */

import {
    RACQUET_ALIAS_REGISTRY
} from "./racquet_alias_registry.generated.js";


const VERSION =
    "1.0";


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


function normalizeAliasText(
    value
) {
    return safeString(
        value
    )
        .toLowerCase()
        .replace(
            /\s+/g,
            " "
        )
        .trim();
}


function findCanonicalProduct(
    canonicalId,
    registry
) {
    if (
        !canonicalId ||
        !Array.isArray(registry)
    ) {
        return null;
    }


    return (
        registry.find(
            product =>
                product?.id ===
                canonicalId
        ) ??
        null
    );
}


function buildSeriesCandidates(
    canonicalSeries,
    registry
) {
    if (
        !canonicalSeries ||
        !Array.isArray(registry)
    ) {
        return [];
    }


    const normalizedSeries =
        normalizeAliasText(
            canonicalSeries
        );


    return registry
        .filter(
            product =>
                normalizeAliasText(
                    product?.series
                ) ===
                normalizedSeries
        )
        .map(
            product => ({
                id:
                    product.id,

                brand:
                    product.brand,

                model:
                    product.model,

                release_year:
                    product.release_year ??
                    null
            })
        );
}


export function resolveRacquetAlias(
    message,
    registry
) {
    const normalized =
        normalizeAliasText(
            message
        );


    if (
        !normalized
    ) {
        return {
            status:
                "no_match",

            product_type:
                "racquet",

            alias:
                null
        };
    }


    const alias =
        RACQUET_ALIAS_REGISTRY.find(
            item =>
                normalizeAliasText(
                    item.alias
                ) ===
                normalized
        );


    if (
        !alias
    ) {
        return {
            status:
                "no_match",

            product_type:
                "racquet",

            alias:
                null
        };
    }


    if (
        alias.status ===
        "ambiguous"
    ) {
        return {
            status:
                "ambiguous",

            product_type:
                "racquet",

            confidence:
                alias.confidence ??
                null,

            match:
                null,

            candidates:
                buildSeriesCandidates(
                    alias.canonical_series,
                    registry
                ),

            alias: {
                text:
                    alias.alias,

                locale:
                    alias.locale,

                alias_type:
                    alias.alias_type,

                canonical_series:
                    alias.canonical_series ??
                    null,

                source:
                    alias.source
            },

            resolution_source:
                "racquet_alias_v1"
        };
    }


    if (
        alias.status ===
        "resolved"
    ) {
        const product =
            findCanonicalProduct(
                alias.canonical_id,
                registry
            );


        if (
            !product
        ) {
            return {
                status:
                    "not_found",

                product_type:
                    "racquet",

                confidence:
                    null,

                match:
                    null,

                candidates:
                    [],

                alias: {
                    text:
                        alias.alias,

                    canonical_id:
                        alias.canonical_id
                },

                resolution_source:
                    "racquet_alias_v1"
            };
        }


        return {
            status:
                "resolved",

            product_type:
                "racquet",

            confidence:
                alias.confidence ??
                "high",

            match: {
                id:
                    product.id,

                brand:
                    product.brand,

                model:
                    product.model,

                release_year:
                    product.release_year ??
                    null,

                resolution_source:
                    "racquet_alias_v1"
            },

            candidates:
                [],

            alias: {
                text:
                    alias.alias,

                locale:
                    alias.locale,

                alias_type:
                    alias.alias_type,

                source:
                    alias.source
            },

            resolution_source:
                "racquet_alias_v1"
        };
    }


    return {
        status:
            "no_match",

        product_type:
            "racquet",

        alias:
            null
    };
}


export function getRacquetAliasResolverInfo() {
    return {
        module:
            "racquet_alias_resolver",

        version:
            VERSION,

        aliases:
            RACQUET_ALIAS_REGISTRY.length
    };
}
