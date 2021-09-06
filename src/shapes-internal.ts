import {
  DeepReadonly,
  FindOrFilter,
  Future,
  PredicateFunctionObject,
  Selector,
  Store,
  StoreForAComponent,
  StoreForAnObject,
  StoreOrDerivation,
  Trackability,
} from './shapes-external';

export type UpdateStateArgs<S, C, X extends C = C> = {
  selector: Selector<S, C, X>,
  replacer: (newNode: DeepReadonly<X>) => any,
  pathSegments?: string[],
  actionName: string,
  payload?: any,
  updateOptions: {} | void,
  getPayloadFn?: () => any,
  storeState: StoreState<S>,
};

export type StoreForAComponentInternal<S, C> = Store<C, 'untagged'> & {
  defineReset: (initState: S, selector?: (arg: any) => C) => () => any;
  isComponentStore: boolean;
} & StoreForAComponent<C>;

export type DevtoolsInstance = {
  init: (state: any) => any,
  subscribe: (listener: (message: { type: string, payload: any, state?: any, source: string }) => any) => any,
  unsubscribe: () => any,
  send: (action: { type: string }, state: any) => any
}

export type WindowAugmentedWithReduxDevtools = {
  __REDUX_DEVTOOLS_EXTENSION__: {
    connect: (options?: any) => DevtoolsInstance;
    disconnect: () => any;
    send: (action: { type: string, payload?: any }, state: any, options: { name: string }) => any;
    _mockInvokeSubscription: (message: { type: string, payload: any, state?: any, source: any }) => any,
    _subscribers: Array<(message: { type: string, payload: any, state?: any, source: any }) => any>,
  }
}

export type ArrayOperatorState<S, C, X extends C & Array<any>, F extends FindOrFilter, T extends Trackability> = {
  whereClauseSpecs: Array<{ filter: (arg: X[0]) => boolean, type: 'and' | 'or' | 'last' }>,
  whereClauseStrings: Array<string>,
  getCurrentState: () => S,
  whereClauseString: string,
  criteria: (arg: X[0], fn: (arg: X[0]) => boolean) => boolean,
  recurseWhere: PredicateFunctionObject<X, F, T>,
  comparator: (e: X[0]) => boolean,
  selector: Selector<S, C, X>,
  type: FindOrFilter,
  select: (selector?: (s: S) => C) => any,
  storeState: StoreState<S>,
  payloadWhereClauses: Array<any>,
  where?: string;
};

export type ArrayCustomState<S, C, X extends C & Array<any>> = {
  type: FindOrFilter,
  selector: Selector<S, C, X>,
  getCurrentState: () => S,
  predicate: (element: DeepReadonly<X[0]>) => boolean,
  select: (selector?: (s: S) => C) => any,
  storeState: StoreState<S>,
}

export type CoreActionsState<S, C, X extends C & Array<any>> = {
  selector: Selector<S, C, X>,
  isComponentStore: () => boolean,
  storeState: StoreState<S>,
  select: (selector?: (s: S) => C) => any,
  initialState: S,
  getCurrentState: () => S,
}

export type PreviousAction = {
  timestamp: number,
  type: string,
  payloads: any[],
  debounceTimeout: number,
};

export type OptionsForCreatingInternalApplicationStore = {
  devtools?: any;
  actionTypesToIncludeTag?: boolean,
  actionTypeTagAbbreviator?: (tag: string) => string,
  actionTypesToIncludeWhereClause?: boolean,
  actionTypeWhereClauseAbbreviator?: (tag: string) => string,
  replaceExistingStoreIfItExists?: boolean,
};

export type StoreWhichMayContainComponentStores<S, C, T extends Trackability> = {
  remove: () => any;
} & StoreForAnObject<C, T> & StoreOrDerivation<C>;

export type ComponentContainerStore = ((selector?: ((s: any) => any) | undefined) => StoreWhichMayContainComponentStores<any, any, any>) | undefined;

export type StoreState<S> = {
  bypassSelectorFunctionCheck: boolean,
  activeFutures: { [key: string]: Future<any> },
  transactionActions: Array<{ type: string }>,
  transactionStartState: any,
  devtoolsDispatchListener?: (action: { type: string, payload?: any }) => any,
  actionTypesToIncludeTag: boolean,
  actionTypeTagAbbreviator?: (tag: string) => string,
  actionTypeWhereClauseMaxValueLength: number,
  changeListeners: Map<(ar: any) => any, (arg: S) => any>,
  previousAction: PreviousAction,
  currentState: S,
  initialState: S,
}
