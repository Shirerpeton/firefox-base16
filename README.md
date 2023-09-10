# firefox-base16

## Description
This is a simple TS script which allows to decode, encode and create themes for firefox which could be used on https://color.firefox.com/. Script relies on xz being available on system (aliased to lzcat and lzma).

## Commands
1. -d, --decode: allows to decode theme to json. Takes encoded theme
2. -e, --encode: allows to encode theme from json to parameter which could be used on aformentioned site (`https://color.firefox.com?theme={encoded theme goes here}`). Takes decoded (json) theme as string
3. -c, --create: can be used to create theme from json containinig base16 colors. Takes path to json file with hex color codes

## Usage
To install dependencies:

```bash
bun install
```

To run:

```bash
bun run start {args}
```

This project was created using `bun init` in bun v1.0.0. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
