import compile from '../compile'
import { resolve } from 'path'
import { expect } from 'chai'

describe('ts-transform-alkali', function () {
    this.timeout(5000)
    it('should be able to compile reactive decorators', function () {
        compile(resolve(__dirname, 'fixture/*.ts'))
        expect(require('./fixture/index.js').default()).to.deep.equal({
        })
    })
})
