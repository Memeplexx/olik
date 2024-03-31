import { beforeEach, expect, test } from 'vitest';
import { StateAction, is, libState, readState } from '../src';
import { createStore } from '../src/core';
import { deserialize, resetLibraryState } from '../src/utility';


beforeEach(() => {
  resetLibraryState();
})

test('should be able include store object with patch', () => {
  const store = createStore({ one: { two: 1, three: '' }, arr: [{ id: 1, text: 'element' }] });
  store.one.$patch({
    two: 2,
    three: store.arr.$find.id.$eq(store.arr.$find.text.$eq('element').id).text
  });
  expect(store.$state).toEqual({ one: { two: 2, three: 'element' }, arr: [{ id: 1, text: 'element' }] });
  expect(libState.currentAction?.payloadOrig).toEqual({
    two: 2,
    three: 'arr.$find.id.$eq( arr.$find.text.$eq("element").id = 1 ).text = "element"'
  })
})

test('should be able include store object with set', () => {
  const store = createStore({ one: { two: 1, three: '' }, arr: [{ id: 1, text: 'element' }] });
  store.one.two.$set(store.arr.$find.id.$eq(store.arr.$find.text.$eq('element').id).id);
  expect(libState.currentAction?.payloadOrig).toEqual(
    'arr.$find.id.$eq( arr.$find.text.$eq("element").id = 1 ).id = 1'
  );
})

test('should be able include store object with setNew', () => {
  const store = createStore({ one: { two: 1, three: '' }, arr: [{ id: 1, text: 'element' }] });
  store.one.$setNew(store.arr.$find.id.$eq(store.arr.$find.text.$eq('element').id).id);
  expect(libState.currentAction?.payloadOrig).toEqual(
    'arr.$find.id.$eq( arr.$find.text.$eq("element").id = 1 ).id = 1'
  );
})

test('should be able include nested store object with set', () => {
  const store = createStore({ one: { two: 1, three: '' }, arr: [{ id: 1, text: 'element' }] });
  store.one.$set({
    two: store.arr.$find.id.$eq(store.arr.$find.text.$eq('element').id).id,
    three: store.arr.$find.id.$eq(store.arr.$find.text.$eq('element').id).text
  });
  expect(libState.currentAction?.payloadOrig).toEqual({
    two: 'arr.$find.id.$eq( arr.$find.text.$eq("element").id = 1 ).id = 1',
    three: 'arr.$find.id.$eq( arr.$find.text.$eq("element").id = 1 ).text = "element"'
  });
})

test('', () => {
  const store = createStore({ arr: [{ id: 1, text: 'element' }], arr2: [{ id: 2, text: 'element2' }] });
  store.arr.$set(store.arr2.$filter.id.$eq(2));
  expect(libState.currentAction?.payloadOrig).toEqual('arr2.$filter.id.$eq(2) = [{"id":2,"text":"element2"}]');
})

test('', () => {
  const store = createStore({ arr: [{ id: 1, text: 'element' }], arr2: [{ id: 2, text: 'element2' }] });
  store.arr.$filter.id.$eq(1).text.$set(store.arr2.$find.id.$eq(2).text);
  expect(libState.currentAction?.payloadOrig).toEqual('arr2.$find.id.$eq(2).text = "element2"');
})

test('', () => {
  const store = createStore({ hello: 'world' as string | null });
  store.hello.$set(null);
})

test('', () => {
  const store = createStore({ arr: [{ id: 1, text: 'one' }, { id: 2, text: 'two' }, { id: 3, text: 'three' }] });
  store.arr.$set(store.arr.$filter.id.$eq(1));
})

test('', () => {
  const store = createStore({ arr: [1, 2, 3] });
  store.arr.$merge(store.arr.$filter.$eq(2));
})

test('', () => {
  const store = createStore({
    arr: [{ id: 1, text: 'one' }, { id: 2, text: 'two' }, { id: 3, text: 'three' }],
    arr2: [{ id: 1, text: 'one2' }]
  });
  store.arr.$mergeMatching.id.$with(store.arr2.$filter.id.$eq(1));
  expect(store.arr.$state).toEqual([{ id: 1, text: 'one2' }, { id: 2, text: 'two' }, { id: 3, text: 'three' }]);
})

// test('', () => {
//   const state = {
//     modal: null as 'confirmDeleteGroup' | 'confirmDeleteTag' | 'synonymOptions' | 'groupOptions' | null,
//     bool: false,
//     flatObj: {
//       one: 'hello',
//       two: 'world',
//       three: 'another',
//     },
//     num: 0,
//     obj: {
//       one: {
//         two: 'hello',
//         three: false,
//         four: 4
//       },
//       two: {
//         five: 'thing',
//         three: [
//           [1, 2, 3]
//         ]
//       }
//     },
//     arr: [
//       { id: 1, text: 'one' },
//       { id: 2, text: 'two' },
//       { id: 3, text: 'three' },
//     ],
//     arrNum: [1, 2, 3],
//     arrNested: [
//       [1, 2, 3],
//       [4, 5, 6],
//       [7, 8, 9]
//     ]
//   };

//   const recurse = <S extends Record<string, unknown> | unknown>(s: S): string => {
//     if (s === null) {
//       return `<span class="null">null</span>`;
//     } else if (typeof (s) === 'string') {
//       return `<span class="string">"${s}"</span>`;
//     } else if (typeof (s) === 'number') {
//       return `<span class="number">${s}</span>`;
//     } else if (typeof (s) === 'boolean') {
//       return `<span class="boolean">${s}</span>`;
//     } else if (s instanceof Date) {
//       return `<span class="date">${s}</span>`;
//     } else if (typeof (s) === 'object') {
//       if (Array.isArray(s)) {
//         return s.map((ss, index) => {
//           const possibleComma = index === s.length - 1 ? '' : `<span class="comma">,</span>`;
//           return Array.isArray(ss) ? `
//           <span class="open-array">[</span><br/>
//           <span class="value">${recurse(ss)}</span>
//           <span class="close-array">]</span>
//           ${possibleComma}
//           ` : (typeof (ss) === 'object' && ss !== null) ? `
//           <span class="open-object">{</span><br/>
//           <span class="value">${recurse(ss)}</span>
//           <span class="close-object">}</span>
//           ${possibleComma}
//           ` : `
//           <span class="row">
//             ${recurse(ss)}
//             ${possibleComma}
//           </span>
//           `;
//         }).join(`<br/>`);
//       } else {
//         const objectKeys = Object.keys(s) as Array<keyof S>;
//         return objectKeys.map((key, index) => {
//           const possibleComma = index === objectKeys.length - 1 ? '' : `<span class="comma">,</span>`;
//           return Array.isArray(s[key]) ? `
//           <span class="array">
//             <span class="key">${String(key)}</span>
//             <span class="colon">:</span>
//             <span class="open-array">[</span><br/>
//             <span class="value">${recurse(s[key])}</span>
//             <span class="close-array">]</span>
//             ${possibleComma}
//           </span>
//           ` : (typeof (s[key]) === 'object' && s[key] !== null) ? `
//           <span class="object">
//             <span class="key">${String(key)}</span>
//             <span class="colon">:</span>
//             <span class="open-object">{</span><br/>
//             <span class="value">${recurse(s[key])}</span>
//             <span class="close-object">}</span>
//             ${possibleComma}
//           </span>
//           ` : `
//           <span class="row">
//             <span class="key">${String(key)}</span>
//             <span class="colon">:</span>
//             ${recurse(s[key])}
//             ${possibleComma}
//           </span>
//         `;
//         }).join(`<br/>`);
//       }
//     }
//     throw new Error();
//   };
//   const html = `
//     <span class="object">
//       <span class="open-object">{</span><br/>
//       <span class="value">${recurse(state)}</span>
//       <span class="close-object">}</span>
//     </span>
//   `.replace(/\s+/g, ' ');
//   console.log(html);
// })

test('', () => {
  const doReadState = (type: string, state: unknown) => {
    if (type === undefined) { return state; }
    const segments = type.split('.');
    // if (type.endsWith(')')) {
    //   segments.pop();
    // }
    const stateActions: StateAction[] = segments
      .map(seg => {
        const arg = seg.match(/\(([^)]*)\)/)?.[1];
        const containsParenthesis = arg !== null && arg !== undefined;
        if (containsParenthesis && !is.anyUpdateFunction(seg)) {
          const functionName = seg.split('(')[0];
          const typedArg = deserialize(arg);
          return { name: functionName, arg: typedArg };
        } else {
          return { name: seg, arg: null };
        }
      });
    stateActions.push({ name: '$state' });
    return readState({ state, stateActions, cursor: { index: 0 } });
  }
  const appStore = createStore({
    modal: null as 'confirmDeleteGroup' | 'confirmDeleteTag' | 'synonymOptions' | 'groupOptions' | null,
    bool: false,
    flatObj: {
      one: 'hello',
      two: 'world',
      three: 'another',
    },
    num: 0,
    obj: {
      one: {
        two: 'hello'
      }
    },
    arr: [
      { id: 1, text: 'one' },
      { id: 2, text: 'two' },
      { id: 3, text: 'three' },
    ],
    arrNum: [1, 2, 3],
  })
  doReadState('arr.$find.id.$eq(3)', appStore.$state);
})

test('should be able to re-create state', () => {
  createStore({ hello: 'world' });
  libState.initialState = undefined;
  const store2 = createStore({ hello: 'another' });
  console.log(store2.$state);
})

test('accept dates', () => {
  const store = createStore({ dat: new Date() });
  store.dat.$set(new Date());
  console.log(store.$state);
})

test('array indices on primitive', () => {
  const store = createStore({ arr: [1, 2, 3] });
  store.arr.$at(1).$set(4);
  expect(store.$state).toEqual({ arr: [1, 4, 3] });
})

test('array indices of object', () => {
  const store = createStore({ arr: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }] });
  store.arr.$at(1).value.$set('four');
  expect(store.$state).toEqual({ arr: [{ id: 1, value: 'one' }, { id: 2, value: 'four' }, { id: 3, value: 'three' }] });
  expect(store.arr.$at(1).$state).toEqual({ id: 2, value: 'four' });
  expect(store.arr.$at(1).value.$state).toEqual('four');
})

test('array indices filter and then at', () => {
  const store = createStore({ arr: [{ id: 1, arr2: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }] }, { id: 2, arr2: [{ id: 3, value: 'three' }, { id: 4, value: 'four' }] }] });
  store.arr.$filter.id.$lte(2).arr2.$at(1).value.$set('xxx');
  expect(store.$state).toEqual({ arr: [{ id: 1, arr2: [{ id: 1, value: 'one' }, { id: 2, value: 'xxx' }] }, { id: 2, arr2: [{ id: 3, value: 'three' }, { id: 4, value: 'xxx' }] }] });
  console.log(libState.currentAction)
});

test('set object key', () => {
  const store = createStore({ hello: 'world', another: 'what' });
  let changed = '';
  store.hello.$onChange(v => changed = v);
  store.hello.$setKey('sss');
  expect(store.$state).toEqual({ sss: 'world', another: 'what' });
  expect(changed).toEqual('world');
})