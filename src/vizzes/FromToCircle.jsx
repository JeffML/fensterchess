/* eslint-disable eqeqeq */
import { useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getOpeningsForEcoCode } from "../datasource/getOpeningsForEcoCode";
import getColorForValue from "./colorGradient.js";
import { FILES, RANKS } from "../common/consts";
import { ChessPGN } from "@chess-pgn/chess-pgn";

const TWO_PI = Math.PI * 2;
const RADIUS = 250;
const STEP = TWO_PI / 64;

const squareColors = FILES.map((file, fileNo) =>
  RANKS.map((rank) => {
    const squareInt = 8 * fileNo + rank;
    return { file, rank, color: getColorForValue((squareInt - 8) / 65) };
  }),
).flat();

const moveCoords = squareColors.map(({ file, rank, color }, i) => {
  const angle = STEP * i;
  const x = RADIUS * Math.sin(angle);
  const y = RADIUS * Math.cos(angle);
  const lx = (RADIUS - 10) * Math.sin(angle);
  const ly = (RADIUS - 10) * Math.cos(angle);
  return { file, rank, color, x, y, lx, ly };
});

const toRgb = (color) => {
  const [r, g, b] = color.map((c) => Math.round(c * 255));
  return `rgb(${r},${g},${b})`;
};

const FromToCircleImpl = ({ fromTos }) => {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !fromTos) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 600,
      H = 600;
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(W / 2, H / 2);

    // Draw bezier curves for each from→to move
    ctx.lineWidth = 1;
    fromTos.forEach((move) => {
      const fromCoord = moveCoords.find(
        ({ file, rank }) => move[0][0] === file && move[0][1] == rank,
      );
      const toCoord = moveCoords.find(
        ({ file, rank }) => move[1][0] === file && move[1][1] == rank,
      );
      if (!fromCoord || !toCoord) return;

      ctx.strokeStyle = toRgb(fromCoord.color);
      ctx.beginPath();
      ctx.moveTo(fromCoord.lx, fromCoord.ly);
      ctx.bezierCurveTo(
        fromCoord.lx / 2,
        fromCoord.ly / 2,
        toCoord.lx / 2,
        toCoord.ly / 2,
        toCoord.lx,
        toCoord.ly,
      );
      ctx.stroke();
    });

    // Draw square dots with labels
    ctx.font = "12px Georgia";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    moveCoords.forEach(({ x, y, file, rank, color }) => {
      const rgb = toRgb(color);
      ctx.strokeStyle = rgb;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, TWO_PI);
      ctx.stroke();
      ctx.fillStyle = rgb;
      ctx.fillText(`${file}${rank}`, x, y);
    });

    ctx.restore();
  }, [fromTos]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={600}
      style={{ marginLeft: "-120px" }}
    />
  );
};

const FromToCircle = ({ cat, code }) => {
  const { isPending, isError, error, data } = useQuery({
    queryFn: async () => getOpeningsForEcoCode(code),
    queryKey: ["getOpeningsForEcoCode", code],
    enabled: code != null,
  });

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
    const chess = new ChessPGN();
    const fromTos = new Set();

    data.forEach(({ moves }) => {
      chess.loadPgn(moves);
      const history = chess.history({ verbose: true });
      history.forEach(({ from, to }) => {
        fromTos.add([from, to]);
      });
    });

    return <FromToCircleImpl {...{ fromTos }} />;
  }
};

export { FromToCircle };
