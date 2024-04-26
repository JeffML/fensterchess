import { useRef, useEffect } from "react";
import { useQuery, gql } from "@apollo/client";
import p5 from "p5";
import getColorForValue from "./colorGradient.js";
import { FILES, RANKS } from "../common/consts.js";

const GET_FROM_TO = gql`
    query getFromTo($cat: String!, $code: String) {
        getFromTo(cat: $cat, code: $code) {
            eco
            fen
            moves
        }
    }
`;

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

const squareColors = FILES.map((file, fileNo) =>
    RANKS.map((rank) => {
        const squareInt = 8 * fileNo + rank;
        return { file, rank, color: getColorForValue((squareInt - 8) / 65) };
    })
).flat();

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
                r = 250;
                angle = 0;
                step = p.TWO_PI / 64; //in radians equivalent of 360/64 in degrees
                p.ellipseMode(p.CENTER);
                p.textAlign(p.CENTER, p.CENTER);
                p.textFont("Georgia");
            };

            p.draw = () => {
                let { file, rank, color } = squareColors[stepCount++ % 64];
                p.push();
                p.stroke(...color.map((c) => c * 255));

                //move 0,0 to the center of the screen
                p.translate(p.width / 2, p.height / 2);

                //convert polar coordinates to cartesian coordinates
                var x = r * p.sin(angle);
                var y = r * p.cos(angle);
                var lx = (r - 10) * p.sin(angle);
                var ly = (r - 10) * p.cos(angle);

                //draw ellipse at every x,y point
                p.ellipse(x, y, 30);
                p.text(`${file}${rank}`, x, y);

                p.line(0, 0, lx, ly);

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
    const cat = "B";
    const code = "02";
    
    const { error, data, loading } = useQuery(GET_FROM_TO, {
        variables: { cat, code },
        skip: !cat,
    });

    if (error) console.error(error);
    if (data) {
        console.dir(data, { depth: 3 });
        return (
            <>
                <div className="column"></div>
                <div
                    className="double-column left"
                    style={{ marginTop: "1em" }}
                >
                    <FromToCircleImpl />
                </div>
            </>
        );
    }
};

export { FromToCircle };
