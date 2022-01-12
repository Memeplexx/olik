"use strict";(self.webpackChunkdocs=self.webpackChunkdocs||[]).push([[835],{3905:function(e,t,r){r.d(t,{Zo:function(){return u},kt:function(){return d}});var n=r(7294);function a(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function o(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function i(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?o(Object(r),!0).forEach((function(t){a(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):o(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function l(e,t){if(null==e)return{};var r,n,a=function(e,t){if(null==e)return{};var r,n,a={},o=Object.keys(e);for(n=0;n<o.length;n++)r=o[n],t.indexOf(r)>=0||(a[r]=e[r]);return a}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(n=0;n<o.length;n++)r=o[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(a[r]=e[r])}return a}var s=n.createContext({}),c=function(e){var t=n.useContext(s),r=t;return e&&(r="function"==typeof e?e(t):i(i({},t),e)),r},u=function(e){var t=c(e.components);return n.createElement(s.Provider,{value:t},e.children)},p={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},g=n.forwardRef((function(e,t){var r=e.components,a=e.mdxType,o=e.originalType,s=e.parentName,u=l(e,["components","mdxType","originalType","parentName"]),g=c(r),d=a,f=g["".concat(s,".").concat(d)]||g[d]||p[d]||o;return r?n.createElement(f,i(i({ref:t},u),{},{components:r})):n.createElement(f,i({ref:t},u))}));function d(e,t){var r=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var o=r.length,i=new Array(o);i[0]=g;var l={};for(var s in t)hasOwnProperty.call(t,s)&&(l[s]=t[s]);l.originalType=e,l.mdxType="string"==typeof e?e:a,i[1]=l;for(var c=2;c<o;c++)i[c]=r[c];return n.createElement.apply(null,i)}return n.createElement.apply(null,r)}g.displayName="MDXCreateElement"},7500:function(e,t,r){r.r(t),r.d(t,{frontMatter:function(){return l},contentTitle:function(){return s},metadata:function(){return c},toc:function(){return u},default:function(){return g}});var n=r(7462),a=r(3366),o=(r(7294),r(3905)),i=["components"],l={sidebar_label:"Getting started",sidebar_position:1},s="Getting started",c={unversionedId:"getting_started",id:"getting_started",title:"Getting started",description:"Olik is designed to be framework-agnostic, however wrapper libs exist for a growing number of frameworks.",source:"@site/docs/1_getting_started.md",sourceDirName:".",slug:"/getting_started",permalink:"/Olik/docs/getting_started",tags:[],version:"current",sidebarPosition:1,frontMatter:{sidebar_label:"Getting started",sidebar_position:1},sidebar:"defaultSidebar",next:{title:"Writing state",permalink:"/Olik/docs/writing_state"}},u=[{value:"Olik is designed to be framework-agnostic, however wrapper libs exist for a growing number of frameworks.",id:"olik-is-designed-to-be-framework-agnostic-however-wrapper-libs-exist-for-a-growing-number-of-frameworks",children:[],level:4},{value:"Installing",id:"installing",children:[],level:3},{value:"Creating a store",id:"creating-a-store",children:[],level:3}],p={toc:u};function g(e){var t=e.components,r=(0,a.Z)(e,i);return(0,o.kt)("wrapper",(0,n.Z)({},p,r,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("h1",{id:"getting-started"},"Getting started"),(0,o.kt)("h4",{id:"olik-is-designed-to-be-framework-agnostic-however-wrapper-libs-exist-for-a-growing-number-of-frameworks"},"Olik is designed to be framework-agnostic, however wrapper libs exist for a growing number of frameworks."),(0,o.kt)("hr",null),(0,o.kt)("h3",{id:"installing"},"Installing"),(0,o.kt)("p",null,"If you're ",(0,o.kt)("strong",{parentName:"p"},"not using a framework"),":"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-bash"},"npm install olik\n")),(0,o.kt)("p",null,"If you're using ",(0,o.kt)("strong",{parentName:"p"},"React"),":"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-bash"},"npm install olik olik-react\n")),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"import { augmentOlikForReact } from 'olik-react'\n\naugmentOlikForReact() // invoke before initializing store\n")),(0,o.kt)("p",null,"If you're using ",(0,o.kt)("strong",{parentName:"p"},"Angular"),":"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-bash"},"npm install olik olik-ng\n")),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"import { OlikNgModule } from 'olik-ng'\n\n@NgModule({ imports: [OlikNgModule] })\nexport class AppModule {}\n")),(0,o.kt)("hr",null),(0,o.kt)("h3",{id:"creating-a-store"},"Creating a store"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"import { createStore, importOlikReduxDevtoolsModule } from 'olik'\n\nimportOlikReduxDevtoolsModule()    // optional\n\nexport const store = createStore({\n  name: document.title,            // can be any user-defined string\n  state: { hello: 'world' }        // can be any plain Javascript object\n})\n")),(0,o.kt)("p",null,"Although Olik works with arbitrarily deep state-trees, normalizing your state is still advised.\n",(0,o.kt)("a",{parentName:"p",href:"https://redux.js.org/recipes/structuring-reducers/normalizing-state-shape"},(0,o.kt)("strong",{parentName:"a"},"This guide")),", from the Redux docs, explains the benefits of normalizing your state tree."))}g.isMDXComponent=!0}}]);