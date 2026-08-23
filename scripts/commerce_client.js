/**
 * ============================================================
 * EveryCourtAI
 * Browser Commerce Client V0.1
 * ============================================================
 *
 * Browser-safe commerce data access.
 *
 * Does NOT use:
 * node:fs
 * node:path
 *
 * ============================================================
 */


let storesCache =
    null;

let inventoryCache =
    null;

let servicesCache =
    null;


/**
 * ============================================================
 * Load JSON
 * ============================================================
 */

async function loadJson(
    path
) {

    const response =
        await fetch(
            path,
            {
                cache:
                    "no-store"
            }
        );


    if (
        !response.ok
    ) {

        throw new Error(
            `Commerce Client: failed to load ${path}`
        );
    }


    return response.json();
}


/**
 * ============================================================
 * Data
 * ============================================================
 */

async function loadStores() {

    if (
        storesCache
    ) {

        return storesCache;
    }


    const data =
        await loadJson(
            "./data/commerce/stores.json"
        );


    storesCache =
        Array.isArray(
            data?.stores
        )
            ? data.stores
            : [];


    return storesCache;
}


async function loadInventory() {

    if (
        inventoryCache
    ) {

        return inventoryCache;
    }


    const data =
        await loadJson(
            "./data/commerce/inventory.json"
        );


    inventoryCache =
        Array.isArray(
            data?.inventory
        )
            ? data.inventory
            : [];


    return inventoryCache;
}


async function loadServices() {

    if (
        servicesCache
    ) {

        return servicesCache;
    }


    const data =
        await loadJson(
            "./data/commerce/services.json"
        );


    servicesCache =
        Array.isArray(
            data?.services
        )
            ? data.services
            : [];


    return servicesCache;
}


/**
 * ============================================================
 * Stringing Offers
 * ============================================================
 */

export async function buildBrowserStringingOffers(
    {
        string_id,
        gauge_mm = null,
        tension_lbs = null
    } = {}
) {

    if (
        !string_id
    ) {

        throw new Error(
            "Commerce Client: string_id is required."
        );
    }


    const [
        stores,
        inventory,
        services
    ] =
        await Promise.all([
            loadStores(),
            loadInventory(),
            loadServices()
        ]);


    const inventoryMatches =
        inventory.filter(
            item =>
                item?.product_id ===
                    string_id &&
                item?.stock_status ===
                    "in_stock" &&
                Number(
                    item?.quantity ??
                    0
                ) > 0
        );


    const offers =
        [];


    for (
        const item
        of inventoryMatches
    ) {

        const store =
            stores.find(
                candidate =>
                    candidate?.id ===
                        item.store_id &&
                    candidate?.active ===
                        true
            );


        if (
            !store
        ) {

            continue;
        }


        const service =
            services.find(
                candidate =>
                    candidate?.store_id ===
                        item.store_id &&
                    candidate?.service_type ===
                        "stringing_service" &&
                    candidate?.active ===
                        true
            );


        if (
            !service
        ) {

            continue;
        }


        if (
            service.currency !==
            item.currency
        ) {

            continue;
        }


        const productPrice =
            Number(
                item.price ??
                0
            );


        const servicePrice =
            Number(
                service.price ??
                0
            );


        offers.push({

            offer_type:
                "stringing_package",

            store: {
                id:
                    store.id,

                name:
                    store.name,

                country_code:
                    store.country_code,

                city:
                    store.city,

                currency:
                    store.currency,

                location:
                    store.location,

                capabilities:
                    store.capabilities
            },

            product: {
                product_id:
                    item.product_id,

                product_type:
                    item.product_type,

                gauge_mm:
                    gauge_mm ??
                    item.gauge_mm ??
                    null,

                price:
                    productPrice
            },

            service: {
                service_id:
                    service.service_id,

                service_type:
                    service.service_type,

                name:
                    service.name,

                price:
                    servicePrice
            },

            setup: {
                tension_lbs
            },

            currency:
                item.currency,

            total:
                productPrice +
                servicePrice,

            stock_status:
                item.stock_status,

            quantity:
                item.quantity
        });
    }


    return offers;
}


export default {
    buildBrowserStringingOffers
};
