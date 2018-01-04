import Pair from '../models/pair.model';
// import CryptoCompare from './CryptoCompare';
// import Bittrex from './Bittrex';
import Binance from './Binance';

const initSockets = () => {
  Pair.find({}, (err, pairs) => {
    const subs = pairs.reduce((obj, pair) => {
      pair.sources.forEach((source) => {
        if (!obj[source]) {
          obj[source] = [];
        }
        obj[source].push(pair.pair);
      });
      return obj;
    }, {});

    // CryptoCompare.addSubs(subs.CCCAGG);
    // Bittrex.addSubs(subs.BITTREX);
    Binance.addSubs(subs.BINANCE);
  });
};

export default { initSockets };
