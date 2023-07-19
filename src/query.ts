import { comparisons } from './constant';
import { StateAction } from './type';
import { mustBe } from './type-check';
import { QuerySpec } from './type-internal';

const actionProperty = ['action', 'property'];

export const constructQuery = (
  { cursor, stateActions }: { stateActions: ReadonlyArray<StateAction>, cursor: { index: number } }
) => {
  const concatenateQueries = (queries: QuerySpec[]): QuerySpec[] => {
    const constructQuery = () => {
      const queryPaths = stateActions
        .slice(cursor.index, cursor.index + stateActions.slice(cursor.index).findIndex(sa => sa.type === 'comparator'))
        .reduce((prev, curr) => {
          cursor.index++;
          return prev.concat(curr);
        }, new Array<StateAction>());
      const comparator = stateActions[cursor.index++];
      return (e: unknown) => comparisons[comparator.name](queryPaths.reduce((prev, curr) => prev = mustBe.record(prev)[curr.name], e), comparator.arg);
    }
    queries.push({
      query: constructQuery(),
      concat: actionProperty.includes(stateActions[cursor.index].type) ? '$last' : stateActions[cursor.index].name as '$and' | '$or'
    });
    if (stateActions[cursor.index].type === 'searchConcat') {
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
