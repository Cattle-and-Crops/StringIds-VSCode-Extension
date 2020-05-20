# cnc-mission-stringids README

This extension has one function: recalculate stringIds for tutorial missions. Each `condition` gets a new step number (`...-S00_`), and each `window` gets the same ID with a trailing "I" (`...-S00I`). The stringId base (full path before the final stringId part) can be calculated from the filename, or a custom one can be defined.


## Requirements

Requires VS Code v1.45.0 or higher.

## Release Notes

### 0.0.3

stringId base can be customized in an input box

### 0.0.2

`<name>` and `<description>` stringId (long & short desc)

### 0.0.1

Initial release.
