/**
 * ============================================================
 * EveryCourtAI
 * Cloudflare JSON Loader
 * Version: 1.1
 * ============================================================
 *
 * 文件路径：
 * utils/cloudflare_json_loader.js
 *
 * 作用：
 *
 * Cloudflare Worker 专用 Knowledge Loader。
 *
 * V1.0:
 *   product_lookup.json
 *   ↓
 *   数百次 GitHub Raw fetch
 *   ↓
 *   单个失败时静默跳过产品
 *
 * V1.1:
 *   racquets_catalog.json
 *   strings_catalog.json
 *   ↓
 *   每类只读取一个完整 Catalog
 *   ↓
 *   Candidate Pool 稳定、确定
 *
 * 核心目标：
 *
 * Local Runtime
 * Cloudflare Runtime
 *
 * 必须使用相同的正式产品集合。
 *
 * ============================================================
 */


/**
 * ============================================================
 * Configuration
 * ============================================================
 */

const LOADER_NAME =
    "cloudflare_json_loader";


const LOADER_VERSION =
    "1.1";


const GITHUB_RAW_BASE =
    "https://raw.githubusercontent.com/jrleighk/EveryCourtAI/main/";


/**
 * Compiled Catalogs
 */

const RACQUETS_CATALOG_PATH =
    "knowledge/compiled/racquets_catalog.json";


const STRINGS_CATALOG_PATH =
    "knowledge/compiled/strings_catalog.json";


/**
 * ============================================================
 * Cache
 * ============================================================
 */

const jsonCache =
    new Map();


const directoryCache =
    new Map();


/**
 * ============================================================
 * Utilities
 * ============================================================
 */

function normalizePath(
    value
) {

    return String(
        value ?? ""
    )
        .trim()
        .replace(
            /^\/+/,
            ""
        );
}


function cloneData(
    value
) {

    return structuredClone(
        value
    );
}


function isPlainObject(
    value
) {

    return (
        value !== null &&
        typeof value ===
            "object" &&
        !Array.isArray(
            value
        )
    );
}


/**
 * ============================================================
 * Fetch JSON
 * ============================================================
 */

async function fetchJson(

    relativePath,

    {
        useCache = true
    } = {}

) {

    const normalizedPath =
        normalizePath(
            relativePath
        );


    if (
        !normalizedPath
    ) {

        throw new Error(
            "EveryCourtAI Cloudflare Loader: path is empty."
        );
    }


    /**
     * Worker-isolate memory cache.
     */

    if (
        useCache &&
        jsonCache.has(
            normalizedPath
        )
    ) {

        return cloneData(
            jsonCache.get(
                normalizedPath
            )
        );
    }


    const url =
        GITHUB_RAW_BASE +
        normalizedPath;


    const response =
        await fetch(
            url,
            {

                headers: {

                    Accept:
                        "application/json"
                }
            }
        );


    if (
        !response.ok
    ) {

        throw new Error(
            `EveryCourtAI Cloudflare Loader: unable to fetch ${normalizedPath}. HTTP ${response.status}`
        );
    }


    let data;


    try {

        data =
            await response.json();

    } catch (
        error
    ) {

        throw new Error(
            `EveryCourtAI Cloudflare Loader: invalid JSON in ${normalizedPath}: ${
                error instanceof Error
                    ? error.message
                    : String(
                        error
                    )
            }`
        );
    }


    jsonCache.set(
        normalizedPath,
        data
    );


    return cloneData(
        data
    );
}


/**
 * ============================================================
 * Load Single Knowledge JSON
 * ============================================================
 *
 * 单文件加载仍然允许直接读取 GitHub Raw。
 *
 * Engine 中的普通知识文件，例如：
 *
 * knowledge/recommendations/...
 * knowledge/profiles/...
 *
 * 可以继续使用这一接口。
 *
 * ============================================================
 */

export async function loadKnowledgeJson(

    knowledgePath,

    options = {}

) {

    const normalized =
        normalizePath(
            knowledgePath
        )
            .replace(
                /^knowledge\//,
                ""
            );


    return fetchJson(
        `knowledge/${normalized}`,
        options
    );
}


/**
 * ============================================================
 * Catalog Validation
 * ============================================================
 */

function validateCatalog(

    catalog,

    expectedCategory,

    catalogPath

) {

    if (
        !isPlainObject(
            catalog
        )
    ) {

        throw new Error(
            `EveryCourtAI Cloudflare Loader: invalid compiled catalog object: ${catalogPath}`
        );
    }


    if (
        catalog.category !==
            expectedCategory
    ) {

        throw new Error(
            `EveryCourtAI Cloudflare Loader: compiled catalog category mismatch in ${catalogPath}. Expected "${expectedCategory}", received "${catalog.category}".`
        );
    }


    if (
        !Array.isArray(
            catalog.products
        )
    ) {

        throw new Error(
            `EveryCourtAI Cloudflare Loader: compiled catalog has no products array: ${catalogPath}`
        );
    }


    if (
        catalog.error_count !==
            undefined &&
        Number(
            catalog.error_count
        ) !==
            0
    ) {

        throw new Error(
            `EveryCourtAI Cloudflare Loader: compiled catalog contains build errors: ${catalogPath}`
        );
    }


    return true;
}


/**
 * ============================================================
 * Load Compiled Catalog
 * ============================================================
 */

async function loadCompiledCatalog(

    category,

    {
        useCache = true
    } = {}

) {

    let catalogPath;


    if (
        category ===
        "racquet"
    ) {

        catalogPath =
            RACQUETS_CATALOG_PATH;

    } else if (
        category ===
        "string"
    ) {

        catalogPath =
            STRINGS_CATALOG_PATH;

    } else {

        throw new Error(
            `EveryCourtAI Cloudflare Loader: unsupported compiled catalog category "${category}".`
        );
    }


    const catalog =
        await fetchJson(
            catalogPath,
            {
                useCache
            }
        );


    validateCatalog(
        catalog,
        category,
        catalogPath
    );


    return catalog;
}


/**
 * ============================================================
 * Product Source Path
 * ============================================================
 */

function getProductSourcePath(
    product
) {

    const sourcePath =
        product
            ?.__catalog
            ?.source_path;


    if (
        typeof sourcePath ===
            "string" &&
        sourcePath.trim()
    ) {

        return normalizePath(
            sourcePath
        );
    }


    /**
     * Defensive fallback.
     *
     * 正常情况下 Compiled Builder
     * 一定会写入 __catalog.source_path。
     */

    return null;
}


/**
 * ============================================================
 * Convert Catalog Products to Loader Records
 * ============================================================
 *
 * Local json_loader.js 的 directory output：
 *
 * [
 *   {
 *     path,
 *     file_name,
 *     data
 *   }
 * ]
 *
 * Cloudflare 必须保持同样的数据 contract。
 *
 * ============================================================
 */

function catalogProductsToDirectoryRecords(

    products,

    {
        includePath = true
    } = {}

) {

    if (
        !Array.isArray(
            products
        )
    ) {

        return [];
    }


    if (
        includePath !==
            true
    ) {

        return cloneData(
            products
        );
    }


    return products.map(
        product => {

            const sourcePath =
                getProductSourcePath(
                    product
                );


            const fileName =
                sourcePath
                    ? sourcePath
                        .split(
                            "/"
                        )
                        .pop()
                    : `${product?.id ?? "unknown"}.json`;


            return {

                path:
                    sourcePath,

                file_name:
                    fileName,

                data:
                    product
            };
        }
    );
}


/**
 * ============================================================
 * Load Compiled Collection
 * ============================================================
 */

async function loadCompiledCollection(

    category,

    {
        useCache = true,
        includePath = true
    } = {}

) {

    const cacheKey =
        JSON.stringify({

            category,

            includePath
        });


    if (
        useCache &&
        directoryCache.has(
            cacheKey
        )
    ) {

        return cloneData(
            directoryCache.get(
                cacheKey
            )
        );
    }


    /**
     * One GitHub fetch per complete category.
     */

    const catalog =
        await loadCompiledCatalog(
            category,
            {
                useCache
            }
        );


    const output =
        catalogProductsToDirectoryRecords(
            catalog.products,
            {
                includePath
            }
        );


    /**
     * Critical safety check.
     *
     * Catalog 声明数量必须与实际数量一致。
     */

    const expectedCount =
        Number(
            catalog.product_count
        );


    if (
        Number.isFinite(
            expectedCount
        ) &&
        expectedCount !==
            output.length
    ) {

        throw new Error(
            `EveryCourtAI Cloudflare Loader: compiled ${category} catalog count mismatch. Expected ${expectedCount}, loaded ${output.length}.`
        );
    }


    /**
     * 空 Candidate Pool 不允许静默继续。
     */

    if (
        output.length ===
        0
    ) {

        throw new Error(
            `EveryCourtAI Cloudflare Loader: compiled ${category} catalog is empty.`
        );
    }


    directoryCache.set(
        cacheKey,
        output
    );


    return cloneData(
        output
    );
}


/**
 * ============================================================
 * Load Knowledge Directory
 * ============================================================
 */

export async function loadKnowledgeDirectory(

    knowledgeDirectory,

    options = {}

) {

    const normalized =
        normalizePath(
            knowledgeDirectory
        )
            .replace(
                /^knowledge\//,
                ""
            )
            .replace(
                /\/+$/,
                ""
            );


    /**
     * Racquets
     */

    if (
        normalized ===
            "racquets"
    ) {

        return loadCompiledCollection(
            "racquet",
            options
        );
    }


    /**
     * Strings
     */

    if (
        normalized ===
            "strings"
    ) {

        return loadCompiledCollection(
            "string",
            options
        );
    }


    throw new Error(
        `EveryCourtAI Cloudflare Loader: unsupported directory in V1.1: ${normalized}`
    );
}


/**
 * ============================================================
 * Cache Control
 * ============================================================
 */

export function clearJsonCache() {

    jsonCache.clear();

    directoryCache.clear();
}


/**
 * ============================================================
 * Debug / Health Info
 * ============================================================
 */

export function getCloudflareLoaderInfo() {

    return {

        loader:
            LOADER_NAME,

        version:
            LOADER_VERSION,

        github_base:
            GITHUB_RAW_BASE,

        mode:
            "compiled_catalog",

        catalogs: {

            racquets:
                RACQUETS_CATALOG_PATH,

            strings:
                STRINGS_CATALOG_PATH
        },

        supported_directories: [

            "racquets",

            "strings"
        ]
    };
}