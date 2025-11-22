// Native implementation of lodash _.uniqWith()

/**
 * Removes duplicate elements from an array using a comparator function
 *
 * @param arr - array of objects to uniqify
 * @param fn - function that compares two elements for equality
 * @returns unique array
 */
const uniqWith = <T>(arr: T[], fn: (a: T, b: T) => boolean): T[] =>
  arr.filter(
    (element, index) => arr.findIndex((step) => fn(element, step)) === index
  );

export { uniqWith };
