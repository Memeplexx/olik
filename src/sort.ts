import { libState } from "./constant";
import { StateAction, BasicRecord, OnChangeArray, DeepReadonlyArray, SortableProperty, SortOrder, OnChange, Read, SortMemo } from "./type";
import { StoreInternal } from "./type-internal";


export function configureSortModule() {
  libState.sortModule = {
    sortObject: memoizeSortByObjectProperty,
    sortPrimitive: memoizeSortByPrimitive,
  }
}

const memoizeSortByPrimitive = <T extends Array<SortableProperty>>(stateActions: StateAction[], name: SortOrder) => () => {
  const indexOfMemoizeSortBy = stateActions.findIndex(e => e.name === '$memoizeSort');
  const changeListeners = new Array<Parameters<OnChange<DeepReadonlyArray<SortableProperty>>['$onChange']>[0]>;
  const subStore = stateActions.reduce((acc, e, index) => {
    if (index === indexOfMemoizeSortBy - 1)
      return (acc as BasicRecord)[e.name] as StoreInternal;
    return acc;
  }, libState.store!) as unknown as OnChangeArray<T> & Read<T>;
  const $state = subStore.$state.slice().sort((a, b) => {
    const comparison = compare(a, b);
    return name === '$ascending' ? comparison : -comparison;
  });
  const onInsertOrUpdate = (inserted: DeepReadonlyArray<SortableProperty>) => {
    inserted.forEach(e => {
      const index = binarySearchIndexForPrimitive($state, e, name);
      if ($state[index] !== e)
        $state.splice(index, 0, e);
      changeListeners.forEach(cl => cl($state, $state));
    });
  }
  const onInsert = subStore.$onInsertElements(onInsertOrUpdate)
  const onUpdate = subStore.$onUpdateElements(onInsertOrUpdate);
  const onDelete = subStore.$onDeleteElements(deleted => {
    const stateBefore = $state.slice();
    deleted.forEach(e => {
      const index = binarySearchIndexForPrimitive($state, e, name);
      $state.splice(index, 1);
      changeListeners.forEach(cl => cl($state, stateBefore));
    });
  });
  return {
    $state,
    $onChange: cl => {
      changeListeners.push(cl);
      return () => changeListeners.splice(changeListeners.indexOf(cl), 1);
    },
    $destroy: () => {
      onInsert();
      onUpdate();
      onDelete();
      changeListeners.length = 0;
    },
  } as SortMemo<SortableProperty>;
}

const memoizeSortByObjectProperty = <T extends Array<BasicRecord>>(stateActions: StateAction[], name: SortOrder) => () => {
  const indexOfMemoizeSortBy = stateActions.findIndex(e => e.name === '$memoizeSortBy');
  const arrayKey = stateActions[indexOfMemoizeSortBy - 1].name;
  const propToSortBy = stateActions[indexOfMemoizeSortBy + 1].name;
  const changeListeners = new Array<Parameters<OnChange<DeepReadonlyArray<BasicRecord>>['$onChange']>[0]>;
  const subStore = stateActions.reduce((acc, e) => {
    if (e.name === arrayKey)
      return (acc as BasicRecord)[e.name] as StoreInternal;
    return acc;
  }, libState.store!) as unknown as OnChangeArray<T> & Read<T>;
  const $state = subStore.$state.slice().sort((a, b) => {
    const comparison = compare(a[propToSortBy], b[propToSortBy]);
    return name === '$ascending' ? comparison : -comparison;
  });
  const onInsertOrUpdate = (inserted: DeepReadonlyArray<BasicRecord>) => {
    const stateBefore = $state.slice();
    inserted.forEach(e => {
      const index = binarySearchIndexByProperty($state, e[propToSortBy], propToSortBy, name);
      if ($state[index]?.[propToSortBy] !== e[propToSortBy])
        $state.splice(index, 0, e);
      changeListeners.forEach(cl => cl($state, stateBefore));
    })
  }
  const onInsert = subStore.$onInsertElements(onInsertOrUpdate)
  const onUpdate = subStore.$onUpdateElements(onInsertOrUpdate);
  const onDelete = subStore.$onDeleteElements(deleted => {
    const stateBefore = $state.slice();
    deleted.forEach(e => {
      const index = binarySearchIndexByProperty($state, e[propToSortBy], propToSortBy, name);
      $state.splice(index, 1);
      changeListeners.forEach(cl => cl($state, stateBefore));
    });
  });
  return {
    $state,
    $onChange: cl => {
      changeListeners.push(cl);
      return () => changeListeners.splice(changeListeners.indexOf(cl), 1);
    },
    $destroy: () => {
      onInsert();
      onUpdate();
      onDelete();
      changeListeners.length = 0;
    },
  } as SortMemo<BasicRecord>;
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
      return mid; // Target found
    let comparison = 0;
    if (typeof targetValue === 'number' && typeof midValue === 'number')
      comparison = midValue < targetValue ? -1 : 1;
    else if (typeof targetValue === 'string' && typeof midValue === 'string')
      comparison = midValue.localeCompare(targetValue);
    if (order === '$ascending') {
      if (comparison < 0)
        left = mid + 1;
      else
        right = mid;
    } else {
      if (comparison > 0)
        left = mid + 1;
      else
        right = mid;
    }
  }
  return left; // Target not found, return the insertion point
}

const binarySearchIndexForPrimitive = <T extends SortableProperty>(array: T[], target: T, order: SortOrder) => {
  let left = 0;
  let right = array.length;
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    const comparison = compare(array[mid], target);
    if (comparison === 0)
      return mid; // Target found
    if (order === '$ascending') {
      if (comparison < 0)
        left = mid + 1;
      else
        right = mid;
    } else {
      if (comparison > 0)
        left = mid + 1;
      else
        right = mid;
    }
  }
  return left; // Target not found, return the insertion point
}

const compare = <T>(a: T, b: T): number => {
  if (typeof a === 'number' && typeof b === 'number')
    return a - b;
  else if (typeof a === 'string' && typeof b === 'string')
    return a.localeCompare(b);
  else if (a instanceof Date && b instanceof Date)
    return a.getTime() - b.getTime();
  throw new Error('Unsupported type comparison');
};
