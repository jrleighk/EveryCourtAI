/**
 * ============================================================
 * EveryCourtAI
 * Compiled Knowledge Catalog Builder
 * Version: 1.0
 * ============================================================
 *
 * 文件路径：
 * tools/build_compiled_catalogs.js
 *
 * 作用：
 *
 * 1. 读取：
 *    knowledge/indexes/product_lookup.json
 *
 * 2. 根据 lookup 中的正式路径读取产品 JSON
 *
 * 3. 编译完整 Racquet / String Catalog
 *
 * 4. 输出：
 *
 *    knowledge/compiled/racquets_catalog.json
 *    knowledge/compiled/strings_catalog.json
 *
 * 核心原则：
 *
 * product_lookup.json
 * = 产品路径唯一事实来源
 *
 * 不重新扫描目录决定产品集合。
 *
 * 这样可以确保：
 *
 * Local
 * Cloudflare
 * Testing
 * Production
 *
 * 使用完全相同的产品集合。
 *
 * ============================================================
 */


import fs from "node:fs/promises";
import path from "node:path";
import {
    fileURLToPath
} from "node:url";


/**
 * ============================================================
 * Version
 * ============================================================
 */

const BUILDER_NAME =
    "EveryCourtAI Compiled Catalog Builder";


const BUILDER_VERSION =
    "1.0";


/**
 * ============================================================
 * Project Paths
 * ============================================================
 */

const __filename =
    fileURLToPath(
        import.meta.url
    );


const __dirname =
    path.dirname(
        __filename
    );


const PROJECT_ROOT =
    path.resolve(
        __dirname,
        ".."
    );


const KNOWLEDGE_DIR =
    path.join(
        PROJECT_ROOT,
        "knowledge"
    );


const PRODUCT_LOOKUP_FILE =
    path.join(
        KNOWLEDGE_DIR,
        "indexes",
        "product_lookup.json"
    );


const COMPILED_DIR =
    path.join(
        KNOWLEDGE_DIR,
        "compiled"
    );


const RACQUETS_OUTPUT_FILE =
    path.join(
        COMPILED_DIR,
        "racquets_catalog.json"
    );


const STRINGS_OUTPUT_FILE =
    path.join(
        COMPILED_DIR,
        "strings_catalog.json"
    );


/**
 * ============================================================
 * Utilities
 * ============================================================
 */

function normalizeWebPath(
    value
) {

    return String(
        value ?? ""
    )
        .split(
            path.sep
        )
        .join(
            "/"
        )
        .replace(
            /^\/+/,
            ""
        );
}


function normalizeKey(
    value
) {

    return String(
        value ?? ""
    )
        .trim()
        .toLowerCase()
        .replace(
            /&/g,
            "and"
        )
        .replace(
            /[^a-z0-9\u4e00-\u9fff]+/g,
            "_"
        )
        .replace(
            /^_+|_+$/g,
            ""
        );
}


async function ensureDirectory(
    directory
) {

    await fs.mkdir(
        directory,
        {
            recursive:
                true
        }
    );
}


async function readJsonFile(
    absolutePath
) {

    const text =
        await fs.readFile(
            absolutePath,
            "utf8"
        );


    return JSON.parse(
        text
    );
}


async function writeJsonFile(
    absolutePath,
    data
) {

    await fs.writeFile(
        absolutePath,
        JSON.stringify(
            data,
            null,
            2
        ) + "\n",
        "utf8"
    );
}


function absoluteFromProjectPath(
    relativePath
) {

    const normalized =
        normalizeWebPath(
            relativePath
        );


    const absolute =
        path.resolve(
            PROJECT_ROOT,
            normalized
        );


    /**
     * Security:
     * 不允许 lookup 指向项目根目录之外。
     */

    if (
        !absolute.startsWith(
            PROJECT_ROOT +
            path.sep
        ) &&
        absolute !==
            PROJECT_ROOT
    ) {

        throw new Error(
            `Invalid path outside project root: ${relativePath}`
        );
    }


    return absolute;
}


/**
 * ============================================================
 * Lookup Validation
 * ============================================================
 */

function validateLookup(
    lookup
) {

    if (
        !lookup ||
        typeof lookup !==
            "object" ||
        Array.isArray(
            lookup
        )
    ) {

        throw new Error(
            "product_lookup.json must contain an object."
        );
    }


    if (
        !lookup.racquets ||
        typeof lookup.racquets !==
            "object"
    ) {

        throw new Error(
            "product_lookup.json has no valid racquets collection."
        );
    }


    if (
        !lookup.strings ||
        typeof lookup.strings !==
            "object"
    ) {

        throw new Error(
            "product_lookup.json has no valid strings collection."
        );
    }
}


/**
 * ============================================================
 * Build Collection
 * ============================================================
 */

async function buildCompiledCollection(
    lookupCollection,
    category
) {

    const products =
        [];


    const errors =
        [];


    const lookupEntries =
        Object.entries(
            lookupCollection
        );


    for (
        const [
            lookupId,
            lookupItem
        ]
        of lookupEntries
    ) {

        const relativePath =
            normalizeWebPath(
                lookupItem
                    ?.path
            );


        if (
            !relativePath
        ) {

            errors.push({

                id:
                    lookupId,

                path:
                    null,

                error:
                    "Missing lookup path."
            });


            continue;
        }


        const absolutePath =
            absoluteFromProjectPath(
                relativePath
            );


        let product;


        try {

            product =
                await readJsonFile(
                    absolutePath
                );

        } catch (
            error
        ) {

            errors.push({

                id:
                    lookupId,

                path:
                    relativePath,

                error:
                    error instanceof Error
                        ? error.message
                        : String(
                            error
                        )
            });


            continue;
        }


        if (
            !product ||
            typeof product !==
                "object" ||
            Array.isArray(
                product
            )
        ) {

            errors.push({

                id:
                    lookupId,

                path:
                    relativePath,

                error:
                    "Product JSON is not a valid object."
            });


            continue;
        }


        /**
         * Lookup ID 为 canonical ID。
         *
         * 产品 JSON 自己的 ID 如果存在，
         * 必须与 lookup ID 一致。
         */

        const productId =
            normalizeKey(
                product.id ??
                product.product_id ??
                product.slug ??
                ""
            );


        const normalizedLookupId =
            normalizeKey(
                lookupId
            );


        if (
            productId &&
            productId !==
                normalizedLookupId
        ) {

            errors.push({

                id:
                    lookupId,

                path:
                    relativePath,

                error:
                    `ID mismatch: lookup="${normalizedLookupId}", product="${productId}".`
            });


            continue;
        }


        /**
         * 保留完整产品 JSON。
         *
         * 加入 __catalog metadata，
         * 方便以后 Debug。
         */

        products.push({

            ...product,

            id:
                normalizedLookupId,

            __catalog: {

                category,

                source_path:
                    relativePath,

                lookup_name:
                    lookupItem
                        ?.name ??
                    null,

                lookup_brand:
                    lookupItem
                        ?.brand ??
                    null
            }
        });
    }


    /**
     * Catalog 排序稳定化。
     *
     * Cloudflare 每次读取都会得到相同顺序。
     */

    products.sort(
        (
            a,
            b
        ) =>
            String(
                a.id
            ).localeCompare(
                String(
                    b.id
                )
            )
    );


    return {

        products,

        errors
    };
}


/**
 * ============================================================
 * Catalog Envelope
 * ============================================================
 */

function createCatalog({

    category,

    products,

    sourceLookup,

    errors

}) {

    return {

        catalog:
            "EveryCourtAI Compiled Knowledge Catalog",

        version:
            "1.0",

        category,

        generated_at:
            new Date()
                .toISOString(),

        generator: {

            name:
                BUILDER_NAME,

            version:
                BUILDER_VERSION
        },

        source: {

            lookup:
                sourceLookup
        },

        product_count:
            products.length,

        error_count:
            errors.length,

        products
    };
}


/**
 * ============================================================
 * Required Products Validation
 * ============================================================
 */

function assertRequiredProduct(
    products,
    id,
    category
) {

    const found =
        products.some(
            product =>
                product?.id ===
                id
        );


    if (
        !found
    ) {

        throw new Error(
            `Required ${category} product missing from compiled catalog: ${id}`
        );
    }
}


/**
 * ============================================================
 * Main
 * ============================================================
 */

async function main() {

    console.log(
        ""
    );


    console.log(
        "============================================================"
    );


    console.log(
        BUILDER_NAME
    );


    console.log(
        `Version ${BUILDER_VERSION}`
    );


    console.log(
        "============================================================"
    );


    console.log(
        ""
    );


    /**
     * STEP 1
     * Output directory
     */

    await ensureDirectory(
        COMPILED_DIR
    );


    /**
     * STEP 2
     * Product Lookup
     */

    const lookup =
        await readJsonFile(
            PRODUCT_LOOKUP_FILE
        );


    validateLookup(
        lookup
    );


    /**
     * STEP 3
     * Racquets
     */

    console.log(
        "Building racquet catalog..."
    );


    const racquetResult =
        await buildCompiledCollection(
            lookup.racquets,
            "racquet"
        );


    /**
     * STEP 4
     * Strings
     */

    console.log(
        "Building string catalog..."
    );


    const stringResult =
        await buildCompiledCollection(
            lookup.strings,
            "string"
        );


    /**
     * STEP 5
     * Critical validation
     */

    assertRequiredProduct(
        racquetResult.products,
        "wilson_rf_01_pro_classic",
        "racquet"
    );


    assertRequiredProduct(
        stringResult.products,
        "wilson_natural_gut_17",
        "string"
    );


    /**
     * STEP 6
     * Catalog envelopes
     */

    const racquetCatalog =
        createCatalog({

            category:
                "racquet",

            products:
                racquetResult.products,

            sourceLookup:
                "knowledge/indexes/product_lookup.json",

            errors:
                racquetResult.errors
        });


    const stringCatalog =
        createCatalog({

            category:
                "string",

            products:
                stringResult.products,

            sourceLookup:
                "knowledge/indexes/product_lookup.json",

            errors:
                stringResult.errors
        });


    /**
     * STEP 7
     * Write
     */

    await writeJsonFile(
        RACQUETS_OUTPUT_FILE,
        racquetCatalog
    );


    await writeJsonFile(
        STRINGS_OUTPUT_FILE,
        stringCatalog
    );


    /**
     * STEP 8
     * Report
     */

    console.log(
        ""
    );


    console.log(
        "Compiled catalogs created."
    );


    console.log(
        ""
    );


    console.log(
        `Racquets: ${racquetResult.products.length}`
    );


    console.log(
        `Strings:  ${stringResult.products.length}`
    );


    console.log(
        `Racquet errors: ${racquetResult.errors.length}`
    );


    console.log(
        `String errors:  ${stringResult.errors.length}`
    );


    console.log(
        ""
    );


    console.log(
        normalizeWebPath(
            path.relative(
                PROJECT_ROOT,
                RACQUETS_OUTPUT_FILE
            )
        )
    );


    console.log(
        normalizeWebPath(
            path.relative(
                PROJECT_ROOT,
                STRINGS_OUTPUT_FILE
            )
        )
    );


    /**
     * 不静默隐藏错误。
     */

    if (
        racquetResult.errors.length >
            0
    ) {

        console.log(
            ""
        );


        console.log(
            "Racquet catalog warnings:"
        );


        console.table(
            racquetResult.errors
        );
    }


    if (
        stringResult.errors.length >
            0
    ) {

        console.log(
            ""
        );


        console.log(
            "String catalog warnings:"
        );


        console.table(
            stringResult.errors
        );
    }


    console.log(
        ""
    );


    console.log(
        "Critical products verified:"
    );


    console.log(
        "✓ wilson_rf_01_pro_classic"
    );


    console.log(
        "✓ wilson_natural_gut_17"
    );


    console.log(
        ""
    );


    console.log(
        "BUILD COMPLETE"
    );


    console.log(
        ""
    );
}


/**
 * ============================================================
 * Execute
 * ============================================================
 */

main()
    .catch(
        error => {

            console.error(
                ""
            );


            console.error(
                "BUILD FAILED"
            );


            console.error(
                error
            );


            process.exitCode =
                1;
        }
    );