import type { ButtonHTMLAttributes } from "react";

type RoundButtonProps = {
  color: string;
  handleClick: () => void;
  selected: boolean;
  disabled?: boolean;
  title?: string;
};

export const RoundButton = ({
  color,
  handleClick,
  selected,
  disabled,
  title,
  ...props
}: RoundButtonProps & ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    type="button"
    className={`w-8 h-8 rounded-full inline-block m-1 transition-all disabled:cursor-not-allowed disabled:opacity-30 ${
      selected ? "ring-2 ring-gray-500 ring-offset-1" : ""
    }`}
    style={{ backgroundColor: color }}
    onClick={handleClick}
    disabled={disabled}
    title={title}
    {...props}
  />
);
