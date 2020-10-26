# OULIK #

![Version](https://img.shields.io/npm/v/oulik.svg)
[![Build Status](https://travis-ci.org/Memeplexx/oulik.svg?branch=master)](https://travis-ci.org/Memeplexx/oulik.svg?branch=master)
![Coverage Status](https://coveralls.io/repos/github/Memeplexx/oulik/badge.svg?branch=master)
![Package Size](https://badgen.net/bundlephobia/minzip/oulik)
![Dependency count](https://badgen.net/bundlephobia/dependency-count/oulik)

### ***Compact, transparent, typesafe, in-line state-management*** ###
---
## WHAT PROBLEMS DOES THIS LIBRARY TRY TO SOLVE? ##
👽 Many current state management solutions are typically plagued by:
* **excessive plumbing** around setting up,
* unergonomic ceremony around **data-flow**,
* **convoluted immutable state updates** inside reducers,
* actions which **needlessly re-describe simple updates**,
* actions that **inaccurately describe complex updates**.

🚀 Oulik is not only **painless to setup**, it makes **state updates effortless** and **consistent**, by **generating your actions for you** within the [Redux Devtools extension](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en)

---

⚠️ The rest of this guide illustrates how to use Oulik **without a framework.** It may be more appropriate for you to check out:  

![](assets/react.ico) <u>[OULIK-REACT](./docs/readme-react.md)</u>  
![](assets/angular.png) <u>[OULIK-NG](./docs/readme-ng.md)</u>  

## GETTING STARTED ##

```console
npm install oulik
```
```Typescript
import { make } from 'oulik';

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
***[All write options...](./docs/readme-write.md)***

## READING STATE ##

```Typescript
const username = store(s => s.user.firstname).read();
```
***[All read options...](./docs/readme-read.md)***

## BEST PRACTICES ##

Oulik is absurdly simple to use, and most of the time, the API corrals you into making only 1 decision.  
That said, if you don't already have some experience with Redux or NGRX, it's worth checking this small guide.  
***[State-management best practices](./docs/best-practices.md)***