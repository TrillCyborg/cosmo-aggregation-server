import io from 'socket.io-client';
import cryptocompareLib from '../lib/cryptocompare';
import handleMessage from './handleMessage';

class CryptoCompare {
  constructor() {
    this.socket = io.connect('wss://streamer.cryptocompare.com');
    this.socket.on('m', msg => handleMessage(msg, 'CCCAGG'));
  }

  addSubs(subs) {
    this.socket.emit('SubAdd', { subs: subs.map(cryptocompareLib.getSubString) });
  }

  removeSubs(subs) {
    this.socket.emit('SubRemove', { subs: subs.map(cryptocompareLib.getSubString) });
  }
}

export default new CryptoCompare();
