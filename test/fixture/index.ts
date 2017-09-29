import { reactive, direct, Variable } from 'alkali'
import { Something } from './some-types'
var tests = {
  basic: function() {
    @reactive
    let num = 3
    let a = num
    @reactive
    num = 4
    console.assert(a == 4)
  },
  sum: function() {
    @reactive
    let num, sum = num + 5
    @reactive
    num = 4
    console.assert(sum == 9)  
  },
  bool: function() {
    @reactive
    let bool = true
    @reactive
    let f = !bool
  },
  cond: function() {
    @reactive
    let f = true, num = 3, sum = 4, cond = {
      condProp: f ? num : sum
    }
  },
  call: function() {
    @reactive
    let num = 3, sum = 4
    @reactive
    let result = Math.min(num, sum)
    console.assert(result == 3
  },
  object: function() {
    @reactive
    let num = 3, sum = 4, object = {
      num,
      sum: sum * 2,
      three: 3
    }
  },
  array: function() {
    @reactive
    let num = 3, sum = 4
    @reactive
    return Math.max.apply(null, [num, 3, sum])
  },
  reactiveProperty: function() {
    class WithProps {
      @reactive
      str: string
      @reactive
      obj: {
        b: boolean,
        ao: {}[],
        as: string[]
      }
      @reactive
      some: Something
      nonReactive: number
    }
  },
  reactiveClass: function() {
    @reactive
    class Sub {
      prop: string
      v: Variable
    }
    @reactive
    class TestReactive {
      foo = 'hi'
      @direct
      bar = 3
      str: string
      sub: Sub
    }
    let t = new TestReactive()
    t.sub.prop.put('hi')
  }
}
var test
for (var testName in tests) {
  tests[testName]()
}


