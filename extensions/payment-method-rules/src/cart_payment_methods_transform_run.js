// @ts-check

/**
 * @typedef {import("../generated/api").CartPaymentMethodsTransformRunInput} CartPaymentMethodsTransformRunInput
 * @typedef {import("../generated/api").CartPaymentMethodsTransformRunResult} CartPaymentMethodsTransformRunResult
 */

const NO_CHANGES = {operations: []};

const TAG_ECO = 'eco';
const TAG_SMARTPHONE = 'smartphones';

const DEFAULT_RULES = {
  eco: {payfast: true, bankalfalah: false, bankdeposit: true, yeylo: true, cod: true},
  smartphone: {payfast: false, bankalfalah: true, bankdeposit: true, yeylo: true, cod: true},
  combined: {payfast: false, bankalfalah: false, bankdeposit: true, yeylo: true, cod: true},
};

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
  const isCombined = hasEcoProduct && hasSmartphoneProduct;

  if (!isEcoOnly && !isSmartphoneOnly && !isCombined) return NO_CHANGES;

  const configuredRules = input.paymentCustomization?.metafield?.jsonValue;
  const rules = configuredRules && typeof configuredRules === 'object' ? configuredRules : DEFAULT_RULES;
  const visiblePaymentMethods = isCombined
    ? {...DEFAULT_RULES.combined, ...(rules.combined ?? {})}
    : isEcoOnly
      ? {...DEFAULT_RULES.eco, ...(rules.eco ?? {})}
      : {...DEFAULT_RULES.smartphone, ...(rules.smartphone ?? {})};

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
