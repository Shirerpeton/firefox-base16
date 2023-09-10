export type Result<T> = {
    value: T | Error
}

export type CliSetting = {
    flags: string[],
    consumeNext: boolean,
    key: string
}

export type FlagResult = {
    key: string,
    value: string | null
}

export function cli(settings: CliSetting[], args: string[]): Result<FlagResult[]> {
    const valueResult: FlagResult[] = [];
    const result: Result<FlagResult[]> = { value: valueResult};
    for(let i = 0; i < args.length; i++) {
        const flag: string = args[i];
        let matched: boolean = false;
        for(const setting of settings) {
            if(setting.flags.includes(flag)) {
                const flagResult: FlagResult = { key: setting.key, value: null };
                if(setting.consumeNext) {
                    if(args.length > i + 1) {
                        flagResult.value = args[i + 1];
                        i++;
                    } else {
                        result.value = new Error(`Not enough arguments. Flag ${flag} expects another argument afterwards`);
                        return result;
                    }
                    valueResult.push(flagResult);
                    matched = true;
                    break;
                }
            }
        }
        if(!matched) {
            result.value = new Error(`Unknown flag ${flag}`);
            return result;
        }
    }
    return result;
}
