/**
 * ============================================================
 * EveryCourtAI
 * Cloudflare Loader Test
 * Version: 1.0
 * ============================================================
 *
 * 文件路径：
 * tests/test_cloudflare_loader.js
 *
 * 目的：
 * 在真正部署 Cloudflare Worker 之前，
 * 测试 Cloudflare Runtime Loader 是否能够：
 *
 * 1. 切换到 cloudflare runtime
 * 2. 读取 GitHub product_lookup.json
 * 3. 加载 Racquets
 * 4. 加载 Strings
 *
 * ============================================================
 */

import {
    setKnowledgeRuntime,
    getKnowledgeRuntime,
    loadKnowledgeDirectory
} from "../utils/runtime_json_loader.js";


console.log("");
console.log("============================================================");
console.log("EveryCourtAI Cloudflare Loader Test");
console.log("============================================================");


/**
 * ============================================================
 * STEP 1
 * 切换 Runtime
 * ============================================================
 */

setKnowledgeRuntime(
    "cloudflare"
);


console.log(
    "Runtime:",
    getKnowledgeRuntime()
);


/**
 * ============================================================
 * STEP 2
 * 加载 Racquets
 * ============================================================
 */

console.log("");
console.log(
    "Loading racquets from GitHub..."
);


const racquets =
    await loadKnowledgeDirectory(
        "racquets"
    );


console.log(
    "Racquets loaded:",
    racquets.length
);


/**
 * ============================================================
 * STEP 3
 * 加载 Strings
 * ============================================================
 */

console.log("");
console.log(
    "Loading strings from GitHub..."
);


const strings =
    await loadKnowledgeDirectory(
        "strings"
    );


console.log(
    "Strings loaded:",
    strings.length
);


/**
 * ============================================================
 * STEP 4
 * Sample Data
 * ============================================================
 */

console.log("");
console.log(
    "Sample Racquet:"
);


if (
    racquets.length > 0
) {
    console.log(
        racquets[0]
            ?.data
            ?.id ??
        racquets[0]
            ?.data
            ?.model ??
        "Unknown"
    );
} else {
    console.log(
        "No racquet loaded."
    );
}


console.log("");
console.log(
    "Sample String:"
);


if (
    strings.length > 0
) {
    console.log(
        strings[0]
            ?.data
            ?.id ??
        strings[0]
            ?.data
            ?.model ??
        "Unknown"
    );
} else {
    console.log(
        "No string loaded."
    );
}


/**
 * ============================================================
 * STEP 5
 * Final Check
 * ============================================================
 */

console.log("");
console.log("============================================================");


if (
    racquets.length > 0 &&
    strings.length > 0
) {
    console.log(
        "✅ CLOUDFLARE LOADER TEST PASSED"
    );
} else {
    console.log(
        "❌ CLOUDFLARE LOADER TEST FAILED"
    );

    process.exitCode =
        1;
}


console.log("============================================================");
console.log("");
