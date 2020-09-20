# OULIK-NG #

> Note: This guide covers using Oulik within your Angular apps.
To get a high-level overview of what Oulik has to offer, please read the [README for ***Oulik***](../readme.md).


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
import { make } from 'oulik';

const canvas = make('canvas', {          // <- Auto-registers with the Redux Devtools Extension.
  size: { width: 10, height: 10 },       // <- Initial state must be serializable. It can be a
  border: { thickness: 1 }               //    simple primitive, or something far more nested.
}); 
```

## WRITING STATE ##
```Typescript
canvas(s => s.size.width)                // <- Your state will be replaced using the action:
  .replaceWith(20);                      //    { type: 'size.width.replaceWith()', payload: 20 }
```
[All write options...](./readme-write.md)

## READING STATE ##

```Typescript
const canvasWidth = canvas()
  .read().size.width;
```
[All read options...](./readme-ng-read.md)

