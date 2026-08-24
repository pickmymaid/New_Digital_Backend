const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { openApiComponents } = require('./openapi-components');

const swaggerOptions = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'Pickmymaid API',
      version: '2.0.0',
      description:
        'REST API for Pickmymaid — a domestic helper and maid hiring platform in the UAE. ' +
        'Includes V1 (JWT-based) and V2 (OAuth/session-based) endpoints.\n\n' +
        '**Authentication:**\n' +
        '- Admin endpoints use `BearerAuth` (JWT from `POST /api/v1/auth/admin/login`)\n' +
        '- Customer endpoints use `CookieAuth` (session cookie from OAuth or local login)\n\n' +
        '**Roles:** SA (Super Admin) · A (Admin) · Marketing · Customer',
      contact: {
        name: 'Pickmymaid Support',
        email: 'support@pickmymaid.com',
      },
    },
    servers: [{ url: '/', description: 'Current server' }],
    components: openApiComponents,
    tags: [
      { name: 'Auth V1', description: 'Customer and admin authentication (JWT-based)' },
      { name: 'Auth V2', description: 'OAuth 2.0 and session-based authentication (Google, Apple, Facebook, Local)' },
      { name: 'Admin V1', description: 'Admin team and customer management (Super Admin only)' },
      { name: 'Maids V1', description: 'Maid job application management, browsing, wishlists, and job listings' },
      { name: 'Maids V2', description: 'Advanced paginated maid search with filters' },
      { name: 'Payment V1', description: 'Payment token generation and verification' },
      { name: 'Payment V2', description: 'Payment creation, acknowledgement, and invoice generation' },
      { name: 'Blog V1', description: 'Blog post creation, editing, comments, and likes' },
      { name: 'Contact V1', description: 'Contact form submissions' },
      { name: 'Analytics V1', description: 'Category usage and email click analytics' },
      { name: 'Internal', description: 'Internal/debug endpoints' },
    ],
  },
  apis: [
    './src/routes/*.js',
    './src/routes/v2/*.js',
  ],
};

function generateSwaggerSpec() {
  return swaggerJsdoc(swaggerOptions);
}

function setupSwagger(app) {
  if (process.env.NODE_ENV === 'production') return;
  const spec = generateSwaggerSpec();
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec, {
    customSiteTitle: 'Pickmymaid API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      filter: true,
      displayRequestDuration: true,
    },
  }));
  app.get('/api-docs.json', (_req, res) => res.json(spec));
  console.log('📖 Swagger UI: http://localhost:8080/api-docs');
}

module.exports = { generateSwaggerSpec, setupSwagger };
