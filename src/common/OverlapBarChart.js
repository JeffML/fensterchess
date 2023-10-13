import '../stylesheets/chart.css'

const PercentageBars = ({ sitePercentages }) => 
    <dl className="bars">

        {sitePercentages.current.map(sp =>
            <div key={sp.site}>
                <dt> <span style={{writingMode:"vertical-lr", transform: "rotate(180deg)", marginBottom:"-40px"}}>{sp.site}</span></dt>
                <dd>
                    <div className="bar overlapWhite" style={{ "--pctg": sp.w }}></div>
                    <div className="bar overlapBlack" style={{ "--pctg": sp.b }}></div>
                    <div className="bar overlapDraw" style={{ "--pctg": sp.d }}></div>
                </dd>
            </div>
        )}
    </dl>



const BarChart = ({ sitePercentages }) => {
    const dds = () => {
        const dds = [];
        for (let i = 100; i >= 0; i -= 20) {
            dds.push(<dd><span style={{writingMode:"vertical-lr", transform: "rotate(180deg)"}}>{i}%</span></dd>)
        }
        return dds
    }

    return <div className="container row" style={{transform:"rotate(90deg) translate(25%) "}}>
        <div className="chart">
            <dl className="numbers">
                {dds()}
            </dl>
            <PercentageBars {...{sitePercentages}}/>
        </div>
    </div>
}

export default BarChart;