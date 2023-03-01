function normalize(input, rules) {
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
                    output[key] = normalize(value, rule.properties);
                    break;
                case 'array':
                    output[key] = value.map(item => normalize(item, rule.items));
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

module.exports = normalize