import WebSocket from 'ws';
import ReconnectingWebSocket from 'reconnecting-websocket';
import handleMessage from '../sockets/handleMessage';

class HitBTC {
  initSocket(subs) {
    this.socket = new ReconnectingWebSocket('wss://api.hitbtc.com/api/2/ws', null, { constructor: WebSocket });

    this.socket.on('open', () => {
      console.log('CONNECTED TO HITBTC');
    });

    // this.socket.on('message', msg => handleMessage(msg, 'HITBTC'));
    this.socket.on('message', msg => console.log('DERP', msg));

    this.socket.on('close', () => {
      console.log('DISCONNECTED FROM HITBTC');
    });

    this.socket.on('error', (error) => {
      console.log('HITBTC ERROR', error);
      this.socket.close();
      this.initSocket();
    });
  }
}

export default new HitBTC();
