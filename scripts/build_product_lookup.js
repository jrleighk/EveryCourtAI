/**
 * ============================================================
 * EveryCourtAI
 * Product Lookup Builder
 * Version: 1.0
 * ============================================================
 *
 * Converts generated product registries into a lightweight,
 * synchronous JS module that can be imported by:
 *
 * engine/product_resolver.js
 * engine/input_parser.js
 * Cloudflare Worker
 *
 * ============================================================
 */

import fs from "node:fs";
import path from "node:path";


const ROOT =
    process.cwd();


const REGISTRY_ROOT =
    path.join(
        ROOT,
        "knowledge",
        "verification",
        "product_registry"
    );


const OUTPUT_FILE =
    path.join(
        ROOT,
        "engine",
        "product_registry.generated.js"
    );


function readJson(
    filename
) {
    return JSON.parse(
        fs.readFileSync(
            path.join(
                REGISTRY_ROOT,
                filename
            ),
            "utf8"
        )
    );
}


function uniqueStrings(
    values = []
) {
    return [
        ...new Set(
            values
                .filter(Boolean)
                .map(
                    value =>
                        String(value)
                            .trim()
                )
                .filter(Boolean)
        )
    ];
}


function compactProduct(
    product
) {
    return {
        id:
            product.id,

        product_type:
            product.product_type,

        brand:
            product.brand ??
            null,

        brand_cn:
            product.brand_cn ??
            null,

        model:
            product.model ??
            null,

        model_cn:
            product.model_cn ??
            null,

        series:
            product.series ??
            null,

        release_year:
            product.release_year ??
            null,

        category:
            product.category ??
            null,

        gauges_mm:
            Array.isArray(
                product.gauges_mm
            )
                ? product.gauges_mm
                : [],

        source_file:
            product.source_file ??
            null,

        strong_patterns:
            uniqueStrings(
                product
                    ?.recognition
                    ?.normalized_strong_patterns
            ),

        weak_patterns:
            uniqueStrings(
                product
                    ?.recognition
                    ?.normalized_weak_patterns
            )
    };
}


const racquetRegistry =
    readJson(
        "racquets_registry.json"
    );


const stringRegistry =
    readJson(
        "strings_registry.json"
    );


const racquets =
    (
        racquetRegistry.products ??
        []
    )
        .map(
            compactProduct
        );


const strings =
    (
        stringRegistry.products ??
        []
    )
        .map(
            compactProduct
        );


const content = `/**
 * ============================================================
 * EveryCourtAI
 * GENERATED PRODUCT REGISTRY
 * ============================================================
 *
 * AUTO-GENERATED FILE.
 * DO NOT EDIT MANUALLY.
 *
 * Racquets: ${racquets.length}
 * Strings: ${strings.length}
 * Total: ${racquets.length + strings.length}
 * ============================================================
 */

export const PRODUCT_REGISTRY_VERSION = "1.0";

export const RACQUET_PRODUCT_REGISTRY =
${JSON.stringify(racquets, null, 4)};

export const STRING_PRODUCT_REGISTRY =
${JSON.stringify(strings, null, 4)};

export const PRODUCT_REGISTRY_COUNTS = {
    racquets: ${racquets.length},
    strings: ${strings.length},
    total: ${racquets.length + strings.length}
};
`;


fs.writeFileSync(
    OUTPUT_FILE,
    content,
    "utf8"
);


console.log("");
console.log(
    "============================================================"
);
console.log(
    " EveryCourtAI Product Lookup Builder V1"
);
console.log(
    "============================================================"
);

console.log(
    `Racquets: ${racquets.length}`
);

console.log(
    `Strings:  ${strings.length}`
);

console.log(
    `Total:    ${racquets.length + strings.length}`
);

console.log("");
console.log(
    "Output:"
);

console.log(
    "  engine/product_registry.generated.js"
);

console.log(
    "============================================================"
);
