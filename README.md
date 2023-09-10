# firefox-base16

## Description
This is a simple TS script which allows to decode, encode and create themes for firefox which could be used on https://color.firefox.com/. Script relies on xz being available on running system (aliased to lzcat and lzma).

## Commands
1. -d, --decode: allows to decode theme to json. Takes encoded theme
2. -e, --encode: allows to encode theme from json to parameter which could be used on aformentioned site (`https://color.firefox.com?theme={encoded theme goes here}`). Takes decoded (json) theme as string
3. -c, --create: can be used to create theme from json containinig base16 colors. Takes path to json file with hex color codes.
4. -a, --apply: used with the previous command, to open link with the created theme in firefox immediately
5. -f, --firefox: used with previous two commands, allows to specify command for running firefox instead of using default one ('firefox'). Useful for firefox-developer-edition users.

Generation of the appropriate json file with base16 colors for any base16 theme could be automated by [flavours](https://github.com/Misterio77/flavours), appropriate template for it could be taken [here](https://github.com/Shirerpeton/dotfiles/tree/main/.local/share/flavours/base16/templates/firefox-base16/templates) and flavours configuration could be seen [here](https://github.com/Shirerpeton/dotfiles/blob/a2903f38efd0374f746ab3423b5340c934cf8337/.config/flavours/config.toml#L46).


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
