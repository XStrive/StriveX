const { logic, transform, normalizer } = require('./src/index')
const calculatorLogic = require('./docs/examples/ast/calc.json');
const calculatorLogicParams = require( './docs/examples/ast/calc_params.json');
const fibonacci = require( './docs/examples/ast/fibonacci.json')
const handleResponse = require( './docs/examples/ast/handleResponse.json')

const rules = {
  name: { type: 'string', required: true },
  age: { type: 'number', default: 0 },
  address: {
    type: 'object',
    properties: {
      street: { type: 'string', required: true },
      city: { type: 'string', required: true },
      state: { type: 'string', required: true },
      zip: { type: 'string', required: true }
    }
  },
  hobbies: {
    type: 'array',
    items: { type: 'string' },
    default: []
  }
};

const input = {
  name: 'John Smith',
  address: {
    street: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zip: '12345'
  },
  hobbies: ['reading', 'swimming']
};

const mapping = {
  'node1.node2.name': 'name',
  'node1.node2-1.address': "address"
};

const normalizerResponse = normalizer(input, rules);

const transformResponse = transform({
  name: 'Hi',
  address: 'Bogota'
}, mapping);


const resultCalcLogic = logic(calculatorLogic)
const resultCalcWithparams = logic(calculatorLogicParams)(20, 10)
const resultFibonacci = logic(fibonacci)(10)
const resultResponse = logic(handleResponse)({ node: { status: 400 } })
console.log("resultCalcLogic", resultCalcLogic);
console.log("resultCalcWithparams", resultCalcWithparams);
console.log("resultFibonacci", resultFibonacci)
console.log("resultResponse", resultResponse)
console.log("normalizer", normalizerResponse)
console.log("transform", transformResponse)
