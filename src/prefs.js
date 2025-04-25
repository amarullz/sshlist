import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gdk from 'gi://Gdk';
import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import { PACKAGE_VERSION } from 'resource:///org/gnome/Shell/Extensions/js/misc/config.js';

export default class extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const WEBSITE_LINK = "https://amarullz.com/";
        const PAYPAL_LINK = "https://paypal.me/amarullz";
        const MIT_SOFTWARE = '<span size="small">' +
            'This program comes with absolutely no warranty.\n' +
            'See the <a href="https://github.com/amarullz/sshlist/blob/main/LICENSE">' +
            'MIT License</a> for details.' +
            '</span>';

        // Launch Command Template
        const command_template = [
            ["- Select -",""],
            ["Default Terminal", "x-terminal-emulator -e 'ssh %s'"],
            ["Alacritty", "alacritty -e 'ssh %s'"],
            ["Blackbox", "blackbox -c 'ssh %s'"],
            ["Blackbox Terminal", "blackbox-terminal -c 'ssh %s'"],
            ["Console", "kgx -e 'ssh %s'"],
            ["Gnome Terminal", "gnome-terminal -e 'ssh %s'"],
            ["Kitty", "kitty 'ssh %s'"]
        ];

        // Configuration
        const command = new Adw.PreferencesGroup({ title: "Configuration" });
        const launchText=this._createTextEdit(
            command,
            "command-line",
            "Launch Command"
        );

        

        const itemStr = new Gtk.StringList();
        for (var i = 0; i < command_template.length; i++) {
            itemStr.append(command_template[i][0]);
        }
        const comboRow = new Adw.ComboRow({
            title: "Template",
            subtitle: "Launch Command Template",
            model: itemStr,
            selected: 0,
        });
        comboRow.connect('notify::selected', widget => {
            if (widget.selected > 0) {
                launchText.set_text(command_template[widget.selected][1]);
            }
        });
        command.add(comboRow);

        // About
        const about = new Adw.PreferencesGroup({ title: "About" });
        const aboutVersion = new Adw.ActionRow({
            title: 'SSH Profile List Version',
        });
        aboutVersion.add_suffix(new Gtk.Label({
            label: this.metadata.version.toString(),
            css_classes: ['dim-label'],
        }));
        about.add(aboutVersion);
        const gnomeVersion = new Adw.ActionRow({
            title: 'Gnome Version',
        });
        gnomeVersion.add_suffix(new Gtk.Label({
            label: PACKAGE_VERSION,
            css_classes: ['dim-label'],
        }));
        about.add(gnomeVersion);
        const githubRow = this._createLinkRow(window, 'Source Github', this.metadata.url);
        about.add(githubRow);
        const websiteRow = this._createLinkRow(window, 'Visit Website', WEBSITE_LINK);
        about.add(websiteRow);
        const donateRow = this._createLinkRow(window, 'Donate via PayPal', PAYPAL_LINK);
        about.add(donateRow);

        // MIT
        const mitSoftwareGroup = new Adw.PreferencesGroup();
        const mitSofwareLabel = new Gtk.Label({
            label: MIT_SOFTWARE,
            use_markup: true,
            justify: Gtk.Justification.CENTER,
        });
        const mitSofwareLabelBox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            valign: Gtk.Align.END,
            vexpand: true,
        });
        mitSofwareLabelBox.append(mitSofwareLabel);
        mitSoftwareGroup.add(mitSofwareLabelBox);

        const page = new Adw.PreferencesPage();
        page.add(command);
        page.add(about);
        page.add(mitSoftwareGroup);
        window.add(page);
    }

    /* Create Combo Row */
    _createTextEdit(parent, bind, title) {
        const entryRow = new Adw.EntryRow({
            'title': title
        });
        entryRow.set_enable_emoji_completion(false);
        entryRow.set_text(this.getSettings().get_string(bind));
        entryRow.connect('changed', entry => {
            this.getSettings().set_string(bind, entry.get_text());
        });
        parent.add(entryRow);
        return entryRow;
    }

    /* Create Link */
    _createLinkRow(window, title_row, uri) {
        const image = new Gtk.Image({
            icon_name: 'adw-external-link-symbolic',
            valign: Gtk.Align.CENTER,
        });
        const linkRow = new Adw.ActionRow({
            title: title_row,
            activatable: true,
        });
        linkRow.connect('activated', () => {
            Gtk.show_uri(window, uri, Gdk.CURRENT_TIME);
        });
        linkRow.add_suffix(image);
        return linkRow;
    }
}
