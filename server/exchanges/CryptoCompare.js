import io from 'socket.io-client';
import cryptocompareLib from '../lib/cryptocompare';
import handleMessage from '../sockets/handleMessage';

class CryptoCompare {
  initSocket(subs) {
    this.socket = io.connect('wss://streamer.cryptocompare.com');
    console.log('CONNECTED TO CCCAGG');
    this.socket.on('m', msg => handleMessage(msg, 'CCCAGG'));
    this.addSubs(subs);
  }

  addSubs(subs) {
    this.socket.emit('SubAdd', { subs: subs.map(cryptocompareLib.getSubString) });
  }

  removeSubs(subs) {
    this.socket.emit('SubRemove', { subs: subs.map(cryptocompareLib.getSubString) });
  }
}

export default new CryptoCompare();