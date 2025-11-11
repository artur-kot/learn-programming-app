const { greet } = require('./exercise');

test('greet should return a greeting string', () => {
  expect(greet('Alice')).toBe('Hello, Alice!');
  expect(greet('Bob')).toBe('Hello, Bob!');
});

test('greet should handle empty string', () => {
  expect(greet('')).toBe('Hello, !');
});
