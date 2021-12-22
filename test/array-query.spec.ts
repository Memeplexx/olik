import { createStore } from '../src/index';
import { libState, testState } from '../src/constant';

describe('array-query', () => {

  const name = 'AppStore';
  const state = { arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }, { id: 3, num: 3 }] }

  beforeEach(() => {
    testState.logLevel = 'none';
  })

  it('should find an element with one clause and another and replace it', () => {
    const select = createStore({ name, state });
    const payload = { id: 4, num: 4 };
    select.arr
      .find.id.eq(1).and.id.lt(2)
      .replace(payload);
    expect(select.state).toEqual({ ...state, arr: [payload, state.arr[1], state.arr[2]] })
  });

  it('should find an element with one clause and another and patch it', () => {
    const select = createStore({ name, state });
    const payload = { num: 4 };
    select.arr
      .find.id.eq(1).and.id.lt(2)
      .patch(payload);
    expect(select.state).toEqual({ ...state, arr: [{ ...state.arr[0], ...payload }, state.arr[1], state.arr[2]] })
  });

  it('should find an element with one clause and another and remove it', () => {
    const select = createStore({ name, state });
    select.arr
      .find.id.eq(1).and.id.lt(2)
      .remove();
    expect(select.state).toEqual({ ...state, arr: [state.arr[1], state.arr[2]] })
  });

  it('should find an element with one clause or another and replace it', () => {
    const select = createStore({ name, state });
    const payload = { id: 4, num: 4 };
    select.arr
      .find.id.eq(1).or.id.lt(2)
      .replace(payload);
    expect(select.state).toEqual({ ...state, arr: [payload, state.arr[1], state.arr[2]] })
  });

  it('should find an element with one clause or another and patch it', () => {
    const select = createStore({ name, state });
    const payload = { num: 4 };
    select.arr
      .find.id.eq(1).or.id.lt(2)
      .patch(payload);
    expect(select.state).toEqual({ ...state, arr: [{ ...state.arr[0], ...payload }, state.arr[1], state.arr[2]] })
  });

  it('should find an element with one clause or another and remove it', () => {
    const select = createStore({ name, state });
    select.arr
      .find.id.eq(1).or.id.lt(2)
      .remove();
    expect(select.state).toEqual({ ...state, arr: [state.arr[1], state.arr[2]] })
  });

  it('should filter elements with one clause and another and patch them', () => {
    const select = createStore({ name, state });
    const payload = { num: 4 };
    select.arr
      .filter.id.eq(1).and.id.lt(3)
      .patch(payload);
    expect(select.state).toEqual({ ...state, arr: [{ ...state.arr[0], ...payload }, state.arr[1], state.arr[2]] })
  });

  it('should filter elements with one clause and another and remove them', () => {
    const select = createStore({ name, state });
    select.arr
      .filter.id.eq(1).and.id.lt(3)
      .remove();
    expect(select.state).toEqual({ ...state, arr: [state.arr[1], state.arr[2]] })
  });

  it('should filter elements with one clause or another and patch them', () => {
    const select = createStore({ name, state });
    const payload = { num: 4 };
    select.arr
      .filter.id.eq(1).or.id.lt(3)
      .patch(payload);
    expect(select.state).toEqual({ ...state, arr: [{ ...state.arr[0], ...payload }, { ...state.arr[1], ...payload }, state.arr[2]] })
  });

  it('should filter elements with one clause or another and remove them', () => {
    const select = createStore({ name, state });
    select.arr
      .filter.id.eq(1).or.id.lt(3)
      .remove();
    expect(select.state).toEqual({ ...state, arr: [state.arr[2]] })
  });

  it('should find an element by a clause and a clause or a clause, and then replace it', () => {
    const select = createStore({ name, state });
    const payload = { id: 4, num: 4 };
    select.arr
      .find.id.eq(1)
      .and.id.eq(2)
      .or.id.eq(3)
      .replace(payload);
    expect(libState.currentAction).toEqual({
      type: `arr.find.id.eq(1).and.id.eq(2).or.id.eq(3).replace()`,
      payload,
    });
    expect(select.state).toEqual({ arr: [state.arr[0], state.arr[1], payload] });
  })

  it('should find an element by a clause and a clause or a clause, and then remove it', () => {
    const select = createStore({ name, state });
    select.arr
      .find.id.eq(1)
      .and.id.eq(2)
      .or.id.eq(3)
      .remove();
    expect(libState.currentAction).toEqual({
      type: `arr.find.id.eq(1).and.id.eq(2).or.id.eq(3).remove()`,
    });
    expect(select.state).toEqual({ arr: [state.arr[0], state.arr[1]] });
  })

  it('should find an element by a clause or a clause and a clause, and then replace it', () => {
    const select = createStore({ name, state });
    const payload = { id: 4, num: 4 };
    select.arr
      .find.id.eq(4)
      .or.id.eq(3)
      .and.num.eq(3)
      .replace(payload);
    expect(libState.currentAction).toEqual({
      type: `arr.find.id.eq(4).or.id.eq(3).and.num.eq(3).replace()`,
      payload,
    });
    expect(select.state).toEqual({ arr: [state.arr[0], state.arr[1], payload] });
  })

  it('should find an element by a clause or a clause and a clause, and then remove it', () => {
    const select = createStore({ name, state });
    select.arr
      .find.id.eq(4)
      .or.id.eq(3)
      .and.num.eq(3)
      .remove();
    expect(libState.currentAction).toEqual({
      type: `arr.find.id.eq(4).or.id.eq(3).and.num.eq(3).remove()`,
    });
    expect(select.state).toEqual({ arr: [state.arr[0], state.arr[1]] });
  })

  it('should find an element by a clause and a clause or a clause and a clause, and then replace it', () => {
    const select = createStore({ name, state });
    const payload = { id: 4, num: 4 };
    select.arr
      .find.id.eq(1)
      .and.num.eq(1)
      .or.id.eq(3)
      .and.num.eq(3)
      .replace(payload);
    expect(libState.currentAction).toEqual({
      type: `arr.find.id.eq(1).and.num.eq(1).or.id.eq(3).and.num.eq(3).replace()`,
      payload,
    });
    expect(select.state).toEqual({ arr: [payload, state.arr[1], state.arr[2]] });
  })

  it('should find an element by a clause and a clause or a clause and a clause, and then remove it', () => {
    const select = createStore({ name, state });
    select.arr
      .find.id.eq(1)
      .and.num.eq(1)
      .or.id.eq(3)
      .and.num.eq(3)
      .remove();
    expect(libState.currentAction).toEqual({
      type: `arr.find.id.eq(1).and.num.eq(1).or.id.eq(3).and.num.eq(3).remove()`,
    });
    expect(select.state).toEqual({ arr: [state.arr[1], state.arr[2]] });
  })

});