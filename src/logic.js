function logic(json, options) {

    let parsed = null
    if (options?.stringify) parsed = JSON.parse(json)
    else parsed = json
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

module.exports = logic