import { make } from "../src";

describe('Perf', () => {

  it('should perform well', () => {
    const getStore = make('store', {
      orgs: [
        {
          id: 1,
          things: new Array<string>()
        },
        {
          id: 2,
          things: new Array<string>()
        },
      ],
      anotherProp: {
        some: {
          deeply: {
            nested: {
              object: 'hello'
            }
          }
        }
      }
    })
    const before = Date.now();
    for (let i = 0; i < 1000; i++) {
      getStore(s => s.anotherProp.some.deeply.nested.object).replace('hey');
    }
    console.log(Date.now() - before);
  })

});