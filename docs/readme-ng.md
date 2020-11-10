# OULIK-NG ![](../assets/angular.png) #

## ***Effortless, transparent state management*** ##  

Oulik enables **inline**, **type-safe** updates, and **describes them for you** inside the **[Redux Devtools extension](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en)**

## GETTING STARTED ##

```console
npm install oulik-ng
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

const store = make('my store', {
  user: { firstname: '', lastname: '' },
  hobbies: new Array<string>(),
});       
```
## WRITING STATE ##
```Typescript
store(s => s.user.firstname).replaceWith('James');
```
***[All write options...](./readme-write.md)***

## READING STATE ##

```Typescript
const username = store(s => s.user.firstname).read();
```
***[All read options...](./readme-ng-read.md)***

## BEST PRACTICES ##

Oulik is absurdly simple to use, and most of the time, the API corrals you into making only 1 decision.  
That said, if you don't already have some experience with Redux or NGRX, it's worth checking this small guide.  
***[State-management best practices](./docs/best-practices.md)***
