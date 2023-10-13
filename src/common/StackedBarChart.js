const barStyle = {
    color: "brown",
    textAlign:"left",
    paddingLeft: '1em',
    flex: 1,
}

const sbc = ({pctgs: { w, b, d }}) => <table className="charts-css bar multiple stacked" style={{height:"fit-content"}}>
    <tbody>
        <tr style={{display:"flex"}}>
            <td style={{"--size": w/100, "--color": "white"}}><span className="data" style={barStyle}>{w}%</span> </td>
            <td style={{"--size": b/100, "--color": "black"}}> <span className="data"style={barStyle} >{b}%</span> </td>
            <td style={{"--size": d/100, "--color": "gray"}}> <span className="data" style={barStyle}>{d}%</span> </td>

        </tr>
    </tbody>
</table>

export default sbc;