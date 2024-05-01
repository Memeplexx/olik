import { comparisons } from './constant';
import { StateAction, ValidJsonObject } from './type';
import { comparatorsPropMap, libPropMap, readPropMap, updatePropMap } from './type-check';
import { Cursor, QuerySpec, StoreInternal } from './type-internal';


const andOrMap = { $and: true, $or: true };
const emptyArray = [] as QuerySpec[];

export const constructQuery = (
  stateActions: ReadonlyArray<StateAction>, 
  cursor: Cursor,
) => {
  const recurse = (queries: QuerySpec[]): QuerySpec[] => {
    const constructQuery = () => {
      const nextComparatorIndex = stateActions.slice(cursor.index).findIndex(sa => comparatorsPropMap[sa.name]);
      const subStateActions = stateActions.slice(cursor.index, cursor.index + nextComparatorIndex);
      cursor.index += subStateActions.length;
      const comparator = stateActions[cursor.index];
      cursor.index++
      return (e: unknown) => {
        const subProperty = subStateActions.reduce((prev, curr) => prev ? (prev as ValidJsonObject)[curr.name] : undefined, e);
        const comparatorName = comparator.name as keyof typeof comparisons;
        const comparison = comparisons[comparatorName];
        if (!comparison) throw new Error();
        const comparatorArg = comparator.arg;
        return comparison(subProperty, (comparatorArg as ValidJsonObject)['$stateActions'] ? (comparatorArg as StoreInternal).$state : comparatorArg);
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
  emptyArray.length = 0;
  const queries = recurse(emptyArray);
  const ors = new Array<(arg: unknown) => boolean>();
  const ands = new Array<(arg: unknown) => boolean>();
  let prevQuery = null as (QuerySpec | null);
  for (const query of queries) {
    const previousClauseWasAnAnd = prevQuery?.concat === '$and';
    const concat = query.concat;
    if (concat === '$and' || previousClauseWasAnAnd) {
      ands.push(query.query);
    }
    if ((concat === '$or' || concat === '$last') && ands.length) {
      const andsCopy = [...ands];
      ors.push(el => andsCopy.every(and => and(el)));
      ands.length = 0;
    }
    if (!(concat === '$and') && !previousClauseWasAnAnd) {
      ors.push(query.query);
    }
    prevQuery = query;
  }
  return (e: unknown) => ors.some(fn => fn(e));
}
