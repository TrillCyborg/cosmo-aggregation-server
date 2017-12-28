import Pair from '../models/pair.model';
import cryptocompare from './cryptocompare';

const initCryptoCompare = () => {
  Pair.find({}, (err, pairs) => {
    cryptocompare.addSubs(pairs.map(({ pair }) => pair));
  });
};

const initSockets = () => {
  initCryptoCompare();
};

export default { initSockets };
