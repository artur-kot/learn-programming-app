const {
  getFirstElement,
  getLastElement,
  getArrayLength,
  sumArray,
  filterEvenNumbers
} = require('./exercise');

describe('Exercise 4: Arrays', () => {
  test('getFirstElement returns the first element', () => {
    expect(getFirstElement([1, 2, 3])).toBe(1);
    expect(getFirstElement(['a', 'b', 'c'])).toBe('a');
  });

  test('getLastElement returns the last element', () => {
    expect(getLastElement([1, 2, 3])).toBe(3);
    expect(getLastElement(['a', 'b', 'c'])).toBe('c');
  });

  test('getArrayLength returns the length of the array', () => {
    expect(getArrayLength([1, 2, 3, 4])).toBe(4);
    expect(getArrayLength([])).toBe(0);
    expect(getArrayLength([1])).toBe(1);
  });

  test('sumArray returns the sum of all numbers', () => {
    expect(sumArray([1, 2, 3, 4])).toBe(10);
    expect(sumArray([10, 20, 30])).toBe(60);
    expect(sumArray([0])).toBe(0);
  });

  test('filterEvenNumbers returns only even numbers', () => {
    expect(filterEvenNumbers([1, 2, 3, 4, 5, 6])).toEqual([2, 4, 6]);
    expect(filterEvenNumbers([1, 3, 5])).toEqual([]);
    expect(filterEvenNumbers([2, 4, 6, 8])).toEqual([2, 4, 6, 8]);
  });
});
