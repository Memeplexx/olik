import { make } from '../src';
import { tests } from '../src/tests';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Read', () => {

  beforeAll(() => tests.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('should read', () => {
    const select = make({ some: { object: 'test' } });
    const value = select(s => s.some.object).read();
    expect(value).toEqual('test');
  })

  it('should read an array find', () => {
    const select = make([{ prop: 'hello' }, { prop: 'world' }]);
    const value = select(s => s.find(e => e.prop === 'hello')).read();
    expect(value).toEqual({ prop: 'hello' });
  })

  it('should read an array filtered', () => {
    const select = make([{ prop: 'hello' }, { prop: 'world' }]);
    const value = select(s => s.filter(e => e.prop === 'hello')).read();
    expect(value).toEqual([{ prop: 'hello' }]);
  })

  it('should read an array length', () => {
    const select = make([{ prop: 'hello' }, { prop: 'world' }]);
    const value = select(s => s.filter(e => e.prop === 'hello').length).read();
    expect(value).toEqual(1);
  })

  it('should read an array index', () => {
    const select = make([{ prop: 'hello' }, { prop: 'world' }]);
    const value = select(s => s.findIndex(e => e.prop === 'hello')).read();
    expect(value).toEqual(0);
  })

});
