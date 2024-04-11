// const defaultGradients = [
//     [0, 0, 1, 0.0], // blue
//     [0, 1, 1, 0.34], // cyan
//     [0, 1, 0, 0.5], // green
//     [1, 1, 0, 0.66], // yellow
//     [1, 0, 0, 1.0], // red
// ];

const defaultGradients = [
    [0, 0, .5, 0.0],
    [0, 0, 1, 0.08], 
    [0, .5, 0, 0.16],
    [0, 1, 0, 0.24],
    [.5, 0, 0, 0.32],
    [1, 0, 0, 0.40],
    [1, 0, .5, 0.48],
    [1, 0, 1, 0.56],
    [1, .5, 1, 0.64],
    [.5, .5, 1, 0.72],
    [.5, 1, 1, 0.80],
    [1, 0, .5, 0.88],
    [1, .5, 0, 0.92],
    [1, .5, .5, 1.0]
]

// const dg = () => {
//     const grads = [[0, 0, 1, 0.0]]

//     for (let i = 1; i <= 64; i++) {
//         if (i/64 < 0.34) grads[i-1] = [0, 1, 1, i/64]
//         else if (i/64 < 0.5) grads[i-1] = [0, 1, 0, i/64]
//         else if (i/64 < 0.66) grads[i-1] = [1, 1, 0, i/64]
//         else grads[i-1] = [1, 0, 0, 1.0]
//     }

//     return grads
// }

// const defaultGradients = dg();

//-- Inputs a (value) between 0 and 1 and outputs the [(red), (green) and (blue)]
//-- values representing that position in the gradient.
const getColorForValue = (value) => {
    let rgb = [];
    const RED = 0,
        GREEN = 1,
        BLUE = 2,
        VALUE = 3;

    for (let i = 0; i < defaultGradients.length; i++) {
        let currC = defaultGradients[i];
        if (value < currC[VALUE]) {
            let prevC = defaultGradients[Math.max(0, i - 1)];
            let valueDiff = prevC[VALUE] - currC[VALUE];
            let fractBetween =
                valueDiff === 0 ? 0 : (value - currC[VALUE]) / valueDiff;
            rgb[RED] = (prevC[RED] - currC[RED]) * fractBetween + currC[RED];
            rgb[GREEN] =
                (prevC[GREEN] - currC[GREEN]) * fractBetween + currC[GREEN];
            rgb[BLUE] =
                (prevC[BLUE] - currC[BLUE]) * fractBetween + currC[BLUE];
            return rgb;
        }
    }

    let red = defaultGradients[0][RED];
    let green = defaultGradients[0][GREEN];
    let blue = defaultGradients[0][BLUE];
    return [red, green, blue];
};

export default getColorForValue;
