/**
 * JSON Schema Validation Utility
 * SECURITY FIX: Validates JSON structure before parsing to prevent injection attacks
 */

// Mind map node schema
const mindMapNodeSchema = {
  type: 'object',
  required: ['id', 'text'],
  properties: {
    id: {
      type: 'string',
      pattern: '^[a-zA-Z0-9-_]+$',
      maxLength: 100
    },
    text: {
      type: 'string',
      maxLength: 5000
    },
    children: {
      type: 'array',
      items: {
        $ref: '#'
      },
      maxItems: 50
    }
  },
  additionalProperties: false
};

// Main mind map schema
const mindMapSchema = {
  type: 'object',
  required: ['id', 'text', 'children'],
  properties: {
    id: {
      type: 'string',
      pattern: '^[a-zA-Z0-9-_]+$',
      maxLength: 100
    },
    text: {
      type: 'string',
      maxLength: 1000
    },
    children: {
      type: 'array',
      items: mindMapNodeSchema,
      maxItems: 20
    }
  },
  additionalProperties: false
};

/**
 * Simple JSON schema validator
 * @param {any} data - Data to validate
 * @param {object} schema - JSON schema to validate against
 * @returns {object} - {valid: boolean, errors: string[]}
 */
export const validateSchema = (data, schema) => {
  const errors = [];
  
  const validate = (obj, sch, path = '') => {
    // Check type
    if (sch.type && typeof obj !== sch.type) {
      errors.push(`${path}: Expected ${sch.type}, got ${typeof obj}`);
      return;
    }
    
    // Check required properties
    if (sch.required && sch.type === 'object') {
      for (const prop of sch.required) {
        if (!(prop in obj)) {
          errors.push(`${path}: Missing required property '${prop}'`);
        }
      }
    }
    
    // Check properties
    if (sch.properties && sch.type === 'object') {
      for (const [key, value] of Object.entries(obj)) {
        if (sch.properties[key]) {
          validate(value, sch.properties[key], `${path}.${key}`);
        } else if (!sch.additionalProperties) {
          errors.push(`${path}: Additional property '${key}' not allowed`);
        }
      }
    }
    
    // Check string constraints
    if (sch.type === 'string' && typeof obj === 'string') {
      if (sch.maxLength && obj.length > sch.maxLength) {
        errors.push(`${path}: String too long (max ${sch.maxLength})`);
      }
      if (sch.pattern && !new RegExp(sch.pattern).test(obj)) {
        errors.push(`${path}: String doesn't match pattern`);
      }
    }
    
    // Check array constraints
    if (sch.type === 'array' && Array.isArray(obj)) {
      if (sch.maxItems && obj.length > sch.maxItems) {
        errors.push(`${path}: Too many items (max ${sch.maxItems})`);
      }
      if (sch.items) {
        obj.forEach((item, index) => {
          validate(item, sch.items, `${path}[${index}]`);
        });
      }
    }
  };
  
  validate(data, schema);
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Validates mind map data structure
 * @param {any} data - Data to validate
 * @returns {object} - {valid: boolean, errors: string[]}
 */
export const validateMindMapData = (data) => {
  return validateSchema(data, mindMapSchema);
};

/**
 * Safely parses JSON with validation
 * @param {string} jsonString - JSON string to parse
 * @param {object} schema - Schema to validate against
 * @returns {object} - {success: boolean, data?: any, errors?: string[]}
 */
export const safeJsonParse = (jsonString, schema = null) => {
  try {
    // Basic JSON parsing
    const data = JSON.parse(jsonString);
    
    // Schema validation if provided
    if (schema) {
      const validation = validateSchema(data, schema);
      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors
        };
      }
    }
    
    return {
      success: true,
      data
    };
  } catch (error) {
    return {
      success: false,
      errors: [`JSON parsing error: ${error.message}`]
    };
  }
};

/**
 * Sanitizes text content to prevent XSS
 * @param {string} text - Text to sanitize
 * @returns {string} - Sanitized text
 */
export const sanitizeText = (text) => {
  if (typeof text !== 'string') return '';
  
  return text
    .replace(/[<>"'&]/g, (match) => {
      const entities = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return entities[match];
    })
    .slice(0, 5000); // Limit length
};