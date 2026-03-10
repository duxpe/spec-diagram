import { z } from 'zod'

export class ValidationService {
  static parse<T>(schema: z.ZodSchema<T>, input: unknown): T {
    return schema.parse(input)
  }

  static parseArray<T>(schema: z.ZodSchema<T>, input: unknown[]): T[] {
    return input.map((item) => schema.parse(item))
  }
}
