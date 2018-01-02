import CCC from '../util/CryptoCompareConvert';
import pushLib from './push';
import candleLib from './candle';

const getSubString = (pair) => {
  const currencies = pair.split('-');
  return `5~CCCAGG~${currencies[0]}~${currencies[1]}`;
};

function handleMessage(message) {
  const messageType = message.substring(0, message.indexOf('~'));
  let res = {};
  if (messageType === CCC.STATIC.TYPE.CURRENTAGG) {
    res = CCC.CURRENT.unpack(message);
    const {
      FROMSYMBOL: base,
      TOSYMBOL: quote,
      PRICE: price,
      LASTVOLUME: volumeFrom,
      LASTVOLUMETO: volumeTo,
      // MARKET: exchange,
    } = res;
    // console.log(`${base}-${quote} ${price} ${volumeTo}`);
    candleLib.updateCandles({ base, quote, price, volumeFrom, volumeTo, source: 'CCCAGG' });
    if (price) {
      pushLib.handlePriceupdate({ price, base, quote });
    }
  }
}

export default {
  getSubString,
  handleMessage,
};
