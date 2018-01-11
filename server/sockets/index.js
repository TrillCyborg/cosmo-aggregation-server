import _ from 'lodash';
import Pair from '../models/pair.model';
// import CryptoCompare from '../exchanges/CryptoCompare';
import Bittrex from '../exchanges/Bittrex';
import Binance from '../exchanges/Binance';

const EXCHANGES = [
  // { id: 'CCCAGG', e: CryptoCompare },
  { id: 'BITTREX', e: Bittrex },
  { id: 'BINANCE', e: Binance },
];

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
    subs.CCCAGG = _.difference(subs.CCCAGG, subs.BITTREX, subs.BINANCE);
    EXCHANGES.forEach(({ id, e }) => e.initSocket(subs[id]));
  });
};

export default { initSockets };
