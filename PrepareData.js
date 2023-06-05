const Ajv = require('ajv');
const fs = require('node:fs');
const path = require('path');

class PrepareData {
  #possibleСurrencies;
  #possibleLanguages;
  #compileSchema;

  constructor (options = {}) {
    this.#possibleСurrencies = ['UAH', 'USD', 'EUR'];
    this.#possibleLanguages = ['uk', 'en', 'ru'];
    this.#compileSchema = {};

    this.schemasDir = options.schemaDir || path.join(__dirname, 'schemas');
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

    if (!validate) {
      console.warn(`Schema ${schemaName} not found`);
      return false;
    }
    const valid = validate(data);

    if (!valid) {
      throw validate.errors;
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
      throw new Error(`Invalid currency value: ${currency}. valid values: ${this.#possibleСurrencies.join(', ')}`);
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
      throw new Error(`Invalid language value: ${language}. valid values: ${this.#possibleLanguages.join(', ')}`);
    }

    return value;
  }

  version (version = 3) {
    const numberVersion = Number(version);
    if (isNaN(numberVersion)) {
      throw new Error(`Invalid version value: ${version}. It should be a number.`);
    }
    return numberVersion || 3;
  }
}

module.exports = PrepareData;
