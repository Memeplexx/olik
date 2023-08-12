import * as StackTrace from 'stacktrace-js';
import { libState } from './constant';
import { deserialize } from './utility';


export function connectOlikDevtoolsToStore(options: { trace: boolean }) {
  libState.olikDevtools = {
    init: () => { },
    trace: options.trace,
    dispatch: () => {
      const payload = {
        actions: libState.currentActions,
        state: libState.state,
        source: 'olik-devtools-extension',
      };
      if (options.trace) {
        StackTrace.fromError(libState.stacktraceError!)
          .then(r => window.postMessage({
            ...payload,
            trace: r.map(rr => ({ functionName: rr.functionName, fileName: rr.fileName, lineNumber: rr.lineNumber, columnNumber: rr.columnNumber })),
          }, location.origin))
          .catch(console.error);
      } else {
        window.postMessage({
          ...payload
        }, location.origin);
      }
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

  new MutationObserver(() => {
    libState.disableDevtoolsDispatch = true;
    libState.store!.$set(JSON.parse(olikStateDiv.innerHTML));
    libState.disableDevtoolsDispatch = false;
  }).observe(olikStateDiv, { attributes: true, childList: true, subtree: true });
}
