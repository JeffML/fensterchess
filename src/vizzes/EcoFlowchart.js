import data from "../common/ecoCodes.js";
import { ECO_CATS } from "../common/consts.js";
import "./EcoFlowchart.css";
import { useState } from "react";



const EcoCats = ({ category }) => {
    const [cat, desc] = category;
    const [active, setActive] = useState('')
    const [contentStyle, setContentStyle] = useState('none')
    
    const handler = (e) => {
        setActive(active === 'active'? '' : 'active')
        setContentStyle(contentStyle === 'block'? 'none' : 'block')
    }

    return (
        <>
            <button type="button" className={`collapsible font-cinzel " + ${active}`} style={{fontSize:'large'}} onClick={handler}>
                {cat}&mdash;{desc}
            </button>
            <div className="content" style={{display:`${contentStyle}`, fontFamily:'Serif', fontSize:'larger'}}>
                {data[cat].map(([code, desc, desc2]) => (
                    <p style={{borderBottom:'solid 1px', margin:'1em'}}>
                        <span style={{color:'lightgray', textShadow: '1px 1px 4px black'}}>{cat}
                        {code}:{"   "}</span>{desc},{desc2}
                    </p>
                ))}
            </div>
        </>
    );
};

const EcoFlowchart = () => (
    <div style={{marginRight:'3em'}} >
        {ECO_CATS.map((category) => (
            <EcoCats {...{ category }} />
        ))}
    </div>
);

export { EcoFlowchart };
