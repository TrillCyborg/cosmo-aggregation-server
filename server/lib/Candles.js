import BigNumber from 'bignumber.js';
import Candle from '../models/candle.model';

BigNumber.config({ DECIMAL_PLACES: 8 });

class Candles {
  constructor(type) {
    this.candles = {
      COSMO: {},
      CCCAGG: {},
      BITTREX: {},
      BINANCE: {},
      KUCOIN: {},
      YOBIT: {},
    };
    this.type = type;
  }

  getCandles() {
    return this.candles;
  }

  reset = ({ source, pair }) => ({
    open: 0,
    close: 0,
    high: 0,
    low: 0,
    volumeFrom: 0,
    volumeTo: 0,
    timestamp: 0,
    source,
    pair,
    type: this.type,
  })

  merge(candles, reset) {
    const { source, pair } = candles[0];
    if (reset) {
      this.candles[source][pair] = this.reset({ source, pair });
    }
    candles.forEach(({ open, close, high, low, volumeTo, volumeFrom }) => {
      if (volumeFrom) {
        const oldVolumeFrom = new BigNumber(this.candles[source][pair].volumeFrom.toFixed(8));
        const newVolumeFrom = new BigNumber(volumeFrom.toFixed(8));
        this.candles[source][pair].volumeFrom = oldVolumeFrom.plus(newVolumeFrom).toNumber();
      }
      if (volumeTo) {
        const oldVolumeTo = new BigNumber(this.candles[source][pair].volumeTo.toFixed(8));
        const newVolumeTo = new BigNumber(volumeTo.toFixed(8));
        this.candles[source][pair].volumeTo = oldVolumeTo.plus(newVolumeTo).toNumber();
      }
      if (open && this.candles[source][pair].open === 0) {
        this.candles[source][pair].open = open;
      }
      if (high && high > this.candles[source][pair].high) {
        this.candles[source][pair].high = high;
      }
      if (low && this.candles[source][pair].low === 0 || low < this.candles[source][pair].low) {
        this.candles[source][pair].low = low;
      }
      if (close) {
        this.candles[source][pair].close = close;
      }
    });
  }

  aggregateAverage({ time, from, resetParams }) {
    const to = this.reset(resetParams);
    let oldOpen = new BigNumber(to.open);
    let oldClose = new BigNumber(to.close);
    let oldHigh = new BigNumber(to.high);
    let oldLow = new BigNumber(to.low);
    from.forEach(({ open, close, high, low, volumeFrom, volumeTo }) => {
      if (volumeFrom) {
        const oldVolumeFrom = new BigNumber(to.volumeFrom.toFixed(8));
        const newVolumeFrom = new BigNumber(volumeFrom.toFixed(8));
        to.volumeFrom = oldVolumeFrom.plus(newVolumeFrom).toNumber();
      }
      if (volumeTo) {
        const oldVolumeTo = new BigNumber(to.volumeTo.toFixed(8));
        const newVolumeTo = new BigNumber(volumeTo.toFixed(8));
        to.volumeTo = oldVolumeTo.plus(newVolumeTo).toNumber();
      }
      oldOpen = oldOpen.plus(open.toFixed(8));
      oldClose = oldClose.plus(close.toFixed(8));
      oldHigh = oldHigh.plus(high.toFixed(8));
      oldLow = oldLow.plus(low.toFixed(8));
    });

    to.open = oldOpen.div(from.length).toNumber();
    to.close = oldClose.div(from.length).toNumber();
    to.high = oldHigh.div(from.length).toNumber();
    to.low = oldLow.div(from.length).toNumber();
    to.timestamp = time;
    return to;
  }

  aggregateGlobal(time) {
    this.candles.COSMO = {};
    const markets = {};
    Object.keys(this.candles).forEach((source) => {
      Object.keys(this.candles[source]).forEach((pair) => {
        if (!markets[pair]) {
          markets[pair] = [];
        }
        markets[pair].push(this.candles[source][pair]);
      });
    });
    Object.keys(markets).forEach((pair) => {
      this.candles.COSMO[pair] = this.aggregateAverage({
        from: markets[pair],
        resetParams: {
          source: 'COSMO',
          pair,
        },
        time,
      });
    });
  }

  saveAll = (time) => Promise.resolve()
    .then(() => this.aggregateGlobal(time))
    .then(() => Promise.all(Object.keys(this.candles).map((source) =>
      Promise.all(Object.keys(this.candles[source]).map((pair) => new Promise((resolve, reject) => {
        this.candles[source][pair].timestamp = time;
          const { open, close, high, low, volumeTo, volumeFrom } = this.candles[source][pair];
          if (open && close && high && low && volumeTo && volumeFrom && source !== 'CCCAGG') {
            return Candle.create(this.candles[source][pair], (err, candle) => {
              if (err) {
                console.log('ERROR:', err);
                return reject();
              }
              this.candles[source][pair] = this.reset({ source, pair });
              resolve();
            })
          }
          this.candles[source][pair] = this.reset({ source, pair });
          resolve();
        })))
      )))

  update({ base, quote, price, volumeFrom, volumeTo, source }) {
    const pair = `${base}-${quote}`;
    if (!this.candles[source][pair]) {
      this.candles[source][pair] = this.reset({ source, pair });
    }
    this.merge([{
      open: price,
      close: price,
      high: price,
      low: price,
      volumeTo,
      volumeFrom,
      source,
      pair
    }]);
  }
}

const minCandles = new Candles('min');
const hourCandles = new Candles('hour');
const dayCandles = new Candles('day');

export default Candles;
export {
  minCandles,
  hourCandles,
  dayCandles,
};
