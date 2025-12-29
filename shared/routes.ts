import { z } from 'zod';
import { insertUserSchema, insertContentSchema, insertBookingSchema, insertClassSchema, insertEnrollmentSchema } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/register',
      input: insertUserSchema,
      responses: {
        201: z.object({ id: z.number(), username: z.string(), role: z.string() }),
        400: errorSchemas.validation,
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/login',
      input: z.object({ username: z.string(), password: z.string() }),
      responses: {
        200: z.object({ id: z.number(), username: z.string(), role: z.string() }),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout',
      responses: {
        200: z.void(),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/user',
      responses: {
        200: z.object({ id: z.number(), username: z.string(), role: z.string(), level: z.string().nullable() }).nullable(),
      },
    },
  },
  content: {
    list: {
      method: 'GET' as const,
      path: '/api/content',
      responses: {
        200: z.array(z.any()), // Refine if possible
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/content',
      input: insertContentSchema,
      responses: {
        201: z.any(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
  },
  bookings: {
    create: {
      method: 'POST' as const,
      path: '/api/bookings',
      input: insertBookingSchema,
      responses: {
        201: z.any(),
        400: errorSchemas.validation,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/bookings',
      responses: {
        200: z.array(z.any()),
      },
    },
  },
  classes: {
    list: {
      method: 'GET' as const,
      path: '/api/classes',
      responses: {
        200: z.array(z.any()),
      },
    },
  },
  users: {
    list: {
      method: 'GET' as const,
      path: '/api/users',
      responses: {
        200: z.array(z.any()),
        401: errorSchemas.unauthorized,
      },
    },
    updateRole: {
      method: 'PATCH' as const,
      path: '/api/users/:id/role',
      input: z.object({ role: z.enum(['student', 'admin']) }),
      responses: {
        200: z.any(),
        401: errorSchemas.unauthorized,
      },
    },
  },
};
