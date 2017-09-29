"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const alkali_1 = require("alkali");
const some_types_1 = require("./some-types");
var tests = {
    basic: function () {
        let num = alkali_1.reactive.from(3);
        let a = num;
        (num && num.put ? num : num = alkali_1.reactive.from()).put(4);
        console.assert(a == 4);
    },
    sum: function () {
        let num = alkali_1.reactive.from(), sum = alkali_1.reactive.from(alkali_1.reactive.add(num, 5));
        (num && num.put ? num : num = alkali_1.reactive.from()).put(4);
        console.assert(sum == 9);
    },
    bool: function () {
        let bool = alkali_1.reactive.from(true);
        let f = alkali_1.reactive.from(alkali_1.reactive.not(bool));
    },
    cond: function () {
        let f = alkali_1.reactive.from(true), num = alkali_1.reactive.from(3), sum = alkali_1.reactive.from(4), cond = alkali_1.reactive.from(alkali_1.reactive.obj({
            condProp: alkali_1.reactive.cond(f, num, sum)
        }));
    },
    call: function () {
        let num = alkali_1.reactive.from(3), sum = alkali_1.reactive.from(4);
        let result = alkali_1.reactive.from(alkali_1.reactive.mcall(Math, "min", [num, sum]));
        console.assert(result == 3);
    },
    object: function () {
        let num = alkali_1.reactive.from(3), sum = alkali_1.reactive.from(4), object = alkali_1.reactive.from(alkali_1.reactive.obj({
            num,
            sum: alkali_1.reactive.multiply(sum, 2),
            three: 3
        }));
    },
    array: function () {
        let num = alkali_1.reactive.from(3), sum = alkali_1.reactive.from(4);
        return alkali_1.reactive.mcall(Math.max, "apply", [null, alkali_1.reactive.obj([num, 3, sum])]);
    },
    reactiveProperty: function () {
        class WithProps {
        }
        __decorate([
            alkali_1.reactive.prop("string")
        ], WithProps.prototype, "str", void 0);
        __decorate([
            alkali_1.reactive.prop({ b: "boolean", ao: [{}], as: ["string"] })
        ], WithProps.prototype, "obj", void 0);
        __decorate([
            alkali_1.reactive.prop(some_types_1.Something)
        ], WithProps.prototype, "some", void 0);
    },
    reactiveClass: function () {
        let Sub = class Sub {
        };
        Sub = __decorate([
            alkali_1.reactive.cls({ prop: "string", v: alkali_1.Variable })
        ], Sub);
        let TestReactive = class TestReactive {
            constructor() {
                this.foo = 'hi';
                this.bar = 3;
            }
        };
        TestReactive = __decorate([
            alkali_1.reactive.cls({ foo: "string", str: "string", sub: Sub })
        ], TestReactive);
        let t = new TestReactive();
        t.sub.prop.put('hi');
    }
};
var test;
for (var testName in tests) {
    tests[testName]();
}
