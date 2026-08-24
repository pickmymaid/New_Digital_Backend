const winston = require("winston");
const path = require("path");
const { format } = require("winston");

// Define log file paths
const logFilePath = path.join(__dirname, "../logs/app.log");
const errorLogFilePath = path.join(__dirname, "../logs/error.log");

// Custom formatter to include stack trace and source information
const customFormat = format((info) => {
  if (info instanceof Error) {
    // Attach stack trace to the log
    info.message = `${info.message}\nStack trace:\n${info.stack}`;
  }
  return info;
});

// Create logger
const logger = winston.createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    customFormat(),
    format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      ),
    }),
    // NOTE: For production, we recommend adding 'winston-daily-rotate-file'
    // to prevent these files from growing indefinitely.
    new winston.transports.File({ filename: logFilePath, maxsize: 10 * 1024 * 1024, maxFiles: 5 }), // 10MB rotation
    new winston.transports.File({ filename: errorLogFilePath, level: "error", maxsize: 5 * 1024 * 1024, maxFiles: 5 }),
  ],
});

// Helper function to log error with source context
const logErrorWithSource = (error, meta) => {
  const errorDetails = {
    message: error.message || "Unknown error",
    stack: error.stack || "No stack trace available",
    timestamp: new Date().toISOString(),
  };

  // Extract source details (file name, line, and column) from the stack trace
  if (error.stack) {
    const stackLines = error.stack.split("\n");
    if (stackLines.length > 1) {
      const sourceMatch = stackLines[1].match(/\((.*):(\d+):(\d+)\)/); // Extract file, line, column
      if (sourceMatch) {
        errorDetails.file = sourceMatch[1];
        errorDetails.line = sourceMatch[2];
        errorDetails.column = sourceMatch[3];
      }
    }
  }

  logger.error(errorDetails, meta);
};

module.exports = logger;
module.exports.logErrorWithSource = logErrorWithSource;
