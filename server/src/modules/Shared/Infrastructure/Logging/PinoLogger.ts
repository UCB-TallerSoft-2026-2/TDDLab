import { pino } from "pino";
import { ILogger } from "../../Domain/Logging/ILogger";

const loggerBase = pino({
  transport: process.env.NODE_ENV !== 'production'  ? {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
      singleLine: false
    },
  } : undefined,
});

export class PinoLogger implements ILogger{
  constructor(private readonly logger = loggerBase) { }
  info(message: string, meta?: object): void {
    this.logger.info(meta, message);
  }
  error(message: string, meta?: object): void {
    this.logger.error(meta, message);
  }
  debug(message: string, meta?: object): void {
    this.logger.debug(meta, message);
  }
  warn(message: string, meta?: object): void {
    this.logger.warn(meta, message);
  }
  child(context: string): ILogger {
    return new PinoLogger(this.logger.child({ context }));
  }
}
