/**
 * ============================================================
 * EveryCourtAI
 * Product Recognition Registry Builder
 * Version: 1.0
 * ============================================================
 *
 * Input:
 *   knowledge/racquets/(all nested JSON files)
 *   knowledge/strings/(all nested JSON files)
 *
 * Output:
 *   knowledge/verification/product_registry/
 *     racquets_registry.json
 *     strings_registry.json
 *     registry_report.json
 *
 * Purpose:
 *   Build a centralized product recognition registry so
 *   input_parser.js does not need hundreds of hard-coded
 *   racquet/string patterns.
 * ============================================================
 */

import fs from "node:fs";
import path from "node:path";


const ROOT =
    process.cwd();

const RACQUET_ROOT =
    path.join(
        ROOT,
        "knowledge",
        "racquets"
    );

const STRING_ROOT =
    path.join(
        ROOT,
        "knowledge",
        "strings"
    );

const OUTPUT_ROOT =
    path.join(
        ROOT,
        "knowledge",
        "verification",
        "product_registry"
    );


/**
 * ============================================================
 * Helpers
 * ============================================================
 */

function isPlainObject(
    value
) {
    return Boolean(
        value &&
        typeof value === "object" &&
        !Array.isArray(value)
    );
}


function safeString(
    value
) {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .trim();
}


function normalizeText(
    value
) {
    return safeString(value)
        .toLowerCase()
        .replace(
            /[_\-–—]+/g,
            " "
        )
        .replace(
            /[，。！？、；：,.!?;:()[\]{}"'`]/g,
            " "
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim();
}


function uniqueStrings(
    values
) {
    const output = [];
    const seen = new Set();

    for (
        const value
        of values
    ) {
        const clean =
            safeString(value);

        if (!clean) {
            continue;
        }

        const key =
            normalizeText(clean);

        if (
            !key ||
            seen.has(key)
        ) {
            continue;
        }

        seen.add(key);

        output.push(
            clean
        );
    }

    return output;
}


function walkJsonFiles(
    directory
) {
    const output = [];

    if (
        !fs.existsSync(directory)
    ) {
        return output;
    }

    for (
        const entry
        of fs.readdirSync(
            directory,
            {
                withFileTypes:
                    true
            }
        )
    ) {
        const fullPath =
            path.join(
                directory,
                entry.name
            );

        if (
            entry.isDirectory()
        ) {
            output.push(
                ...walkJsonFiles(
                    fullPath
                )
            );

            continue;
        }

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

    return output.sort();
}


function readJson(
    file
) {
    try {
        return JSON.parse(
            fs.readFileSync(
                file,
                "utf8"
            )
        );
    } catch (
        error
    ) {
        console.error(
            `❌ JSON read failed: ${file}`
        );

        console.error(
            error instanceof Error
                ? error.message
                : String(error)
        );

        return null;
    }
}


function flattenStringValues(
    value
) {
    if (
        typeof value ===
        "string"
    ) {
        return [
            value
        ];
    }

    if (
        Array.isArray(value)
    ) {
        return value
            .flatMap(
                flattenStringValues
            );
    }

    return [];
}


function collectExplicitAliases(
    raw
) {
    const fields = [
        "aliases",
        "alias",
        "search_aliases",
        "search_terms",
        "search_keywords",
        "keywords",
        "recognition_patterns",
        "patterns"
    ];

    const output = [];

    for (
        const field
        of fields
    ) {
        output.push(
            ...flattenStringValues(
                raw?.[field]
            )
        );
    }

    return uniqueStrings(
        output
    );
}


function getFilenameStem(
    file
) {
    return path.basename(
        file,
        ".json"
    );
}


function getReleaseYear(
    raw
) {
    const values = [
        raw?.release_year,
        raw?.year,
        raw?.model_year
    ];

    for (
        const value
        of values
    ) {
        const parsed =
            Number(value);

        if (
            Number.isInteger(parsed) &&
            parsed >= 1900 &&
            parsed <= 2100
        ) {
            return parsed;
        }
    }

    return null;
}


function extractGaugeValues(
    raw
) {
    const values = [];

    const directCandidates = [
        raw?.gauge_mm,
        raw?.specifications?.gauge_mm
    ];

    for (
        const value
        of directCandidates
    ) {
        const parsed =
            Number(value);

        if (
            Number.isFinite(parsed)
        ) {
            values.push(
                parsed
            );
        }
    }


    const gaugeCollections = [
        raw?.specifications
            ?.available_gauges,
        raw?.available_gauges,
        raw?.manufacturer_data
            ?.available_gauges
    ];

    for (
        const collection
        of gaugeCollections
    ) {
        if (
            !Array.isArray(
                collection
            )
        ) {
            continue;
        }

        for (
            const item
            of collection
        ) {
            if (
                typeof item ===
                "number"
            ) {
                values.push(
                    item
                );

                continue;
            }

            if (
                isPlainObject(
                    item
                )
            ) {
                const parsed =
                    Number(
                        item.gauge_mm ??
                        item.mm ??
                        item.value
                    );

                if (
                    Number.isFinite(
                        parsed
                    )
                ) {
                    values.push(
                        parsed
                    );
                }
            }
        }
    }


    return [
        ...new Set(
            values
                .filter(
                    value =>
                        value >= 0.8 &&
                        value <= 2.0
                )
                .map(
                    value =>
                        Number(
                            value.toFixed(3)
                        )
                )
        )
    ].sort(
        (
            a,
            b
        ) =>
            a - b
    );
}


/**
 * ============================================================
 * Pattern Builder
 * ============================================================
 */

function buildStrongPatterns({
    id,
    brand,
    model,
    modelCn,
    filenameStem
}) {
    const values = [
        brand && model
            ? `${brand} ${model}`
            : null,

        model,

        modelCn,

        filenameStem
            ? filenameStem
                .replace(
                    /_/g,
                    " "
                )
            : null,

        id
            ? id.replace(
                /_/g,
                " "
            )
            : null
    ];

    return uniqueStrings(
        values
    );
}


function buildWeakPatterns({
    brand,
    series,
    seriesCn,
    explicitAliases
}) {
    return uniqueStrings([
        ...explicitAliases,

        series,

        seriesCn,

        brand && series
            ? `${brand} ${series}`
            : null
    ]);
}


/**
 * ============================================================
 * Registry Record Builders
 * ============================================================
 */

function buildRacquetRecord(
    raw,
    file
) {
    const id =
        safeString(
            raw?.id
        );

    const brand =
        safeString(
            raw?.brand
        );

    const model =
        safeString(
            raw?.model ??
            raw?.name ??
            raw?.product_name
        );

    if (
        !id ||
        !model
    ) {
        return null;
    }

    const filenameStem =
        getFilenameStem(
            file
        );

    const explicitAliases =
        collectExplicitAliases(
            raw
        );

    const strongPatterns =
        buildStrongPatterns({
            id,
            brand,
            model,
            modelCn:
                raw?.model_cn,
            filenameStem
        });

    const weakPatterns =
        buildWeakPatterns({
            brand,
            series:
                raw?.series,
            seriesCn:
                raw?.series_cn,
            explicitAliases
        });


    return {
        id,

        product_type:
            "racquet",

        brand:
            brand || null,

        brand_cn:
            safeString(
                raw?.brand_cn
            ) || null,

        model,

        model_cn:
            safeString(
                raw?.model_cn
            ) || null,

        series:
            safeString(
                raw?.series
            ) || null,

        release_year:
            getReleaseYear(
                raw
            ),

        source_file:
            path.relative(
                ROOT,
                file
            ),

        recognition: {
            strong_patterns:
                strongPatterns,

            weak_patterns:
                weakPatterns,

            normalized_strong_patterns:
                strongPatterns.map(
                    normalizeText
                ),

            normalized_weak_patterns:
                weakPatterns.map(
                    normalizeText
                )
        }
    };
}


function buildStringRecord(
    raw,
    file
) {
    const id =
        safeString(
            raw?.id
        );

    const brand =
        safeString(
            raw?.brand
        );

    const model =
        safeString(
            raw?.model ??
            raw?.name ??
            raw?.product_name
        );

    if (
        !id ||
        !model
    ) {
        return null;
    }

    const filenameStem =
        getFilenameStem(
            file
        );

    const explicitAliases =
        collectExplicitAliases(
            raw
        );

    const strongPatterns =
        buildStrongPatterns({
            id,
            brand,
            model,
            modelCn:
                raw?.model_cn,
            filenameStem
        });

    const weakPatterns =
        buildWeakPatterns({
            brand,
            series:
                raw?.series,
            seriesCn:
                raw?.series_cn,
            explicitAliases
        });


    return {
        id,

        product_type:
            "string",

        brand:
            brand || null,

        model,

        series:
            safeString(
                raw?.series
            ) || null,

        category:
            safeString(
                raw?.category
            ) || null,

        gauges_mm:
            extractGaugeValues(
                raw
            ),

        source_file:
            path.relative(
                ROOT,
                file
            ),

        recognition: {
            strong_patterns:
                strongPatterns,

            weak_patterns:
                weakPatterns,

            normalized_strong_patterns:
                strongPatterns.map(
                    normalizeText
                ),

            normalized_weak_patterns:
                weakPatterns.map(
                    normalizeText
                )
        }
    };
}


/**
 * ============================================================
 * Collision Detection
 * ============================================================
 */

function findPatternCollisions(
    records
) {
    const patternMap =
        new Map();

    for (
        const record
        of records
    ) {
        const patterns =
            record
                ?.recognition
                ?.normalized_strong_patterns ??
            [];

        for (
            const pattern
            of patterns
    ) {
            if (
                !pattern
            ) {
                continue;
            }

            if (
                !patternMap.has(
                    pattern
                )
            ) {
                patternMap.set(
                    pattern,
                    []
                );
            }

            patternMap
                .get(pattern)
                .push({
                    id:
                        record.id,

                    brand:
                        record.brand,

                    model:
                        record.model
                });
        }
    }


    return [
        ...patternMap
            .entries()
    ]
        .filter(
            (
                [
                    ,
                    matches
                ]
            ) =>
                matches.length >
                1
        )
        .map(
            (
                [
                    pattern,
                    matches
                ]
            ) => ({
                pattern,
                matches
            })
        )
        .sort(
            (
                a,
                b
            ) =>
                b.matches.length -
                a.matches.length
        );
}


/**
 * ============================================================
 * Main
 * ============================================================
 */

function main() {
    fs.mkdirSync(
        OUTPUT_ROOT,
        {
            recursive:
                true
        }
    );


    const racquetFiles =
        walkJsonFiles(
            RACQUET_ROOT
        );

    const stringFiles =
        walkJsonFiles(
            STRING_ROOT
        );


    const racquets =
        racquetFiles
            .map(
                file => {
                    const raw =
                        readJson(file);

                    return raw
                        ? buildRacquetRecord(
                            raw,
                            file
                        )
                        : null;
                }
            )
            .filter(Boolean);


    const strings =
        stringFiles
            .map(
                file => {
                    const raw =
                        readJson(file);

                    return raw
                        ? buildStringRecord(
                            raw,
                            file
                        )
                        : null;
                }
            )
            .filter(Boolean);


    const racquetCollisions =
        findPatternCollisions(
            racquets
        );

    const stringCollisions =
        findPatternCollisions(
            strings
        );


    const racquetRegistry = {
        registry:
            "EveryCourtAI Racquet Product Registry",

        version:
            "1.0",

        generated_at:
            new Date()
                .toISOString(),

        count:
            racquets.length,

        products:
            racquets
    };


    const stringRegistry = {
        registry:
            "EveryCourtAI String Product Registry",

        version:
            "1.0",

        generated_at:
            new Date()
                .toISOString(),

        count:
            strings.length,

        products:
            strings
    };


    const report = {
        registry:
            "EveryCourtAI Product Registry Report",

        version:
            "1.0",

        generated_at:
            new Date()
                .toISOString(),

        counts: {
            racquet_json_files:
                racquetFiles.length,

            racquet_registry_products:
                racquets.length,

            string_json_files:
                stringFiles.length,

            string_registry_products:
                strings.length,

            total_products:
                racquets.length +
                strings.length
        },

        collisions: {
            racquets:
                racquetCollisions,

            strings:
                stringCollisions
        },

        collision_counts: {
            racquets:
                racquetCollisions.length,

            strings:
                stringCollisions.length
        }
    };


    fs.writeFileSync(
        path.join(
            OUTPUT_ROOT,
            "racquets_registry.json"
        ),
        JSON.stringify(
            racquetRegistry,
            null,
            2
        ) + "\n",
        "utf8"
    );


    fs.writeFileSync(
        path.join(
            OUTPUT_ROOT,
            "strings_registry.json"
        ),
        JSON.stringify(
            stringRegistry,
            null,
            2
        ) + "\n",
        "utf8"
    );


    fs.writeFileSync(
        path.join(
            OUTPUT_ROOT,
            "registry_report.json"
        ),
        JSON.stringify(
            report,
            null,
            2
        ) + "\n",
        "utf8"
    );


    console.log("");
    console.log(
        "============================================================"
    );
    console.log(
        " EveryCourtAI Product Registry Builder V1"
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
        `Total:    ${
            racquets.length +
            strings.length
        }`
    );

    console.log("");

    console.log(
        `Racquet strong-pattern collisions: ${racquetCollisions.length}`
    );

    console.log(
        `String strong-pattern collisions:  ${stringCollisions.length}`
    );

    console.log("");

    console.log(
        "Output:"
    );

    console.log(
        "  knowledge/verification/product_registry/racquets_registry.json"
    );

    console.log(
        "  knowledge/verification/product_registry/strings_registry.json"
    );

    console.log(
        "  knowledge/verification/product_registry/registry_report.json"
    );

    console.log(
        "============================================================"
    );
}


main();
