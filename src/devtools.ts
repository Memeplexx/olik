import { libState } from './constant';
import { DevtoolsAction } from './type';
import { deserialize, getPayloadOrigAndSanitized, isoDateRegexp } from './utility';

let initialized = false;
const pendingActions = new Array<Omit<DevtoolsAction, 'source'>>();

export function connectOlikDevtoolsToStore() {

  if (libState.olikDevtools) { return; }

  sendMessageToDevtools({
    action: { type: "$load()" },
    stateActions: [],
  })

  pendingActions.push({
    action: { type: '$setNew()', payload: libState.state },
    stateActions: [{ name: '$setNew', arg: libState.state }],
    trace: new Error().stack,
  });

  setupDevtools();

  if (typeof (document) === 'undefined' || document.getElementById('olik-init')) { return; }

  reactToDevtoolsInitialization();

  listenToStateChangesFromDevtools();

  listenToActionDispatchesFromDevtools();
}

const setupDevtools = () => {
  libState.olikDevtools = {
    dispatch: stateActions => {
      if (typeof (window) === 'undefined') {
        return;
      }
      const toSend = {
        action: libState.currentAction,
        stateActions: stateActions.map(sa => ({ ...sa, arg: getPayloadOrigAndSanitized(sa.arg).payloadSanitized })),
        trace: libState.stacktraceError?.stack,
      } as DevtoolsAction;
      if (!initialized) {
        pendingActions.push(toSend);
      } else {
        sendMessageToDevtools(toSend)
      }
    },
  };
};

const reactToDevtoolsInitialization = () => {
  const olikInitDiv = document.body.appendChild(Object.assign(document.createElement('div'), {
    id: 'olik-init',
    style: 'display: none',
  }));
  new MutationObserver(async () => {
    for (let i = 0; i < pendingActions.length; i++) {
      await new Promise(resolve => setTimeout(() => resolve(sendMessageToDevtools(pendingActions[i]))));
    }
    pendingActions.length = 0;
    initialized = true;
  }).observe(olikInitDiv, { attributes: true, childList: true, subtree: true });
}

const listenToStateChangesFromDevtools = () => {
  const olikStateDiv = document.body.appendChild(Object.assign(document.createElement('div'), {
    id: 'olik-state',
    style: 'display: none',
    innerHTML: JSON.stringify(libState.store!.$state),
  }));
  new MutationObserver(() => {
    libState.disableDevtoolsDispatch = true;
    libState.store!.$set(JSON.parse(olikStateDiv.innerHTML, (key, value) => {
      if (typeof value === 'string' && isoDateRegexp.test(value)) {
        return new Date(value);
      }
      return value;
    }));
    libState.disableDevtoolsDispatch = false;
  }).observe(olikStateDiv, { attributes: true, childList: true, subtree: true });
}

const listenToActionDispatchesFromDevtools = () => {
  const olikActionDiv = document.body.appendChild(Object.assign(document.createElement('div'), {
    id: 'olik-action',
    style: 'display: none',
  }));
  new MutationObserver(() => {
    const actionType = olikActionDiv.innerHTML;
    let subStore = libState.store!;
    const segments = JSON.parse(actionType) as string[];
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

const sendMessageToDevtools = (action: Omit<DevtoolsAction, 'source'>) => {
  window.postMessage({
    ...action,
    source: 'olik-devtools-extension',
  }, location.origin)
}
