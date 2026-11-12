// @ts-check

/**
 * @typedef {import("../generated/api").CartPaymentMethodsTransformRunInput} CartPaymentMethodsTransformRunInput
 * @typedef {import("../generated/api").CartPaymentMethodsTransformRunResult} CartPaymentMethodsTransformRunResult
 */

const NO_CHANGES = {operations: []};

const TAG_ECO = 'eco';
const TAG_SMARTPHONE = 'smartphones';

/** @param {string} value */
function normalize(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * @param {CartPaymentMethodsTransformRunInput} input
 * @returns {CartPaymentMethodsTransformRunResult}
 */
export function cartPaymentMethodsTransformRun(input) {
  const lines = input.cart?.lines ?? [];
  let hasEcoProduct = false;
  let hasSmartphoneProduct = false;

  for (const line of lines) {
    const tags = line.merchandise?.product?.hasTags ?? [];
    for (const tag of tags) {
      if (!tag.hasTag) continue;
      const normalizedTag = normalize(tag.tag);
      if (normalizedTag === TAG_ECO) hasEcoProduct = true;
      if (normalizedTag === TAG_SMARTPHONE) hasSmartphoneProduct = true;
    }
  }

  const isEcoOnly = hasEcoProduct && !hasSmartphoneProduct;
  const isSmartphoneOnly = hasSmartphoneProduct && !hasEcoProduct;

  const visiblePaymentMethods = {
    payfast: isEcoOnly,
    bankalfalah: isSmartphoneOnly,
    bankdeposit: true,
    yeylo: true,
    cod: true,
  };

  const methodKey = {
    payfast: 'payfast',
    'bankalfalah': 'bankalfalah',
    unumpay: 'bankalfalah',
    'bankdeposit': 'bankdeposit',
    yeylo: 'yeylo',
    jazzcash: 'yeylo',
    cod: 'cod',
    cashondelivery: 'cod',
  };

  const operations = [];
  for (const method of input.paymentMethods ?? []) {
    const key = methodKey[normalize(method.name)];
    if (key && !visiblePaymentMethods[key]) {
      operations.push({
        paymentMethodHide: {
          paymentMethodId: method.id,
        },
      });
    }
  }

  return operations.length ? {operations} : NO_CHANGES;
}
