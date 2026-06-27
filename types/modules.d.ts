declare module "sql.js" {
  export interface SqlJsStatic {
    Database: new (data?: ArrayLike<number> | Buffer | null) => Database;
  }

  export interface Database {
    exec(sql: string): QueryExecResult[];
    close(): void;
  }

  export interface QueryExecResult {
    columns: string[];
    values: unknown[][];
  }

  export interface InitSqlJsConfig {
    locateFile?: (file: string) => string;
  }

  export default function initSqlJs(
    config?: InitSqlJsConfig
  ): Promise<SqlJsStatic>;
}

declare module "fflate" {
  export function unzipSync(data: Uint8Array): Record<string, Uint8Array>;
}
