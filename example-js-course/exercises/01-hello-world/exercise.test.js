const { sayHello } = require('./exercise');

describe('Exercise 1: Hello World', () => {
  test('sayHello returns "Hello, World!"', () => {
    expect(sayHello()).toBe('Hello, World!');
  });
});
