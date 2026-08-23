/**
 * ============================================================
 * EveryCourtAI
 * Commerce Demo UI V0.1
 * ============================================================
 *
 * Recommendation
 * → Store Offers
 * → Checkout
 *
 * V0.1:
 * Only renders nearby / available store offers.
 * ============================================================
 */

import {
  buildBrowserStringingOffers
} from "./commerce_client.js";


let currentRecommendation =
  null;


function safeNumber(
  value
) {

  const number =
    Number(
      value
    );

  return Number.isFinite(
    number
  )
    ? number
    : null;
}


function formatMoney(
  value,
  currency
) {

  const number =
    safeNumber(
      value
    );


  if (
    number === null
  ) {

    return "";
  }


  try {

    return new Intl.NumberFormat(
      undefined,
      {
        style:
          "currency",

        currency:
          currency ??
          "USD",

        maximumFractionDigits:
          2
      }
    ).format(
      number
    );

  } catch {

    return `${currency ?? ""} ${number}`;
  }
}


function clearOffers() {

  const offersElement =
    document.getElementById(
      "commerceOffers"
    );


  if (
    offersElement
  ) {

    offersElement.innerHTML =
      "";
  }
}


function renderEmptyState(
  message
) {

  const offersElement =
    document.getElementById(
      "commerceOffers"
    );


  if (
    !offersElement
  ) {

    return;
  }


  offersElement.innerHTML =
    "";


  const element =
    document.createElement(
      "div"
    );


  element.className =
    "commerce-offer-card";


  element.textContent =
    message;


  offersElement.appendChild(
    element
  );
}


function renderOffer(
  offer
) {

  const card =
    document.createElement(
      "div"
    );


  card.className =
    "commerce-offer-card";


  const title =
    document.createElement(
      "div"
    );


  title.className =
    "commerce-offer-title";


  title.textContent =
    offer?.store?.name ??
    "Tennis Store";


  const meta =
    document.createElement(
      "div"
    );


  meta.className =
    "commerce-offer-meta";


  const city =
    offer?.store?.city ??
    "";


  const stringId =
    offer
      ?.product
      ?.product_id ??
    "";


  const gauge =
    offer
      ?.product
      ?.gauge_mm;


  const tension =
    offer
      ?.setup
      ?.tension_lbs;


  meta.textContent =
    [
      city,
      stringId,
      gauge
        ? `${gauge} mm`
        : null,
      tension
        ? `${tension} lbs`
        : null,
      offer?.service?.name
    ]
      .filter(
        Boolean
      )
      .join(
        " · "
      );


  const price =
    document.createElement(
      "div"
    );


  price.className =
    "commerce-offer-price";


  price.textContent =
    formatMoney(
      offer.total,
      offer.currency
    );


  const button =
    document.createElement(
      "button"
    );


  button.type =
    "button";


  button.className =
    "commerce-offer-btn";


  button.textContent =
    "Select Store / 选择门店";


  button.addEventListener(
    "click",
    () => {

      window.dispatchEvent(
        new CustomEvent(
          "everycourt:commerce-offer-selected",
          {
            detail: {
              offer,
              recommendation:
                currentRecommendation
            }
          }
        )
      );
    }
  );


  card.appendChild(
    title
  );


  card.appendChild(
    meta
  );


  card.appendChild(
    price
  );


  card.appendChild(
    button
  );


  return card;
}


function renderOffers(
  offers
) {

  clearOffers();


  const offersElement =
    document.getElementById(
      "commerceOffers"
    );


  if (
    !offersElement
  ) {

    return;
  }


  if (
    !Array.isArray(
      offers
    ) ||
    offers.length ===
      0
  ) {

    renderEmptyState(
      "No matching store offers found. / 暂无匹配门店方案。"
    );

    return;
  }


  for (
    const offer
    of offers
  ) {

    offersElement.appendChild(
      renderOffer(
        offer
      )
    );
  }
}


function openCommercePanel() {

  const panel =
    document.getElementById(
      "commercePanel"
    );


  if (
    panel
  ) {

    panel.hidden =
      false;
  }
}


async function handleFindStores() {

  openCommercePanel();


  if (
    !currentRecommendation
  ) {

    renderEmptyState(
      "Run an equipment analysis first. / 请先完成装备分析。"
    );

    return;
  }


  const stringId =
    currentRecommendation
      ?.string_id;


  if (
    !stringId
  ) {

    renderEmptyState(
      "No recommended string is available. / 当前没有可查询的推荐球线。"
    );

    return;
  }


  try {

    const offers =
      await buildBrowserStringingOffers({
        string_id:
          stringId,

        gauge_mm:
          currentRecommendation
            ?.gauge_mm ??
          null,

        tension_lbs:
          currentRecommendation
            ?.tension_lbs ??
          null
      });


    renderOffers(
      offers
    );

  } catch (
    error
  ) {

    console.error(
      "EveryCourtAI Commerce Demo Error:",
      error
    );


    renderEmptyState(
      "Unable to load store offers. / 暂时无法加载门店方案。"
    );
  }
}


export function setCommerceRecommendation(
  recommendation
) {

  currentRecommendation =
    recommendation &&
    typeof recommendation ===
      "object"
      ? recommendation
      : null;


  const panel =
    document.getElementById(
      "commercePanel"
    );


  if (
    panel
  ) {

    panel.hidden =
      true;
  }


  clearOffers();
}



function renderCheckout(
  offer
) {

  const checkoutElement =
    document.getElementById(
      "commerceCheckout"
    );


  if (
    !checkoutElement ||
    !offer
  ) {

    return;
  }


  checkoutElement.hidden =
    false;


  checkoutElement.innerHTML =
    "";


  const wrapper =
    document.createElement(
      "div"
    );


  wrapper.className =
    "commerce-offer-card";


  const title =
    document.createElement(
      "div"
    );


  title.className =
    "commerce-offer-title";


  title.textContent =
    "Order Summary / 订单确认";


  const store =
    document.createElement(
      "div"
    );


  store.className =
    "commerce-offer-meta";


  store.textContent =
    `${offer?.store?.name ?? ""} · ${offer?.store?.city ?? ""}`;


  const setup =
    document.createElement(
      "div"
    );


  setup.className =
    "commerce-offer-meta";


  setup.textContent =
    [
      offer?.product?.product_id,
      offer?.product?.gauge_mm
        ? `${offer.product.gauge_mm} mm`
        : null,
      offer?.setup?.tension_lbs
        ? `${offer.setup.tension_lbs} lbs`
        : null,
      offer?.service?.name
    ]
      .filter(Boolean)
      .join(" · ");


  const price =
    document.createElement(
      "div"
    );


  price.className =
    "commerce-offer-price";


  price.textContent =
    formatMoney(
      offer.total,
      offer.currency
    );


  const payButton =
    document.createElement(
      "button"
    );


  payButton.type =
    "button";


  payButton.className =
    "commerce-offer-btn";


  payButton.id =
    "commerceDemoPayButton";


  payButton.textContent =
    "Demo Pay / 模拟付款";


  payButton.addEventListener(
    "click",
    () => {

      window.dispatchEvent(
        new CustomEvent(
          "everycourt:commerce-demo-pay",
          {
            detail: {
              offer,
              recommendation:
                currentRecommendation
            }
          }
        )
      );
    }
  );


  wrapper.appendChild(
    title
  );

  wrapper.appendChild(
    store
  );

  wrapper.appendChild(
    setup
  );

  wrapper.appendChild(
    price
  );

  wrapper.appendChild(
    payButton
  );


  checkoutElement.appendChild(
    wrapper
  );


  checkoutElement.scrollIntoView({
    behavior:
      "smooth",

    block:
      "nearest"
  });
}


function handleCommerceOfferSelected(
  event
) {

  const offer =
    event
      ?.detail
      ?.offer;


  if (
    !offer
  ) {

    return;
  }


  renderCheckout(
    offer
  );
}



function renderPaymentSuccess(
  offer
) {

  const checkoutElement =
    document.getElementById(
      "commerceCheckout"
    );


  if (
    !checkoutElement ||
    !offer
  ) {

    return;
  }


  const voucherToken =
    `ECA-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)
      .toUpperCase()}`;


  checkoutElement.innerHTML =
    "";


  const card =
    document.createElement(
      "div"
    );


  card.className =
    "commerce-offer-card";


  const title =
    document.createElement(
      "div"
    );


  title.className =
    "commerce-offer-title";


  title.textContent =
    "Payment Successful / 支付成功";


  const store =
    document.createElement(
      "div"
    );


  store.className =
    "commerce-offer-meta";


  store.textContent =
    `${offer?.store?.name ?? ""} · ${offer?.store?.city ?? ""}`;


  const setup =
    document.createElement(
      "div"
    );


  setup.className =
    "commerce-offer-meta";


  setup.textContent =
    [
      offer?.product?.product_id,
      offer?.product?.gauge_mm
        ? `${offer.product.gauge_mm} mm`
        : null,
      offer?.setup?.tension_lbs
        ? `${offer.setup.tension_lbs} lbs`
        : null,
      offer?.service?.name
    ]
      .filter(Boolean)
      .join(" · ");


  const price =
    document.createElement(
      "div"
    );


  price.className =
    "commerce-offer-price";


  price.textContent =
    formatMoney(
      offer.total,
      offer.currency
    );


  const voucher =
    document.createElement(
      "div"
    );


  voucher.className =
    "commerce-offer-card";


  voucher.style.marginTop =
    "12px";


  voucher.innerHTML =
    `
      <div class="commerce-kicker">
        QR Voucher / 核销凭证
      </div>

      <div
        style="
          margin-top:10px;
          font-size:12px;
          word-break:break-all;
        "
      >
        ${voucherToken}
      </div>

      <div
        class="commerce-offer-meta"
        style="margin-top:10px;"
      >
        Show this voucher at the store.
        / 到店出示此核销凭证。
      </div>
    `;


  card.appendChild(
    title
  );

  card.appendChild(
    store
  );

  card.appendChild(
    setup
  );

  card.appendChild(
    price
  );


  checkoutElement.appendChild(
    card
  );

  checkoutElement.appendChild(
    voucher
  );
}


function handleCommerceDemoPay(
  event
) {

  const offer =
    event
      ?.detail
      ?.offer;


  if (
    !offer
  ) {

    return;
  }


  renderPaymentSuccess(
    offer
  );
}


export function initializeCommerceDemo() {

  const button =
    document.getElementById(
      "findNearbyStoreButton"
    );


  if (
    !button
  ) {

    return {
      success:
        false
    };
  }


  button.addEventListener(
    "click",
    handleFindStores
  );


  window.addEventListener(
    "everycourt:commerce-offer-selected",
    handleCommerceOfferSelected
  );


  window.addEventListener(
    "everycourt:commerce-demo-pay",
    handleCommerceDemoPay
  );


  console.log(
    "EveryCourtAI Commerce Demo V0.1 connected."
  );


  return {
    success:
      true,

    version:
      "0.1"
  };
}


if (
  document.readyState ===
    "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initializeCommerceDemo
  );

} else {

  initializeCommerceDemo();
}


window.EveryCourtCommerceDemo = {
  initializeCommerceDemo,
  setCommerceRecommendation
};
