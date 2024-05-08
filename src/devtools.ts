import { libState, testState } from './constant';
import { DevtoolsAction } from './type';
import { deserialize, extractPayload, isoDateRegexp } from './utility';

let initialized = false;
const pendingActions = new Array<Omit<DevtoolsAction, 'source'>>();

export function connectOlikDevtoolsToStore() {

  if (libState.devtools)
    return;

  sendMessageToDevtools({
    actionType: "$load()",
    stateActions: [],
  })

  pendingActions.push({
    actionType: '$setNew()',
    stateActions: [{ name: '$setNew', arg: libState.state }],
    trace: new Error().stack,
  });

  setupDevtools();

  if (typeof (document) === 'undefined' || document.getElementById('olik-init')) 
    return;

  reactToDevtoolsInitialization();

  listenToStateChangesFromDevtools();

  listenToActionDispatchesFromDevtools();
}

const setupDevtools = () => {
  libState.devtools = {
    dispatch: ({ stateActions, actionType, payloadPaths }) => {
      const toSend = {
        actionType,
        payloadPaths,
        stateActions: stateActions.map(sa => ({ ...sa, arg: extractPayload(sa.arg) })),
        trace: typeof (window) === 'undefined' ? '' : libState.stacktraceError?.stack,
      } as DevtoolsAction;
      if (typeof (window) !== 'undefined' && !initialized) {
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
      if (typeof(value) === 'string' && isoDateRegexp.test(value))
        return new Date(value);
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
  if (typeof (window) === 'undefined')
    return testState.fakeDevtoolsMessage = action;
  window.postMessage({
    ...action,
    source: 'olik-devtools-extension',
  }, location.origin)
}
