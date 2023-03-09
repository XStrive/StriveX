const hello_world = require('../../playground/docs/examples/ast/hello_world.json');

const escodegen = require('escodegen')
const res = escodegen.generate(hello_world);
console.log(res)