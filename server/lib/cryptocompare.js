import CCC from '../util/CryptoCompareConvert';
import pushLib from './push';

const prices = {};

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
    } = res;
    if (price) {
      if (prices[`${base}-${quote}`]) {
        const pricesToCheck = {};
        console.log(`${base}-${quote}`, price, prices[`${base}-${quote}`]);
        if (price > prices[`${base}-${quote}`]) {
          pricesToCheck.gt = prices[`${base}-${quote}`];
          pricesToCheck.lt = price;
        } else {
          pricesToCheck.gt = price;
          pricesToCheck.lt = prices[`${base}-${quote}`];
        }
        pushLib.processAlerts(`${base}-${quote}`, pricesToCheck);
      }
      prices[`${base}-${quote}`] = price;
    }
  }
}

export default {
  getSubString,
  handleMessage,
};
