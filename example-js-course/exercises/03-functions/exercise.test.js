const { add, multiply, getFullName, calculateRectangleArea } = require('./exercise');

describe('Exercise 3: Functions', () => {
  test('add returns the sum of two numbers', () => {
    expect(add(5, 3)).toBe(8);
    expect(add(10, 20)).toBe(30);
    expect(add(-5, 5)).toBe(0);
  });

  test('multiply returns the product of two numbers', () => {
    expect(multiply(4, 7)).toBe(28);
    expect(multiply(5, 5)).toBe(25);
    expect(multiply(0, 100)).toBe(0);
  });

  test('getFullName returns the full name', () => {
    expect(getFullName('John', 'Doe')).toBe('John Doe');
    expect(getFullName('Jane', 'Smith')).toBe('Jane Smith');
  });

  test('calculateRectangleArea returns the correct area', () => {
    expect(calculateRectangleArea(5, 10)).toBe(50);
    expect(calculateRectangleArea(7, 3)).toBe(21);
    expect(calculateRectangleArea(1, 1)).toBe(1);
  });
});
