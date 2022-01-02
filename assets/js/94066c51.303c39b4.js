"use strict";(self.webpackChunkdocs=self.webpackChunkdocs||[]).push([[149],{3905:function(e,t,n){n.d(t,{Zo:function(){return c},kt:function(){return g}});var r=n(7294);function a(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function o(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function s(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?o(Object(n),!0).forEach((function(t){a(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function i(e,t){if(null==e)return{};var n,r,a=function(e,t){if(null==e)return{};var n,r,a={},o=Object.keys(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||(a[n]=e[n]);return a}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(a[n]=e[n])}return a}var l=r.createContext({}),p=function(e){var t=r.useContext(l),n=t;return e&&(n="function"==typeof e?e(t):s(s({},t),e)),n},c=function(e){var t=p(e.components);return r.createElement(l.Provider,{value:t},e.children)},d={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},u=r.forwardRef((function(e,t){var n=e.components,a=e.mdxType,o=e.originalType,l=e.parentName,c=i(e,["components","mdxType","originalType","parentName"]),u=p(n),g=a,m=u["".concat(l,".").concat(g)]||u[g]||d[g]||o;return n?r.createElement(m,s(s({ref:t},c),{},{components:n})):r.createElement(m,s({ref:t},c))}));function g(e,t){var n=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var o=n.length,s=new Array(o);s[0]=u;var i={};for(var l in t)hasOwnProperty.call(t,l)&&(i[l]=t[l]);i.originalType=e,i.mdxType="string"==typeof e?e:a,s[1]=i;for(var p=2;p<o;p++)s[p]=n[p];return r.createElement.apply(null,s)}return r.createElement.apply(null,n)}u.displayName="MDXCreateElement"},1377:function(e,t,n){n.r(t),n.d(t,{frontMatter:function(){return i},contentTitle:function(){return l},metadata:function(){return p},toc:function(){return c},default:function(){return u}});var r=n(7462),a=n(3366),o=(n(7294),n(3905)),s=["components"],i={sidebar_label:"Writing state",sidebar_position:3},l="Writing state",p={unversionedId:"writing_state",id:"writing_state",title:"Writing state",description:"Olik exposes a standardized set of state-update primitives to make the developer experience as transparent, consistent, and debuggable as possible.",source:"@site/docs/3_writing_state.md",sourceDirName:".",slug:"/writing_state",permalink:"/Olik/docs/writing_state",tags:[],version:"current",sidebarPosition:3,frontMatter:{sidebar_label:"Writing state",sidebar_position:3},sidebar:"defaultSidebar",previous:{title:"Creating a Store",permalink:"/Olik/docs/creating_a_store"},next:{title:"Reading state",permalink:"/Olik/docs/reading_state/"}},c=[{value:"Olik exposes a standardized set of state-update primitives to make the developer experience as transparent, consistent, and debuggable as possible.",id:"olik-exposes-a-standardized-set-of-state-update-primitives-to-make-the-developer-experience-as-transparent-consistent-and-debuggable-as-possible",children:[],level:4},{value:"Writing <strong>object and primitive</strong> nodes",id:"writing-object-and-primitive-nodes",children:[],level:3},{value:"Writing <strong>array</strong> nodes",id:"writing-array-nodes",children:[],level:3},{value:"Writing <strong>array element</strong> nodes",id:"writing-array-element-nodes",children:[],level:3},{value:"Performing <strong>many writes</strong> at once",id:"performing-many-writes-at-once",children:[],level:3}],d={toc:c};function u(e){var t=e.components,n=(0,a.Z)(e,s);return(0,o.kt)("wrapper",(0,r.Z)({},d,n,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("h1",{id:"writing-state"},"Writing state"),(0,o.kt)("h4",{id:"olik-exposes-a-standardized-set-of-state-update-primitives-to-make-the-developer-experience-as-transparent-consistent-and-debuggable-as-possible"},"Olik exposes a standardized set of state-update primitives to make the developer experience as transparent, consistent, and debuggable as possible."),(0,o.kt)("p",null,"\ud83e\udd5a Let's begin with the following store:"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"const get = createAppStore({\n  user: {\n    firstName: '',\n    lastName: '',\n    job: { title: '', contractor: false },\n  },\n  todos: new Array<{ id: number, name: string, done: boolean, urgency: number }>(),\n});\n")),(0,o.kt)("h3",{id:"writing-object-and-primitive-nodes"},"Writing ",(0,o.kt)("strong",{parentName:"h3"},"object and primitive")," nodes"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"// Replace user's age with 29\nget.user.age.replace(29)\n")),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"// Increment user's age by 1\nget.user.age.increment(1)\n")),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"// Update some, but not all, user's details\nget.user.patch({ firstName: 'Jeff', lastName: 'Anderson' })\n")),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"// Deep-merge user object\nget.user.deepMerge({ age: 21, job: { contractor: true } } )\n")),(0,o.kt)("h3",{id:"writing-array-nodes"},"Writing ",(0,o.kt)("strong",{parentName:"h3"},"array")," nodes"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"// Replace all elements in an array\nget.todos.replaceAll(arrayOfTodos)\n")),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"// Remove all elements from an array\nget.todos.removeAll()\n")),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"// Insert one element into the existing array\nget.todos.insertOne(todo)\n")),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"// Insert an array of elements into the existing array\nget.todos.insertMany(arrayOfTodos)\n")),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"// Insert an element (if it does not already exist) or update it (if it does)\nget.todos.upsertMatching.id.withOne(todo)\n")),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"// Insert elements (if they do not already exist) or update them (if they do)\nget.todos.upsertMatching.id.withMany(arrayOfTodos)\n")),(0,o.kt)("h3",{id:"writing-array-element-nodes"},"Writing ",(0,o.kt)("strong",{parentName:"h3"},"array element")," nodes"),(0,o.kt)("p",null,"In order for the library to generate highly descriptive action types, searching for array elements looks a little different from what you might expect.",(0,o.kt)("br",null),"\nNote: in the following examples ",(0,o.kt)("inlineCode",{parentName:"p"},"find()")," is interchangeable with ",(0,o.kt)("inlineCode",{parentName:"p"},"filter()"),".  "),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"// Replace an array element\nget.todos.find.id.eq(3).replace(todo)\n")),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"// Remove an array element\nget.todos.find.id.eq(3).remove()\n")),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"// Partially update an array element\nget.todos.find.id.eq(3).patch({ done: true })\n")),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"// Apply multiple search clauses and comparators\nget.todos.filter.done.eq(true).or.urgency.lt(3).remove()\n")),(0,o.kt)("hr",null),(0,o.kt)("h3",{id:"performing-many-writes-at-once"},"Performing ",(0,o.kt)("strong",{parentName:"h3"},"many writes")," at once"),(0,o.kt)("p",null,"Avoid unnecessary render cycles by performing many updates at once."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"import { transact } from /* whichever version of olik you've installed */\n\ntransact(\n  () => get.user.patch({ firstName: 'James', lastName: 'White' }),\n  () => get.todos.removeAll(),\n)\n")))}u.isMDXComponent=!0}}]);