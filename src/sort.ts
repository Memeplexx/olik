import { libState } from "./constant";
import { StateAction, BasicRecord, SortableProperty, SortOrder, OnChange, Read, SortMemo, OnArray } from "./type";


export function configureSortModule() {
  libState.sortModule = {
    sortObject,
    sortPrimitive,
  }
}

const sortPrimitive = <T extends Array<SortableProperty>>(stateActions: StateAction[], name: SortOrder) => () => {
  const changeListeners = new Array<Parameters<OnChange<SortableProperty[]>['$onChange']>[0]>;
  const subStore = stateActions.slice(0, stateActions.findIndex(e => e.name === '$deriveSortedList'))
    .reduce((acc, e) => (acc as BasicRecord)[e.name] as BasicRecord, libState.store!) as unknown as OnArray<T> & Read<T>;
  let $state = subStore.$state.slice().sort((a, b) => {
    const comparison = compare(a, b);
    return name === '$ascending' ? comparison : -comparison;
  });
  const onArrayInsert = subStore.$onArray.$elementsInserted(inserted => {
    const stateCopied = $state.slice();
    inserted.forEach(e => stateCopied.splice(searchForInsertionIndexWithinScalarArray(stateCopied, e, name), 0, e));
    changeListeners.forEach(cl => cl(stateCopied, $state));
    $state = stateCopied;
  });
  const onArrayDelete = subStore.$onArray.$elementsDeleted(deleted => {
    const stateCopied = $state.slice();
    deleted.forEach(e => stateCopied.splice(stateCopied.findIndex(sa => sa === e), 1));
    changeListeners.forEach(cl => cl(stateCopied, $state));
    $state = stateCopied;
  });
  const onArrayUpdate = subStore.$onArray.$elementsUpdated(updated => {
    const stateCopied = $state.slice();
    updated.forEach(e => stateCopied.splice(stateCopied.findIndex(sa => sa === e), 1, e));
    changeListeners.forEach(cl => cl(stateCopied, $state));
    $state = stateCopied;
  });
  return new Proxy({} as SortMemo<SortableProperty>, {
    get: (_, prop: string) => {
      if (prop === '$state')
        return $state;
      if (prop === '$onChange')
        return (cl => {
          changeListeners.push(cl);
          return () => changeListeners.splice(changeListeners.indexOf(cl), 1);
        }) as SortMemo<SortableProperty>['$onChange'];
      if (prop === '$destroy')
        return () => {
          onArrayInsert();
          onArrayDelete();
          onArrayUpdate();
          changeListeners.length = 0;
        }
      }
  });
}

const sortObject = <T extends Array<BasicRecord>>(stateActions: StateAction[], name: SortOrder) => () => {
  const indexOfMemoizeSortBy = stateActions.findIndex(e => e.name === '$deriveSortedList');
  const idProp = stateActions[indexOfMemoizeSortBy + 2].name;
  const propToSortBy = stateActions[indexOfMemoizeSortBy + 4].name;
  const changeListeners = new Array<Parameters<OnChange<BasicRecord[]>['$onChange']>[0]>;
  const subStore = stateActions.slice(0, indexOfMemoizeSortBy)
    .reduce((acc, e) => (acc as BasicRecord)[e.name] as BasicRecord, libState.store!) as unknown as OnArray<T> & Read<T>;
  let $state = subStore.$state.slice().sort((a, b) => {
    const comparison = compare(a[propToSortBy], b[propToSortBy]);
    return name === '$ascending' ? comparison : -comparison;
  });
  const onArrayInsert = subStore.$onArray.$elementsInserted(inserted => {
    const stateCopied = $state.slice();
    inserted.forEach(e => stateCopied.splice(searchForInsertionIndexWithinObjectArray(stateCopied, e[propToSortBy], propToSortBy, name), 0, e));
    changeListeners.forEach(cl => cl(stateCopied, $state));
    $state = stateCopied;
  });
  const onArrayDelete = subStore.$onArray.$elementsDeleted(deleted => {
    const stateCopied = $state.slice();
    deleted.forEach(e => stateCopied.splice(stateCopied.findIndex(sa => sa[idProp] === e[idProp]), 1));
    changeListeners.forEach(cl => cl(stateCopied, $state));
    $state = stateCopied;
  });
  const onArrayUpdate = subStore.$onArray.$elementsUpdated(updated => {
    const stateCopied = $state.slice();
    updated.forEach(e => stateCopied.splice(stateCopied.findIndex(sa => sa[idProp] === e[idProp]), 1, e));
    changeListeners.forEach(cl => cl(stateCopied, $state));
    $state = stateCopied;
  });
  return new Proxy({} as SortMemo<BasicRecord>, {
    get: (_, prop: string) => {
      if (prop === '$state')
        return $state;
      if (prop === '$onChange')
        return (cl => {
          changeListeners.push(cl);
          return () => changeListeners.splice(changeListeners.indexOf(cl), 1);
        }) as SortMemo<BasicRecord>['$onChange'];
      if (prop === '$destroy')
        return () => {
          onArrayInsert();
          onArrayDelete();
          onArrayUpdate();
          changeListeners.length = 0;
        }
      }
  });
}

const searchForInsertionIndexWithinObjectArray = <T>(array: T[], target: T[keyof T], property: keyof T, order: SortOrder) => {
  for (let i = 0, j = array.length - 1; i < array.length; i++, j--) {
    const index = order === '$ascending' ? i : j;
    const a = array[index][property]
    const b = target;
    const result = compare(a, b);
    if (order === '$ascending' ? result > 0 : result < 0)
      return index;
  }
  return array.length;
}

const searchForInsertionIndexWithinScalarArray = <T extends SortableProperty>(array: T[], target: T, order: SortOrder) => {
  for (let i = 0, j = array.length - 1; i < array.length; i++, j--) {
    const index = order === '$ascending' ? i : j;
    const a = array[index]
    const b = target;
    const result = compare(a, b);
    if (order === '$ascending' ? result > 0 : result < 0)
      return index;
  }
  return array.length;
}

function compare<T>(a: T, b: T): number {
  if (typeof a === 'number' && typeof b === 'number')
    return a - b;
  else if (typeof a === 'string' && typeof b === 'string')
    return a.localeCompare(b);
  else if (a instanceof Date && b instanceof Date)
    return a.getTime() - b.getTime();
  throw new Error(`Unsupported type comparison: ${typeof(a)}  ${typeof(b)}`);
}
