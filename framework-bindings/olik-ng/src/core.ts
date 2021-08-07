import { EventEmitter, NgModule, NgZone } from '@angular/core';
import * as core from 'olik';
import { combineLatest, from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export * from 'olik';

declare module 'olik' {
  interface StoreOrDerivation<C> {
    useState: () => C;
  }
}
