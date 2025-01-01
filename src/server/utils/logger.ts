import chalk from "chalk";
import * as fs from "fs";
import * as path from "path";

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
  logFilePath?: string;
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
    if (this.config.logFilePath) {
      // Ensure the log directory exists
      const dir = path.dirname(this.config.logFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
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

  private async writeToFile(message: string): Promise<void> {
    if (!this.config.logFilePath) return;

    try {
      await fs.promises.appendFile(this.config.logFilePath, message + "\n");
    } catch (error) {
      const errorMessage = `Failed to write to log file: ${
        (error as Error).message
      }`;
      console.error(chalk.red(errorMessage));
    }
  }

  async debug(message: string, ...args: unknown[]): Promise<void> {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    const formattedMessage = this.formatMessage("DEBUG", message);

    if (this.config.enableColors) {
      console.log(chalk.gray(formattedMessage), ...args);
    } else {
      console.log(formattedMessage, ...args);
    }

    await this.writeToFile(`${formattedMessage} ${args.join(" ")}`);
  }

  async info(message: string, ...args: unknown[]): Promise<void> {
    if (!this.shouldLog(LogLevel.INFO)) return;
    const formattedMessage = this.formatMessage("INFO", message);

    if (this.config.enableColors) {
      console.log(chalk.blue(formattedMessage), ...args);
    } else {
      console.log(formattedMessage, ...args);
    }

    await this.writeToFile(`${formattedMessage} ${args.join(" ")}`);
  }

  async warn(message: string, ...args: unknown[]): Promise<void> {
    if (!this.shouldLog(LogLevel.WARN)) return;
    const formattedMessage = this.formatMessage("WARN", message);

    if (this.config.enableColors) {
      console.warn(chalk.yellow(formattedMessage), ...args);
    } else {
      console.warn(formattedMessage, ...args);
    }

    await this.writeToFile(`${formattedMessage} ${args.join(" ")}`);
  }

  async error(
    message: string,
    error?: Error,
    ...args: unknown[]
  ): Promise<void> {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    const formattedMessage = this.formatMessage("ERROR", message);

    if (this.config.enableColors) {
      console.error(chalk.red(formattedMessage), error?.stack || "", ...args);
    } else {
      console.error(formattedMessage, error?.stack || "", ...args);
    }

    await this.writeToFile(
      `${formattedMessage} ${error?.stack || ""} ${args.join(" ")}`
    );
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

  setLogFile(filePath: string): void {
    this.config.logFilePath = filePath;
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

const logger = new Logger({
  level:
    process.env.NODE_ENV === "development" ? LogLevel.DEBUG : LogLevel.INFO,
  enableTimestamp: true,
  enableColors: true,
  logFilePath: process.env.LOG_FILE_PATH,
});

export { LogLevel, logger };
