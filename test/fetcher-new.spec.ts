import { make, makeEnforceTags } from '../src';
import { tests } from '../src/tests';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';


describe('Fetcher', () => {

  beforeAll(() => tests.windowObject = windowAugmentedWithReduxDevtoolsImpl);


  it('should perform a basic fetch', () => {
    // const initialState = {
    //   array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    // };
    // const get = make(initialState);


    // const getArray2 = createFetcher({
    //   getData: (index: number) => new Promise<[{ id: number, value: string }]>(resolve => setTimeout(() => resolve([{ id: 2, value: 'dd' }]), 10)),
    //   cacheFor: 1000,
    // });
    

    // get(s => s.array).replaceAll(getArray2.fetch(0))
    //   .then(response => )
    //   .catch(error => );

    // getArray2.bustCache();
    // getArray2.onCacheExpired();



    // get(s => s.array).addAfter(getArray2.fetch(0))
    //   .then()
    //   .catch()
  })

});
