const LiqPay = require('../LiqPay');

describe('LiqPay', () => {
  let liqPay;
  const publicKey = 'testPublicKey';
  const privateKey = 'testPrivateKey';
  const language = 'en';
  const currency = 'USD';
  const version = 3;

  const params = { order_id: '1', action: 'pay', amount: 100, description: 'Test Description' };

  beforeEach(() => {
    liqPay = new LiqPay({
      publicKey,
      privateKey,
      language,
      currency,
      version
    });
    global.fetch = jest.fn(() => Promise.resolve({
      json: () => Promise.resolve({ result: 'success' }),
      text: () => Promise.resolve('success'),
      headers: {
        get: jest.fn().mockReturnValue('application/json')
      },
      status: 200,
      statusText: 'OK'
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should create payment params correctly', () => {
    const result = liqPay.createPaymentParams(params);

    expect(result).toEqual({
      version,
      language,
      currency,
      description: 'Test Description',
      public_key: publicKey,
      order_id: '1',
      action: 'pay',
      amount: 100
    });
  });

  test('should generate payment object correctly', () => {
    const result = liqPay.generatePaymentObject(params);

    expect(result.data).toBeDefined();
    expect(result.signature).toBeDefined();
  });

  test('should get checkout link correctly', () => {
    const result = liqPay.getCheckoutLink(params);

    expect(result).toBeDefined();
    expect(result.startsWith('https://www.liqpay.ua/api/')).toBe(true);
  });

  test('should make api call correctly', async () => {
    const result = await liqPay.api('/checkout', params);

    expect(result).toBeDefined();
    expect(result).toEqual({ result: 'success' });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test('should create cnb form correctly', () => {
    const result = liqPay.cnbForm(params);

    expect(result).toBeDefined();
    expect(result.startsWith('<form method="POST"')).toBe(true);
  });

  test('should generate payment signature correctly', () => {
    const result = liqPay.generatePaymentSignature(params);

    expect(result).toBeDefined();
  });

  test('should verify signature correctly', () => {
    const paymentObject = liqPay.generatePaymentObject(params);
    const result = liqPay.verifySignature(paymentObject.data, paymentObject.signature);

    expect(result).toEqual(params);
  });

  test('should throw error for invalid signature', () => {
    const data = 'invalidData';
    const signature = 'invalidSignature';

    expect(() => {
      liqPay.verifySignature(data, signature);
    }).toThrow('Invalid signature');
  });
});
