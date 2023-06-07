const Ajv = require('ajv');
const fs = require('node:fs');
const path = require('path');
const LiqPayError = require('./LiqPayError');

class LiqPayDataPreparer {
  #possibleСurrencies;
  #possibleLanguages;
  #compileSchema;

  constructor (options = {}) {
    this.#possibleСurrencies = ['UAH', 'USD', 'EUR'];
    this.#possibleLanguages = ['uk', 'en', 'ru'];
    this.#compileSchema = {};

    this.schemasDir = options.schemaDir || path.join(__dirname, '..', 'schemas');
    this.schemasJSON = options.schemaJSON || {};

    this.ajv = new Ajv();

    this.schemaLoader();
    this.schemaCompilation();
  }

  async schemaCompilation () {
    for (const schemaName in this.schemasJSON) {
      const schema = this.schemasJSON[schemaName];
      this.#compileSchema[schemaName] = this.ajv.compile(schema);
    }
  }

  validate (schemaName, data) {
    const validate = this.#compileSchema[schemaName];

    // Если в схему request еще не добавил нужные поля для данного action, пропускаем валидацию.
    // Если схема не реализована, пропускаем валидацию
    const actionInSchema = this.schemasJSON[schemaName]?.properties?.action?.enum?.includes(data.action);
    if (!validate || (schemaName === 'request' && !actionInSchema)) {
      return true;
    }

    const valid = validate(data);

    if (!valid) {
      throw new LiqPayError(validate.errors.message, validate.errors, 'LiqPayDataPreparer.validate');
    }

    return true;
  }

  schemaLoader (schemasDir) {
    const files = fs.readdirSync(schemasDir || this.schemasDir);
    for (const file of files) {
      const filePath = path.join(this.schemasDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const fileName = path.parse(file).name;
      this.schemasJSON[fileName] = JSON.parse(fileContent);
    }
  }

  currency (currency = '') {
    if (currency.length === 0) {
      return this.#possibleСurrencies[0];
    }

    const currencyUpper = currency.toUpperCase();

    const value = this.#possibleСurrencies.find((value) => value === currencyUpper);

    if (!value) {
      throw new LiqPayError('Invalid currency value', { currency, validСurrencies: this.#possibleСurrencies }, 'LiqPayDataPreparer.currency');
    }

    return value;
  }

  language (language = '') {
    if (language.length === 0) {
      return this.#possibleLanguages[0];
    }

    const languageLower = language.toLowerCase();

    const value = this.#possibleLanguages.find((value) => value === languageLower);
    if (!value) {
      throw new LiqPayError('Invalid language value', { language, validСurrencies: this.#possibleLanguages }, 'LiqPayDataPreparer.language');
    }

    return value;
  }

  version (version = 3) {
    const numberVersion = Number(version);
    if (isNaN(numberVersion)) {
      throw new LiqPayError('Invalid version value, must be a number greater than zero', { version }, 'LiqPayDataPreparer.version');
    }
    return numberVersion || 3;
  }
}

module.exports = LiqPayDataPreparer;
