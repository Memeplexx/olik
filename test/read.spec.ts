import { make } from '../src';
import { tests } from '../src/tests';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Read', () => {

  beforeAll(() => tests.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('should read', () => {
    const store = make('store', { some: { object: 'test' } });
    const value = store(s => s.some.object).read();
    expect(value).toEqual('test');
  })

  it('should read an array find', () => {
    const store = make('store', [{ prop: 'hello' }, { prop: 'world' }]);
    const value = store(s => s.find(e => e.prop === 'hello')).read();
    expect(value).toEqual({ prop: 'hello' });
  })

  it('should read an array filtered', () => {
    const store = make('store', [{ prop: 'hello' }, { prop: 'world' }]);
    const value = store(s => s.filter(e => e.prop === 'hello')).read();
    expect(value).toEqual([{ prop: 'hello' }]);
  })

  it('should read an array length', () => {
    const store = make('store', [{ prop: 'hello' }, { prop: 'world' }]);
    const value = store(s => s.filter(e => e.prop === 'hello').length).read();
    expect(value).toEqual(1);
  })

  it('should read an array index', () => {
    const store = make('store', [{ prop: 'hello' }, { prop: 'world' }]);
    const value = store(s => s.findIndex(e => e.prop === 'hello')).read();
    expect(value).toEqual(0);
  })

});
