const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class Logger extends EventEmitter {
  constructor() {
    super();
    this.logs = [];
    this.maxLogs = 500;
    this.logFile = null;

    this.initLogFile();
  }

  initLogFile() {
    try {
      const userDataPath = app.getPath('userData');
      const logsDir = path.join(userDataPath, 'logs');
      
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      const date = new Date().toISOString().split('T')[0];
      this.logFile = path.join(logsDir, `macdpi-${date}.log`);
    } catch (e) {
      // Log file init failed, continue without file logging
    }
  }

  log(message, level = 'info') {
    const entry = {
      time: new Date().toISOString(),
      message: String(message),
      level
    };

    this.logs.push(entry);

    // Trim old logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Emit to renderer
    this.emit('log', entry);

    // Console output
    const prefix = level === 'error' ? '❌' : level === 'warning' ? '⚠️' : level === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${entry.time}] ${message}`);

    // Write to file
    this.writeToFile(entry);
  }

  writeToFile(entry) {
    if (!this.logFile) return;

    try {
      const line = `[${entry.time}] [${entry.level.toUpperCase()}] ${entry.message}\n`;
      fs.appendFileSync(this.logFile, line);
    } catch (e) {
      // File write failed, non-critical
    }
  }

  getLogs() {
    return [...this.logs];
  }

  clear() {
    this.logs = [];
  }
}

module.exports = Logger;
