import Candle from '../models/candle.model';

const candles = {
  CCCAGG: {},
  BITTREX: {},
  BINANCE: {},
};
const timers = [
  { timeDiff: 60, type: 'min' },
  // { timeDiff: 3600, type: 'hour' },
  // { timeDiff: 86400, type: 'day' },
];

const resetCandle = ({ type, source, pair }) => ({
  open: 0,
  close: 0,
  high: 0,
  low: 0,
  volumeFrom: 0,
  volumeTo: 0,
  timestamp: 0,
  type,
  source,
  pair,
});

function saveCandle(type) {
  const time = Math.floor(Date.now() / 1000);
  Object.keys(candles).forEach((source) => {
    Object.keys(candles[source]).forEach((pair) => {
      candles[source][pair].timestamp = time;
      console.log(`${type.toUpperCase()} CANDLE: ${pair}`, JSON.stringify(candles[source][pair], null, 4));
      Candle.create(candles[source][pair], (err, candle) => {
        if (err) {
          console.log('ERROR:', err);
        }
      });
      candles[source][pair] = resetCandle({ type, source, pair });
    });
  });
}

function candleTimer({ timeDiff, type }) {
  const time = Math.floor(Date.now() / 1000);
  if (time % timeDiff !== 0) {
    return setTimeout(() => candleTimer({ timeDiff, type }), 1000);
  }
  return setInterval(() => saveCandle(type), timeDiff * 1000);
}

function updateCandles({ base, quote, price, volumeFrom, volumeTo, source }) {
  const pair = `${base}-${quote}`;
  timers.forEach(({ type }) => {
    if (!candles[source][pair]) {
      candles[source][pair] = resetCandle({ type, source, pair });
    }
    if (volumeFrom) {
      candles[source][pair].volumeFrom += volumeFrom;
    }
    if (volumeTo) {
      candles[source][pair].volumeTo += volumeTo;
    }
    if (price) {
      if (candles[source][pair].open === 0) {
        candles[source][pair].open = price;
      }
      if (price > candles[source][pair].high) {
        candles[source][pair].high = price;
      }
      if (candles[source][pair].low === 0 || price < candles[source][pair].low) {
        candles[source][pair].low = price;
      }
      candles[source][pair].close = price;
    }
    // console.log(`${base}-${quote} (${exchange}) Price: ${price}, Volume: ${candles[source][pair].volumeFrom}`);
  });
}

timers.forEach(candleTimer);

export default { updateCandles };
