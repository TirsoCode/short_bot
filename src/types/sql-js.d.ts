declare module 'sql.js' {
  export interface SqlJsConfig {
    locateFile?: (file: string) => string;
  }

  export class Statement {
    bind(params?: any[]): boolean;
    run(params?: any[]): void;
    step(): boolean;
    get(): any[] | null;
    getAsObject(): { [key: string]: any };
    free(): boolean;
  }

  export class Database {
    constructor(data?: Uint8Array | ArrayBuffer | null);
    run(sql: string, params?: any[]): void;
    exec(sql: string, params?: any[]): { columns: string[]; values: any[][] }[];
    prepare(sql: string): Statement;
    export(): Uint8Array;
    close(): void;
  }

  export default function initSqlJs(config?: SqlJsConfig): Promise<any>;
}

declare module 'node-cron' {
  export interface ScheduledTask {
    stop: () => void;
    start: () => void;
  }
  function schedule(expression: string, func: () => void, options?: any): ScheduledTask;
  const cron: {
    schedule: typeof schedule;
  };
  export default cron;
}