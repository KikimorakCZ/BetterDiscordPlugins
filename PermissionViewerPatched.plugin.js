/**
 * @name PermissionViewerPatched
 * @author LukasCS (original by Zerebos)
 * @authorId 1121285416721596456
 * @version 1.3.1
 * @description View user permissions with hover - role name & colored permissions. Works with BDFDB 4.x. Original by Zerebos.
 * @website https://github.com/KikimorakCZ/BetterDiscordPlugins
 * @source https://raw.githubusercontent.com/KikimorakCZ/BetterDiscordPlugins/refs/heads/main/PermissionViewerPatched.plugin.js
 * @updateUrl https://raw.githubusercontent.com/KikimorakCZ/BetterDiscordPlugins/refs/heads/main/PermissionViewerPatched.plugin.js
 * @dependancies BDFDB
 */

class PermissionViewerPatched {

    constructor() {
        this.patchedModules = [];
        this.defaultSettings = {
            hoverShowRole: true,
            colorByRole: true,
            contextMenu: true,
            popouts: true,
        };
        this.settings = Object.assign({}, this.defaultSettings);
    }

    start() {
        if (!window.BDFDB) {
            console.error("PermissionViewerPatched: BDFDB not found!");
            return;
        }

        if (window.BDFDB.isReady) {
            this.initialize();
        } else {
            window.BDFDB.ready(() => this.initialize());
        }
    }

    initialize() {
        const BDFDB = window.BDFDB;

        try {
            // Patch User Tooltip
            const UserTooltip = BDFDB.WebModules.findByProps("UserTooltip", "displayName");
            if (!UserTooltip) return console.error("PermissionViewerPatched: Cannot find UserTooltip module");

            BDFDB.Patch.after(UserTooltip.prototype, "render", (thisObject, args, returnValue) => {
                try {
                    const user = args[0].user;
                    if (!user) return;

                    const roles = BDFDB.LibraryModules.GuildMemberStore.getGuildMember(user.guild_id, user.id)?.roles || [];
                    const permissions = BDFDB.LibraryModules.GuildPermissions.getUserPermissions(user.guild_id, user.id);

                    const permissionElements = Object.keys(permissions).map(perm => {
                        const role = roles.find(rid => BDFDB.LibraryModules.GuildStore.getGuild(user.guild_id)?.roles[rid]?.permissions & permissions[perm]);
                        const color = role ? BDFDB.LibraryModules.GuildStore.getGuild(user.guild_id).roles[role].colorString : null;

                        return BDFDB.React.createElement("div", {
                            className: "pv-permission",
                            style: { color: color || "inherit" },
                            title: role ? BDFDB.LibraryModules.GuildStore.getGuild(user.guild_id).roles[role].name : "Unknown role"
                        }, perm);
                    });

                    returnValue.props.children.push(
                        BDFDB.React.createElement("div", { className: "pv-container" }, permissionElements)
                    );
                } catch (err) {
                    console.error("PermissionViewerPatched tooltip patch error:", err);
                }
            });

        } catch (err) {
            console.error("PermissionViewerPatched init error:", err);
        }
    }

    stop() {
        if (window.BDFDB) {
            window.BDFDB.PatchUtils.unpatchAll(this.constructor.name);
        }
    }

    getSettingsPanel() {
        const BDFDB = window.BDFDB;
        return BDFDB && BDFDB.UI && BDFDB.UI.buildSettingsPanel({
            settings: [
                {
                    type: "switch",
                    id: "hoverShowRole",
                    name: "Hover shows role",
                    note: "Hover permission to see which role it comes from",
                    value: this.settings.hoverShowRole,
                    onChange: val => this.settings.hoverShowRole = val
                },
                {
                    type: "switch",
                    id: "colorByRole",
                    name: "Color permissions by role",
                    note: "Permissions text will match highest role color",
                    value: this.settings.colorByRole,
                    onChange: val => this.settings.colorByRole = val
                }
            ]
        });
    }
}

module.exports = PermissionViewerPatched;
