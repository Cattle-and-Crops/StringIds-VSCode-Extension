# Change Log

### 0.0.7
* **Create StringIds**, **Delete StringIds**, **Get String Contents**, **Paste Strings from Sheet**: support for `expandedStringId`/`expandedDescription`, `titleStringId`/`title`
* **Get String Contents** now removes multiple tabs
* **Create StringIds** now ignores start conditions before starting the condition counter
* `stringId` attributes are handled as case insensitive
* New minor function **Clean Backslashes**: replaces backslashes in the user's text selection with forward slashes

### 0.0.6
* `Get String Contents` now escapes quotes, newLines and tabs
* `Create StringIds`: user input cancellation caught
* Support for window/page/element
* `Create StringIds`, `Get String Contents`: support for window/page/element
* New function **Paste Strings from Sheet**: Parses translation data in clipboard (from translation table), matches it to the existing XML stringId data and replaces existing text, while unescaping it where possible. Also warns if there are missing stringIds in either the clipboard or the XML file.

### 0.0.5
* New function: **Delete StringIds**
  Removes the `stringId` attribute values

### 0.0.4
* New function: **Get String Contents**
  Gathers all stringIds and correcponding texts from a mission file and optionally copies them for further usage in the CNC translations table
  * Config options:
    * Copy stringIds to clipboard [`boolean`]
    * Paste stringIds in new file [`boolean`]
* Support for multiple windows (gamepad windows) in **Create Tutorial StringIds**
* Both functions added to editor context menu in XML files
* Extension logo

### 0.0.3

* stringId base can be customized in an input box

### 0.0.2

`<name>` and `<description>` stringId (long & short desc)

### 0.0.1

Initial release.
