import Pair from '../models/pair.model';
import CryptoCompare from '../sockets/CryptoCompare';

function validatePair(pair) {
  if (pair && pair.indexOf('-') !== -1) {
    const currencies = pair.split('-');
    if (currencies.length === 2 && currencies[0].length && currencies[1].length) {
      return true;
    }
  }
  return false;
}

function add(req, res) {
  const { pair } = req.body;
  if (validatePair(pair)) {
    return Pair.findOne({ pair }, (err, p) => {
      if (err) {
        console.log('ERROR', err);
        return res.status(500).send(`ERROR: ${err}`);
      }
      if (!p) {
        const newPair = new Pair({ pair });
        return newPair.save((err) => {
          if (err) {
            console.log('ERROR', err);
            return res.status(500).send(`ERROR: ${err}`);
          }
          CryptoCompare.addSubs([pair]);
          return res.json({ success: true, type: 'ADD', pair });
        });
      }
      return res.json({ success: true, type: 'ADD', pair, message: 'already exists' });
    });
  }
  return res.json({ success: false, error: 'INVALID_PAIR' });
}

function remove(req, res) {
  const { pair } = req.body;
  if (validatePair(pair)) {
    return Pair.remove({ pair }, (err) => {
      if (err) {
        console.log('ERROR', err);
        return res.status(500).send(`ERROR: ${err}`);
      }
      CryptoCompare.removeSubs([pair]);
      return res.json({ success: true, type: 'REMOVE', pair });
    });
  }
  return res.json({ success: false, error: 'INVALID_PAIR' });
}

export default { add, remove };
