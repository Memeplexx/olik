import { testState } from '../src/shared-state';
import { createRootStore, createRootStoreEnforcingTags } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('tags', () => {

  beforeAll(() => testState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('should work with tags correctly', () => {
    const payload = 'hey';
    const tag = 'mytag';
    const select = createRootStoreEnforcingTags({
      object: { property: 'one', property2: 'two' },
    }, { tagsToAppearInType: true });
    select(s => s.object.property)
      .replace(payload, { tag });
    expect(testState.currentAction).toEqual({
      type: `object.property.replace() [${tag}]`,
      replacement: payload,
    });
    expect(select().read().object.property).toEqual(payload);
    expect(testState.currentMutableState).toEqual(select().read());
  })

  it('should sanitize tags correctly', () => {
    const select = createRootStoreEnforcingTags({
      test: '',
    }, {
      tagSanitizer: (tag) => tag + 'x',
      tagsToAppearInType: true,
    });
    const tag = 'mytag';
    const payload = 'test';
    select(s => s.test)
      .replace(payload, { tag });
    expect(testState.currentAction).toEqual({
      type: `test.replace() [${tag}x]`,
      replacement: payload,
    });
    expect(testState.currentMutableState).toEqual(select().read());
  })

  it('should accept optional tags', () => {
    const select = createRootStore({ prop: '' }, { tagsToAppearInType: true });
    const tag = 'mytag';
    const payload = 'test';
    select(s => s.prop)
      .replace(payload, { tag });
    expect(testState.currentAction).toEqual({
      type: `prop.replace() [${tag}]`,
      replacement: payload,
    });
  })

  it('should, by default, place tags in the payload', () => {
    const select = createRootStoreEnforcingTags({ prop: '' });
    const tag = 'mytag';
    const payload = 'test';
    select(s => s.prop)
      .replace(payload, { tag });
    expect(testState.currentAction).toEqual({
      type: `prop.replace()`,
      replacement: payload,
      tag,
    });
  })

});
