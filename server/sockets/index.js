import Pair from '../models/pair.model';
import CryptoCompare from './CryptoCompare';

const initCryptoCompare = () => {
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

    CryptoCompare.addSubs(subs.CCCAGG);
  });
};

const initSockets = () => {
  initCryptoCompare();
};

export default { initSockets };
