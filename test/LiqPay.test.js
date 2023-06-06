const LiqPay = require('../classes/LiqPay');

describe('LiqPay', () => {
  let liqPay;
  const params = {
    amount: 100,
    action: 'pay',
    description: 'Pay description',
    order_id: 'order1'
  };

  beforeEach(() => {
    liqPay = new LiqPay({
      publicKey: 'yourPublicKey',
      privateKey: 'yourPrivateKey',
      language: 'ru',
      currency: 'UAH',
      version: 3
    });
  });

  test('should create an instance of LiqPay', () => {
    expect(liqPay).toBeInstanceOf(LiqPay);
  });

  test('should return checkout link', () => {
    const link = liqPay.checkoutLink(params);
    expect(link).toContain('https://www.liqpay.ua/api/3/checkout');
    expect(link).toContain('data=');
    expect(link).toContain('signature=');
  });

  test('should return checkout form', () => {
    const form = liqPay.checkoutForm(params);
    expect(form).toContain('https://www.liqpay.ua/api/3/checkout');
    expect(form).toContain('input type="hidden" name="data"');
    expect(form).toContain('input type="hidden" name="signature"');
  });
});
