import { useQuery } from "@apollo/client";
import { useRef, useEffect, useMemo } from "react";
import p5 from "p5";
import { GET_OPENING_PATHS, calcPaths } from "./MostActive.js";

export const BallOfMud = ({ fen, type }) => {
    const renderRef = useRef();
    const p55 = useRef();

    const scale = 5;

    let paths = useMemo(() => [], []);

    const { error, data } = useQuery(GET_OPENING_PATHS, {
        variables: { type, fen },
        skip: fen === "start",
    });

    if (error) console.error(error.toString());
    if (data) {
        const {
            getOpeningPaths: {
                at_path: { coords: at }, from_paths, to_paths,
            },
        } = data;
        const from = from_paths.map((p) => p.coords);
        const to = to_paths.map((p) => p.coords);
        paths = calcPaths({ at, from, to, radius: 10 });
    }

    useEffect(() => {
        let remove;
        new p5((p) => {
            remove = p.remove;
            p55.current = p;
            p.setup = () => {
                p.createCanvas(600, 400, p.WEBGL).parent(renderRef.current);
            };
            p.draw = () => {
                p.background(220);
                p.scale(scale);
                p.push();

                p.rotateZ(p.frameCount * 0.01);
                p.rotateX(p.frameCount * 0.01);
                p.rotateY(p.frameCount * 0.01);

                p.point(0, 0, 0);

                if (paths.length) {
                    for (let pathSet of paths) {
                        let lastv = p.createVector(...pathSet[0]);

                        for (let path of pathSet.slice(1)) {
                            let v2 = p5.Vector.add(lastv, path);
                            p.line(lastv.x, lastv.y, lastv.z, v2.x, v2.y, v2.z);
                            lastv = v2;
                        }
                    }
                }
                p.pop();
            };
        });
        return remove;
    }, [paths]);

    return <div ref={renderRef} className="double-column left"></div>;
};

export default BallOfMud