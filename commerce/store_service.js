/**
 * ============================================================
 * EveryCourtAI
 * Store Service
 * Version: 0.1
 * ============================================================
 *
 * Responsibilities:
 *
 * 1. Load commerce store data
 * 2. Find store by ID
 * 3. Filter stores by country / city
 * 4. Filter stores by brand
 * 5. Filter stores by capability
 *
 * ============================================================
 */

import fs from "node:fs";
import path from "node:path";
import {
    fileURLToPath
} from "node:url";


const STORE_SERVICE_VERSION =
    "0.1";


const __filename =
    fileURLToPath(
        import.meta.url
    );


const __dirname =
    path.dirname(
        __filename
    );


const STORE_DATA_PATH =
    path.resolve(
        __dirname,
        "../data/commerce/stores.json"
    );


/**
 * ============================================================
 * Helpers
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


function normalizeText(
    value
) {

    return safeString(
        value
    )
        .toLowerCase()
        .replace(
            /\s+/g,
            " "
        )
        .trim();
}


function normalizeCountryCode(
    value
) {

    return safeString(
        value
    )
        .toUpperCase();
}


/**
 * ============================================================
 * Store Data
 * ============================================================
 */

export function loadStores() {

    const raw =
        fs.readFileSync(
            STORE_DATA_PATH,
            "utf8"
        );


    const data =
        JSON.parse(
            raw
        );


    if (
        !data ||
        !Array.isArray(
            data.stores
        )
    ) {

        throw new Error(
            "Invalid EveryCourtAI store data."
        );
    }


    return data.stores;
}


/**
 * ============================================================
 * Active Stores
 * ============================================================
 */

export function getActiveStores() {

    return loadStores()
        .filter(
            store =>
                store?.active === true
        );
}


/**
 * ============================================================
 * Find Store
 * ============================================================
 */

export function findStoreById(
    storeId
) {

    const normalizedId =
        normalizeText(
            storeId
        );


    if (!normalizedId) {

        return null;
    }


    return (
        getActiveStores()
            .find(
                store =>
                    normalizeText(
                        store?.id
                    ) ===
                    normalizedId
            ) ??
        null
    );
}


/**
 * ============================================================
 * Search Stores
 * ============================================================
 */

export function searchStores(
    {
        country_code = null,
        city = null,
        brand = null,
        capability = null
    } = {}
) {

    let stores =
        getActiveStores();


    if (country_code) {

        const targetCountry =
            normalizeCountryCode(
                country_code
            );


        stores =
            stores.filter(
                store =>
                    normalizeCountryCode(
                        store?.country_code
                    ) ===
                    targetCountry
            );
    }


    if (city) {

        const targetCity =
            normalizeText(
                city
            );


        stores =
            stores.filter(
                store =>
                    normalizeText(
                        store?.city
                    ) ===
                    targetCity
            );
    }


    if (brand) {

        const targetBrand =
            normalizeText(
                brand
            );


        stores =
            stores.filter(
                store =>
                    Array.isArray(
                        store?.brands
                    ) &&
                    store.brands.some(
                        item =>
                            normalizeText(
                                item
                            ) ===
                            targetBrand
                    )
            );
    }


    if (capability) {

        const targetCapability =
            normalizeText(
                capability
            );


        stores =
            stores.filter(
                store =>
                    Array.isArray(
                        store?.capabilities
                    ) &&
                    store.capabilities.some(
                        item =>
                            normalizeText(
                                item
                            ) ===
                            targetCapability
                    )
            );
    }


    return stores;
}


/**
 * ============================================================
 * Service Info
 * ============================================================
 */

export function getStoreServiceInfo() {

    const stores =
        getActiveStores();


    return {
        service:
            "EveryCourtAI Store Service",

        version:
            STORE_SERVICE_VERSION,

        store_count:
            stores.length
    };
}


export default {
    loadStores,
    getActiveStores,
    findStoreById,
    searchStores,
    getStoreServiceInfo
};
