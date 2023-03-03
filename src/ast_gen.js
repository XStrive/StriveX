const calculatorLogic = require('../docs/examples/ast/calc.json');

const escodegen = require('escodegen')
const res = escodegen.generate(calculatorLogic);
console.log(res)