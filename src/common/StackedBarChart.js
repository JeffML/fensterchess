const gsbc = ({ pctgs: { w, b, d } }) => (
    <div id="games-chart">
        <div id="white" style={{ gridColumn: `span ${w}` }}>
            {w}%
        </div>
        <div id="draw" style={{ gridColumn: `span ${d}` }}>
            {d}%
        </div>
        <div id="black" style={{ gridColumn: `span ${100 - w - d}` }}>
            {b}%
        </div>
    </div>
);

export default gsbc;
