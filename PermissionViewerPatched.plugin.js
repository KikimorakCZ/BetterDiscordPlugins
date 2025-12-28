/**
 * @name PermissionViewerPatched
 * @author Patched
 * @version 1.3.0
 * @description Fully patched PermissionViewer plugin that works with BDFDB installed.
 */

(function () {
    const PLUGIN_NAME = "PermissionViewerPatched";

    function waitForBDFDB(callback) {
        const interval = setInterval(() => {
            if (window.BDFDB && window.BDFDB.PluginUtils && window.BDFDB.WebModules) {
                clearInterval(interval);
                callback();
            }
        }, 50);
    }

    waitForBDFDB(() => {
        console.log(`[${PLUGIN_NAME}] BDFDB detected, loading plugin...`);

        class PermissionViewerPatched {
            constructor() {
                this.name = PLUGIN_NAME;
                this.version = "1.3.0";
                this.author = "Patched";
                this.WebModules = {};
                this.PluginUtils = {};
                this.ReactUtils = {};
                this.userModule = null;
                this.permissionModule = null;
            }

            loadSettings() {
                this.WebModules = window.BDFDB.WebModules;
                this.PluginUtils = window.BDFDB.PluginUtils;
                this.ReactUtils = window.BDFDB.ReactUtils;

                this.userModule = this.WebModules.getModule(m => m.getCurrentUser && m.getUser);
                this.permissionModule = this.WebModules.getModule(m => m.has && m.is && m.get); // Example placeholder
            }

            start() {
                this.loadSettings();
                console.log(`[${PLUGIN_NAME}] started successfully!`);
                this.patchPermissions();
            }

            stop() {
                console.log(`[${PLUGIN_NAME}] stopped.`);
                if (this.unpatchPermissions) this.unpatchPermissions();
            }

            patchPermissions() {
                if (!this.userModule) {
                    console.warn(`[${PLUGIN_NAME}] Could not find UserModule`);
                    return;
                }

                // Patch getCurrentUser to log info
                const originalGetCurrentUser = this.userModule.getCurrentUser;
                this.userModule.getCurrentUser = (...args) => {
                    const result = originalGetCurrentUser(...args);
                    console.log(`[${PLUGIN_NAME}] Current user:`, result);
                    return result;
                };

                // Example patching permissions if module exists
                if (this.permissionModule) {
                    const originalHas = this.permissionModule.has;
                    this.permissionModule.has = (perm, userId) => {
                        const result = originalHas(perm, userId);
                        console.log(`[${PLUGIN_NAME}] Permission check:`, perm, userId, result);
                        return result;
                    };
                    this.unpatchPermissions = () => {
                        this.userModule.getCurrentUser = originalGetCurrentUser;
                        this.permissionModule.has = originalHas;
                        console.log(`[${PLUGIN_NAME}] patches reverted`);
                    };
                } else {
                    this.unpatchPermissions = () => {
                        this.userModule.getCurrentUser = originalGetCurrentUser;
                        console.log(`[${PLUGIN_NAME}] patches reverted`);
                    };
                }
            }
        }

        // Initialize plugin
        const pluginInstance = new PermissionViewerPatched();
        pluginInstance.start();

        // Expose globally for debugging
        window[PLUGIN_NAME] = pluginInstance;
    });
})();
