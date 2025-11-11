const { name, age, isStudent } = require('./exercise');

test('name should be a string', () => {
  expect(typeof name).toBe('string');
  expect(name.length).toBeGreaterThan(0);
});

test('age should be a number', () => {
  expect(typeof age).toBe('number');
  expect(age).toBeGreaterThan(0);
});

test('isStudent should be a boolean', () => {
  expect(typeof isStudent).toBe('boolean');
});
