import _ from 'lodash';
import CCC from '../util/CryptoCompareConvert';
import pushLib from '../lib/push';
import candleLib from '../lib/candle';
import { SUPPORTED_QUOTES } from '../../consts';

const messageMaps = {
  CCCAGG: (msg) => {
    const messageType = msg.substring(0, msg.indexOf('~'));
    let res = {};
    if (messageType === CCC.STATIC.TYPE.CURRENTAGG) {
      res = CCC.CURRENT.unpack(msg);
      return [{
        base: res.FROMSYMBOL,
        quote: res.TOSYMBOL,
        price: res.PRICE,
        volumeFrom: res.LASTVOLUME,
        volumeTo: res.LASTVOLUMETO,
        type: 'quote',
      }];
    }
    return [{ type: 'unknown' }];
  },
  BITTREX: (msg) => {
    if (msg.M === 'updateExchangeState') {
      return _.flatten(msg.A.map((marketData) => {
        if (marketData.Fills && marketData.Fills.length) {
          const pair = marketData.MarketName.split('-');
          return marketData.Fills.map(fill => ({
            base: pair[1],
            quote: pair[0],
            price: fill.Rate,
            volumeFrom: fill.Quantity,
            volumeTo: fill.Quantity * fill.Rate,
            type: 'quote',
          }));
        }
        return [{ type: 'unknown' }];
      }));
    }
    return [{ type: 'unknown' }];
  },
  BINANCE: (msg) => {
    const message = JSON.parse(msg);
    if (message.data && message.data.e && message.data.e === 'aggTrade') {
      let index;
      SUPPORTED_QUOTES.BINANCE.forEach((quote) => {
        const i = message.data.s.indexOf(quote);
        if (i > 0) {
          index = i;
        }
      });
      const base = message.data.s.slice(0, index);
      const quote = message.data.s.slice(index);
      return [{
        base,
        quote,
        price: message.data.p,
        volumeFrom: message.data.q,
        volumeTo: message.data.q * message.data.p,
        type: 'quote',
      }]
    } else {
      return [{ type: 'unknown' }];
    }
  },
  KUCOIN: null,
};

function handleMessage(msg, ex) {
  const messages = messageMaps[ex](msg);
  if (messages && messages.length) {
    messages.forEach((data) => {
      if (data.type === 'quote') {
        console.log('QUOTE', JSON.stringify({ ...data, source: ex }, null, 4));
        candleLib.updateCandles({ ...data, source: ex });
        if (data.price) {
          pushLib.handlePriceUpdate({ ...data, source: ex });
        }
      } else if (data.type === 'candle') {
        console.log('CANDLE', JSON.stringify({ ...data, source: ex }, null, 4));
        // candleLib.setCandles({ ...data, source: ex });
        // pushLib.handleCandleUpdate({ ...data, source: ex });
      }
    });
  }
}

export default handleMessage;
