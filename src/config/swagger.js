import swaggerJsdoc from "swagger-jsdoc";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Photo Caption Contest API",
    version: "1.0.0",
    description:
      "REST API for a photo caption contest platform with JWT authentication, PostgreSQL, and caching.",
  },
  servers: [
    {
      url: process.env.API_BASE_URL || "http://localhost:8000",
      description: "API server",
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      ApiResponse: {
        type: "object",
        properties: {
          statusCode: { type: "integer" },
          data: { type: "object" },
          message: { type: "string" },
          success: { type: "boolean" },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string" },
          errors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                field: { type: "string" },
                message: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
};

const options = {
  swaggerDefinition,
  apis: ["./src/routes/*.js"],
};

export const swaggerSpec = swaggerJsdoc(options);
