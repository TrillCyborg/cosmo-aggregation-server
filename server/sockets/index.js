import _ from 'lodash';
import Pair from '../models/pair.model';
import CryptoCompare from '../exchanges/CryptoCompare';
import Bittrex from '../exchanges/Bittrex';
import Binance from '../exchanges/Binance';
// import HitBTC from '../exchanges/HitBTC';

const EXCHANGES = [
  { id: 'CCCAGG', e: CryptoCompare },
  { id: 'BITTREX', e: Bittrex },
  { id: 'BINANCE', e: Binance },
  // { id: 'HITBTC', e: HitBTC },
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
    subs.CCCAGG = _.difference(
      subs.CCCAGG,
      subs.BITTREX,
      subs.BINANCE,
      // subs.HITBTC,
    );
    EXCHANGES.forEach(({ id, e }) => e.initSocket(subs[id]));
  });
};

export default { initSockets };
