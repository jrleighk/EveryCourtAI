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
 * 根据运行环境选择不同的 JSON Loader。
 *
 * Local / Node:
 *   json_loader.js
 *
 * Cloudflare Worker:
 *   cloudflare_json_loader.js
 *
 * Engine 层只调用本文件，
 * 不需要知道底层运行环境。
 * ============================================================
 */

let knowledgeRuntime = "local";

export function setKnowledgeRuntime(runtime) {
    const normalized =
        String(runtime ?? "")
            .trim()
            .toLowerCase();

    if (
        normalized !== "local" &&
        normalized !== "cloudflare"
    ) {
        throw new Error(
            `EveryCourtAI Runtime JSON Loader: unsupported runtime "${runtime}".`
        );
    }

    knowledgeRuntime = normalized;
}

export function getKnowledgeRuntime() {
    return knowledgeRuntime;
}

export async function loadKnowledgeJson(
    knowledgePath,
    options = {}
) {
    if (
        knowledgeRuntime === "cloudflare"
    ) {
        const module =
            await import(
                "./cloudflare_json_loader.js"
            );

        return module.loadKnowledgeJson(
            knowledgePath,
            options
        );
    }

    const module =
        await import(
            "./json_loader.js"
        );

    return module.loadKnowledgeJson(
        knowledgePath,
        options
    );
}

export async function loadKnowledgeDirectory(
    knowledgeDirectory,
    options = {}
) {
    if (
        knowledgeRuntime === "cloudflare"
    ) {
        const module =
            await import(
                "./cloudflare_json_loader.js"
            );

        return module.loadKnowledgeDirectory(
            knowledgeDirectory,
            options
        );
    }

    const module =
        await import(
            "./json_loader.js"
        );

    return module.loadKnowledgeDirectory(
        knowledgeDirectory,
        options
    );
}

export async function clearRuntimeJsonCache() {
    if (
        knowledgeRuntime === "cloudflare"
    ) {
        const module =
            await import(
                "./cloudflare_json_loader.js"
            );

        if (
            typeof module.clearJsonCache === "function"
        ) {
            module.clearJsonCache();
        }

        return;
    }

    const module =
        await import(
            "./json_loader.js"
        );

    if (
        typeof module.clearJsonCache === "function"
    ) {
        module.clearJsonCache();
    }
}
