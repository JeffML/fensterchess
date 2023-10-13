import { ReactP5Wrapper } from "@p5-wrapper/react";
import { useQuery, gql } from "@apollo/client";

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
    const sketch = (p5, paths) => {
        let scale = 5.0;

        p5.setup = () => {
            p5.createCanvas(600, 400, p5.WEBGL);
        };

        p5.draw = () => {
            p5.background(220);
            p5.scale(scale);
            p5.point(0, 0, 0);

            p5.push();


            p5.rotateZ(p5.frameCount * 0.01);
            p5.rotateX(p5.frameCount * 0.01);
            p5.rotateY(p5.frameCount * 0.01);


            for (let pathSet of paths) {
                let lastv = p5.createVector(...pathSet[0]);

                for (let p of pathSet.slice(1)) {
                    let v2 = p5.constructor.Vector.add(lastv, p);
                    p5.line(lastv.x, lastv.y, lastv.z, v2.x, v2.y, v2.z);
                    lastv = v2;
                }
            }

            p5.pop();
        };
    };

    // FIXME: HARDWIRED
    fen = "rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b KQkq - 0 2";
    type = "pathBySquare";

    const { error, data, loading } = useQuery(GET_OPENING_PATHS, {
        variables: { type, fen },
        skip: fen === "start",
    });

    if (loading) console.log("loading");
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
        const paths = calcPaths({ at, from, to, radius: 10 });

        return <ReactP5Wrapper {...{ sketch: (p5) => sketch(p5, paths) }} />;
    }
};

export default Constellation;
