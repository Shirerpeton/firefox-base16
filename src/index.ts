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
        for await (const chunk of lzcat.stderr) {
            console.log('aaaaa');
            //console.error(chunk);
        }
        await lzcat.exited; 
        if(lzcat.exitCode != 0) {
            reject(new Error(`lzcat returned non-zero exit code ${lzcat.exitCode}.`));
            return;
        }
        resolve(Buffer.concat(dataChunks));
    });
}

const decode = async (str: string): Promise<string> => {
    return unpack(await decompress(Buffer.from(str, 'base64url')));
};

if(Bun.argv.length > 2) {
    const cliSettings: CliSetting[] = []; 
    cliSettings.push({key: 'decode', flags: ['-d', '--decode'], consumeNext: true });
    const result: Result<FlagResult[]> = cli(cliSettings, Bun.argv.slice(2));
    if(result.value instanceof Error) {
        console.error(result.value);
    } else {
        const encodedStr = result.value.find(v => v.key === 'decode')?.value;
        if(!encodedStr) {
            throw new Error('No string to decode');
        }
        console.log(await decode(encodedStr));
    }
}

