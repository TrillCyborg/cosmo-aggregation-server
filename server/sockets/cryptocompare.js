import io from 'socket.io-client';
import cryptocompareLib from '../lib/cryptocompare';

const socket = io.connect('wss://streamer.cryptocompare.com');

socket.on('m', cryptocompareLib.handleMessage);

const addSubs = subs => socket.emit('SubAdd', { subs: subs.map(cryptocompareLib.getSubString) });
const removeSubs = subs => socket.emit('SubRemove', { subs: subs.map(cryptocompareLib.getSubString) });

export default { addSubs, removeSubs };
