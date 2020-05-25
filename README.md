# cnc-mission-stringids README

This extension has two functions

1. recalculate stringIds for tutorial missions. Each `condition` gets a new step number (`...-S00_`), and each `window` gets the same ID with a trailing "I" (`...-S00I`). The stringId base (full path before the final stringId part) can be calculated from the filename, or a custom one can be defined.
2. Gather all defined stringIds and corresponding texts in a mission file and copy them to the clipboard for further usage in the CNC translations table

---

## Requirements

Requires VS Code v1.45.0 or higher.

---

## Installation

1. Download the extension's .vsix file from the [latest release](https://gitlab.com/cattle-and-crops/tutorial-stringids-vscode-extension/-/releases)
2. In VS Code, execute "Extensions: Install from VSIX..." from the Command Palette
3. Select the downloaded .vsix file

---

## Release Notes

### 0.0.5
* New function: **Delete StringIds**
  Removes the `stringId` attribute values

### 0.0.4
* New function: **Get String Contents**
  Gathers all stringIds and correcponding texts from a mission file and optionally copies them for further usage in the CNC translations table
  * Config options:
    * Copy stringIds to clipboard [`boolean`, default: `true`]
    * Paste stringIds in new file [`boolean`, default: `true`]
* Support for multiple windows (gamepad windows) in **Create Tutorial StringIds**
* Both functions added to editor context menu in XML files
* Extension logo

### 0.0.3

* stringId base can be customized in an input box

### 0.0.2

`<name>` and `<description>` stringId (long & short desc)

### 0.0.1

Initial release.
