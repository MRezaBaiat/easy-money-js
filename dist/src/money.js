"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.money = exports.Money = void 0;
const js_big_decimal_1 = __importDefault(require("js-big-decimal"));
const utils_1 = require("./utils");
class Money {
    constructor(amount, currency, immutable) {
        this.amount = Money.toStringValue(amount);
        this.currency = (arguments.length > 1
            ? currency
            : amount instanceof Money
                ? amount.currency
                : undefined);
        this.immutable = !!immutable;
    }
    add(amount, currency) {
        if (currency !== undefined) {
            return new Money(amount, currency)
                .convertTo(this.getCurrency())
                .then((r) => this.add(r));
        }
        return this.cloneIfNeeded((m) => (m.amount = js_big_decimal_1.default.add(this.amount, Money.toStringValue(amount))));
    }
    subtract(amount, currency) {
        if (currency) {
            return new Money(amount, currency)
                .convertTo(this.getCurrency())
                .then((r) => this.subtract(r));
        }
        return this.cloneIfNeeded((m) => (m.amount = js_big_decimal_1.default.subtract(this.amount, Money.toStringValue(amount))));
    }
    multiply(amount, currency) {
        if (currency) {
            return new Money(amount, currency)
                .convertTo(this.getCurrency())
                .then((r) => this.multiply(r));
        }
        return this.cloneIfNeeded((m) => (m.amount = js_big_decimal_1.default.multiply(this.amount, Money.toStringValue(amount))));
    }
    divide(amount, currency, precision) {
        if (currency) {
            return new Money(amount, currency)
                .convertTo(this.getCurrency())
                .then((r) => this.divide(r, undefined, precision));
        }
        return this.cloneIfNeeded((m) => (m.amount = js_big_decimal_1.default.divide(this.amount, Money.toStringValue(amount), precision === undefined ? 15 : precision)));
    }
    round(precision, mode) {
        if (!(this.amount === 'null' || this.amount === 'undefined')) {
            return this.cloneIfNeeded((m) => (m.amount = js_big_decimal_1.default.round(this.amount, precision, mode)));
        }
        return this;
    }
    floor() {
        return this.cloneIfNeeded((m) => (m.amount = js_big_decimal_1.default.floor(m.amount)));
    }
    value(moneyFormat) {
        if (!(this.amount === 'null' || this.amount === 'undefined') &&
            !moneyFormat) {
            return js_big_decimal_1.default.multiply(this.amount, 1);
        }
        return this.amount;
    }
    async convertTo(currency, rates = {}) {
        if (!currency) {
            throw new Error('No currency is set to convert to');
        }
        if (!this.getCurrency()) {
            throw new Error('No currency is set to convert from');
        }
        if (currency === this.getCurrency()) {
            return this.cloneIfNeeded();
        }
        const pair = `${this.getCurrency()}/${currency}`;
        let rate = rates[pair];
        if (!rate) {
            rate = rates[(0, utils_1.reversePair)(pair)];
            if (rate) {
                rate = 1 / rate;
            }
        }
        if (!rate) {
            if (!Money.rateSource) {
                throw new Error('to convert currencies into different ones we need a rate source first , please set it by calling setRateSource() ');
            }
            rate = await Money.rateSource.getRate(pair);
        }
        const c = this.cloneIfNeeded();
        c.amount = js_big_decimal_1.default.multiply(this.amount, rate);
        c.currency = currency;
        return c;
    }
    getCurrency() {
        return this.currency;
    }
    compareTo(amount) {
        return js_big_decimal_1.default.compareTo(this.amount, Money.toStringValue(amount));
    }
    equals(amount) {
        return this.compareTo(amount) === 0;
    }
    isGreaterThan(amount) {
        return this.compareTo(amount) > 0;
    }
    isGreaterThanOrEqual(amount) {
        return this.compareTo(amount) >= 0;
    }
    isLessThan(amount) {
        return this.compareTo(amount) < 0;
    }
    isLessThanOrEqual(amount) {
        return this.compareTo(amount) <= 0;
    }
    static toStringValue(amount) {
        return amount instanceof Money ? amount.amount : String(amount);
    }
    isImmutable() {
        return this.immutable;
    }
    toImmutable() {
        if (this.isImmutable()) {
            return this.clone();
        }
        return this.clone({ immutable: true });
    }
    toMutable() {
        if (!this.isImmutable()) {
            return this.clone();
        }
        return this.clone({ immutable: false });
    }
    cloneIfNeeded(cb) {
        if (this.isImmutable()) {
            const c = this.clone();
            cb && cb(c);
            return c;
        }
        cb && cb(this);
        return this;
    }
    clone(overrides) {
        return new Money(overrides?.amount || this.amount, overrides?.currency || this.currency, overrides?.immutable || this.immutable);
    }
}
exports.Money = Money;
const money = (...args) => {
    return new Money(...args);
};
exports.money = money;
