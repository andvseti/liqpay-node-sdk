const LiqPayAPI = require('./LiqPayAPI');
const LiqPayDataPreparer = require('./LiqPayDataPreparer');
const payStatus = require('./paymentStatusesMap');

class LiqPay {
  constructor (options = {}) {
    const { publicKey, privateKey, language, currency, version } = options;
    this.dataPrepare = new LiqPayDataPreparer(options);
    this.version = this.dataPrepare.version(version);
    this.language = this.dataPrepare.language(language);
    this.currency = this.dataPrepare.currency(currency);
    this.api = new LiqPayAPI({ publicKey, privateKey, version: this.version });
  }

  paymentParams = (params = {}) => {
    const data = {
      language: this.language,
      currency: this.currency,
      ...params
    };
    return this.api.apiParams(data);
  };

  checkoutLink = (params = {}) => {
    const prepareData = this.paymentParams(params);
    this.dataPrepare.validate('checkout', prepareData);
    const { data, signature } = this.api.paymentObject(prepareData);

    return `${this.api.host}3/checkout?data=${data}&signature=${signature}`;
  };

  checkoutForm = (params = {}) => {
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

  request = async (params = {}) => {
    const data = this.api.apiParams(params);

    this.dataPrepare.validate('request', data);

    const payload = await this.api.api('request', data);
    return payload;
  };

  status = async (orderId = '') => {
    const order = this.request({
      action: 'status',
      order_id: orderId
    });

    return order;
  };

  refund = async (orderId = '', amount = 0) => {
    try {
      const payload = await this.request({ action: 'refund', order_id: orderId, amount });

      return payload;
    } catch (error) {
      // Если ошибка в отсутствии оплаты с таким order_id, то пробросить дальше
      if (error.details.err_code === 'payment_not_found') {
        throw error;
      }

      // Добавить к делатям ошибки текущий статус и описание статуса и пробросить ошибку дальше
      const order = await this.status(orderId);
      order.status_description = payStatus[order.status];
      error.details.order = order;

      throw error;
    }
  };
}

module.exports = LiqPay;
