import { comparatorsPropMap, comparisons, libPropMap, readPropMap, updatePropMap } from './constant';
import { StateAction, BasicRecord } from './type';
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
      for (let i = cursorIndex; i < stateActions.length; i++)
        if (stateActions[i].name in comparatorsPropMap) {
          nextComparatorIndex = i - cursorIndex;
          break;
        }
      const index = cursor.index;
      cursor.index += nextComparatorIndex;
      const { name: comparatorName, arg: comparatorArg } = stateActions[cursor.index] as { name: keyof typeof comparisons, arg: { $stateActions: StateAction[], $state: unknown } };
      cursor.index++
      return (e: unknown) => {
        let subProperty = e;
        for (let i = index; i < index + nextComparatorIndex; i++)
          subProperty = subProperty ? (subProperty as BasicRecord)[stateActions[i].name] : undefined;
        const comparison = comparisons[comparatorName];
        if (!comparison) 
          throw new Error();
        return comparison(subProperty, comparatorArg.$state ?? comparatorArg);
      }
    }
    const constructConcat = () => {
      const { name } = stateActions[cursor.index];
      return (name in updatePropMap || name in readPropMap || !(name in libPropMap)) ? '$last' : name as '$and' | '$or';
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
  for (let i = 0; i < queries.length; i++) {
    const { concat, query } = queries[i];
    const previousClauseWasAnAnd = queries[i - 1]?.concat === '$and';
    const concatWasAnAnd = concat === '$and';
    if (concatWasAnAnd || previousClauseWasAnAnd)
      ands.push(query);
    if ((concat === '$or' || concat === '$last') && ands.length) {
      const andsCopy = [...ands];
      ors.push(el => andsCopy.every(and => and(el)));
      ands.length = 0;
    }
    if (!concatWasAnAnd && !previousClauseWasAnAnd)
      ors.push(query);
  }
  return (e: unknown) => ors.some(fn => fn(e));
}
