import { unpack, pack } from 'msgpackr';
import { cli, Result, FlagResult, CliSetting } from './cli-helper.ts';
import { BunFile } from 'bun';

const decompress = async (buffer: Buffer): Promise<Buffer> => {
    return new Promise(async (resolve, reject) => {
        const lzcat = Bun.spawn(['lzcat'], {
            stdin: 'pipe',
            stdout: 'pipe',
            stderr: 'pipe',
        });
        const dataChunks = [];
        lzcat.stdin.write(buffer);
        lzcat.stdin.end();
        for await (const chunk of lzcat.stdout) {
            dataChunks.push(chunk);
        }
        const errorChunks = [];
        for await (const chunk of lzcat.stderr) {
            errorChunks.push(chunk);
        }
        await lzcat.exited; 
        if(lzcat.exitCode != 0) {
            reject(new Error(`lzcat returned non-zero exit code ${lzcat.exitCode}. Error: ${Buffer.concat(errorChunks).toString()}`));
            return;
        }
        resolve(Buffer.concat(dataChunks));
    });
}

const compress = (buffer: Buffer): Promise<Buffer> => {
    return new Promise(async (resolve, reject) => {
        const lzma = Bun.spawn(['lzma', '-c'], {
            stdin: 'pipe',
            stdout: 'pipe',
            stderr: 'pipe',
        });
        const dataChunks = [];
        lzma.stdin.write(buffer);
        lzma.stdin.end();
        for await (const chunk of lzma.stdout) {
            dataChunks.push(chunk);
        }
        const errorChunks = [];
        for await (const chunk of lzma.stderr) {
            errorChunks.push(chunk);
        }
        await lzma.exited; 
        if(lzma.exitCode != 0) {
            reject(new Error(`lzma returned non-zero exit code ${lzma.exitCode}. Error: ${Buffer.concat(errorChunks).toString()}`));
            return;
        }
        resolve(Buffer.concat(dataChunks));
    });
}

const decode = async (str: string): Promise<string> => {
    const decompressed: Buffer = await decompress(Buffer.from(str, 'base64url'));
    const unpacked = unpack(decompressed); 
    if(unpacked instanceof Buffer) {
        return unpacked.toString('utf8');
    } else {
        return JSON.stringify(unpacked);
    }
};

const encode = async (str: string): Promise<string> => {
    const msgPack: Buffer = pack(JSON.parse(str));
    const compressed: Buffer = await compress(msgPack);
    return compressed.toString('base64url');
};

type RgbColor = {
    red: number,
    green: number,
    blue: number
}

const hexToRgb = (hex: string): RgbColor => {
    const red: number = parseInt(hex.slice(1, 3), 16);
    const green: number = parseInt(hex.slice(3, 5), 16);
    const blue: number = parseInt(hex.slice(5, 7), 16);
    return { red, green, blue }
}
const rgbColorToString = (rgbColor: RgbColor): string => {
    return `{"r": ${rgbColor.red}, "g": ${rgbColor.green}, "b": ${rgbColor.blue}}`;
}

const createTheme = (colorJson: any) => {
    const base00 = hexToRgb(colorJson["base00"]);
    const base01 = hexToRgb(colorJson["base01"]);
    const base02 = hexToRgb(colorJson["base02"]);
    const base03 = hexToRgb(colorJson["base03"]);
    const base04 = hexToRgb(colorJson["base04"]);
    const base05 = hexToRgb(colorJson["base05"]);
    const base06 = hexToRgb(colorJson["base06"]);
    const base07 = hexToRgb(colorJson["base07"]);

    const json: string = `{
            "colors": { 
                "toolbar": ${rgbColorToString(base00)},
                "toolbar_text": ${rgbColorToString(base07)},
                "frame": ${rgbColorToString(base01)},
                "accentcolor": ${rgbColorToString(base03)},
                "textcolor": ${rgbColorToString(base04)},
                "toolbar_field": ${rgbColorToString(base01)},
                "toolbar_field_text": ${rgbColorToString(base07)},
                "tab_line": ${rgbColorToString(base02)},
                "popup": ${rgbColorToString(base02)},
                "popup_text": ${rgbColorToString(base05)},
                "ntp_background": ${rgbColorToString(base00)},
                "ntp_text": ${rgbColorToString(base05)}
            },
            "images": {
                "additional_backgrounds": [],
                "custom_backgrounds": []
            },
            "title": "default"
        }`
    return json;
}

if(Bun.argv.length > 2) {
    const cliSettings: CliSetting[] = []; 
    cliSettings.push({key: 'decode', flags: ['-d', '--decode'], consumeNext: true });
    cliSettings.push({key: 'encode', flags: ['-e', '--encode'], consumeNext: true });
    cliSettings.push({key: 'create', flags: ['-c', '--create'], consumeNext: true });
    cliSettings.push({key: 'apply', flags: ['-a', '--apply'], consumeNext: false });
    cliSettings.push({key: 'firefox', flags: ['-f', '--firefox'], consumeNext: true });
    const result: Result<FlagResult[]> = cli(cliSettings, Bun.argv.slice(2));
    if(result.value instanceof Error) {
        console.error(result.value);
    } else {
        const decodeFlag: FlagResult | undefined = result.value.find(v => v.key === 'decode'); 
        if(decodeFlag) {
            const encodedStr: string | null = decodeFlag.value;
            if(!encodedStr) {
                throw new Error('No string to decode');
            }
            console.log('decoded value:');
            const decodedStr = await decode(encodedStr); 
            console.log(decodedStr);
        }
        const encodeFlag: FlagResult | undefined = result.value.find(v => v.key === 'encode'); 
        if(encodeFlag) {
            const str: string | null = encodeFlag.value;
            if(!str) {
                throw new Error('No string to encode');
            }
            console.log('encoded value:');
            console.log(await encode(str));
        }
        const createFlag: FlagResult | undefined = result.value.find(v => v.key === 'create'); 
        if(createFlag) {
            const filePath: string | null = createFlag.value;
            if(!filePath) {
                throw new Error('No file path');
            }
            const file: BunFile = Bun.file(filePath);
            const colorJson = await file.json();
            const themeJson = createTheme(colorJson); 
            const createdTheme: string = await encode(themeJson); 
            const applyFlag: FlagResult | undefined = result.value.find(v => v.key === 'apply'); 
            if(!applyFlag) {
                console.log(createdTheme);
            } else {
                const firefoxFlag: FlagResult | undefined = result.value.find(v => v.key === 'firefox'); 
                let firefoxCommand: string = 'firefox';
                if(firefoxFlag && firefoxFlag.value) {
                    firefoxCommand = firefoxFlag.value;
                }
                Bun.spawn([firefoxCommand, `https://color.firefox.com?theme=${createdTheme}`]);
            }
        }
    }
}
