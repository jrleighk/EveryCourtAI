/**
 * ============================================================
 * EveryCourtAI
 * Comparison Clarification Answer Builder V1
 * ============================================================
 *
 * Purpose:
 *
 * Convert unresolved comparison targets into a useful,
 * deterministic clarification message.
 *
 * This module:
 *
 * - does NOT resolve products
 * - does NOT rank products
 * - does NOT guess ambiguous products
 * - only presents candidates already produced by resolver
 *
 * ============================================================
 */


function safeString(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";
    }


    return String(
        value
    ).trim();
}


function normalizeLocale(
    locale
) {

    const value =
        safeString(
            locale
        );


    if (
        value === "zh-CN" ||
        value === "zh-HK" ||
        value === "zh-TW" ||
        value === "en" ||
        value === "ja"
    ) {

        return value;
    }


    const normalized =
        value.toLowerCase();


    if (
        normalized === "zh" ||
        normalized === "zh-cn" ||
        normalized === "zh-sg" ||
        normalized === "zh-hans"
    ) {

        return "zh-CN";
    }


    if (
        normalized === "zh-hk" ||
        normalized === "zh-mo" ||
        normalized === "zh-hant"
    ) {

        return "zh-HK";
    }


    if (
        normalized === "zh-tw"
    ) {

        return "zh-TW";
    }


    if (
        normalized === "fr" ||
        normalized.startsWith(
            "fr-"
        )
    ) {

        return "fr";
    }


    if (
        normalized === "es" ||
        normalized.startsWith(
            "es-"
        )
    ) {

        return "es";
    }


    if (
        normalized === "ja" ||
        normalized.startsWith(
            "ja-"
        )
    ) {

        return "ja";
    }


    return "en";
}


function isChineseLocale(
    locale
) {

    return (
        locale === "zh-CN" ||
        locale === "zh-HK" ||
        locale === "zh-TW"
    );
}


function extractCandidateProduct(
    candidate
) {

    if (
        candidate?.product &&
        typeof candidate.product ===
            "object"
    ) {

        return candidate.product;
    }


    if (
        candidate &&
        typeof candidate ===
            "object"
    ) {

        return candidate;
    }


    return null;
}


function buildCandidateLabel(
    candidate,
    locale
) {

    const product =
        extractCandidateProduct(
            candidate
        );


    if (
        !product
    ) {

        return "";
    }


    const chinese =
        isChineseLocale(
            locale
        );


    const model =
        chinese
            ? (
                safeString(
                    product.model_cn
                ) ||
                safeString(
                    product.model
                )
            )
            : (
                safeString(
                    product.model
                ) ||
                safeString(
                    product.model_cn
                )
            );


    const brand =
        chinese
            ? (
                safeString(
                    product.brand_cn
                ) ||
                safeString(
                    product.brand
                )
            )
            : safeString(
                product.brand
            );


    if (
        !model
    ) {

        return "";
    }


    /*
     * Do not duplicate the brand if model already
     * contains it.
     */

    if (
        brand &&
        !model
            .toLowerCase()
            .includes(
                brand.toLowerCase()
            )
    ) {

        return `${brand} ${model}`;
    }


    return model;
}


function getClarificationCandidatePriority(
    candidate
) {

    const product =
        extractCandidateProduct(
            candidate
        );


    const id =
        safeString(
            product?.id
        ).toLowerCase();


    const model =
        safeString(
            product?.model
        ).toLowerCase();


    const identity =
        `${id} ${model}`;


    /*
     * Tier 3
     * Special editions / collaborations.
     *
     * Presentation priority only.
     * This does NOT change resolver confidence or identity.
     */

    const specialSignals = [
        "limited",
        "special edition",
        "collector",
        "anniversary",
        "laver cup",
        "wimbledon",
        "us open",
        "roland garros",
        "osaka",
        "kith",
        "gucci",
        "minions",
        "legend",
        "hall of fame",
        "autograph",
        "reverse",
        "collaboration"
    ];


    if (
        specialSignals.some(
            signal =>
                identity.includes(
                    signal
                )
        )
    ) {

        return 300;
    }


    /*
     * Tier 2
     * Standard product variants.
     */

    const variantSignals = [
        " pro ",
        " tour ",
        " mp l",
        "100l",
        "100ul",
        "98l",
        "100sl",
        " alpha",
        "98s"
    ];


    if (
        variantSignals.some(
            signal =>
                ` ${identity} `.includes(
                    signal
                )
        )
    ) {

        return 200;
    }


    /*
     * Tier 1
     * Core / standard production model.
     */

    return 100;
}


function normalizeCandidateList(
    unresolvedTarget,
    locale,
    maxCandidates
) {

    const source =
        Array.isArray(
            unresolvedTarget
                ?.candidates
        )
            ? [
                ...unresolvedTarget.candidates
            ].sort(
                (
                    left,
                    right
                ) =>
                    getClarificationCandidatePriority(
                        left
                    ) -
                    getClarificationCandidatePriority(
                        right
                    )
            )
            : [];


    const seen =
        new Set();


    const candidates =
        [];


    for (
        const candidate of source
    ) {

        const product =
            extractCandidateProduct(
                candidate
            );


        const id =
            safeString(
                product?.id
            );


        const label =
            buildCandidateLabel(
                candidate,
                locale
            );


        if (
            !id ||
            !label ||
            seen.has(
                id
            )
        ) {

            continue;
        }


        seen.add(
            id
        );


        candidates.push({
            id,

            label,

            brand:
                safeString(
                    product?.brand
                ),

            model:
                safeString(
                    product?.model
                ),

            release_year:
                product?.release_year ??
                null
        });


        if (
            candidates.length >=
            maxCandidates
        ) {

            break;
        }
    }


    return candidates;
}


export function buildComparisonClarificationAnswer({
    unresolvedTargets = [],
    locale = "en",
    maxCandidates = 5
} = {}) {

    const normalizedLocale =
        normalizeLocale(
            locale
        );


    const presentation = {
        en: {
            multiple:
                rawText =>
                    rawText
                        ? `I found multiple possible “${rawText}” models. Which one do you mean?`
                        : "I found multiple possible models. Which one do you mean?",

            reply:
                example =>
                    example
                        ? `Reply with the model name above, for example “${example}”.`
                        : "Reply with the model name above.",

            not_found:
                rawText =>
                    rawText
                        ? `I still cannot identify “${rawText}”. Please provide the brand, full model, or year.`
                        : "I still cannot identify the racquet. Please provide the brand, full model, or year.",

            unidentified:
                "I cannot uniquely identify the racquet yet. Please provide a more complete model name."
        },

        "zh-CN": {
            multiple:
                rawText =>
                    rawText
                        ? `我找到了多个可能的“${rawText}”型号。你指的是哪一款？`
                        : "我找到了多个可能的型号。你指的是哪一款？",

            reply:
                example =>
                    example
                        ? `直接回复上面的型号即可，例如“${example}”。`
                        : "直接回复上面的型号即可。",

            not_found:
                rawText =>
                    rawText
                        ? `我还无法识别“${rawText}”。请提供品牌、完整型号或年份。`
                        : "我还无法识别这支球拍。请提供品牌、完整型号或年份。",

            unidentified:
                "我还不能唯一确定你要比较的球拍，请提供更完整的型号。"
        },

        "zh-HK": {
            multiple:
                rawText =>
                    rawText
                        ? `我找到多個可能的「${rawText}」型號。你指的是哪一款？`
                        : "我找到多個可能的型號。你指的是哪一款？",

            reply:
                example =>
                    example
                        ? `直接回覆上面的型號即可，例如「${example}」。`
                        : "直接回覆上面的型號即可。",

            not_found:
                rawText =>
                    rawText
                        ? `我仍無法識別「${rawText}」。請提供品牌、完整型號或年份。`
                        : "我仍無法識別這支球拍。請提供品牌、完整型號或年份。",

            unidentified:
                "我還不能唯一確定你要比較的球拍，請提供更完整的型號。"
        },

        fr: {
            multiple:
                rawText =>
                    rawText
                        ? `J’ai trouvé plusieurs modèles possibles pour « ${rawText} ». Lequel voulez-vous dire ?`
                        : "J’ai trouvé plusieurs modèles possibles. Lequel voulez-vous dire ?",

            reply:
                example =>
                    example
                        ? `Répondez simplement avec le modèle ci-dessus, par exemple « ${example} ».`
                        : "Répondez simplement avec le modèle ci-dessus.",

            not_found:
                rawText =>
                    rawText
                        ? `Je ne parviens pas encore à identifier « ${rawText} ». Indiquez la marque, le modèle complet ou l’année.`
                        : "Je ne parviens pas encore à identifier cette raquette. Indiquez la marque, le modèle complet ou l’année.",

            unidentified:
                "Je ne peux pas encore identifier précisément la raquette. Indiquez un nom de modèle plus complet."
        },

        es: {
            multiple:
                rawText =>
                    rawText
                        ? `He encontrado varios modelos posibles para «${rawText}». ¿A cuál te refieres?`
                        : "He encontrado varios modelos posibles. ¿A cuál te refieres?",

            reply:
                example =>
                    example
                        ? `Responde con el modelo de arriba, por ejemplo «${example}».`
                        : "Responde con el modelo de arriba.",

            not_found:
                rawText =>
                    rawText
                        ? `Todavía no puedo identificar «${rawText}». Indica la marca, el modelo completo o el año.`
                        : "Todavía no puedo identificar la raqueta. Indica la marca, el modelo completo o el año.",

            unidentified:
                "Todavía no puedo identificar con precisión la raqueta. Indica un nombre de modelo más completo."
        },

        ja: {
            multiple:
                rawText =>
                    rawText
                        ? `「${rawText}」には複数の候補があります。どのモデルですか？`
                        : "複数の候補があります。どのモデルですか？",

            reply:
                example =>
                    example
                        ? `上のモデル名をそのまま返信してください。例：「${example}」`
                        : "上のモデル名をそのまま返信してください。",

            not_found:
                rawText =>
                    rawText
                        ? `「${rawText}」をまだ特定できません。ブランド、正式なモデル名、または年式を入力してください。`
                        : "ラケットをまだ特定できません。ブランド、正式なモデル名、または年式を入力してください。",

            unidentified:
                "比較するラケットをまだ一意に特定できません。より詳しいモデル名を入力してください。"
        }
    };


    const copy =
        presentation[
            normalizedLocale
        ] ??
        presentation.en;


    const unresolved =
        Array.isArray(
            unresolvedTargets
        )
            ? unresolvedTargets
            : [];


    const target =
        unresolved.find(
            item =>
                item?.status ===
                    "ambiguous"
        ) ??
        unresolved[0] ??
        null;


    if (
        !target
    ) {

        return {
            available:
                false,

            locale:
                normalizedLocale,

            answer:
                copy.unidentified,

            target:
                null,

            candidates:
                []
        };
    }


    const rawText =
        safeString(
            target.raw_text
        );


    const candidates =
        normalizeCandidateList(
            target,
            normalizedLocale,
            Math.max(
                1,
                Number(
                    maxCandidates
                ) || 5
            )
        );


    /*
     * Not-found target:
     * there are no trustworthy candidates to present.
     */

    if (
        target.status ===
            "not_found" ||
        candidates.length ===
            0
    ) {

        return {
            available:
                true,

            locale:
                normalizedLocale,

            answer:
                copy.not_found(
                    rawText
                ),

            target: {
                raw_text:
                    rawText,

                status:
                    target.status
            },

            candidates:
                []
        };
    }


    const lines =
        candidates.map(
            (
                candidate,
                index
            ) =>
                `${index + 1}. ${candidate.label}`
        );


    const example =
        candidates[0]
            ?.label ??
        "";


    const answer =
        [
            copy.multiple(
                rawText
            ),
            "",
            ...lines,
            "",
            copy.reply(
                example
            )
        ].join(
            "\n"
        );


    return {
        available:
            true,

        locale:
            normalizedLocale,

        answer,

        target: {
            raw_text:
                rawText,

            status:
                target.status
        },

        candidates
    };
}


export default {
    buildComparisonClarificationAnswer
};
