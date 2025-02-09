function validateFields(req, type, requiredFields) {
    const missingFields = [];
    for (let field of requiredFields) {
        if (!req[type][field]) {
            missingFields.push(field);
        }
    }
    return missingFields;
}

module.exports = { validateFields };