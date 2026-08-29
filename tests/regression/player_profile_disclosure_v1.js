import fs from "node:fs";

const html =
    fs.readFileSync(
        "index.html",
        "utf8"
    );

const chat =
    fs.readFileSync(
        "scripts/chat_manager.js",
        "utf8"
    );

const checks = [];

function check(id, pass) {
    checks.push({
        id,
        pass: Boolean(pass)
    });
}

check(
    "profile_section_preserved",
    html.includes(
        'id="playerProfile"'
    )
);

check(
    "profile_fields_preserved",
    html.includes(
        'class="player-profile-grid"'
    )
);

check(
    "profile_fields_have_id",
    html.includes(
        'id="playerProfileFields"'
    )
);

check(
    "profile_default_collapsed",
    /id="playerProfileFields"[\s\S]*?hidden/.test(
        html
    )
);

check(
    "profile_toggle_exists",
    html.includes(
        'id="playerProfileToggle"'
    )
);

check(
    "profile_toggle_initial_collapsed",
    /id="playerProfileToggle"[\s\S]*?aria-expanded="false"/.test(
        html
    )
);

check(
    "expand_i18n_exists",
    html.includes(
        'data-i18n="profile.expand"'
    )
);

check(
    "collapse_i18n_exists",
    html.includes(
        'data-i18n="profile.collapse"'
    )
);

check(
    "toggle_js_reads_aria_expanded",
    chat.includes(
        '"aria-expanded"'
    )
);

check(
    "toggle_js_controls_hidden",
    chat.includes(
        "playerProfileFields.hidden"
    )
);

const languageFiles = [
    "language/en.json",
    "language/zh.json",
    "language/zh-tc.json",
    "language/fr.json",
    "language/es.json",
    "language/ja.json"
];

for (const filename of languageFiles) {

    const data =
        JSON.parse(
            fs.readFileSync(
                filename,
                "utf8"
            )
        );

    check(
        `labels_${filename}`,
        Boolean(
            data?.profile?.expand &&
            data?.profile?.collapse
        )
    );
}

console.log(
    "========================================"
);
console.log(
    "PLAYER PROFILE DISCLOSURE V1"
);
console.log(
    "========================================"
);

console.table(checks);

const failed =
    checks.filter(
        item => !item.pass
    );

console.log("");
console.log(
    "Total:",
    checks.length
);
console.log(
    "Passed:",
    checks.length - failed.length
);
console.log(
    "Failed:",
    failed.length
);

if (failed.length) {
    console.log("");
    console.log("RESULT: FAIL");
    process.exit(1);
}

console.log("");
console.log("RESULT: PASS");
