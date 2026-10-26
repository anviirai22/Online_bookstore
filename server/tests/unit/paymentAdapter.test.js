const SandboxPaymentAdapter = require('../../src/integrations/payment/sandboxAdapter');

describe('sandbox payment adapter', () => {
  it('returns deterministic success, failure, and pending states', async () => {
    const adapter = new SandboxPaymentAdapter();
    const common = { amountCents: 1599, idempotencyKey: 'test-key' };
    expect((await adapter.authorize({ ...common, mode: 'success' })).status).toBe('SUCCEEDED');
    expect((await adapter.authorize({ ...common, mode: 'failure' })).status).toBe('FAILED');
    expect((await adapter.authorize({ ...common, mode: 'pending' })).status).toBe('PENDING');
  });

  it('uses the same gateway reference for the same idempotency input', async () => {
    const adapter = new SandboxPaymentAdapter();
    const input = { amountCents: 900, idempotencyKey: 'repeatable' };
    const first = await adapter.authorize(input);
    const second = await adapter.authorize(input);
    expect(first.gatewayReference).toBe(second.gatewayReference);
  });
});
