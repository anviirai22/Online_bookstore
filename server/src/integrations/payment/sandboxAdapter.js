const crypto = require('node:crypto');
const { config } = require('../../config/env');

class SandboxPaymentAdapter {
  constructor(defaultMode = config.paymentSandboxMode) {
    this.defaultMode = defaultMode;
  }

  async authorize({ amountCents, idempotencyKey, mode }) {
    const outcome = mode || this.defaultMode;
    const gatewayReference = `sandbox_${crypto.createHash('sha256').update(`${idempotencyKey}:${amountCents}`).digest('hex').slice(0, 18)}`;
    if (outcome === 'failure') {
      return {
        status: 'FAILED',
        gatewayReference,
        failureCode: 'SANDBOX_DECLINED',
        failureMessage: 'The sandbox payment was declined. No money was charged.',
      };
    }
    if (outcome === 'pending') {
      return { status: 'PENDING', gatewayReference, failureCode: '', failureMessage: '' };
    }
    return { status: 'SUCCEEDED', gatewayReference, failureCode: '', failureMessage: '' };
  }
}

module.exports = SandboxPaymentAdapter;
