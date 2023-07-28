import { andOr, anyLibProp, comparators, comparisons, reader, updateFunctions } from './constant';
import { StateAction } from './type';
import { QuerySpec } from './type-internal';

const action = [...updateFunctions, ...reader];

export const constructQuery = (
  { cursor, stateActions }: { stateActions: ReadonlyArray<StateAction>, cursor: { index: number } }
) => {
  const concatenateQueries = (queries: QuerySpec[]): QuerySpec[] => {
    const constructQuery = () => {
      const queryPaths = stateActions
        .slice(cursor.index, cursor.index + stateActions.slice(cursor.index).findIndex(sa => comparators.includes(sa.name)))
        .reduce((prev, curr) => {
          cursor.index++;
          return prev.concat(curr);
        }, new Array<StateAction>());
      const comparator = stateActions[cursor.index++];
      return (e: unknown) => comparisons[comparator.name](queryPaths.reduce((prev, curr) => prev = (prev as Record<string, unknown>)[curr.name], e), comparator.arg);
    }
    queries.push({
      query: constructQuery(),
      concat: (action.includes(stateActions[cursor.index].name) || !anyLibProp.includes(stateActions[cursor.index].name)) ? '$last' : stateActions[cursor.index].name as '$and' | '$or'
    });
    if (andOr.includes(stateActions[cursor.index].name)) {
      cursor.index++;
      return concatenateQueries(queries);
    }
    return queries;
  }
  const queries = concatenateQueries([]);
  const ors = new Array<(arg: unknown) => boolean>();
  const ands = new Array<(arg: unknown) => boolean>();
  for (let i = 0; i < queries.length; i++) {
    const previousClauseWasAnAnd = queries[i - 1] && queries[i - 1].concat === '$and';
    if (queries[i].concat === '$and' || previousClauseWasAnAnd) {
      ands.push(queries[i].query);
    }
    if ((queries[i].concat === '$or' || queries[i].concat === '$last') && ands.length) {
      const andsCopy = ands.slice();
      ors.push(el => andsCopy.every(and => and(el)));
      ands.length = 0;
    }
    if (!(queries[i].concat === '$and') && !previousClauseWasAnAnd) {
      ors.push(queries[i].query);
    }
  }
  return (e: unknown) => ors.some(fn => fn(e));
}
