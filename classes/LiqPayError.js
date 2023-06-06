class LiqPayError extends Error {
  constructor (message, details, origin) {
    super(message);
    this.name = this.constructor.name;
    this.details = details || {};
    this.origin = origin || '';

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = LiqPayError;
