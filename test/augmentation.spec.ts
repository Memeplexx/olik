import { augment, createApplicationStore, libState, testState } from "../src";

describe('Augmentations', () => {

  beforeEach(() => {
    libState.appStates = {};
    testState.logLevel = 'none';
  })

  it('should be able to augment a selection', () => {
    augment({
      selection: {
        myThing: input => () => input.read(),
      }
    })
    const select = createApplicationStore({ num: 42 });
    const res = (select.num as any).myThing();
    expect(res).toEqual(42);
  })

  it('should be able to augment a selection on an array action', () => {
    augment({
      selection: {
        myThing: input => () => input.read(),
      }
    })
    const select = createApplicationStore({ array: [42] });
    const res = (select.array as any).myThing();
    expect(res).toEqual([42]);
  })

  it('should be able to augment a selection on an array element action', () => {
    augment({
      selection: {
        myThing: input => () => input.read(),
      }
    })
    const select = createApplicationStore({ array: [42] });
    const res = (select.array.find.eq(42) as any).myThing();
    expect(res).toEqual(42);
  })
  
});