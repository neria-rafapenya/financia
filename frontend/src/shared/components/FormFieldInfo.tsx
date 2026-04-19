interface FormFieldInfoProps {
  text: string;
}

export function FormFieldInfo({ text }: Readonly<FormFieldInfoProps>) {
  return (
    <span
      className="field-info-hint"
      tabIndex={0}
      aria-label={text}
      title={text}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="8" cy="8" r="7" stroke="currentColor" />
        <path
          d="M8 7.1V11"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="8" cy="4.6" r="0.9" fill="currentColor" />
      </svg>
      <span className="field-info-hint__tooltip" role="tooltip">
        {text}
      </span>
    </span>
  );
}
