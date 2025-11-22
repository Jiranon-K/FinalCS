export const DEPARTMENTS = [
  'ComputerScience',
] as const;

export const GRADES = ['1', '2', '3', '4'] as const; 
export const CLASSES = ['1', '2', '3', '4'] as const;

export type Department = typeof DEPARTMENTS[number];
export type Grade = typeof GRADES[number];
export type Class = typeof CLASSES[number];
