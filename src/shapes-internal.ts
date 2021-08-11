import {
  DeepReadonly,
  FindOrFilter,
  Future,
  OptionsForReduxDevtools,
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
    connect: (options: OptionsForReduxDevtools) => DevtoolsInstance;
    disconnect: () => any;
    send: (action: { type: string, payload?: any }, state: any, options: OptionsForReduxDevtools) => any;
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
  fn: (e: X[0]) => boolean,
  selector: Selector<S, C, X>,
  type: FindOrFilter,
  storeResult: (selector?: (s: S) => C) => any,
  storeState: StoreState<S>,
};

export type ArrayCustomState<S, C, X extends C & Array<any>, T extends Trackability> = {
  type: FindOrFilter,
  selector: Selector<S, C, X>,
  getCurrentState: () => S,
  predicate: (element: DeepReadonly<X[0]>) => boolean,
  storeResult: (selector?: (s: S) => C) => any,
  storeState: StoreState<S>,
}

export type CoreActionsState<S, C, X extends C & Array<any>, T extends Trackability> = {
  selector: Selector<S, C, X>,
  isComponentStore: () => boolean,
  storeState: StoreState<S>,
  storeResult: (selector?: (s: S) => C) => any,
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
  devtools?: OptionsForReduxDevtools | false,
  tagSanitizer?: (tag: string) => string,
  actionTypesToIncludeTag?: boolean,
  actionTypesToIncludeWhereClause?: boolean,
  mergeIntoExistingStoreIfItExists?: boolean,
};

export type StoreWhichMayContainComponentStores<S, C, T extends Trackability> = {
  renew: (state: S) => void;
} & StoreForAnObject<C, T> & StoreOrDerivation<C>;

export type ComponentContainerStore = ((selector?: ((s: any) => any) | undefined) => StoreWhichMayContainComponentStores<any, any, any>) | undefined;

export type StoreState<S> = {
  bypassSelectorFunctionCheck: boolean,
  activeFutures: { [key: string]: Future<any> },
  transactionActions: Array<{ type: string }>,
  transactionStartState: any,
  devtoolsDispatchListener?: (action: { type: string, payload?: any }) => any,
  actionTypesToIncludeTag: boolean,
  actionTypesToIncludeWhereClause: boolean,
  tagSanitizer?: (tag: string) => string,
  changeListeners: Map<(ar: any) => any, (arg: S) => any>,
  previousAction: PreviousAction,
  currentState: S,
  initialState: S,
}
