# Open Smart Environment X.Org package

This package allows to control the X.Org server with xdotool.

## Status
- Pre-alpha stage (insecure and buggy)
- Unstable API
- Gaps in the documentation
- No test suite

This is not yet a piece of download-and-use software. Its important
to understand the basic principles covered by this documentation.

Use of this software is currently recommended only for users that
wish participate in the development process (see Contributions).

TODO: Make contribution a link

## Getting started
To get started with OSE, refer to the [ose-bundle] package and
[Media player example application].

## Modules
Open Smart Environment X.Org package consists of the following modules:
- X.Org server kind
- OSE X.Org core
- OSE X.Org content

### X.Org server kind
[Entry kind] for X.Org server

It uses xdotool to remotely control the desktop.

Module [X.Org server kind] reference ... 

### OSE X.Org core
Core singleton of ose-xorg npm package. Registers [entry kinds]
defined by this package to the `"control"` [scope].

Module [OSE X.Org core] reference ... 

### OSE X.Org content
Provides files of OSE X.Org package to the browser.

Module [OSE X.Org content] reference ... 

## Contributions
To get started contributing or coding, it is good to read about the
two main npm packages [ose] and [ose-bb].

This software is in the pre-alpha stage. At the moment, it is
premature to file bugs. Input is, however, much welcome in the form
of ideas, comments and general suggestions.  Feel free to contact
us via
[github.com/opensmartenvironment](https://github.com/opensmartenvironment).

## License
This software is licensed under the terms of the [GNU GPL version
3](../LICENCE) or later
