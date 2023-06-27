import { money, setRateSource } from './index';

setRateSource({
  getRate: async (pair) => {
    if (pair === 'EUR/GBP') {
      return 2;
    }
    return 0.5;
  },
});

money('100', 'EUR').convertTo('GBP').then(console.log);

money('100', 'GBP').add('150', 'EUR').then(console.log);
