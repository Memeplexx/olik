import { errorMessages, libState, testState } from './constant';
import { Read, Set } from './type';
import { StoreInternal, WindowAugmentedWithOlikDevtools } from './type-internal';


export const jumpToStateAction = ['JUMP_TO_STATE', 'JUMP_TO_ACTION'];

export function connectOlikDevtoolsToStore() {
  importOlikDevtoolsModule();
  libState.olikDevtools!.init();
}

export function importOlikDevtoolsModule() {
  libState.olikDevtools = {
    init: () => {
      const store = libState.store;
      const internals = (store as StoreInternal<any>).$internals;
  
      // do not continue if store has been nested or merged
      if (!!internals.nestedStoreInfo?.isNested || !!internals.mergedStoreInfo?.isMerged) { return; }
  
      // mock out the window object for testing purposes
      const windowObj = (testState.fakeWindowObjectForOlikDevtools || window) as WindowAugmentedWithOlikDevtools;
  
      // If user does not have devtools installed or enabled, warn & return.
      if (!windowObj.__OLIK_DEVTOOLS_EXTENSION__) {
        console.warn('Please add the Olik Devtools Component');
        return;
      }
  
      // If a devtools instance has already been registered, do not re-create that instance.
      // This problem really only presents its self when hot-reloading is being used
      let devTools = internals.olikDevtools?.instance;
      if (devTools) { return; }
  
      // Register devtools extension
      devTools = windowObj.__OLIK_DEVTOOLS_EXTENSION__.connect();
      devTools.init(store.$state);
      internals.olikDevtools = { instance: devTools, disableDispatch: false };
  
      const setState = (state: any) => {
        internals.olikDevtools!.disableDispatch = true;
        const selection = store as any as Set<any> & Read<any>;
        selection.$set(state);
        internals.olikDevtools!.disableDispatch = false;
      }
  
      // Ensure that the store responds to events emitted from the devtools extension
      devTools.subscribe(message => {
        if ('ACTION' === message.type) {
          let messagePayload: { type: string, payload: any };
          try {
            messagePayload = JSON.parse(message.payload.replace(/"\s+|\s+"/g, '"'));
          } catch (e) {
            throw Error(errorMessages.DEVTOOL_DISPATCHED_INVALID_JSON);
          }
          let pathSegments = messagePayload.type.split('.');
          const action = pathSegments.pop() as string;
          let selection: any = store;
          pathSegments.forEach(seg => selection = selection[seg] as any);
          selection[action.substring(0, action.length - 2)](messagePayload.payload);
          libState.onInternalDispatch();
        } else if ('EXPORT' === message.type) {
          const url = window.URL.createObjectURL(new Blob([JSON.stringify(store.$state)], { type: 'application/json' }));
          document.body.appendChild(Object.assign(document.createElement('a'), {
            style: { display: 'none' },
            href: url,
            download: `store.json`
          })).click();
          window.URL.revokeObjectURL(url);
        } else if ('DISPATCH' === message.type && message.payload) {
          if (jumpToStateAction.includes(message.payload.type)) {
            setState(JSON.parse(message.state));
            libState.onInternalDispatch();
          } else if ('COMMIT' === message.payload.type) {
            devTools!.init(store.$state);
          } else if ('ROLLBACK' === message.payload.type) {
            const parsedState = JSON.parse(message.state);
            setState(parsedState);
            devTools!.init(parsedState);
          } else if ('IMPORT_STATE' === message.payload.type) {
            setState(message.payload.nextLiftedState);
            libState.onInternalDispatch();
          }
        }
      });
    },
    dispatch: (stateReader, mutator) => {
      const store = libState.store;
      const internals = store.$internals;
  
      // Dispatch to devtools
      if (internals.olikDevtools && !internals.olikDevtools.disableDispatch) {
        const currentAction = internals.currentAction;
        testState.currentActionForOlikDevtools = currentAction;
        internals.olikDevtools?.instance.send(currentAction, /*store.$state*/internals.state, stateReader, mutator);
      }
    }
  }
}

export const listenToDevtoolsDispatch = (onDispatch: () => any) => libState.onInternalDispatch = onDispatch;

