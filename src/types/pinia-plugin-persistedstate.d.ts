// src/types/pinia-plugin-persistedstate.d.ts
import 'pinia';

declare module 'pinia' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-object-type
  export interface DefineStoreOptions<Id extends string = string, S = {}, G = {}, A = {}> {
    persist?: boolean | PersistedStateOptions | PersistedStateOptions[];
  }
}

interface PersistedStateOptions {
  key?: string;
  storage?: Storage;
  paths?: string[];
}
