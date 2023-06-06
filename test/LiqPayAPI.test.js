/* eslint-disable no-new */
const { API } = require('../index.js');

describe('LiqPayAPI', () => {
  let liqPay;
  const publicKey = 'testPublicKey';
  const privateKey = 'testPrivateKey';
  const language = 'en';
  const currency = 'USD';
  const version = 3;

  const params = {
    order_id: '1',
    action: 'pay',
    amount: 100,
    description: 'Test Description',
    language,
    currency,
    version
  };

  beforeEach(() => {
    liqPay = new API({ publicKey, privateKey });

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

  test('should throw error when generating payment signature with no params', () => {
    expect(() => {
      liqPay.createSignature();
    }).toThrow('Invalid parameters');
  });

  test('should create payment params correctly', () => {
    const result = liqPay.paymetParams(params);

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
    const result = liqPay.paymentObject(params);

    expect(result.data).toBeDefined();
    expect(result.signature).toBeDefined();
  });

  test('should throw error when generating payment object with no params', () => {
    expect(() => {
      liqPay.paymentObject();
    }).toThrow();
  });

  test('should generate payment signature correctly', () => {
    const result = liqPay.createSignature(params);

    expect(result).toBeDefined();
  });

  test('should verify signature correctly', () => {
    const paymentObject = liqPay.paymentObject(params);
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

  test('should throw error when verifying signature with no params', () => {
    expect(() => {
      liqPay.verifySignature();
    }).toThrow();
  });
});
