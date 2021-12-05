import { createApplicationStore } from '../src';
import { libState } from '../src/constant';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('immutability', () => {

  beforeAll(() => {
    libState.windowObject = windowAugmentedWithReduxDevtoolsImpl
  });

  const initialState = {
    object: { property: 'one', property2: 'two' },
    arr: [{id: 1, name: 'a'}],
  };

  it('should not be able to modify an object payload', () => {
    const select = createApplicationStore(initialState);
    const payload = { property: 'a', property2: 'b' };
    select.object.replace(payload);
    expect(() => payload.property = 'x').toThrow();
  })

  it('should not be able to modify an array element payload', () => {
    const select = createApplicationStore(initialState);
    const payload = { id: 2, name: 'hey' };
    select.arr.find.id.eq(1).replace(payload);
    expect(() => payload.name = 'XXX').toThrow();
  })

  it('should not be able to modify the payload root', () => {
    const select = createApplicationStore(initialState);
    const payload = { id: 2, name: 'hey' };
    select.arr.find.id.eq(1).replace(payload);
    expect(() => (select.read() as any).arr = []).toThrow();
  })

});