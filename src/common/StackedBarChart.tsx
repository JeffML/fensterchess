import '../stylesheets/grid.css';
import { CSSProperties } from 'react';
import type { GamePercentages } from '../types';

interface StackedBarChartProps {
  pctgs: GamePercentages;
  style?: CSSProperties;
}

const StackedBarChart = ({
  pctgs: { w, b, d },
  style,
}: StackedBarChartProps) => (
  <div id="games-chart" style={style}>
    {w !== 0 && (
      <div id="white" style={{ gridColumn: `span ${w}` }}>
        {w}%
      </div>
    )}
    {d !== 0 && (
      <div id="draw" style={{ gridColumn: `span ${d}` }}>
        {d}%
      </div>
    )}
    {b !== 0 && (
      <div id="black" style={{ gridColumn: `span ${100 - w - d}` }}>
        {b}%
      </div>
    )}
  </div>
);

export default StackedBarChart;
