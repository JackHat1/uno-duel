const icons = {
  profile: (
    <>
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5.5 19c.65-3.2 3.1-5 6.5-5s5.85 1.8 6.5 5" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="3.6" />
      <path d="M12 2.4v2M12 19.6v2M4.45 4.45l1.42 1.42M18.13 18.13l1.42 1.42M2.4 12h2M19.6 12h2M4.45 19.55l1.42-1.42M18.13 5.87l1.42-1.42" />
    </>
  ),
  moon: <path d="M19.2 15.2A7.8 7.8 0 0 1 8.8 4.8a7.8 7.8 0 1 0 10.4 10.4Z" />,
  music: (
    <>
      <path d="M9 18V6.8l9-2.2v10.8" />
      <path d="M9 10.2 18 8" />
      <circle cx="6.6" cy="18" r="2.4" />
      <circle cx="15.6" cy="15.4" r="2.4" />
    </>
  ),
  volume: (
    <>
      <path d="M4 10v4h3l4 3V7l-4 3H4Z" />
      <path d="M14.5 9.2a4.2 4.2 0 0 1 0 5.6M17 7a7 7 0 0 1 0 10" />
    </>
  ),
  mute: (
    <>
      <path d="M4 10v4h3l4 3V7l-4 3H4Z" />
      <path d="m15 10 5 5M20 10l-5 5" />
    </>
  ),
  close: <path d="m6 6 12 12M18 6 6 18" />,
  chat: (
    <>
      <path d="M5 5.5h14v10H10l-4.5 3v-3H5V5.5Z" />
      <path d="M8.5 10h.01M12 10h.01M15.5 10h.01" strokeWidth="2.7" />
    </>
  ),
  edit: (
    <>
      <path d="m5 17.5.7-3.4L15.8 4l3.2 3.2L8.9 17.3 5 17.5Z" />
      <path d="m13.8 6 3.2 3.2" />
    </>
  ),
  copy: (
    <>
      <rect x="8" y="8" width="10" height="11" rx="2" />
      <path d="M6 16H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </>
  ),
  share: (
    <>
      <circle cx="18" cy="5" r="2.2" />
      <circle cx="6" cy="12" r="2.2" />
      <circle cx="18" cy="19" r="2.2" />
      <path d="m8 11 8-5M8 13l8 5" />
    </>
  ),
  arrow: <path d="m9 5 7 7-7 7" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.8v2.1M12 19.1v2.1M4.35 4.35l1.5 1.5M18.15 18.15l1.5 1.5M2.8 12h2.1M19.1 12h2.1M4.35 19.65l1.5-1.5M18.15 5.85l1.5-1.5" />
    </>
  ),
  exit: (
    <>
      <path d="M10 5H5.8A1.8 1.8 0 0 0 4 6.8v10.4A1.8 1.8 0 0 0 5.8 19H10" />
      <path d="M13 8l4 4-4 4M17 12H8" />
    </>
  ),
}

export default function AppIcon({ name, size = 20, className = '' }) {
  return (
    <svg
      className={`app-icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[name] || icons.profile}
    </svg>
  )
}
