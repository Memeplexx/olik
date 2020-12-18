# OULIK-NG ![](../assets/angular.png) #

## GETTING STARTED ##

> Oulik-NG depends on Ivy. It supports Angular 10 and above.

```console
npm i oulik-ng
```
```Typescript
import { OulikNgModule } from 'oulik-ng';

@NgModule({
  imports: [
    OulikNgModule,
  ],
})
export class AppModule {
}
```
```Typescript
import { make } from 'oulik-ng';

const get = make('my store', {
  user: { firstname: '', lastname: '' },
  hobbies: new Array<string>(),
});       
```
## WRITING STATE ##
```Typescript
get(s => s.user.firstname).replaceWith('James');
```
***[All write options...](./readme-write.md)***

## READING STATE ##

```Typescript
const username = get(s => s.user.firstname).read();
```
***[All read options...](./readme-ng-read.md)***

## BEST PRACTICES ##
If you don't already have some experience with Redux or NGRX, it's worth checking this small guide.  
***[State-management best practices](./best-practices.md)***
