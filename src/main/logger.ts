/**
 * Debug logging system using electron-log
 * Provides file-based logging with rotation and timestamps
 */

import log from 'electron-log';

// Configure electron-log
log.transports.file.maxSize = 5 * 1024 * 1024; // 5MB max file size
log.transports.file.format = '{y}-{m}-{d} {h}:{i}:{s}.{ms} [{level}] {text}';
log.transports.console.format = '{y}-{m}-{d} {h}:{i}:{s}.{ms} [{level}] {text}';

// Keep up to 3 old log files
log.transports.file.archiveLogFn = (oldLogFile: log.LogFile) => {
  const file = oldLogFile as any;
  if (file.path) {
    const fs = require('fs');
    try {
      fs.renameSync(file.path, `${file.path}.old`);
    } catch {
      // Ignore rename errors
    }
  }
};

export default log;
