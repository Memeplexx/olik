import { createRootStore, deriveFrom } from 'olik';

describe('Angular', () => {

  const initialState = {
    object: { property: 'a' },
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    string: 'b',
  };

  it('', () => {
    const select = createRootStore(initialState, { devtools: false });
    const result = deriveFrom(
      select(s => s.string),
      select(s => s.object.property),
    ).usingExpensiveCalc((str, prop) => {
      return str + prop;
    })
  })

});
