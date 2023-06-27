import { Money } from './src/money';

export * from './src/money';

export interface RateSource {
  getRate(pair: string): Promise<number>;
}

export function setRateSource(rateSource: RateSource) {
  Money.rateSource = rateSource;
}
