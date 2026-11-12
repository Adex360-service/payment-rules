import {useEffect, useState} from 'preact/hooks';
import {
  enablePaymentMethodRules,
  isPaymentMethodRulesEnabled,
} from '../../../../shared/models/paymentCustomization';

export default function SettingsPage() {
  const [status, setStatus] = useState('checking');
  const [error, setError] = useState(null);

  useEffect(() => {
    isPaymentMethodRulesEnabled()
      .then((enabled) => setStatus(enabled ? 'enabled' : 'idle'))
      .catch(() => {
        setError('Failed to check payment method rules status');
        setStatus('idle');
      });
  }, []);

  const enableRules = async () => {
    setStatus('saving');
    setError(null);
    try {
      await enablePaymentMethodRules();
      setStatus('enabled');
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Failed to enable payment method rules',
      );
      setStatus('idle');
    }
  };

  return (
    <s-page heading="Payment method rules" inlineSize="large">
      <s-section>
        <s-heading>Conditional payment visibility</s-heading>
        <s-paragraph>
          Payment methods are evaluated on the complete cart at checkout and update automatically when cart contents change.
        </s-paragraph>
        {error && <s-banner tone="critical">{error}</s-banner>}
        {status === 'enabled' && <s-banner tone="success">Payment method rules are enabled.</s-banner>}
        <s-button
          onClick={enableRules}
          loading={status === 'saving'}
          disabled={status === 'checking' || status === 'enabled'}
        >
          {status === 'enabled' ? 'Payment method rules enabled' : 'Enable payment method rules'}
        </s-button>
      </s-section>
      <s-section heading="Plan">
        <s-heading>Free plan</s-heading>
        <s-paragraph>$0 per month · Up to 100 orders per month · No per-order charges</s-paragraph>
        <s-paragraph>
          Payment rules are available while the store remains within the monthly order allowance.
        </s-paragraph>
      </s-section>
      <s-section heading="Configured providers">
        <s-paragraph>
          UNumPay is used as the Bank Alfalah rule. JazzCash is used as the Yeylo rule.
        </s-paragraph>
        <s-table>
          <s-table-header-row>
            <s-table-header listSlot="primary">Provider</s-table-header>
            <s-table-header>Rule name</s-table-header>
            <s-table-header>Behavior</s-table-header>
          </s-table-header-row>
          <s-table-body>
            <s-table-row>
              <s-table-cell>Payfast</s-table-cell>
              <s-table-cell>Payfast</s-table-cell>
              <s-table-cell>Eco products only</s-table-cell>
            </s-table-row>
            <s-table-row>
              <s-table-cell>UNumPay</s-table-cell>
              <s-table-cell>Bank Alfalah</s-table-cell>
              <s-table-cell>Smartphone products only</s-table-cell>
            </s-table-row>
            <s-table-row>
              <s-table-cell>JazzCash</s-table-cell>
              <s-table-cell>Yeylo</s-table-cell>
              <s-table-cell>Always visible</s-table-cell>
            </s-table-row>
            <s-table-row>
              <s-table-cell>Bank Deposit</s-table-cell>
              <s-table-cell>Bank Deposit</s-table-cell>
              <s-table-cell>Always visible</s-table-cell>
            </s-table-row>
            <s-table-row>
              <s-table-cell>Cash on Delivery (COD)</s-table-cell>
              <s-table-cell>COD</s-table-cell>
              <s-table-cell>Always visible</s-table-cell>
            </s-table-row>
          </s-table-body>
        </s-table>
      </s-section>
      <s-section heading="Cart rules">
        <s-table>
          <s-table-header-row>
            <s-table-header listSlot="primary">Cart tags</s-table-header>
            <s-table-header>Visible methods</s-table-header>
            <s-table-header>Hidden methods</s-table-header>
          </s-table-header-row>
          <s-table-body>
            <s-table-row>
              <s-table-cell>Eco</s-table-cell>
              <s-table-cell>Payfast, Bank Deposit, JazzCash, COD</s-table-cell>
              <s-table-cell>UNumPay</s-table-cell>
            </s-table-row>
            <s-table-row>
              <s-table-cell>smartphones</s-table-cell>
              <s-table-cell>UNumPay, Bank Deposit, JazzCash, COD</s-table-cell>
              <s-table-cell>Payfast</s-table-cell>
            </s-table-row>
            <s-table-row>
              <s-table-cell>Eco + smartphones</s-table-cell>
              <s-table-cell>Bank Deposit, JazzCash, COD</s-table-cell>
              <s-table-cell>Payfast, UNumPay</s-table-cell>
            </s-table-row>
          </s-table-body>
        </s-table>
      </s-section>
    </s-page>
  );
}
