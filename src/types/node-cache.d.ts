declare module 'node-cache' {
  export interface Options {
    stdTTL?: number;
    checkperiod?: number;
    useClones?: boolean;
    deleteOnExpire?: boolean;
  }
  export default class NodeCache {
    constructor(options?: Options);
    set<T>(key: string, value: T, ttl?: number): boolean;
    get<T>(key: string): T | undefined;
    del(keys: string | string[]): number;
    flushAll(): void;
  }
}
