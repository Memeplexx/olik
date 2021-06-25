import { testState } from '../src/shared-state';
import { createGlobalStore, createGlobalStoreEnforcingTags } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('tags', () => {

  beforeAll(() => testState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('should work with tags correctly', () => {
    const payload = 'hey';
    const tag = 'mytag';
    const store = createGlobalStoreEnforcingTags({
      object: { property: 'one', property2: 'two' },
    }, { tagsToAppearInType: true });
    store.get(s => s.object.property)
      .replace(payload, { tag });
    expect(testState.currentAction).toEqual({
      type: `object.property.replace() [${tag}]`,
      replacement: payload,
    });
    expect(store.read().object.property).toEqual(payload);
    expect(testState.currentMutableState).toEqual(store.read());
  })

  it('should sanitize tags correctly', () => {
    const store = createGlobalStoreEnforcingTags({
      test: '',
    }, {
      tagSanitizer: (tag) => tag + 'x',
      tagsToAppearInType: true,
    });
    const tag = 'mytag';
    const payload = 'test';
    store.get(s => s.test)
      .replace(payload, { tag });
    expect(testState.currentAction).toEqual({
      type: `test.replace() [${tag}x]`,
      replacement: payload,
    });
    expect(testState.currentMutableState).toEqual(store.read());
  })

  it('should accept optional tags', () => {
    const store = createGlobalStore({ prop: '' }, { tagsToAppearInType: true });
    const tag = 'mytag';
    const payload = 'test';
    store.get(s => s.prop)
      .replace(payload, { tag });
    expect(testState.currentAction).toEqual({
      type: `prop.replace() [${tag}]`,
      replacement: payload,
    });
  })

  it('should, by default, place tags in the payload', () => {
    const store = createGlobalStoreEnforcingTags({ prop: '' });
    const tag = 'mytag';
    const payload = 'test';
    store.get(s => s.prop)
      .replace(payload, { tag });
    expect(testState.currentAction).toEqual({
      type: `prop.replace()`,
      replacement: payload,
      tag,
    });
  })

});
