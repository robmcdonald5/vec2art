# Create Zod Schema

Creates a new Zod schema for runtime validation and TypeScript type inference following the project's patterns.

## Usage
```
/create-zod-schema <schema-name> <schema-type>
```

## Arguments
- `schema-name`: Name of the schema in PascalCase (e.g., UserProfile)
- `schema-type`: Type of schema to create:
  - `form` - For form validation
  - `api` - For API response validation
  - `params` - For WASM/function parameters
  - `config` - For configuration objects

## Examples
```
/create-zod-schema ImageUpload form
/create-zod-schema ConversionResponse api
/create-zod-schema FilterParams params
/create-zod-schema AppConfig config
```

## Template Location
Schema files are created in `src/lib/types/`

## Form Schema Template
```typescript
// lib/types/schemaName.ts
import { z } from 'zod';

// Form validation schema with user-friendly error messages
export const SchemaNameSchema = z.object({
  // Text fields
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  
  // Optional field with default
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .default(''),
  
  // Number with constraints
  age: z.number()
    .int('Age must be a whole number')
    .min(18, 'Must be at least 18 years old')
    .max(120, 'Please enter a valid age'),
  
  // Enum selection
  role: z.enum(['user', 'admin', 'moderator'], {
    errorMap: () => ({ message: 'Please select a valid role' })
  }),
  
  // File upload validation
  avatar: z.instanceof(File)
    .refine(
      (file) => file.size <= 5 * 1024 * 1024,
      'File size must be less than 5MB'
    )
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      'File must be a JPEG, PNG, or WebP image'
    )
    .optional(),
  
  // Boolean checkbox
  acceptTerms: z.boolean()
    .refine((val) => val === true, 'You must accept the terms and conditions'),
  
  // Date validation
  birthDate: z.date()
    .max(new Date(), 'Birth date cannot be in the future')
    .min(new Date('1900-01-01'), 'Please enter a valid birth date'),
  
  // Array of items
  tags: z.array(z.string())
    .min(1, 'At least one tag is required')
    .max(10, 'Maximum 10 tags allowed')
});

// Inferred TypeScript type
export type SchemaName = z.infer<typeof SchemaNameSchema>;

// Parse function with error handling
export function parseSchemaName(data: unknown): SchemaName {
  return SchemaNameSchema.parse(data);
}

// Safe parse function that returns success/error
export function safeParseSchemaName(data: unknown) {
  return SchemaNameSchema.safeParse(data);
}
```

## API Response Schema Template
```typescript
// lib/types/schemaName.ts
import { z } from 'zod';

// Nested schemas for complex API responses
const MetadataSchema = z.object({
  version: z.string(),
  timestamp: z.string().datetime(),
  requestId: z.string().uuid()
});

const ItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  value: z.number(),
  active: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().nullable()
});

// Main API response schema
export const SchemaNameResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    items: z.array(ItemSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive()
  }),
  metadata: MetadataSchema,
  errors: z.array(z.object({
    code: z.string(),
    message: z.string(),
    field: z.string().optional()
  })).optional()
});

// Paginated response schema
export const PaginatedSchemaNameSchema = z.object({
  items: z.array(ItemSchema),
  pagination: z.object({
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrevious: z.boolean()
  })
});

// Types
export type SchemaNameResponse = z.infer<typeof SchemaNameResponseSchema>;
export type Item = z.infer<typeof ItemSchema>;
export type PaginatedSchemaName = z.infer<typeof PaginatedSchemaNameSchema>;

// Transform raw API data
export function transformApiResponse(raw: unknown): SchemaNameResponse {
  const parsed = SchemaNameResponseSchema.parse(raw);
  
  // Additional transformations if needed
  return {
    ...parsed,
    data: {
      ...parsed.data,
      items: parsed.data.items.map(item => ({
        ...item,
        createdAt: new Date(item.createdAt).toISOString(),
        updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : null
      }))
    }
  };
}
```

## WASM Parameters Schema Template
```typescript
// lib/types/schemaName.ts
import { z } from 'zod';

// Algorithm-specific parameter schemas
export const AlgorithmBaseSchema = z.object({
  quality: z.number().min(0).max(1).default(0.8),
  preserveAspectRatio: z.boolean().default(true),
  outputFormat: z.enum(['svg', 'path', 'polyline']).default('svg')
});

export const PathTracerParamsSchema = AlgorithmBaseSchema.extend({
  algorithm: z.literal('path_tracer'),
  numColors: z.number()
    .int()
    .min(2, 'Minimum 2 colors required')
    .max(256, 'Maximum 256 colors allowed')
    .default(8),
  curveSmoothing: z.number()
    .min(0)
    .max(1)
    .default(0.5),
  suppressSpeckles: z.number()
    .min(0)
    .max(1)
    .default(0.1),
  cornerThreshold: z.number()
    .min(0)
    .max(180)
    .default(60)
});

export const GeometricFitterParamsSchema = AlgorithmBaseSchema.extend({
  algorithm: z.literal('geometric_fitter'),
  shapeType: z.enum(['circles', 'rectangles', 'triangles', 'mixed'])
    .default('mixed'),
  maxShapes: z.number()
    .int()
    .min(10)
    .max(10000)
    .default(1000),
  minSize: z.number()
    .positive()
    .max(100)
    .default(5),
  overlapTolerance: z.number()
    .min(0)
    .max(1)
    .default(0.1)
});

// Union schema for all algorithms
export const ConversionParamsSchema = z.discriminatedUnion('algorithm', [
  PathTracerParamsSchema,
  GeometricFitterParamsSchema
]);

// Types
export type PathTracerParams = z.infer<typeof PathTracerParamsSchema>;
export type GeometricFitterParams = z.infer<typeof GeometricFitterParamsSchema>;
export type ConversionParams = z.infer<typeof ConversionParamsSchema>;

// Validation with defaults
export function createDefaultParams(algorithm: ConversionParams['algorithm']): ConversionParams {
  switch (algorithm) {
    case 'path_tracer':
      return PathTracerParamsSchema.parse({ algorithm });
    case 'geometric_fitter':
      return GeometricFitterParamsSchema.parse({ algorithm });
    default:
      throw new Error(`Unknown algorithm: ${algorithm}`);
  }
}

// Serialize for WASM
export function serializeForWasm(params: ConversionParams): string {
  const validated = ConversionParamsSchema.parse(params);
  return JSON.stringify(validated);
}
```

## Configuration Schema Template
```typescript
// lib/types/schemaName.ts
import { z } from 'zod';

// Environment variables schema
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PUBLIC_API_URL: z.string().url(),
  PUBLIC_MAX_FILE_SIZE: z.string().transform((val) => parseInt(val, 10)),
  PUBLIC_ALLOWED_ORIGINS: z.string().transform((val) => val.split(','))
});

// Application configuration schema
export const AppConfigSchema = z.object({
  app: z.object({
    name: z.string().default('Vec2Art'),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    environment: z.enum(['development', 'staging', 'production'])
  }),
  
  features: z.object({
    enableWebWorkers: z.boolean().default(true),
    enableCaching: z.boolean().default(true),
    maxConcurrentConversions: z.number().int().min(1).max(10).default(4),
    debugMode: z.boolean().default(false)
  }),
  
  limits: z.object({
    maxFileSize: z.number().positive().default(10 * 1024 * 1024), // 10MB
    maxImageDimension: z.number().positive().default(4096),
    maxProcessingTime: z.number().positive().default(30000), // 30s
    allowedFormats: z.array(z.enum(['jpeg', 'png', 'webp', 'gif'])).default(['jpeg', 'png', 'webp'])
  }),
  
  ui: z.object({
    theme: z.enum(['light', 'dark', 'system']).default('system'),
    animations: z.boolean().default(true),
    compactMode: z.boolean().default(false)
  }),
  
  performance: z.object({
    wasmMemoryLimit: z.number().positive().optional(),
    workerPoolSize: z.number().int().min(1).max(16).optional(),
    cacheStrategy: z.enum(['memory', 'indexeddb', 'none']).default('memory')
  })
});

// Types
export type AppConfig = z.infer<typeof AppConfigSchema>;
export type EnvConfig = z.infer<typeof EnvSchema>;

// Load and validate configuration
export function loadConfig(): AppConfig {
  // Default configuration
  const defaultConfig: AppConfig = {
    app: {
      name: 'Vec2Art',
      version: '1.0.0',
      environment: 'development'
    },
    features: {
      enableWebWorkers: true,
      enableCaching: true,
      maxConcurrentConversions: 4,
      debugMode: false
    },
    limits: {
      maxFileSize: 10 * 1024 * 1024,
      maxImageDimension: 4096,
      maxProcessingTime: 30000,
      allowedFormats: ['jpeg', 'png', 'webp']
    },
    ui: {
      theme: 'system',
      animations: true,
      compactMode: false
    },
    performance: {
      cacheStrategy: 'memory'
    }
  };
  
  // Merge with environment-specific overrides
  const envOverrides = loadEnvConfig();
  
  return AppConfigSchema.parse({
    ...defaultConfig,
    ...envOverrides
  });
}

function loadEnvConfig(): Partial<AppConfig> {
  // Load from environment variables or config file
  return {};
}
```

## Usage Examples

### Form Validation
```svelte
<script lang="ts">
  import { SchemaNameSchema } from '$lib/types/schemaName';
  
  let formData = $state({
    name: '',
    email: '',
    age: 0
  });
  
  let errors = $state<Record<string, string>>({});
  
  function handleSubmit() {
    const result = SchemaNameSchema.safeParse(formData);
    
    if (!result.success) {
      errors = result.error.flatten().fieldErrors;
      return;
    }
    
    // Process valid data
    console.log('Valid data:', result.data);
  }
</script>
```

### API Response Handling
```typescript
async function fetchData() {
  const response = await fetch('/api/items');
  const raw = await response.json();
  
  try {
    const validated = SchemaNameResponseSchema.parse(raw);
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Invalid API response:', error.errors);
    }
    throw error;
  }
}
```

## Best Practices
1. Always export both the schema and the inferred type
2. Use descriptive error messages for form validation
3. Include transform functions for data normalization
4. Use discriminated unions for variant types
5. Provide default values where appropriate
6. Create helper functions for common operations
7. Document complex validation rules