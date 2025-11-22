import "../stylesheets/buttons.css";
import { CSSProperties, MouseEvent } from "react";

interface BaseButtonProps {
  bgcolor: string;
  text: string;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  style?: CSSProperties;
  disabled?: boolean;
}

const BaseButton = ({
  bgcolor,
  text,
  onClick,
  style,
  disabled,
}: BaseButtonProps) => (
  <button
    className="button-3"
    style={{ backgroundColor: bgcolor, ...style }}
    onClick={onClick}
    disabled={disabled}
  >
    {text}
  </button>
);

interface ExitButtonProps {
  text?: string;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  style?: CSSProperties;
}

const ExitButton = ({ text = "Return", onClick, style }: ExitButtonProps) =>
  BaseButton({ bgcolor: "red", text, onClick, style });

interface ActionButtonProps {
  text: string;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  style?: CSSProperties;
  disabled?: boolean;
}

const ActionButton = (props: ActionButtonProps) =>
  BaseButton({ bgcolor: "#3d8050", ...props });

export { BaseButton as default, ExitButton, ActionButton };
