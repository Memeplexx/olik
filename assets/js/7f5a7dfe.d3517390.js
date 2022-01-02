"use strict";(self.webpackChunkdocs=self.webpackChunkdocs||[]).push([[112],{3905:function(e,t,n){n.d(t,{Zo:function(){return p},kt:function(){return m}});var o=n(7294);function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function a(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);t&&(o=o.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,o)}return n}function s(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?a(Object(n),!0).forEach((function(t){r(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):a(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function i(e,t){if(null==e)return{};var n,o,r=function(e,t){if(null==e)return{};var n,o,r={},a=Object.keys(e);for(o=0;o<a.length;o++)n=a[o],t.indexOf(n)>=0||(r[n]=e[n]);return r}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(o=0;o<a.length;o++)n=a[o],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(r[n]=e[n])}return r}var l=o.createContext({}),c=function(e){var t=o.useContext(l),n=t;return e&&(n="function"==typeof e?e(t):s(s({},t),e)),n},p=function(e){var t=c(e.components);return o.createElement(l.Provider,{value:t},e.children)},u={inlineCode:"code",wrapper:function(e){var t=e.children;return o.createElement(o.Fragment,{},t)}},d=o.forwardRef((function(e,t){var n=e.components,r=e.mdxType,a=e.originalType,l=e.parentName,p=i(e,["components","mdxType","originalType","parentName"]),d=c(n),m=r,g=d["".concat(l,".").concat(m)]||d[m]||u[m]||a;return n?o.createElement(g,s(s({ref:t},p),{},{components:n})):o.createElement(g,s({ref:t},p))}));function m(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var a=n.length,s=new Array(a);s[0]=d;var i={};for(var l in t)hasOwnProperty.call(t,l)&&(i[l]=t[l]);i.originalType=e,i.mdxType="string"==typeof e?e:r,s[1]=i;for(var c=2;c<a;c++)s[c]=n[c];return o.createElement.apply(null,s)}return o.createElement.apply(null,n)}d.displayName="MDXCreateElement"},6745:function(e,t,n){n.r(t),n.d(t,{frontMatter:function(){return i},contentTitle:function(){return l},metadata:function(){return c},toc:function(){return p},default:function(){return d}});var o=n(7462),r=n(3366),a=(n(7294),n(3905)),s=["components"],i={sidebar_label:"Angular",sidebar_position:2},l="Reading state with **Angular**",c={unversionedId:"reading_state/angular",id:"reading_state/angular",title:"Reading state with **Angular**",description:"Olik-NG contains functions to read state and memoise expensive derivations",source:"@site/docs/4_reading_state/angular.md",sourceDirName:"4_reading_state",slug:"/reading_state/angular",permalink:"/Olik/docs/reading_state/angular",tags:[],version:"current",sidebarPosition:2,frontMatter:{sidebar_label:"Angular",sidebar_position:2},sidebar:"defaultSidebar",previous:{title:"React",permalink:"/Olik/docs/reading_state/react"},next:{title:"Async state",permalink:"/Olik/docs/async_state/"}},p=[{value:"Olik-NG contains functions to read state and memoise expensive derivations",id:"olik-ng-contains-functions-to-read-state-and-memoise-expensive-derivations",children:[],level:4},{value:"<strong>Observe</strong> state",id:"observe-state",children:[],level:3},{value:"<strong>Derive</strong> computationally expensive state",id:"derive-computationally-expensive-state",children:[],level:3},{value:"Minimize <strong>async pipes</strong> &amp; read observables <strong>synchronously</strong>",id:"minimize-async-pipes--read-observables-synchronously",children:[],level:3}],u={toc:p};function d(e){var t=e.components,n=(0,r.Z)(e,s);return(0,a.kt)("wrapper",(0,o.Z)({},u,n,{components:t,mdxType:"MDXLayout"}),(0,a.kt)("h1",{id:"reading-state-with-angular"},"Reading state with ",(0,a.kt)("strong",{parentName:"h1"},"Angular")),(0,a.kt)("h4",{id:"olik-ng-contains-functions-to-read-state-and-memoise-expensive-derivations"},"Olik-NG contains functions to read state and memoise expensive derivations"),(0,a.kt)("p",null,"\ud83e\udd5a Let's begin with the following store:"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts"},"const get = createStore({\n  todos: new Array<{ id: number, title: string, done: boolean }>(),\n  showDone: false,\n});\n")),(0,a.kt)("h3",{id:"observe-state"},(0,a.kt)("strong",{parentName:"h3"},"Observe")," state"),(0,a.kt)("p",null,"You can observe a selected node of your state tree using the ",(0,a.kt)("inlineCode",{parentName:"p"},"observe()")," function"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-html"},'<div *ngFor="let todo of todos$ | async">\n  {{todo.title}}\n</div>\n')),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts"},"@Component({...})\nclass MyComponent {\n  todos$ = get.todos.observe();\n}\n")),(0,a.kt)("a",{href:"https://codesandbox.io/s/olik-ng-read-iwyd3?file=/src/app/app.component.ts",target:"_blank"},"Demo ",(0,a.kt)("img",null)),(0,a.kt)("h3",{id:"derive-computationally-expensive-state"},(0,a.kt)("strong",{parentName:"h3"},"Derive")," computationally expensive state"),(0,a.kt)("p",null,"The ",(0,a.kt)("inlineCode",{parentName:"p"},"derive()")," function allows you to derive computationally expensive state."),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts"},"import { deriveFrom } from 'olik-ng';\n\n@Component({...})\nclass MyComponent {\n  completedTodos$ = derive((get.todos, get.showDone)\n    .with((todos, showDone) => todos.filter(todo => todo.done === showDone))\n    .observe();\n}\n")),(0,a.kt)("a",{href:"https://codesandbox.io/s/olik-ng-memoise-supgo?file=/src/app/app.component.ts",target:"_blank"},"Demo ",(0,a.kt)("img",null)),(0,a.kt)("h3",{id:"minimize-async-pipes--read-observables-synchronously"},"Minimize ",(0,a.kt)("strong",{parentName:"h3"},"async pipes")," & read observables ",(0,a.kt)("strong",{parentName:"h3"},"synchronously")),(0,a.kt)("p",null,"The ",(0,a.kt)("inlineCode",{parentName:"p"},"combineComponentObservables()")," is a ",(0,a.kt)("em",{parentName:"p"},"convenience")," function that:"),(0,a.kt)("ul",null,(0,a.kt)("li",{parentName:"ul"},"Removes the need to declare an ",(0,a.kt)("inlineCode",{parentName:"li"},"async")," pipe for ",(0,a.kt)("em",{parentName:"li"},"every")," observable in your template."),(0,a.kt)("li",{parentName:"ul"},"Allows you to read your observables, synchronously, without subscribing to them.  ")),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-html"},'<ng-container *ngIf="observables$ | async; let observe;">\n  <div>Todos for user: {{observe.username$}}</div>\n  <div *ngFor="let todo of observe.todos$">\n    {{todo.title}}\n  </div>\n</ng-container>\n')),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts"},"import { combineComponentObservables } from 'olik-ng';\n\n@Component({...})\nclass AppComponent {\n\n  username$ = get.username.observe();\n  todos$ = get.todos.observe()\n  observables$ = combineComponentObservables<AppComponent>(this);\n\n  ngAfterViewInit() {\n    // synchronous read\n    console.log({ todos: this.observables$.value.todos$ }); \n  }\n}\n")),(0,a.kt)("a",{href:"https://codesandbox.io/s/olik-ng-combinecomponentobservables-trh42?file=/src/app/app.component.ts",target:"_blank"},"Demo ",(0,a.kt)("img",null)),"Note that: * the `observables$` variable must **not** be renamed. * must be the **last** variable you declare.")}d.isMDXComponent=!0}}]);