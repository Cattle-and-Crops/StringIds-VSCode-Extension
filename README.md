# cnc-mission-stringids README

This extension has two functions

1. recalculate stringIds for tutorial missions. Each `condition` gets a new step number (`...-S00_`), and each `window` gets the same ID with a trailing "I" (`...-S00I`). The stringId base (full path before the final stringId part) can be calculated from the filename, or a custom one can be defined.
2. Gather all defined stringIds and corresponding texts in a mission file and copy them to the clipboard for further usage in the CNC translations table


## Requirements

Requires VS Code v1.45.0 or higher.

## Release Notes

### 0.0.3

* stringId base can be customized in an input box
* New function: **Get String Contents**
  Gathers all stringIds and correcponding texts from a mission file and copies them for further usage in the CNC translations table
* Support for multitple windows (gamepad windows) in **Create Tutorial StringIds**

### 0.0.2

`<name>` and `<description>` stringId (long & short desc)

### 0.0.1

Initial release.
