// import BigNumber from 'bignumber.js';
import Price from '../models/price.model';
import Kucoin from '../exchanges/Kucoin';

// BigNumber.config({ DECIMAL_PLACES: 8 });

class Prices {
  constructor() {
    this.prices = {
      COSMO: {},
      CCCAGG: {},
      BITTREX: {},
      BINANCE: {},
      KUCOIN: {},
      YOBIT: {},
    };
  }

  aggregateAverage = () => {
    const sources = ['BITTREX', 'BINANCE', 'KUCOIN'];
    const prices = {};
    sources.forEach(source =>
      Object.keys(this.prices[source]).forEach(pair => {
        if (this.prices[source][pair]) {
          if (!prices[pair]) {
            prices[pair] = [];
          }
          prices[pair].push(this.prices[source][pair]);
        }
      }));
    Object.keys(this.prices.CCCAGG).forEach(pair => {
      if (this.prices.CCCAGG[pair]) {
        if (!prices[pair]) {
          prices[pair] = [];
          prices[pair].push(this.prices.CCCAGG[pair]);
        }
      }
    });
    Object.keys(prices).forEach(pair => {
      let price = 0;
      prices[pair].forEach(p => {
        price += p;
      });
      price /= prices[pair].length;
      this.prices.COSMO[pair] = price;
    });
  }

  update({ source, value, pair }) {
    if (source && pair && value) {
      this.prices[source][pair] = value;
    }
  }

  saveAll = time => Promise.resolve()
    .then(Kucoin.getLastPrices)
    .then((kucoin) => { this.prices.KUCOIN = kucoin; })
    .then(this.aggregateAverage)
    .then(() => Promise.all(Object.keys(this.prices).map((source) =>
      Promise.all(Object.keys(this.prices[source]).map((pair) => new Promise((resolve, reject) => {
        if (source !== 'CCAAGG') {
          const price = {
            pair,
            source,
            price: this.prices[source][pair],
            updatedAt: time
          }
          return Price.findOneAndUpdate(
            { pair: price.pair, source: price.source },
            price,
            { upsert:true },
            (err, doc) => {
              if (err) {
                console.log('ERROR:', price, err);
                return reject(err);
              }
              resolve();
            }
          );
        }
      })))
    )))
}

const lastPrices = new Prices();

export default Prices;
export {
  lastPrices,
};
