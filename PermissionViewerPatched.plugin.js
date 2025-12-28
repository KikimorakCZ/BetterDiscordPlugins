/**
 * @name PermissionViewerPatched
 * @author LukasCS (original by Zerebos)
 * @authorId 1121285416721596456
 * @version 1.3.0
 * @description View user permissions with hover - role name & colored permissions. Original made by Zerebos. Fully self-contained.
 * @website https://github.com/KikimorakCZ/BetterDiscordPlugins
 * @source https://raw.githubusercontent.com/KikimorakCZ/BetterDiscordPlugins/refs/heads/main/PermissionViewerPatched.plugin.js
 * @updateUrl https://raw.githubusercontent.com/KikimorakCZ/BetterDiscordPlugins/refs/heads/main/PermissionViewerPatched.plugin.js
 */

const PermissionViewerPatched = (() => {
    const config = {
        defaultSettings: {
            contextMenus: true,
            popouts: true,
            displayMode: "cozy"
        }
    };

    let settings;

    // Helpers to access Discord modules
    const GuildStore = BdApi.findModuleByProps("getGuild", "getMember");
    const RoleStore = BdApi.findModuleByProps("getRoles", "getHighestRole");
    const UserContextMenu = BdApi.findModuleByDisplayName("UserContextMenu");
    const PopoutUser = BdApi.findModuleByDisplayName("PopoutUser");

    const patchContextMenu = (instance) => {
        if (!instance || !instance.props || !instance.props.user) return;
        const user = instance.props.user;
        const guild = instance.props.guild || BdApi.findModuleByProps("getGuild", "getMember").getGuild(BdApi.findModuleByProps("getGuildId").getGuildId());
        if (!guild) return;

        const roles = RoleStore.getRoles(guild.id);
        const member = GuildStore.getMember(guild.id, user.id);
        if (!member) return;

        const userPerms = member.permissions || 0;

        const permList = Object.keys(PermissionFlags).map(p => {
            const has = (userPerms & PermissionFlags[p]) === PermissionFlags[p];
            const highestRole = RoleStore.getHighestRole(member, roles);
            const color = highestRole?.color || 0xFFFFFF;
            return {
                name: p,
                has,
                color,
                roleName: highestRole?.name || "Unknown"
            };
        });

        const menuItem = BdApi.React.createElement("div", {
            style: {
                display: "flex",
                flexDirection: "column",
                marginTop: "5px"
            }
        },
            permList.map(p => BdApi.React.createElement("span", {
                title: `From role: ${p.roleName}`,
                style: { color: p.has ? `#${p.color.toString(16)}` : "#888" }
            }, `${p.name}: ${p.has ? "✔" : "✖"}`))
        );

        if (instance.props.children?.length) instance.props.children.push(menuItem);
    };

    // Permission flags
    const PermissionFlags = {
        CREATE_INSTANT_INVITE: 0x1,
        KICK_MEMBERS: 0x2,
        BAN_MEMBERS: 0x4,
        ADMINISTRATOR: 0x8,
        MANAGE_CHANNELS: 0x10,
        MANAGE_GUILD: 0x20,
        ADD_REACTIONS: 0x40,
        VIEW_AUDIT_LOG: 0x80,
        PRIORITY_SPEAKER: 0x100,
        STREAM: 0x200,
        VIEW_CHANNEL: 0x400,
        SEND_MESSAGES: 0x800,
        SEND_TTS_MESSAGES: 0x1000,
        MANAGE_MESSAGES: 0x2000,
        EMBED_LINKS: 0x4000,
        ATTACH_FILES: 0x8000,
        READ_MESSAGE_HISTORY: 0x10000,
        MENTION_EVERYONE: 0x20000,
        USE_EXTERNAL_EMOJIS: 0x40000,
        VIEW_GUILD_INSIGHTS: 0x80000,
        CONNECT: 0x100000,
        SPEAK: 0x200000,
        MUTE_MEMBERS: 0x400000,
        DEAFEN_MEMBERS: 0x800000,
        MOVE_MEMBERS: 0x1000000,
        USE_VAD: 0x2000000,
        CHANGE_NICKNAME: 0x4000000,
        MANAGE_NICKNAMES: 0x8000000,
        MANAGE_ROLES: 0x10000000,
        MANAGE_WEBHOOKS: 0x20000000,
        MANAGE_EMOJIS: 0x40000000
    };

    return class PermissionViewerPatched {
        constructor() {
            this.getName = () => "PermissionViewerPatched";
            settings = BdApi.loadData(this.getName(), "settings") || config.defaultSettings;
        }

        start() {
            if (UserContextMenu && settings.contextMenus) {
                BdApi.Patcher.after(this.getName(), UserContextMenu.prototype, "render", (_, __, returnValue) => patchContextMenu(returnValue));
            }
            if (PopoutUser && settings.popouts) {
                BdApi.Patcher.after(this.getName(), PopoutUser.prototype, "render", (_, __, returnValue) => patchContextMenu(returnValue));
            }
            console.log(`${this.getName()} v${config.defaultSettings.version} started.`);
        }

        stop() {
            BdApi.Patcher.unpatchAll(this.getName());
            console.log(`${this.getName()} stopped.`);
        }

        getSettingsPanel() {
            const panel = document.createElement("div");
            panel.style.padding = "10px";

            const toggleContext = document.createElement("input");
            toggleContext.type = "checkbox";
            toggleContext.checked = settings.contextMenus;
            toggleContext.onchange = () => {
                settings.contextMenus = toggleContext.checked;
                BdApi.saveData(this.getName(), "settings", settings);
            };
            panel.appendChild(document.createTextNode("Enable context menu permissions view "));
            panel.appendChild(toggleContext);
            panel.appendChild(document.createElement("br"));

            const togglePopout = document.createElement("input");
            togglePopout.type = "checkbox";
            togglePopout.checked = settings.popouts;
            togglePopout.onchange = () => {
                settings.popouts = togglePopout.checked;
                BdApi.saveData(this.getName(), "settings", settings);
            };
            panel.appendChild(document.createTextNode("Enable popout permissions view "));
            panel.appendChild(togglePopout);

            return panel;
        }
    };
})();
