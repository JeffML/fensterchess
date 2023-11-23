const gsbc = ({ pctgs: { w, b, d } }) => (
    <div id="games-chart">
        {w !== 0 && <div id="white" style={{ gridColumn: `span ${w}` }}>
            {w}%
        </div>}
        {d !== 0 && <div id="draw" style={{ gridColumn: `span ${d}` }}>
            {d}%
        </div>}
        {b !== 0 && <div id="black" style={{ gridColumn: `span ${100 - w - d}` }}>
            {b}%
        </div>}
    </div>
);

export default gsbc;
