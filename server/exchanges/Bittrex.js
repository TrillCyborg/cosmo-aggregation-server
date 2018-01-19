import bittrex from 'node.bittrex.api';
import handleMessage from '../sockets/handleMessage';

// bittrex.options({
//   verbose: true,
// });

class Bittrex {
  initSocket(subs) {
    const subsForBittrex = subs.map((sub) => {
      const pair = sub.split('-');
      return `${pair[1]}-${pair[0]}`;
    });
    bittrex.websockets.client(() => {
      console.log('CONNECTED TO BITTREX');
      bittrex.websockets.subscribe(subsForBittrex, msg => handleMessage(msg, 'BITTREX'));
    });
  }
}

export default new Bittrex();
