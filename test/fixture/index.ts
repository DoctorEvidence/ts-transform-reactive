import { reactive, direct } from 'alkali'
class Sub {
  bar: boolean
}
@reactive
class TestReactive {
  foo = 'hi'
  bar = 3
  constructor() {
    this.bar = 4
  }
  @direct
  sub: Sub
}
let t = new TestReactive()
@reactive
let b = t.bar - 4
@reactive
function foo() {
  b = 6
  let f = () => {
    do {
      if (b) {
        return b
      }
    } while ((t.bar && 3))
  }
  alert({
    title: !t.bar,
    message: 'hi'
  })
  for (var i in t) {
    console.log(i)
  }
}