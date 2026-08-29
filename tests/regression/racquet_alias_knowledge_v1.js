import fs from "node:fs";

const file =
    "knowledge/product_aliases/racquet_aliases_v1.json";

const data =
    JSON.parse(
        fs.readFileSync(
            file,
            "utf8"
        )
    );


const allowedStatuses =
    new Set([
        "resolved",
        "ambiguous"
    ]);


const allowedConfidence =
    new Set([
        "high",
        "medium",
        "low"
    ]);


const rows = [];


function addCheck(
    id,
    pass,
    detail = ""
) {
    rows.push({
        id,
        pass,
        detail
    });
}


addCheck(
    "version_is_1_0",
    data.version === "1.0",
    data.version
);


addCheck(
    "product_type_is_racquet",
    data.product_type === "racquet",
    data.product_type
);


addCheck(
    "explicit_alias_policy",
    data.policy?.explicit_aliases_only === true
);


addCheck(
    "player_association_disabled",
    data.policy?.allow_player_association === false
);


addCheck(
    "generation_inference_disabled",
    data.policy?.allow_generation_inference === false
);


addCheck(
    "ambiguous_aliases_must_clarify",
    data.policy?.ambiguous_aliases_must_clarify === true
);


const aliases =
    Array.isArray(data.aliases)
        ? data.aliases
        : [];


addCheck(
    "aliases_exist",
    aliases.length > 0,
    String(aliases.length)
);


const seen =
    new Set();


for (const item of aliases) {

    const key =
        `${item.locale}::${item.alias}`
            .toLowerCase();


    addCheck(
        `unique:${key}`,
        !seen.has(key),
        key
    );

    seen.add(key);


    addCheck(
        `status:${key}`,
        allowedStatuses.has(
            item.status
        ),
        item.status
    );


    addCheck(
        `confidence:${key}`,
        allowedConfidence.has(
            item.confidence
        ),
        item.confidence
    );


    addCheck(
        `type:${key}`,
        typeof item.alias_type === "string" &&
        item.alias_type.length > 0,
        item.alias_type
    );


    addCheck(
        `source:${key}`,
        typeof item.source === "string" &&
        item.source.length > 0,
        item.source
    );


    if (
        item.status ===
        "resolved"
    ) {
        addCheck(
            `canonical:${key}`,
            typeof item.canonical_id === "string" &&
            item.canonical_id.length > 0,
            item.canonical_id
        );
    }


    if (
        item.status ===
        "ambiguous"
    ) {
        addCheck(
            `ambiguous_has_no_product:${key}`,
            item.canonical_id === null
        );

        addCheck(
            `ambiguous_has_series:${key}`,
            typeof item.canonical_series === "string" &&
            item.canonical_series.length > 0,
            item.canonical_series
        );
    }
}


const forbiddenAliases =
    [
        "小黑拍",
        "德约的拍子",
        "上一代PD"
    ];


for (
    const alias
    of forbiddenAliases
) {
    addCheck(
        `unsafe_alias_absent:${alias}`,
        !aliases.some(
            item =>
                item.alias === alias
        )
    );
}


console.log(
    "========================================"
);

console.log(
    "RACQUET ALIAS KNOWLEDGE V1"
);

console.log(
    "========================================"
);


console.table(rows);


const passed =
    rows.filter(
        row => row.pass
    ).length;


const failed =
    rows.length -
    passed;


console.log(
    `\nTotal: ${rows.length}`
);

console.log(
    `Passed: ${passed}`
);

console.log(
    `Failed: ${failed}`
);


if (
    failed > 0
) {
    console.log(
        "\nRESULT: FAIL"
    );

    process.exit(1);
}


console.log(
    "\nRESULT: PASS"
);
