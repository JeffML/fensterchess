/* eslint-disable eqeqeq */
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

const squareColors = FILES.map((file, fileNo) =>
    RANKS.map((rank) => {
        const squareInt = 8 * fileNo + rank;
        return { file, rank, color: getColorForValue((squareInt - 8) / 65) };
    })
).flat();

const FromToCircleImpl = ({ moves }) => {
    const renderRef = useRef();

    useEffect(() => {
        let remove;
        var r; //radius
        var angle;
        var step; //distance between steps in radians
        let stepCount = 0;
        const moveCoords = [];

        new p5((p) => {
            remove = p.remove;

            p.setup = () => {
                p.createCanvas(600, 600).parent(renderRef.current);

                //initialize variables
                r = 250;
                angle = 0;
                step = p.TWO_PI / 64; //in radians equivalent of 360/64 in degrees
                p.ellipseMode(p.CENTER);
                p.textAlign(p.CENTER, p.CENTER);
                p.textFont("Georgia");

                for (let stepp = 0; stepp < 64; stepp++) {
                    const newAngle = angle + step * stepp;
                    const x = r * p.sin(newAngle);
                    const y = r * p.cos(newAngle);
                    const lx = (r - 10) * p.sin(newAngle);
                    const ly = (r - 10) * p.cos(newAngle);
                    let { file, rank, color } = squareColors[stepp];

                    moveCoords[stepp] = { file, rank, color, x, y, lx, ly };
                }

                //move 0,0 to the center of the screen
                p.translate(p.width / 2, p.height / 2);

                do {
                    const { x, y, file, rank, color } =
                        moveCoords[stepCount % 64];

                    p.stroke(...color.map((c) => c * 255));

                    //draw ellipse at every x,y point
                    p.ellipse(x, y, 30);
                    p.text(`${file}${rank}`, x, y);

                    //increase angle by step size
                    angle = angle + step;

                } while (stepCount++ < 64);
            };

            p.draw = () => {
                p.translate(p.width / 2, p.height / 2);
                if (moves)
                    moves.forEach((move) => {
                        // note the == for rank: integer vs string issue
                        const fromCoord = moveCoords.find(
                            ({ file, rank }) =>
                                move[0][0] === file && move[0][1] == rank
                        );

                        const toCoord = moveCoords.find(
                            ({ file, rank }) =>
                                move[1][0] === file && move[1][1] == rank
                        );
                        p.stroke(...fromCoord.color.map((c) => c * 255));
                        p.line(
                            fromCoord.lx,
                            fromCoord.ly,
                            toCoord.lx,
                            toCoord.ly
                        );
                    });
            };
        });

        return remove;
    }, [moves]);

    return <div id="renderRef" ref={renderRef} style={{marginLeft: "-120px"}}></div>;
};

const FromToCircle = ({ cat, code }) => {
    const { error, data } = useQuery(GET_FROM_TO, {
        variables: { cat, code },
        skip: !cat,
    });

    if (error) console.error(error);
    if (data) {
        // console.dir(data, { depth: 3 });

        // TODO: this reduce can probably go into the db view
        let allMoves = data.getFromTo.reduce((acc, { moves }) => {
            moves.forEach((move) => acc.add(move.toString()));
            return acc;
        }, new Set());

        allMoves = Array.from(new Set(allMoves));

        for (let i = 0; i < allMoves.length; i++) {
            allMoves[i] = allMoves[i].split(",");
        }

        return <FromToCircleImpl {...{ moves: allMoves }} />
        
    }
};

export { FromToCircle };
