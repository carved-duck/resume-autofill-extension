/**
 * Logging utility with configurable log levels
 * Reduces console spam and provides structured logging
 */

class Logger {
    constructor() {
        this.levels = {
            DEBUG: 0,
            INFO: 1,
            WARN: 2,
            ERROR: 3,
            NONE: 4
        };
        
        // Set default log level - check for config
        const configLevel = window.LOG_LEVEL_CONFIG || 'INFO';
        this.currentLevel = this.levels[configLevel] || this.levels.INFO;
        
        // Track logged messages to prevent duplicates
        this.messageCache = new Map();
        this.cacheTimeout = 5000; // 5 seconds
    }
    
    setLevel(level) {
        if (typeof level === 'string') {
            this.currentLevel = this.levels[level.toUpperCase()] || this.levels.INFO;
        } else {
            this.currentLevel = level;
        }
    }
    
    shouldLog(level) {
        return level >= this.currentLevel;
    }
    
    isDuplicate(message) {
        const key = typeof message === 'string' ? message : JSON.stringify(message);
        const now = Date.now();
        
        if (this.messageCache.has(key)) {
            const lastLogged = this.messageCache.get(key);
            if (now - lastLogged < this.cacheTimeout) {
                return true;
            }
        }
        
        this.messageCache.set(key, now);
        return false;
    }
    
    cleanCache() {
        const now = Date.now();
        for (const [key, timestamp] of this.messageCache.entries()) {
            if (now - timestamp > this.cacheTimeout) {
                this.messageCache.delete(key);
            }
        }
    }
    
    formatMessage(level, emoji, message) {
        const timestamp = new Date().toLocaleTimeString();
        return `[${timestamp}] ${emoji} ${message}`;
    }
    
    summarizeObject(obj, maxKeys = 3) {
        if (!obj || typeof obj !== 'object') return obj;
        
        const keys = Object.keys(obj);
        if (keys.length <= maxKeys) {
            return obj;
        }
        
        const summary = {};
        keys.slice(0, maxKeys).forEach(key => {
            const value = obj[key];
            if (typeof value === 'string' && value.length > 50) {
                summary[key] = value.substring(0, 50) + '...';
            } else if (Array.isArray(value)) {
                summary[key] = `Array(${value.length})`;
            } else if (typeof value === 'object' && value !== null) {
                summary[key] = `Object(${Object.keys(value).length} keys)`;
            } else {
                summary[key] = value;
            }
        });
        
        if (keys.length > maxKeys) {
            summary['...'] = `+${keys.length - maxKeys} more keys`;
        }
        
        return summary;
    }
    
    debug(message, data = null) {
        if (!this.shouldLog(this.levels.DEBUG)) return;
        
        const fullMessage = data ? `${message}: ${JSON.stringify(this.summarizeObject(data))}` : message;
        if (this.isDuplicate(fullMessage)) return;
        
        console.log(this.formatMessage('DEBUG', '🔍', message));
        if (data) console.log(this.summarizeObject(data));
    }
    
    info(message, data = null) {
        if (!this.shouldLog(this.levels.INFO)) return;
        
        const fullMessage = data ? `${message}: ${JSON.stringify(this.summarizeObject(data))}` : message;
        if (this.isDuplicate(fullMessage)) return;
        
        console.log(this.formatMessage('INFO', '✅', message));
        if (data) console.log(this.summarizeObject(data));
    }
    
    warn(message, data = null) {
        if (!this.shouldLog(this.levels.WARN)) return;
        
        console.warn(this.formatMessage('WARN', '⚠️', message));
        if (data) console.warn(this.summarizeObject(data));
    }
    
    error(message, data = null) {
        if (!this.shouldLog(this.levels.ERROR)) return;
        
        console.error(this.formatMessage('ERROR', '❌', message));
        if (data) console.error(data); // Show full error data
    }
    
    success(message, data = null) {
        if (!this.shouldLog(this.levels.INFO)) return;
        
        const fullMessage = data ? `${message}: ${JSON.stringify(this.summarizeObject(data))}` : message;
        if (this.isDuplicate(fullMessage)) return;
        
        console.log(this.formatMessage('SUCCESS', '🎯', message));
        if (data) console.log(this.summarizeObject(data));
    }
    
    group(title, callback) {
        if (!this.shouldLog(this.levels.INFO)) return;
        
        console.group(title);
        try {
            callback();
        } finally {
            console.groupEnd();
        }
    }
    
    // Cleanup cache periodically
    startCleanup() {
        setInterval(() => this.cleanCache(), 10000); // Every 10 seconds
    }
}

// Create global logger instance
const logger = new Logger();
logger.startCleanup();

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = logger;
} else if (typeof window !== 'undefined') {
    window.logger = logger;
}