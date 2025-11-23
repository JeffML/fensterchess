type RGBTuple = [number, number, number, number];

const defaultGradients: RGBTuple[] = [
  [0, 0, 0.5, 0.0],
  [0, 0, 1, 0.08],
  [0, 0.5, 0, 0.16],
  [0, 1, 0, 0.24],
  [0.5, 0, 0, 0.32],
  [1, 0, 0, 0.4],
  [1, 0, 0.5, 0.48],
  [1, 0, 1, 0.56],
  [1, 0.5, 1, 0.64],
  [0.5, 0.5, 1, 0.72],
  [0.5, 1, 1, 0.8],
  [1, 0, 0.5, 0.88],
  [1, 0.5, 0, 0.92],
  [1, 0.5, 0.5, 1.0],
];

//-- Inputs a (value) between 0 and 1 and outputs the [(red), (green) and (blue)]
//-- values representing that position in the gradient.
const getColorForValue = (value: number): number[] => {
  const rgb: number[] = [];
  const RED = 0;
  const GREEN = 1;
  const BLUE = 2;
  const VALUE = 3;

  for (let i = 0; i < defaultGradients.length; i++) {
    const currC = defaultGradients[i];
    if (value < currC[VALUE]) {
      const prevC = defaultGradients[Math.max(0, i - 1)];
      const valueDiff = prevC[VALUE] - currC[VALUE];
      const fractBetween =
        valueDiff === 0 ? 0 : (value - currC[VALUE]) / valueDiff;
      rgb[RED] = (prevC[RED] - currC[RED]) * fractBetween + currC[RED];
      rgb[GREEN] = (prevC[GREEN] - currC[GREEN]) * fractBetween + currC[GREEN];
      rgb[BLUE] = (prevC[BLUE] - currC[BLUE]) * fractBetween + currC[BLUE];
      return rgb;
    }
  }

  const red = defaultGradients[0][RED];
  const green = defaultGradients[0][GREEN];
  const blue = defaultGradients[0][BLUE];
  return [red, green, blue];
};

export default getColorForValue;
