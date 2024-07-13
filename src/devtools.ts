import { libState, testState } from './constant';
import { BasicRecord, DevtoolsAction, DevtoolsOptions, Readable, SetNode, StateAction } from './type';
import { StateActions } from './type';
import { constructTypeString, constructTypeStrings, deserialize, isoDateRegexp } from './utility';

let initialized = false;
const pendingActions = new Array<Omit<DevtoolsAction, 'source'>>();

export function configureDevtools({ whitelist }: DevtoolsOptions = { whitelist: [] }) {

  if (libState.devtools)
    return;

  sendMessageToDevtools({
    actionType: '$load()',
    stateActions: whitelist.map(w => ({ name: constructTypeStrings((w as unknown as StateActions).$stateActions, false) })),
  })

  pendingActions.push({
    actionType: '$setNew()',
    stateActions: [{ name: '$setNew', arg: libState.state }],
    trace: new Error().stack,
  });

  libState.devtools = setupDevtools();

  if (typeof (document) === 'undefined' || document.getElementById('olik-init'))
    return;

  reactToDevtoolsInitialization();

  listenToStateChangesFromDevtools();

  listenToActionDispatchesFromDevtools();
}

/**
 * Add to list of paths that should be ignored in the action type list.
 * This should be used when a specific update is done very frequently and you don't want to see it in the devtools.
 * This is done to reduce 'noise' in the devtools in order to improve the debugging experience.
 */
export function addToWhitelist(whitelist: Readable<unknown>[]) {
  sendMessageToDevtools({
    actionType: '$addToWhitelist()',
    stateActions: whitelist.map(w => ({ name: constructTypeStrings((w as unknown as StateActions).$stateActions, false) })),
  })
}

const setupDevtools = () => ({
  dispatch: ({ stateActions, actionType }) => {
    const toSend = {
      actionType,
      stateActions: stateActions,
      trace: typeof (window) === 'undefined' ? '' : libState.stacktraceError?.stack,
    } as DevtoolsAction;
    if (typeof (window) !== 'undefined' && !initialized)
      pendingActions.push(toSend);
    else
      sendMessageToDevtools(toSend)
  },
} as typeof libState.devtools)

const reactToDevtoolsInitialization = () => {
  const olikInitDiv = document.body.appendChild(Object.assign(document.createElement('div'), {
    id: 'olik-init',
    style: 'display: none',
  }));
  new MutationObserver(async () => {
    for (let i = 0; i < pendingActions.length; i++)
      await new Promise(resolve => setTimeout(() => resolve(sendMessageToDevtools(pendingActions[i]))));
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
    (libState.store as unknown as SetNode<unknown>).$set(JSON.parse(olikStateDiv.innerHTML, (key, value) => {
      if (typeof (value) === 'string' && isoDateRegexp.test(value))
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
    if (segments[0] === 'store')
      segments.shift();
    segments.forEach(key => {
      const arg = key.match(/\(([^)]*)\)/)?.[1];
      const containsParenthesis = arg !== null && arg !== undefined;
      if (containsParenthesis) {
        const functionName = key.split('(')[0];
        const typedArg = deserialize(arg);
        const functionToCall = subStore[functionName] as (arg: unknown) => BasicRecord;
        subStore = functionToCall(typedArg);
      } else {
        subStore = subStore[key] as BasicRecord;
      }
    })
  }).observe(olikActionDiv, { attributes: true, childList: true, subtree: true });
}

const sendMessageToDevtools = (action: Omit<DevtoolsAction, 'source'>) => {
  if (typeof (window) === 'undefined')
    return testState.fakeDevtoolsMessage = action;
  window.postMessage({
    ...action,
    stateActions: action.stateActions.map(sa => {
      const arg = (extractPayload(sa.arg) as BasicRecord)?.$payload ?? sa.arg;
      return { ...sa, arg }
    }),
    source: 'olik-devtools-extension',
  }, location.origin)
}

const extractPayload = (payloadIncoming: unknown) => {
  if (typeof (payloadIncoming) !== 'object' || payloadIncoming === null || payloadIncoming instanceof Date)
    return payloadIncoming;
  const payloadPaths = {} as Record<string, string>;
  const sanitizePayload = (payload: unknown, path: string): unknown => {
    if (typeof (payload) !== 'object' || payload === null || payload instanceof Date)
      return payload;
    const { $state, $stateActions } = payload as unknown as { $stateActions: StateAction[], $state: unknown };
    if ($stateActions) {
      payloadPaths[path] = `${$stateActions.map(sa => constructTypeString(sa, true)).join('.')} = ${JSON.stringify($state)}`;
      return $state;
    }
    if (Array.isArray(payload))
      return payload.map((p, i) => sanitizePayload(p, !path ? i.toString() : `${path}.${i}`));
    if (typeof (payload) === 'object' && payload !== null)
      return Object.keys(payload).reduce((prev, key) => {
        prev[key] = sanitizePayload((payload as BasicRecord)[key], !path ? key.toString() : `${path}.${key.toString()}`);
        return prev;
      }, {} as BasicRecord);
    throw new Error();
  }
  const payload = sanitizePayload(payloadIncoming, '');
  if (Object.keys(payloadPaths).length)
    return {
      $paths: payloadPaths,
      $payload: payload,
    }
  return payload;
}
