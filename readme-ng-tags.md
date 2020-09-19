# OULIK - using the `__filename` variable within the Angular CLI #

1) Install dependencies
```console
npm install --save-dev @angular-builders/custom-webpack @angular-builders/dev-server
```

2) Create a file named `custom-webpack.config.js` in your project root:
```Javascript
module.exports = {
  context: __dirname,
  node: {
    __filename: true
  }
};
```
3) Configure your `angular.json`

```JSON
"architect": {
  "build": {
    "builder": "@angular-builders/custom-webpack:browser",
    "options": {
      "customWebpackConfig": {
        "path": "./custom-webpack.config.js",
        "replaceDuplicatePlugins": true
      }
    }
  },
   ...
   "serve": {
     "builder": "@angular-builders/custom-webpack:dev-server"
   }
}
```

4) Create a new type-definition file `src/index.d.ts`
```Typescript
declare var __filename: string;
```
