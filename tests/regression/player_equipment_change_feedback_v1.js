import { buildPlayerProfile } from "../../engine/player_engine.js";

const profile = await buildPlayerProfile({
    level: "intermediate",
    primary_goal: "more_comfort",
    equipment_change_feedback: {
        status: "applied",
        changes_made: ["tension_54_to_52"],
        outcome: "improved",
        likes: ["more_comfort"],
        free_text: "更舒服"
    }
});

const f = profile.equipment_change_feedback;

if (
    f?.status !== "applied" ||
    f?.outcome !== "improved" ||
    f?.changes_made?.[0] !== "tension_54_to_52"
) {
    console.log("FAIL equipment_change_feedback");
    process.exit(1);
}

console.log("PASS equipment_change_feedback");
