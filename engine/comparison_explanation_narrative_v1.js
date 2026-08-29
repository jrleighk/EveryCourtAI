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
        language === "fr"
    ) {

        if (
            hasWeight &&
            hasSwingweight
        ) {
            return `${easierName} combine un poids statique et un swingweight plus faibles, ce qui facilite le déclenchement et les accélérations répétées ; ${demandingName} demande davantage de préparation et d'effort dans le swing.`;
        }


        if (
            hasSwingweight
        ) {
            return `${easierName} possède un swingweight plus faible et demande donc moins d'effort dynamique ; ${demandingName} exige davantage d'effort dans la durée.`;
        }


        if (
            hasWeight
        ) {
            return `${easierName} est plus légère et plus facile à accélérer ; ${demandingName} offre davantage de masse globale.`;
        }


        return null;
    }


    if (
        language === "es"
    ) {

        if (
            hasWeight &&
            hasSwingweight
        ) {
            return `${easierName} combina menor peso estático y menor swingweight, por lo que resulta más fácil iniciar y acelerar repetidamente; ${demandingName} exige más preparación y esfuerzo de swing.`;
        }


        if (
            hasSwingweight
        ) {
            return `${easierName} tiene un swingweight menor y, por tanto, una exigencia dinámica más baja; ${demandingName} requiere más esfuerzo continuado.`;
        }


        if (
            hasWeight
        ) {
            return `${easierName} es más ligera y más fácil de acelerar; ${demandingName} aporta una mayor sensación de masa.`;
        }


        return null;
    }


    if (
        language === "ja"
    ) {

        if (
            hasWeight &&
            hasSwingweight
        ) {
            return `${easierName}は静的重量とスイングウェイトの両方が低く、振り出しや連続した加速がしやすい一方、${demandingName}はより大きな準備とスイング出力を必要とします。`;
        }


        if (
            hasSwingweight
        ) {
            return `${easierName}はスイングウェイトが低く、動的な負担が小さめです。一方、${demandingName}はより持続的なスイング出力を必要とします。`;
        }


        if (
            hasWeight
        ) {
            return `${easierName}は静的重量が軽く、加速しやすい設計です。一方、${demandingName}はより大きな質量感があります。`;
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
        language === "fr"
    ) {

        if (
            hasHeadSize &&
            hasForgivenessDna
        ) {
            return `${primaryName} bénéficie à la fois d'un tamis plus grand et d'une meilleure tolérance, ce qui aide davantage sur les frappes décentrées.`;
        }


        if (
            hasHeadSize
        ) {
            return `${primaryName} possède un tamis plus grand, offrant une zone de frappe efficace plus importante et davantage de potentiel de tolérance.`;
        }


        if (
            hasForgivenessDna
        ) {
            return `${primaryName} affiche un niveau de tolérance supérieur et pardonne davantage les contacts imparfaits.`;
        }


        return null;
    }


    if (
        language === "es"
    ) {

        if (
            hasHeadSize &&
            hasForgivenessDna
        ) {
            return `${primaryName} presenta ventaja tanto en tamaño de cabeza como en tolerancia, ofreciendo más margen en impactos descentrados.`;
        }


        if (
            hasHeadSize
        ) {
            return `${primaryName} tiene una cabeza más grande, lo que amplía la zona efectiva de golpeo y el potencial de tolerancia.`;
        }


        if (
            hasForgivenessDna
        ) {
            return `${primaryName} tiene una valoración de tolerancia superior y perdona mejor los contactos imperfectos.`;
        }


        return null;
    }


    if (
        language === "ja"
    ) {

        if (
            hasHeadSize &&
            hasForgivenessDna
        ) {
            return `${primaryName}はフェイスサイズと寛容性の両面で優位があり、オフセンター時にもより安定した結果を得やすいです。`;
        }


        if (
            hasHeadSize
        ) {
            return `${primaryName}はより大きなフェイスを持ち、有効打球エリアと寛容性の余裕が大きくなります。`;
        }


        if (
            hasForgivenessDna
        ) {
            return `${primaryName}は寛容性の評価が高く、打点のずれに対してより許容度があります。`;
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
        language === "fr"
    ) {

        if (
            hasSwingweight &&
            hasWeight
        ) {
            return `${stableName} possède davantage de masse globale et de swingweight, ce qui favorise la stabilité et la traversée de balle ; ${lighterName ?? "l'autre raquette"} privilégie davantage la facilité d'accélération.`;
        }


        if (
            hasStability
        ) {
            return `${stableName} présente le profil de stabilité le plus élevé et devrait mieux maintenir la face de raquette face aux balles rapides.`;
        }


        if (
            hasSwingweight
        ) {
            return `${stableName} possède un swingweight plus élevé, apportant davantage de masse dynamique, de stabilité et de traversée de balle.`;
        }


        return null;
    }


    if (
        language === "es"
    ) {

        if (
            hasSwingweight &&
            hasWeight
        ) {
            return `${stableName} tiene más masa total y swingweight, lo que aporta mayor estabilidad y capacidad de atravesar la bola; ${lighterName ?? "la otra raqueta"} está más orientada a una aceleración sencilla.`;
        }


        if (
            hasStability
        ) {
            return `${stableName} presenta el perfil de estabilidad más sólido y debería mantener mejor la cara de la raqueta ante bolas con ritmo.`;
        }


        if (
            hasSwingweight
        ) {
            return `${stableName} tiene un swingweight más alto, aportando mayor masa dinámica, estabilidad y capacidad de atravesar la bola.`;
        }


        return null;
    }


    if (
        language === "ja"
    ) {

        if (
            hasSwingweight &&
            hasWeight
        ) {
            return `${stableName}は全体質量とスイングウェイトが高く、安定性と押し込みの強さにつながります。一方、${lighterName ?? "もう一方のラケット"}はより加速しやすい方向です。`;
        }


        if (
            hasStability
        ) {
            return `${stableName}は安定性の評価が高く、速いボールに対してもラケット面をより安定して保ちやすいです。`;
        }


        if (
            hasSwingweight
        ) {
            return `${stableName}はスイングウェイトが高く、より大きな動的質量によって安定性と押し込みの強さを得やすいです。`;
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


    const labelsFr = {
        power:
            "puissance",
        control:
            "contrôle",
        spin:
            "effets",
        comfort:
            "confort"
    };


    const labelsEs = {
        power:
            "potencia",
        control:
            "control",
        spin:
            "efecto",
        comfort:
            "comodidad"
    };


    const labelsJa = {
        power:
            "パワー",
        control:
            "コントロール",
        spin:
            "スピン",
        comfort:
            "快適性"
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


    if (
        language === "fr"
    ) {

        const parts = [];


        if (
            higherA.length > 0
        ) {
            parts.push(
                `${nameA} privilégie davantage ${higherA.map(key => labelsFr[key] ?? key).join(" et ")}`
            );
        }


        if (
            higherB.length > 0
        ) {
            parts.push(
                `${nameB} privilégie davantage ${higherB.map(key => labelsFr[key] ?? key).join(" et ")}`
            );
        }


        if (
            equal.length > 0
        ) {
            parts.push(
                `les deux sont proches en ${equal.map(key => labelsFr[key] ?? key).join(" et ")}`
            );
        }


        return (
            parts.length > 0
                ? `${parts.join(" ; ")}.`
                : null
        );
    }


    if (
        language === "es"
    ) {

        const parts = [];


        if (
            higherA.length > 0
        ) {
            parts.push(
                `${nameA} se orienta más hacia ${higherA.map(key => labelsEs[key] ?? key).join(" y ")}`
            );
        }


        if (
            higherB.length > 0
        ) {
            parts.push(
                `${nameB} se orienta más hacia ${higherB.map(key => labelsEs[key] ?? key).join(" y ")}`
            );
        }


        if (
            equal.length > 0
        ) {
            parts.push(
                `ambas son similares en ${equal.map(key => labelsEs[key] ?? key).join(" y ")}`
            );
        }


        return (
            parts.length > 0
                ? `${parts.join("; ")}.`
                : null
        );
    }


    if (
        language === "ja"
    ) {

        const parts = [];


        if (
            higherA.length > 0
        ) {
            parts.push(
                `${nameA}は${higherA.map(key => labelsJa[key] ?? key).join("・")}寄り`
            );
        }


        if (
            higherB.length > 0
        ) {
            parts.push(
                `${nameB}は${higherB.map(key => labelsJa[key] ?? key).join("・")}寄り`
            );
        }


        if (
            equal.length > 0
        ) {
            parts.push(
                `両者は${equal.map(key => labelsJa[key] ?? key).join("・")}で近い`
            );
        }


        return (
            parts.length > 0
                ? `${parts.join("。")}。`
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
            ),

        fr:
            buildLanguageBlock(
                synthesis,
                "fr"
            ),

        es:
            buildLanguageBlock(
                synthesis,
                "es"
            ),

        ja:
            buildLanguageBlock(
                synthesis,
                "ja"
            )
    };
}


export default {
    buildComparisonExplanationNarrative
};
