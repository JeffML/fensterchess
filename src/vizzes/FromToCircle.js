import { useRef, useEffect } from "react";
import p5 from "p5";

const FromToCircleImpl = () => {

    const renderRef = useRef();

    useEffect(() => {
        let remove
        var r; //radius
        var angle;
        var step; //distance between steps in radians

        new p5((p) => {
            remove = p.remove;

            p.setup = () => {
                p.createCanvas(600, 600);
        
                //initialize variables
                r = 200;
                angle = 0;
                step = p.TWO_PI / 64; //in radians equivalent of 360/6 in degrees
            }


    p.draw = () => {
        // background(220);

        //move 0,0 to the center of the screen
        p.translate(p.width / 2, p.height / 2);

        //convert polar coordinates to cartesian coordinates
        var x = r * p.sin(angle);
        var y = r * p.cos(angle);

        //draw ellipse at every x,y point
        p.ellipse(x, y, 10);

        p.line(0,0, x, y)

        //increase angle by step size
        angle = angle + step;
    }

        })

        return remove;
    }, [])


    return <div ref={renderRef} className="row"></div>
};

const FromToCircle = () => {
    return (
        <>
        <div className="column"></div>
        <div className="double-column left" style={{ marginTop: "1em" }}>
            <FromToCircleImpl/>
        </div></>
    );
};

export { FromToCircle };
