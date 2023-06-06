const LiqPayAPI = require('./LiqPayAPI');
const LiqPayDataPreparer = require('./LiqPayDataPreparer');

class LiqPay {
  constructor (options = {}) {
    const { publicKey, privateKey, language, currency, version } = options;
    this.api = new LiqPayAPI({ publicKey, privateKey });
    this.dataPrepare = new LiqPayDataPreparer(options);
    this.version = this.dataPrepare.version(version);
    this.language = this.dataPrepare.language(language);
    this.currency = this.dataPrepare.currency(currency);
  }

  defaultParams = (params) => {
    const data = {
      version: this.version,
      language: this.language,
      currency: this.currency,
      ...params
    };
    return this.api.paymetParams(data);
  };

  checkoutLink = (params) => {
    const prepareData = this.defaultParams(params);
    this.dataPrepare.validate('checkout', prepareData);
    const { data, signature } = this.api.paymentObject(prepareData);

    return `${this.api.host}3/checkout?data=${data}&signature=${signature}`;
  };

  checkoutForm = (params) => {
    const language = params.language || this.language;

    const prepareData = this.defaultParams(params);
    this.dataPrepare.validate('checkout', prepareData);

    const { data, signature } = this.api.paymentObject(prepareData);
    return '<form method="POST" action="https://www.liqpay.ua/api/3/checkout" accept-charset="utf-8">' +
      '<input type="hidden" name="data" value="' + data + '" />' +
      '<input type="hidden" name="signature" value="' + signature + '" />' +
      '<input type="image" src="//static.liqpay.ua/buttons/p1' + language + '.radius.png" name="btn_text" />' +
      '</form>';
  };
}

module.exports = LiqPay;
