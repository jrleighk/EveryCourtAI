/**
 * ============================================================
 * EveryCourtAI
 * Comparison Explanation Narrative V1
 * ============================================================
 *
 * Purpose:
 *
 * Convert explanation synthesis clusters into concise,
 * non-repetitive bilingual narrative blocks.
 *
 * This engine does NOT:
 *
 * - score products
 * - determine winners
 * - modify player-fit decisions
 * - infer unavailable facts
 *
 * Source of truth:
 *
 * comparison_explanation_synthesis_v1.js
 *
 * ============================================================
 */

const ENGINE_NAME =
    "comparison_explanation_narrative";

const ENGINE_VERSION =
    "1.0";


function getProduct(
    synthesis,
    key
) {

    return (
        key === "a"
            ? synthesis
                ?.products
                ?.product_a
            : (
                key === "b"
                    ? synthesis
                        ?.products
                        ?.product_b
                    : null
            )
    );
}


function getProductName(
    synthesis,
    key
) {

    const product =
        getProduct(
            synthesis,
            key
        );


    return (
        product?.model ??
        product?.display_name ??
        product?.id ??
        null
    );
}


function hasEvidence(
    cluster,
    key
) {

    return (
        Array.isArray(
            cluster?.evidence
        ) &&
        cluster.evidence.some(
            item =>
                item?.key === key
        )
    );
}


function buildEaseDemandNarrative(
    synthesis,
    language
) {

    const cluster =
        synthesis
            ?.clusters
            ?.ease_and_demand;


    if (
        cluster?.available !== true
    ) {
        return null;
    }


    const easier =
        cluster.primary_product;

    const demanding =
        cluster.secondary_product;


    const easierName =
        getProductName(
            synthesis,
            easier
        );

    const demandingName =
        getProductName(
            synthesis,
            demanding
        );


    if (
        !easierName ||
        !demandingName
    ) {
        return null;
    }


    const hasWeight =
        hasEvidence(
            cluster,
            "weight_unstrung_g"
        );

    const hasSwingweight =
        hasEvidence(
            cluster,
            "swingweight"
        );


    if (
        language === "cn"
    ) {

        if (
            hasWeight &&
            hasSwingweight
        ) {
            return `${easierName}的整体重量与挥重更低，因此更容易启动和连续加速；相比之下，${demandingName}需要更多挥拍准备与身体输出。`;
        }


        if (
            hasSwingweight
        ) {
            return `${easierName}的挥重更低，因此动态挥拍负担更小；${demandingName}则需要更多持续挥拍输出。`;
        }


        if (
            hasWeight
        ) {
            return `${easierName}的静态重量更轻，因此更容易完成快速挥拍；${demandingName}的整体质量感更强。`;
        }


        return null;
    }


    if (
        hasWeight &&
        hasSwingweight
    ) {
        return `${easierName} combines lower static weight with lower swingweight, making it easier to initiate and accelerate repeatedly; ${demandingName} requires more preparation and sustained swing effort.`;
    }


    if (
        hasSwingweight
    ) {
        return `${easierName} has the lower swingweight and therefore lower dynamic swing demand, while ${demandingName} requires more sustained swing effort.`;
    }


    if (
        hasWeight
    ) {
        return `${easierName} is lighter in static weight and easier to accelerate, while ${demandingName} carries more overall mass.`;
    }


    return null;
}


function buildForgivenessNarrative(
    synthesis,
    language
) {

    const cluster =
        synthesis
            ?.clusters
            ?.forgiveness;


    if (
        cluster?.available !== true ||
        !cluster.primary_product
    ) {
        return null;
    }


    const primaryName =
        getProductName(
            synthesis,
            cluster.primary_product
        );


    const secondaryName =
        getProductName(
            synthesis,
            cluster.secondary_product
        );


    if (
        !primaryName
    ) {
        return null;
    }


    const hasHeadSize =
        hasEvidence(
            cluster,
            "head_size_sq_in"
        );

    const hasForgivenessDna =
        hasEvidence(
            cluster,
            "forgiveness"
        );


    if (
        language === "cn"
    ) {

        if (
            hasHeadSize &&
            hasForgivenessDna
        ) {
            return `${primaryName}在拍面尺寸和容错表现上都更有优势，因此对非甜区击球更宽容。`;
        }


        if (
            hasHeadSize
        ) {
            return `${primaryName}拥有更大的拍面，因此提供更大的有效击球区域和更高的容错潜力。`;
        }


        if (
            hasForgivenessDna
        ) {
            return `${primaryName}的容错评分更高，对击球点偏差更宽容。`;
        }


        return null;
    }


    if (
        hasHeadSize &&
        hasForgivenessDna
    ) {
        return `${primaryName} has the advantage in both head size and forgiveness, giving it more tolerance on off-center contact.`;
    }


    if (
        hasHeadSize
    ) {
        return `${primaryName} has the larger head size, providing a larger effective hitting area and greater forgiveness potential.`;
    }


    if (
        hasForgivenessDna
    ) {
        return `${primaryName} has the higher forgiveness rating and offers more tolerance on imperfect contact.`;
    }


    return null;
}


function buildStabilityPlowNarrative(
    synthesis,
    language
) {

    const cluster =
        synthesis
            ?.clusters
            ?.stability_and_plow;


    if (
        cluster?.available !== true ||
        !cluster.primary_product
    ) {
        return null;
    }


    const stableName =
        getProductName(
            synthesis,
            cluster.primary_product
        );


    const lighterName =
        getProductName(
            synthesis,
            cluster.secondary_product
        );


    if (
        !stableName
    ) {
        return null;
    }


    const hasWeight =
        hasEvidence(
            cluster,
            "weight_unstrung_g"
        );

    const hasSwingweight =
        hasEvidence(
            cluster,
            "swingweight"
        );

    const hasStability =
        hasEvidence(
            cluster,
            "stability"
        );


    if (
        language === "cn"
    ) {

        if (
            hasSwingweight &&
            hasWeight
        ) {
            return `${stableName}拥有更高的整体质量和挥重，因此击球时更有稳定性与穿透潜力；${lighterName ?? "另一支球拍"}则更偏向轻快和易加速。`;
        }


        if (
            hasStability
        ) {
            return `${stableName}的稳定性表现更高，在对抗来球时更容易保持拍面稳定。`;
        }


        if (
            hasSwingweight
        ) {
            return `${stableName}更高的挥重带来更强的动态质量，因此具有更高的稳定与穿透潜力。`;
        }


        return null;
    }


    if (
        hasSwingweight &&
        hasWeight
    ) {
        return `${stableName} carries more overall mass and swingweight, giving it greater stability and plow-through potential; ${lighterName ?? "the other racquet"} is more oriented toward easier acceleration.`;
    }


    if (
        hasStability
    ) {
        return `${stableName} has the stronger stability profile and should hold the racquet face more securely against incoming pace.`;
    }


    if (
        hasSwingweight
    ) {
        return `${stableName} has the higher swingweight, giving it greater dynamic mass and more stability and plow-through potential.`;
    }


    return null;
}


function buildPerformanceIdentityNarrative(
    synthesis,
    language
) {

    const cluster =
        synthesis
            ?.clusters
            ?.performance_identity;


    if (
        cluster?.available !== true ||
        !Array.isArray(
            cluster.evidence
        )
    ) {
        return null;
    }


    const higherA = [];
    const higherB = [];
    const equal = [];


    for (
        const item
        of cluster.evidence
    ) {

        if (
            item?.higher_product === "a"
        ) {
            higherA.push(
                item.key
            );
        } else if (
            item?.higher_product === "b"
        ) {
            higherB.push(
                item.key
            );
        } else if (
            item?.relation === "equal"
        ) {
            equal.push(
                item.key
            );
        }
    }


    const nameA =
        getProductName(
            synthesis,
            "a"
        );

    const nameB =
        getProductName(
            synthesis,
            "b"
        );


    const labelsCn = {
        power:
            "力量",
        control:
            "控制",
        spin:
            "旋转",
        comfort:
            "舒适性"
    };


    const labelsEn = {
        power:
            "power",
        control:
            "control",
        spin:
            "spin",
        comfort:
            "comfort"
    };


    const mapLabels = (
        values,
        labels
    ) =>
        values
            .map(
                key =>
                    labels[key] ??
                    key
            )
            .join("、");


    if (
        language === "cn"
    ) {

        const parts = [];


        if (
            higherA.length > 0
        ) {
            parts.push(
                `${nameA}更偏向${mapLabels(higherA, labelsCn)}`
            );
        }


        if (
            higherB.length > 0
        ) {
            parts.push(
                `${nameB}更偏向${mapLabels(higherB, labelsCn)}`
            );
        }


        if (
            equal.length > 0
        ) {
            parts.push(
                `两者在${mapLabels(equal, labelsCn)}上接近`
            );
        }


        return (
            parts.length > 0
                ? `${parts.join("；")}。`
                : null
        );
    }


    const parts = [];


    if (
        higherA.length > 0
    ) {
        parts.push(
            `${nameA} leans more toward ${higherA.map(key => labelsEn[key] ?? key).join(" and ")}`
        );
    }


    if (
        higherB.length > 0
    ) {
        parts.push(
            `${nameB} leans more toward ${higherB.map(key => labelsEn[key] ?? key).join(" and ")}`
        );
    }


    if (
        equal.length > 0
    ) {
        parts.push(
            `the two are similar in ${equal.map(key => labelsEn[key] ?? key).join(" and ")}`
        );
    }


    return (
        parts.length > 0
            ? `${parts.join("; ")}.`
            : null
    );
}


function buildLanguageBlock(
    synthesis,
    language
) {

    const blocks = [
        {
            id:
                "ease_and_demand",

            text:
                buildEaseDemandNarrative(
                    synthesis,
                    language
                )
        },

        {
            id:
                "forgiveness",

            text:
                buildForgivenessNarrative(
                    synthesis,
                    language
                )
        },

        {
            id:
                "stability_and_plow",

            text:
                buildStabilityPlowNarrative(
                    synthesis,
                    language
                )
        },

        {
            id:
                "performance_identity",

            text:
                buildPerformanceIdentityNarrative(
                    synthesis,
                    language
                )
        }
    ]
        .filter(
            item =>
                Boolean(
                    item.text
                )
        );


    return {
        blocks
    };
}


/**
 * ============================================================
 * Public API
 * ============================================================
 */

export function buildComparisonExplanationNarrative(
    synthesis
) {

    if (
        !synthesis ||
        synthesis.success !== true ||
        synthesis.status !==
            "comparison_explanation_synthesis_ready"
    ) {

        return {
            engine:
                ENGINE_NAME,

            version:
                ENGINE_VERSION,

            success:
                false,

            status:
                "comparison_explanation_narrative_not_ready"
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
            "comparison_explanation_narrative_ready",

        products:
            synthesis.products ??
            null,

        cn:
            buildLanguageBlock(
                synthesis,
                "cn"
            ),

        en:
            buildLanguageBlock(
                synthesis,
                "en"
            )
    };
}


export default {
    buildComparisonExplanationNarrative
};
