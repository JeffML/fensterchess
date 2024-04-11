import { useRef, useEffect } from "react";
import p5 from "p5";
import getColorForValue from "./colorGradient.js";
import { FILES, RANKS } from "../common/consts.js";

/*
        TODO: 
        The value should be a number between 0 and 1
        There are 64 squares
        The values for each square could be 8*file + rank
        The input value for getColorForValue would be (squareValue - 8)/65
        square values:  a1 = 8*1 + 1 = 9; h8 = 8*8 + 8 = 72
        (a1 - 8)/63 = (9-8)/65 = 1/65
        (h8 - 8)/63 = (72-8)/65 = 64/65
        */
// const calcColor = (square) => {
const squareColors = FILES.map((_, file) =>
    RANKS.map((rank) => {
        const squareInt = 8 * file + rank;
        return getColorForValue((squareInt - 8) / 65);
    })
).flat();

// return squareColors.flatten()
// }

const FromToCircleImpl = () => {
    const renderRef = useRef();

    useEffect(() => {
        let remove;
        var r; //radius
        var angle;
        var step; //distance between steps in radians
        let stepCount = 0;

        new p5((p) => {
            remove = p.remove;

            p.setup = () => {
                p.createCanvas(600, 600);

                //initialize variables
                r = 200;
                angle = 0;
                step = p.TWO_PI / 64; //in radians equivalent of 360/6 in degrees
            };

            p.draw = () => {
                // background(220);
                // const value = (++stepCount % 64) * step;

                p.push();
                let color = squareColors[stepCount++ % 64];
                // console.log(value, color);
                p.stroke(...color.map((c) => c * 255));

                //move 0,0 to the center of the screen
                p.translate(p.width / 2, p.height / 2);

                //convert polar coordinates to cartesian coordinates
                var x = r * p.sin(angle);
                var y = r * p.cos(angle);

                //draw ellipse at every x,y point
                p.ellipse(x, y, 10);

                p.line(0, 0, x, y);

                //increase angle by step size
                angle = angle + step;

                p.pop();
            };
        });

        return remove;
    }, []);

    return <div ref={renderRef} className="row"></div>;
};

const FromToCircle = () => {
    return (
        <>
            <div className="column"></div>
            <div className="double-column left" style={{ marginTop: "1em" }}>
                <FromToCircleImpl />
            </div>
        </>
    );
};

export { FromToCircle };
