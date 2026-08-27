/**
 * ============================================================
 * EveryCourtAI
 * Comparison Product Loader V1
 * ============================================================
 *
 * Responsibilities:
 *
 * 1. Resolve canonical registry entry by product id
 * 2. Load canonical racquet knowledge through runtime loader
 * 3. Normalize raw racquet data
 * 4. Return a stable comparison-ready product record
 *
 * This module does NOT:
 *
 * - resolve natural-language product names
 * - rank products
 * - compare products
 * - mutate player input
 *
 * ============================================================
 */

import {
    RACQUET_PRODUCT_REGISTRY
} from "./product_registry.generated.js";


import {
    normalizeRacquetRecord
} from "./product_normalizer.js";


import {
    loadKnowledgeJson
} from "../utils/runtime_json_loader.js";


const ENGINE_NAME =
    "comparison_product_loader";

const ENGINE_VERSION =
    "1.0";


function findRacquetRegistryEntry(
    productId
) {

    if (
        typeof productId !==
            "string" ||
        !productId.trim()
    ) {

        return null;
    }


    return (
        RACQUET_PRODUCT_REGISTRY
            .find(
                item =>
                    item?.id ===
                    productId
            ) ??
        null
    );
}


/**
 * ============================================================
 * Load Racquet For Comparison
 * ============================================================
 */

export async function loadComparisonRacquet(
    product
) {

    const productId =
        typeof product ===
            "string"
            ? product
            : product?.id;


    const registryEntry =
        findRacquetRegistryEntry(
            productId
        );


    if (
        !registryEntry
    ) {

        return {
            engine:
                ENGINE_NAME,

            version:
                ENGINE_VERSION,

            success:
                false,

            status:
                "product_not_found",

            product_id:
                productId ??
                null,

            source_file:
                null,

            product:
                null
        };
    }


    if (
        !registryEntry
            ?.source_file
    ) {

        return {
            engine:
                ENGINE_NAME,

            version:
                ENGINE_VERSION,

            success:
                false,

            status:
                "source_file_missing",

            product_id:
                registryEntry.id,

            source_file:
                null,

            product:
                null
        };
    }


    try {

        const raw =
            await loadKnowledgeJson(
                registryEntry
                    .source_file
            );


        const normalized =
            normalizeRacquetRecord(
                raw,
                {
                    source_file:
                        registryEntry
                            .source_file
                }
            );


        return {
            engine:
                ENGINE_NAME,

            version:
                ENGINE_VERSION,

            success:
                true,

            status:
                "ready",

            product_id:
                registryEntry.id,

            source_file:
                registryEntry
                    .source_file,

            registry: {
                id:
                    registryEntry.id,

                brand:
                    registryEntry.brand ??
                    null,

                model:
                    registryEntry.model ??
                    null,

                series:
                    registryEntry.series ??
                    null,

                release_year:
                    registryEntry
                        .release_year ??
                    null
            },

            product:
                normalized
        };

    } catch (
        error
    ) {

        return {
            engine:
                ENGINE_NAME,

            version:
                ENGINE_VERSION,

            success:
                false,

            status:
                "load_failed",

            product_id:
                registryEntry.id,

            source_file:
                registryEntry
                    .source_file,

            product:
                null,

            error: {
                message:
                    error instanceof Error
                        ? error.message
                        : String(
                            error
                        )
            }
        };
    }
}


/**
 * ============================================================
 * Load Pair
 * ============================================================
 */

export async function loadComparisonPair(
    productA,
    productB
) {

    const [
        resultA,
        resultB
    ] =
        await Promise.all([
            loadComparisonRacquet(
                productA
            ),

            loadComparisonRacquet(
                productB
            )
        ]);


    return {
        engine:
            ENGINE_NAME,

        version:
            ENGINE_VERSION,

        success:
            resultA.success ===
                true &&
            resultB.success ===
                true,

        product_a:
            resultA,

        product_b:
            resultB
    };
}


export default {
    loadComparisonRacquet,
    loadComparisonPair
};
