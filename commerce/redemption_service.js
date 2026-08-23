/**
 * ============================================================
 * EveryCourtAI
 * Redemption Service V0.1
 * ============================================================
 *
 * Responsibilities:
 *
 * 1. Create redeemable vouchers for paid orders
 * 2. Generate unique voucher tokens
 * 3. Validate voucher / order relationships
 * 4. Redeem vouchers
 * 5. Prevent duplicate redemption
 *
 * ============================================================
 */

import {
  markOrderRedeemed
} from "./order_service.js";


const REDEMPTION_SERVICE_VERSION =
  "0.1";


const VOUCHER_STATUS = {
  ACTIVE:
    "active",

  REDEEMED:
    "redeemed",

  CANCELLED:
    "cancelled",

  EXPIRED:
    "expired"
};


function nowIso() {

  return new Date()
    .toISOString();
}


function generateVoucherId() {

  const timestamp =
    Date.now()
      .toString();

  const random =
    Math.random()
      .toString(36)
      .slice(2, 8)
      .toUpperCase();


  return (
    `VCH-${timestamp}-${random}`
  );
}


function generateVoucherToken() {

  const partA =
    Math.random()
      .toString(36)
      .slice(2, 10)
      .toUpperCase();

  const partB =
    Math.random()
      .toString(36)
      .slice(2, 10)
      .toUpperCase();

  const partC =
    Date.now()
      .toString(36)
      .toUpperCase();


  return (
    `${partA}-${partB}-${partC}`
  );
}


function validateOrderForVoucher(
  order
) {

  if (
    !order ||
    typeof order !== "object"
  ) {

    throw new Error(
      "Redemption Service: valid order is required."
    );
  }


  if (
    !order.order_id
  ) {

    throw new Error(
      "Redemption Service: order_id is required."
    );
  }


  if (
    order.status !==
      "ready_for_redeem"
  ) {

    throw new Error(
      `Redemption Service: order ${order.order_id} is not ready for redemption.`
    );
  }


  if (
    order?.payment?.status !==
      "paid"
  ) {

    throw new Error(
      "Redemption Service: order payment must be paid."
    );
  }
}


export function createVoucher(
  order,
  {
    expires_at =
      null,

    metadata =
      {}
  } = {}
) {

  validateOrderForVoucher(
    order
  );


  const timestamp =
    nowIso();


  return {
    voucher_id:
      generateVoucherId(),

    version:
      REDEMPTION_SERVICE_VERSION,

    voucher_token:
      generateVoucherToken(),

    order_id:
      order.order_id,

    store_id:
      order.store_id,

    market:
      order.market ??
      "GLOBAL",

    status:
      VOUCHER_STATUS.ACTIVE,

    expires_at,

    redeemed_at:
      null,

    redeemed_by:
      null,

    metadata: {
      ...metadata
    },

    created_at:
      timestamp,

    updated_at:
      timestamp
  };
}


export function redeemVoucher(
  voucher,
  order,
  {
    redeemed_by =
      "merchant_demo"
  } = {}
) {

  if (
    !voucher ||
    typeof voucher !== "object"
  ) {

    throw new Error(
      "Redemption Service: valid voucher is required."
    );
  }


  validateOrderForVoucher(
    order
  );


  if (
    voucher.order_id !==
      order.order_id
  ) {

    throw new Error(
      "Redemption Service: voucher and order do not match."
    );
  }


  if (
    voucher.store_id !==
      order.store_id
  ) {

    throw new Error(
      "Redemption Service: voucher store does not match order store."
    );
  }


  if (
    voucher.status !==
      VOUCHER_STATUS.ACTIVE
  ) {

    throw new Error(
      "Redemption Service: voucher is not active."
    );
  }


  if (
    voucher.expires_at &&
    new Date(
      voucher.expires_at
    ).getTime() <
    Date.now()
  ) {

    throw new Error(
      "Redemption Service: voucher has expired."
    );
  }


  const timestamp =
    nowIso();


  const redeemedVoucher = {
    ...voucher,

    status:
      VOUCHER_STATUS.REDEEMED,

    redeemed_at:
      timestamp,

    redeemed_by,

    updated_at:
      timestamp
  };


  const redeemedOrder =
    markOrderRedeemed(
      order,
      {
        redeemed_by
      }
    );


  return {
    voucher:
      redeemedVoucher,

    order:
      redeemedOrder
  };
}


export function cancelVoucher(
  voucher
) {

  if (
    !voucher ||
    typeof voucher !== "object"
  ) {

    throw new Error(
      "Redemption Service: valid voucher is required."
    );
  }


  if (
    voucher.status ===
      VOUCHER_STATUS.REDEEMED
  ) {

    throw new Error(
      "Redemption Service: redeemed voucher cannot be cancelled."
    );
  }


  return {
    ...voucher,

    status:
      VOUCHER_STATUS.CANCELLED,

    updated_at:
      nowIso()
  };
}


export function getRedemptionServiceInfo() {

  return {
    service:
      "EveryCourtAI Redemption Service",

    version:
      REDEMPTION_SERVICE_VERSION,

    statuses: {
      ...VOUCHER_STATUS
    }
  };
}


export {
  VOUCHER_STATUS
};


export default {
  createVoucher,
  redeemVoucher,
  cancelVoucher,
  getRedemptionServiceInfo,
  VOUCHER_STATUS
};
