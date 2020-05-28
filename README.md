# PHP NoVerify

[![Version](https://vsmarketplacebadge.apphb.com/version-short/EdgardMessias.php-noverify.svg)](https://marketplace.visualstudio.com/items?itemName=EdgardMessias.php-noverify)
[![Installs](https://vsmarketplacebadge.apphb.com/installs-short/EdgardMessias.php-noverify.svg)](https://marketplace.visualstudio.com/items?itemName=EdgardMessias.php-noverify)
[![Ratings](https://vsmarketplacebadge.apphb.com/rating-short/EdgardMessias.php-noverify.svg)](https://marketplace.visualstudio.com/items?itemName=EdgardMessias.php-noverify)

[![Build Status](https://img.shields.io/github/workflow/status/edgardmessias/vscode.php-noverify/test.svg)](https://github.com/edgardmessias/vscode.php-noverify/actions)
[![Lint Status](https://img.shields.io/github/workflow/status/edgardmessias/vscode.php-noverify/lint.svg?label=lint)](https://github.com/edgardmessias/vscode.php-noverify/actions)
[![release-it](https://img.shields.io/badge/%F0%9F%93%A6%F0%9F%9A%80-release--it-e10079.svg)](https://github.com/release-it/release-it)

[![Dependencies Status](https://david-dm.org/edgardmessias/vscode.php-noverify/status.svg)](https://david-dm.org/edgardmessias/vscode.php-noverify)
[![DevDependencies Status](https://david-dm.org/edgardmessias/vscode.php-noverify/dev-status.svg)](https://david-dm.org/edgardmessias/vscode.php-noverify?type=dev)
[![Dependabot badge](https://badgen.net/dependabot/edgardmessias/vscode.php-noverify/?icon=dependabot)](https://dependabot.com/)

[![Coverage Status](https://codecov.io/gh/edgardmessias/vscode.php-noverify/branch/master/graph/badge.svg)](https://codecov.io/gh/edgardmessias/vscode.php-noverify)
[![Known Vulnerabilities](https://snyk.io/test/github/edgardmessias/vscode.php-noverify/badge.svg)](https://snyk.io/test/github/edgardmessias/vscode.php-noverify)

[![Average time to resolve an issue](https://isitmaintained.com/badge/resolution/edgardmessias/vscode.php-noverify.svg)](https://isitmaintained.com/project/edgardmessias/vscode.php-noverify "Average time to resolve an issue")
[![Percentage of issues still open](https://isitmaintained.com/badge/open/edgardmessias/vscode.php-noverify.svg)](https://isitmaintained.com/project/edgardmessias/vscode.php-noverify "Percentage of issues still open")

![](/resources/noverify_small.png)

NoVerify is a PHP linter: it finds possible bugs and style violations in your code.

* NoVerify has no config: any reported issue in your PHPDoc or PHP code must be fixed.
* NoVerify aims to understand PHP code at least as well as PHPStorm does. If it behaves incorrectly or suboptimally, please [report issue](https://github.com/VKCOM/noverify/issues/new).
* This tool is written in [Go](https://golang.org/) and uses [z7zmey/php-parser](https://github.com/z7zmey/php-parser).

## Features

1. Fast: analyze ~100k LOC/s (lines of code per second) on Core i7
2. Incremental: can analyze changes in git and show only new reports. Indexing speed is ~1M LOC/s.
3. Experimental language server for VS Code and other editors that support language server protocol.

## Default lints

NoVerify by default has the following checks:

- Unreachable code
- Array access to non-array type (beta)
- Too few arguments when calling a function/method
- Call to undefined function/method
- Fetching of undefined constant/class property
- Class not found
- PHPDoc is incorrect
- Undefined variable
- Variable not always defined
- Case without "break;"
- Syntax error
- Unused variable
- Incorrect access to private/protected elements
- Incorrect implementation of IteratorAggregate interface
- Incorrect array definition, e.g. duplicate keys

## Extension Settings

This extension contributes the following settings (default values):

<!--begin-settings-->
```js
{
  // Extra argumets for NoVerify language server
  "php-noverify.noverifyExtraArgs": [],

  // The path to the noverify executable.
  "php-noverify.noverifyPath": "noverify",

  // The path to php stubs. Default use internal.
  "php-noverify.phpStubsPath": null,

  // Traces the communication between VS Code and the NoVerify language server.
  "php-noverify.trace.server": "off"
}
```
<!--end-settings-->
