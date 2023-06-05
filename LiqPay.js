const { createHash } = require('crypto');
const PrepareData = require('./PrepareData');

class LiqPay {
  #publicKey;
  #privateKey;
  #host;

  constructor (options = {}) {
    const { publicKey, privateKey, language, currency, version } = options;
    this.prepareData = new PrepareData(options);

    if (!publicKey || !privateKey) {
      throw new Error('Public key and private key must be provided');
    }

    this.#publicKey = publicKey;
    this.#privateKey = privateKey;
    this.#host = 'https://www.liqpay.ua/api/';

    this.version = this.prepareData.version(version);
    this.language = this.prepareData.language(language);
    this.currency = this.prepareData.currency(currency);
  }

  createPaymentParams = (params = {}) => {
    const data = {
      version: this.version,
      language: this.language,
      currency: this.currency,
      public_key: this.#publicKey,
      ...params
    };

    return data;
  };

  generatePaymentObject = (params) => {
    const data = Buffer.from(JSON.stringify(params)).toString('base64');
    const signature = this.strToSign(data);
    return { data, signature };
  };

  getCheckoutLink = (params) => {
    const prepareData = this.createPaymentParams(params);
    this.prepareData.validate('checkout', prepareData);
    const { data, signature } = this.generatePaymentObject(params);

    return `${this.#host}/3/checkout?data=${data}&signature=${signature}`;
  };

  async api (path, params) {
    const prepareData = this.createPaymentParams(params);
    const { data, signature } = this.generatePaymentObject(prepareData);

    const requestBody = `${encodeURIComponent('data')}=${encodeURIComponent(data)}&${encodeURIComponent('signature')}=${encodeURIComponent(signature)}`;
    const options = {
      method: 'POST',
      redirect: 'manual',
      body: requestBody,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };

    const res = await fetch(this.#host + path, options);

    const contentType = res.headers.get('Content-Type');
    if (contentType?.startsWith('application/json')) {
      const json = await res.json();
      return json;
    } else {
      const text = await res.text();
      return {
        statusCode: res.status,
        statusText: res.statusText,
        message: text
      };
    }
  }

  cnbForm = (params) => {
    const language = params.language || this.language;

    const prepareData = this.createPaymentParams(params);
    const { data, signature } = this.generatePaymentObject(prepareData);
    return '<form method="POST" action="https://www.liqpay.ua/api/3/checkout" accept-charset="utf-8">' +
      '<input type="hidden" name="data" value="' + data + '" />' +
      '<input type="hidden" name="signature" value="' + signature + '" />' +
      '<input type="image" src="//static.liqpay.ua/buttons/p1' + language + '.radius.png" name="btn_text" />' +
      '</form>';
  };

  generatePaymentSignature = (params) => {
    params = this.createPaymentParams(params);
    const data = Buffer.from(JSON.stringify(params)).toString('base64');
    return this.strToSign(data);
  };

  strToSign = (data) => {
    const str = this.#privateKey + data + this.#privateKey;
    const sha1 = createHash('sha1');
    sha1.update(str);
    return sha1.digest('base64');
  };

  verifySignature = (data, signature) => {
    const sign = this.strToSign(data);
    if (signature !== sign) {
      throw new Error('Invalid signature');
    }

    return JSON.parse(Buffer.from(data, 'base64').toString());
  };
}

module.exports = LiqPay;
module.exports.PrepareData = PrepareData;
