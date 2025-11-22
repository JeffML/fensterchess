declare module 'jsheatmap' {
  export default class HeatMap {
    constructor(ordinals: readonly number[], rows: [string, number[]][]);
    getData(): any;
  }
}
