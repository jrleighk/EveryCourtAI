import {
    understandTennisQuery
} from "../../engine/query_understanding_v2.js";

import {
    parsePlayerInput
} from "../../engine/input_parser.js";

import {
    runConversationStateEngine
} from "../../engine/conversation_state_engine.js";


const failures = [];


function check(
    condition,
    message
) {

    if (
        !condition
    ) {

        failures.push(
            message
        );
    }
}


function runCase(
    id,
    message
) {

    const result =
        understandTennisQuery(
            message
        );


    console.log("");
    console.log(
        "CASE:",
        id
    );

    console.log(
        JSON.stringify(
            {
                intent:
                    result
                        ?.intent,

                equipment:
                    result
                        ?.equipment,

                goals:
                    result
                        ?.goals,

                physical:
                    result
                        ?.physical,

                change_constraints:
                    result
                        ?.change_constraints,

                comparison:
                    result
                        ?.comparison,

                routing:
                    result
                        ?.routing
            },
            null,
            2
        )
    );


    return result;
}


console.log(
    "========================================"
);

console.log(
    "QUERY UNDERSTANDING V2"
);

console.log(
    "========================================"
);


/**
 * 1. Rich setup + explicit goal.
 *
 * Question Intent V1 currently classifies this declarative
 * equipment context as general_tennis_question.
 *
 * Query Understanding V2 should recognize the actionable
 * parser context without modifying Question Intent V1.
 */

const richSetup =
    runCase(
        "rich_setup_goal",
        "我现在使用 Wilson RF 01 Pro Classic，HEAD HAWK TOUCH 1.25，54磅。中级，全场型打法，挥拍速度中等，想要更多控制，同时保持比较直接的击球手感。"
    );


check(
    richSetup
        ?.intent
        ?.primary ===
        "recommend_setup",
    "rich setup should route to recommend_setup"
);

check(
    richSetup
        ?.intent
        ?.raw ===
        "general_tennis_question",
    "rich setup should preserve raw intent"
);

check(
    richSetup
        ?.intent
        ?.overridden ===
        true,
    "rich setup should record intent arbitration"
);

check(
    richSetup
        ?.equipment
        ?.current_racquet
        ?.id ===
        "wilson_rf_01_pro_classic",
    "rich setup racquet"
);

check(
    richSetup
        ?.equipment
        ?.current_string
        ?.id ===
        "head_hawk_touch",
    "rich setup string"
);

check(
    richSetup
        ?.equipment
        ?.current_tension ===
        54,
    "rich setup tension"
);

check(
    richSetup
        ?.goals
        ?.primary_goal ===
        "more_control",
    "rich setup goal"
);

check(
    richSetup
        ?.player
        ?.playing_style ===
        "all_court",
    "rich setup playing style"
);

check(
    richSetup
        ?.player
        ?.swing_speed ===
        "medium",
    "rich setup swing speed"
);


/**
 * 2. Physical recommendation.
 */

const physicalRecommendation =
    runCase(
        "physical_recommendation",
        "肩膀不舒服，我应该换什么线？"
    );


check(
    physicalRecommendation
        ?.intent
        ?.primary ===
        "recommend_setup",
    "physical recommendation intent"
);

check(
    physicalRecommendation
        ?.physical
        ?.active ===
        true,
    "physical recommendation active"
);

check(
    physicalRecommendation
        ?.physical
        ?.regions
        ?.shoulder
        ?.active ===
        true,
    "physical recommendation shoulder"
);


/**
 * 3. Physical + tension.
 */

const physicalTension =
    runCase(
        "physical_tension",
        "我的肩膀会痛，现在54磅是不是太高？"
    );


check(
    physicalTension
        ?.intent
        ?.primary ===
        "adjust_tension",
    "physical tension intent"
);

check(
    physicalTension
        ?.equipment
        ?.current_tension ===
        54,
    "physical tension value"
);

check(
    physicalTension
        ?.physical
        ?.regions
        ?.shoulder
        ?.active ===
        true,
    "physical tension shoulder"
);


/**
 * 4. Preserve racquet can come from Question Intent even when
 * Input Parser does not create a full change_intent object.
 */

const preserveRacquet =
    runCase(
        "preserve_racquet_string_change",
        "球拍不换，帮我推荐一条更舒服的线。"
    );


check(
    preserveRacquet
        ?.intent
        ?.primary ===
        "recommend_setup",
    "preserve racquet recommendation intent"
);

check(
    preserveRacquet
        ?.goals
        ?.primary_goal ===
        "more_comfort",
    "preserve racquet comfort goal"
);

check(
    preserveRacquet
        ?.change_constraints
        ?.preserve_racquet ===
        true,
    "preserve racquet constraint"
);

check(
    preserveRacquet
        ?.change_constraints
        ?.preserve_string ===
        false,
    "string should remain changeable"
);


/**
 * 5. Critical arbitration case.
 *
 * The comparison extractor can independently interpret
 * "球拍和球线" as two comparison targets.
 *
 * Query Understanding V2 must suppress that extractor result
 * because there is no explicit comparison signal.
 */

const minimalChange =
    runCase(
        "minimal_change",
        "我不想换球拍和球线，只想调整磅数。"
    );


check(
    minimalChange
        ?.intent
        ?.primary ===
        "adjust_tension",
    "minimal change intent"
);

check(
    minimalChange
        ?.change_constraints
        ?.preserve_racquet ===
        true,
    "minimal change preserve racquet"
);

check(
    minimalChange
        ?.change_constraints
        ?.preserve_string ===
        true,
    "minimal change preserve string"
);

check(
    minimalChange
        ?.change_constraints
        ?.preferred_change ===
        "tension_only",
    "minimal change preferred strategy"
);

check(
    minimalChange
        ?.comparison
        ?.detected ===
        false,
    "false comparison must be suppressed"
);

check(
    minimalChange
        ?.comparison
        ?.explicit ===
        false,
    "minimal change must not be explicit comparison"
);

check(
    minimalChange
        ?.comparison
        ?.suppressed_extractor_result ===
        true,
    "extractor false-positive should be observable"
);


/**
 * 6. Genuine comparison remains unchanged.
 */

const comparison =
    runCase(
        "comparison",
        "比较 Pure Drive Spectra 2026 和 RF01 Pro Classic"
    );


check(
    comparison
        ?.intent
        ?.primary ===
        "compare_products",
    "comparison intent"
);

check(
    comparison
        ?.comparison
        ?.explicit ===
        true,
    "comparison explicit"
);

check(
    comparison
        ?.comparison
        ?.comparison_ready ===
        true,
    "comparison ready"
);

check(
    comparison
        ?.comparison
        ?.targets
        ?.length ===
        2,
    "comparison target count"
);

check(
    comparison
        ?.comparison
        ?.targets
        ?.[0]
        ?.match
        ?.id ===
        "babolat_pure_drive_spectra_edition_2026",
    "comparison product A"
);

check(
    comparison
        ?.comparison
        ?.targets
        ?.[1]
        ?.match
        ?.id ===
        "wilson_rf_01_pro_classic",
    "comparison product B"
);


/**
 * 7. General tennis education question must remain general.
 */

const generalQuestion =
    runCase(
        "general_question",
        "网球里面旋转是怎么产生的？"
    );


check(
    generalQuestion
        ?.intent
        ?.primary ===
        "general_tennis_question",
    "general tennis question intent"
);

check(
    generalQuestion
        ?.intent
        ?.overridden ===
        false,
    "general tennis question should not be overridden"
);

check(
    generalQuestion
        ?.comparison
        ?.detected ===
        false,
    "general question comparison"
);


/**
 * 8. Conversation State is authoritative accumulated context.
 */

const turns = [

    "我现在用 Wilson RF 01 Pro Classic，HAWK TOUCH 1.25，54磅，想增加旋转。",

    "我不想换球拍和球线，只想调整磅数。",

    "我的肩膀打两个小时以后会累。"
];


let conversationState =
    null;


for (
    const message
    of turns
) {

    conversationState =
        runConversationStateEngine({

            previousState:
                conversationState,

            parserResult:
                parsePlayerInput(
                    message
                ),

            message

        }).conversation_state;
}


const accumulated =
    understandTennisQuery(
        "我现在主要还是想增加旋转。",
        {
            conversationState
        }
    );


console.log("");
console.log(
    "CASE: accumulated_conversation_context"
);

console.log(
    JSON.stringify(
        {
            source:
                accumulated
                    ?.accumulated_context
                    ?.source,

            equipment:
                accumulated
                    ?.equipment,

            goals:
                accumulated
                    ?.goals,

            physical:
                accumulated
                    ?.physical,

            change_constraints:
                accumulated
                    ?.change_constraints
        },
        null,
        2
    )
);


check(
    accumulated
        ?.accumulated_context
        ?.source ===
        "conversation_state",
    "conversation state should be authoritative accumulated source"
);

check(
    accumulated
        ?.equipment
        ?.current_racquet
        ?.id ===
        "wilson_rf_01_pro_classic",
    "accumulated racquet"
);

check(
    accumulated
        ?.equipment
        ?.current_string
        ?.id ===
        "head_hawk_touch",
    "accumulated string"
);

check(
    accumulated
        ?.equipment
        ?.current_tension ===
        54,
    "accumulated tension"
);

check(
    accumulated
        ?.goals
        ?.primary_goal ===
        "more_spin",
    "accumulated goal"
);

check(
    accumulated
        ?.physical
        ?.regions
        ?.shoulder
        ?.active ===
        true,
    "accumulated shoulder"
);

check(
    accumulated
        ?.change_constraints
        ?.preserve_racquet ===
        true,
    "accumulated preserve racquet"
);

check(
    accumulated
        ?.change_constraints
        ?.preserve_string ===
        true,
    "accumulated preserve string"
);

check(
    accumulated
        ?.change_constraints
        ?.preferred_change ===
        "tension_only",
    "accumulated preferred change"
);


console.log("");
console.log(
    "========================================"
);

console.log(
    "QUERY UNDERSTANDING V2 RESULT"
);

console.log(
    "========================================"
);

console.log(
    `Checks: ${42 - failures.length}/42`
);

console.log(
    `Failures: ${failures.length}`
);


if (
    failures.length >
    0
) {

    console.log("");
    console.log(
        "FAILURES"
    );

    failures.forEach(
        failure =>
            console.log(
                "-",
                failure
            )
    );

    console.log("");
    console.log(
        "RESULT: FAIL"
    );

    process.exitCode =
        1;

} else {

    console.log(
        "RESULT: PASS"
    );
}
