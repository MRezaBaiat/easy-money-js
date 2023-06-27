export * from './src/money';
export interface RateSource {
    getRate(pair: string): Promise<number>;
}
export declare function setRateSource(rateSource: RateSource): void;
