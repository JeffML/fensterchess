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

const drawCircles = (p, moveCoords, stepCount, angle, step) => {
    p.ellipseMode(p.CENTER);
    p.textAlign(p.CENTER, p.CENTER);
    p.textFont("Georgia");

    //move 0,0 to the center of the screen
    // p.translate(p.width / 2, p.height / 2);

    do {
        const { x, y, file, rank, color } = moveCoords[stepCount % 64];

        p.stroke(...color.map((c) => c * 255));

        //draw ellipse at every x,y point
        p.ellipse(x, y, 30);
        p.text(`${file}${rank}`, x, y);

        //increase angle by step size
        angle = angle + step;

    } while (stepCount++ < 64);
}

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
                r = 250;
                angle = 0;
                step = p.TWO_PI / 64; //in radians equivalent of 360/64 in degrees

                for (let stepp = 0; stepp < 64; stepp++) {
                    const newAngle = angle + step * stepp;
                    const x = r * p.sin(newAngle);
                    const y = r * p.cos(newAngle);
                    const lx = (r - 10) * p.sin(newAngle);
                    const ly = (r - 10) * p.cos(newAngle);
                    let { file, rank, color } = squareColors[stepp];

                    moveCoords[stepp] = { file, rank, color, x, y, lx, ly };
                }

                p.createCanvas(600, 600).parent(renderRef.current);

            };

            p.draw = () => {

                if (!moves) return;
                p.translate(p.width / 2, p.height / 2);
                p.push()
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

                    const cp1 = [0 + fromCoord.lx / 2, 0 + fromCoord.ly / 2];
                    const cp2 = [0 + toCoord.lx / 2, 0 + toCoord.ly / 2];

                    p.noFill();
                    p.bezier(
                        fromCoord.lx,
                        fromCoord.ly,
                        cp1[0],
                        cp1[1],
                        cp2[0],
                        cp2[1],
                        toCoord.lx,
                        toCoord.ly
                    );
                });
                p.pop()

                drawCircles(p, moveCoords, stepCount, angle, step);
            };
        });

        return remove;
    }, [moves]);

    return (
        <div
            id="renderRef"
            ref={renderRef}
            style={{ marginLeft: "-120px" }}
        ></div>
    );
};

const FromToCircle = ({ cat, code }) => {
    const { error, data, loading } = useQuery(GET_FROM_TO, {
        variables: { cat, code },
        skip: !code,
    });

    if (error) {
        console.error(error);
        return <span>error.toString()</span>;
    }
    if (loading)
        return (
            <div>
                <span className="white">Loading...</span>
            </div>
        );
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

        return <FromToCircleImpl {...{ moves: allMoves }} />;
    }
};

export { FromToCircle };


