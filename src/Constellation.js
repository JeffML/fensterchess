import { useQuery, gql } from "@apollo/client";
import { useRef, useEffect, useMemo, useState } from "react";
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

const RF_DEGREES = 22.5;

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

    let paths = useMemo(() => [], []);

    const { error, data } = useQuery(GET_OPENING_PATHS, {
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

const HeatMapType = ({ type, setType }) => {
    return (
        <div className="row" id="heatmaptype">
            <label>
                2D
                <input
                    type="radio"
                    name="type"
                    defaultChecked={type === "2D"}
                    onClick={() => setType("2D")}
                />
            </label>
            <br />
            <label>
                3D
                <input
                    type="radio"
                    name="type"
                    defaultChecked={type === "3D"}
                    onClick={() => setType("3D")}
                />
            </label>
        </div>
    );
};

// see "3d grid" @ https://editor.p5js.org/otsohavanto/sketches/OHPamV3P2
const HeatMap3D = ({ dests }) => {
    const root = "a".charCodeAt(0);

    const freqs = useMemo(() => [], []);

    Object.keys(dests)
        .reverse()
        .forEach((d) => {
            const coord =
                (d.charCodeAt(0) - root) * 10 + (Number.parseInt(d[1]) - 1);
            freqs[coord] = dests[d];
        });

    const renderRef = useRef();

    useEffect(() => {
        let N = 8; // dimensions (8x8)
        let remove;

        function calcHeight(file, rank) {
            const h = freqs[file * 10 + rank] ?? 1;
            return h * 10;
        }

        new p5((p) => {
            remove = p.remove;
            let rotX = 45;
            let rotY = 0;
            let sliderZ;
            const width = 600;
            const height = 400;
            let font;

            p.preload = () => {
                font = p.loadFont("resources/Cinzel-Medium.ttf");
            };

            p.setup = () => {
                p.createCanvas(width, height, p.WEBGL).parent(
                    renderRef.current
                );
                p.noStroke();
                p.ortho(
                    -width,
                    width,
                    -height,
                    height / 2,
                    -width * 4,
                    width * 4
                );
                sliderZ = p.createSlider(-20, -10, 45);
                p.angleMode(p.DEGREES);
                p.textFont(font);
            };

            p.draw = () => {
                p.background(200);

                p.textSize(20);
                p.textAlign(p.RIGHT, p.TOP);
                p.textStyle(p.BOLD);

                /*light and shading*/
                let locX = -height * 0.2;
                let locY = -width / 1.5;

                p.ambientLight(60, 60, 60);
                p.pointLight(255, 255, 255, locX, locY, 100);
                /**/

                let rotZ = sliderZ.value();

                const boxUnit = height / 10;

                p.rotateX(rotX);
                p.rotateY(rotY);
                p.rotateZ(rotZ);
                p.scale(1.5);

                let color = (rank, file) => {
                    if (rank % 2) {
                        // odd
                        return file % 2 ? "dimgray" : "white";
                    }
                    return file % 2 ? "white" : "dimgray";
                };

                for (let rank = 0; rank < N; rank++) {
                    for (let file = 0; file < N; file++) {
                        // x = width, y = length, z = height
                        let x = -height / 2 + boxUnit + file * boxUnit;
                        let y = -height / 2 + boxUnit + rank * boxUnit;
                        let z = calcHeight(file, rank);
                        p.fill(color(rank, file));
                        p.push();

                        p.translate(x, -y, z / 2 - height / 3);
                        p.box(30, 30, z);
                        p.pop();

                        // p.translate(x, -y, z / 2 - height / 3);

                        if (file === 0) {
                            p.push();
                            p.translate(x, -y, -calcHeight(0,0)*14);
                            p.fill("black");
                            p.text(rank + 1, -22, -22);
                            p.pop()
                        }
                        if (rank === 0) {
                            p.push();
                            p.textAlign(p.RIGHT, p.BOTTOM);
                            p.translate(x, -y, -calcHeight(0,0)*12);
                            p.fill("black");
                            p.text(String.fromCharCode(root + file), 4, 52);
                            p.pop()
                        }
                    }
                }
            };

            p.mouseDragged = () => {
                rotY += p.movedX;
                rotX += -p.movedY;
                console.log(rotX, rotY);
            };
        });

        return remove;
    }, [freqs, root]);

    return <div ref={renderRef} className="row"></div>;
};

const HeatMaps = ({ dests, cat, code }) => {
    const [type, setType] = useState();

    return (
        <div className="double-column left">
            <HeatMapType {...{ type, setType }} />
            <br />
            {type === "3D" && <HeatMap3D {...{ dests, cat, code }} />}
        </div>
    );
};

const DestinationFrequenciesByEco = ({ cat, code }) => {
    if (code === "all") code = undefined
    
    const { error, data, loading } = useQuery(GET_DEST_FREQ, {
        variables: { cat, code },
        skip: !cat,
    });

    if (error) console.error(error.toString());
    if (loading) return <div className="double-column left">Loading...</div>;
    if (data) {
        // scrub the data
        const dests = data.getDestinationSquareByFrequency.reduce((acc, d) => {
            const dest = d.key[2].substr(-2);
            acc[dest] = d.value;
            return acc;
        }, {});

        // const fakeDests = {"b4": 5, "g6": 3}
        // return <HeatMaps {...{ dests: fakeDests, cat, code }} />;
        return <HeatMaps {...{ dests, cat, code }} />;
    }
    return null;
};

export { Constellation as default, DestinationFrequenciesByEco };
