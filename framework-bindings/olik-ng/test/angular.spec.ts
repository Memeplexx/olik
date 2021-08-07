import { from, of } from 'rxjs';
import { catchError, skip } from 'rxjs/operators';
import { Observable } from 'rxjs';

import {
  // combineComponentObservables,
  createRootStore,
  createComponentStore,
  deriveFrom,
  // OlikNgModule,
} from '../src/core';

describe('Angular', () => {

  const initialState = {
    object: { property: 'a' },
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    string: 'b',
  };

  beforeEach(() => {
    // new OlikNgModule(null as any);
  })

  it('', () => {
    const select = createRootStore(initialState, { devtools: false });
    const result = deriveFrom(
      select(s => s.string),
      select(s => s.object.property),
    ).usingExpensiveCalc((str, prop) => {
      return str + prop;
    })
  })

});
