const PrepareData = require('../PrepareData');
const fs = require('node:fs');
const Ajv = require('ajv');

describe('PrepareData', () => {
  let prepareData;

  beforeEach(() => {
    prepareData = new PrepareData();
  });

  test('should throw an error when invalid currency is provided', () => {
    expect(() => {
      prepareData.currency('INVALID_CURRENCY');
    }).toThrow('Invalid currency value: INVALID_CURRENCY. valid values: UAH, USD, EUR');
  });

  test('should return default currency when no currency is provided', () => {
    expect(prepareData.currency()).toBe('UAH');
  });

  test('should throw an error when invalid language is provided', () => {
    expect(() => {
      prepareData.language('INVALID_LANGUAGE');
    }).toThrow('Invalid language value: INVALID_LANGUAGE. valid values: uk, en, ru');
  });

  test('should return default language when no language is provided', () => {
    expect(prepareData.language()).toBe('uk');
  });

  test('should return default version when no version is provided', () => {
    expect(prepareData.version()).toEqual(3);
  });

  test('should throw an error when invalid version is provided', () => {
    expect(() => {
      prepareData.version('INVALID_VERSION');
    }).toThrow('Invalid version value: INVALID_VERSION. It should be a number.');
  });

  test('should load schemas from provided directory', async () => {
    const mockReadDir = jest.spyOn(fs, 'readdirSync').mockReturnValue(['schema1.json', 'schema2.json']);
    const mockReadFile = jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify({ test: 'test' }));

    prepareData.schemaLoader();

    expect(prepareData.schemasJSON.schema1).toEqual({ test: 'test' });
    expect(prepareData.schemasJSON.schema2).toEqual({ test: 'test' });

    mockReadDir.mockRestore();
    mockReadFile.mockRestore();
  });

  test('should compile all schemas in the ./schemas directory', async () => {
    const prepareData = new PrepareData();
    await prepareData.schemaLoader();

    const ajv = new Ajv();

    for (const schemaName in prepareData.schemasJSON) {
      const schema = prepareData.schemasJSON[schemaName];
      const isValid = ajv.validateSchema(schema);

      if (!isValid) {
        console.log('Errors in schema:', schemaName);
        console.log(ajv.errors);
      }

      expect(isValid).toBe(true);
    }
  });
});
