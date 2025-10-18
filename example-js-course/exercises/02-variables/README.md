# Exercise 2: Variables and Data Types

## Description
Learn how to work with variables and different data types in JavaScript.

## Task
Complete the following functions:
1. `createGreeting(name)` - Return a greeting message with the provided name
2. `calculateAge(birthYear)` - Calculate and return the age based on birth year
3. `isAdult(age)` - Return true if age is 18 or older, false otherwise

## Expected Behavior
```javascript
createGreeting("Alice") // returns "Hello, Alice!"
calculateAge(2000) // returns 24 (or current year - birth year)
isAdult(20) // returns true
isAdult(15) // returns false
```

## Hints
- Use template literals (backticks) for string interpolation
- Use `new Date().getFullYear()` to get the current year
- Use comparison operators for boolean logic
