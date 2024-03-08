import { libState } from './constant';
import { OlikAction } from './type';
import { deserialize, getPayloadOrigAndSanitized } from './utility';


export function connectOlikDevtoolsToStore(options: { trace: boolean }) {

  if (libState.olikDevtools) { return; }

  let initialized = false;
  const pendingActions = new Array<{
    action: OlikAction | undefined;
    source: string;
    stateActions: {
      arg: unknown;
      name: string;
    }[];
    trace?: string;
  }>();

  libState.olikDevtools = {
    trace: options.trace,
    dispatch: stateActions => {
      if (typeof (window) === 'undefined') {
        return;
      }
      const toSend = {
        action: libState.currentAction,
        source: 'olik-devtools-extension',
        stateActions: stateActions.map(sa => ({ ...sa, arg: getPayloadOrigAndSanitized(sa.arg).payloadSanitized })),
        trace: libState.stacktraceError?.stack,
      };
      if (!initialized) {
        pendingActions.push(toSend);
      } else {
        window.postMessage(toSend, location.origin)
      }
    },
  };

  if (typeof (document) === 'undefined' || document.getElementById('olik-init')) { return; }

  // Listen to devtools initialization
  const olikInitDiv = document.body.appendChild(Object.assign(document.createElement('div'), {
    id: 'olik-init',
    style: 'display: none',
    innerHTML: JSON.stringify(libState.store!.$state),
  }));
  new MutationObserver(async () => {
    for (const pendingAction in pendingActions) {
      await new Promise(resolve => setTimeout(() => resolve(window.postMessage(pendingAction, location.origin))));
    }
    pendingActions.length = 0;
    initialized = true;
  }).observe(olikInitDiv, { attributes: true, childList: true, subtree: true });

  // Listen to state changes from devtools
  const olikStateDiv = document.body.appendChild(Object.assign(document.createElement('div'), {
    id: 'olik-state',
    style: 'display: none',
    innerHTML: JSON.stringify(libState.store!.$state),
  }));
  new MutationObserver(() => {
    libState.disableDevtoolsDispatch = true;
    libState.store!.$set(JSON.parse(olikStateDiv.innerHTML, (key, value) => {
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z?$/.test(value)) {
        return new Date(value);
      }
      return value;
    }));
    libState.disableDevtoolsDispatch = false;
  }).observe(olikStateDiv, { attributes: true, childList: true, subtree: true });

  // Listen to action dispatches from devtools
  const olikActionDiv = document.body.appendChild(Object.assign(document.createElement('div'), {
    id: 'olik-action',
    style: 'display: none',
  }));
  new MutationObserver(() => {
    const actionType = olikActionDiv.innerHTML;
    let subStore = libState.store!;
    const segments = actionType.split('.');
    if (segments[0] === 'store') {
      segments.shift();
    }
    segments.forEach(key => {
      const arg = key.match(/\(([^)]*)\)/)?.[1];
      const containsParenthesis = arg !== null && arg !== undefined;
      if (containsParenthesis) {
        const functionName = key.split('(')[0];
        const typedArg = deserialize(arg);
        const functionToCall = subStore[functionName];
        subStore = functionToCall(typedArg);
      } else {
        subStore = subStore[key];
      }
    })
  }).observe(olikActionDiv, { attributes: true, childList: true, subtree: true });
}
