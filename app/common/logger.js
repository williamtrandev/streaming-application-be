import { createLogger, format, transports } from 'winston';

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
		// new transports.File({ filename: 'combined.log' })
	]
});

export default logger;
