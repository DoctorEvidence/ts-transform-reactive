"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const alkali_1 = require("alkali");
class Sub {
}
let TestReactive = class TestReactive {
    constructor() {
        this.foo = 'hi';
        this.bar = 3;
        this.bar = 4;
    }
};
TestReactive = __decorate([
    alkali_1.reactive.cls({ foo: "string", bar: "number" })
], TestReactive);
let t = new TestReactive();
let b = alkali_1.reactive.subtract(t.bar, 4);
function foo() {
    (b && b.put ? b : b = alkali_1.reactive.from()).put(6);
    let f = () => {
        do {
            if (alkali_1.reactive.val(b)) {
                return b;
            }
        } while (alkali_1.reactive.val((alkali_1.reactive.val(t.bar) && 3)));
    };
    alert(alkali_1.reactive.obj({
        title: alkali_1.reactive.not(t.bar),
        message: 'hi'
    }));
    for (var i in alkali_1.reactive.val(t)) {
        console.log(i);
    }
}
