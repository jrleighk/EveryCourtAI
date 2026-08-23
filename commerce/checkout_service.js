import {
  createOrder
} from "./order_service.js";


export function createOrderFromOffer(
  offer,
  {
    recommendation_context = null,
    customer = null,
    metadata = {}
  } = {}
) {

  if (
    !offer ||
    typeof offer !== "object"
  ) {
    throw new Error(
      "Checkout Service: valid offer is required."
    );
  }


  if (
    !offer?.store?.id
  ) {
    throw new Error(
      "Checkout Service: offer store is required."
    );
  }


  if (
    !offer?.product?.product_id
  ) {
    throw new Error(
      "Checkout Service: offer product is required."
    );
  }


  const items = [
    {
      type:
        "product",

      product_id:
        offer.product.product_id,

      product_type:
        offer.product.product_type,

      gauge_mm:
        offer.product.gauge_mm ??
        null,

      unit_price:
        Number(
          offer.product.price ??
          0
        ),

      total_price:
        Number(
          offer.product.price ??
          0
        )
    },

    {
      type:
        offer.service.service_type,

      service_id:
        offer.service.service_id,

      description:
        offer.service.name,

      tension_lbs:
        offer?.setup?.tension_lbs ??
        null,

      unit_price:
        Number(
          offer.service.price ??
          0
        ),

      total_price:
        Number(
          offer.service.price ??
          0
        )
    }
  ];


  return createOrder({
    store_id:
      offer.store.id,

    market:
      offer.store.country_code ??
      "GLOBAL",

    currency:
      offer.currency,

    items,

    recommendation_context,

    customer,

    metadata: {
      offer_type:
        offer.offer_type,

      ...metadata
    }
  });
}


export default {
  createOrderFromOffer
};
