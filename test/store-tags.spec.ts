import { libState, testState } from '../src/shared-state';
import { createApplicationStore, createApplicationStoreEnforcingTags } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('tags', () => {

  beforeAll(() => {
    testState.windowObject = windowAugmentedWithReduxDevtoolsImpl;
  });

  beforeEach(() => {
    libState.applicationStore = null;
  })

  it('should work with tags correctly', () => {
    const payload = 'hey';
    const tag = 'mytag';
    const select = createApplicationStoreEnforcingTags({
      object: { property: 'one', property2: 'two' },
    }, { actionTypesToIncludeTag: true });
    select(s => s.object.property)
      .replace(payload, { tag });
    expect(testState.currentAction).toEqual({
      type: `object.property.replace() [${tag}]`,
      replacement: payload,
    });
    expect(select().read().object.property).toEqual(payload);
  })

  it('should sanitize tags correctly', () => {
    const select = createApplicationStoreEnforcingTags({
      test: '',
    }, {
      actionTypeTagAbbreviator: (tag) => tag + 'x',
      actionTypesToIncludeTag: true,
    });
    const tag = 'mytag';
    const payload = 'test';
    select(s => s.test)
      .replace(payload, { tag });
    expect(testState.currentAction).toEqual({
      type: `test.replace() [${tag}x]`,
      replacement: payload,
    });
  })

  it('should accept optional tags', () => {
    const select = createApplicationStore({ prop: '' }, { actionTypesToIncludeTag: true });
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
    const select = createApplicationStoreEnforcingTags({ prop: '' }, { actionTypesToIncludeTag: false });
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
