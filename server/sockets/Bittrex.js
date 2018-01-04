import bittrex from 'node.bittrex.api';
import handleMessage from './handleMessage';

// bittrex.options({
//   verbose: true,
// });

class Bittrex {
  addSubs(subs) {
    const subsForBittrex = subs.map((sub) => {
      const pair = sub.split('-');
      return `${pair[1]}-${pair[0]}`;
    });
    bittrex.websockets.subscribe(subsForBittrex, msg => handleMessage(msg, 'BITTREX'));
  }
}

export default new Bittrex();
