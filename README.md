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

TODO: Make "Contributions" a link

## Getting started
To get started with OSE, refer to the [ose-bundle](http://opensmartenvironment.github.io/doc/modules/bundle.html) package and
[Media player example application](http://opensmartenvironment.github.io/doc/modules/bundle.media.html). You can read the entire OSE
documentation [here]( http://opensmartenvironment.github.io/doc).

## Modules
Open Smart Environment X.Org package consists of the following modules:
- X.Org server kind
- OSE X.Org core
- OSE X.Org content

### X.Org server kind
[Entry kind](http://opensmartenvironment.github.io/doc/classes/ose.lib.kind.html) for X.Org server

It uses xdotool to remotely control the desktop.

Module [X.Org server kind](http://opensmartenvironment.github.io/doc/classes/xorg.lib.xorg.html) reference ... 

### OSE X.Org core
Core singleton of ose-xorg npm package. Registers [entry kinds](http://opensmartenvironment.github.io/doc/classes/ose.lib.kind.html)
defined by this package to the `"control"` [scope](http://opensmartenvironment.github.io/doc/classes/ose.lib.scope.html).

Module [OSE X.Org core](http://opensmartenvironment.github.io/doc/classes/xorg.lib.html) reference ... 

### OSE X.Org content
Provides files of OSE X.Org package to the browser.

Module [OSE X.Org content](http://opensmartenvironment.github.io/doc/classes/xorg.content.html) reference ... 

## Contributions
To get started contributing or coding, it is good to read about the
two main npm packages [ose](http://opensmartenvironment.github.io/doc/modules/ose.html) and [ose-bb](http://opensmartenvironment.github.io/doc/modules/bb.html).

This software is in the pre-alpha stage. At the moment, it is
premature to file bugs. Input is, however, much welcome in the form
of ideas, comments and general suggestions.  Feel free to contact
us via
[github.com/opensmartenvironment](https://github.com/opensmartenvironment).

## Licence
This software is licensed under the terms of the [GNU GPL version
3](../LICENCE) or later
