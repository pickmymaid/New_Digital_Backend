const openApiComponents = {
  securitySchemes: {
    BearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Admin JWT token. Obtain from POST /api/v1/auth/admin/login. Pass as: Authorization: Bearer <token>',
    },
    CookieAuth: {
      type: 'apiKey',
      in: 'cookie',
      name: 'session',
      description: 'Customer session cookie set by POST /api/v2/auth/local or POST /api/v1/auth/customer/register',
    },
  },
  schemas: {
    ErrorResponse: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'Bad request' },
        statusCode: { type: 'integer', example: 400 },
        message: { type: 'string', example: 'Validation failed' },
      },
    },
    SuccessResponse: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'OK' },
        statusCode: { type: 'integer', example: 200 },
        message: { type: 'string', example: 'Success' },
        data: { type: 'object' },
      },
    },
    CustomerRegisterRequest: {
      type: 'object',
      required: ['first_name', 'last_name', 'email', 'password', 'confirm_password'],
      properties: {
        first_name: { type: 'string', minLength: 3, example: 'Jane' },
        last_name: { type: 'string', minLength: 2, example: 'Doe' },
        email: { type: 'string', format: 'email', example: 'jane@example.com' },
        password: { type: 'string', minLength: 4, maxLength: 16, example: 'secret123' },
        emirate_of_residence: {type: 'string', example: 'Abu Dhabi'},
        position_required: {type: 'string', example: 'Cook'}
      },
    },
    CustomerLoginRequest: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email', example: 'jane@example.com' },
        password: { type: 'string', minLength: 6, maxLength: 16, example: 'secret123' },
      },
    },
    CustomerForgetPasswordRequest: {
      type: 'object',
      required: ['email'],
      properties: {
        email: { type: 'string', format: 'email', example: 'jane@example.com' },
      },
    },
    CustomerResetPasswordRequest: {
      type: 'object',
      required: ['password', 'confirm_password'],
      properties: {
        password: { type: 'string', minLength: 4, maxLength: 16, example: 'newSecret123' },
        confirm_password: { type: 'string', example: 'newSecret123' },
      },
    },
    AdminRegisterRequest: {
      type: 'object',
      required: ['name', 'email', 'role'],
      properties: {
        name: { type: 'string', minLength: 3, example: 'Admin User' },
        email: { type: 'string', format: 'email', example: 'admin@pickmymaid.com' },
        role: { type: 'string', enum: ['A', 'Marketing', 'Admin'], example: 'A' },
        is_super_admin: { type: 'boolean', example: false },
      },
    },
    AdminLoginRequest: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email', example: 'admin@pickmymaid.com' },
        password: { type: 'string', example: 'adminpassword' },
      },
    },
    JobApplicationClientRequest: {
      type: 'object',
      required: ['name', 'mobile'],
      properties: {
        name: { type: 'string', minLength: 3, example: 'Maria Santos' },
        mobile: { type: 'string', minLength: 4, example: '+971501234567' },
        email: { type: 'string', format: 'email', example: 'maria@example.com' },
      },
    },
    ContactRequest: {
      type: 'object',
      required: ['name', 'email', 'message', 'subject'],
      properties: {
        name: { type: 'string', example: 'John Smith' },
        email: { type: 'string', format: 'email', example: 'john@example.com' },
        subject: { type: 'string', example: 'Inquiry about maid services' },
        message: { type: 'string', example: 'I would like to know more about your services.' },
      },
    },
    PaymentSubscribeRequest: {
      type: 'object',
      required: ['user_id'],
      properties: {
        user_id: { type: 'string', example: 'USR-001' },
        amount: { type: 'number', example: 299 },
        type: { type: 'integer', description: '0=Basic, 1=Standard, 2=Premium, 3=Special', example: 1 },
      },
    },
    PaymentV2CreateRequest: {
      type: 'object',
      required: ['user_id', 'type'],
      properties: {
        user_id: { type: 'string', example: 'USR-001' },
        amount: { type: 'number', example: 299 },
        type: { type: 'integer', description: '0=Basic, 1=Standard, 2=Premium, 3=Special', example: 1 },
        ref: { type: 'string', example: 'REF-12345' },
      },
    },
    MaidProfile: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        ref_number: { type: 'string', example: 'PMM-0001' },
        name: { type: 'string', example: 'Maria Santos' },
        email: { type: 'string', format: 'email' },
        mobile: { type: 'string', example: '+971501234567' },
        age: { type: 'integer', example: 30 },
        nationality: { type: 'string', example: 'Filipino' },
        marital_status: { type: 'string', example: 'Single' },
        location: { type: 'string', example: 'Dubai' },
        religion: { type: 'string', example: 'Christian' },
        salary: { type: 'number', example: 1500 },
        availability: { type: 'string', example: 'Immediate' },
        skills: { type: 'array', items: { type: 'string' }, example: ['Cooking', 'Childcare'] },
        languages: { type: 'array', items: { type: 'string' }, example: ['English', 'Arabic'] },
        profile: { type: 'string', description: 'Profile image URL' },
        is_verified: { type: 'boolean', example: true },
        is_disabled: { type: 'boolean', example: false },
        is_featured: { type: 'boolean', example: false },
        is_assured: { type: 'boolean', example: false },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
    Customer: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        user_id: { type: 'string', example: 'USR-001' },
        first_name: { type: 'string', example: 'Jane' },
        last_name: { type: 'string', example: 'Doe' },
        email: { type: 'string', format: 'email', example: 'jane@example.com' },
        phone: { type: 'string', example: '+971501234567' },
        profile: { type: 'string', description: 'Profile image URL' },
        is_blocked: { type: 'boolean', example: false },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
    BlogResponse: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        slug: { type: 'string', example: 'how-to-hire-a-maid' },
        title: { type: 'string', example: 'How to Hire a Maid in Dubai' },
        description: { type: 'string' },
        thumbnail: { type: 'string', description: 'Thumbnail image URL' },
        content: { type: 'string' },
        meta_title: { type: 'string' },
        meta_description: { type: 'string' },
        comments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              user_id: { type: 'string' },
              comment: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        likes: { type: 'array', items: { type: 'string' } },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
    PaymentRecord: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        user_id: { type: 'string', example: 'USR-001' },
        receipt_number: { type: 'string', example: 'RCP-001' },
        transactionToken: { type: 'string' },
        transRef: { type: 'string' },
        type: { type: 'integer', example: 1 },
        is_paid: { type: 'boolean', example: true },
        status: { type: 'integer', description: '1=active, 2=expired', example: 1 },
        expiryDate: { type: 'string', format: 'date-time' },
        paymentDate: { type: 'string', format: 'date-time' },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  },
};

module.exports = { openApiComponents };
