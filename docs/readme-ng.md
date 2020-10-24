# OULIK-NG ![](../assets/angular.png) #

👉 This guide covers using Oulik within your Angular apps. It may be helpful to read this [***high-level overview of Oulik***](../readme.md) if you haven't already.


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
*Auto-registers with the Redux Devtools Extension. Initial state must be serializable.*

## WRITING STATE ##
```Typescript
store(s => s.user.firstname).replaceWith('James');
```
*Your state will be efficiently replaced using the action: `{ type: 'user.firstname.replaceWith()', payload: 'James' }`.*  
***[All write options...](./readme-write.md)***

## READING STATE ##

```Typescript
const username = store(s => s.user.firstname).read();
```
***[All read options...](./readme-ng-read.md)***

