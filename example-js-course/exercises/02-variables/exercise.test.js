const { createGreeting, calculateAge, isAdult } = require('./exercise');

describe('Exercise 2: Variables and Data Types', () => {
  test('createGreeting returns a greeting with the name', () => {
    expect(createGreeting('Alice')).toBe('Hello, Alice!');
    expect(createGreeting('Bob')).toBe('Hello, Bob!');
  });

  test('calculateAge returns the correct age', () => {
    const currentYear = new Date().getFullYear();
    expect(calculateAge(2000)).toBe(currentYear - 2000);
    expect(calculateAge(1990)).toBe(currentYear - 1990);
  });

  test('isAdult returns true for age 18 and above', () => {
    expect(isAdult(18)).toBe(true);
    expect(isAdult(20)).toBe(true);
    expect(isAdult(65)).toBe(true);
  });

  test('isAdult returns false for age below 18', () => {
    expect(isAdult(17)).toBe(false);
    expect(isAdult(10)).toBe(false);
    expect(isAdult(0)).toBe(false);
  });
});
