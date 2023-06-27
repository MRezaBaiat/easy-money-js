## NestJS FIFO Lock

A tool to simplify working with (big) money maths and converting them into different currencies
## Installation

```bash
$ npm install easy-money-js
```

## Usage

For simple usages you can use it without any configurations:

```typescript
const amount = money('100.0845')
    .round(2)
    .multiply(3)
    .divide(2)
    .subtract(5);

money.value() //145.12

amount.floor().value() // 145



money(3.1).isGreaterThanOrEqual('3.1'); // true

money('1.4').isGreaterThan(money('5.1')); //false

```
But if you need to use the conversions , you will need to initialize the rate source first:

```typescript
import { setRateSource } from "easy-money-js";

setRateSource({
  getRate: async (pair)=> {
    if(pair === 'EUR/GBP'){
      return 2;
    }
    return 0.5;
  }
})

(await money('100','EUR').convertTo('GBP')).value(); //200

(await money('100','GBP')
  .add('150','EUR'))
  .value() // 400

```

## Credits

Special thanks to my dear friend ,  [Godwin Odo Kalu](https://github.com/Godwin324)
