import { store, storeEnforcingTags } from '../src/store-creators';
import { libState } from '../src/shared-state';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('tags', () => {

  beforeAll(() => libState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('should work with tags correctly', () => {
    const payload = 'hey';
    const tag = 'mytag';
    const select = storeEnforcingTags({
      object: { property: 'one', property2: 'two' },
    }, { tagsToAppearInType: true });
    select(s => s.object.property)
      .replace(payload, { tag });
    expect(libState.currentAction).toEqual({
      type: `object.property.replace() [${tag}]`,
      replacement: payload,
    });
    expect(select(s => s.object.property).read()).toEqual(payload);
    expect(libState.currentMutableState).toEqual(select().read());
  })

  it('should sanitize tags correctly', () => {
    const select = storeEnforcingTags({
      test: '',
    }, {
      tagSanitizer: (tag) => tag + 'x',
      tagsToAppearInType: true,
    });
    const tag = 'mytag';
    const payload = 'test';
    select(s => s.test)
      .replace(payload, { tag });
    expect(libState.currentAction).toEqual({
      type: `test.replace() [${tag}x]`,
      replacement: payload,
    });
    expect(libState.currentMutableState).toEqual(select().read());
  })

  it('should accept optional tags', () => {
    const select = store({ prop: '' }, { tagsToAppearInType: true });
    const tag = 'mytag';
    const payload = 'test';
    select(s => s.prop)
      .replace(payload, { tag });
    expect(libState.currentAction).toEqual({
      type: `prop.replace() [${tag}]`,
      replacement: payload,
    });
  })

  it('should, by default, place tags in the payload', () => {
    const select = storeEnforcingTags({ prop: '' });
    const tag = 'mytag';
    const payload = 'test';
    select(s => s.prop)
      .replace(payload, { tag });
    expect(libState.currentAction).toEqual({
      type: `prop.replace()`,
      replacement: payload,
      tag,
    });
  })

});
