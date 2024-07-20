import { createLogger, format, transports } from 'winston';
import os from 'os';
import dotenv from 'dotenv';
dotenv.config();
import 'winston-syslog';

const papertrail = new transports.Syslog({
	host: process.env.PAPERTRAIL_HOST,
	port: process.env.PAPERTRAIL_PORT,
	protocol: 'tls4',
	localhost: os.hostname(),
	eol: '\n',
});

const logger = createLogger({
	format: format.combine(
		format.splat(),
		format.timestamp({
			format: 'YYYY-MM-DD HH:mm:ss'
		}),
		format.colorize(),
		format.printf(
			log => {
				if (log.stack) return `[${log.timestamp}] [${log.level}] ${log.stack}`;
				return `[${log.timestamp}] [${log.level}] ${log.message}`;
			},
		),
	),
	transports: [
		new transports.Console(),
		papertrail
	]
});

export default logger;
