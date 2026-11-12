const FUNCTION_HANDLE = "payment-method-rules";

async function gqlFetch(query: string, variables?: Record<string, unknown>) {
  const response = await fetch("shopify:admin/api/2026-10/graphql.json", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const json = await response.json();
  if (!response.ok || json.errors?.length) {
    throw new Error(json.errors?.map((error: { message: string }) => error.message).join("; ") ?? "Shopify API request failed");
  }
  return json;
}

async function getPaymentMethodRules() {
  const existing = await gqlFetch(
    `#graphql
    query PaymentCustomizations {
      paymentCustomizations(first: 25) {
        nodes {
          id
          enabled
          shopifyFunction { handle }
        }
      }
    }`,
  );

  return existing.data.paymentCustomizations.nodes.find(
    (customization: { shopifyFunction: { handle: string } | null }) =>
      customization.shopifyFunction?.handle === FUNCTION_HANDLE,
  );
}

export async function isPaymentMethodRulesEnabled(): Promise<boolean> {
  return Boolean((await getPaymentMethodRules())?.enabled);
}

export async function enablePaymentMethodRules(): Promise<void> {
  const alreadyConfigured = await getPaymentMethodRules();
  if (alreadyConfigured) return;

  const json = await gqlFetch(
    `#graphql
    mutation EnablePaymentMethodRules {
      paymentCustomizationCreate(paymentCustomization: {
        title: "Payment method rules by product tag"
        enabled: true
        functionHandle: "${FUNCTION_HANDLE}"
      }) {
        paymentCustomization { id }
        userErrors { message }
      }
    }`,
  );
  const errors = json.data.paymentCustomizationCreate.userErrors;
  if (errors.length) throw new Error(errors.map(({ message }: { message: string }) => message).join("; "));
}
