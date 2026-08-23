/**
 * ============================================================
 * EveryCourtAI
 * Payment Service V0.1
 * ============================================================
 *
 * Responsibilities:
 *
 * 1. Create payment records for commerce orders
 * 2. Track payment lifecycle
 * 3. Support provider-neutral payment architecture
 * 4. Mark orders paid after successful payment
 * 5. Prepare architecture for future payment providers
 *
 * Current V0.1 providers:
 *
 * - demo
 *
 * Future providers may include:
 *
 * - Stripe
 * - Alipay
 * - WeChat Pay
 * - PayNow
 * - other regional payment providers
 *
 * ============================================================
 */


import {
  markOrderPaid
} from "./order_service.js";


const PAYMENT_SERVICE_VERSION =
  "0.1";


const PAYMENT_STATUSES = {
  PENDING:
    "pending",

  PROCESSING:
    "processing",

  PAID:
    "paid",

  FAILED:
    "failed",

  CANCELLED:
    "cancelled",

  REFUNDED:
    "refunded"
};


function nowIso() {

  return new Date()
    .toISOString();
}


function generatePaymentId() {

  const timestamp =
    Date.now()
      .toString();

  const random =
    Math.random()
      .toString(36)
      .slice(2, 8)
      .toUpperCase();


  return (
    `PAY-${timestamp}-${random}`
  );
}


function cloneObject(
  value
) {

  return JSON.parse(
    JSON.stringify(
      value
    )
  );
}


function validateOrder(
  order
) {

  if (
    !order ||
    typeof order !== "object"
  ) {

    throw new Error(
      "Payment Service: valid order is required."
    );
  }


  if (
    !order.order_id
  ) {

    throw new Error(
      "Payment Service: order_id is required."
    );
  }


  if (
    !Number.isFinite(
      Number(
        order.total
      )
    ) ||
    Number(
      order.total
    ) < 0
  ) {

    throw new Error(
      "Payment Service: valid order total is required."
    );
  }


  if (
    !order.currency
  ) {

    throw new Error(
      "Payment Service: order currency is required."
    );
  }
}


export function createPayment(
  order,
  {
    provider =
      "demo",

    method =
      "demo_payment",

    metadata =
      {}
  } = {}
) {

  validateOrder(
    order
  );


  if (
    order.status !==
      "pending_payment"
  ) {

    throw new Error(
      `Payment Service: order ${order.order_id} is not pending payment.`
    );
  }


  const timestamp =
    nowIso();


  return {
    payment_id:
      generatePaymentId(),

    version:
      PAYMENT_SERVICE_VERSION,

    order_id:
      order.order_id,

    store_id:
      order.store_id,

    market:
      order.market ??
      "GLOBAL",

    provider,

    method,

    amount:
      Number(
        order.total
      ),

    currency:
      order.currency,

    status:
      PAYMENT_STATUSES.PENDING,

    provider_reference:
      null,

    failure_reason:
      null,

    metadata:
      {
        ...metadata
      },

    created_at:
      timestamp,

    updated_at:
      timestamp,

    paid_at:
      null,

    failed_at:
      null,

    cancelled_at:
      null,

    refunded_at:
      null
  };
}


export function markPaymentProcessing(
  payment,
  {
    provider_reference =
      null
  } = {}
) {

  if (
    !payment ||
    typeof payment !== "object"
  ) {

    throw new Error(
      "Payment Service: valid payment is required."
    );
  }


  if (
    payment.status !==
      PAYMENT_STATUSES.PENDING
  ) {

    throw new Error(
      "Payment Service: only pending payments can enter processing."
    );
  }


  return {
    ...cloneObject(
      payment
    ),

    status:
      PAYMENT_STATUSES.PROCESSING,

    provider_reference:
      provider_reference ??
      payment.provider_reference ??
      null,

    updated_at:
      nowIso()
  };
}


export function markPaymentSucceeded(
  payment,
  order,
  {
    provider_reference =
      null
  } = {}
) {

  if (
    !payment ||
    typeof payment !== "object"
  ) {

    throw new Error(
      "Payment Service: valid payment is required."
    );
  }


  validateOrder(
    order
  );


  if (
    payment.order_id !==
      order.order_id
  ) {

    throw new Error(
      "Payment Service: payment and order do not match."
    );
  }


  if (
    payment.status !==
      PAYMENT_STATUSES.PENDING &&
    payment.status !==
      PAYMENT_STATUSES.PROCESSING
  ) {

    throw new Error(
      "Payment Service: payment cannot be marked paid from its current status."
    );
  }


  const timestamp =
    nowIso();


  const paidPayment = {
    ...cloneObject(
      payment
    ),

    status:
      PAYMENT_STATUSES.PAID,

    provider_reference:
      provider_reference ??
      payment.provider_reference ??
      null,

    paid_at:
      timestamp,

    updated_at:
      timestamp
  };


  const paidOrder =
    markOrderPaid(
      order,
      {
        provider:
          payment.provider,

        payment_id:
          paidPayment.payment_id,

        provider_reference:
          paidPayment.provider_reference
      }
    );


  return {
    payment:
      paidPayment,

    order:
      paidOrder
  };
}


export function markPaymentFailed(
  payment,
  {
    reason =
      "payment_failed"
  } = {}
) {

  if (
    !payment ||
    typeof payment !== "object"
  ) {

    throw new Error(
      "Payment Service: valid payment is required."
    );
  }


  if (
    payment.status ===
      PAYMENT_STATUSES.PAID
  ) {

    throw new Error(
      "Payment Service: paid payment cannot be marked failed."
    );
  }


  const timestamp =
    nowIso();


  return {
    ...cloneObject(
      payment
    ),

    status:
      PAYMENT_STATUSES.FAILED,

    failure_reason:
      reason,

    failed_at:
      timestamp,

    updated_at:
      timestamp
  };
}


export function cancelPayment(
  payment
) {

  if (
    !payment ||
    typeof payment !== "object"
  ) {

    throw new Error(
      "Payment Service: valid payment is required."
    );
  }


  if (
    payment.status ===
      PAYMENT_STATUSES.PAID
  ) {

    throw new Error(
      "Payment Service: paid payment cannot be cancelled."
    );
  }


  const timestamp =
    nowIso();


  return {
    ...cloneObject(
      payment
    ),

    status:
      PAYMENT_STATUSES.CANCELLED,

    cancelled_at:
      timestamp,

    updated_at:
      timestamp
  };
}


export function getPaymentServiceInfo() {

  return {
    service:
      "EveryCourtAI Payment Service",

    version:
      PAYMENT_SERVICE_VERSION,

    supported_providers: [
      "demo"
    ],

    statuses:
      {
        ...PAYMENT_STATUSES
      }
  };
}


export {
  PAYMENT_STATUSES
};


export default {
  createPayment,
  markPaymentProcessing,
  markPaymentSucceeded,
  markPaymentFailed,
  cancelPayment,
  getPaymentServiceInfo,
  PAYMENT_STATUSES
};
