import fs from "node:fs";
import path from "node:path";
import {
  fileURLToPath
} from "node:url";

import {
  findStoreById
} from "./store_service.js";


const __filename =
  fileURLToPath(
    import.meta.url
  );

const __dirname =
  path.dirname(
    __filename
  );

const INVENTORY_DATA_PATH =
  path.resolve(
    __dirname,
    "../data/commerce/inventory.json"
  );


export function loadInventory() {

  const raw =
    fs.readFileSync(
      INVENTORY_DATA_PATH,
      "utf8"
    );

  const data =
    JSON.parse(
      raw
    );

  if (
    !data ||
    !Array.isArray(
      data.inventory
    )
  ) {

    throw new Error(
      "Invalid EveryCourtAI inventory data."
    );
  }

  return data.inventory;
}


export function findOffersForProduct(
  productId,
  {
    in_stock_only = true
  } = {}
) {

  let records =
    loadInventory()
      .filter(
        item =>
          item?.product_id ===
          productId
      );


  if (
    in_stock_only
  ) {

    records =
      records.filter(
        item =>
          item?.stock_status ===
            "in_stock" &&
          Number(
            item?.quantity ?? 0
          ) > 0
      );
  }


  return records
    .map(
      item => {

        const store =
          findStoreById(
            item.store_id
          );

        return {
          ...item,

          store:
            store
              ? {
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
                }
              : null
        };
      }
    )
    .filter(
      item =>
        item.store !==
        null
    );
}


export function findStoreProductOffer(
  storeId,
  productId
) {

  return (
    loadInventory()
      .find(
        item =>
          item?.store_id ===
            storeId &&
          item?.product_id ===
            productId
      ) ??
    null
  );
}


export default {
  loadInventory,
  findOffersForProduct,
  findStoreProductOffer
};
