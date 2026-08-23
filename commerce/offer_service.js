import fs from "node:fs";
import path from "node:path";
import {
  fileURLToPath
} from "node:url";

import {
  findOffersForProduct
} from "./inventory_service.js";


const __filename =
  fileURLToPath(
    import.meta.url
  );

const __dirname =
  path.dirname(
    __filename
  );

const SERVICES_DATA_PATH =
  path.resolve(
    __dirname,
    "../data/commerce/services.json"
  );


function loadServices() {

  const raw =
    fs.readFileSync(
      SERVICES_DATA_PATH,
      "utf8"
    );

  const data =
    JSON.parse(
      raw
    );

  if (
    !data ||
    !Array.isArray(
      data.services
    )
  ) {

    throw new Error(
      "Invalid EveryCourtAI services data."
    );
  }

  return data.services;
}


function findStringingService(
  storeId
) {

  return (
    loadServices()
      .find(
        service =>
          service?.store_id ===
            storeId &&
          service?.service_type ===
            "stringing_service" &&
          service?.active ===
            true
      ) ??
    null
  );
}


export function buildStringingOffers({
  string_id,
  gauge_mm = null,
  tension_lbs = null
} = {}) {

  if (!string_id) {

    throw new Error(
      "Offer Service: string_id is required."
    );
  }


  const inventoryOffers =
    findOffersForProduct(
      string_id
    );


  return inventoryOffers
    .map(
      inventoryOffer => {

        const service =
          findStringingService(
            inventoryOffer.store_id
          );


        if (!service) {
          return null;
        }


        if (
          inventoryOffer.currency !==
          service.currency
        ) {

          return null;
        }


        const stringPrice =
          Number(
            inventoryOffer.price ??
            0
          );

        const servicePrice =
          Number(
            service.price ??
            0
          );


        return {
          offer_type:
            "stringing_package",

          store:
            inventoryOffer.store,

          product: {
            product_id:
              inventoryOffer.product_id,

            product_type:
              inventoryOffer.product_type,

            gauge_mm:
              gauge_mm ??
              inventoryOffer.gauge_mm ??
              null,

            price:
              stringPrice
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
            tension_lbs:
              tension_lbs
          },

          currency:
            inventoryOffer.currency,

          total:
            stringPrice +
            servicePrice,

          stock_status:
            inventoryOffer.stock_status,

          quantity:
            inventoryOffer.quantity
        };
      }
    )
    .filter(
      Boolean
    );
}


export default {
  buildStringingOffers
};
