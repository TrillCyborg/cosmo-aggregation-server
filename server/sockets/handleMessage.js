// @flow
import _ from 'lodash';
import BigNumber from 'bignumber.js';
import CCC from '../util/CryptoCompareConvert';
// import pushLib from '../lib/push';
import { minCandles } from '../lib/Candles';
import { lastPrices } from '../lib/Prices';
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
        price: parseFloat(res.PRICE),
        volumeFrom: parseFloat(res.LASTVOLUME),
        volumeTo: parseFloat(res.LASTVOLUMETO),
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
          return marketData.Fills.map((fill) => {
            const price = new BigNumber(fill.Rate);
            const quantity = new BigNumber(fill.Quantity);
            return {
              base: pair[1],
              quote: pair[0],
              price: price.toNumber(),
              volumeFrom: quantity.toNumber(),
              volumeTo: price.times(quantity).toNumber(),
              type: 'quote',
            };
          });
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
      const price = new BigNumber(message.data.p);
      const quantity = new BigNumber(message.data.q);
      return [{
        base,
        quote,
        price: price.toNumber(),
        volumeFrom: quantity.toNumber(),
        volumeTo: price.times(quantity).toNumber(),
        type: 'quote',
      }];
    }
    return [{ type: 'unknown' }];
  },
  YOBIT: null,
  KUCOIN: null,
  HITBTC: null,
};

function handleMessage(msg, ex) {
  const messages = messageMaps[ex](msg);
  if (messages && messages.length) {
    messages.forEach((message) => {
      const data = { ...message, source: ex };
      if (message.type === 'quote') {
        // console.log('QUOTE', JSON.stringify(data, null, 4));
        minCandles.update(data);
        lastPrices.update({
          source: ex,
          value: message.price,
          pair: `${message.base}-${message.quote}`,
        });
        // if (message.price) {
        //   pushLib.handlePriceUpdate(data);
        // }
        // if (ex !== 'CCCAGG') {
        //   backDataLib.handleData(data);
        // }
      } else if (message.type === 'candle') {
        console.log('CANDLE', JSON.stringify(data, null, 4));
        // minCandles.setCandles(data);
        // pushLib.handleCandleUpdate(data);
      }
    });
  }
}

export default handleMessage;
