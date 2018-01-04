import WebSocket from 'ws';
import handleMessage from './handleMessage';

class Binance {
  addSubs(subs) {
    const subsString = subs.map(sub => `${sub.split('-').join('').toLowerCase()}@kline_1m/`).join('');

    this.socket = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${subsString.slice(0, subsString.length - 1)}`, {
      perMessageDeflate: false
    });

    this.socket.on('open', () => {
      console.log('CONNECTED TO BINANCE');
    });

    this.socket.on('message', msg => handleMessage(msg, 'BINANCE'));

    this.socket.on('close', () => {
      console.log('DISCONNECTED FROM BINANCE');
    });
  }
}

export default new Binance();
