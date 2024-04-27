import { comparisons } from './constant';
import { StateAction } from './type';
import { is } from './type-check';
import { Cursor, QuerySpec } from './type-internal';


const andOrMap = { $and: true, $or: true };

export const constructQuery = (
  stateActions: ReadonlyArray<StateAction>, 
  cursor: Cursor,
) => {
  const recurse = (queries: QuerySpec[]): QuerySpec[] => {
    const constructQuery = () => {
      const nextComparatorIndex = stateActions.slice(cursor.index).findIndex(sa => is.anyComparatorProp(sa.name));
      const subStateActions = stateActions.slice(cursor.index, cursor.index + nextComparatorIndex);
      cursor.index += subStateActions.length;
      const comparator = stateActions[cursor.index];
      cursor.index++
      return (e: unknown) => {
        const subProperty = subStateActions.reduce((prev, curr) => is.record(prev) ? prev[curr.name] : undefined, e);
        const comparatorName = comparator.name as keyof typeof comparisons;
        if (!comparisons[comparatorName]) throw new Error();
        return comparisons[comparatorName](subProperty, is.storeInternal(comparator.arg) ? comparator.arg.$state : comparator.arg);
      }
    }
    const constructConcat = () => {
      const type = stateActions[cursor.index].name;
      return (is.anyUpdateFunction(type) || is.anyReadFunction(type) || !is.anyLibProp(type)) ? '$last' : type as '$and' | '$or';
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
  const queries = recurse([]);
  const ors = new Array<(arg: unknown) => boolean>();
  const ands = new Array<(arg: unknown) => boolean>();
  queries.forEach((query, i) => {
    const previousClauseWasAnAnd = queries[i - 1]?.concat === '$and';
    if (query.concat === '$and' || previousClauseWasAnAnd) {
      ands.push(query.query);
    }
    if ((query.concat === '$or' || query.concat === '$last') && ands.length) {
      const andsCopy = [...ands];
      ors.push(el => andsCopy.every(and => and(el)));
      ands.length = 0;
    }
    if (!(query.concat === '$and') && !previousClauseWasAnAnd) {
      ors.push(query.query);
    }
  });
  return (e: unknown) => ors.some(fn => fn(e));
}
