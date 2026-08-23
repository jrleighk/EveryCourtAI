/**
 * ============================================================
 * EveryCourtAI
 * Equipment Selector V1
 * ============================================================
 *
 * Responsibilities:
 *
 * 1. Search racquet / string product registry
 * 2. Show candidate dropdowns
 * 3. Store exact selected product data
 * 4. Preserve manual text input as fallback
 *
 * ============================================================
 */


import {
    RACQUET_PRODUCT_REGISTRY,
    STRING_PRODUCT_REGISTRY
} from "../engine/product_registry.generated.js";


const MAX_RESULTS =
    8;


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


function normalizeText(
    value
) {

    return safeString(
        value
    )
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


function buildSearchText(
    product
) {

    return normalizeText(
        [
            product?.brand,
            product?.brand_cn,
            product?.model,
            product?.model_cn,
            product?.series,
            ...(product?.strong_patterns ?? []),
            ...(product?.weak_patterns ?? [])
        ]
            .filter(
                Boolean
            )
            .join(
                " "
            )
    );
}


function scoreProduct(
    product,
    query
) {

    const normalizedQuery =
        normalizeText(
            query
        );


    if (
        !normalizedQuery
    ) {

        return 0;
    }


    const brand =
        normalizeText(
            product?.brand
        );


    const model =
        normalizeText(
            product?.model
        );


    const fullName =
        normalizeText(
            `${brand} ${model}`
        );


    const searchText =
        buildSearchText(
            product
        );


    let score =
        0;


    if (
        fullName ===
        normalizedQuery
    ) {

        score +=
            1000;
    }


    if (
        model ===
        normalizedQuery
    ) {

        score +=
            900;
    }


    if (
        fullName.startsWith(
            normalizedQuery
        )
    ) {

        score +=
            500;
    }


    if (
        model.startsWith(
            normalizedQuery
        )
    ) {

        score +=
            450;
    }


    if (
        searchText.includes(
            normalizedQuery
        )
    ) {

        score +=
            250;
    }


    const queryTokens =
        normalizedQuery
            .split(
                " "
            )
            .filter(
                Boolean
            );


    for (
        const token
        of queryTokens
    ) {

        if (
            searchText.includes(
                token
            )
        ) {

            score +=
                40;
        }
    }


    return score;
}


function searchProducts(
    registry,
    query
) {

    const normalizedQuery =
        normalizeText(
            query
        );


    if (
        !normalizedQuery
    ) {

        return [];
    }


    return registry
        .map(
            product => ({
                product,
                score:
                    scoreProduct(
                        product,
                        normalizedQuery
                    )
            })
        )
        .filter(
            item =>
                item.score >
                0
        )
        .sort(
            (
                a,
                b
            ) =>
                b.score -
                a.score
        )
        .slice(
            0,
            MAX_RESULTS
        )
        .map(
            item =>
                item.product
        );
}


function createDropdown(
    inputElement
) {

    const container =
        inputElement
            ?.parentElement;


    if (
        !container
    ) {

        return null;
    }


    container
        .style
        .position =
        "relative";


    const dropdown =
        document
            .createElement(
                "div"
            );


    dropdown.className =
        "equipment-selector-dropdown";


    dropdown.style.display =
        "none";


    container.appendChild(
        dropdown
    );


    return dropdown;
}


function formatProductLabel(
    product
) {

    const brand =
        safeString(
            product?.brand
        );


    const model =
        safeString(
            product?.model
        );


    return [
        brand,
        model
    ]
        .filter(
            Boolean
        )
        .join(
            " "
        );
}


function setSelectedProduct(
    inputElement,
    product
) {

    if (
        !inputElement ||
        !product
    ) {

        return;
    }


    inputElement.value =
        formatProductLabel(
            product
        );


    inputElement.dataset.productId =
        product.id ??
        "";


    inputElement.dataset.productBrand =
        product.brand ??
        "";


    inputElement.dataset.productModel =
        product.model ??
        "";


    if (
        Array.isArray(
            product.gauges_mm
        ) &&
        product.gauges_mm.length ===
            1
    ) {

        inputElement.dataset.productGaugeMm =
            String(
                product.gauges_mm[0]
            );

    } else {

        delete inputElement
            .dataset
            .productGaugeMm;
    }


    inputElement.dispatchEvent(
        new CustomEvent(
            "equipment:selected",
            {
                bubbles:
                    true,

                detail: {
                    product
                }
            }
        )
    );
}


function clearSelectedProduct(
    inputElement
) {

    if (
        !inputElement
    ) {

        return;
    }


    delete inputElement
        .dataset
        .productId;


    delete inputElement
        .dataset
        .productBrand;


    delete inputElement
        .dataset
        .productModel;


    delete inputElement
        .dataset
        .productGaugeMm;
}


function renderResults(
    dropdown,
    inputElement,
    products
) {

    if (
        !dropdown
    ) {

        return;
    }


    dropdown.innerHTML =
        "";


    if (
        !Array.isArray(
            products
        ) ||
        products.length ===
            0
    ) {

        dropdown.style.display =
            "none";

        return;
    }


    for (
        const product
        of products
    ) {

        const option =
            document
                .createElement(
                    "button"
                );


        option.type =
            "button";


        option.className =
            "equipment-selector-option";


        const label =
            formatProductLabel(
                product
            );


        option.textContent =
            label;


        option.addEventListener(
            "mousedown",
            event => {

                event.preventDefault();


                setSelectedProduct(
                    inputElement,
                    product
                );


                dropdown.style.display =
                    "none";
            }
        );


        dropdown.appendChild(
            option
        );
    }


    dropdown.style.display =
        "block";
}


function initializeSelector(
    {
        inputId,
        registry
    }
) {

    const inputElement =
        document
            .getElementById(
                inputId
            );


    if (
        !inputElement
    ) {

        return;
    }


    const dropdown =
        createDropdown(
            inputElement
        );


    if (
        !dropdown
    ) {

        return;
    }


    inputElement
        .setAttribute(
            "autocomplete",
            "off"
        );


    inputElement.addEventListener(
        "input",
        () => {

            clearSelectedProduct(
                inputElement
            );


            const products =
                searchProducts(
                    registry,
                    inputElement.value
                );


            renderResults(
                dropdown,
                inputElement,
                products
            );
        }
    );


    inputElement.addEventListener(
        "focus",
        () => {

            const products =
                searchProducts(
                    registry,
                    inputElement.value
                );


            renderResults(
                dropdown,
                inputElement,
                products
            );
        }
    );


    inputElement.addEventListener(
        "blur",
        () => {

            window.setTimeout(
                () => {

                    dropdown.style.display =
                        "none";

                },
                120
            );
        }
    );
}


export function initializeEquipmentSelector() {

    initializeSelector({
        inputId:
            "playerCurrentRacquet",

        registry:
            RACQUET_PRODUCT_REGISTRY
    });


    initializeSelector({
        inputId:
            "playerCurrentString",

        registry:
            STRING_PRODUCT_REGISTRY
    });


    console.log(
        "EveryCourtAI Equipment Selector V1 connected."
    );


    return {
        success:
            true,

        version:
            "1.0"
    };
}


export function getSelectedEquipmentProduct(
    inputId
) {

    const inputElement =
        document
            .getElementById(
                inputId
            );


    if (
        !inputElement
    ) {

        return null;
    }


    const id =
        safeString(
            inputElement
                .dataset
                .productId
        );


    if (
        !id
    ) {

        return null;
    }


    return {
        id,

        brand:
            safeString(
                inputElement
                    .dataset
                    .productBrand
            ) ||
            null,

        model:
            safeString(
                inputElement
                    .dataset
                    .productModel
            ) ||
            null,

        gauge_mm:
            inputElement
                .dataset
                .productGaugeMm
                ? Number(
                    inputElement
                        .dataset
                        .productGaugeMm
                )
                : null
    };
}


if (
    document.readyState ===
        "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeEquipmentSelector
    );

} else {

    initializeEquipmentSelector();
}


window.EveryCourtEquipmentSelector = {
    initializeEquipmentSelector,
    getSelectedEquipmentProduct
};
