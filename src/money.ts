/* eslint-disable no-use-before-define */
import BigDecimal from 'js-big-decimal';
import { RoundingModes } from 'js-big-decimal/dist/node/roundingModes';
import { reversePair } from './utils';
import { RateSource } from '../index';

type CurrenciesType = any;

// TODO: limit to Money & string after fixed the types for DECIMAL & BIGINT
type AmountType = Money<CurrenciesType> | string | number;

type ExtractedCurrencyType<
  Amount extends AmountType,
  Currency extends CurrenciesType,
> = Currency extends undefined
  ? Amount extends Money<CurrenciesType>
    ? ReturnType<Amount['getCurrency']>
    : undefined
  : Money<Currency>;

type MaybePromise<
  Amount extends AmountType,
  T extends CurrenciesType,
  MCT extends CurrenciesType,
  Extracted = ExtractedCurrencyType<Amount, T>,
> = Extracted extends undefined ? Money<MCT> : Promise<Money<MCT>>;

export class Money<MCT extends CurrenciesType = undefined> {
  private amount: string;

  private currency: MCT;

  private readonly immutable: boolean;

  public static rateSource: RateSource;

  constructor(amount: AmountType, currency?: MCT, immutable?: boolean) {
    this.amount = Money.toStringValue(amount);
    this.currency = (
      arguments.length > 1
        ? currency
        : amount instanceof Money
        ? amount.currency
        : undefined
    ) as MCT;
    this.immutable = !!immutable;
  }

  public add<Amount extends AmountType, T extends CurrenciesType = undefined>(
    amount: Amount,
    currency?: T,
  ): MaybePromise<Amount, T, MCT> {
    if (currency !== undefined) {
      return new Money(amount, currency)
        .convertTo(this.getCurrency())
        .then((r) => this.add(r)) as any;
    }
    return this.cloneIfNeeded(
      (m) =>
        (m.amount = BigDecimal.add(this.amount, Money.toStringValue(amount))),
    ) as any;
  }

  public subtract<
    Amount extends AmountType,
    T extends CurrenciesType = undefined,
  >(amount: Amount, currency?: T): MaybePromise<Amount, T, MCT> {
    if (currency) {
      return new Money(amount, currency)
        .convertTo(this.getCurrency())
        .then((r) => this.subtract(r)) as any;
    }
    return this.cloneIfNeeded(
      (m) =>
        (m.amount = BigDecimal.subtract(
          this.amount,
          Money.toStringValue(amount),
        )),
    ) as any;
  }

  public multiply<
    Amount extends AmountType,
    T extends CurrenciesType = undefined,
  >(amount: Amount, currency?: T): MaybePromise<Amount, T, MCT> {
    if (currency) {
      return new Money(amount, currency)
        .convertTo(this.getCurrency())
        .then((r) => this.multiply(r)) as any;
    }
    return this.cloneIfNeeded(
      (m) =>
        (m.amount = BigDecimal.multiply(
          this.amount,
          Money.toStringValue(amount),
        )),
    ) as any;
  }

  public divide<
    Amount extends AmountType,
    T extends CurrenciesType = undefined,
  >(
    amount: Amount,
    currency?: T,
    precision?: number,
  ): MaybePromise<Amount, T, MCT> {
    if (currency) {
      return new Money(amount, currency)
        .convertTo(this.getCurrency())
        .then((r) => this.divide(r, undefined, precision)) as any;
    }
    return this.cloneIfNeeded(
      (m) =>
        (m.amount = BigDecimal.divide(
          this.amount,
          Money.toStringValue(amount),
          precision === undefined ? 15 : precision,
        )),
    ) as any;
  }

  public round(precision?: number, mode?: RoundingModes): Money<MCT> {
    if (!(this.amount === 'null' || this.amount === 'undefined')) {
      return this.cloneIfNeeded(
        (m) => (m.amount = BigDecimal.round(this.amount, precision, mode)),
      );
    }
    return this as any;
  }

  public floor(): Money<MCT> {
    return this.cloneIfNeeded((m) => (m.amount = BigDecimal.floor(m.amount)));
  }

  public value(moneyFormat?: boolean): string {
    if (
      !(this.amount === 'null' || this.amount === 'undefined') &&
      !moneyFormat
    ) {
      return BigDecimal.multiply(this.amount, 1);
    }
    return this.amount;
  }

  public async convertTo<T extends CurrenciesType>(
    currency: T,
    rates: Record<string, number> = {},
  ): Promise<Money<T>> {
    if (!currency) {
      throw new Error('No currency is set to convert to');
    }
    if (!this.getCurrency()) {
      throw new Error('No currency is set to convert from');
    }
    if (currency === (this.getCurrency() as any)) {
      return this.cloneIfNeeded() as any;
    }
    const pair = `${this.getCurrency()}/${currency}`;
    let rate = rates[pair];

    if (!rate) {
      rate = rates[reversePair(pair)];
      if (rate) {
        rate = 1 / rate;
      }
    }

    if (!rate) {
      if (!Money.rateSource) {
        throw new Error(
          'to convert currencies into different ones we need a rate source first , please set it by calling setRateSource() ',
        );
      }

      rate = await Money.rateSource.getRate(pair);
    }

    const c = this.cloneIfNeeded();
    c.amount = BigDecimal.multiply(this.amount, rate);
    c.currency = currency as any;
    return c as any;
  }

  public getCurrency(): MCT {
    return this.currency;
  }

  public compareTo(amount: AmountType): 1 | 0 | -1 {
    return BigDecimal.compareTo(this.amount, Money.toStringValue(amount));
  }

  public equals(amount: AmountType): boolean {
    return this.compareTo(amount) === 0;
  }

  public isGreaterThan(amount: AmountType): boolean {
    return this.compareTo(amount) > 0;
  }

  public isGreaterThanOrEqual(amount: AmountType): boolean {
    return this.compareTo(amount) >= 0;
  }

  public isLessThan(amount: AmountType): boolean {
    return this.compareTo(amount) < 0;
  }

  public isLessThanOrEqual(amount: AmountType): boolean {
    return this.compareTo(amount) <= 0;
  }

  private static toStringValue(amount: AmountType): string {
    return amount instanceof Money ? amount.amount : String(amount);
  }

  public isImmutable(): boolean {
    return this.immutable;
  }

  public toImmutable(): Money<MCT> {
    if (this.isImmutable()) {
      return this.clone();
    }
    return this.clone({ immutable: true });
  }

  public toMutable(): Money<MCT> {
    if (!this.isImmutable()) {
      return this.clone();
    }
    return this.clone({ immutable: false });
  }

  private cloneIfNeeded(cb?: (money: Money<MCT>) => void): Money<MCT> {
    if (this.isImmutable()) {
      const c = this.clone();
      // eslint-disable-next-line no-unused-expressions
      cb && cb(c);
      return c as any;
    }
    // eslint-disable-next-line no-unused-expressions
    cb && cb(this);
    return this as any;
  }

  public clone<T extends CurrenciesType = MCT>(
    overrides?: Partial<{ amount: string; currency: T; immutable: boolean }>,
  ): Money<T> {
    return new Money<any>(
      overrides?.amount || this.amount,
      overrides?.currency || this.currency,
      overrides?.immutable || this.immutable,
    );
  }
}

export const money: <CT extends CurrenciesType = undefined>(
  amount: AmountType,
  currency?: CT,
  immutable?: boolean,
) => Money<CT> = (...args) => {
  return new Money(...args);
};
