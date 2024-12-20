import chalk from "chalk";

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LoggerConfig {
  level: LogLevel;
  enableTimestamp?: boolean;
  enableColors?: boolean;
}

class Logger {
  private config: LoggerConfig;

  constructor(
    config: LoggerConfig = {
      level: LogLevel.INFO,
      enableTimestamp: true,
      enableColors: true,
    }
  ) {
    this.config = config;
  }

  private formatMessage(level: string, message: string): string {
    const timestamp = this.config.enableTimestamp
      ? `[${new Date().toISOString()}] `
      : "";
    return `${timestamp}[${level}] ${message}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  debug(message: string, ...args: unknown[]): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    const formattedMessage = this.formatMessage("DEBUG", message);
    if (this.config.enableColors) {
      console.log(chalk.gray(formattedMessage), ...args);
    } else {
      console.log(formattedMessage, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    const formattedMessage = this.formatMessage("INFO", message);
    if (this.config.enableColors) {
      console.log(chalk.blue(formattedMessage), ...args);
    } else {
      console.log(formattedMessage, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    const formattedMessage = this.formatMessage("WARN", message);
    if (this.config.enableColors) {
      console.warn(chalk.yellow(formattedMessage), ...args);
    } else {
      console.warn(formattedMessage, ...args);
    }
  }

  error(message: string, error?: Error, ...args: unknown[]): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    const formattedMessage = this.formatMessage("ERROR", message);
    if (this.config.enableColors) {
      console.error(chalk.red(formattedMessage), error?.stack || "", ...args);
    } else {
      console.error(formattedMessage, error?.stack || "", ...args);
    }
  }

  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  enableTimestamp(enable: boolean): void {
    this.config.enableTimestamp = enable;
  }

  enableColors(enable: boolean): void {
    this.config.enableColors = enable;
  }
}

const logger = new Logger({
  level:
    process.env.NODE_ENV === "development" ? LogLevel.DEBUG : LogLevel.INFO,
  enableTimestamp: true,
  enableColors: true,
});

export { LogLevel, logger };
