const exec = (json) => {
  const parsed = JSON.parse(json)
  var output = {}

  function evaluate(node, scope) {

    if (typeof scope !== 'undefined') output = {
      ...output,
      ...scope
    }
    switch (node.type) {
      case 'Program':
        return evaluate(node.body[0]);
      case 'ExpressionStatement':
        const expressionResponse = evaluate(node.expression);

        return expressionResponse
      case 'AssignmentExpression':
        const assignmentValue = evaluate(node.right);
        switch (node.left.type) {
          case 'Identifier':
            output[node.left.name] = assignmentValue;
            return assignmentValue;
          case 'MemberExpression':
            const object = evaluate(node.left.object);
            const propertyName = evaluate(node.left.property);
            object[propertyName] = assignmentValue;
            return assignmentValue;
          default:
            throw new Error(`Unsupported left-hand side of assignment: ${node.left.type}`);
        }
      case 'UpdateExpression':
        const oldValue = output[node.argument.name];
        const newValue = node.operator === '++' ? oldValue + 1 : oldValue - 1;
        output[node.argument.name] = newValue;
        return node.prefix ? newValue : oldValue;
      case 'IfStatement':
        if (evaluate(node.test)) {
          return evaluate(node.consequent);
        } else if (node.alternate) {
          return evaluate(node.alternate);
        } else {
          return undefined;
        }
      case 'Literal':
        return node.value;
      case 'Identifier':
        return output[node.name];
      case 'BlockStatement':
        let result;
        node.body.forEach(statement => {
          result = evaluate(statement);
        });
        return result;
      case 'BinaryExpression':
        const left = evaluate(node.left);
        const right = evaluate(node.right);
        switch (node.operator) {
          case '===':
            return left === right;
          case '!==':
            return left !== right;
          case '>':
            return left > right;
          case '>=':
            return left >= right;
          case '<':
            return left < right;
          case '<=':
            return left <= right;
          case '+':
            return left + right;
          case '-':
            return left - right;
          case '*':
            return left * right;
          case '/':
            return left / right;
          default:
            throw new Error(`Unsupported binary operator: ${node.operator}`);
        }
      case 'UnaryExpression':
        const operand = evaluate(node.argument);
        switch (node.operator) {
          case '-':
            return -operand;
          case '+':
            return +operand;
          case '!':
            return !operand;
          default:
            throw new Error(`Unsupported unary operator: ${node.operator}`);
        }
      case 'VariableDeclaration':
        node.declarations.forEach(declaration => {
          output = {
            ...output,
            [declaration.id.name]: evaluate(declaration.init)
          }
        });
        return output;
      case 'VariableAssignment':
        output[node.id.name] = evaluate(node.init);
        break;
      case 'ForStatement':
        if (node.init) {
          evaluate(node.init);
        }

        while (evaluate(node.test)) {
          evaluate(node.body);
          if (node.update) {
            evaluate(node.update);
          }
        }
        return undefined;
      case 'WhileStatement':
        while (evaluate(node.test)) {
          evaluate(node.body);
        }
        return undefined;
      case 'SwitchStatement':
        const switchValue = evaluate(node.discriminant);
        let switchOutput;
        node.cases.some(caseNode => {
          if (caseNode.test) {
            if (evaluate(caseNode.test) === switchValue) {
              switchOutput = evaluate(caseNode.consequent);
              return true;
            }
          } else {
            switchOutput = evaluate(caseNode.consequent);
          }
        });
        return switchOutput;
      case 'CallExpression':
        const fn = evaluate(node.callee);
        const args = node.arguments.map(evaluate);
        if (typeof fn !== 'function') {
          throw new Error(`${node.callee.name} is not a function`);
        }
        return fn(...args);
      case 'FunctionDeclaration':
        const func = function (...args) {
          const newScope = Object.create(output);
          node.params.forEach((param, i) => {
            newScope[param.name] = args[i];
          });
          return evaluate(node.body, newScope);
        };
        output[node.id.name] = func;
        return func;
      case 'FunctionExpression':
        const funcExpr = function (...args) {
          const newScope = Object.create(output);
          node.params.forEach((param, i) => {
            newScope[param.name] = args[i];
          });
          return evaluate(node.body, newScope);
        };
        return funcExpr;
      case 'ReturnStatement':
        const returnVal = evaluate(node.argument);
        return returnVal
      case 'ArrayExpression':
        return node.elements.map(evaluate);
      case 'ObjectExpression':
        const obj = {};
        node.properties.forEach(prop => {
          obj[prop.key.name] = evaluate(prop.value);
        });
        return obj;
      case 'MemberExpression':
        const object = evaluate(node.object);
        const propertyName = evaluate(node.property);

        return object[propertyName];
      default:
        throw new Error(`Unsupported node type: ${node.type}`);
    }
  }
  return evaluate(parsed)
}


function transformObject(input, mapping) {
  const output = {};

  // Iterate over each key in the mapping object
  Object.keys(mapping).forEach(key => {
    const path = mapping[key];
    let value = input;

    // Traverse the input object based on the path defined in the mapping object
    path.split('.').forEach(part => {
      if (value.hasOwnProperty(part)) {
        value = value[part];
      } else {
        value = undefined;
        return;
      }
    });

    // Set the value in the output object based on the key in the mapping object
    if (value !== undefined) {
      const parts = key.split('.');
      let target = output;

      // Traverse the output object based on the key defined in the mapping object
      parts.slice(0, -1).forEach(part => {
        if (!target.hasOwnProperty(part)) {
          target[part] = {};
        }
        target = target[part];
      });

      target[parts[parts.length - 1]] = value;
    }
  });

  // Return the transformed output object
  return output;
}

function normalizeObject(input, rules) {
  const output = {};

  // Iterate over each key in the rules object
  Object.keys(rules).forEach(key => {
    const rule = rules[key];

    // Check if the key exists in the input object
    if (input.hasOwnProperty(key)) {
      const value = input[key];

      // Normalize the value based on the rule type
      switch (rule.type) {
        case 'string':
          output[key] = String(value);
          break;
        case 'number':
          output[key] = Number(value);
          break;
        case 'boolean':
          output[key] = Boolean(value);
          break;
        case 'object':
          output[key] = normalizeObject(value, rule.properties);
          break;
        case 'array':
          output[key] = value.map(item => normalizeObject(item, rule.items));
          break;
        default:
          // Invalid rule type
          throw new Error(`Invalid rule type "${rule.type}" for key "${key}"`);
      }
    } else if (rule.required) {
      // Throw an error if the key is required but not present in the input object
      throw new Error(`Missing required key "${key}"`);
    } else if (rule.default !== undefined) {
      // Use the default value if provided
      output[key] = rule.default;
    }
  });

  // Return the normalized output object
  return output;
}

const calculatorLogic = `
{
  "type": "BinaryExpression",
  "operator": "+",
  "left": {
    "type": "Literal",
    "value": 2
  },
  "right": {
    "type": "BinaryExpression",
    "operator": "*",
    "left": {
      "type": "Literal",
      "value": 3
    },
    "right": {
      "type": "Literal",
      "value": 4
    }
  }
}
`;

const calcWithParams = `{
  "type": "Program",
  "body": [
    {
      "type": "FunctionDeclaration",
      "id": {
        "type": "Identifier",
        "name": "calc"
      },
      "expression": false,
      "generator": false,
      "async": false,
      "params": [
        {
          "type": "Identifier",
          "name": "a"
        },
        {
          "type": "Identifier",
          "name": "b"
        },
        {
          "type": "Identifier",
          "name": "op"
        }
      ],
      "body": {
        "type": "BlockStatement",
        "body": [
          {
            "type": "ReturnStatement",
            "argument": {
              "type": "BinaryExpression",
              "left": {
                "type": "Identifier",
                "name": "a"
              },
              "operator": "-",
              "right": {
                "type": "Identifier",
                "name": "b"
              }
            }
          }
        ]
      }
    }
  ],
  "sourceType": "module"
}
`

const fibonacci = `{
  "type": "Program",
  "body": [
    {
      "type": "FunctionDeclaration",
      "id": {
        "type": "Identifier",
        "name": "fib"
      },
      "expression": false,
      "generator": false,
      "async": false,
      "params": [
        {
          "type": "Identifier",
          "name": "n"
        }
      ],
      "body": {
        "type": "BlockStatement",
        "body": [
          {
            "type": "VariableDeclaration",
            "declarations": [
              {
                "type": "VariableDeclarator",
                "id": {
                  "type": "Identifier",
                  "name": "sol"
                },
                "init": {
                  "type": "ArrayExpression",
                  "elements": [
                    {
                      "type": "Literal",
                      "value": 0,
                      "raw": "0"
                    },
                    {
                      "type": "Literal",
                      "value": 1,
                      "raw": "1"
                    }
                  ]
                }
              }
            ],
            "kind": "const"
          },
          {
            "type": "ForStatement",
            "init": {
              "type": "VariableDeclaration",
              "declarations": [
                {
                  "type": "VariableDeclarator",
                  "id": {
                    "type": "Identifier",
                    "name": "i"
                  },
                  "init": {
                    "type": "Literal",
                    "value": 2,
                    "raw": "2"
                  }
                }
              ],
              "kind": "let"
            },
            "test": {
              "type": "BinaryExpression",
              "left": {
                "type": "Identifier",
                "name": "i"
              },
              "operator": "<=",
              "right": {
                "type": "Identifier",
                "name": "n"
              }
            },
            "update": {
              "type": "UpdateExpression",
              "operator": "++",
              "prefix": false,
              "argument": {
                "type": "Identifier",
                "name": "i"
              }
            },
            "body": {
              "type": "BlockStatement",
              "body": [
                {
                  "type": "ExpressionStatement",
                  "expression": {
                    "type": "AssignmentExpression",
                    "operator": "=",
                    "left": {
                      "type": "MemberExpression",
                      "object": {
                        "type": "Identifier",
                        "name": "sol"
                      },
                      "property": {
                        "type": "Identifier",
                        "name": "i"
                      },
                      "computed": true,
                      "optional": false
                    },
                    "right": {
                      "type": "BinaryExpression",
                      "left": {
                        "type": "MemberExpression",
                        "object": {
                          "type": "Identifier",
                          "name": "sol"
                        },
                        "property": {
                          "type": "BinaryExpression",
                          "left": {
                            "type": "Identifier",
                            "name": "i"
                          },
                          "operator": "-",
                          "right": {
                            "type": "Literal",
                            "value": 1,
                            "raw": "1"
                          }
                        },
                        "computed": true,
                        "optional": false
                      },
                      "operator": "+",
                      "right": {
                        "type": "MemberExpression",
                        "object": {
                          "type": "Identifier",
                          "name": "sol"
                        },
                        "property": {
                          "type": "BinaryExpression",
                          "left": {
                            "type": "Identifier",
                            "name": "i"
                          },
                          "operator": "-",
                          "right": {
                            "type": "Literal",
                            "value": 2,
                            "raw": "2"
                          }
                        },
                        "computed": true,
                        "optional": false
                      }
                    }
                  }
                }
              ]
            }
          },
          {
            "type": "ReturnStatement",
            "argument": {
              "type": "MemberExpression",
              "object": {
                "type": "Identifier",
                "name": "sol"
              },
              "property": {
                "type": "Identifier",
                "name": "n"
              },
              "computed": true,
              "optional": false
            }
          }
        ]
      }
    }
  ],
  "sourceType": "module"
}
`

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
  'node1.node2.name': 'name'
};

const normalizer = normalizeObject(input, rules);

const transform = transformObject({
  name: 'Hi'
}, mapping);


const resultCalcLogic = exec(calculatorLogic)
const resultCalcWithparams = exec(calcWithParams)(10, 5)
const resultFibonacci = exec(fibonacci)(10)
console.log("resultCalcLogic", resultCalcLogic);
console.log("resultCalcWithparams", resultCalcWithparams);
console.log("resultFibonacci", resultFibonacci)

console.log("normalizer", normalizer)
console.log("transform", transform)
