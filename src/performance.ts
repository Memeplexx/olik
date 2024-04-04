import { testState } from "./constant";

export const perf = new Map<string, Array<number>>();
export const perfSet = (key: string) => {
  if (!testState.isPerf) return;
  if (!perf.has(key)) {
    perf.set(key, []);
  }
  perf.get(key)?.push(performance.now());
}

export const perfGet = () => {
  if (!testState.isPerf) return;
  const result: Record<string, number> = {};
  const keys = Array.from(perf.keys());
  for (let i = 1; i < keys.length; i++) {
    const distances = new Array<number>();
    const valuesPrev = perf.get(keys[i - 1])!;
    const valuesCurr = perf.get(keys[i])!;
    for (let j = 0; j < valuesCurr.length; j++) {
      distances.push(valuesCurr[j] - valuesPrev[j]);
    }
    result[keys[i]] = distances.reduce((a, b) => a + b, 0);
  }
  // const resultTotal = Object.values(result).reduce((a, b) => a + b, 0);
  // console.log('total', resultTotal);
  return result;
}