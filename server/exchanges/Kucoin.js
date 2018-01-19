import axios from 'axios';

class Kucoin {
  getLastPrices = () => axios.get('https://api.kucoin.com/v1/open/tick')
    .then(({ data }) => {
      const lastPrices = {};
      data.data.forEach(({ coinType, lastDealPrice, coinTypePair }) => {
        lastPrices[`${coinType}-${coinTypePair}`] = lastDealPrice;
      });
      return lastPrices;
    })
}

export default new Kucoin();
