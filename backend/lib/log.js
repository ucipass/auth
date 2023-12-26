import { config } from "./config.js"
import winston from 'winston';
import util from 'util';


function transform(info, opts) {
  const args = info[Symbol.for('splat')];
  if (args) { info.message = util.format(info.message, ...args); }
  return info;
}

function utilFormatter() { return {transform}; }

const log = winston.createLogger({
    level: config.loglevel,
    format: winston.format.combine(
        winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss.SSS'}),
        utilFormatter(),     // <-- this is what changed
        winston.format.colorize(),
        winston.format.printf(({level, message, label, timestamp}) => `${timestamp} ${label || '-'} ${level}: ${message}`),
    ),
    transports: [
      new winston.transports.Stream({
        stream: process.stderr,
        level: config.loglevel,
      })
    ],
  });

export {log}