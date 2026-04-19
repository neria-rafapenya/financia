interface DocumentRepositoryLinkIconProps {
  width?: number | string;
  height?: number | string;
  color?: string;
}

export function DocumentRepositoryLinkIcon({
  width = 39,
  height = 29,
  color = "currentColor",
}: Readonly<DocumentRepositoryLinkIconProps>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 39 29"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M38.667 14.5L24.167 29L20.7832 25.4961L29.3623 16.917H0V12.083H29.3623L20.7832 3.50391L24.167 0L38.667 14.5Z"
        fill={color}
      />
    </svg>
  );
}
