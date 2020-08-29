import { make, log } from "../src";

describe('Multi-store', () => {

  it('should support multiple stores', () => {
    const getStore1 = make('state-1', new Array<string>());
    const getStore2 = make('state-2', 0);
    getStore1().replaceAll(['one']);
    getStore2().replaceWith(2);
    expect(getStore1().read()).toEqual(['one']);
    expect(getStore2().read()).toEqual(2);
  })

  it('test', () => {
    log.actions = true;
    const getStore = make('test-xguud-web', {
      contacts: new Array<{id: number, name: string}>(),
    });
    getStore(s => s.contacts).upsertWhere(e => e.id === 1).with({id: 2, name: 'hey'});
    // getStore(s => s.contacts).addAfter({id: 2, name: 'hey'});
    console.log(getStore(s => s.contacts).read())
    log.actions = false;
  })

});