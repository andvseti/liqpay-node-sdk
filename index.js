const LiqPay = require('./classes/LiqPay');
const LiqPayAPI = require('./classes/LiqPayAPI');
const LiqPayDataPreparer = require('./classes/LiqPayDataPreparer');
const paymentStatusesMap = require('./paymentStatusesMap');

module.exports = (options = {}) => new LiqPay(options);
module.exports.LiqPay = LiqPay;
module.exports.API = LiqPayAPI;
module.exports.DataPreparer = LiqPayDataPreparer;
module.exports.liqPayPayStatuses = paymentStatusesMap;
