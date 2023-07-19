import { libState, testState } from './constant';
import { deserialize } from './utility';


export function connectOlikDevtoolsToStore() {
  libState.olikDevtools = {
    init: () => { },
    dispatch: (/*stateReader, mutator*/) => {
      const store = libState.store!;
      const internals = store.$internals;
      const currentAction = internals.currentAction;
      testState.currentActionForOlikDevtools = currentAction;
      const typeString = currentAction.type
        .replace(/\((.+?)\)/g, (_, args) => `(${args.toString()})`);
      const typeStringRev = currentAction.payload === undefined
        ? typeString
        : typeString.substring(0, typeString.length - 1) + JSON.stringify(currentAction.payload) + ')';
      window.postMessage({
        action: {
          type: typeStringRev,
          payload: currentAction.payload,
          state: internals.state,
        },
        state: libState.store!.$state,
        source: 'olik-devtools-extension'
      }, location.origin);
    },
  };

  if (document.getElementById('olik-state')) { return; }

  const olikStateDiv = document.createElement('div');
  olikStateDiv.id = 'olik-state';
  olikStateDiv.style.display = 'none';
  olikStateDiv.innerHTML = JSON.stringify(libState.store!.$state);
  document.body.appendChild(olikStateDiv);

  const olikActionDiv = document.createElement('div');
  olikActionDiv.id = 'olik-action';
  olikActionDiv.style.display = 'none';
  document.body.appendChild(olikActionDiv);

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
