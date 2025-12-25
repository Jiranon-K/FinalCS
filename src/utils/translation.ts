/**
 * Safely retrieves a string value from the register translation object.
 * This is necessary because some keys in the register object (like 'faceSteps')
 * map to objects, not strings. Dynamic access (e.g., register[`dept${dept}`])
 * causes TypeScript to infer a union type (string | object) which is not valid
 * for React rendering.
 *
 * @param register - The t.register translation object
 * @param key - The dynamic key to look up
 * @returns The string value if found and is a string, otherwise undefined
 */
export const getSafeRegisterString = (register: any, key: string): string | undefined => {
  if (!register || !key) return undefined;
  
  const value = register[key];
  return typeof value === 'string' ? value : undefined;
};
