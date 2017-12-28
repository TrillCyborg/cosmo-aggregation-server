import Pair from '../models/pair.model';
import CryptoCompare from './CryptoCompare';

const initCryptoCompare = () => {
  Pair.find({}, (err, pairs) => {
    CryptoCompare.addSubs(pairs.map(({ pair }) => pair));
  });
};

const initSockets = () => {
  initCryptoCompare();
};

export default { initSockets };
