// Native implementation of lodash _.uniqWith()

/**
 * Description placeholder
 *
 * @param {[{}]} arr: array of objects to uniqify
 * @param {Function} fn: function that uniqifies the array of objects
 * @returns {[{}]}
 */
const uniqWith = (arr, fn) =>
    arr.filter(
        (element, index) => arr.findIndex((step) => fn(element, step)) === index
    );

export { uniqWith };
