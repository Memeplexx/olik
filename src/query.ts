import { comparisons } from './constant';
import { StateAction, ValidJsonObject } from './type';
import { comparatorsPropMap, libPropMap, readPropMap, updatePropMap } from './type-check';
import { Cursor, QuerySpec } from './type-internal';


const andOrMap = { $and: true, $or: true };
const recurseArray = [] as QuerySpec[];
const ors = [] as Array<(arg: unknown) => boolean>;
const ands = [] as Array<(arg: unknown) => boolean>;

export const constructQuery = (
  stateActions: ReadonlyArray<StateAction>, 
  cursor: Cursor,
) => {
  const recurse = (queries: QuerySpec[]): QuerySpec[] => {
    const constructQuery = () => {
      let nextComparatorIndex = 0;
      const cursorIndex = cursor.index;
      for (let i = cursorIndex; i < stateActions.length; i++) {
        if (comparatorsPropMap[stateActions[i].name]) {
          nextComparatorIndex = i - cursorIndex;
          break;
        }
      }
      const subStateActions = stateActions.slice(cursor.index, cursor.index + nextComparatorIndex);
      cursor.index += subStateActions.length;
      const { name: comparatorName, arg: comparatorArg } = stateActions[cursor.index] as { name: keyof typeof comparisons, arg: { $stateActions: StateAction[], $state: unknown } };
      cursor.index++
      return (e: unknown) => {
        const subProperty = subStateActions.reduce((prev, curr) => prev ? (prev as ValidJsonObject)[curr.name] : undefined, e);
        const comparison = comparisons[comparatorName];
        if (!comparison) throw new Error();
        return comparison(subProperty, comparatorArg.$state ?? comparatorArg);
      }
    }
    const constructConcat = () => {
      const type = stateActions[cursor.index].name;
      return (updatePropMap[type] || readPropMap[type] || !libPropMap[type]) ? '$last' : type as '$and' | '$or';
    }
    queries.push({
      query: constructQuery(),
      concat: constructConcat(),
    });
    if (stateActions[cursor.index].name in andOrMap) {
      cursor.index++;
      return recurse(queries);
    }
    return queries;
  }
  recurseArray.length = 0;
  ors.length = 0;
  ands.length = 0;
  const queries = recurse(recurseArray);
  let prevQuery = null as (QuerySpec | null);
  for (const q of queries) {
    const { concat, query } = q;
    const previousClauseWasAnAnd = prevQuery?.concat === '$and';
    if (concat === '$and' || previousClauseWasAnAnd) {
      ands.push(query);
    }
    if ((concat === '$or' || concat === '$last') && ands.length) {
      const andsCopy = [...ands];
      ors.push(el => andsCopy.every(and => and(el)));
      ands.length = 0;
    }
    if (!(concat === '$and') && !previousClauseWasAnAnd) {
      ors.push(query);
    }
    prevQuery = q;
  }
  return (e: unknown) => ors.some(fn => fn(e));
}
