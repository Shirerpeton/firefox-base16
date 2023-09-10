import { unpack, pack } from 'msgpackr';
import { cli, Result, FlagResult, CliSetting } from './cli-helper.ts';

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
        return unpacked.toString();
    } else {
        return JSON.stringify(unpacked);
    }
};

const encode = async (str: string): Promise<string> => {
    const msgPack: Buffer = pack(Buffer.from(str, "utf-8"));
    const compressed: Buffer = await compress(msgPack);
    return compressed.toString('base64url');
};

if(Bun.argv.length > 2) {
    const cliSettings: CliSetting[] = []; 
    cliSettings.push({key: 'decode', flags: ['-d', '--decode'], consumeNext: true });
    cliSettings.push({key: 'encode', flags: ['-e', '--encode'], consumeNext: true });
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
            console.log('encoded value:');
            console.log(await decode(encodedStr));
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
    }
}

