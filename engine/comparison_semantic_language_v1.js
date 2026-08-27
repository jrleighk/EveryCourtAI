/**
 * ============================================================
 * EveryCourtAI
 * Comparison Semantic Language V1
 * ============================================================
 *
 * Purpose:
 *
 * Convert stable comparison semantic tokens into
 * deterministic bilingual tennis language.
 *
 * Important:
 *
 * This layer does NOT:
 *
 * - score products
 * - determine player suitability
 * - determine winners
 * - modify comparison decisions
 * - infer missing data
 *
 * Input source of truth:
 *
 * comparison_semantic_engine_v1.js
 *
 * ============================================================
 */

const ENGINE_NAME =
    "comparison_semantic_language";

const ENGINE_VERSION =
    "1.0";


const SEMANTIC_LANGUAGE = {

    larger_head_more_forgiveness_potential: {
        cn:
            "更大的拍面通常提供更高的容错潜力。",
        en:
            "The larger head size generally offers greater forgiveness potential."
    },

    larger_head_larger_effective_hitting_area: {
        cn:
            "更大的拍面也提供更大的有效击球区域。",
        en:
            "The larger head size also provides a larger effective hitting area."
    },

    smaller_head_more_compact_response: {
        cn:
            "较小的拍面通常带来更紧凑的击球响应。",
        en:
            "The smaller head size generally produces a more compact response."
    },


    heavier_frame_more_mass: {
        cn:
            "更重的拍框提供更多整体质量感。",
        en:
            "The heavier frame provides greater overall mass."
    },

    heavier_frame_more_swing_demand: {
        cn:
            "更高的静态重量通常会增加持续挥拍的负担。",
        en:
            "The higher static weight generally increases sustained swing demand."
    },

    lighter_frame_easier_acceleration: {
        cn:
            "较轻的拍框通常更容易加速。",
        en:
            "The lighter frame is generally easier to accelerate."
    },


    higher_balance_more_headward: {
        cn:
            "更高的平衡点意味着重量分布更靠近拍头。",
        en:
            "The higher balance point means the mass distribution sits farther toward the head."
    },

    lower_balance_more_head_light: {
        cn:
            "更低的平衡点意味着球拍整体更偏头轻。",
        en:
            "The lower balance point indicates a more head-light setup."
    },

    more_head_light_supports_maneuverability: {
        cn:
            "更头轻的平衡通常有利于挥拍灵活性。",
        en:
            "A more head-light balance generally supports maneuverability."
    },


    higher_swingweight_more_dynamic_mass: {
        cn:
            "更高的挥重意味着挥拍过程中具有更大的动态质量。",
        en:
            "The higher swingweight provides greater dynamic mass through the swing."
    },

    higher_swingweight_more_stability_potential: {
        cn:
            "更高的挥重通常能提供更扎实的击球稳定性。",
        en:
            "The higher swingweight generally provides greater stability through contact."
    },

    higher_swingweight_more_plow_through_potential: {
        cn:
            "更高的挥重通常具有更强的穿透与顶球能力潜力。",
        en:
            "The higher swingweight generally provides greater plow-through potential."
    },

    higher_swingweight_more_swing_demand: {
        cn:
            "同时，更高的挥重也会提高连续挥拍的动态负荷。",
        en:
            "At the same time, the higher swingweight increases dynamic swing demand."
    },

    lower_swingweight_easier_acceleration: {
        cn:
            "较低的挥重通常更容易加速和快速完成挥拍。",
        en:
            "The lower swingweight is generally easier to accelerate through the swing."
    },


    higher_stiffness_firmer_response: {
        cn:
            "更高的硬度通常带来更直接、更坚实的拍框响应。",
        en:
            "Higher stiffness generally produces a firmer and more direct frame response."
    },

    higher_stiffness_more_direct_energy_transfer_potential: {
        cn:
            "更高的硬度通常具有更直接的能量传递特性。",
        en:
            "Higher stiffness generally provides more direct energy-transfer characteristics."
    },

    lower_stiffness_more_flex_potential: {
        cn:
            "较低的硬度通常意味着拍框具有更多形变空间。",
        en:
            "Lower stiffness generally allows more frame flex."
    },


    similar_head_size: {
        cn:
            "两支球拍的拍面尺寸接近。",
        en:
            "The two racquets have similar head sizes."
    },

    similar_static_weight: {
        cn:
            "两支球拍的静态重量接近。",
        en:
            "The two racquets have similar static weights."
    },

    similar_balance_point: {
        cn:
            "两支球拍的平衡点接近。",
        en:
            "The two racquets have similar balance points."
    },

    similar_dynamic_swing_demand: {
        cn:
            "两支球拍的动态挥拍负荷接近。",
        en:
            "The two racquets have similar dynamic swing demands."
    },

    similar_frame_stiffness: {
        cn:
            "两支球拍的拍框硬度接近。",
        en:
            "The two racquets have similar frame stiffness."
    }
};


/**
 * ============================================================
 * Public API
 * ============================================================
 */

export function translateSemanticImplication(
    implication
) {

    const entry =
        SEMANTIC_LANGUAGE[
            implication
        ] ??
        null;


    if (
        !entry
    ) {
        return {
            implication:
                implication ??
                null,

            available:
                false,

            cn:
                null,

            en:
                null
        };
    }


    return {
        implication,

        available:
            true,

        cn:
            entry.cn,

        en:
            entry.en
    };
}


export function buildSemanticLanguage(
    semanticResult
) {

    if (
        !semanticResult ||
        semanticResult.success !==
            true ||
        semanticResult.status !==
            "comparison_semantics_ready"
    ) {

        return {
            engine:
                ENGINE_NAME,

            version:
                ENGINE_VERSION,

            success:
                false,

            status:
                "semantic_language_not_ready"
        };
    }


    const output = {};


    for (
        const [
            key,
            semantic
        ]
        of Object.entries(
            semanticResult.semantics ??
            {}
        )
    ) {

        output[key] = {
            key:
                semantic?.key ??
                null,

            available:
                semantic?.available ===
                true,

            higher_product:
                semantic
                    ?.higher_product ??
                null,

            lower_product:
                semantic
                    ?.lower_product ??
                null,

            language:
                Array.isArray(
                    semantic
                        ?.implications
                )
                    ? semantic
                        .implications
                        .map(
                            translateSemanticImplication
                        )
                        .filter(
                            item =>
                                item.available ===
                                true
                        )
                    : []
        };
    }


    return {
        engine:
            ENGINE_NAME,

        version:
            ENGINE_VERSION,

        success:
            true,

        status:
            "semantic_language_ready",

        semantics:
            output
    };
}


export default {
    translateSemanticImplication,
    buildSemanticLanguage
};
