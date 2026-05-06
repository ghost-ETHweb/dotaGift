import type { TabId } from '../types';
import { useGameStore } from '../store/gameStore';
import { useT, type TranslationKey } from './i18n';

const tabs: Array<{ id: TabId; labelKey: TranslationKey }> = [
  { id: 'game', labelKey: 'navGame' },
  { id: 'progress', labelKey: 'navProgress' },
  { id: 'arena', labelKey: 'navArena' },
  { id: 'collection', labelKey: 'navCollection' },
  { id: 'profile', labelKey: 'navProfile' },
];

export function BottomNav() {
  const activeTab = useGameStore((state) => state.activeTab);
  const setActiveTab = useGameStore((state) => state.setActiveTab);
  const t = useT();

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[560px] border-t border-cyan-200/15 bg-[#0b2433]/95 px-2 pt-2 shadow-[0_-10px_34px_rgba(34,211,238,0.12)] backdrop-blur-xl">
      <div className="grid grid-cols-5 gap-1">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          const label = t(tab.labelKey);
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`game-caption flex min-h-14 flex-col items-center justify-center rounded-md text-[11px] transition ${
                active
                  ? 'border border-cyan-100/20 bg-cyan-200/16 text-cyan-50 shadow-[0_0_18px_rgba(103,232,249,0.16)]'
                  : 'text-cyan-100/58 active:bg-cyan-100/8'
              }`}
              aria-label={label}
            >
              <TabIcon id={tab.id} active={active} />
              <span className="mt-1 truncate">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function TabIcon({ id, active }: { id: TabId; active: boolean }) {
  const className = `size-5 ${active ? 'drop-shadow-[0_0_8px_rgba(103,232,249,0.45)]' : ''}`;
  const props = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    'aria-hidden': true,
  };

  if (id === 'game') {
    return (
      <svg {...props}>
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="M8 8h3v3H8z" />
        <path d="M13 8h3v3h-3z" />
        <path d="M8 13h3v3H8z" />
        <path d="M13 13h3v3h-3z" />
      </svg>
    );
  }

  if (id === 'progress') {
    return (
      <svg {...props}>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="m7 15 4-4 3 3 5-7" />
        <path d="M16 7h3v3" />
      </svg>
    );
  }

  if (id === 'arena') {
    return (
      <svg {...props}>
        <rect x="4" y="5" width="16" height="14" rx="2" />
        <path d="M8 10h8" />
        <path d="M8 14h5" />
        <path d="M16 14h1" />
      </svg>
    );
  }

  if (id === 'collection') {
    return (
      <svg {...props}>
        <path d="M8 21h8" />
        <path d="M12 17v4" />
        <path d="M7 4h10v3a5 5 0 0 1-10 0V4Z" />
        <path d="M7 6H4a3 3 0 0 0 3 3" />
        <path d="M17 6h3a3 3 0 0 1-3 3" />
      </svg>
    );
  }

  return (
    <svg {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}
