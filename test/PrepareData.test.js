const { DataPreparer } = require('../index');
const fs = require('node:fs');
const Ajv = require('ajv');

describe('dataPreparer', () => {
  let dataPreparer;

  beforeEach(() => {
    dataPreparer = new DataPreparer();
  });

  test('should throw an error when invalid currency is provided', () => {
    expect(() => {
      dataPreparer.currency('INVALID_CURRENCY');
    }).toThrow('Invalid currency value');
  });

  test('should return default currency when no currency is provided', () => {
    expect(dataPreparer.currency()).toBe('UAH');
  });

  test('should throw an error when invalid language is provided', () => {
    expect(() => {
      dataPreparer.language('INVALID_LANGUAGE');
    }).toThrow('Invalid language value');
  });

  test('should return default language when no language is provided', () => {
    expect(dataPreparer.language()).toBe('uk');
  });

  test('should return default version when no version is provided', () => {
    expect(dataPreparer.version()).toEqual(3);
  });

  test('should throw an error when invalid version is provided', () => {
    expect(() => {
      dataPreparer.version('INVALID_VERSION');
    }).toThrow('Invalid version value, must be a number greater than zero');
  });

  test('should load schemas from provided directory', async () => {
    const mockReadDir = jest.spyOn(fs, 'readdirSync').mockReturnValue(['schema1.json', 'schema2.json']);
    const mockReadFile = jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify({ test: 'test' }));

    dataPreparer.schemaLoader();

    expect(dataPreparer.schemasJSON.schema1).toEqual({ test: 'test' });
    expect(dataPreparer.schemasJSON.schema2).toEqual({ test: 'test' });

    mockReadDir.mockRestore();
    mockReadFile.mockRestore();
  });

  test('should compile all schemas in the ./schemas directory', () => {
    const dataPreparer = new DataPreparer();
    dataPreparer.schemaLoader();

    const ajv = new Ajv();

    for (const schemaName in dataPreparer.schemasJSON) {
      const schema = dataPreparer.schemasJSON[schemaName];
      const isValid = ajv.validateSchema(schema);

      if (!isValid) {
        console.log('Errors in schema:', schemaName);
        console.log(ajv.errors);
      }

      expect(isValid).toBe(true);
    }
  });
});
