import { useQuery, gql } from "@apollo/client";
import { useRef, useEffect } from "react";
import p5 from "p5";

const GET_OPENING_PATHS = gql`
    query getPaths($type: String!, $fen: String!) {
        getOpeningPaths(type: $type, fen: $fen) {
            name
            score
            at_path {
                fen
                coords
            }
            from_paths {
                fen
                coords
            }
            to_paths {
                fen
                coords
            }
        }
    }
`;

const GET_DEST_FREQ = gql`
    query getDestFreq($cat: String!, $code: String) {
        getDestinationSquareByFrequency(cat: $cat, code: $code) {
            key
            value
        }
    }
`;

const RF_DEGREES = 22.5; // 180/8

const getXYZ = ([radius, rank, file]) => {
    const fDeg = file * RF_DEGREES;
    const rDeg = rank * RF_DEGREES;

    const x = radius * Math.sin(fDeg) * Math.cos(rDeg);
    const y = radius * Math.sin(fDeg) * Math.sin(rDeg);
    const z = radius * Math.cos(fDeg);

    return [x, y, z];
};

const calcPath = ({ start, coords, radius }) => {
    const orig = getXYZ(start);
    const rest = coords.map((coord) => getXYZ([radius, ...coord]));

    return [orig, ...rest];
};

const calcPaths = ({ from, at, to, radius }) => {
    const fromPaths = from.map((coords) =>
        calcPath({ start: [0, 0, 0], coords, radius })
    );
    const toPaths = to.map((coords) =>
        calcPath({ start: at.at(-1), coords, radius })
    );
    return [...fromPaths, ...toPaths];
};

const Constellation = ({ fen, type }) => {
    const renderRef = useRef();
    const p55 = useRef();

    const scale = 5.0;

    let paths = [];

    const { error, data, loading } = useQuery(GET_OPENING_PATHS, {
        variables: { type, fen },
        skip: fen === "start",
    });

    if (error) console.error(error.toString());
    if (data) {
        const {
            getOpeningPaths: {
                at_path: { coords: at },
                from_paths,
                to_paths,
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

// see https://editor.p5js.org/claesjohnson/sketches/Z9cIPNZ0z
const HeatMap3D = ({dests}) => {

   const root = 'a'.charCodeAt(0)
    const freqs = []  // sparse array
    
    Object.keys(dests).forEach(d => {
        const coord = ((d.charCodeAt(0) - root) * 10) + (Number.parseInt(d[1]) - 1)
        freqs[coord] = dests[d]
    })


    const renderRef = useRef();

    useEffect(() => {
        let N = 8;             // dimensions (8x8)
        let file = 0;
        let rank = 0;
        
        function calcHeight(file, rank) {
            const h = freqs[file*10 + rank]?? 0
            return h + 1;
        }

        new p5((p) => {
            p.setup = () => {
                p.createCanvas(600, 400, p.WEBGL).parent(renderRef.current);
            };
            p.draw = () => {
                if (file === N) {
                    file = 0;
                    rank++;
                }
                if (rank < N) {
                    p.translate(20 * file - 100, 20 * rank - 100);
                    p.rotateX(-1);
                    p.rotateZ(0.1);
                    p.box(20, calcHeight(file, rank)*10, 20);
                    p.rotateX(1);
                    p.rotateZ(-0.1);
                    p.translate(-20 * file + 100, -20 * rank + 100);
                }

                file++;
            };
        });
    }, [freqs]);

    return <div ref={renderRef} className="double-column left"></div>;
};


const DestinationFrequenciesByEco = () => {
    const cat = "D";
    const code = "14";
    const { error, data } = useQuery(GET_DEST_FREQ, {
        variables: { cat, code },
        skip: !cat,
    });

    if (error) console.error(error.toString());
    if (data) {
        console.dir(data);
        // scrub the data
        const dests = data.getDestinationSquareByFrequency.reduce((acc, d) => {
            const dest = d.key[2].substr(-2);
            acc[dest] = d.value;
            return acc;
        }, {});

        // dests: { "a6": 1, "b4": 1, "b5": 1, "d3": 6, "d6": 6, "f4": 6, ..., "b3": 1, "c1": 2, "f1": 2, "f8": 2, "c8": 1 }
        return <HeatMap3D {...{dests}}/>
    }
    return null;
};

export { Constellation as default, HeatMap3D, DestinationFrequenciesByEco };
