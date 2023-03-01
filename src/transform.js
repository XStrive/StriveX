function transform(input, mapping) {
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

module.exports = transform