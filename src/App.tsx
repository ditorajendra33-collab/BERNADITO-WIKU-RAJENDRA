import { useEffect, useState } from 'react';
import { BarChart3, Building2, Camera, Lock, ShieldCheck } from 'lucide-react';
import { DashboardView } from './components/DashboardView';
import { HseEvaluatorView } from './components/HseEvaluatorView';
import {
  AddAreaModal,
  ChangeHsePinModal,
  LightboxModal,
  ReportDetailModal,
  SimpleMasterModal,
  SpilDirectoryModal,
} from './components/Modals';
import { SenderView } from './components/SenderView';
import { SpilLogo } from './components/SpilLogo';
import {
  DEFAULT_AREAS,
  DEFAULT_BRANCHES,
  DEFAULT_DIVISIONS,
  DEFAULT_HSE_PIN,
  DEFAULT_HSE_TEAM,
  DEFAULT_SENDERS,
  STORAGE_KEYS,
  generateDemoRecords,
  normalizeReportPhotos,
  scoreToPercent,
} from './constants/fiveR';
import type { AreaItem, FiveRPhotos, FiveRReport, FiveRScores, TabKey } from './types/fiveR';

function loadListFromStorage<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fallback to default
  }
  localStorage.setItem(key, JSON.stringify(fallback));
  return [...fallback];
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('sender');

  const [branches, setBranches] = useState<string[]>(() =>
    loadListFromStorage(STORAGE_KEYS.BRANCHES, DEFAULT_BRANCHES),
  );
  const [divisions, setDivisions] = useState<string[]>(() =>
    loadListFromStorage(STORAGE_KEYS.DIVISIONS, DEFAULT_DIVISIONS),
  );
  const [senders, setSenders] = useState<string[]>(() =>
    loadListFromStorage(STORAGE_KEYS.SENDERS, DEFAULT_SENDERS),
  );
  const [hseTeam, setHseTeam] = useState<string[]>(() =>
    loadListFromStorage(STORAGE_KEYS.HSE_TEAM, DEFAULT_HSE_TEAM),
  );
  const [areas, setAreas] = useState<AreaItem[]>(() =>
    loadListFromStorage(STORAGE_KEYS.AREAS, DEFAULT_AREAS),
  );
  const [records, setRecords] = useState<FiveRReport[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.RECORDS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map((item: FiveRReport) => ({
            ...item,
            photos: normalizeReportPhotos(item?.photos),
          }));
        }
      }
    } catch {
      // fallback
    }
    const demo = generateDemoRecords();
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(demo));
    return demo;
  });

  const [selectedBranch, setSelectedBranch] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LAST_BRANCH);
    return saved && branches.includes(saved) ? saved : branches[0] || '';
  });
  const [selectedSender, setSelectedSender] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LAST_SENDER);
    return saved && senders.includes(saved) ? saved : senders[0] || '';
  });
  const [lastHseEvaluator, setLastHseEvaluator] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.LAST_HSE) || hseTeam[0] || '';
  });
  const [hsePin, setHsePin] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.HSE_PIN) || DEFAULT_HSE_PIN;
  });
  const [isHseUnlocked, setIsHseUnlocked] = useState<boolean>(false);

  const [selectedAreaCode, setSelectedAreaCode] = useState<string | null>(null);
  const [activeGradingId, setActiveGradingId] = useState<string | null>(null);

  // Modal states
  const [isAddBranchOpen, setIsAddBranchOpen] = useState(false);
  const [isAddDivisionOpen, setIsAddDivisionOpen] = useState(false);
  const [isAddSenderOpen, setIsAddSenderOpen] = useState(false);
  const [isAddHseOpen, setIsAddHseOpen] = useState(false);
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);
  const [isAddAreaOpen, setIsAddAreaOpen] = useState(false);
  const [presetAreaDivision, setPresetAreaDivision] = useState('');
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);
  const [detailReportId, setDetailReportId] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ title: string; src: string | null }>({
    title: '',
    src: null,
  });

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMsg) return;
    const timer = window.setTimeout(() => setToastMsg(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toastMsg]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
  };

  const pendingCount = records.filter((r) => r.status === 'pending').length;

  const switchTab = (tab: TabKey) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Persist helpers
  const updateBranches = (next: string[]) => {
    setBranches(next);
    localStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(next));
  };
  const updateDivisions = (next: string[]) => {
    setDivisions(next);
    localStorage.setItem(STORAGE_KEYS.DIVISIONS, JSON.stringify(next));
  };
  const updateSenders = (next: string[]) => {
    setSenders(next);
    localStorage.setItem(STORAGE_KEYS.SENDERS, JSON.stringify(next));
  };
  const updateHseTeam = (next: string[]) => {
    setHseTeam(next);
    localStorage.setItem(STORAGE_KEYS.HSE_TEAM, JSON.stringify(next));
  };
  const updateAreas = (next: AreaItem[]) => {
    setAreas(next);
    localStorage.setItem(STORAGE_KEYS.AREAS, JSON.stringify(next));
  };

  // Master Add / Delete Handlers
  const handleAddBranch = (name: string): boolean => {
    if (branches.some((b) => b.toLowerCase() === name.toLowerCase())) {
      showToast('Cabang / Kantor sudah terdaftar');
      return false;
    }
    const next = [...branches, name];
    updateBranches(next);
    setSelectedBranch(name);
    localStorage.setItem(STORAGE_KEYS.LAST_BRANCH, name);
    showToast(`Cabang "${name}" ditambahkan`);
    return true;
  };

  const handleDeleteBranch = (name: string) => {
    if (branches.length <= 1) {
      showToast('Minimal harus ada 1 cabang/kantor');
      return;
    }
    const next = branches.filter((b) => b !== name);
    updateBranches(next);
    if (selectedBranch === name) {
      setSelectedBranch(next[0]);
    }
  };

  const handleAddDivision = (name: string): boolean => {
    if (divisions.some((d) => d.toLowerCase() === name.toLowerCase())) {
      showToast('Divisi sudah terdaftar');
      return false;
    }
    updateDivisions([...divisions, name]);
    showToast(`Divisi "${name}" ditambahkan`);
    return true;
  };

  const handleDeleteDivision = (name: string) => {
    if (divisions.length <= 1) {
      showToast('Minimal harus ada 1 divisi');
      return;
    }
    updateDivisions(divisions.filter((d) => d !== name));
  };

  const handleAddSender = (name: string): boolean => {
    if (senders.some((s) => s.toLowerCase() === name.toLowerCase())) {
      showToast('Nama pengirim sudah terdaftar');
      return false;
    }
    updateSenders([...senders, name]);
    setSelectedSender(name);
    localStorage.setItem(STORAGE_KEYS.LAST_SENDER, name);
    showToast(`Pengirim "${name}" ditambahkan`);
    return true;
  };

  const handleDeleteSender = (name: string) => {
    updateSenders(senders.filter((s) => s !== name));
    if (selectedSender === name) {
      setSelectedSender('');
    }
  };

  const handleAddHse = (name: string): boolean => {
    if (hseTeam.some((h) => h.toLowerCase() === name.toLowerCase())) {
      showToast('Nama penilai HSE sudah terdaftar');
      return false;
    }
    updateHseTeam([...hseTeam, name]);
    setLastHseEvaluator(name);
    localStorage.setItem(STORAGE_KEYS.LAST_HSE, name);
    showToast(`Penilai HSE "${name}" ditambahkan`);
    return true;
  };

  const handleDeleteHse = (name: string) => {
    if (hseTeam.length <= 1) {
      showToast('Minimal harus ada 1 nama penilai Tim HSE');
      return;
    }
    const next = hseTeam.filter((h) => h !== name);
    updateHseTeam(next);
    if (lastHseEvaluator === name) {
      setLastHseEvaluator(next[0]);
      localStorage.setItem(STORAGE_KEYS.LAST_HSE, next[0]);
    }
  };

  // HSE Lock / Unlock / PIN Handlers
  const handleUnlockHse = (evaluatorName: string, pinInput: string): boolean => {
    if (pinInput.trim() !== hsePin) {
      return false;
    }
    setIsHseUnlocked(true);
    setLastHseEvaluator(evaluatorName);
    localStorage.setItem(STORAGE_KEYS.LAST_HSE, evaluatorName);
    showToast(`Akses Tim HSE terbuka untuk ${evaluatorName}`);
    return true;
  };

  const handleLockHse = () => {
    setIsHseUnlocked(false);
    setActiveGradingId(null);
    showToast('Akses penilai Tim HSE dikunci kembali');
  };

  const handleUpdateHsePin = (currentPin: string, newPin: string): boolean => {
    if (currentPin.trim() !== hsePin) {
      return false;
    }
    const cleaned = newPin.trim();
    setHsePin(cleaned);
    localStorage.setItem(STORAGE_KEYS.HSE_PIN, cleaned);
    showToast('PIN akses Tim HSE berhasil diperbarui');
    return true;
  };

  const handleAddArea = (area: AreaItem, goToSend: boolean): boolean => {
    if (areas.some((a) => a.code.toUpperCase() === area.code.toUpperCase())) {
      showToast(`Kode ${area.code} sudah terdaftar`);
      return false;
    }
    updateAreas([...areas, area]);
    showToast(`Area ${area.code} ditambahkan`);
    if (goToSend) {
      setSelectedAreaCode(area.code);
      switchTab('sender');
    }
    return true;
  };

  const handleDeleteArea = (code: string) => {
    if (areas.length <= 1) {
      showToast('Minimal harus ada 1 area inspeksi');
      return;
    }
    updateAreas(areas.filter((a) => a.code !== code));
    if (selectedAreaCode === code) {
      setSelectedAreaCode(null);
    }
    showToast('Area inspeksi dihapus');
  };

  // Report Submission (Menu 1 -> Menu 2)
  const handleSubmitReport = (payload: {
    branch: string;
    senderName: string;
    areaCode: string;
    customArea?: { name: string; dept: string };
    photos: FiveRPhotos;
    senderNotes: string;
  }): boolean => {
    let areaMeta = areas.find(
      (a) => a.code.toUpperCase() === payload.areaCode.toUpperCase(),
    );

    if (!areaMeta && payload.customArea) {
      areaMeta = {
        code: payload.areaCode.toUpperCase(),
        name: payload.customArea.name,
        dept: payload.customArea.dept,
        isCustomUser: true,
      };
      updateAreas([...areas, areaMeta]);
    }

    if (!senders.some((s) => s.toLowerCase() === payload.senderName.toLowerCase())) {
      updateSenders([...senders, payload.senderName]);
    }
    setSelectedSender(payload.senderName);
    setSelectedBranch(payload.branch);
    localStorage.setItem(STORAGE_KEYS.LAST_SENDER, payload.senderName);
    localStorage.setItem(STORAGE_KEYS.LAST_BRANCH, payload.branch);

    const newReport: FiveRReport = {
      id: 'SPIL-' + Date.now().toString().slice(-6),
      status: 'pending',
      timestamp: new Date().toISOString(),
      branch: payload.branch,
      areaCode: payload.areaCode.toUpperCase(),
      areaName: areaMeta ? areaMeta.name : payload.areaCode,
      dept: areaMeta ? areaMeta.dept : 'Operasional',
      senderName: payload.senderName,
      senderNotes: payload.senderNotes,
      photos: { ...payload.photos },
      scores: null,
      totalScore: null,
      avgScore: null,
      hseEvaluator: '',
      hseNotes: '',
      reviewedAt: null,
    };

    const nextRecords = [newReport, ...records];
    try {
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(nextRecords));
      setRecords(nextRecords);
    } catch {
      showToast('Penyimpanan browser penuh. Hapus beberapa riwayat lama terlebih dahulu.');
      return false;
    }

    setSelectedAreaCode(null);
    showToast('Foto 5R berhasil dikirim ke antrean Tim HSE');
    switchTab('hse');
    return true;
  };

  // HSE Grading Submission (Menu 2 -> Menu 3)
  const handleSaveGrading = (
    reportId: string,
    scores: FiveRScores,
    evaluator: string,
    hseNotes: string,
  ) => {
    if (!isHseUnlocked) {
      showToast('Buka kunci akses Tim HSE terlebih dahulu untuk menilai');
      return;
    }
    if (!hseTeam.some((h) => h.toLowerCase() === evaluator.toLowerCase())) {
      updateHseTeam([...hseTeam, evaluator]);
    }
    setLastHseEvaluator(evaluator);
    localStorage.setItem(STORAGE_KEYS.LAST_HSE, evaluator);

    const totalScore = Object.values(scores).reduce((sum, v) => sum + v, 0);
    const avgScore = Number((totalScore / 5).toFixed(1));

    const nextRecords = records.map((r) =>
      r.id === reportId
        ? {
            ...r,
            status: 'reviewed' as const,
            scores: { ...scores },
            totalScore,
            avgScore,
            hseEvaluator: evaluator,
            hseNotes,
            reviewedAt: new Date().toISOString(),
          }
        : r,
    );

    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(nextRecords));
    setRecords(nextRecords);
    setActiveGradingId(null);
    showToast(`Penilaian HSE tersimpan (${scoreToPercent(avgScore)}% · ${avgScore.toFixed(1)}/5.0)`);
  };

  const handleDeleteReport = (reportId: string) => {
    const next = records.filter((r) => r.id !== reportId);
    setRecords(next);
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(next));
    setDetailReportId(null);
    if (activeGradingId === reportId) {
      setActiveGradingId(null);
    }
    showToast('Laporan dihapus');
  };

  const handleResetDemo = () => {
    const demo = generateDemoRecords();
    updateBranches(DEFAULT_BRANCHES);
    updateDivisions(DEFAULT_DIVISIONS);
    updateSenders(DEFAULT_SENDERS);
    updateHseTeam(DEFAULT_HSE_TEAM);
    updateAreas(DEFAULT_AREAS);
    setRecords(demo);
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(demo));
    setSelectedBranch(DEFAULT_BRANCHES[0]);
    setSelectedSender(DEFAULT_SENDERS[0]);
    setLastHseEvaluator(DEFAULT_HSE_TEAM[0]);
    setSelectedAreaCode(null);
    setActiveGradingId(null);
    showToast('Data demo PT SPIL dipulihkan');
  };

  const handleSelectBranchFromDirectory = (branchName: string) => {
    if (!branches.includes(branchName)) {
      updateBranches([...branches, branchName]);
    }
    setSelectedBranch(branchName);
    localStorage.setItem(STORAGE_KEYS.LAST_BRANCH, branchName);
    showToast(`Cabang "${branchName}" dipilih`);
    switchTab('sender');
  };

  const detailReport = detailReportId
    ? records.find((r) => r.id === detailReportId) || null
    : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 md:pb-10">
      {/* TOP BAR (3-Zone Contract: Brand Wordmark — Nav Links — Primary Action) */}
      <header className="sticky top-0 z-30 bg-spilgreen-700 text-white border-b border-spilgreen-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4 lg:gap-8">
          {/* Zone 1: Brand */}
          <button
            type="button"
            onClick={() => switchTab('sender')}
            className="flex items-center gap-2.5 min-w-0 text-left"
          >
            <SpilLogo className="w-10 h-8 sm:w-11 sm:h-9 shrink-0" />
            <span className="font-extrabold text-white text-sm sm:text-base tracking-tight truncate">
              5R PT SPIL
            </span>
          </button>

          {/* Zone 2: Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-6 shrink-0">
            <button
              type="button"
              onClick={() => switchTab('sender')}
              className={`py-2 text-sm font-semibold whitespace-nowrap shrink-0 border-b-2 transition ${
                activeTab === 'sender'
                  ? 'text-white border-white'
                  : 'text-spilgreen-100 border-transparent hover:text-white'
              }`}
            >
              Pelaporan Cabang
            </button>
            <button
              type="button"
              onClick={() => switchTab('hse')}
              className={`py-2 text-sm font-semibold whitespace-nowrap shrink-0 border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'hse'
                  ? 'text-white border-white'
                  : 'text-spilgreen-100 border-transparent hover:text-white'
              }`}
            >
              {!isHseUnlocked && <Lock className="w-3.5 h-3.5 text-spilgreen-200 shrink-0" />}
              <span>Evaluasi HSE</span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-md bg-spilred-600 text-white text-[11px] font-bold leading-none tabular-nums">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => switchTab('dashboard')}
              className={`py-2 text-sm font-semibold whitespace-nowrap shrink-0 border-b-2 transition ${
                activeTab === 'dashboard'
                  ? 'text-white border-white'
                  : 'text-spilgreen-100 border-transparent hover:text-white'
              }`}
            >
              Dashboard
            </button>
          </nav>

          {/* Zone 3: Primary Action (Info Cabang SPIL) */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setIsDirectoryOpen(true)}
              className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-spilgreen-50 text-spilgreen-800 text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 transition"
            >
              <Building2 className="w-4 h-4 text-spilgreen-700 shrink-0" />
              <span>Info Cabang</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN WORKSPACE */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        {activeTab === 'sender' && (
          <SenderView
            branches={branches}
            divisions={divisions}
            senders={senders}
            areas={areas}
            selectedBranch={selectedBranch}
            selectedSender={selectedSender}
            selectedAreaCode={selectedAreaCode}
            onChangeBranch={(branch) => {
              setSelectedBranch(branch);
              localStorage.setItem(STORAGE_KEYS.LAST_BRANCH, branch);
            }}
            onChangeSender={(sender) => {
              setSelectedSender(sender);
              if (sender) {
                localStorage.setItem(STORAGE_KEYS.LAST_SENDER, sender);
              }
            }}
            onSelectArea={(code) => setSelectedAreaCode(code)}
            onClearSelectedArea={() => setSelectedAreaCode(null)}
            onOpenAddBranch={() => setIsAddBranchOpen(true)}
            onDeleteBranch={handleDeleteBranch}
            onOpenAddDivision={() => setIsAddDivisionOpen(true)}
            onOpenAddSender={() => setIsAddSenderOpen(true)}
            onOpenAddArea={(presetDiv) => {
              setPresetAreaDivision(presetDiv);
              setIsAddAreaOpen(true);
            }}
            onDeleteArea={handleDeleteArea}
            onOpenLightbox={(title, src) => setLightbox({ title, src })}
            onSubmitReport={handleSubmitReport}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'hse' && (
          <HseEvaluatorView
            records={records}
            branches={branches}
            hseTeam={hseTeam}
            lastHseEvaluator={lastHseEvaluator}
            activeGradingId={activeGradingId}
            isHseUnlocked={isHseUnlocked}
            onUnlockHse={handleUnlockHse}
            onLockHse={handleLockHse}
            onOpenChangePin={() => setIsChangePinOpen(true)}
            onGoToDashboard={() => switchTab('dashboard')}
            onChangeActiveHse={(name) => {
              setLastHseEvaluator(name);
              localStorage.setItem(STORAGE_KEYS.LAST_HSE, name);
              showToast(`Penilai HSE aktif: ${name}`);
            }}
            onOpenGrading={(id) => setActiveGradingId(id)}
            onCloseGrading={() => setActiveGradingId(null)}
            onOpenAddHse={() => setIsAddHseOpen(true)}
            onSaveGrading={handleSaveGrading}
            onOpenLightbox={(title, src) => setLightbox({ title, src })}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            records={records}
            branches={branches}
            areas={areas}
            hseTeam={hseTeam}
            isHseUnlocked={isHseUnlocked}
            onGoToSender={() => switchTab('sender')}
            onOpenDetail={(id) => setDetailReportId(id)}
            onOpenAddHse={() => setIsAddHseOpen(true)}
            onGoToHseLock={() => switchTab('hse')}
            onResetDemo={handleResetDemo}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200">
        <div className="grid grid-cols-3 h-14">
          <button
            type="button"
            onClick={() => switchTab('sender')}
            className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition ${
              activeTab === 'sender' ? 'text-spilgreen-700' : 'text-slate-500'
            }`}
          >
            <Camera className="w-5 h-5" />
            <span>Pelaporan</span>
          </button>

          <button
            type="button"
            onClick={() => switchTab('hse')}
            className={`relative flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition ${
              activeTab === 'hse' ? 'text-spilgreen-700' : 'text-slate-500'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Evaluasi HSE</span>
            {pendingCount > 0 && (
              <span className="absolute top-1 right-6 px-1.5 py-0.5 rounded-full bg-spilred-600 text-white text-[10px] font-bold leading-none tabular-nums">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => switchTab('dashboard')}
            className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition ${
              activeTab === 'dashboard' ? 'text-spilgreen-700' : 'text-slate-500'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span>Dashboard</span>
          </button>
        </div>
      </nav>

      {/* MODALS */}
      <SimpleMasterModal
        isOpen={isAddBranchOpen}
        title="Tambah Cabang / Kantor Mandiri"
        subtitle="Cabang/Kantor baru otomatis tersedia untuk pengirim & filter HSE."
        inputLabel="Nama Cabang / Kantor *"
        inputPlaceholder="Misal: Cabang Balikpapan / Kantor Jayapura"
        listTitle="Cabang / Kantor Terdaftar"
        items={branches}
        submitLabel="Simpan Cabang / Kantor"
        onClose={() => setIsAddBranchOpen(false)}
        onAdd={handleAddBranch}
        onDelete={handleDeleteBranch}
      />

      <SimpleMasterModal
        isOpen={isAddDivisionOpen}
        title="Tambah Divisi Mandiri"
        subtitle="Divisi baru otomatis tersedia di semua menu pilihan."
        inputLabel="Nama Divisi Baru *"
        inputPlaceholder="Misal: Operasional Reefer / IT & Digital"
        listTitle="Divisi Terdaftar"
        items={divisions}
        submitLabel="Simpan Divisi"
        onClose={() => setIsAddDivisionOpen(false)}
        onAdd={handleAddDivision}
        onDelete={handleDeleteDivision}
      />

      <SimpleMasterModal
        isOpen={isAddSenderOpen}
        title="Tambah Nama Pengirim"
        subtitle="Daftar PIC / pengirim foto dari cabang atau kantor."
        inputLabel="Nama Pengirim *"
        inputPlaceholder="Misal: Hendra Wijaya (PIC Surabaya)"
        listTitle="Daftar Pengirim Terdaftar"
        items={senders}
        submitLabel="Simpan Nama Pengirim"
        onClose={() => setIsAddSenderOpen(false)}
        onAdd={handleAddSender}
        onDelete={handleDeleteSender}
      />

      <SimpleMasterModal
        isOpen={isAddHseOpen}
        title="Tambah Nama Penilai Tim HSE"
        subtitle="Daftar penilai resmi dari Tim HSE PT SPIL."
        inputLabel="Nama Penilai HSE *"
        inputPlaceholder="Misal: Irfan Hakim (HSE Officer)"
        listTitle="Daftar Tim HSE Terdaftar"
        items={hseTeam}
        submitLabel="Simpan Penilai HSE"
        onClose={() => setIsAddHseOpen(false)}
        onAdd={handleAddHse}
        onDelete={handleDeleteHse}
      />

      <AddAreaModal
        isOpen={isAddAreaOpen}
        divisions={divisions}
        areas={areas}
        presetDivision={presetAreaDivision}
        onClose={() => setIsAddAreaOpen(false)}
        onOpenAddDivision={() => setIsAddDivisionOpen(true)}
        onAddArea={handleAddArea}
      />

      <ReportDetailModal
        report={detailReport}
        isHseUnlocked={isHseUnlocked}
        onClose={() => setDetailReportId(null)}
        onOpenHseGrading={(id) => {
          setActiveGradingId(id);
          switchTab('hse');
        }}
        onDeleteReport={handleDeleteReport}
        onOpenLightbox={(title, src) => setLightbox({ title, src })}
      />

      <ChangeHsePinModal
        isOpen={isChangePinOpen}
        onClose={() => setIsChangePinOpen(false)}
        onSavePin={handleUpdateHsePin}
      />

      <LightboxModal
        title={lightbox.title}
        src={lightbox.src}
        onClose={() => setLightbox({ title: '', src: null })}
      />

      <SpilDirectoryModal
        isOpen={isDirectoryOpen}
        branches={branches}
        selectedBranch={selectedBranch}
        onClose={() => setIsDirectoryOpen(false)}
        onSelectBranch={handleSelectBranchFromDirectory}
        onOpenAddBranch={() => setIsAddBranchOpen(true)}
        onDeleteBranch={handleDeleteBranch}
        onOpenPosterLightbox={(title, src) => setLightbox({ title, src })}
      />

      {/* TOAST */}
      {toastMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[80] px-4 py-2.5 rounded-xl bg-spilgreen-900 text-white text-sm font-semibold shadow-lg border border-spilgreen-700 whitespace-nowrap">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
