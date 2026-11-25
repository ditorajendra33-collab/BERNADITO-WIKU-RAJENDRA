import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  ShieldCheck,
  Unlock,
  UserCheck,
  Users,
  ZoomIn,
} from 'lucide-react';
import {
  FIVE_R_ASPECTS,
  SCORE_LABELS,
  createEmptyScores,
  formatDateTime,
  getGradeInfo,
  getReportPhotosList,
  scoreToPercent,
} from '../constants/fiveR';
import type { FiveRAspectKey, FiveRReport, FiveRScores, ReportStatus } from '../types/fiveR';

interface HseEvaluatorViewProps {
  records: FiveRReport[];
  branches: string[];
  hseTeam: string[];
  lastHseEvaluator: string;
  activeGradingId: string | null;
  isHseUnlocked: boolean;
  onUnlockHse: (evaluatorName: string, pinInput: string) => boolean;
  onLockHse: () => void;
  onOpenChangePin: () => void;
  onGoToDashboard: () => void;
  onChangeActiveHse: (name: string) => void;
  onOpenGrading: (id: string) => void;
  onCloseGrading: () => void;
  onOpenAddHse: () => void;
  onSaveGrading: (
    reportId: string,
    scores: FiveRScores,
    evaluator: string,
    hseNotes: string,
  ) => void;
  onOpenLightbox: (title: string, src: string) => void;
  onShowToast: (msg: string) => void;
}

const QUICK_HSE_TAGS = [
  { label: '+ Sesuai standar 5R', text: 'Foto bukti sesuai standar 5R PT SPIL.' },
  { label: '+ Perlu perapian', text: 'Perlu perapian alat & kabel sebelum audit berikutnya.' },
  { label: '+ Perjelas marka/label', text: 'Segera perjelas marka zona & label rak.' },
  { label: '+ Tingkatkan kebersihan', text: 'Tingkatkan kebersihan area lantai & pemilahan sampah.' },
];

export function HseEvaluatorView({
  records,
  branches,
  hseTeam,
  lastHseEvaluator,
  activeGradingId,
  isHseUnlocked,
  onUnlockHse,
  onLockHse,
  onOpenChangePin,
  onGoToDashboard,
  onChangeActiveHse,
  onOpenGrading,
  onCloseGrading,
  onOpenAddHse,
  onSaveGrading,
  onOpenLightbox,
  onShowToast,
}: HseEvaluatorViewProps) {
  const [statusFilter, setStatusFilter] = useState<ReportStatus>('pending');
  const [branchFilter, setBranchFilter] = useState<string>('');
  const [evaluatorFilter, setEvaluatorFilter] = useState<string>('');
  const [scores, setScores] = useState<FiveRScores>(createEmptyScores);
  const [evaluatorName, setEvaluatorName] = useState<string>(lastHseEvaluator || hseTeam[0] || '');
  const [hseNotes, setHseNotes] = useState<string>('');

  // Lock screen state
  const [lockEvaluator, setLockEvaluator] = useState<string>(
    lastHseEvaluator || hseTeam[0] || '',
  );
  const [pinInput, setPinInput] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [pinError, setPinError] = useState<string>('');

  useEffect(() => {
    if (!hseTeam.includes(lockEvaluator) && hseTeam.length > 0) {
      setLockEvaluator(hseTeam[0]);
    }
  }, [hseTeam, lockEvaluator]);

  const activeItem =
    isHseUnlocked && activeGradingId
      ? records.find((r) => r.id === activeGradingId) || null
      : null;

  useEffect(() => {
    if (activeItem) {
      setScores(activeItem.scores ? { ...activeItem.scores } : createEmptyScores());
      setEvaluatorName(activeItem.hseEvaluator || lastHseEvaluator || hseTeam[0] || '');
      setHseNotes(activeItem.hseNotes || '');
    }
  }, [activeItem, lastHseEvaluator, hseTeam]);

  const allEvaluatorNames = useMemo(() => {
    const set = new Set<string>(hseTeam);
    records.forEach((r) => {
      if (r.hseEvaluator) set.add(r.hseEvaluator);
    });
    return Array.from(set);
  }, [hseTeam, records]);

  const evaluatorCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    records
      .filter((r) => r.status === 'reviewed' && r.hseEvaluator)
      .forEach((r) => {
        counts[r.hseEvaluator] = (counts[r.hseEvaluator] || 0) + 1;
      });
    return counts;
  }, [records]);

  const pendingCount = records.filter((r) => r.status === 'pending').length;
  const reviewedCount = records.filter((r) => r.status === 'reviewed').length;

  const filteredQueue = records.filter((r) => {
    if (r.status !== statusFilter) return false;
    if (branchFilter && r.branch !== branchFilter) return false;
    if (statusFilter === 'reviewed' && evaluatorFilter && r.hseEvaluator !== evaluatorFilter) {
      return false;
    }
    return true;
  });

  const scoreValues = Object.values(scores);
  const filledAspects = scoreValues.filter((v) => v > 0).length;
  const totalScore = scoreValues.reduce((sum, val) => sum + val, 0);
  const avgScore = filledAspects > 0 ? Number((totalScore / 5).toFixed(1)) : 0;
  const liveGrade = filledAspects === 5 ? getGradeInfo(avgScore) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;

    const missing = FIVE_R_ASPECTS.find((a) => !scores[a.key]);
    if (missing) {
      onShowToast(`Beri nilai 1–5 untuk aspek ${missing.title}`);
      return;
    }

    if (!evaluatorName.trim()) {
      onShowToast('Mohon isi nama penilai Tim HSE');
      return;
    }

    onSaveGrading(activeItem.id, scores, evaluatorName.trim(), hseNotes.trim());
  };

  const handleScoreClick = (key: FiveRAspectKey, val: number) => {
    setScores((prev) => ({ ...prev, [key]: val }));
  };

  const appendNoteTag = (text: string) => {
    setHseNotes((prev) => (prev.trim() ? `${prev.trim()} ${text}` : text));
  };

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    if (!lockEvaluator.trim()) {
      setPinError('Pilih nama Penilai Tim HSE terlebih dahulu.');
      return;
    }
    const ok = onUnlockHse(lockEvaluator, pinInput);
    if (ok) {
      setPinInput('');
      setPinError('');
    } else {
      setPinError('PIN Tim HSE salah. Periksa kembali PIN akses Tim HSE.');
    }
  };

  return (
    <section className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-spilgreen-700">
            <span>Evaluasi HSE</span>
            <span aria-hidden="true">·</span>
            <span className={isHseUnlocked ? 'text-spilgreen-700' : 'text-spilred-600'}>
              {isHseUnlocked ? 'Akses Terverifikasi' : 'Terkunci (Khusus Tim HSE)'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {!isHseUnlocked
              ? 'Otorisasi Akses Evaluasi HSE'
              : activeItem
                ? `Evaluasi 5R — ${activeItem.areaName}`
                : 'Antrean & Rekap Evaluasi HSE'}
          </h2>
          <p className="text-sm text-slate-600">
            {!isHseUnlocked
              ? 'Hanya anggota Tim HSE dengan PIN akses resmi yang dapat membuka evaluasi dan memberikan penilaian 1–5.'
              : 'Verifikasi foto bukti tiap aspek R1–R5 dari pelaporan cabang dan berikan nilai evaluasi 1–5.'}
          </p>
        </div>

        {!isHseUnlocked ? (
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-spilred-700 text-xs font-bold whitespace-nowrap shrink-0 self-start lg:self-auto">
            <Lock className="w-4 h-4 shrink-0" />
            <span>Penilaian Terkunci · {pendingCount} Antrean</span>
          </div>
        ) : activeItem ? (
          <button
            type="button"
            onClick={onCloseGrading}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-semibold whitespace-nowrap shrink-0 transition self-start lg:self-auto"
          >
            ← Kembali ke Antrean
          </button>
        ) : (
          /* Active HSE Evaluator Selector + Manage Names + PIN & Lock Controls */
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-spilgreen-700 shrink-0" />
              <select
                aria-label="Penilai HSE Aktif"
                value={lastHseEvaluator}
                onChange={(e) => onChangeActiveHse(e.target.value)}
                className="h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-spilgreen-600 outline-none text-sm font-semibold text-slate-800"
              >
                {hseTeam.map((h) => (
                  <option key={h} value={h}>
                    Penilai: {h}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={onOpenAddHse}
              className="min-h-[44px] px-3 py-2 rounded-xl bg-spilgreen-50 hover:bg-spilgreen-100 border border-spilgreen-200 text-spilgreen-800 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition"
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>Penilai ({hseTeam.length})</span>
            </button>
            <button
              type="button"
              onClick={onOpenChangePin}
              className="min-h-[44px] px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition"
            >
              <KeyRound className="w-4 h-4 shrink-0 text-spilgreen-700" />
              <span>Ubah PIN</span>
            </button>
            <button
              type="button"
              onClick={onLockHse}
              className="min-h-[44px] px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-spilred-700 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition"
            >
              <Lock className="w-4 h-4 shrink-0" />
              <span>Kunci Penilai</span>
            </button>
          </div>
        )}
      </div>

      {/* LOCKED GATE */}
      {!isHseUnlocked ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Unlock Form */}
          <form
            onSubmit={handleUnlockSubmit}
            className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5"
          >
            <div className="flex items-start gap-3 pb-4 border-b border-slate-100">
              <div className="w-11 h-11 rounded-xl bg-spilgreen-50 border border-spilgreen-200 text-spilgreen-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Verifikasi Penilai Tim HSE
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pilih nama Anda dari daftar Tim HSE lalu masukkan PIN akses untuk menilai laporan
                  5R cabang.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="lock-hse-select"
                className="block text-xs font-bold text-slate-700"
              >
                Nama Penilai (Tim HSE) *
              </label>
              <select
                id="lock-hse-select"
                value={lockEvaluator}
                onChange={(e) => setLockEvaluator(e.target.value)}
                className="w-full h-12 px-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-spilgreen-600 outline-none text-sm font-semibold text-slate-800"
                required
              >
                {hseTeam.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="hse-pin-input" className="text-xs font-bold text-slate-700">
                  PIN Akses Tim HSE *
                </label>
                <button
                  type="button"
                  onClick={() => setShowPin((v) => !v)}
                  className="text-xs font-semibold text-spilgreen-700 inline-flex items-center gap-1 hover:underline"
                >
                  {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPin ? 'Sembunyikan' : 'Tampilkan'}</span>
                </button>
              </div>
              <input
                id="hse-pin-input"
                type={showPin ? 'text' : 'password'}
                maxLength={24}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  if (pinError) setPinError('');
                }}
                placeholder="Masukkan PIN / kode akses Tim HSE"
                className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:border-spilgreen-600 focus:ring-2 focus:ring-spilgreen-100 outline-none font-mono font-bold text-base tracking-wider"
                required
              />
            </div>

            {pinError && (
              <p className="text-xs font-semibold text-spilred-600 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5">
                {pinError}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                type="submit"
                className="flex-1 min-h-[48px] px-5 py-2.5 rounded-xl bg-spilgreen-600 hover:bg-spilgreen-700 text-white font-bold text-sm inline-flex items-center justify-center gap-2 transition"
              >
                <Unlock className="w-4 h-4 shrink-0" />
                <span>Buka Akses Evaluasi HSE</span>
              </button>
              <button
                type="button"
                onClick={onGoToDashboard}
                className="min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-sm whitespace-nowrap transition"
              >
                Lihat Dashboard
              </button>
            </div>
          </form>

          {/* Step-by-Step How-To-Lock Guide */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Cara Mengunci Penilaian Khusus Tim HSE
            </h3>
            <ol className="space-y-3 text-xs sm:text-sm text-slate-600">
              <li className="flex items-start gap-2.5">
                <span className="font-mono font-bold text-spilgreen-700 shrink-0">01.</span>
                <span>
                  <strong className="text-slate-900">Buka dengan PIN Tim HSE:</strong> Pilih nama
                  penilai HSE lalu masukkan PIN / kode akses resmi Tim HSE.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-mono font-bold text-spilgreen-700 shrink-0">02.</span>
                <span>
                  <strong className="text-slate-900">Kelola Penilai &amp; PIN:</strong> Setelah
                  terbuka, Tim HSE dapat menambah daftar penilai atau mengganti PIN melalui tombol{' '}
                  <strong className="text-slate-900">Ubah PIN</strong>.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-mono font-bold text-spilgreen-700 shrink-0">03.</span>
                <span>
                  <strong className="text-slate-900">Kunci Setelah Selesai:</strong> Klik{' '}
                  <strong className="text-slate-900">Kunci Penilai</strong> sebelum perangkat
                  digunakan pengirim cabang. Menu ini juga otomatis terkunci kembali saat aplikasi
                  dibuka ulang.
                </span>
              </li>
            </ol>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 tabular-nums">
              <span>Laporan menunggu penilaian HSE</span>
              <span className="font-bold text-amber-700">{pendingCount} Laporan</span>
            </div>
          </div>
        </div>
      ) : !activeItem ? (
        <div className="space-y-4">
          {/* Segmented Tabs + Branch Filter */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 self-start">
                <button
                  type="button"
                  onClick={() => setStatusFilter('pending')}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition tabular-nums ${
                    statusFilter === 'pending'
                      ? 'bg-spilgreen-600 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Menunggu Penilaian ({pendingCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('reviewed')}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition tabular-nums ${
                    statusFilter === 'reviewed'
                      ? 'bg-spilgreen-600 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sudah Dinilai ({reviewedCount})
                </button>
              </div>

              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none text-sm font-medium text-slate-700"
              >
                <option value="">Semua Cabang / Kantor</option>
                {branches.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Separate by HSE Evaluator Name (when viewing Sudah Dinilai) */}
            {statusFilter === 'reviewed' && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <p className="text-xs font-semibold text-slate-500">
                  Pisahkan berdasarkan Nama Penilai Tim HSE:
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEvaluatorFilter('')}
                    className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold transition tabular-nums ${
                      evaluatorFilter === ''
                        ? 'bg-spilgreen-700 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    Semua Penilai ({reviewedCount})
                  </button>
                  {allEvaluatorNames.map((name) => {
                    const count = evaluatorCounts[name] || 0;
                    const isActive = evaluatorFilter === name;
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setEvaluatorFilter(name)}
                        className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold transition tabular-nums ${
                          isActive
                            ? 'bg-spilgreen-700 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {name} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {filteredQueue.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-2">
              <p className="font-bold text-slate-800 text-base">
                {statusFilter === 'pending'
                  ? 'Semua kiriman cabang/kantor sudah dinilai Tim HSE'
                  : evaluatorFilter
                    ? `Belum ada penilaian oleh "${evaluatorFilter}" untuk filter ini`
                    : 'Belum ada riwayat penilaian HSE untuk filter ini'}
              </p>
              <p className="text-xs text-slate-500">
                Dokumentasi foto baru dari Pelaporan Cabang akan tampil otomatis pada daftar ini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredQueue.map((item) => {
                const photosList = getReportPhotosList(item);
                const isPending = item.status === 'pending';
                const grade =
                  !isPending && item.avgScore !== null ? getGradeInfo(item.avgScore) : null;

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between gap-4 hover:border-spilgreen-400 transition"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-xs text-slate-500">
                            <span className="font-bold text-spilgreen-700">{item.branch}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono font-semibold text-slate-700">
                              {item.areaCode}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums">{formatDateTime(item.timestamp)}</span>
                          </div>
                          <h3 className="font-bold text-slate-900 text-base truncate">
                            {item.areaName}
                          </h3>
                          <p className="text-xs text-slate-500">
                            {item.dept} · Pengirim:{' '}
                            <span className="font-semibold text-slate-700">{item.senderName}</span>
                          </p>
                          {!isPending && item.hseEvaluator && (
                            <p className="text-xs text-spilgreen-700 font-semibold">
                              Penilai HSE: {item.hseEvaluator}
                            </p>
                          )}
                        </div>

                        <div className="text-right shrink-0 space-y-1">
                          {isPending ? (
                            <span className="block text-xs font-bold text-amber-700">
                              Menunggu Nilai HSE
                            </span>
                          ) : (
                            <span
                              className={`block text-xs font-bold tabular-nums ${
                                grade ? grade.textClass : 'text-spilgreen-700'
                              }`}
                            >
                              Nilai {scoreToPercent(item.avgScore ?? 0)}% ({item.avgScore?.toFixed(1)}/5)
                            </span>
                          )}
                          <span className="block text-xs text-slate-500 tabular-nums">
                            {photosList.length} Foto (
                            {Array.from(new Set(photosList.map((p) => p.code))).join(', ') || '-'})
                          </span>
                        </div>
                      </div>

                      {item.senderNotes && (
                        <p className="text-xs text-slate-600 bg-slate-50 rounded-xl p-3 border border-slate-100 leading-relaxed">
                          <span className="font-bold text-slate-700">Info Pengirim:</span>{' '}
                          {item.senderNotes}
                        </p>
                      )}

                      {photosList.length > 0 && (
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                          {photosList.map((p) => (
                            <div
                              key={`${p.code}-${p.index}`}
                              className="shrink-0 w-24 rounded-lg border border-slate-200 overflow-hidden bg-slate-100"
                            >
                              <div className="bg-white border-b border-slate-100 text-slate-700 font-mono text-[10px] font-bold text-center py-0.5">
                                {p.code}
                                {p.totalInAspect > 1 ? ` #${p.index + 1}` : ''}
                              </div>
                              <img
                                src={p.src}
                                alt={`${p.title} ${p.index + 1}`}
                                className="w-24 h-16 object-cover cursor-zoom-in"
                                onClick={() =>
                                  onOpenLightbox(
                                    `${p.code} · ${p.title}${p.totalInAspect > 1 ? ` (#${p.index + 1})` : ''}`,
                                    p.src,
                                  )
                                }
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          onOpenGrading(item.id);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-xl font-bold text-sm transition ${
                          isPending
                            ? 'bg-spilgreen-600 hover:bg-spilgreen-700 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                        }`}
                      >
                        {isPending
                          ? 'Nilai Foto Sekarang (Skala 1–5) →'
                          : 'Lihat / Edit Penilaian HSE'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* GRADING WORKSPACE */
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Submission Header */}
          <div className="bg-spilgreen-800 text-white rounded-2xl p-5 sm:p-6 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center flex-wrap gap-2 text-xs text-spilgreen-100">
                  <span className="font-bold text-white">{activeItem.branch}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono font-bold">{activeItem.areaCode}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{formatDateTime(activeItem.timestamp)}</span>
                </div>
                <h3 className="text-xl font-bold leading-snug">{activeItem.areaName}</h3>
                <p className="text-sm text-spilgreen-100">
                  {activeItem.dept} · Pengirim: {activeItem.senderName}
                </p>
              </div>
              <button
                type="button"
                onClick={onCloseGrading}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-semibold shrink-0 whitespace-nowrap transition"
              >
                Kembali
              </button>
            </div>

            {activeItem.senderNotes && (
              <div className="bg-white/10 rounded-xl p-3.5 text-sm text-spilgreen-50 border border-white/15">
                <span className="font-bold text-white">Keterangan Pengirim:</span>{' '}
                {activeItem.senderNotes}
              </div>
            )}
          </div>

          {/* HSE Evaluator Selector */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="hse-evaluator-input"
                className="block text-sm font-bold text-slate-900"
              >
                Nama Penilai (Tim HSE) <span className="text-spilred-600">*</span>
              </label>
              <button
                type="button"
                onClick={onOpenAddHse}
                className="text-xs font-semibold text-spilgreen-700 hover:underline"
              >
                + Kelola Daftar Tim HSE
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={hseTeam.includes(evaluatorName) ? evaluatorName : ''}
                onChange={(e) => {
                  if (e.target.value) setEvaluatorName(e.target.value);
                }}
                className="h-12 px-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-spilgreen-600 outline-none text-sm font-semibold text-slate-800"
              >
                <option value="">-- Pilih Tim HSE --</option>
                {hseTeam.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
              <input
                id="hse-evaluator-input"
                type="text"
                value={evaluatorName}
                onChange={(e) => setEvaluatorName(e.target.value)}
                placeholder="Ketik nama penilai Tim HSE"
                className="h-12 px-4 rounded-xl border border-slate-200 focus:border-spilgreen-600 focus:ring-2 focus:ring-spilgreen-100 outline-none text-sm font-medium"
                required
              />
            </div>
          </div>

          {/* 5R Aspects Photo + Scale 1-5 */}
          <div className="space-y-4">
            {FIVE_R_ASPECTS.map((aspect) => {
              const aspectPhotos = activeItem.photos?.[aspect.key] || [];
              const selectedScore = scores[aspect.key] || 0;
              const selectedLabel = selectedScore
                ? SCORE_LABELS[selectedScore].text
                : 'Belum dinilai HSE';

              return (
                <div
                  key={aspect.key}
                  className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-spilgreen-700">
                          {aspect.code}
                        </span>
                        <span aria-hidden="true" className="text-slate-300">
                          ·
                        </span>
                        <h4 className="font-bold text-slate-900 text-base">{aspect.title}</h4>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{aspect.desc}</p>
                    </div>
                    <span
                      className={`text-xs font-semibold shrink-0 whitespace-nowrap tabular-nums ${
                        aspectPhotos.length > 0 ? 'text-spilgreen-700' : 'text-slate-400'
                      }`}
                    >
                      {aspectPhotos.length > 0
                        ? `${aspectPhotos.length} Foto Terlampir`
                        : 'Tanpa Foto'}
                    </span>
                  </div>

                  {/* Sender's Photos (1 or more) */}
                  {aspectPhotos.length > 0 ? (
                    <div
                      className={`grid gap-3 ${
                        aspectPhotos.length === 1
                          ? 'grid-cols-1'
                          : 'grid-cols-1 sm:grid-cols-2'
                      }`}
                    >
                      {aspectPhotos.map((photoSrc, idx) => (
                        <div
                          key={`${aspect.key}-${idx}`}
                          className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative"
                        >
                          {aspectPhotos.length > 1 && (
                            <div className="px-3 py-1 bg-white border-b border-slate-100 text-[11px] font-mono font-bold text-slate-700 tabular-nums">
                              Foto {idx + 1} dari {aspectPhotos.length}
                            </div>
                          )}
                          <img
                            src={photoSrc}
                            alt={`Foto ${aspect.title} ${idx + 1}`}
                            onClick={() =>
                              onOpenLightbox(
                                `${aspect.code} · ${aspect.title}${aspectPhotos.length > 1 ? ` (#${idx + 1})` : ''}`,
                                photoSrc,
                              )
                            }
                            className={`w-full object-contain mx-auto cursor-zoom-in ${
                              aspectPhotos.length === 1 ? 'max-h-72' : 'h-56'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              onOpenLightbox(
                                `${aspect.code} · ${aspect.title}${aspectPhotos.length > 1 ? ` (#${idx + 1})` : ''}`,
                                photoSrc,
                              )
                            }
                            className="absolute bottom-2.5 right-2.5 min-h-[34px] px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                            <span>Perbesar</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
                      Pengirim tidak melampirkan foto khusus untuk aspek {aspect.code} (
                      {aspect.shortTitle}). Tim HSE tetap dapat memberikan nilai.
                    </div>
                  )}

                  {/* Score Scale 1-5 */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-700">
                      Penilaian Tim HSE (Skala 1–5)
                    </p>
                    <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5].map((num) => {
                        const isActive = selectedScore === num;
                        return (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handleScoreClick(aspect.key, num)}
                            className={`min-h-[52px] rounded-xl border-2 font-mono font-bold text-lg transition flex items-center justify-center tabular-nums ${
                              isActive
                                ? SCORE_LABELS[num].activeClass
                                : 'bg-slate-50 hover:bg-spilgreen-50 text-slate-700 border-slate-200 hover:border-spilgreen-300'
                            }`}
                          >
                            {num}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <span className="text-slate-400">1: Sangat Kurang · 5: Sangat Baik</span>
                      <span
                        className={`font-bold ${
                          selectedScore ? 'text-slate-900' : 'text-slate-400'
                        }`}
                      >
                        {selectedLabel}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live Summary Bar */}
          <div className="bg-spilgreen-900 text-white rounded-2xl p-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-spilgreen-200 font-semibold">
                Hasil Penilaian Tim HSE
              </p>
              <div className="flex items-baseline gap-2 mt-0.5 tabular-nums">
                <span className="text-3xl font-extrabold">{scoreToPercent(avgScore)}%</span>
                <span className="text-sm text-spilgreen-200 font-mono">
                  ({avgScore.toFixed(1)}/5.0 · {totalScore}/25)
                </span>
              </div>
            </div>
            <span
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap ${
                liveGrade ? liveGrade.darkBadgeClass : 'bg-spilgreen-800 text-spilgreen-100'
              }`}
            >
              {liveGrade ? liveGrade.label : `${filledAspects}/5 Aspek Dinilai`}
            </span>
          </div>

          {/* HSE Notes */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <label htmlFor="hse-notes-input" className="block text-sm font-bold text-slate-900">
              Catatan Evaluasi &amp; Rekomendasi Tim HSE
            </label>
            <textarea
              id="hse-notes-input"
              rows={3}
              value={hseNotes}
              onChange={(e) => setHseNotes(e.target.value)}
              placeholder="Tuliskan hasil verifikasi foto, temuan ketidaksesuaian, atau rekomendasi perbaikan untuk cabang/kantor..."
              className="w-full p-3.5 rounded-xl border border-slate-200 focus:border-spilgreen-600 focus:ring-2 focus:ring-spilgreen-100 outline-none text-sm"
            />
            <div className="flex flex-wrap gap-2">
              {QUICK_HSE_TAGS.map((tag) => (
                <button
                  key={tag.label}
                  type="button"
                  onClick={() => appendNoteTag(tag.text)}
                  className="min-h-[36px] px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-spilgreen-50 border border-slate-200 hover:border-spilgreen-300 text-xs font-semibold text-slate-700 transition"
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            className="w-full min-h-[54px] rounded-xl bg-spilgreen-600 hover:bg-spilgreen-700 active:scale-[0.99] text-white font-bold text-base transition flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            <span>Simpan Nilai HSE</span>
          </button>
        </form>
      )}
    </section>
  );
}
