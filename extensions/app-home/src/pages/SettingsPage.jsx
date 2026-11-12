import {useEffect, useState} from 'preact/hooks';
import {
  DEFAULT_RULES,
  PAYMENT_METHODS,
  getPaymentMethodRulesState,
  savePaymentMethodRules,
} from '../../../../shared/models/paymentCustomization';

const SCENARIOS = [
  {key: 'eco', title: 'Eco products only', tag: 'Eco'},
  {key: 'smartphone', title: 'Smartphone products only', tag: 'smartphones'},
  {key: 'combined', title: 'Both product categories', tag: 'Eco + smartphones'},
];

function checkedValue(event) {
  return Boolean(event.currentTarget?.checked ?? event.target?.checked);
}

export default function SettingsPage() {
  const [status, setStatus] = useState('checking');
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [error, setError] = useState(null);

  useEffect(() => {
    getPaymentMethodRulesState()
      .then((state) => {
        setRules(state.rules);
        setStatus(state.enabled ? 'enabled' : 'idle');
      })
      .catch(() => {
        setError('Failed to load payment method rules');
        setStatus('idle');
      });
  }, []);

  const updateRule = (scenario, method, visible) => {
    setRules((current) => ({
      ...current,
      [scenario]: {...current[scenario], [method]: visible},
    }));
    setStatus('unsaved');
  };

  const saveRules = async () => {
    setStatus('saving');
    setError(null);
    try {
      await savePaymentMethodRules(rules);
      setStatus('enabled');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to save payment method rules');
      setStatus('unsaved');
    }
  };

  return (
    <s-page heading="Payment method rules" inlineSize="large">
      <s-section>
        <s-heading>Conditional payment visibility</s-heading>
        <s-paragraph>
          Choose which payment methods are shown for each product-tag combination. Changes apply automatically at checkout.
        </s-paragraph>
        {error && <s-banner tone="critical">{error}</s-banner>}
        {status === 'enabled' && <s-banner tone="success">Payment method rules are saved and enabled.</s-banner>}
        {status === 'unsaved' && <s-banner tone="warning">You have unsaved rule changes.</s-banner>}
        <s-button onClick={saveRules} loading={status === 'saving'} disabled={status === 'checking'}>
          {status === 'saving' ? 'Saving rules' : 'Save payment method rules'}
        </s-button>
      </s-section>

      <s-section heading="Product tag rules">
        <s-paragraph>
          The app evaluates the entire cart. The supported product tags are <strong>Eco</strong> and <strong>smartphones</strong>.
        </s-paragraph>
        {SCENARIOS.map((scenario) => (
          <s-section key={scenario.key} heading={scenario.title}>
            <s-paragraph>Applied when the cart contains: {scenario.tag}</s-paragraph>
            {PAYMENT_METHODS.map((method) => (
              <s-checkbox
                key={method.key}
                checked={Boolean(rules[scenario.key]?.[method.key])}
                onChange={(event) => updateRule(scenario.key, method.key, checkedValue(event))}
              >
                Show {method.label}
              </s-checkbox>
            ))}
          </s-section>
        ))}
      </s-section>

      <s-section heading="Plan">
        <s-heading>Free plan</s-heading>
        <s-paragraph>$0 per month · No per-order charges</s-paragraph>
        <s-paragraph>Payment method rules are included without an order-based limit.</s-paragraph>
      </s-section>
    </s-page>
  );
}
