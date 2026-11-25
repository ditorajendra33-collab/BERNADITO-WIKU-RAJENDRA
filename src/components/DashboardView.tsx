import { useMemo, useRef, useState } from 'react';
import { Download, Lock, Plus, RotateCcw, Search, UserCheck } from 'lucide-react';
import {
  FIVE_R_ASPECTS,
  exportReportsToCSV,
  formatDateTime,
  getGradeInfo,
  getReportPhotosList,
  scoreToPercent,
} from '../constants/fiveR';
import type {
  AreaItem,
  AreaStat,
  FiveRReport,
  HseGradeFilter,
  StatusFilter,
} from '../types/fiveR';

interface DashboardViewProps {
  records: FiveRReport[];
  branches: string[];
  areas: AreaItem[];
  hseTeam: string[];
  isHseUnlocked: boolean;
  onGoToSender: () => void;
  onOpenDetail: (reportId: string) => void;
  onOpenAddHse: () => void;
  onGoToHseLock: () => void;
  onResetDemo: () => void;
  onShowToast: (msg: string) => void;
}

interface HseEvaluatorStat {
  name: string;
  count: number;
  avg: number;
  branchesCount: number;
  lastReviewedAt: string | null;
}

export function DashboardView({
  records,
  branches,
  areas,
  hseTeam,
  isHseUnlocked,
  onGoToSender,
  onOpenDetail,
  onOpenAddHse,
  onGoToHseLock,
  onResetDemo,
  onShowToast,
}: DashboardViewProps) {
  const [search, setSearch] = useState<string>('');
  const [branchFilter, setBranchFilter] = useState<string>('');
  const [areaFilter, setAreaFilter] = useState<string>('');
  const [evaluatorFilter, setEvaluatorFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [gradeFilter, setGradeFilter] = useState<HseGradeFilter>('all');

  const historyRef = useRef<HTMLDivElement | null>(null);

  const pendingCount = useMemo(
    () => records.filter((r) => r.status === 'pending').length,
    [records],
  );

  const reviewedRecords = useMemo(
    () => records.filter((r) => r.status === 'reviewed' && r.avgScore !== null),
    [records],
  );

  const allEvaluators = useMemo(() => {
    const set = new Set<string>(hseTeam);
    records.forEach((r) => {
      if (r.hseEvaluator) set.add(r.hseEvaluator);
    });
    return Array.from(set);
  }, [hseTeam, records]);

  const evaluatorStats = useMemo<HseEvaluatorStat[]>(() => {
    const map: Record<
      string,
      {
        name: string;
        count: number;
        sumAvg: number;
        branches: Set<string>;
        lastReviewedAt: string | null;
      }
    > = {};

    hseTeam.forEach((name) => {
      map[name] = {
        name,
        count: 0,
        sumAvg: 0,
        branches: new Set<string>(),
        lastReviewedAt: null,
      };
    });

    records
      .filter((r) => r.status === 'reviewed' && r.hseEvaluator && r.avgScore !== null)
      .forEach((r) => {
        if (!map[r.hseEvaluator]) {
          map[r.hseEvaluator] = {
            name: r.hseEvaluator,
            count: 0,
            sumAvg: 0,
            branches: new Set<string>(),
            lastReviewedAt: null,
          };
        }
        const entry = map[r.hseEvaluator];
        entry.count += 1;
        entry.sumAvg += r.avgScore ?? 0;
        entry.branches.add(r.branch);
        if (
          r.reviewedAt &&
          (!entry.lastReviewedAt || r.reviewedAt > entry.lastReviewedAt)
        ) {
          entry.lastReviewedAt = r.reviewedAt;
        }
      });

    return Object.values(map)
      .map((e) => ({
        name: e.name,
        count: e.count,
        avg: e.count > 0 ? e.sumAvg / e.count : 0,
        branchesCount: e.branches.size,
        lastReviewedAt: e.lastReviewedAt,
      }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [hseTeam, records]);

  const areaStats = useMemo<AreaStat[]>(() => {
    const map: Record<
      string,
      {
        branch: string;
        areaCode: string;
        areaName: string;
        dept: string;
        count: number;
        sumAvg: number;
        rSums: Record<'ringkas' | 'rapi' | 'resik' | 'rawat' | 'rajin', number>;
      }
    > = {};

    records
      .filter((r) => r.status === 'reviewed' && r.scores !== null && r.avgScore !== null)
      .forEach((item) => {
        const key = `${item.branch}__${item.areaCode}`;
        if (!map[key]) {
          map[key] = {
            branch: item.branch,
            areaCode: item.areaCode,
            areaName: item.areaName,
            dept: item.dept,
            count: 0,
            sumAvg: 0,
            rSums: { ringkas: 0, rapi: 0, resik: 0, rawat: 0, rajin: 0 },
          };
        }
        const entry = map[key];
        entry.count += 1;
        entry.sumAvg += item.avgScore ?? 0;
        FIVE_R_ASPECTS.forEach((asp) => {
          entry.rSums[asp.key] += item.scores?.[asp.key] ?? 0;
        });
      });

    return Object.values(map)
      .map((e) => {
        const avg = e.sumAvg / e.count;
        return {
          branch: e.branch,
          areaCode: e.areaCode,
          areaName: e.areaName,
          dept: e.dept,
          count: e.count,
          avg,
          pct: scoreToPercent(avg),
          rAvgs: {
            ringkas: (e.rSums.ringkas / e.count).toFixed(1),
            rapi: (e.rSums.rapi / e.count).toFixed(1),
            resik: (e.rSums.resik / e.count).toFixed(1),
            rawat: (e.rSums.rawat / e.count).toFixed(1),
            rajin: (e.rSums.rajin / e.count).toFixed(1),
          },
          rPcts: {
            ringkas: scoreToPercent(e.rSums.ringkas / e.count),
            rapi: scoreToPercent(e.rSums.rapi / e.count),
            resik: scoreToPercent(e.rSums.resik / e.count),
            rawat: scoreToPercent(e.rSums.rawat / e.count),
            rajin: scoreToPercent(e.rSums.rajin / e.count),
          },
        };
      })
      .sort((a, b) => b.avg - a.avg);
  }, [records]);

  const avgAll = useMemo(() => {
    if (reviewedRecords.length === 0) return 0;
    return (
      reviewedRecords.reduce((sum, r) => sum + (r.avgScore ?? 0), 0) / reviewedRecords.length
    );
  }, [reviewedRecords]);

  const bestArea = areaStats[0] ?? null;
  const lowCount = areaStats.filter((a) => a.avg < 3.5).length;

  const filteredRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((item) => {
      if (branchFilter && item.branch !== branchFilter) return false;
      if (areaFilter && item.areaCode !== areaFilter) return false;
      if (evaluatorFilter && item.hseEvaluator !== evaluatorFilter) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;

      if (q) {
        const hay =
          `${item.branch} ${item.senderName} ${item.hseEvaluator} ${item.areaCode} ${item.areaName} ${item.dept} ${item.senderNotes} ${item.hseNotes}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      if (gradeFilter !== 'all') {
        if (item.status !== 'reviewed' || item.avgScore === null) return false;
        if (gradeFilter === 'good' && item.avgScore < 4.0) return false;
        if (gradeFilter === 'fair' && (item.avgScore < 3.0 || item.avgScore >= 4.0)) return false;
        if (gradeFilter === 'poor' && item.avgScore >= 3.0) return false;
      }

      return true;
    });
  }, [records, search, branchFilter, areaFilter, evaluatorFilter, statusFilter, gradeFilter]);

  const handleExport = () => {
    if (filteredRecords.length === 0) {
      onShowToast('Tidak ada data untuk diexport');
      return;
    }
    exportReportsToCSV(filteredRecords);
    onShowToast(`Berhasil export ${filteredRecords.length} data ke CSV`);
  };

  const handleFilterByEvaluator = (name: string) => {
    setEvaluatorFilter((prev) => (prev === name ? '' : name));
    setStatusFilter('reviewed');
    historyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-spilgreen-700">
            <span>Dashboard</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-500">PT Salam Pacific Indonesia Lines (SPIL)</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Rekapitulasi Kinerja &amp; Kepatuhan 5R
          </h2>
          <p className="text-sm text-slate-600">
            Pantau persentase kepatuhan 5R seluruh cabang, performa evaluator HSE, dan riwayat
            audit.
          </p>
        </div>
        <button
          type="button"
          onClick={onGoToSender}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-spilgreen-600 hover:bg-spilgreen-700 text-white text-sm font-bold flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Pelaporan Cabang</span>
        </button>
      </div>

      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
          <p className="text-xs font-semibold text-slate-500">Total Kiriman</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tabular-nums">
            {records.length}
          </p>
          <p className="text-xs text-amber-700 font-semibold mt-1 tabular-nums">
            {pendingCount} menunggu penilaian HSE
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
          <p className="text-xs font-semibold text-slate-500">Rata-rata 5R (HSE)</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-spilgreen-700 mt-1 tabular-nums">
            {scoreToPercent(avgAll)}%
          </p>
          <p className="text-xs text-slate-500 mt-1 tabular-nums">
            {reviewedRecords.length > 0
              ? `Skor ${avgAll.toFixed(1)} / 5.0 (${reviewedRecords.length} dinilai)`
              : 'Belum ada nilai HSE'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
          <p className="text-xs font-semibold text-slate-500">Area Terbaik</p>
          <p className="text-sm sm:text-base font-bold text-slate-900 mt-1.5 truncate">
            {bestArea ? bestArea.areaName : '-'}
          </p>
          <p className="text-xs font-semibold text-spilgreen-700 mt-0.5 truncate tabular-nums">
            {bestArea ? `${bestArea.branch} · ${bestArea.pct}%` : '-'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
          <p className="text-xs font-semibold text-slate-500">Perlu Perhatian</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-spilred-600 mt-1 tabular-nums">
            {lowCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">Area nilai &lt; 70%</p>
        </div>
      </div>

      {/* Rekapitulasi per Nama Penilai (Tim HSE) */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Rekapitulasi per Nama Penilai (Tim HSE)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Klik salah satu nama penilai HSE untuk memisahkan riwayat penilaiannya
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (isHseUnlocked) {
                onOpenAddHse();
              } else {
                onShowToast('Buka kunci akses Tim HSE terlebih dahulu untuk mengelola daftar penilai');
                onGoToHseLock();
              }
            }}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 transition"
          >
            {isHseUnlocked ? (
              <UserCheck className="w-4 h-4 text-spilgreen-700" />
            ) : (
              <Lock className="w-4 h-4 text-slate-500" />
            )}
            <span>{isHseUnlocked ? '+ Tambah Penilai HSE' : 'Kelola Penilai (Terkunci)'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:gap-px bg-slate-100">
          {evaluatorStats.map((ev) => {
            const isSelected = evaluatorFilter === ev.name;
            return (
              <button
                key={ev.name}
                type="button"
                onClick={() => handleFilterByEvaluator(ev.name)}
                className={`p-4 text-left transition flex items-center justify-between gap-3 ${
                  isSelected ? 'bg-spilgreen-50' : 'bg-white hover:bg-slate-50'
                }`}
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="font-bold text-slate-900 text-sm truncate">{ev.name}</p>
                  <p className="text-xs text-slate-500 tabular-nums">
                    {ev.count} penilaian · {ev.branchesCount} cabang
                  </p>
                </div>
                <div className="text-right shrink-0 tabular-nums">
                  <span
                    className={`text-base font-extrabold ${
                      ev.count > 0 ? 'text-spilgreen-700' : 'text-slate-400'
                    }`}
                  >
                    {ev.count > 0 ? `${scoreToPercent(ev.avg)}%` : '-'}
                  </span>
                  <p className="text-[11px] text-slate-500">
                    {isSelected ? 'Terfilter' : 'Rata-rata'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Rekapitulasi Skor 5R per Cabang & Area */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Rekapitulasi Persentase 5R per Cabang &amp; Area
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Konversi hasil penilaian skala 1–5 Tim HSE PT SPIL ke persentase (0%–100%)
            </p>
          </div>
          <button
            type="button"
            onClick={onGoToSender}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-spilgreen-600 hover:bg-spilgreen-700 text-white text-sm font-bold flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Kirim Foto</span>
          </button>
        </div>

        {areaStats.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Belum ada laporan yang selesai dinilai oleh Tim HSE.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {areaStats.map((stat) => {
              const pct = stat.pct;
              const barColor =
                stat.avg >= 4.0
                  ? 'bg-spilgreen-600'
                  : stat.avg >= 3.0
                    ? 'bg-amber-500'
                    : 'bg-spilred-600';
              const scoreTextColor =
                stat.avg >= 4.0
                  ? 'text-spilgreen-700'
                  : stat.avg >= 3.0
                    ? 'text-amber-700'
                    : 'text-spilred-600';

              return (
                <div
                  key={`${stat.branch}__${stat.areaCode}`}
                  className="p-5 hover:bg-slate-50/70 transition space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500">
                        <span className="font-bold text-spilgreen-700">{stat.branch}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono font-semibold text-slate-700">
                          {stat.areaCode}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{stat.count}x Dinilai HSE</span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-base mt-0.5">
                        {stat.areaName}
                      </h3>
                      <p className="text-xs text-slate-500">{stat.dept}</p>
                    </div>
                    <div className="text-right shrink-0 tabular-nums">
                      <span className={`text-xl font-extrabold ${scoreTextColor}`}>
                        {pct}%
                      </span>
                      <p className="text-xs text-slate-500">{stat.avg.toFixed(1)} / 5.0</p>
                    </div>
                  </div>

                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${barColor} rounded-full transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-5 gap-2 text-center pt-0.5">
                    {FIVE_R_ASPECTS.map((asp) => (
                      <div
                        key={asp.key}
                        className="bg-slate-50 rounded-xl py-2 px-1 border border-slate-100 tabular-nums"
                      >
                        <div className="font-mono text-[11px] font-bold text-spilgreen-700">
                          {asp.code}
                        </div>
                        <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                          {stat.rPcts[asp.key]}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Riwayat Lengkap + Filter + Export CSV */}
      <div
        ref={historyRef}
        className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
      >
        <div className="p-5 border-b border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Riwayat Laporan &amp; Evaluasi HSE
              </h2>
              <p className="text-xs text-slate-500 tabular-nums mt-0.5">
                Menampilkan {filteredRecords.length} dari {records.length} pelaporan
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExport}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-spilgreen-600 hover:bg-spilgreen-700 text-white font-bold text-sm flex items-center justify-center gap-2 whitespace-nowrap transition"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
              <button
                type="button"
                onClick={onResetDemo}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 whitespace-nowrap transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari pengirim / HSE / area..."
                className="w-full h-11 pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-spilgreen-600 outline-none text-sm"
              />
            </div>

            <select
              value={evaluatorFilter}
              onChange={(e) => setEvaluatorFilter(e.target.value)}
              className="h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none text-sm font-medium text-slate-700"
            >
              <option value="">Semua Penilai HSE</option>
              {allEvaluators.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>

            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none text-sm font-medium text-slate-700"
            >
              <option value="">Semua Cabang/Kantor</option>
              {branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none text-sm font-medium text-slate-700"
            >
              <option value="">Semua Area</option>
              {areas.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.code} — {a.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none text-sm font-medium text-slate-700"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu Tim HSE</option>
              <option value="reviewed">Sudah Dinilai HSE</option>
            </select>

            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value as HseGradeFilter)}
              className="h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none text-sm font-medium text-slate-700"
            >
              <option value="all">Semua Nilai</option>
              <option value="good">Baik (≥ 80%)</option>
              <option value="fair">Cukup (60% – 79%)</option>
              <option value="poor">Kurang (&lt; 60%)</option>
            </select>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Tidak ada data yang sesuai filter.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredRecords.map((item) => {
              const isPending = item.status === 'pending';
              const grade =
                !isPending && item.avgScore !== null ? getGradeInfo(item.avgScore) : null;
              const photosList = getReportPhotosList(item);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onOpenDetail(item.id)}
                  className="w-full text-left p-5 hover:bg-slate-50/80 active:bg-slate-100/70 transition space-y-2 block"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-xs text-slate-500">
                        <span className="font-bold text-spilgreen-700">{item.branch}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono font-semibold text-slate-700">
                          {item.areaCode}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{formatDateTime(item.timestamp)}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-base truncate">
                        {item.areaName}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Pengirim:{' '}
                        <span className="font-semibold text-slate-700">{item.senderName}</span>
                        {item.hseEvaluator && (
                          <>
                            {' · '}Penilai HSE:{' '}
                            <span className="font-semibold text-spilgreen-700">
                              {item.hseEvaluator}
                            </span>
                          </>
                        )}
                      </p>
                    </div>

                    <div className="text-right shrink-0 space-y-1 tabular-nums">
                      {isPending ? (
                        <span className="block text-xs font-bold text-amber-700">
                          Menunggu HSE
                        </span>
                      ) : (
                        <span
                          className={`block text-sm font-extrabold ${
                            grade ? grade.textClass : 'text-spilgreen-700'
                          }`}
                        >
                          {scoreToPercent(item.avgScore ?? 0)}% · {grade?.label.split(' ')[0]}
                        </span>
                      )}
                      {photosList.length > 0 && (
                        <span className="block text-xs text-slate-500">
                          {photosList.length} Foto (
                          {Array.from(new Set(photosList.map((p) => p.code))).join(', ')})
                        </span>
                      )}
                    </div>
                  </div>

                  {item.hseNotes && (
                    <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <span className="font-bold text-slate-800">Catatan HSE:</span>{' '}
                      {item.hseNotes}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
