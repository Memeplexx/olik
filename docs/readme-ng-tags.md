# OULIK - using the `__filename` variable within the Angular CLI #

1) Install [angular-builders](https://github.com/just-jeb/angular-builders) (and don't forget to star the repo!)
```console
npm i -D @angular-builders/custom-webpack
```

2) Create a custom webpack config `custom-webpack.config.js` in your project root:
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
        "path": "./custom-webpack.config.js"
      }
    }
  },
  "serve": {
    "builder": "@angular-builders/custom-webpack:dev-server",
    "options": {
      "customWebpackConfig": {
        "path": "./custom-webpack.config.js"
      }
    }
  }
}
```

4) Create a new type-definition file `src/index.d.ts`
```Typescript
declare var __filename: string;
```

5) restart your project for the changes to take effect.
```console
ng serve
```

6) Start using the variable in your state updates, for example
```Typescript
store(s => s.user.name).replaceWith('John', __filename);
```
