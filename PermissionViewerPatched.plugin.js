/**
 * @name PermissionViewerPatched
 * @author LukasCS
 * @version 1.2.0
 * @description Allows you to view a user's permissions. Original made by Zerebos. Patched version with hover tooltips & coloring.
 * @website https://github.com/KikimorakCZ/BetterDiscordPlugins
 * @source https://raw.githubusercontent.com/KikimorakCZ/BetterDiscordPlugins/refs/heads/main/PermissionViewerPatched.plugin.js
 * @updateUrl https://raw.githubusercontent.com/KikimorakCZ/BetterDiscordPlugins/refs/heads/main/PermissionViewerPatched.plugin.js
 * @invite [optional]
 */

const config = {
    info: {
        name: "PermissionViewerPatched",
        authors: [{name: "LukasCS", discord_id: "1121285416721596456"}],
        version: "1.2.0",
        description: "Allows you to view a user's permissions. Patched with hover tooltips & coloring.",
        github: "https://github.com/KikimorakCZ/BetterDiscordPlugins",
        github_raw: "https://raw.githubusercontent.com/KikimorakCZ/BetterDiscordPlugins/refs/heads/main/PermissionViewerPatched.plugin.js"
    },
    defaultSettings: {
        contextMenus: true,
        popouts: true,
        displayMode: "cozy"
    }
};

module.exports = class PermissionViewerPatched {
    constructor() {
        this.settings = BdApi.Data.load("PermissionViewerPatched", "settings") || config.defaultSettings;
        this.css = `
        .perm-user-avatar { border-radius: 50%; width: 16px; height: 16px; margin-right: 3px; }
        .member-perms-header { color: var(--header-secondary); display: flex; justify-content: space-between; }
        .member-perms { display: flex; flex-wrap: wrap; margin-top: 2px; max-height: 160px; overflow-y: auto; overflow-x: hidden; }
        .member-perms .member-perm .perm-circle { border-radius: 50%; height: 12px; margin: 0 8px 0 5px; width: 12px; }
        .member-perms .member-perm .name { margin-right: 4px; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .member-perm:hover .name::after { content: attr(data-roles); font-size: 10px; color: #999; margin-left: 4px; }
        .perm-allowed { color: #43B581; }
        .perm-denied { color: #F04747; }
        `;
        this.PermissionStringMap = BdApi.Webpack.getModule(m => m.ADD_REACTIONS, {searchExports:true});
        this.GuildStore = BdApi.Webpack.getStore("GuildStore");
        this.MemberStore = BdApi.Webpack.getStore("GuildMemberStore");
        this.RoleStore = BdApi.Webpack.getStore("GuildRoleStore");
        this.UserStore = BdApi.Webpack.getStore("UserStore");
        this.DiscordPermissions = BdApi.Webpack.getModule(m => m.ADD_REACTIONS, {searchExports:true});
    }

    start() {
        BdApi.injectCSS("PermissionViewerPatched", this.css);
        if (this.settings.contextMenus) this.patchContextMenus();
        if (this.settings.popouts) this.patchPopouts();
        BdApi.Logger.info("PermissionViewerPatched started.");
    }

    stop() {
        BdApi.clearCSS("PermissionViewerPatched");
        BdApi.Patcher.unpatchAll("PermissionViewerPatched");
        BdApi.Logger.info("PermissionViewerPatched stopped.");
    }

    saveSettings() {
        BdApi.Data.save("PermissionViewerPatched", "settings", this.settings);
    }

    getUserRoles(guildId, userId) {
        const member = this.MemberStore.getMember(guildId, userId);
        if (!member) return [];
        const roles = member.roles.map(rid => this.RoleStore.getRole(guildId, rid)).filter(Boolean);
        return roles.sort((a,b) => b.position - a.position);
    }

    getUserPermissions(guildId, userId) {
        const member = this.MemberStore.getMember(guildId, userId);
        if (!member) return {};
        const guild = this.GuildStore.getGuild(guildId);
        const permissions = {};
        const roles = this.getUserRoles(guildId, userId);
        const allPerms = Object.keys(this.DiscordPermissions).filter(p => !isNaN(this.DiscordPermissions[p]));
        for (const perm of allPerms) {
            permissions[perm] = roles.find(r => (r.permissions & this.DiscordPermissions[perm]) === this.DiscordPermissions[perm]) || null;
        }
        return permissions;
    }

    patchContextMenus() {
        const UserContextMenu = BdApi.Webpack.getModule(m => m.default && m.default.displayName === "UserContextMenu", {searchExports:true});
        BdApi.Patcher.after("PermissionViewerPatched", UserContextMenu, "default", (_, [props], ret) => {
            ret.props.children.push(BdApi.React.createElement("div", {
                className: "item-2v1kpA",
                onClick: () => this.showModal(props.user.id, props.guildId)
            }, "View Permissions"));
        });
    }

    patchPopouts() {
        const PopoutModule = BdApi.Webpack.getModule(m => m.default && m.default.displayName === "UserPopout", {searchExports:true});
        BdApi.Patcher.after("PermissionViewerPatched", PopoutModule, "default", (_, [props], ret) => {
            const container = ret.props.children[1];
            container.props.children.push(BdApi.React.createElement("button", {
                className: "button-38aScr lookFilled-1Gx00P colorBrand-3pXr91 sizeSmall-2cSMqn grow-2sR_-F",
                onClick: () => this.showModal(props.user.id, props.guildId)
            }, "View Permissions"));
        });
    }

    showModal(userId, guildId) {
        const user = this.UserStore.getUser(userId);
        const roles = this.getUserRoles(guildId, userId);
        const permissions = this.getUserPermissions(guildId, userId);
        const modalBody = Object.entries(permissions).map(([perm, role]) =>
            BdApi.React.createElement("div", {
                className: "member-perm",
                key: perm,
                "data-roles": role ? role.name : "None",
                style: {color: role ? role.color : "#999"}
            }, perm)
        );
        BdApi.UI.showModal(() => BdApi.React.createElement("div", {className:"member-perms"}, modalBody), {header: `${user.username}'s Permissions`});
    }
};
