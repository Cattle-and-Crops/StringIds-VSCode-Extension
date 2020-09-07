# Cattle and Crops Mission StringIds

This extension has four major functions:

1. **Create Tutorial StringIds**: recalculate stringIds for tutorial missions. Each `condition` gets a new step number (`...-S000`), and each `window` gets the same ID with a trailing "-INFO", or "-I000" if using elements (`...-INFO` / `...-I000`). The stringId base (full path before the final stringId part) can be calculated from the filename, or a custom one can be defined.
2. **Get String Contents**: gather all defined stringIds and corresponding texts in a mission file and copy them to the clipboard for further usage in the CNC translations table
3. **Paste Strings from Sheet**: parses translation data in clipboard (from translation table), matches it to the existing XML stringId data and replaces existing text, while unescaping it where possible. Also warns if there are missing stringIds in either the clipboard or the XML file.
4. Clear all `stringId` attribute values with the **Delete StringIds** function

Additionally, there's one minor function:

1.  **Clean Backslashes**: replaces backslashes in the user's text selection with forward slashes

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

### 0.0.8
* **Delete StringIds**: whitespace in front of "stringId" won't be deleted anymore
* **Create StringIds**: `gamepad="false"` etc. is now caught
* **Create StringIds**: automatic stringId base proposal for campaign XMLs
* **Get StringIds**: temporary .tsv file is stored on C:\ so it won't be lost in the dark regions of VS Code

### 0.0.7
* **Create StringIds**, **Delete StringIds**, **Get String Contents**, **Paste Strings from Sheet**: support for `expandedStringId`/`expandedDescription`, `titleStringId`/`title`
* **Get String Contents** now removes multiple tabs
* **Create StringIds** now ignores start conditions before starting the condition counter
* `stringId` attributes are handled as case insensitive
* New minor function **Clean Backslashes**: replaces backslashes in the user's text selection with forward slashes

### 0.0.6
* **Get String Contents** now escapes quotes, newLines and tabs
* **Create StringIds**: user input cancellation caught
* Support for window/page/element
* **Create StringIds**, **Get String Contents**: support for window/page/element
* New function **Paste Strings from Sheet**: Parses translation data in clipboard (from translation table), matches it to the existing XML stringId data and replaces existing text, while unescaping it where possible. Also warns if there are missing stringIds in either the clipboard or the XML file.

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
