import { JTDSchemaType } from 'ajv/dist/jtd'

/**
 * Representation of a Relase Note
 */
export default interface ReleaseNote {
  version: string
  description?: string
  breaking?: string[]
  features?: string[]
  fixes?: string[]
}

/**
 * How to validate an array of Release Notes from raw JSON
 */
export const schema: JTDSchemaType<ReleaseNote[]> = {
  elements: {
    additionalProperties: false,
    properties: {
      version: {
        type: 'string',
      },
    },
    optionalProperties: {
      breaking: {
        elements: {
          type: 'string',
        },
      },
      description: {
        type: 'string',
      },
      features: {
        elements: {
          type: 'string',
        },
      },
      fixes: {
        elements: {
          type: 'string',
        },
      },
    },
  },
}
