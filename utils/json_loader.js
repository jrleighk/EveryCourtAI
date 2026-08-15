/**
 * ============================================================
 * EveryCourtAI
 * JSON Loader Utility
 * Version: 1.0
 * ============================================================
 * Purpose:
 * Centralized JSON loading utility for EveryCourtAI.
 *
 * Responsibilities:
 * 1. Load a single JSON file
 * 2. Load all JSON files inside a directory
 * 3. Recursively scan nested knowledge directories
 * 4. Cache loaded JSON data
 * 5. Return safe structured errors
 *
 * Notes:
 * - Designed for local / Node-style development first.
 * - Cloudflare Worker adaptation will be handled later.
 * ============================================================
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * ============================================================
 * Base Paths
 * ============================================================
 */

const CURRENT_FILE = fileURLToPath(import.meta.url);
const CURRENT_DIR = path.dirname(CURRENT_FILE);

const PROJECT_ROOT = path.resolve(
    CURRENT_DIR,
    ".."
);

const KNOWLEDGE_ROOT = path.join(
    PROJECT_ROOT,
    "knowledge"
);

/**
 * ============================================================
 * Cache
 * ============================================================
 */

const jsonCache = new Map();
const directoryCache = new Map();

/**
 * ============================================================
 * Utility Functions
 * ============================================================
 */

/**
 * Normalize a path and prevent directory traversal.
 *
 * @param {string} inputPath
 * @returns {string}
 */
function normalizeProjectPath(inputPath) {
    if (
        typeof inputPath !== "string" ||
        !inputPath.trim()
    ) {
        throw new Error(
            "EveryCourtAI JSON Loader: path must be a non-empty string."
        );
    }

    const resolvedPath = path.resolve(
        PROJECT_ROOT,
        inputPath
    );

    if (
        resolvedPath !== PROJECT_ROOT &&
        !resolvedPath.startsWith(
            PROJECT_ROOT + path.sep
        )
    ) {
        throw new Error(
            "EveryCourtAI JSON Loader: invalid path outside project root."
        );
    }

    return resolvedPath;
}

/**
 * Determine whether a file is JSON.
 *
 * @param {string} fileName
 * @returns {boolean}
 */
function isJsonFile(fileName) {
    return (
        typeof fileName === "string" &&
        fileName.toLowerCase().endsWith(".json")
    );
}

/**
 * Generate a stable relative path.
 *
 * @param {string} absolutePath
 * @returns {string}
 */
function getRelativePath(absolutePath) {
    return path
        .relative(
            PROJECT_ROOT,
            absolutePath
        )
        .split(path.sep)
        .join("/");
}

/**
 * ============================================================
 * Load Single JSON
 * ============================================================
 */

/**
 * Load one JSON file.
 *
 * Example:
 *
 * loadJson(
 *   "knowledge/players/player_profile_schema.json"
 * )
 *
 * @param {string} relativePath
 * @param {Object} options
 * @returns {Promise<Object>}
 */
export async function loadJson(
    relativePath,
    options = {}
) {
    const {
        useCache = true,
        clone = true
    } = options;

    const absolutePath =
        normalizeProjectPath(
            relativePath
        );

    if (
        !isJsonFile(
            absolutePath
        )
    ) {
        throw new Error(
            `EveryCourtAI JSON Loader: not a JSON file: ${relativePath}`
        );
    }

    if (
        useCache &&
        jsonCache.has(
            absolutePath
        )
    ) {
        const cached =
            jsonCache.get(
                absolutePath
            );

        return clone
            ? structuredClone(cached)
            : cached;
    }

    let raw;

    try {
        raw = await fs.readFile(
            absolutePath,
            "utf8"
        );
    } catch (error) {
        throw new Error(
            `EveryCourtAI JSON Loader: unable to read ${relativePath}: ${error.message}`
        );
    }

    let parsed;

    try {
        parsed = JSON.parse(raw);
    } catch (error) {
        throw new Error(
            `EveryCourtAI JSON Loader: invalid JSON in ${relativePath}: ${error.message}`
        );
    }

    jsonCache.set(
        absolutePath,
        parsed
    );

    return clone
        ? structuredClone(parsed)
        : parsed;
}

/**
 * ============================================================
 * Load Knowledge JSON
 * ============================================================
 */

/**
 * Convenience loader for knowledge/.
 *
 * Example:
 *
 * loadKnowledgeJson(
 *   "players/playing_styles/all_court.json"
 * )
 *
 * @param {string} knowledgePath
 * @returns {Promise<Object>}
 */
export async function loadKnowledgeJson(
    knowledgePath,
    options = {}
) {
    const normalized =
        String(
            knowledgePath
        )
            .replace(/^\/+/, "")
            .replace(/^knowledge\//, "");

    return loadJson(
        `knowledge/${normalized}`,
        options
    );
}

/**
 * ============================================================
 * Recursive Directory Scanner
 * ============================================================
 */

/**
 * Recursively find every JSON file
 * inside a directory.
 *
 * @param {string} absoluteDirectory
 * @returns {Promise<string[]>}
 */
async function scanJsonFiles(
    absoluteDirectory
) {
    let entries;

    try {
        entries =
            await fs.readdir(
                absoluteDirectory,
                {
                    withFileTypes: true
                }
            );
    } catch (error) {
        throw new Error(
            `EveryCourtAI JSON Loader: unable to scan ${getRelativePath(
                absoluteDirectory
            )}: ${error.message}`
        );
    }

    const results = [];

    for (const entry of entries) {
        const fullPath =
            path.join(
                absoluteDirectory,
                entry.name
            );

        if (
            entry.isDirectory()
        ) {
            const nestedFiles =
                await scanJsonFiles(
                    fullPath
                );

            results.push(
                ...nestedFiles
            );

            continue;
        }

        if (
            entry.isFile() &&
            isJsonFile(
                entry.name
            )
        ) {
            results.push(
                fullPath
            );
        }
    }

    return results;
}

/**
 * ============================================================
 * Load Directory
 * ============================================================
 */

/**
 * Load all JSON files inside a directory.
 *
 * Recursive by default.
 *
 * Example:
 *
 * loadJsonDirectory(
 *   "knowledge/strings"
 * )
 *
 * @param {string} relativeDirectory
 * @param {Object} options
 * @returns {Promise<Array>}
 */
export async function loadJsonDirectory(
    relativeDirectory,
    options = {}
) {
    const {
        recursive = true,
        useCache = true,
        includePath = true
    } = options;

    const absoluteDirectory =
        normalizeProjectPath(
            relativeDirectory
        );

    const cacheKey =
        JSON.stringify({
            absoluteDirectory,
            recursive,
            includePath
        });

    if (
        useCache &&
        directoryCache.has(
            cacheKey
        )
    ) {
        return structuredClone(
            directoryCache.get(
                cacheKey
            )
        );
    }

    let files;

    if (recursive) {
        files =
            await scanJsonFiles(
                absoluteDirectory
            );
    } else {
        const entries =
            await fs.readdir(
                absoluteDirectory,
                {
                    withFileTypes: true
                }
            );

        files =
            entries
                .filter(
                    entry =>
                        entry.isFile() &&
                        isJsonFile(
                            entry.name
                        )
                )
                .map(
                    entry =>
                        path.join(
                            absoluteDirectory,
                            entry.name
                        )
                );
    }

    files.sort();

    const output = [];

    for (const absoluteFilePath of files) {
        const relativeFilePath =
            getRelativePath(
                absoluteFilePath
            );

        const data =
            await loadJson(
                relativeFilePath,
                {
                    useCache,
                    clone: false
                }
            );

        if (includePath) {
            output.push({
                path:
                    relativeFilePath,

                file_name:
                    path.basename(
                        absoluteFilePath
                    ),

                data
            });
        } else {
            output.push(
                data
            );
        }
    }

    directoryCache.set(
        cacheKey,
        output
    );

    return structuredClone(
        output
    );
}

/**
 * ============================================================
 * Knowledge Directory Convenience Loader
 * ============================================================
 */

/**
 * Example:
 *
 * loadKnowledgeDirectory("racquets")
 * loadKnowledgeDirectory("strings/wilson")
 *
 * @param {string} knowledgeDirectory
 * @returns {Promise<Array>}
 */
export async function loadKnowledgeDirectory(
    knowledgeDirectory,
    options = {}
) {
    const normalized =
        String(
            knowledgeDirectory
        )
            .replace(/^\/+/, "")
            .replace(/^knowledge\//, "");

    return loadJsonDirectory(
        `knowledge/${normalized}`,
        options
    );
}

/**
 * ============================================================
 * Create ID Index
 * ============================================================
 */

/**
 * Convert loaded JSON records into an ID map.
 *
 * Useful for:
 *
 * racquetIndex.get("wilson_rf_01_pro")
 * stringIndex.get("yonex_polytour_pro")
 *
 * @param {Array} records
 * @param {string} idField
 * @returns {Map}
 */
export function createIdIndex(
    records,
    idField = "id"
) {
    const index =
        new Map();

    if (
        !Array.isArray(
            records
        )
    ) {
        return index;
    }

    for (const record of records) {
        const data =
            record?.data ??
            record;

        const id =
            data?.[idField];

        if (
            typeof id !== "string" ||
            !id.trim()
        ) {
            continue;
        }

        index.set(
            id.trim(),
            data
        );
    }

    return index;
}

/**
 * ============================================================
 * Find By ID
 * ============================================================
 */

/**
 * Find one JSON item by ID.
 *
 * @param {Array} records
 * @param {string} targetId
 * @returns {Object|null}
 */
export function findById(
    records,
    targetId
) {
    if (
        !Array.isArray(
            records
        ) ||
        !targetId
    ) {
        return null;
    }

    const normalizedTarget =
        String(
            targetId
        )
            .trim()
            .toLowerCase();

    for (const record of records) {
        const data =
            record?.data ??
            record;

        const id =
            data?.id;

        if (
            typeof id === "string" &&
            id
                .trim()
                .toLowerCase() ===
                normalizedTarget
        ) {
            return data;
        }
    }

    return null;
}

/**
 * ============================================================
 * Search Records
 * ============================================================
 */

/**
 * Lightweight keyword search.
 *
 * This is NOT the final semantic search engine.
 *
 * @param {Array} records
 * @param {string} query
 * @returns {Array}
 */
export function searchRecords(
    records,
    query
) {
    if (
        !Array.isArray(
            records
        ) ||
        typeof query !== "string" ||
        !query.trim()
    ) {
        return [];
    }

    const normalizedQuery =
        query
            .trim()
            .toLowerCase();

    return records.filter(
        record => {

            const data =
                record?.data ??
                record;

            let serialized;

            try {
                serialized =
                    JSON.stringify(
                        data
                    )
                        .toLowerCase();
            } catch {
                return false;
            }

            return serialized.includes(
                normalizedQuery
            );
        }
    );
}

/**
 * ============================================================
 * Knowledge Snapshot
 * ============================================================
 */

/**
 * Load the major EveryCourtAI knowledge collections.
 *
 * Useful later for matching_engine.js.
 *
 * @returns {Promise<Object>}
 */
export async function loadKnowledgeSnapshot() {
    const [
        racquets,
        strings,
        players,
        recommendations,
        decisionRules,
        inference
    ] = await Promise.all([
        loadKnowledgeDirectory(
            "racquets"
        ),

        loadKnowledgeDirectory(
            "strings"
        ),

        loadKnowledgeDirectory(
            "players"
        ),

        loadKnowledgeDirectory(
            "recommendations"
        ),

        loadKnowledgeDirectory(
            "decision_rules"
        ),

        loadKnowledgeDirectory(
            "inference"
        )
    ]);

    return {
        loaded_at:
            new Date().toISOString(),

        counts: {
            racquets:
                racquets.length,

            strings:
                strings.length,

            players:
                players.length,

            recommendations:
                recommendations.length,

            decision_rules:
                decisionRules.length,

            inference:
                inference.length
        },

        racquets,
        strings,
        players,
        recommendations,
        decision_rules:
            decisionRules,

        inference
    };
}

/**
 * ============================================================
 * Cache Control
 * ============================================================
 */

/**
 * Clear all loader caches.
 */
export function clearJsonCache() {
    jsonCache.clear();
    directoryCache.clear();
}

/**
 * Return cache statistics.
 */
export function getJsonCacheStats() {
    return {
        json_files_cached:
            jsonCache.size,

        directories_cached:
            directoryCache.size
    };
}

/**
 * ============================================================
 * Paths Export
 * ============================================================
 */

export const PATHS = {
    project_root:
        PROJECT_ROOT,

    knowledge_root:
        KNOWLEDGE_ROOT
};
