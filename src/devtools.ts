import { libState } from './constant';
import { getPayloadOrigAndSanitized } from './utility';


export function connectOlikDevtoolsToStore(options: { trace: boolean }) {
  libState.olikDevtools = {
    trace: options.trace,
    dispatch: stateActions => {
      const payload = {
        action: libState.currentAction,
        // state: libState.state,
        source: 'olik-devtools-extension',
        stateActions: stateActions.map(sa => ({...sa, arg: getPayloadOrigAndSanitized(sa.arg).payloadSanitized })),
      };
      if (typeof(window) === 'undefined') { return; }
      if (options.trace) {
        window.postMessage({
          ...payload,
          trace: libState.stacktraceError!.stack,
        }, location.origin)
      } else {
        window.postMessage({
          ...payload
        }, location.origin);
      }
    },
  };

  if (typeof(document) === 'undefined' || document.getElementById('olik-state')) { return; }

  const olikStateDiv = document.createElement('div');
  olikStateDiv.id = 'olik-state';
  olikStateDiv.style.display = 'none';
  olikStateDiv.innerHTML = JSON.stringify(libState.store!.$state);
  document.body.appendChild(olikStateDiv);

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
}
