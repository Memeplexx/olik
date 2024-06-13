import { libState } from "./constant";
import { StateAction, BasicRecord, OnChangeArray, SortableProperty, SortOrder, OnChange, Read, SortMemo } from "./type";
import { StoreInternal } from "./type-internal";


export function configureSortModule() {
  libState.sortModule = {
    sortObject,
    sortPrimitive,
  }
}

const sortPrimitive = <T extends Array<SortableProperty>>(stateActions: StateAction[], name: SortOrder) => () => {
  const changeListeners = new Array<Parameters<OnChange<SortableProperty[]>['$onChange']>[0]>;
  const subStore = stateActions.slice(0, stateActions.findIndex(e => e.name === '$createSortedList'))
    .reduce((acc, e) => (acc as BasicRecord)[e.name] as StoreInternal, libState.store!) as unknown as OnChangeArray<T[0]> & Read<T>;
  let $state = subStore.$state.slice().sort((a, b) => {
    const comparison = compare(a, b);
    return name === '$ascending' ? comparison : -comparison;
  });
  const onChangeArray = subStore.$onChangeArray(({ inserted, deleted, updated }) => {
    const stateCopied = $state.slice();
    deleted.forEach(e => {
      const index = binarySearchIndexForPrimitive(stateCopied, e, name);
      stateCopied.splice(index, 1);
    });
    inserted.forEach(e => {
      const index = binarySearchIndexForPrimitive(stateCopied, e, name);
      if (stateCopied[index] !== e)
        stateCopied.splice(index, 0, e);
    });
    updated.forEach(e => {
      const index = binarySearchIndexForPrimitive(stateCopied, e, name);
      if (stateCopied[index] !== e)
        stateCopied.splice(index, 0, e);
    });
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
          onChangeArray();
          changeListeners.length = 0;
        }
      }
  });
}

const sortObject = <T extends Array<BasicRecord>>(stateActions: StateAction[], name: SortOrder) => () => {
  const indexOfMemoizeSortBy = stateActions.findIndex(e => e.name === '$createSortedList');
  const idProp = stateActions[indexOfMemoizeSortBy + 2].name;
  const propToSortBy = stateActions[indexOfMemoizeSortBy + 4].name;
  const changeListeners = new Array<Parameters<OnChange<BasicRecord[]>['$onChange']>[0]>;
  const subStore = stateActions.slice(0, indexOfMemoizeSortBy)
    .reduce((acc, e) => (acc as BasicRecord)[e.name] as StoreInternal, libState.store!) as unknown as OnChangeArray<T[0]> & Read<T>;
  let $state = subStore.$state.slice().sort((a, b) => {
    const comparison = compare(a[propToSortBy], b[propToSortBy]);
    return name === '$ascending' ? comparison : -comparison;
  });
  const onChangeArray = subStore.$onChangeArray(({ inserted, deleted, updated }) => {
    const stateCopied = $state.slice();
    deleted.forEach(e => {
      const index = binarySearchIndexByProperty(stateCopied, e[propToSortBy], propToSortBy, name);
      stateCopied.splice(index, 1);
    });
    inserted.forEach(e => {
      const index = binarySearchIndexByProperty(stateCopied, e[propToSortBy], propToSortBy, name);
      if (stateCopied[index]?.[propToSortBy] !== e[propToSortBy])
        stateCopied.splice(index, 0, e);
    });
    updated.forEach(e => stateCopied.forEach((sa, i) => {
      if (sa[idProp] !== e[idProp]) return;
      stateCopied[i] = e;
    }));
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
          onChangeArray();
          changeListeners.length = 0;
        }
      }
  });
}

const binarySearchIndexByProperty = <T>(array: T[], target: T[keyof T], property: keyof T, order: SortOrder) => {
  let left = 0;
  let right = array.length;
  const targetValue = target instanceof Date ? target.getTime() :
    typeof target === 'number' ? target :
      String(target);
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    const midValue = array[mid][property] instanceof Date ? (array[mid][property] as Date).getTime() :
      typeof array[mid][property] === 'number' ? array[mid][property] as number :
        String(array[mid][property]);
    if (midValue === targetValue)
      return mid;
    let comparison = 0;
    if (typeof targetValue === 'number' && typeof midValue === 'number')
      comparison = midValue < targetValue ? -1 : 1;
    else if (typeof targetValue === 'string' && typeof midValue === 'string')
      comparison = midValue.localeCompare(targetValue);
    if (order === '$ascending')
      if (comparison < 0) left = mid + 1; else right = mid;
    else
      if (comparison > 0) left = mid + 1; else right = mid;
  }
  return left;
}

const binarySearchIndexForPrimitive = <T extends SortableProperty>(array: T[], target: T, order: SortOrder) => {
  let left = 0;
  let right = array.length;
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    const comparison = compare(array[mid], target);
    if (comparison === 0)
      return mid;
    if (order === '$ascending')
      if (comparison < 0) left = mid + 1; else right = mid;
    else
      if (comparison > 0) left = mid + 1; else right = mid;
  }
  return left;
}

const compare = <T>(a: T, b: T): number => {
  if (typeof a === 'number' && typeof b === 'number')
    return a - b;
  else if (typeof a === 'string' && typeof b === 'string')
    return a.localeCompare(b);
  else if (a instanceof Date && b instanceof Date)
    return a.getTime() - b.getTime();
  throw new Error(`Unsupported type comparison: ${typeof(a)}  ${typeof(b)}`);
};
