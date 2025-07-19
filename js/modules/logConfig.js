/**
 * Logging Configuration
 * Change LOG_LEVEL to control console output verbosity
 */

// Log levels: DEBUG (most verbose), INFO, WARN, ERROR, NONE (silent)
const LOG_LEVEL = 'INFO'; // Change this to reduce output

// Initialize logger with configured level
if (window.logger) {
    window.logger.setLevel(LOG_LEVEL);
} else {
    // Set a flag for when logger loads
    window.LOG_LEVEL_CONFIG = LOG_LEVEL;
}

console.log(`🎛️ Logging configured: ${LOG_LEVEL} level`);

// Export for direct use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LOG_LEVEL };
}