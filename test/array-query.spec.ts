import { createApplicationStore } from '../src/index';
import { libState } from '../src/constant';

describe('array-query', () => {

  const initialState = { arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }, { id: 3, num: 3 }] }

  beforeEach(() => {
    libState.appStates = {};
    libState.logLevel = 'none';
  })

  it('should find an element with one clause and another and replace it', () => {
    const select = createApplicationStore(initialState);
    const replacement = { id: 4, num: 4 };
    select.arr
      .find.id.eq(1).and.id.lt(2)
      .replace(replacement);
    expect(select.read()).toEqual({ ...initialState, arr: [replacement, initialState.arr[1], initialState.arr[2]] })
  });

  it('should find an element with one clause and another and patch it', () => {
    const select = createApplicationStore(initialState);
    const patch = { num: 4 };
    select.arr
      .find.id.eq(1).and.id.lt(2)
      .patch(patch);
    expect(select.read()).toEqual({ ...initialState, arr: [{ ...initialState.arr[0], ...patch }, initialState.arr[1], initialState.arr[2]] })
  });

  it('should find an element with one clause and another and remove it', () => {
    const select = createApplicationStore(initialState);
    select.arr
      .find.id.eq(1).and.id.lt(2)
      .remove();
    expect(select.read()).toEqual({ ...initialState, arr: [initialState.arr[1], initialState.arr[2]] })
  });

  it('should find an element with one clause or another and replace it', () => {
    const select = createApplicationStore(initialState);
    const replacement = { id: 4, num: 4 };
    select.arr
      .find.id.eq(1).or.id.lt(2)
      .replace(replacement);
    expect(select.read()).toEqual({ ...initialState, arr: [replacement, initialState.arr[1], initialState.arr[2]] })
  });

  it('should find an element with one clause or another and patch it', () => {
    const select = createApplicationStore(initialState);
    const patch = { num: 4 };
    select.arr
      .find.id.eq(1).or.id.lt(2)
      .patch(patch);
    expect(select.read()).toEqual({ ...initialState, arr: [{ ...initialState.arr[0], ...patch }, initialState.arr[1], initialState.arr[2]] })
  });

  it('should find an element with one clause or another and remove it', () => {
    const select = createApplicationStore(initialState);
    select.arr
      .find.id.eq(1).or.id.lt(2)
      .remove();
    expect(select.read()).toEqual({ ...initialState, arr: [initialState.arr[1], initialState.arr[2]] })
  });

  it('should filter elements with one clause and another and patch them', () => {
    const select = createApplicationStore(initialState);
    const patch = { num: 4 };
    select.arr
      .filter.id.eq(1).and.id.lt(3)
      .patch(patch);
    expect(select.read()).toEqual({ ...initialState, arr: [{ ...initialState.arr[0], ...patch }, initialState.arr[1], initialState.arr[2]] })
  });

  it('should filter elements with one clause and another and remove them', () => {
    const select = createApplicationStore(initialState);
    select.arr
      .filter.id.eq(1).and.id.lt(3)
      .remove();
    expect(select.read()).toEqual({ ...initialState, arr: [initialState.arr[1], initialState.arr[2]] })
  });

  it('should filter elements with one clause or another and patch them', () => {
    const select = createApplicationStore(initialState);
    const patch = { num: 4 };
    select.arr
      .filter.id.eq(1).or.id.lt(3)
      .patch(patch);
    expect(select.read()).toEqual({ ...initialState, arr: [{ ...initialState.arr[0], ...patch }, { ...initialState.arr[1], ...patch }, initialState.arr[2]] })
  });

  it('should filter elements with one clause or another and remove them', () => {
    const select = createApplicationStore(initialState);
    select.arr
      .filter.id.eq(1).or.id.lt(3)
      .remove();
    expect(select.read()).toEqual({ ...initialState, arr: [initialState.arr[2]] })
  });

  it('should find an element by a clause and a clause or a clause, and then replace it', () => {
    const select = createApplicationStore(initialState);
    const replacement = { id: 4, num: 4 };
    select.arr
      .find.id.eq(1)
      .and.id.eq(2)
      .or.id.eq(3)
      .replace(replacement);
    expect(libState.currentAction).toEqual({
      type: `arr.find.id.eq(1).and.id.eq(2).or.id.eq(3).replace()`,
      replacement,
    });
    expect(select.read()).toEqual({ arr: [initialState.arr[0], initialState.arr[1], replacement] });
  })

  it('should find an element by a clause and a clause or a clause, and then remove it', () => {
    const select = createApplicationStore(initialState);
    select.arr
      .find.id.eq(1)
      .and.id.eq(2)
      .or.id.eq(3)
      .remove();
    expect(libState.currentAction).toEqual({
      type: `arr.find.id.eq(1).and.id.eq(2).or.id.eq(3).remove()`,
    });
    expect(select.read()).toEqual({ arr: [initialState.arr[0], initialState.arr[1]] });
  })

  it('should find an element by a clause or a clause and a clause, and then replace it', () => {
    const select = createApplicationStore(initialState);
    const replacement = { id: 4, num: 4 };
    select.arr
      .find.id.eq(4)
      .or.id.eq(3)
      .and.num.eq(3)
      .replace(replacement);
    expect(libState.currentAction).toEqual({
      type: `arr.find.id.eq(4).or.id.eq(3).and.num.eq(3).replace()`,
      replacement,
    });
    expect(select.read()).toEqual({ arr: [initialState.arr[0], initialState.arr[1], replacement] });
  })

  it('should find an element by a clause or a clause and a clause, and then remove it', () => {
    const select = createApplicationStore(initialState);
    select.arr
      .find.id.eq(4)
      .or.id.eq(3)
      .and.num.eq(3)
      .remove();
    expect(libState.currentAction).toEqual({
      type: `arr.find.id.eq(4).or.id.eq(3).and.num.eq(3).remove()`,
    });
    expect(select.read()).toEqual({ arr: [initialState.arr[0], initialState.arr[1]] });
  })

  it('should find an element by a clause and a clause or a clause and a clause, and then replace it', () => {
    const select = createApplicationStore(initialState);
    const replacement = { id: 4, num: 4 };
    select.arr
      .find.id.eq(1)
      .and.num.eq(1)
      .or.id.eq(3)
      .and.num.eq(3)
      .replace(replacement);
    expect(libState.currentAction).toEqual({
      type: `arr.find.id.eq(1).and.num.eq(1).or.id.eq(3).and.num.eq(3).replace()`,
      replacement,
    });
    expect(select.read()).toEqual({ arr: [replacement, initialState.arr[1], initialState.arr[2]] });
  })

  it('should find an element by a clause and a clause or a clause and a clause, and then remove it', () => {
    const select = createApplicationStore(initialState);
    select.arr
      .find.id.eq(1)
      .and.num.eq(1)
      .or.id.eq(3)
      .and.num.eq(3)
      .remove();
    expect(libState.currentAction).toEqual({
      type: `arr.find.id.eq(1).and.num.eq(1).or.id.eq(3).and.num.eq(3).remove()`,
    });
    expect(select.read()).toEqual({ arr: [initialState.arr[1], initialState.arr[2]] });
  })

});