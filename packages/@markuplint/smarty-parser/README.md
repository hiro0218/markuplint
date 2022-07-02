# @markuplint/smarty-parser

[![npm version](https://badge.fury.io/js/%40markuplint%2Fsmarty-parser.svg)](https://www.npmjs.com/package/@markuplint/smarty-parser)
[![Build Status](https://travis-ci.org/markuplint/markuplint.svg?branch=main)](https://travis-ci.org/markuplint/markuplint)
[![Coverage Status](https://coveralls.io/repos/github/markuplint/markuplint/badge.svg?branch=main)](https://coveralls.io/github/markuplint/markuplint?branch=main)

## Install

```sh
$ npm install -D @markuplint/smarty-parser

$ yarn add -D @markuplint/smarty-parser
```

## Usage

Add `parser` option into your [confugration file](https://markuplint.dev/configuration#parser).

```json
{
  "parser": {
    ".tpl$": "@markuplint/smarty-parser"
  }
}
```

### Note

Unsupported the syntax that is complex on the attribute value.

✅ Available code:

```html
<div attr="{ $value }"></div>
```

<!-- prettier-ignore-start -->
```html
<div attr='{ $value }'></div>
```
<!-- prettier-ignore-end -->

```html
<div attr="{ $value }-{ $value2 }-{ $value3 }"></div>
```

❌ Unavailable code:

Didn't nest by quotations.

<!-- prettier-ignore-start -->
```html
<div attr={ $value }></div>
```
<!-- prettier-ignore-end -->

Mixed the tags and spaces.

```html
<div attr=" { $value } "></div>
```

```html
<div attr="{ $value } { $value2 }"></div>
```