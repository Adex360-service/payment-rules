# PaymentModifier

PaymentModifier is a Shopify app that conditionally hides checkout payment methods based on product tags in the complete cart.

## Rules

| Cart tags | Visible methods | Hidden methods |
| --- | --- | --- |
| `Eco` | Payfast, Bank Deposit, JazzCash, COD | UNumPay |
| `smartphones` | UNumPay, Bank Deposit, JazzCash, COD | Payfast |
| `Eco` + `smartphones` | Bank Deposit, JazzCash, COD | Payfast, UNumPay |

Products without either tag do not activate an exclusive payment method. Bank Deposit, JazzCash, and Cash on Delivery remain visible.

The payment logic runs in a Shopify Payment Customization Function using the `cart.payment-methods.transform.run` target. It evaluates all cart lines whenever checkout recalculates payment methods.

## Development

```shell
npm install
npm run build
npm run dev
```

## Vercel deployment

The repository includes a Vercel health endpoint at `/api/health`. Deploy it from the project root:

```shell
npx vercel
npx vercel --prod
```

After deployment, verify `https://YOUR-VERCEL-DOMAIN/api/health` returns `{ "ok": true }`. Use that production domain when configuring `application_url` and Shopify webhook endpoints.

After installing the app, open the app landing page and select **Enable payment method rules**. The app requires `read_payment_customizations` and `write_payment_customizations` scopes.

## Pricing

The app has one free plan: $0 per month with no per-order charge and no paid plan.

For public distribution, configure a single free plan in the Shopify Partner Dashboard under App Pricing before submitting the app for review.
