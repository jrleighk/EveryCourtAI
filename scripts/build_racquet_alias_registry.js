import fs from "node:fs";


const INPUT_FILE =
    "knowledge/product_aliases/racquet_aliases_v1.json";

const OUTPUT_FILE =
    "engine/racquet_alias_registry.generated.js";


const knowledge =
    JSON.parse(
        fs.readFileSync(
            INPUT_FILE,
            "utf8"
        )
    );


const aliases =
    Array.isArray(
        knowledge.aliases
    )
        ? knowledge.aliases
        : [];


const content =
`/**
 * ============================================================
 * EveryCourtAI
 * Generated Racquet Alias Registry
 * Source: ${INPUT_FILE}
 * ============================================================
 *
 * DO NOT EDIT MANUALLY.
 * Regenerate with:
 * node scripts/build_racquet_alias_registry.js
 *
 * ============================================================
 */

export const RACQUET_ALIAS_REGISTRY =
${JSON.stringify(aliases, null, 4)};

export const RACQUET_ALIAS_REGISTRY_INFO = {
    version: ${JSON.stringify(knowledge.version)},
    product_type: ${JSON.stringify(knowledge.product_type)},
    count: ${aliases.length}
};
`;


fs.writeFileSync(
    OUTPUT_FILE,
    content
);


console.log(
    `Generated ${OUTPUT_FILE}`
);

console.log(
    `Aliases: ${aliases.length}`
);
