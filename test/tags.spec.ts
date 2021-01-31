import { setEnforceTags } from '../src/core';
import { tests } from '../src/tests';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('tags', () => {

  beforeAll(() => tests.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('should work with tags correctly', () => {
    const payload = 'hey';
    const tag = 'mytag';
    const get = setEnforceTags({
      object: { property: 'one', property2: 'two' },
    });
    get(s => s.object.property)
      .replace(payload, tag);
    expect(tests.currentAction).toEqual({
      type: `object.property.replace() [${tag}]`,
      replacement: payload,
    });
    expect(get(s => s.object.property).read()).toEqual(payload);
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should sanitize tags correctly', () => {
    const get = setEnforceTags({
      test: '',
    }, {
      tagSanitizer: (tag) => tag + 'x',
    });
    const tag = 'mytag';
    const payload = 'test';
    get(s => s.test)
      .replace(payload, tag);
    expect(tests.currentAction).toEqual({
      type: `test.replace() [${tag}x]`,
      replacement: payload,
    });
    expect(tests.currentMutableState).toEqual(get().read());
  })

});
