import GObject from "gi://GObject";
import St from "gi://St";
import GLib from "gi://GLib";
import Gio from "gi://Gio";
import {Extension, gettext as _} from "resource:///org/gnome/shell/extensions/extension.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";

const SSHList = GObject.registerClass(
class SSHList extends PanelMenu.Button {

    _init(settings) {
        super._init(0.0, _("SSH Connections"));
        this._settings = settings;
        this.add_child(new St.Icon({
            icon_name: "utilities-terminal-symbolic",
            style_class: "system-status-icon"
        }));
        Main.panel.addToStatusArea("sshlist", this);

        this._scrollableSection = new PopupMenu.PopupMenuSection();
        let scrollView = new St.ScrollView({
            style_class: "vfade",
            overlay_scrollbars: true,
            hscrollbar_policy: St.PolicyType.NEVER,
            vscrollbar_policy: St.PolicyType.AUTOMATIC,
        });
        scrollView.set_child(this._scrollableSection.actor);
        this.menu.box.add_child(scrollView);
        scrollView.set_style("max-height: 50em;");
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        this._loadSSHHosts();
    }

    _loadSSHHosts() {
        let configFiles = [
            GLib.get_home_dir() + "/.ssh/config",
            GLib.get_home_dir() + "/.ssh/config.d/"
        ];

        for (let path of configFiles) {
            let file = Gio.File.new_for_path(path);

            if (!file.query_exists(null)) {
                continue;
            }

            if (file.query_file_type(Gio.FileQueryInfoFlags.NONE, null) === Gio.FileType.DIRECTORY) {
                let enumerator = file.enumerate_children("standard::*", Gio.FileQueryInfoFlags.NONE, null);
                let fileInfo;
                while ((fileInfo = enumerator.next_file(null)) !== null) {
                    let filename = fileInfo.get_name();
                    if (filename.endsWith("hide")) {
                        continue;
                    }
                    let filePath = Gio.File.new_for_path(path + filename);
                    let [success, contents] = filePath.load_contents(null);
                    if (success) {
                        let config = new TextDecoder().decode(contents);
                        if (config.includes("#ignore-file")) {
                            continue;
                        }
                    }
                    let fileSeparator = new PopupMenu.PopupSeparatorMenuItem(filename);
                    if (/^\d+-/.test(fileSeparator.label.text)) {
                        fileSeparator.label.text = fileSeparator.label.text.substring(2);
                    }

                    this._scrollableSection.addMenuItem(fileSeparator);

                    let childFile = Gio.File.new_for_path(path + filename);
                    this._parseSSHConfigFile(childFile);
                }
            } else {
                this._parseSSHConfigFile(file);
            }
        }
        this._scrollableSection.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        let refreshMenuItem = new PopupMenu.PopupMenuItem("");
        let refreshIcon = new St.Icon({
            icon_name: "view-refresh-symbolic",
            style_class: "popup-menu-icon"
        });
        refreshMenuItem.add_child(refreshIcon);
        refreshMenuItem.add_child(new St.Label({ text: _(" Refresh") }));
        refreshMenuItem.connect("activate", () => {
            let children = this._scrollableSection.actor.get_children();
            for (let child of children) {
                child.destroy();
            }
            this._loadSSHHosts();
        });
        this._scrollableSection.addMenuItem(refreshMenuItem);
    }

    _parseSSHConfigFile(file) {
        let [success, contents] = file.load_contents(null);
        if (success) {
            let config = new TextDecoder().decode(contents);
            let hostPattern = /Host\s+([^\s]+)/g;
            config = config.split("\n").filter(line => !line.includes("#hide")).join("\n");
            let hosts = [];
            let match;
            while ((match = hostPattern.exec(config)) !== null) {
                let host = match[1];
                if (host.includes("ftp") && !host.includes("sftp")) {
                    continue;
                }
                hosts.push(host);
            }
            hosts.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
            for (let host of hosts) {
                this._addHostToMenu(host);
            }
        }
    }

    _addHostToMenu(host) {
        let menuItem = new PopupMenu.PopupMenuItem("");
        let hostIcon = new St.Icon({
            icon_name: "utilities-terminal-symbolic",
            style_class: "popup-menu-icon"
        });
        menuItem.add_child(hostIcon);
        menuItem.add_child(new St.Label({ text: _(` ${host}`) }));
        menuItem.connect("activate", (actor, event) => {
            this._connectSSH(host);
        });
        if (this._scrollableSection) {
            this._scrollableSection.addMenuItem(menuItem);
        }

    }

    _connectSSH(host) {
        let command = this._settings.get_string("command-line").replace('%s',host);
        // let command = `x-terminal-emulator -c "ssh ${host}"`;
        GLib.spawn_command_line_async(command, null);
        this.menu.close();
    }
});


export default class SSHListExtension extends Extension {

    enable() {
        this._settings = this.getSettings();
        this._indicator = new SSHList(this._settings);
        Main.panel.addToStatusArea(this.uuid, this._indicator);
    }

    disable() {
        this._settings = null;
        this._indicator.destroy();
        this._indicator = null;
    }
}
