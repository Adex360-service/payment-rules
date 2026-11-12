const FUNCTION_HANDLE = 'payment-method-rules';
const CONFIG_NAMESPACE = '$app:payment-customization';
const CONFIG_KEY = 'function-configuration';

export const PAYMENT_METHODS = [
  {key: 'payfast', label: 'Payfast'},
  {key: 'bankalfalah', label: 'Bank Alfalah / UNumPay'},
  {key: 'bankdeposit', label: 'Bank Deposit'},
  {key: 'yeylo', label: 'Yeylo / JazzCash'},
  {key: 'cod', label: 'Cash on Delivery (COD)'},
] as const;

export const DEFAULT_RULES = {
  eco: {payfast: true, bankalfalah: false, bankdeposit: true, yeylo: true, cod: true},
  smartphone: {payfast: false, bankalfalah: true, bankdeposit: true, yeylo: true, cod: true},
  combined: {payfast: false, bankalfalah: false, bankdeposit: true, yeylo: true, cod: true},
};

export type PaymentRules = {
  eco: Record<string, boolean>;
  smartphone: Record<string, boolean>;
  combined: Record<string, boolean>;
};

async function gqlFetch(query: string, variables?: Record<string, unknown>) {
  const response = await fetch('shopify:admin/api/2026-10/graphql.json', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({query, variables}),
  });
  const json = await response.json();
  if (!response.ok || json.errors?.length) {
    throw new Error(json.errors?.map((error: {message: string}) => error.message).join('; ') ?? 'Shopify API request failed');
  }
  return json;
}

function parseRules(value: unknown): PaymentRules {
  const source = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return {
    eco: {...DEFAULT_RULES.eco, ...(source.eco as Record<string, boolean> ?? {})},
    smartphone: {...DEFAULT_RULES.smartphone, ...(source.smartphone as Record<string, boolean> ?? {})},
    combined: {...DEFAULT_RULES.combined, ...(source.combined as Record<string, boolean> ?? {})},
  };
}

async function getPaymentMethodRules() {
  const existing = await gqlFetch(`#graphql
    query PaymentCustomizations {
      paymentCustomizations(first: 25) {
        nodes {
          id
          enabled
          shopifyFunction { handle }
          metafield(namespace: "${CONFIG_NAMESPACE}", key: "${CONFIG_KEY}") {
            jsonValue
          }
        }
      }
    }`);

  return existing.data.paymentCustomizations.nodes.find(
    (customization: {shopifyFunction: {handle: string} | null}) => customization.shopifyFunction?.handle === FUNCTION_HANDLE,
  );
}

export async function getPaymentMethodRulesState() {
  const customization = await getPaymentMethodRules();
  return {
    id: customization?.id ?? null,
    enabled: Boolean(customization?.enabled),
    rules: parseRules(customization?.metafield?.jsonValue),
  };
}

export async function isPaymentMethodRulesEnabled(): Promise<boolean> {
  return (await getPaymentMethodRulesState()).enabled;
}

export async function savePaymentMethodRules(rules: PaymentRules): Promise<void> {
  const customization = await getPaymentMethodRules();
  const paymentCustomization = {
    title: 'Payment method rules by product tag',
    enabled: true,
    functionHandle: FUNCTION_HANDLE,
    metafields: [{
      namespace: CONFIG_NAMESPACE,
      key: CONFIG_KEY,
      type: 'json',
      value: JSON.stringify(parseRules(rules)),
    }],
  };

  const mutation = customization
    ? `mutation UpdatePaymentMethodRules($id: ID!, $input: PaymentCustomizationInput!) {
        paymentCustomizationUpdate(id: $id, paymentCustomization: $input) { userErrors { message } }
      }`
    : `mutation CreatePaymentMethodRules($input: PaymentCustomizationInput!) {
        paymentCustomizationCreate(paymentCustomization: $input) { userErrors { message } }
      }`;
  const variables = customization
    ? {id: customization.id, input: paymentCustomization}
    : {input: paymentCustomization};
  const json = await gqlFetch(mutation, variables);
  const payload = customization ? json.data.paymentCustomizationUpdate : json.data.paymentCustomizationCreate;
  if (payload.userErrors.length) throw new Error(payload.userErrors.map(({message}: {message: string}) => message).join('; '));
}

export async function enablePaymentMethodRules(): Promise<void> {
  const state = await getPaymentMethodRulesState();
  await savePaymentMethodRules(state.rules);
}
