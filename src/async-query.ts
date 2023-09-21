import { AnyAsync, UpdateOptions } from "./type";

export const defineQuery = <T>(
  arg: { query: () => AnyAsync<T>, cache?: number, eager?: T }
): [() => AnyAsync<T>, UpdateOptions<() => AnyAsync<T>>] => {
  return [arg.query, { cache: arg.cache, eager: arg.eager } satisfies UpdateOptions<() => AnyAsync<T>>];
};