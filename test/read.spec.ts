import { make } from "../src";

describe('Read', () => {

  it('should read', () => {
    const getState = make('state', { some: { object: 'test' } });
    const value = getState(s => s.some.object).read();
    expect(value).toEqual('test');
  })

  it('should read an array find', () => {
    const getState = make('state', [{ prop: 'hello' }, { prop: 'world' }]);
    const value = getState(s => s.find(e => e.prop === 'hello')).read();
    expect(value).toEqual({ prop: 'hello' });
  })

  it('should read an array filtered', () => {
    const getState = make('state', [{ prop: 'hello' }, { prop: 'world' }]);
    const value = getState(s => s.filter(e => e.prop === 'hello')).read();
    expect(value).toEqual([{ prop: 'hello' }]);
  })

  it('should read an array length', () => {
    const getState = make('state', [{ prop: 'hello' }, { prop: 'world' }]);
    const value = getState(s => s.filter(e => e.prop === 'hello').length).read();
    expect(value).toEqual(1);
  })

});
