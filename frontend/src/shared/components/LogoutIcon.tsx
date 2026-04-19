interface LogoutIconProps {
  width?: number | string;
  height?: number | string;
  color?: string;
}

export function LogoutIcon({
  width = 20,
  height = 20,
  color = "currentColor",
}: Readonly<LogoutIconProps>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 72 72"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M72 0V72H0V48H8V64H64V8H8V24H0V0H72ZM54 36L34 56L28.3604 50.3604L38.6797 40H0V32H38.6797L28.3604 21.6396L34 16L54 36Z"
        fill={color}
      />
    </svg>
  );
}
