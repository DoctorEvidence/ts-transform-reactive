# ts-transform-reactive
This TypeScript transformer provides "reactive" transforms of TypeScript code. Reactive code is defined with a `@reactive` decorator, and the code classes, properties, expressions, and functions that are marked as reactive will be transformed to code with classes and properties that can observed and lazily evaluated, and expressions than yield new input-varying values as well. This relies on [alkali](https://github.com/kriszyp/alkali) for variable operations that produce reactively bound variables.

## Installation

```sh
$ npm install ts-transform-reactive
```
And then put this in your list of `before` transformers when you compile TS. If you are using webpack/ts-loader, this is a simple addition to your `ts-loader` config:
```
// webpack.config.js:
const reactiveTransformer = require('ts-transform-reactive').default
...
// exports.module.rules[]
    {
      test: /\.ts$/,
      loader: 'ts-loader',
      options: {
          getCustomTransformers: () => ({
              before: [reactiveTransformer()]
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
This class is now defined reactively. In this case it is an `alkali` variable, with defined properties:
```
let p = new Person()
p.name -> a reactive variable that can be bound to elements
```

We can also define reactive expressions:
```
let someone = new Person({ name: 'Kris', age: 40})
@reactive
let birthYear = 2017 - someone.age
birthYear.valueOf() -> 1977
someone.age = 45
birthYear.valueOf() -> 1972
```
Function and method calls can be made written in reactive expressions as well. These calls will be performed lazily/on-demand, and reexecuted as needed. The target function will be called with the values of the variables (not the variables themselves). For example:
```
@reactive
let smallest = Math.min(a, b)
```

When using the alkali `reactive`, to create these variables, they can be bound to DOM elements using alkali constructors or any other alkali target.
```
import { reactive, Div } from 'alkali'
// create a div with its text bound to the sum
parent.appendChild(new Div(sum))
```
And the reactive expressions maintain operator relationships, so alkali's reversible data flow is supported as well:
```
@reactive
let a = 2,
  doubleA = react(a * 2)
@reactive
doubleA = 10 // will flow back through the expression
a.valueOf() -> 5
```
