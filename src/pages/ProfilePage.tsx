import { useEffect, useState, type ReactNode } from 'react';
import { apiClient } from '../api/client';
import type { ReferralStatsResponse } from '../api/contracts';
import { raceConfig, raceOrder } from '../config/gameConfig';
import { Header } from '../shared/Header';
import { useT } from '../shared/i18n';
import { useGameStore } from '../store/gameStore';
import type { AppLanguage, AvatarMode } from '../types';

type ProfilePanel = 'partners' | 'settings' | 'help' | 'legal' | 'feedback';

const feedbackFormUrl = import.meta.env.VITE_FEEDBACK_FORM_URL ?? 'https://t.me/DotaGiftBot';

export function ProfilePage() {
  const player = useGameStore((state) => state.player);
  const trophies = useGameStore((state) => state.trophies);
  const accessToken = useGameStore((state) => state.accessToken);
  const isSyncing = useGameStore((state) => state.isSyncing);
  const selectedAvatarRace = useGameStore((state) => state.selectedAvatarRace);
  const setSelectedAvatarRace = useGameStore((state) => state.setSelectedAvatarRace);
  const setAvatarMode = useGameStore((state) => state.setAvatarMode);
  const updateDisplayName = useGameStore((state) => state.updateDisplayName);
  const resetDisplayName = useGameStore((state) => state.resetDisplayName);
  const language = useGameStore((state) => state.language);
  const setLanguage = useGameStore((state) => state.setLanguage);
  const avatarRace = raceConfig[selectedAvatarRace] ?? raceConfig.orcs;
  const [activePanel, setActivePanel] = useState<ProfilePanel | null>(null);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [draftDisplayName, setDraftDisplayName] = useState(player.username);
  const [referralStats, setReferralStats] = useState<ReferralStatsResponse | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const activeReferralCount = referralStats?.activeInvitedCount ?? player.activeInvitedCount;
  const referralProgress = Math.min(100, (activeReferralCount / 10) * 100);
  const referralLink = referralStats?.referralLink ?? `https://t.me/DotaGiftBot?startapp=${encodeURIComponent(player.referralCode)}`;
  const t = useT();

  useEffect(() => {
    if (!isNameModalOpen) setDraftDisplayName(player.username);
  }, [isNameModalOpen, player.username]);

  useEffect(() => {
    if (!accessToken || activePanel !== 'partners') return;
    let isCancelled = false;

    apiClient
      .getReferralStats(accessToken)
      .then((stats) => {
        if (!isCancelled) setReferralStats(stats);
      })
      .catch(() => {
        if (!isCancelled) setReferralStats(null);
      });

    return () => {
      isCancelled = true;
    };
  }, [accessToken, activePanel]);

  const copyReferralLink = () => {
    void navigator.clipboard.writeText(referralLink).then(() => {
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 1400);
    });
  };

  const renderPanel = () => {
    if (activePanel === 'partners') {
      return (
        <PartnersPanel
          referralLink={referralLink}
          isCopied={isCopied}
          referralStats={referralStats}
          activeReferralCount={activeReferralCount}
          referralProgress={referralProgress}
          onCopy={copyReferralLink}
        />
      );
    }

    if (activePanel === 'settings') {
      return (
        <SettingsPanel
          language={language}
          avatarMode={player.avatarMode}
          avatarUrl={player.avatarUrl}
          isSyncing={isSyncing}
          onLanguageChange={setLanguage}
          onAvatarModeChange={setAvatarMode}
          onOpenNameModal={() => setIsNameModalOpen(true)}
          onResetName={() => void resetDisplayName()}
        />
      );
    }

    if (activePanel === 'help') return <HelpSection />;
    if (activePanel === 'legal') return <LegalSection />;
    if (activePanel === 'feedback') return <FeedbackSection />;
    return null;
  };

  return (
    <>
      <Header />
      <section className="grid gap-3">
        <div className="rounded-lg border border-white/10 bg-white/[0.05] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {player.avatarMode === 'telegram' && player.avatarUrl ? (
                <img src={player.avatarUrl} alt="" className="size-14 shrink-0 rounded-full border border-white/15 object-cover" />
              ) : (
                <div
                  className={`game-label grid size-14 shrink-0 place-items-center rounded-full border text-lg text-white shadow-glow ${avatarRace.ring}`}
                  style={{ background: `linear-gradient(135deg, ${avatarRace.accent} 0%, #111827 100%)` }}
                >
                  {avatarRace.imageUrl}
                </div>
              )}
              <div className="min-w-0">
                <h2 className="profile-player-name truncate text-zinc-50">{player.username}</h2>
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
          <ProfileNavRow title={t('partners')} hint={t('activeReferrals', { count: activeReferralCount })} tone="green" onClick={() => setActivePanel('partners')} />
          <ProfileNavRow title={t('settings')} hint={language === 'en' ? t('english') : t('russian')} tone="cyan" onClick={() => setActivePanel('settings')} />
          <ProfileNavRow title={t('help')} hint={t('gameRules')} tone="green" onClick={() => setActivePanel('help')} />
          <ProfileNavRow title={t('feedback')} hint={t('feedbackHint')} tone="cyan" onClick={() => setActivePanel('feedback')} />
          <ProfileNavRow title={t('legal')} hint={t('policies')} tone="amber" onClick={() => setActivePanel('legal')} />
        </div>
      </section>

      {activePanel ? (
        <ProfileSubPage title={t(activePanel)} onClose={() => setActivePanel(null)}>
          {renderPanel()}
        </ProfileSubPage>
      ) : null}

      {isNameModalOpen ? (
        <NameEditModal
          value={draftDisplayName}
          isSaving={isSyncing}
          onChange={setDraftDisplayName}
          onClose={() => setIsNameModalOpen(false)}
          onSave={() => {
            void updateDisplayName(draftDisplayName).then(() => setIsNameModalOpen(false));
          }}
        />
      ) : null}
    </>
  );
}

function PartnersPanel({
  referralLink,
  isCopied,
  referralStats,
  activeReferralCount,
  referralProgress,
  onCopy,
}: {
  referralLink: string;
  isCopied: boolean;
  referralStats: ReferralStatsResponse | null;
  activeReferralCount: number;
  referralProgress: number;
  onCopy: () => void;
}) {
  const t = useT();

  return (
    <div className="grid gap-3">
      <div className="rounded-md border border-white/10 bg-black/20 p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="game-caption text-xs text-zinc-400">{t('referralLink')}</p>
          <button type="button" onClick={onCopy} className="game-label rounded-md border border-emerald-200/25 bg-emerald-300/10 px-3 py-1.5 text-xs text-emerald-100">
            {isCopied ? t('copied') : t('copy')}
          </button>
        </div>
        <p className="game-number break-all text-sm text-emerald-100">{referralLink}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <PartnerRateCard title={t('level1Share')} value="5%" caption={t('directReferrals')} />
        <PartnerRateCard title={t('level2Share')} value="2%" caption={t('theirReferrals')} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          [t('xpToday'), referralStats?.xpToday ?? 0],
          [t('totalRefXp'), referralStats?.totalReferralXp ?? 0],
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
          <span>{activeReferralCount}/10</span>
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
          {(referralStats?.directReferrals ?? []).map((referral) => (
            <ReferralRow key={referral.name} referral={referral} />
          ))}
          {referralStats && referralStats.directReferrals.length === 0 ? (
            <p className="game-caption border-t border-white/8 px-2 py-3 text-center text-xs text-zinc-500">{t('noDirectReferrals')}</p>
          ) : null}
        </div>
      </div>

      <p className="game-caption text-xs leading-5 text-zinc-500">{t('referralNote')}</p>
    </div>
  );
}

function SettingsPanel({
  language,
  avatarMode,
  avatarUrl,
  isSyncing,
  onLanguageChange,
  onAvatarModeChange,
  onOpenNameModal,
  onResetName,
}: {
  language: AppLanguage;
  avatarMode: AvatarMode;
  avatarUrl?: string;
  isSyncing: boolean;
  onLanguageChange: (language: AppLanguage) => void;
  onAvatarModeChange: (mode: AvatarMode) => void;
  onOpenNameModal: () => void;
  onResetName: () => void;
}) {
  const t = useT();
  const languageOptions: Array<{ id: AppLanguage; label: string }> = [
    { id: 'en', label: t('english') },
    { id: 'ru', label: t('russian') },
  ];
  const avatarOptions: Array<{ id: AvatarMode; label: string; caption: string; disabled?: boolean }> = [
    { id: 'caste', label: t('casteAvatar'), caption: t('casteAvatarText') },
    { id: 'telegram', label: t('telegramAvatar'), caption: avatarUrl ? t('telegramAvatarText') : t('telegramAvatarFallback') },
  ];

  return (
    <div className="grid gap-4">
      <SettingsGroup title={t('avatarSource')}>
        <div className="grid gap-2">
          {avatarOptions.map((option) => {
            const isSelected = option.id === avatarMode;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onAvatarModeChange(option.id)}
                className={`min-h-14 rounded-md border px-3 text-left transition active:scale-[0.99] ${
                  isSelected ? 'border-amber-200/45 bg-amber-300/16 text-amber-100' : 'border-white/10 bg-black/18 text-zinc-300'
                }`}
              >
                <span className="game-label block text-sm">{option.label}</span>
                <span className="game-caption mt-1 block text-xs text-zinc-500">{option.caption}</span>
              </button>
            );
          })}
        </div>
      </SettingsGroup>

      <SettingsGroup title={t('displayName')}>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={onOpenNameModal} className="game-label min-h-11 rounded-md border border-cyan-200/24 bg-cyan-300/10 text-sm text-cyan-100">
            {t('changeName')}
          </button>
          <button
            type="button"
            disabled={isSyncing}
            onClick={onResetName}
            className="game-label min-h-11 rounded-md border border-white/10 bg-white/[0.045] text-sm text-zinc-300 disabled:opacity-50"
          >
            {t('resetTelegramName')}
          </button>
        </div>
      </SettingsGroup>

      <SettingsGroup title={t('languagePreference')}>
        <div className="grid grid-cols-2 gap-2">
          {languageOptions.map((option) => {
            const isSelected = option.id === language;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onLanguageChange(option.id)}
                className={`game-label min-h-11 rounded-md border px-3 text-sm transition active:scale-[0.98] ${
                  isSelected ? 'border-amber-200/45 bg-amber-300/16 text-amber-100' : 'border-white/10 bg-black/18 text-zinc-300'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </SettingsGroup>

      <SettingsGroup title={t('linkedAccounts')}>
        <div className="grid gap-2">
          <AccountLinkRow title={t('emailAccount')} status={t('connectSoon')} />
          <AccountLinkRow title={t('telegramAccount')} status={t('connected')} />
          <AccountLinkRow title={t('steamAccount')} status={t('connectSoon')} />
        </div>
      </SettingsGroup>
    </div>
  );
}

function FeedbackSection() {
  const t = useT();

  return (
    <div className="rounded-lg border border-cyan-200/18 bg-cyan-300/[0.055] p-4">
      <p className="game-label text-cyan-50">{t('feedbackTitle')}</p>
      <p className="game-caption mt-2 text-sm leading-5 text-zinc-300">{t('feedbackText')}</p>
      <a
        href={feedbackFormUrl}
        target="_blank"
        rel="noreferrer"
        className="game-label mt-4 grid min-h-11 place-items-center rounded-md bg-amber-300 text-sm text-zinc-950"
      >
        {t('openFeedbackForm')}
      </a>
    </div>
  );
}

function NameEditModal({
  value,
  isSaving,
  onChange,
  onClose,
  onSave,
}: {
  value: string;
  isSaving: boolean;
  onChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const normalizedValue = value.trim();
  const t = useT();

  return (
    <div className="fixed inset-0 z-[95] grid place-items-center bg-black/65 px-4 backdrop-blur-sm" onPointerDown={onClose}>
      <form
        className="w-full max-w-[360px] rounded-lg border border-cyan-200/20 bg-[#121923] p-4 shadow-2xl shadow-black/45"
        onPointerDown={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          if (normalizedValue) onSave();
        }}
      >
        <h3 className="game-title text-lg text-cyan-50">{t('changeName')}</h3>
        <p className="game-caption mt-1 text-xs text-zinc-400">{t('nameShownInfo')}</p>
        <input
          autoFocus
          value={value}
          onChange={(event) => onChange(event.target.value)}
          maxLength={32}
          className="game-label mt-4 min-h-12 w-full rounded-md border border-cyan-200/25 bg-black/25 px-3 text-base text-zinc-50 outline-none focus:border-cyan-100/60"
        />
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={onClose} className="game-label min-h-11 rounded-md border border-white/10 bg-white/[0.045] text-sm text-zinc-300">
            {t('cancel')}
          </button>
          <button
            type="submit"
            disabled={isSaving || !normalizedValue}
            className="game-label min-h-11 rounded-md bg-amber-300 text-sm text-zinc-950 disabled:bg-zinc-700 disabled:text-zinc-400"
          >
            {t('save')}
          </button>
        </div>
      </form>
    </div>
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

function ReferralRow({ referral }: { referral: { name: string; status: 'active' | 'pending'; xpToday: number; totalXp: number } }) {
  const isActive = referral.status === 'active';

  return (
    <div className="grid grid-cols-[1fr_72px_72px] gap-2 border-t border-white/8 px-2 py-2">
      <div className="min-w-0">
        <p className="game-label truncate text-sm">{referral.name}</p>
        <p className={`game-caption text-xs ${isActive ? 'text-emerald-200' : 'text-zinc-500'}`}>{isActive ? 'Active' : 'Pending'}</p>
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
    </div>
  );
}

function HelpSection() {
  const [openHelp, setOpenHelp] = useState<string | null>(null);
  const t = useT();
  const helpItems = [
    { title: t('helpGameBoard'), body: t('helpGameBoardText') },
    { title: t('helpCards'), body: t('helpCardsText') },
    { title: t('helpMerge'), body: t('helpMergeText') },
    { title: t('helpTrophies'), body: t('helpTrophiesText') },
    { title: t('helpEnergy'), body: t('helpEnergyText') },
    { title: t('helpXp'), body: t('helpXpText') },
    { title: t('helpArena'), body: t('helpArenaText') },
    { title: t('helpCollection'), body: t('helpCollectionText') },
    { title: t('helpPartners'), body: t('helpPartnersText') },
    { title: t('helpLegal'), body: t('helpLegalText') },
  ];

  return (
    <div className="grid gap-2">
      {helpItems.map((item) => {
        const isOpen = openHelp === item.title;

        return (
          <HelpBlock key={item.title} title={item.title} isOpen={isOpen} onToggle={() => setOpenHelp((current) => (current === item.title ? null : item.title))}>
            {item.body}
          </HelpBlock>
        );
      })}
    </div>
  );
}

function ProfileSubPage({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[85] mx-auto flex w-full max-w-[600px] flex-col bg-[#0d121b] shadow-2xl shadow-black/50">
      <header className="flex min-h-14 items-center justify-between border-b border-white/10 bg-white/[0.035] px-4">
        <h2 className="game-title text-lg text-zinc-50">{title}</h2>
        <button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-md text-zinc-300 active:bg-white/[0.06]" aria-label="Close">
          <CloseIcon />
        </button>
      </header>
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">{children}</div>
    </div>
  );
}

function ProfileNavRow({ title, hint, tone, onClick }: { title: string; hint: string; tone: 'green' | 'cyan' | 'amber'; onClick: () => void }) {
  const toneMap = {
    green: 'hover:border-emerald-300/24 hover:bg-emerald-300/[0.045] active:bg-emerald-300/[0.065] text-emerald-100',
    cyan: 'hover:border-cyan-200/24 hover:bg-cyan-300/[0.04] active:bg-cyan-300/[0.06] text-cyan-100',
    amber: 'border-amber-200/18 bg-amber-300/[0.045] text-amber-100',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.045] px-3 text-left transition ${toneMap[tone]}`}
    >
      <span className="min-w-0">
        <span className="game-label block">{title}</span>
        <span className="game-caption block truncate text-xs text-zinc-500">{hint}</span>
      </span>
      <ChevronIcon />
    </button>
  );
}

function SettingsGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
      <h3 className="game-label mb-3 text-sm text-zinc-100">{title}</h3>
      {children}
    </section>
  );
}

function AccountLinkRow({ title, status }: { title: string; status: string }) {
  return (
    <div className="flex min-h-11 items-center justify-between rounded-md border border-white/10 bg-black/16 px-3">
      <span className="game-label text-sm text-zinc-200">{title}</span>
      <span className="game-caption text-xs text-zinc-500">{status}</span>
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
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4 text-amber-100" aria-hidden="true">
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10v3a5 5 0 0 1-10 0V4Z" />
      <path d="M7 6H4a3 3 0 0 0 3 3" />
      <path d="M17 6h3a3 3 0 0 1-3 3" />
    </svg>
  );
}

function ChevronIcon({ isOpen = false, className = 'text-zinc-400' }: { isOpen?: boolean; className?: string }) {
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

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5" aria-hidden="true">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
