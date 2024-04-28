import { useRef, useEffect, useMemo } from "react";
import p5 from "p5";

// see "3d grid" @ https://editor.p5js.org/otsohavanto/sketches/OHPamV3P2
export const HeatMap3D = ({ dests }) => {
    const root = "a".charCodeAt(0);

    const freqs = useMemo(() => [], []);

    Object.keys(dests)
        .reverse()
        .forEach((d) => {
            const coord = (d.charCodeAt(0) - root) * 10 + (Number.parseInt(d[1]) - 1);
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
            // let sliderZ;
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
                // sliderZ = p.createSlider(-20, -10, 45);
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
                let rotZ = -10 //sliderZ.value();

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
                            p.translate(x, -y, -calcHeight(0, 0) * 14);
                            p.fill("black");
                            p.text(rank + 1, -22, -22);
                            p.pop();
                        }
                        if (rank === 0) {
                            p.push();
                            p.textAlign(p.RIGHT, p.BOTTOM);
                            p.translate(x, -y, -calcHeight(0, 0) * 12);
                            p.fill("black");
                            p.text(String.fromCharCode(root + file), 4, 52);
                            p.pop();
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

    return <div id="renderRef" ref={renderRef} style={{marginBottom: "3em"}}></div>;
};
