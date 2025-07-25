/* eslint-disable eqeqeq */
import { useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getOpeningsForEcoCode } from "../datasource/getOpeningsForEcoCode.js";
import p5 from "p5";
import getColorForValue from "./colorGradient.js";
import { FILES, RANKS } from "../common/consts.js";
import {Chess} from 'chess.js'

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

const FromToCircleImpl = ({ fromTos }) => {
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

                if (!fromTos) return;
                p.translate(p.width / 2, p.height / 2);
                p.push()
                fromTos.forEach((move) => {
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
    }, [fromTos]);

    return (
        <div
            id="renderRef"
            ref={renderRef}
            style={{ marginLeft: "-120px" }}
        ></div>
    );
};

const FromToCircle = ({ cat, code }) => {
    const {isPending, isError, error, data} = useQuery( {
        queryFn: async() => getOpeningsForEcoCode(code),
        queryKey: ['getOpeningsForEcoCode', code],
        enabled: code != null
    })

    if (isError) {
        console.error(error);
        return <span>{error.toString()}</span>;
    }
    if (isPending && code)
        return (
            <div>
                <span className="white">Loading...</span>
            </div>
        );

    if (data) {
        const chess = new Chess()
        const fromTos = new Set()

        data.forEach( ({moves}) => {
            chess.loadPgn(moves)
            const history = chess.history({verbose:true})
            history.forEach(({from, to}) => {
                fromTos.add([from, to])
            })

        })

        return <FromToCircleImpl {...{fromTos}} />;
    }
};

export { FromToCircle };


