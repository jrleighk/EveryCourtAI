/**
 * ============================================================
 * EveryCourtAI
 * Runtime JSON Loader
 * Version: 1.0
 * ============================================================
 *
 * 文件路径：
 * utils/runtime_json_loader.js
 *
 * 作用：
 *
 * 为 EveryCourtAI Engine 提供统一的数据读取接口。
 *
 * Local / Codespaces:
 *
 * runtime = "local"
 *      ↓
 * utils/json_loader.js
 *      ↓
 * node:fs
 *      ↓
 * knowledge/
 *
 *
 * Cloudflare:
 *
 * runtime = "cloudflare"
 *      ↓
 * utils/cloudflare_json_loader.js
 *      ↓
 * fetch()
 *      ↓
 * GitHub Raw
 *
 *
 * ============================================================
 */


/**
 * ============================================================
 * Runtime
 * ============================================================
 *
 * 默认一定使用 local。
 *
 * 这样可以保证目前：
 *
 * npm test
 *
 * 完全不受影响。
 * ============================================================
 */

let currentRuntime =
    "local";


/**
 * ============================================================
 * 支持 Runtime
 * ============================================================
 */

const SUPPORTED_RUNTIMES =
    new Set([
        "local",
        "cloudflare"
    ]);


/**
 * ============================================================
 * Loader Cache
 * ============================================================
 *
 * 避免重复 dynamic import。
 * ============================================================
 */

let localLoaderModule =
    null;

let cloudflareLoaderModule =
    null;


/**
 * ============================================================
 * Normalize Runtime
 * ============================================================
 */

function normalizeRuntime(
    runtime
) {

    if (
        typeof runtime !== "string"
    ) {

        return null;

    }


    return runtime
        .trim()
        .toLowerCase();
}


/**
 * ============================================================
 * 设置 Runtime
 * ============================================================
 *
 * Local 默认无需调用。
 *
 * Cloudflare Worker 启动 /ai 前调用：
 *
 * setKnowledgeRuntime("cloudflare");
 *
 * ============================================================
 */

export function setKnowledgeRuntime(
    runtime
) {

    const normalized =
        normalizeRuntime(
            runtime
        );


    if (
        !SUPPORTED_RUNTIMES.has(
            normalized
        )
    ) {

        throw new Error(
            `EveryCourtAI Runtime Loader: unsupported runtime "${runtime}".`
        );

    }


    currentRuntime =
        normalized;


    return {
        success:
            true,

        runtime:
            currentRuntime
    };
}


/**
 * ============================================================
 * 获取当前 Runtime
 * ============================================================
 */

export function getKnowledgeRuntime() {

    return currentRuntime;

}


/**
 * ============================================================
 * 是否为 Cloudflare
 * ============================================================
 */

export function isCloudflareRuntime() {

    return (
        currentRuntime ===
        "cloudflare"
    );

}


/**
 * ============================================================
 * 是否为 Local
 * ============================================================
 */

export function isLocalRuntime() {

    return (
        currentRuntime ===
        "local"
    );

}


/**
 * ============================================================
 * Local Loader
 * ============================================================
 */

async function getLocalLoader() {

    if (
        localLoaderModule
    ) {

        return localLoaderModule;

    }


    /**
     * 注意：
     *
     * 使用 Dynamic Import。
     *
     * Cloudflare Runtime 不执行这一条，
     * 所以不会实际调用 Node fs Loader。
     */

    localLoaderModule =
        await import(
            "./json_loader.js"
        );


    return localLoaderModule;

}


/**
 * ============================================================
 * Cloudflare Loader
 * ============================================================
 */

async function getCloudflareLoader() {

    if (
        cloudflareLoaderModule
    ) {

        return cloudflareLoaderModule;

    }


    cloudflareLoaderModule =
        await import(
            "./cloudflare_json_loader.js"
        );


    return cloudflareLoaderModule;

}


/**
 * ============================================================
 * 获取当前 Loader
 * ============================================================
 */

async function getActiveLoader() {

    if (
        currentRuntime ===
        "cloudflare"
    ) {

        return getCloudflareLoader();

    }


    return getLocalLoader();

}


/**
 * ============================================================
 * Load Knowledge Directory
 * ============================================================
 *
 * Matching Engine 最重要的接口。
 *
 * 使用方式保持：
 *
 * loadKnowledgeDirectory("racquets")
 *
 * loadKnowledgeDirectory("strings")
 *
 * ============================================================
 */

export async function loadKnowledgeDirectory(
    knowledgeDirectory,
    options = {}
) {

    const loader =
        await getActiveLoader();


    if (
        typeof loader
            ?.loadKnowledgeDirectory !==
        "function"
    ) {

        throw new Error(
            `EveryCourtAI Runtime Loader: loadKnowledgeDirectory() is unavailable for runtime "${currentRuntime}".`
        );

    }


    return loader
        .loadKnowledgeDirectory(
            knowledgeDirectory,
            options
        );

}


/**
 * ============================================================
 * Load Knowledge JSON
 * ============================================================
 */

export async function loadKnowledgeJson(
    knowledgePath,
    options = {}
) {

    const loader =
        await getActiveLoader();


    if (
        typeof loader
            ?.loadKnowledgeJson !==
        "function"
    ) {

        throw new Error(
            `EveryCourtAI Runtime Loader: loadKnowledgeJson() is unavailable for runtime "${currentRuntime}".`
        );

    }


    return loader
        .loadKnowledgeJson(
            knowledgePath,
            options
        );

}


/**
 * ============================================================
 * Loader Information
 * ============================================================
 */

export async function getRuntimeLoaderInfo() {

    const loader =
        await getActiveLoader();


    let loaderInfo =
        null;


    if (
        currentRuntime ===
            "cloudflare" &&
        typeof loader
            ?.getCloudflareLoaderInfo ===
            "function"
    ) {

        loaderInfo =
            loader
                .getCloudflareLoaderInfo();

    }


    return {
        adapter:
            "runtime_json_loader",

        version:
            "1.0",

        runtime:
            currentRuntime,

        loader_info:
            loaderInfo
    };

}


/**
 * ============================================================
 * 清理 Cache
 * ============================================================
 */

export async function clearRuntimeLoaderCache() {

    /**
     * Local
     */

    if (
        localLoaderModule &&
        typeof localLoaderModule
            ?.clearJsonCache ===
            "function"
    ) {

        localLoaderModule
            .clearJsonCache();

    }


    /**
     * Cloudflare
     */

    if (
        cloudflareLoaderModule &&
        typeof cloudflareLoaderModule
            ?.clearCloudflareJsonCache ===
            "function"
    ) {

        cloudflareLoaderModule
            .clearCloudflareJsonCache();

    }


    return {
        success:
            true,

        runtime:
            currentRuntime
    };

}


/**
 * ============================================================
 * Runtime Status
 * ============================================================
 */

export function getRuntimeStatus() {

    return {
        adapter:
            "runtime_json_loader",

        version:
            "1.0",

        runtime:
            currentRuntime,

        supported_runtimes:
            [
                ...SUPPORTED_RUNTIMES
            ],

        local_loader_loaded:
            Boolean(
                localLoaderModule
            ),

        cloudflare_loader_loaded:
            Boolean(
                cloudflareLoaderModule
            )
    };

}
