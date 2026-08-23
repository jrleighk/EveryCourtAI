/**
 * ============================================================
 * EveryCourtAI
 * Commerce Layer
 * Order Service V0.1
 * ============================================================
 */

export const ORDER_STATUS = {
  PENDING_PAYMENT: "pending_payment",
  PAID: "paid",
  READY_FOR_REDEEM: "ready_for_redeem",
  REDEEMED: "redeemed",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
  EXPIRED: "expired"
};

function createOrderId() {
  const timestamp =
    Date.now()
      .toString()
      .slice(-10);

  const random =
    Math.random()
      .toString(36)
      .slice(2, 7)
      .toUpperCase();

  return `ECA-SG-${timestamp}-${random}`;
}

function nowIso() {
  return new Date()
    .toISOString();
}

export function createOrder({
  store_id,
  market = "GLOBAL",
  currency = "USD",
  items = [],
  recommendation_context = null,
  customer = null,
  metadata = {}
} = {}) {

  if (!store_id) {
    throw new Error(
      "Commerce Order: store_id is required."
    );
  }

  if (
    !Array.isArray(items) ||
    items.length === 0
  ) {
    throw new Error(
      "Commerce Order: at least one item is required."
    );
  }

  const subtotal =
    items.reduce(
      (sum, item) =>
        sum +
        Number(
          item?.total_price ??
          item?.unit_price ??
          0
        ),
      0
    );

  return {
    order_id:
      createOrderId(),

    version:
      "0.1",

    market,

    currency,

    store_id,

    status:
      ORDER_STATUS.PENDING_PAYMENT,

    items,

    subtotal,

    total:
      subtotal,

    recommendation_context,

    customer,

    payment: {
      provider:
        "demo",

      status:
        "unpaid",

      paid_at:
        null
    },

    redemption: {
      status:
        "not_ready",

      redeemed_at:
        null,

      redeemed_by:
        null
    },

    settlement: {
      status:
        "not_ready"
    },

    metadata,

    created_at:
      nowIso(),

    updated_at:
      nowIso()
  };
}

export function markOrderPaid(
  order
) {

  if (
    !order ||
    typeof order !== "object"
  ) {
    throw new Error(
      "Commerce Order: invalid order."
    );
  }

  if (
    order.status !==
    ORDER_STATUS.PENDING_PAYMENT
  ) {
    throw new Error(
      `Commerce Order: cannot pay order in status ${order.status}.`
    );
  }

  const paidAt =
    nowIso();

  return {
    ...order,

    status:
      ORDER_STATUS.READY_FOR_REDEEM,

    payment: {
      ...order.payment,

      provider:
        order?.payment?.provider ??
        "demo",

      status:
        "paid",

      paid_at:
        paidAt
    },

    redemption: {
      ...order.redemption,

      status:
        "ready"
    },

    updated_at:
      paidAt
  };
}

export function markOrderRedeemed(
  order,
  {
    redeemed_by = "merchant_demo"
  } = {}
) {

  if (
    order?.status !==
    ORDER_STATUS.READY_FOR_REDEEM
  ) {
    throw new Error(
      "Commerce Order: order is not ready for redemption."
    );
  }

  const redeemedAt =
    nowIso();

  return {
    ...order,

    status:
      ORDER_STATUS.REDEEMED,

    redemption: {
      ...order.redemption,

      status:
        "redeemed",

      redeemed_at:
        redeemedAt,

      redeemed_by
    },

    settlement: {
      ...order.settlement,

      status:
        "pending"
    },

    updated_at:
      redeemedAt
  };
}

export default {
  ORDER_STATUS,
  createOrder,
  markOrderPaid,
  markOrderRedeemed
};
