import _ from 'lodash';
import Expo from 'expo-server-sdk';
import Alert from '../models/alert.model';
import Users from '../models/user.model';

const expo = new Expo();

const prices = {};

function sendPriceAlerts(alerts) {
  const userIds = alerts.map(({ userId }) => userId);
  Users.find({ _id: { $in: userIds } }, (err, users) => {
    if (err) {
      console.log('ERROR', err);
    }
    const notifications = [];

    users.forEach((user) => {
      _.filter(alerts, { userId: user._id }).forEach((alert) => {
        const currencies = alert.pair.split('-');
        notifications.push({
          to: user.pushToken,
          sound: 'default',
          body: `${currencies[0]} is at ${alert.price} ${currencies[1]}`,
        });
        if (!alert.repeat) {
          alert.remove((err) => {
            if (err) {
              console.log('ERROR', err);
            }
          });
        }
      });
    });

    console.log('NOTIFICATIONS', notifications);

    const chunks = expo.chunkPushNotifications(notifications);
    const promises = chunks.map(chunk => Promise.resolve()
      .then(() => expo.sendPushNotificationsAsync(chunk))
      .then(receipts => console.log(receipts))
      .catch(error => console.error(error)));

    Promise.all(promises);
  });
}

function processAlerts(pair, pricesToCheck) {
  Alert.find({
    pair,
    price: {
      $gte: pricesToCheck.gt,
      $lte: pricesToCheck.lt
    }
  }, (err, alerts) => {
    if (err) {
      return console.log('ERROR', err);
    }
    if (alerts && alerts.length) {
      sendPriceAlerts(alerts);
    }
  });
}

function handlePriceupdate({ price, base, quote }) {
  if (prices[`${base}-${quote}`]) {
    const pricesToCheck = {};
    // console.log(`${base}-${quote}`, price, prices[`${base}-${quote}`]);
    if (price > prices[`${base}-${quote}`]) {
      pricesToCheck.gt = prices[`${base}-${quote}`];
      pricesToCheck.lt = price;
    } else {
      pricesToCheck.gt = price;
      pricesToCheck.lt = prices[`${base}-${quote}`];
    }
    processAlerts(`${base}-${quote}`, pricesToCheck);
  }
  prices[`${base}-${quote}`] = price;
}

export default {
  sendPriceAlerts,
  processAlerts,
  handlePriceupdate,
};
