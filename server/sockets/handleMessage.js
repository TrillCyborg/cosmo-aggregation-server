import _ from 'lodash';
import CCC from '../util/CryptoCompareConvert';
import pushLib from '../lib/push';
import candleLib from '../lib/candle';

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
        type: 'candle',
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
            type: 'candle',
          }));
        }
        return [{ type: 'unknown' }];
      }));
    }
    return [{ type: 'unknown' }];
  },
  BINANCE: (msg) => {
    console.log(JSON.stringify(JSON.parse(msg), null, 4));
  },
  KUCOIN: null,
};

function handleMessage(msg, ex) {
  const messages = messageMaps[ex](msg);
  if (messages && messages.length) {
    messages.forEach(({ base, quote, price, volumeTo, volumeFrom, type }) => {
      if (type === 'candle') {
        console.log({ base, quote, price, volumeFrom, volumeTo, source: ex });
        candleLib.updateCandles({ base, quote, price, volumeFrom, volumeTo, source: ex });
        if (price) {
          pushLib.handlePriceupdate({ price, base, quote });
        }
      }
    });
  }
}

export default handleMessage;
