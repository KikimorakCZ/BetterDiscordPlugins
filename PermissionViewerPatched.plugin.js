/**
 * @name PermissionViewerPatched
 * @author Patched
 * @version 1.3.0
 * @description Patched version to safely wait for BDFDB
 */

module.exports = class PermissionViewerPatched {

    constructor() {
        this.name = "PermissionViewerPatched";
        this.author = "Patched";
        this.version = "1.3.0";
        this.description = "Patched PermissionViewer plugin for BetterDiscord that waits for BDFDB.";
    }

    // Called by BD when plugin is loaded
    load() {
        console.log(`[${this.name}] Loaded!`);
    }

    start() {
        // Wait for BDFDB to load
        if (!window.BDFDB) {
            console.log(`[${this.name}] Waiting for BDFDB...`);
            this._checkInterval = setInterval(() => {
                if (window.BDFDB) {
                    clearInterval(this._checkInterval);
                    this._checkInterval = null;
                    this.initialize();
                }
            }, 100);
        } else {
            this.initialize();
        }
    }

    initialize() {
        try {
            this.BDFDB = window.BDFDB;

            if (!this.BDFDB) {
                console.error(`[${this.name}] BDFDB not found after waiting!`);
                return;
            }

            console.log(`[${this.name}] BDFDB found, initializing plugin...`);

            // Example: store WebModules reference safely
            this.WebModules = this.BDFDB.WebModules || {};
            
            // Add your plugin logic here
            // Example: patch some permission related functions
            // this.BDFDB.Patcher.after(...);

            console.log(`[${this.name}] Plugin started successfully.`);
        } catch (err) {
            console.error(`[${this.name}] Error initializing plugin:`, err);
        }
    }

    stop() {
        try {
            // Cleanup code here
            if (this._checkInterval) clearInterval(this._checkInterval);

            // Example: remove patches if you used BDFDB.Patcher
            // this.BDFDB.Patcher.unpatchAll();

            console.log(`[${this.name}] Plugin stopped.`);
        } catch (err) {
            console.error(`[${this.name}] Error stopping plugin:`, err);
        }
    }
};
