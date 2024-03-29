import WebSocket from 'ws';
import ReconnectingWebSocket from 'reconnecting-websocket';
import handleMessage from '../sockets/handleMessage';

class Binance {
  initSocket(subs) {
    const subsString = subs.map(sub => `${sub.split('-').join('').toLowerCase()}@aggTrade/`).join('');
    const url = `wss://stream.binance.com:9443/stream?streams=${subsString.slice(0, subsString.length - 1)}`;

    this.socket = new ReconnectingWebSocket(url, null, { constructor: WebSocket });

    this.socket.on('open', () => {
      console.log('CONNECTED TO BINANCE');
    });

    this.socket.on('message', msg => handleMessage(msg, 'BINANCE'));

    this.socket.on('close', () => {
      console.log('DISCONNECTED FROM BINANCE');
      this.initSocket(subs);
    });

    this.socket.on('error', (error) => {
      console.log('BINANCE ERROR', error);
      this.socket.close();
    });
  }
}

export default new Binance();


// MAP FOR KLINES
// BINANCE: (msg) => {
//   const message = JSON.parse(msg);
//   if (message.data && message.data.e && message.data.e === 'kline') {
//     const kline = message.data.k;
//     if (kline.x) {
//       let index;
//       SUPPORTED_QUOTES.BINANCE.forEach((quote) => {
//         const i = message.data.s.indexOf(quote);
//         if (i > 0) {
//           index = i;
//         }
//       });
//       const base = message.data.s.slice(0, index);
//       const quote = message.data.s.slice(index);
//       return [{
//         base,
//         quote,
//         open: kline.o,
//         close: kline.c,
//         high: kline.h,
//         low: kline.l,
//         volumeFrom: kline.v,
//         volumeTo: kline.q,
//         type: 'candle',
//       }];
//     }
//   }
//   return [{ type: 'unknown' }];
// },
