/**
 * ============================================================
 * EveryCourtAI
 * Cloudflare JSON Loader
 * Version: 1.0
 * ============================================================
 *
 * 文件路径：
 * utils/cloudflare_json_loader.js
 *
 * 作用：
 * Cloudflare Worker 专用 Knowledge Loader。
 *
 * 与本地 utils/json_loader.js 的区别：
 *
 * Local:
 *   node:fs → knowledge/
 *
 * Cloudflare:
 *   fetch → GitHub Raw → knowledge/
 *
 * 当前 V1 支持：
 *
 * loadKnowledgeDirectory("racquets")
 * loadKnowledgeDirectory("strings")
 *
 * ============================================================
 */


/**
 * ============================================================
 * GitHub 配置
 * ============================================================
 */

const GITHUB_RAW_BASE =
    "https://raw.githubusercontent.com/jrleighk/EveryCourtAI/main/";

const PRODUCT_LOOKUP_PATH =
    "knowledge/indexes/product_lookup.json";


/**
 * ============================================================
 * Cache
 * ============================================================
 */

let lookupCache =
    null;

const jsonCache =
    new Map();

const directoryCache =
    new Map();


/**
 * ============================================================
 * 工具
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
                    : String(error)
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
 * Product Lookup
 * ============================================================
 */

async function loadProductLookup() {

    if (
        lookupCache
    ) {

        return cloneData(
            lookupCache
        );

    }


    lookupCache =
        await fetchJson(
            PRODUCT_LOOKUP_PATH,
            {
                useCache:
                    true
            }
        );


    return cloneData(
        lookupCache
    );
}


/**
 * ============================================================
 * 单文件 Knowledge Loader
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
 * 从索引提取路径
 * ============================================================
 */

function extractPathsFromLookup(
    lookup,
    collectionName
) {

    const collection =
        lookup?.[
            collectionName
        ];


    if (
        !collection ||
        typeof collection !==
            "object"
    ) {

        return [];

    }


    const paths =
        [];


    for (
        const item
        of Object.values(
            collection
        )
    ) {

        const path =
            item?.path;


        if (
            typeof path ===
                "string" &&
            path.trim()
        ) {

            paths.push(
                normalizePath(
                    path
                )
            );

        }
    }


    return [
        ...new Set(
            paths
        )
    ].sort();
}


/**
 * ============================================================
 * 批量读取产品
 * ============================================================
 */

async function loadIndexedCollection(
    collectionName,
    {
        useCache = true,
        includePath = true
    } = {}
) {

    const cacheKey =
        JSON.stringify({
            collectionName,
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


    const lookup =
        await loadProductLookup();


    const paths =
        extractPathsFromLookup(
            lookup,
            collectionName
        );


    const output =
        [];


    /**
     * 分批加载，避免一次性产生过多请求
     */

    const batchSize =
        10;


    for (
        let index = 0;
        index < paths.length;
        index += batchSize
    ) {

        const batch =
            paths.slice(
                index,
                index + batchSize
            );


        const results =
            await Promise.all(
                batch.map(
                    async path => {

                        try {

                            const data =
                                await fetchJson(
                                    path,
                                    {
                                        useCache
                                    }
                                );


                            if (
                                includePath
                            ) {

                                return {
                                    path,

                                    file_name:
                                        path
                                            .split("/")
                                            .pop(),

                                    data
                                };

                            }


                            return data;

                        } catch (
                            error
                        ) {

                            console.warn(
                                "EveryCourtAI Cloudflare Loader skipped:",
                                path,
                                error
                            );


                            return null;

                        }

                    }
                )
            );


        output.push(
            ...results.filter(
                Boolean
            )
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
 * loadKnowledgeDirectory
 *
 * 与本地 Loader 保持相同函数名
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

        return loadIndexedCollection(
            "racquets",
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

        return loadIndexedCollection(
            "strings",
            options
        );

    }


    throw new Error(
        `EveryCourtAI Cloudflare Loader: unsupported directory in V1: ${normalized}`
    );
}


/**
 * ============================================================
 * Cache
 * ============================================================
 */

export function clearCloudflareJsonCache() {

    lookupCache =
        null;

    jsonCache.clear();

    directoryCache.clear();

}


export function getCloudflareJsonCacheStats() {

    return {
        lookup_cached:
            Boolean(
                lookupCache
            ),

        json_files_cached:
            jsonCache.size,

        directories_cached:
            directoryCache.size
    };

}


/**
 * ============================================================
 * Debug
 * ============================================================
 */

export function getCloudflareLoaderInfo() {

    return {
        loader:
            "cloudflare_json_loader",

        version:
            "1.0",

        github_base:
            GITHUB_RAW_BASE,

        lookup_path:
            PRODUCT_LOOKUP_PATH,

        supported_directories: [
            "racquets",
            "strings"
        ]
    };

}
