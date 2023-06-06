const { createHash } = require('crypto');
const LiqPayError = require('./LiqPayError');

class LiqPayAPI {
  #publicKey;
  #privateKey;
  #host;

  constructor (options = {}) {
    const { publicKey, privateKey } = options;

    if (!publicKey || !privateKey) {
      throw new LiqPayError('Public key and private key must be provided', { publicKey, privateKey }, 'LiqPayAPI.Constructor');
    }

    this.#publicKey = publicKey;
    this.#privateKey = privateKey;
    this.#host = 'https://www.liqpay.ua/api/';
  }

  get host () { return this.#host; }

  paymetParams = (params) => {
    return {
      public_key: this.#publicKey,
      ...params
    };
  };

  paymentObject = (params) => {
    const data = Buffer.from(JSON.stringify(params)).toString('base64');
    const signature = this.hashSignature(data);
    return { data, signature };
  };

  async api (path, params) {
    const prepareData = this.paymetParams(params);
    const { data, signature } = this.paymentObject(prepareData);

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

    const res = await fetch(this.#host + path, options).catch((error) => {
      throw new LiqPayError(error.message, { host: this.#host + path, options }, 'LiqPayAPI.api');
    });

    const contentType = res.headers.get('Content-Type');
    if (contentType?.startsWith('application/json')) {
      const json = await res.json();

      if (json.status === 'error' || json.status === 'failure') {
        throw new LiqPayError(json.err_description, json, 'LiqPayAPI External');
      }

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

  createSignature = (params = {}) => {
    if (typeof params !== 'object' || Object.keys(params).length === 0) {
      throw new LiqPayError('Invalid parameters', {
        params,
        paramsType: typeof params,
        paramsCount: typeof params === 'object' ? Object.keys(params).length : 0
      }, 'LiqPayAPI.createSignature');
    }
    const prepareData = this.paymetParams(params);
    const data = Buffer.from(JSON.stringify(prepareData)).toString('base64');
    return this.hashSignature(data);
  };

  hashSignature = (data) => {
    const str = this.#privateKey + data + this.#privateKey;
    const sha1 = createHash('sha1');
    sha1.update(str);
    return sha1.digest('base64');
  };

  verifySignature = (data, signature) => {
    const sign = this.hashSignature(data);
    if (signature !== sign) {
      throw new LiqPayError('Invalid signature', { data, signature }, 'LiqPayAPI.verifySignature');
    }

    return JSON.parse(Buffer.from(data, 'base64').toString());
  };
}

module.exports = LiqPayAPI;
