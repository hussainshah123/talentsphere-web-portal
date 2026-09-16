/**
 * One stroke-based 24x24 icon set shared with the mobile app, so both clients
 * look like the same product. No icon-font dependency.
 */
const paths = {
  home: ['M3 10.5 12 3l9 7.5', 'M5.5 9.5V20h13V9.5', 'M9.5 20v-5.5h5V20'],
  discover: ['M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z', 'M16.2 16.2 21 21'],
  messages: ['M4 5h16v11H9l-5 4Z', 'M8 9.5h8', 'M8 12.5h5'],
  profile: ['M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z', 'M4 21c0-3.9 3.6-6.5 8-6.5s8 2.6 8 6.5'],
  dashboard: ['M4 4h7v6H4Z', 'M13 4h7v4h-7Z', 'M13 11h7v9h-7Z', 'M4 13h7v7H4Z'],
  talent: [
    'M9 3.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z',
    'M2.5 20.5c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5',
    'M17 8.5 18.6 10l3-3',
  ],
  jobs: ['M4 8h16v12H4Z', 'M9 8V5.5h6V8', 'M4 13h16'],
  company: ['M4 20V6l7-3v17', 'M11 10h9v10', 'M14.5 13.5h2', 'M14.5 16.5h2'],
  search: ['M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z', 'M16.2 16.2 21 21'],
  filter: ['M3.5 6h17', 'M6.5 12h11', 'M10 18h4'],
  notification: ['M12 3a6 6 0 0 0-6 6c0 4-1.5 5.5-1.5 5.5h15S18 13 18 9a6 6 0 0 0-6-6Z', 'M10 18a2 2 0 0 0 4 0'],
  settings: [
    'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
    'M19.1 13.9a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.3a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-2.8-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7h-.3a2 2 0 1 1 0-4h.2a1.6 1.6 0 0 0 1.1-2.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 2.7-1.1V3a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 2.8 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.3a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.4 1Z',
  ],
  upload: ['M12 16V4', 'M7.5 8.5 12 4l4.5 4.5', 'M4 16v3.5h16V16'],
  cv: ['M6 3h9l4 4v14H6Z', 'M15 3v4h4', 'M9 12h6', 'M9 15.5h6', 'M9 19h3'],
  ats: ['M4 19V5', 'M4 19h16', 'M8 16V11', 'M12 16V7.5', 'M16 16v-3'],
  verification: ['M12 3 5 6v6c0 4.3 3 7.5 7 9 4-1.5 7-4.7 7-9V6Z', 'M9 12l2.2 2.2L15.5 10'],
  shield: ['M12 3 5 6v6c0 4.3 3 7.5 7 9 4-1.5 7-4.7 7-9V6Z'],
  check: ['M5 12.5 10 17.5 19 7'],
  close: ['M6 6l12 12', 'M18 6 6 18'],
  back: ['M15 5 8 12l7 7'],
  forward: ['M9 5l7 7-7 7'],
  lock: ['M6 11h12v9H6Z', 'M8.5 11V8a3.5 3.5 0 0 1 7 0v3'],
  eye: [
    'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z',
    'M12 9.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6Z',
  ],
  portfolio: ['M3.5 7.5h17V20h-17Z', 'M9 7.5V5h6v2.5', 'M3.5 12.5h17'],
  experience: ['M12 3.5 14.6 9l6 .9-4.3 4.2 1 6-5.3-2.8L6.7 20l1-6L3.4 9.9 9.4 9Z'],
  education: ['M12 4 2.5 9 12 14l9.5-5Z', 'M6.5 11.3V16c0 1.5 2.5 3 5.5 3s5.5-1.5 5.5-3v-4.7'],
  skills: ['M6 20V9', 'M12 20V4', 'M18 20v-7'],
  location: ['M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z', 'M12 7.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z'],
  clock: ['M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z', 'M12 8v4.4l3 1.8'],
  salary: [
    'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z',
    'M14.5 9.5c-.6-.7-1.5-1-2.5-1-1.7 0-2.6.8-2.6 1.8 0 2.6 5.2 1.2 5.2 3.8 0 1.1-1 1.9-2.6 1.9-1.1 0-2-.4-2.6-1.1',
    'M12 7v10',
  ],
  sparkle: [
    'M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6Z',
    'M18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8Z',
  ],
  bookmark: ['M6.5 4h11v16l-5.5-4-5.5 4Z'],
  send: ['M4.5 12 20 4.5 15 20l-3.5-5.5Z', 'M11.5 14.5 20 4.5'],
  plus: ['M12 5v14', 'M5 12h14'],
  refresh: ['M20 11a8 8 0 1 0-1.3 5.5', 'M20 5v6h-6'],
  warning: ['M12 4 2.8 20h18.4Z', 'M12 10v4.5', 'M12 17.5h.01'],
  info: ['M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z', 'M12 11v5', 'M12 8h.01'],
  logout: ['M9.5 20H5V4h4.5', 'M14 16.5 18.5 12 14 7.5', 'M18.5 12H9.5'],
  building: ['M5 21V4h9v17', 'M14 10h5v11', 'M8 8h3', 'M8 12h3', 'M8 16h3'],
  chart: ['M4 19V5', 'M4 19h16', 'M7.5 15.5 11 11l3 2.5 4-6.5'],
  users: [
    'M9 4.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z',
    'M2.5 20c0-3.2 2.9-5.5 6.5-5.5s6.5 2.3 6.5 5.5',
    'M16.5 5.2a3.3 3.3 0 0 1 0 6.3',
    'M18 14.8c2.1.6 3.5 2.1 3.5 4.2',
  ],
  flag: ['M5.5 21V4', 'M5.5 5h11l-1.6 3.5L16.5 12h-11'],
  sun: [
    'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
    'M12 2.5v2',
    'M12 19.5v2',
    'M2.5 12h2',
    'M19.5 12h2',
    'M5.2 5.2l1.4 1.4',
    'M17.4 17.4l1.4 1.4',
    'M18.8 5.2l-1.4 1.4',
    'M6.6 17.4l-1.4 1.4',
  ],
  moon: ['M20 14.2A8.5 8.5 0 0 1 9.8 4 8.5 8.5 0 1 0 20 14.2Z'],
  applications: ['M6 3h9l4 4v14H6Z', 'M15 3v4h4', 'M9 12h7', 'M9 16h5'],
  list: ['M8 6h13', 'M8 12h13', 'M8 18h13', 'M3.5 6h.01', 'M3.5 12h.01', 'M3.5 18h.01'],
  audit: ['M6 3h9l4 4v14H6Z', 'M15 3v4h4', 'M9 13l2 2 4-4'],
  rules: ['M4 6h16', 'M4 12h10', 'M4 18h13', 'M18 10.5l1.6 1.6L22.5 9'],
} as const;

export type IconName = keyof typeof paths;

export function AppIcon({
  name,
  size = 20,
  strokeWidth = 1.8,
  className,
  title,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {paths[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
