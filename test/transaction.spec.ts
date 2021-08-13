import { createApplicationStore, transact } from '../src';
import { libState, testState } from '../src/shared-state';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Transact', () => {

  beforeAll(() => {
    testState.windowObject = windowAugmentedWithReduxDevtoolsImpl;
  });

  beforeEach(() => {
    libState.applicationStore = null;
  })

  it('should perform a transaction', () => {
    const select = createApplicationStore({ hello: '', world: new Array<string>(), some: { deep: { val: false } } });
    let changeCount = 0;
    select().onChange(s => changeCount++);
    transact(
      () => select(s => s.hello).replace('test'),
      () => select(s => s.world).insert('hey'),
      () => select(s => s.some.deep.val).replace(true),
    );
    expect(changeCount).toEqual(1);
    const expectedState = { hello: 'test', world: ['hey'], some: { deep: { val: true } } };
    expect(select().read()).toEqual(expectedState);
    expect(testState.currentAction).toEqual({
      type: 'hello.replace(), world.insert(), some.deep.val.replace()',
      actions: [
        {
          type: 'hello.replace()',
          replacement: 'test',
        },
        {
          type: 'world.insert()',
          insertion: 'hey',
        },
        {
          type: 'some.deep.val.replace()',
          replacement: true,
        }
      ]
    });
  });

});
