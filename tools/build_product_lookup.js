/**
 * ============================================================
 * EveryCourtAI
 * Product Lookup Builder
 * Version: 1.0
 * ============================================================
 *
 * 文件路径：
 * tools/build_product_lookup.js
 *
 * 作用：
 * 1. 自动扫描 knowledge/racquets
 * 2. 自动扫描 knowledge/strings
 * 3. 读取每一个真实存在的 JSON 文件
 * 4. 自动建立 Product Lookup Index
 * 5. 输出：
 *    knowledge/indexes/product_lookup.json
 *
 * 重要：
 * - 不再手工维护产品路径
 * - 自动使用真实文件名
 * - 避免 Cloudflare Loader 因错误路径产生 HTTP 404
 *
 * ============================================================
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";


/**
 * ============================================================
 * 基础路径
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

const RACQUETS_DIR =
    path.join(
        KNOWLEDGE_DIR,
        "racquets"
    );

const STRINGS_DIR =
    path.join(
        KNOWLEDGE_DIR,
        "strings"
    );

const INDEX_DIR =
    path.join(
        KNOWLEDGE_DIR,
        "indexes"
    );

const OUTPUT_FILE =
    path.join(
        INDEX_DIR,
        "product_lookup.json"
    );


/**
 * ============================================================
 * 工具函数
 * ============================================================
 */

/**
 * 将字符串标准化为 ID。
 */
function normalizeKey(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .trim()
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "_")
        .replace(/^_+|_+$/g, "");
}


/**
 * 将 Windows 路径转换为 Web / GitHub 路径。
 */
function normalizePath(value) {

    return value
        .split(path.sep)
        .join("/");
}


/**
 * 安全读取 JSON。
 */
async function readJson(
    filePath
) {

    try {

        const text =
            await fs.readFile(
                filePath,
                "utf8"
            );

        return JSON.parse(
            text
        );

    } catch (error) {

        console.warn(
            "⚠️ Skipped invalid JSON:",
            normalizePath(
                path.relative(
                    PROJECT_ROOT,
                    filePath
                )
            )
        );

        console.warn(
            "   Reason:",
            error.message
        );

        return null;
    }
}


/**
 * ============================================================
 * 递归扫描 JSON 文件
 * ============================================================
 */

async function findJsonFiles(
    directory
) {

    const output = [];

    let entries;

    try {

        entries =
            await fs.readdir(
                directory,
                {
                    withFileTypes: true
                }
            );

    } catch (error) {

        console.warn(
            "⚠️ Unable to read directory:",
            directory
        );

        console.warn(
            error.message
        );

        return output;
    }


    for (
        const entry
        of entries
    ) {

        /**
         * 忽略隐藏文件。
         */

        if (
            entry.name.startsWith(".")
        ) {
            continue;
        }


        const fullPath =
            path.join(
                directory,
                entry.name
            );


        /**
         * 递归目录。
         */

        if (
            entry.isDirectory()
        ) {

            const nestedFiles =
                await findJsonFiles(
                    fullPath
                );

            output.push(
                ...nestedFiles
            );

            continue;
        }


        /**
         * 只读取 JSON。
         */

        if (
            entry.isFile() &&
            entry.name
                .toLowerCase()
                .endsWith(".json")
        ) {

            output.push(
                fullPath
            );
        }
    }


    return output;
}


/**
 * ============================================================
 * 产品字段读取
 * ============================================================
 */

function getProductId(
    data,
    filePath
) {

    const rawId =
        data?.id ??
        data?.product_id ??
        data?.slug ??
        null;


    if (rawId) {

        return normalizeKey(
            rawId
        );
    }


    /**
     * JSON 内没有 ID 时，
     * 使用文件名作为稳定 ID。
     */

    return normalizeKey(
        path.basename(
            filePath,
            ".json"
        )
    );
}


function getProductName(
    data,
    filePath
) {

    return (
        data?.name ??
        data?.model ??
        data?.product_name ??
        data?.display_name ??
        path.basename(
            filePath,
            ".json"
        )
    );
}


function getProductBrand(
    data,
    filePath
) {

    const explicitBrand =
        data?.brand ??
        data?.manufacturer ??
        null;


    if (explicitBrand) {

        return String(
            explicitBrand
        ).trim();
    }


    /**
     * 如果 JSON 没有 brand，
     * 从目录名称推断。
     *
     * 例如：
     *
     * knowledge/racquets/wilson/xxx.json
     *
     * brand = wilson
     */

    const parentDirectory =
        path.basename(
            path.dirname(
                filePath
            )
        );


    if (
        parentDirectory
    ) {

        return parentDirectory
            .replace(/_/g, " ")
            .replace(
                /\b\w/g,
                character =>
                    character.toUpperCase()
            );
    }


    return null;
}


/**
 * ============================================================
 * 建立单个 Collection
 * ============================================================
 */

async function buildCollection(
    directory,
    category
) {

    const files =
        await findJsonFiles(
            directory
        );


    const products = {};


    for (
        const filePath
        of files
    ) {

        const data =
            await readJson(
                filePath
            );


        if (!data) {
            continue;
        }


        const id =
            getProductId(
                data,
                filePath
            );


        if (!id) {

            console.warn(
                "⚠️ Product has no usable ID:",
                filePath
            );

            continue;
        }


        const relativePath =
            normalizePath(
                path.relative(
                    PROJECT_ROOT,
                    filePath
                )
            );


        /**
         * 如果发生重复 ID，
         * 使用文件名生成备用 ID。
         */

        let finalId =
            id;


        if (
            products[finalId]
        ) {

            const fileId =
                normalizeKey(
                    path.basename(
                        filePath,
                        ".json"
                    )
                );


            if (
                !products[fileId]
            ) {

                finalId =
                    fileId;

            } else {

                let counter = 2;

                while (
                    products[
                        `${fileId}_${counter}`
                    ]
                ) {
                    counter += 1;
                }

                finalId =
                    `${fileId}_${counter}`;
            }


            console.warn(
                `⚠️ Duplicate product ID "${id}" detected.`
            );

            console.warn(
                `   Using "${finalId}" instead.`
            );
        }


        products[finalId] = {

            name:
                getProductName(
                    data,
                    filePath
                ),

            brand:
                getProductBrand(
                    data,
                    filePath
                ),

            category,

            path:
                relativePath
        };
    }


    return {

        products,

        count:
            Object.keys(
                products
            ).length,

        file_count:
            files.length
    };
}


/**
 * ============================================================
 * Main Builder
 * ============================================================
 */

async function buildProductLookup() {

    console.log(
        "\n" +
        "=".repeat(60)
    );

    console.log(
        "EveryCourtAI Product Lookup Builder"
    );

    console.log(
        "=".repeat(60)
    );


    /**
     * ----------------------------------
     * Racquets
     * ----------------------------------
     */

    console.log(
        "\nScanning racquets..."
    );


    const racquetResult =
        await buildCollection(
            RACQUETS_DIR,
            "racquet"
        );


    console.log(
        `Racquet JSON files found: ${racquetResult.file_count}`
    );

    console.log(
        `Racquet products indexed: ${racquetResult.count}`
    );


    /**
     * ----------------------------------
     * Strings
     * ----------------------------------
     */

    console.log(
        "\nScanning strings..."
    );


    const stringResult =
        await buildCollection(
            STRINGS_DIR,
            "string"
        );


    console.log(
        `String JSON files found: ${stringResult.file_count}`
    );

    console.log(
        `String products indexed: ${stringResult.count}`
    );


    /**
     * ----------------------------------
     * Final Output
     * ----------------------------------
     */

    const output = {

        metadata: {

            version:
                "1.0",

            generated_at:
                new Date()
                    .toISOString(),

            generator:
                "tools/build_product_lookup.js",

            counts: {

                racquets:
                    racquetResult.count,

                strings:
                    stringResult.count,

                total:
                    racquetResult.count +
                    stringResult.count
            }
        },


        racquets:
            racquetResult.products,


        strings:
            stringResult.products
    };


    /**
     * 确保 indexes 目录存在。
     */

    await fs.mkdir(
        INDEX_DIR,
        {
            recursive: true
        }
    );


    /**
     * 写入 JSON。
     */

    await fs.writeFile(
        OUTPUT_FILE,
        JSON.stringify(
            output,
            null,
            2
        ) + "\n",
        "utf8"
    );


    console.log(
        "\n" +
        "=".repeat(60)
    );

    console.log(
        "✅ PRODUCT LOOKUP BUILD COMPLETED"
    );

    console.log(
        "=".repeat(60)
    );


    console.log(
        "\nOutput:"
    );

    console.log(
        normalizePath(
            path.relative(
                PROJECT_ROOT,
                OUTPUT_FILE
            )
        )
    );


    console.log(
        "\nCounts:"
    );

    console.log(
        `Racquets: ${output.metadata.counts.racquets}`
    );

    console.log(
        `Strings:  ${output.metadata.counts.strings}`
    );

    console.log(
        `Total:    ${output.metadata.counts.total}`
    );


    return output;
}


/**
 * ============================================================
 * Execute
 * ============================================================
 */

buildProductLookup()
    .catch(
        error => {

            console.error(
                "\n❌ PRODUCT LOOKUP BUILD FAILED"
            );

            console.error(
                error
            );

            process.exitCode = 1;
        }
    );