import test from 'node:test';
import assert from 'node:assert/strict';
import {cartPaymentMethodsTransformRun} from '../src/cart_payment_methods_transform_run.js';

const paymentMethods = [
  {id: 'payfast', name: 'Payfast'},
  {id: 'alfalah', name: 'UNumPay'},
  {id: 'deposit', name: 'Bank Deposit'},
  {id: 'yeylo', name: 'JazzCash'},
  {id: 'cod', name: 'Cash on Delivery (COD)'},
];

function line(...tags) {
  return {
    merchandise: {
      product: {
        hasTags: tags.map((tag) => ({tag, hasTag: true})),
      },
    },
  };
}

function hiddenIds(lines) {
  const result = cartPaymentMethodsTransformRun({
    cart: {lines},
    paymentMethods,
  });
  return result.operations
    .map(({paymentMethodHide}) => paymentMethodHide.paymentMethodId)
    .sort();
}

function hiddenIdsWithRules(lines, rules) {
  const result = cartPaymentMethodsTransformRun({
    cart: {lines},
    paymentMethods,
    paymentCustomization: {metafield: {jsonValue: rules}},
  });
  return result.operations
    .map(({paymentMethodHide}) => paymentMethodHide.paymentMethodId)
    .sort();
}

test('shows Payfast and hides Bank Alfalah for eco-only carts', () => {
  assert.deepEqual(hiddenIds([line('Eco')]), ['alfalah']);
});

test('shows Bank Alfalah and hides Payfast for smartphone-only carts', () => {
  assert.deepEqual(hiddenIds([line('smartphones')]), ['payfast']);
});

test('hides both exclusive methods for combined carts', () => {
  assert.deepEqual(hiddenIds([line('Eco'), line('smartphones')]), ['alfalah', 'payfast']);
});

test('does not classify untagged or empty carts as either category', () => {
  assert.deepEqual(hiddenIds([line('other')]), []);
  assert.deepEqual(hiddenIds([]), []);
});

test('uses saved visibility rules for a cart scenario', () => {
  assert.deepEqual(hiddenIdsWithRules([line('Eco')], {
    eco: {payfast: false, bankalfalah: true, bankdeposit: true, yeylo: true, cod: true},
  }), ['payfast']);
});
