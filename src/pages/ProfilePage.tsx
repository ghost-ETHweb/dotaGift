import { useState, type ReactNode } from 'react';
import { raceConfig, raceOrder } from '../config/gameConfig';
import { Header } from '../shared/Header';
import { useT } from '../shared/i18n';
import { useGameStore } from '../store/gameStore';
import type { AppLanguage } from '../types';

type ProfilePanel = 'partners' | 'settings' | 'help' | 'legal';

export function ProfilePage() {
  const player = useGameStore((state) => state.player);
  const energy = useGameStore((state) => state.energy);
  const trophies = useGameStore((state) => state.trophies);
  const selectedAvatarRace = useGameStore((state) => state.selectedAvatarRace);
  const setSelectedAvatarRace = useGameStore((state) => state.setSelectedAvatarRace);
  const language = useGameStore((state) => state.language);
  const setLanguage = useGameStore((state) => state.setLanguage);
  const avatarRace = raceConfig[selectedAvatarRace];
  const [openPanel, setOpenPanel] = useState<ProfilePanel | null>('settings');
  const referralProgress = Math.min(100, (player.activeInvitedCount / 10) * 100);
  const referralLink = `https://t.me/DotaGiftBot?startapp=${encodeURIComponent(player.referralCode)}`;
  const t = useT();
  const languageOptions: Array<{ id: AppLanguage; label: string }> = [
    { id: 'en', label: t('english') },
    { id: 'ru', label: t('russian') },
  ];
  const togglePanel = (panel: ProfilePanel) => setOpenPanel((current) => (current === panel ? null : panel));
  const directReferrals = [
    { name: 'Alex', status: 'Active', xpToday: 320, totalXp: 3800 },
    { name: 'Dima', status: 'Pending', xpToday: 0, totalXp: 0 },
    { name: 'Sam', status: 'Active', xpToday: 120, totalXp: 1420 },
    { name: 'Mira', status: 'Active', xpToday: 300, totalXp: 7260 },
  ];

  return (
    <>
      <Header />
      <section className="grid gap-3">
        <div className="rounded-lg border border-white/10 bg-white/[0.05] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={`game-label grid size-14 shrink-0 place-items-center rounded-full border text-lg text-white shadow-glow ${avatarRace.ring}`}
                style={{
                  background: `linear-gradient(135deg, ${avatarRace.accent} 0%, #111827 100%)`,
                }}
              >
                {avatarRace.imageUrl}
              </div>
              <div className="min-w-0">
                <h2 className="profile-player-name text-zinc-50">{player.username}</h2>
                <p className="game-caption text-sm text-zinc-400">
                  {t('avatar')}: {avatarRace.label}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 rounded-full border border-amber-200/20 bg-gradient-to-r from-amber-300/[0.14] to-white/[0.035] px-3 py-2">
              <span className="grid size-8 place-items-center rounded-full bg-amber-300/16 text-amber-100">
                <TrophyIcon />
              </span>
              <span className="text-left">
                <span className="game-number block text-xl leading-none text-amber-50 drop-shadow-[0_0_8px_rgba(252,211,77,0.18)]">{trophies.length}</span>
                <span className="game-label block text-[11px] leading-none text-amber-100/80">{t('trophies')}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.045] p-3">
          <h3 className="game-label text-sm">{t('chooseAvatarCaste')}</h3>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {raceOrder.map((race) => {
              const config = raceConfig[race];
              const isSelected = race === selectedAvatarRace;

              return (
                <button
                  key={race}
                  type="button"
                  onClick={() => setSelectedAvatarRace(race)}
                  className={`min-h-16 rounded-md border p-2 text-center transition active:scale-[0.98] ${
                    isSelected ? `${config.ring} bg-white/[0.08] shadow-[0_0_18px_rgba(255,255,255,0.12)]` : 'border-white/10 bg-black/18'
                  }`}
                >
                  <span
                    className={`game-label mx-auto grid size-8 place-items-center rounded-full border text-xs ${config.ring}`}
                    style={{ background: `linear-gradient(135deg, ${config.accent} 0%, #111827 100%)` }}
                  >
                    {config.imageUrl}
                  </span>
                  <span className="game-caption mt-1 block truncate text-[10px] text-zinc-300">{config.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-2">
          <AccordionRow title={t('partners')} hint={t('activeReferrals', { count: player.activeInvitedCount })} tone="green" isOpen={openPanel === 'partners'} onToggle={() => togglePanel('partners')}>
            <div className="grid gap-3">
              <div className="rounded-md border border-white/10 bg-black/20 p-3">
                <p className="game-caption text-xs text-zinc-400">{t('referralLink')}</p>
                <p className="game-number mt-2 break-all text-sm text-emerald-100">{referralLink}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <PartnerRateCard title={t('level1Share')} value="5%" caption={t('directReferrals')} />
                <PartnerRateCard title={t('level2Share')} value="2%" caption={t('theirReferrals')} />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  [t('xpToday'), '+740'],
                  [t('totalRefXp'), '12 480'],
                  [t('dailyCap'), '1 500'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md border border-white/10 bg-white/[0.045] p-2">
                    <p className="game-caption text-[11px] text-zinc-500">{label}</p>
                    <p className="game-number text-lg">{value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-md border border-cyan-200/15 bg-cyan-300/[0.045] p-3">
                <p className="game-label text-sm text-cyan-100">{t('activeReferralRules')}</p>
                <div className="game-caption mt-2 grid gap-1 text-xs text-zinc-400">
                  <p>{t('cardsCreated3')}</p>
                  <p>{t('mergeCompleted1')}</p>
                  <p>{t('level2Reached')}</p>
                </div>
              </div>

              <div>
                <div className="game-caption mb-2 flex justify-between text-xs text-zinc-400">
                  <span>{t('nextBonus')}</span>
                  <span>{player.activeInvitedCount}/10</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-emerald-300" style={{ width: `${referralProgress}%` }} />
                </div>
              </div>

              <div className="rounded-md border border-white/10 bg-white/[0.035] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="game-label text-sm">{t('level1Referrals')}</p>
                  <span className="game-caption text-xs text-zinc-500">{t('directOnly')}</span>
                </div>
                <div className="overflow-hidden rounded-md border border-white/8">
                  <div className="grid grid-cols-[1fr_72px_72px] gap-2 bg-white/[0.045] px-2 py-2 text-left">
                    <span className="game-caption text-[11px] text-zinc-500">{t('user')}</span>
                    <span className="game-caption text-right text-[11px] text-zinc-500">{t('today')}</span>
                    <span className="game-caption text-right text-[11px] text-zinc-500">{t('total')}</span>
                  </div>
                  {directReferrals.map((referral) => (
                    <ReferralRow key={referral.name} referral={referral} />
                  ))}
                </div>
              </div>

              <p className="game-caption text-xs leading-5 text-zinc-500">
                {t('referralNote')}
              </p>
            </div>
          </AccordionRow>

          <AccordionRow title={t('settings')} hint={language === 'en' ? t('english') : t('russian')} tone="cyan" isOpen={openPanel === 'settings'} onToggle={() => togglePanel('settings')}>
            <p className="game-caption mb-3 text-xs text-zinc-400">{t('languagePreference')}</p>
            <div className="grid grid-cols-2 gap-2">
              {languageOptions.map((option) => {
                const isSelected = option.id === language;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setLanguage(option.id)}
                    className={`game-label min-h-11 rounded-md border px-3 text-sm transition active:scale-[0.98] ${
                      isSelected ? 'border-amber-200/45 bg-amber-300/16 text-amber-100 shadow-[0_0_18px_rgba(252,211,77,0.12)]' : 'border-white/10 bg-black/18 text-zinc-300'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </AccordionRow>

          <AccordionRow title={t('help')} hint={t('gameRules')} tone="green" isOpen={openPanel === 'help'} onToggle={() => togglePanel('help')}>
            <HelpSection />
          </AccordionRow>

          <AccordionRow title={t('legal')} hint={t('policies')} tone="amber" isOpen={openPanel === 'legal'} onToggle={() => togglePanel('legal')}>
            <LegalSection />
          </AccordionRow>
        </div>
      </section>
    </>
  );
}

function PartnerRateCard({ title, value, caption }: { title: string; value: string; caption: string }) {
  return (
    <div className="rounded-md border border-amber-200/20 bg-amber-300/[0.075] p-3">
      <p className="game-caption text-xs text-amber-100/75">{title}</p>
      <p className="game-number mt-1 text-2xl text-amber-100">{value}</p>
      <p className="game-caption mt-1 text-xs text-zinc-500">{caption}</p>
    </div>
  );
}

function ReferralRow({ referral }: { referral: { name: string; status: string; xpToday: number; totalXp: number } }) {
  const isActive = referral.status === 'Active';

  return (
    <div className="grid grid-cols-[1fr_72px_72px] gap-2 border-t border-white/8 px-2 py-2">
      <div className="min-w-0">
        <p className="game-label truncate text-sm">{referral.name}</p>
        <p className={`game-caption text-xs ${isActive ? 'text-emerald-200' : 'text-zinc-500'}`}>{referral.status}</p>
      </div>
      <span className="game-number self-center text-right text-xs text-cyan-100">+{referral.xpToday}</span>
      <span className="game-number self-center text-right text-xs text-zinc-300">{referral.totalXp}</span>
    </div>
  );
}

function LegalSection() {
  const t = useT();

  return (
    <div className="grid gap-3">
      <LegalBlock title={t('privacyPolicy')}>
        <p>{t('privacy1')}</p>
        <p>{t('privacy2')}</p>
        <p>{t('privacy3')}</p>
        <p>{t('privacy4')}</p>
      </LegalBlock>

      <LegalBlock title={t('predictionsNotice')}>
        <p>{t('predictions1')}</p>
        <p>{t('predictions2')}</p>
      </LegalBlock>

      <LegalBlock title={t('digitalCollectibles')}>
        <p>{t('digital1')}</p>
        <p>{t('digital2')}</p>
      </LegalBlock>

      <LegalBlock title={t('playerCards')}>
        <p>{t('playerCards1')}</p>
        <p>{t('playerCards2')}</p>
      </LegalBlock>

      <LegalBlock title={t('ipDisclaimer')}>
        <p>{t('ip1')}</p>
        <p>{t('ip2')}</p>
      </LegalBlock>

      <p className="game-caption text-xs leading-5 text-zinc-500">{t('legalDraft')}</p>
    </div>
  );
}

function HelpSection() {
  const [openHelp, setOpenHelp] = useState<string | null>(null);
  const t = useT();
  const helpItems = [
    {
      title: t('helpGameBoard'),
      body: t('helpGameBoardText'),
    },
    {
      title: t('helpCards'),
      body: t('helpCardsText'),
    },
    {
      title: t('helpMerge'),
      body: t('helpMergeText'),
    },
    {
      title: t('helpTrophies'),
      body: t('helpTrophiesText'),
    },
    {
      title: t('helpEnergy'),
      body: t('helpEnergyText'),
    },
    {
      title: t('helpXp'),
      body: t('helpXpText'),
    },
    {
      title: t('helpArena'),
      body: t('helpArenaText'),
    },
    {
      title: t('helpCollection'),
      body: t('helpCollectionText'),
    },
    {
      title: t('helpPartners'),
      body: t('helpPartnersText'),
    },
    {
      title: t('helpLegal'),
      body: t('helpLegalText'),
    },
  ];

  return (
    <div className="grid gap-2">
      {helpItems.map((item) => {
        const isOpen = openHelp === item.title;

        return (
          <HelpBlock
            key={item.title}
            title={item.title}
            isOpen={isOpen}
            onToggle={() => setOpenHelp((current) => (current === item.title ? null : item.title))}
          >
            {item.body}
          </HelpBlock>
        );
      })}
    </div>
  );
}

function HelpBlock({ title, isOpen, onToggle, children }: { title: string; isOpen: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <div className={`overflow-hidden rounded-md border transition ${isOpen ? 'border-emerald-300/30 bg-emerald-300/[0.065]' : 'border-emerald-300/15 bg-emerald-300/[0.035]'}`}>
      <button type="button" onClick={onToggle} className="flex min-h-11 w-full items-center justify-between gap-3 px-3 text-left active:bg-white/[0.04]">
        <span className="game-label text-sm text-emerald-100">{title}</span>
        <ChevronIcon isOpen={isOpen} />
      </button>
      {isOpen ? <p className="game-caption border-t border-white/8 px-3 py-3 text-xs leading-5 text-zinc-400">{children}</p> : null}
    </div>
  );
}

function LegalBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.035] p-3">
      <p className="game-label text-sm text-zinc-100">{title}</p>
      <div className="game-caption mt-2 grid gap-2 text-xs leading-5 text-zinc-400">{children}</div>
    </div>
  );
}

function TrophyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4 text-amber-100"
      aria-hidden="true"
    >
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10v3a5 5 0 0 1-10 0V4Z" />
      <path d="M7 6H4a3 3 0 0 0 3 3" />
      <path d="M17 6h3a3 3 0 0 1-3 3" />
    </svg>
  );
}

function AccordionRow({
  title,
  hint,
  tone = 'default',
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  hint: string;
  tone?: 'default' | 'green' | 'cyan' | 'amber';
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const toneMap = {
    default: {
      open: 'border-white/18 bg-white/[0.055]',
      closed: 'border-white/10 bg-white/[0.045]',
      title: 'text-zinc-100',
      icon: 'text-zinc-400',
    },
    green: {
      open: 'border-emerald-300/35 bg-emerald-300/[0.075] shadow-[0_0_18px_rgba(52,211,153,0.1)]',
      closed: 'border-white/10 bg-white/[0.045] hover:border-emerald-300/24 hover:bg-emerald-300/[0.045] active:bg-emerald-300/[0.065]',
      title: 'text-emerald-100',
      icon: 'text-emerald-200',
    },
    cyan: {
      open: 'border-cyan-200/32 bg-cyan-300/[0.07] shadow-[0_0_18px_rgba(34,211,238,0.1)]',
      closed: 'border-white/10 bg-white/[0.045] hover:border-cyan-200/24 hover:bg-cyan-300/[0.04] active:bg-cyan-300/[0.06]',
      title: 'text-cyan-100',
      icon: 'text-cyan-100',
    },
    amber: {
      open: 'border-amber-200/35 bg-amber-300/[0.08] shadow-[0_0_18px_rgba(252,211,77,0.1)]',
      closed: 'border-amber-200/18 bg-amber-300/[0.045] shadow-[0_0_14px_rgba(252,211,77,0.06)]',
      title: 'text-amber-100',
      icon: 'text-amber-100',
    },
  };
  const currentTone = toneMap[tone];
  const toneClass = isOpen ? currentTone.open : currentTone.closed;

  return (
    <div className={`overflow-hidden rounded-md border transition ${toneClass}`}>
      <button type="button" onClick={onToggle} className="flex min-h-12 w-full items-center justify-between gap-3 px-3 text-left active:bg-white/[0.04]">
        <span className="min-w-0">
          <span className={`game-label block ${currentTone.title}`}>{title}</span>
          <span className="game-caption block truncate text-xs text-zinc-500">{hint}</span>
        </span>
        <ChevronIcon isOpen={isOpen} className={currentTone.icon} />
      </button>
      {isOpen ? <div className="border-t border-white/8 px-3 py-3">{children}</div> : null}
    </div>
  );
}

function ChevronIcon({ isOpen, className = 'text-zinc-400' }: { isOpen: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`size-5 shrink-0 transition-transform ${className} ${isOpen ? 'rotate-90' : ''}`}
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
