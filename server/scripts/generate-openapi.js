const { generateSwaggerSpec } = require('../src/config/swagger');
const fs = require('fs');
const path = require('path');

const spec = generateSwaggerSpec();
const outputPath = path.resolve(__dirname, '../docs/openapi.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2));
console.log(`OpenAPI spec written to ${outputPath}`);
