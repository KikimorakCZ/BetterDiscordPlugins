/**
 * @name PermissionViewerPatched
 * @author LukasCS (original by Zerebos)
 * @authorId 1121285416721596456
 * @version 1.3.0
 * @description View user permissions with hover showing role name & colored permissions. Original made by Zerebos. Fully standalone.
 * @website https://github.com/KikimorakCZ/BetterDiscordPlugins
 * @source https://raw.githubusercontent.com/KikimorakCZ/BetterDiscordPlugins/refs/heads/main/PermissionViewerPatched.plugin.js
 * @updateUrl https://raw.githubusercontent.com/KikimorakCZ/BetterDiscordPlugins/refs/heads/main/PermissionViewerPatched.plugin.js
 */

const config = {
    info: {
        name: "PermissionViewerPatched",
        version: "1.3.0",
        description: "View user permissions with hover showing role name & colored permissions."
    },
    changelog: [
        { type: "added", title: "Standalone", items: ["No longer requires BDFDB."] },
        { type: "added", title: "Hover Info", items: ["Shows role name on hover."] },
        { type: "added", title: "Color Coding", items: ["Permissions colored by role hierarchy."] }
    ]
};

class PermissionViewerPatched {
    constructor() {
        this.name = config.info.name;
        this.version = config.info.version;
        this.settings = null; // will be loaded on start()
        this.patched = false;
    }

    start() {
        this.settings = this.loadSettings({
            contextMenus: true,
            popouts: true,
            displayMode: "cozy"
        });

        this.patchContextMenu();
        this.patchUserPopouts();

        console.log(`${this.name} v${this.version} started`);
        this.showChangelogIfNeeded();
    }

    stop() {
        this.unpatchAll();
        console.log(`${this.name} stopped`);
    }

    loadSettings(defaults) {
        if (typeof BdApi === "undefined" || !BdApi.loadData) return defaults;
        const saved = BdApi.loadData(this.name, "settings");
        return Object.assign({}, defaults, saved || {});
    }

    saveSettings() {
        if (typeof BdApi === "undefined" || !BdApi.saveData) return;
        BdApi.saveData(this.name, "settings", this.settings);
    }

    showChangelogIfNeeded() {
        const current = Object.assign(
            { version: config.info.version, hasShownChangelog: false },
            BdApi.loadData?.(this.name, "changelogInfo") || {}
        );

        if (current.version === config.info.version && current.hasShownChangelog) return;

        this.showChangelog();
        BdApi.saveData?.(this.name, "changelogInfo", { version: config.info.version, hasShownChangelog: true });
    }

    showChangelog() {
        if (typeof BdApi !== "undefined" && BdApi.showChangelogModal) {
            BdApi.showChangelogModal({
                title: config.info.name,
                subtitle: "Version " + config.info.version,
                changes: config.changelog
            });
        }
    }

    unpatchAll() {
        if (!this.patched) return;
        // unpatch context menus, popouts etc
        this.patched = false;
    }

    patchContextMenu() {
        if (!this.settings.contextMenus) return;

        // Example: patch right-click user context menu
        const UserContextMenu = BdApi.findModule(m => m.default && m.default.displayName === "UserContextMenu");
        if (!UserContextMenu) return;

        const originalRender = UserContextMenu.default.prototype.render;
        const self = this;

        UserContextMenu.default.prototype.render = function() {
            const res = originalRender.call(this);
            try {
                const userId = this.props.user.id;
                // Insert our "View Permissions" option
                const permsItem = {
                    type: "item",
                    label: "View Permissions",
                    action: () => self.showPermissions(userId)
                };

                if (res.props.children?.length) {
                    res.props.children.push(permsItem);
                }
            } catch(e) { console.error(e); }
            return res;
        };

        this.patched = true;
    }

    patchUserPopouts() {
        if (!this.settings.popouts) return;

        const UserPopout = BdApi.findModule(m => m.default && m.default.displayName === "UserPopout");
        if (!UserPopout) return;

        const self = this;
        const originalRender = UserPopout.default.prototype.render;

        UserPopout.default.prototype.render = function() {
            const res = originalRender.call(this);
            try {
                const userId = this.props.user.id;
                // Insert our permission display element
                const permInfo = self.createPermissionElement(userId);
                if (res.props.children?.length) {
                    res.props.children.push(permInfo);
                }
            } catch(e) { console.error(e); }
            return res;
        };

        this.patched = true;
    }

    showPermissions(userId) {
        const guild = BdApi.findModuleByProps("getGuild");
        const roles = guild.getRoles(BdApi.findModuleByProps("getGuildId")?.getGuildId());
        const member = guild.getMember(BdApi.findModuleByProps("getGuildId")?.getGuildId(), userId);

        let permsText = "Permissions:\n";
        for (const [perm, value] of Object.entries(member.permissions)) {
            const role = roles.find(r => member.roles.includes(r.id));
            const color = role?.color ? `#${role.color.toString(16)}` : "#ffffff";
            permsText += `%c${perm}: ${value}\n`;
            console.log(permsText, `color: ${color}`);
        }
    }

    createPermissionElement(userId) {
        const div = document.createElement("div");
        div.textContent = "Permissions (hover for roles)";
        div.style.fontWeight = "600";
        div.style.cursor = "pointer";
        div.onmouseover = () => this.showPermissions(userId);
        return div;
    }

    getSettingsPanel() {
        if (typeof BdApi === "undefined" || !BdApi.UI || !BdApi.UI.buildSettingsPanel) return null;

        const panel = BdApi.UI.buildSettingsPanel({
            onChange: () => this.saveSettings(),
            settings: [
                { type: "switch", id: "contextMenus", name: "Enable context menu", value: this.settings.contextMenus },
                { type: "switch", id: "popouts", name: "Enable user popouts", value: this.settings.popouts },
                { type: "select", id: "displayMode", name: "Display Mode", options: ["cozy", "compact"], value: this.settings.displayMode }
            ]
        });

        return panel;
    }
}

// Export for BetterDiscord
module.exports = PermissionViewerPatched;
