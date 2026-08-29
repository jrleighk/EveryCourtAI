import fs from "fs";


const indexHtml =
    fs.readFileSync(
        "./index.html",
        "utf8"
    );


const languageFiles = {
    en: "./language/en.json",
    "zh-CN": "./language/zh.json",
    "zh-HK": "./language/zh-tc.json",
    fr: "./language/fr.json",
    es: "./language/es.json",
    ja: "./language/ja.json"
};


const dictionaries =
    Object.fromEntries(
        Object.entries(
            languageFiles
        ).map(
            ([locale, file]) => [
                locale,
                JSON.parse(
                    fs.readFileSync(
                        file,
                        "utf8"
                    )
                )
            ]
        )
    );


const requiredKeys = [
    "title",
    "subtitle",
    "fields.name",
    "fields.gender",
    "fields.age",
    "fields.height",
    "fields.weight",
    "fields.dominant_hand",
    "fields.current_racquet",
    "fields.current_string",
    "fields.current_tension",
    "fields.primary_goal",
    "fields.playing_style",
    "fields.swing_speed",
    "fields.feel_preference",
    "fields.shoulder",
    "fields.elbow",
    "fields.wrist",
    "fields.neck",
    "fields.lower_back",
    "fields.hip",
    "fields.knee",
    "fields.ankle",
    "options.select",
    "options.physical.not_specified",
    "options.physical.none",
    "options.physical.mild",
    "options.physical.moderate",
    "options.physical.severe"
];


function getNested(
    object,
    key
) {
    return key
        .split(".")
        .reduce(
            (
                current,
                part
            ) =>
                current?.[part],
            object
        );
}


const rows = [];


for (
    const [
        locale,
        dictionary
    ]
    of Object.entries(
        dictionaries
    )
) {

    for (
        const key
        of requiredKeys
    ) {

        rows.push({
            id:
                `${locale}_${key}`,

            pass:
                typeof getNested(
                    dictionary.profile,
                    key
                ) === "string"
        });

    }

}


const domChecks = [

    {
        id:
            "profile_title_i18n",

        pass:
            indexHtml.includes(
                'data-i18n="profile.title"'
            )
    },

    {
        id:
            "profile_subtitle_i18n",

        pass:
            indexHtml.includes(
                'data-i18n="profile.subtitle"'
            )
    },

    {
        id:
            "profile_name_i18n",

        pass:
            indexHtml.includes(
                'data-i18n="profile.fields.name"'
            )
    },

    {
        id:
            "profile_ankle_i18n",

        pass:
            indexHtml.includes(
                'data-i18n="profile.fields.ankle"'
            )
    },

    {
        id:
            "profile_placeholder_i18n",

        pass:
            indexHtml.includes(
                'data-i18n-placeholder="profile.placeholders.current_racquet"'
            )
    },

    {
        id:
            "select_option_i18n",

        pass:
            indexHtml.includes(
                'data-i18n="profile.options.select"'
            )
    },

    {
        id:
            "physical_option_i18n",

        pass:
            indexHtml.includes(
                'data-i18n="profile.options.physical.moderate"'
            )
    },

    {
        id:
            "canonical_goal_value_preserved",

        pass:
            indexHtml.includes(
                'value="more_control"'
            )
    },

    {
        id:
            "canonical_physical_value_preserved",

        pass:
            indexHtml.includes(
                'value="moderate"'
            )
    },

    {
        id:
            "legacy_profile_bilingual_title_removed",

        pass:
            !indexHtml.includes(
                "Player Profile / 球员资料"
            )
    }
];


rows.push(
    ...domChecks
);


const failed =
    rows.filter(
        row =>
            !row.pass
    );


console.log(
    "========================================"
);

console.log(
    "PLAYER PROFILE I18N V1"
);

console.log(
    "========================================"
);

console.table(
    rows
);


console.log("");

console.log(
    "Total:",
    rows.length
);

console.log(
    "Passed:",
    rows.length -
        failed.length
);

console.log(
    "Failed:",
    failed.length
);


if (
    failed.length >
    0
) {

    console.log("");
    console.log(
        "FAILED:"
    );

    console.table(
        failed
    );

    process.exitCode =
        1;

} else {

    console.log("");
    console.log(
        "RESULT: PASS"
    );

}
