# ts-transform-alkali
This TypeScript transformer provides "reactive" transforms of TypeScript code. Reactive code is defined with a `@reactive` decorator, and the code classes, properties, expressions, and functions that are marked as reactive will be transformed to code with classes and properties that can observed and lazily evaluated, and expressions than yield new input-varying values as well. This relies on [alkali](https://github.com/kriszyp/alkali) for variable operations that produce reactively bound variables.

## Installation

```sh
$ npm install ts-transform-alkali
```
And then put this in your list of `before` transformers when you compile TS. If you are using webpack/ts-loader, this is a simple addition to your `ts-loader` config:
```
// webpack.config.js:
const alkaliTransformer = require('ts-transform-alkali').default
...
// exports.module.rules[]
    {
      test: /\.ts$/,
      loader: 'ts-loader',
      options: {
          getCustomTransformers: () => ({
              before: [alkaliTransformer]
          }),
          transpileOnly: true
      }
    }
```

## Usage

Reactive expressions are defined by `import`ing `reactive` and marking expressions with a `@reactive`:
```
import { reactive } from 'alkali'

@reactive
class Person {
  name: string
  age: number
}
```
This class is now defined reactively, which makes it an `alkali` variable, with defined properties.

We can also define reactive expressions:
```
let someone = new Person({ name: 'Kris', age: 40})
@reactive
let birthYear = 2017 - someone.age


The `react` variable should be imported from alkali. The `expression` will be transformed to code that will reactively respond to any changes in inputs values, reflecting them in the output variable. For example:
```
import { react } from 'alkali'
let a = react(2)
let b = react(4)
let sum = react(a + b)
sum.valueOf() -> 6
a.put(4)
sum.valueOf() -> 8
```
Reactive properties and assignments are supported as well. Property access within a reactive expression will be converted to a property variable (basically `obj.prop` -> `obj.property('prop')`, with object mappings and safety checks). And assignments within a reactive expression will be converted to a `put` call (basically `v = 'hi'` -> `v.put('hi')` with similar variable mapping/creation as necessary). For example:
```
let obj = react({
  foo: 3
})
let doubleFoo = react(obj.foo * 2)
doubleFoo.valueOf() -> 6
react(obj.foo = 5)
doubleFoo.valueOf() -> 10
```
Function and method calls can be made written in reactive expressions as well. These calls will be performed lazily/on-demand, and reexecuted as needed. The target function will be called with the values of the variables (not the variables themselves). For example:
```
let smallest = react(Math.min(a, b))
```

The `react` operator returns alkali variables, that can be bound to DOM elements or any other alkali target.
```
import { react, Div } from 'alkali'
// create a div with its text bound to the sum
parent.appendChild(new Div(sum))
```
And the reactive expressions maintain operator relationships, so alkali's reversible data flow is supported as well:
```
let a = react(2)
let doubleA = react(a * 2)
react(doubleA = 10) // will flow back through the expression
a.valueOf() -> 5
```
The `react` function can take multiple arguments, the last argument output will be returned as the variable from the `react` call.

## Transform Usage

### Via `.babelrc` (Recommended)

**.babelrc**

```json
{
  "plugins": ["transform-alkali"]
}
```

### Via CLI

```sh
$ babel --plugins transform-alkali
```

### Via Node API

```javascript
require("babel-core").transform("code", {
  plugins: ["transform-alkali"]
});
```
