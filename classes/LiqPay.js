const LiqPayAPI = require('./LiqPayAPI');
const LiqPayDataPreparer = require('./LiqPayDataPreparer');

class LiqPay {
  constructor (options = {}) {
    const { publicKey, privateKey, language, currency, version } = options;
    this.dataPrepare = new LiqPayDataPreparer(options);
    this.version = this.dataPrepare.version(version);
    this.language = this.dataPrepare.language(language);
    this.currency = this.dataPrepare.currency(currency);
    this.api = new LiqPayAPI({ publicKey, privateKey, version: this.version });
  }

  paymentParams = (params) => {
    const data = {
      language: this.language,
      currency: this.currency,
      ...params
    };
    return this.api.apiParams(data);
  };

  checkoutLink = (params) => {
    const prepareData = this.paymentParams(params);
    this.dataPrepare.validate('checkout', prepareData);
    const { data, signature } = this.api.paymentObject(prepareData);

    return `${this.api.host}3/checkout?data=${data}&signature=${signature}`;
  };

  checkoutForm = (params) => {
    const language = params.language || this.language;

    const prepareData = this.paymentParams(params);
    this.dataPrepare.validate('checkout', prepareData);

    const { data, signature } = this.api.paymentObject(prepareData);
    return '<form method="POST" action="https://www.liqpay.ua/api/3/checkout" accept-charset="utf-8">' +
      '<input type="hidden" name="data" value="' + data + '" />' +
      '<input type="hidden" name="signature" value="' + signature + '" />' +
      '<input type="image" src="//static.liqpay.ua/buttons/p1' + language + '.radius.png" name="btn_text" />' +
      '</form>';
  };

  status = async (orderId) => {
    const data = this.api.apiParams({
      action: 'status',
      order_id: orderId
    });

    this.dataPrepare.validate('status', data);

    const payload = await this.api.api(data);
    return payload;
  };

  refund = async (orderId, amount) => {
    const data = this.api.apiParams({
      action: 'refund',
      order_id: orderId,
      amount
    });

    this.dataPrepare.validate('refund', data);

    const payload = await this.api.api(data);
    return payload;
  };
}

module.exports = LiqPay;
