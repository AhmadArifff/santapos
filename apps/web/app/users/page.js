'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import DateRangePicker from '@/components/ui/DateRangePicker';
import { TableSkeleton } from '@/components/ui/SectionSkeleton';
import {
  createCashierSchedule,
  deleteCashierSchedule,
  getCashierSchedules,
  getUsers,
  registerUser,
  updateCashierSchedule,
} from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

const statusOptions = [
  { value: 'scheduled', label: 'Terjadwal', className: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200' },
  { value: 'off', label: 'Libur', className: 'border-slate-500/25 bg-slate-500/10 text-slate-200' },
  { value: 'done', label: 'Selesai', className: 'border-sky-500/25 bg-sky-500/10 text-sky-200' },
];

const pad = (value) => String(value).padStart(2, '0');
const toDateKey = (date) => {
  const value = date instanceof Date ? date : new Date(`${date}T00:00:00`);
  if (Number.isNaN(value.getTime())) return '';
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
};
const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};
const formatDate = (value, options = { day: 'numeric', month: 'short', year: 'numeric' }) => {
  if (!value) return '-';
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('id-ID', options);
};
const formatDayName = (value) => formatDate(value, { weekday: 'short' });

const buildDays = (start, end) => {
  if (!start || !end) return [];
  const days = [];
  const current = new Date(`${start}T00:00:00`);
  const last = new Date(`${end}T00:00:00`);
  if (Number.isNaN(current.getTime()) || Number.isNaN(last.getTime())) return [];
  while (current.getTime() <= last.getTime() && days.length < 45) {
    days.push(toDateKey(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
};

const getStatusMeta = (status) => statusOptions.find((item) => item.value === status) || statusOptions[0];

const emptyUserForm = { name: '', email: '', password: '', role: 'kasir' };
const emptyScheduleForm = {
  user_id: '',
  work_date: toDateKey(new Date()),
  start_time: '09:00',
  end_time: '17:00',
  shift_name: 'Shift Kasir',
  status: 'scheduled',
  note: '',
};

export default function UsersPage() {
  const todayKey = toDateKey(new Date());
  const { user, selectedBranchId } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [userModal, setUserModal] = useState(false);
  const [scheduleModal, setScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(emptyUserForm);
  const [scheduleForm, setScheduleForm] = useState(emptyScheduleForm);
  const [loading, setLoading] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [conflictLoading, setConflictLoading] = useState(false);
  const [scheduleConflicts, setScheduleConflicts] = useState([]);
  const [message, setMessage] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: todayKey,
    end: toDateKey(addDays(new Date(), 6)),
  });
  const activeBranchId = selectedBranchId || user?.default_branch_id || user?.branch_id || null;
  const activeBranchName = user?.branch_name || (activeBranchId ? `Cabang #${activeBranchId}` : 'Cabang aktif');

  const cashiers = useMemo(() => users.filter((user) => user.role === 'kasir'), [users]);
  const calendarDays = useMemo(() => buildDays(dateRange.start, dateRange.end), [dateRange.start, dateRange.end]);
  const schedulesByDate = useMemo(() => schedules.reduce((acc, schedule) => {
    const key = String(schedule.work_date || '').slice(0, 10);
    if (!acc[key]) acc[key] = [];
    acc[key].push(schedule);
    return acc;
  }, {}), [schedules]);
  const activeSchedules = schedules.filter((schedule) => schedule.status === 'scheduled');
  const conflictByUser = useMemo(() => scheduleConflicts.reduce((acc, schedule) => {
    if (editingSchedule && Number(schedule.id) === Number(editingSchedule.id)) return acc;
    acc[Number(schedule.user_id)] = schedule;
    return acc;
  }, {}), [editingSchedule, scheduleConflicts]);
  const selectedConflict = scheduleForm.user_id ? conflictByUser[Number(scheduleForm.user_id)] : null;

  const showFeedback = (type, title, detail) => {
    setMessage({ type, title, detail });
    window.dispatchEvent(new CustomEvent('app:feedback', {
      detail: { type, title, message: detail },
    }));
    window.setTimeout(() => setMessage(null), 4500);
  };

  const loadUsers = async () => {
    try {
      const response = await getUsers();
      setUsers(response.data || []);
    } catch {
      showFeedback('error', 'Gagal Memuat Tim', 'Data tim kasir belum bisa dimuat. Coba refresh halaman.');
    } finally {
      setPageLoading(false);
    }
  };

  const loadSchedules = async () => {
    setScheduleLoading(true);
    try {
      const response = await getCashierSchedules({
        date_from: dateRange.start,
        date_to: dateRange.end || dateRange.start,
        branch_id: activeBranchId || undefined,
      });
      setSchedules(response.data || []);
    } catch {
      setSchedules([]);
      showFeedback('error', 'Gagal Memuat Jadwal', 'Jadwal kasir belum bisa dimuat. Pastikan backend sudah terdeploy.');
    } finally {
      setScheduleLoading(false);
    }
  };

  useEffect(() => {
    setPageLoading(true);
    loadUsers();
  }, [activeBranchId]);

  useEffect(() => {
    loadSchedules();
  }, [dateRange.start, dateRange.end, activeBranchId]);

  useEffect(() => {
    if (!scheduleModal || !scheduleForm.work_date) {
      setScheduleConflicts([]);
      return;
    }

    let cancelled = false;
    const loadConflicts = async () => {
      setConflictLoading(true);
      try {
        const response = await getCashierSchedules({
          date_from: scheduleForm.work_date,
          date_to: scheduleForm.work_date,
          include_all_branches_for_conflict: 1,
        });
        if (!cancelled) setScheduleConflicts(response.data || []);
      } catch {
        if (!cancelled) setScheduleConflicts([]);
      } finally {
        if (!cancelled) setConflictLoading(false);
      }
    };

    loadConflicts();
    return () => {
      cancelled = true;
    };
  }, [scheduleModal, scheduleForm.work_date]);

  const openScheduleModal = (schedule = null, day = null) => {
    setEditingSchedule(schedule);
    setScheduleForm(schedule ? {
      user_id: String(schedule.user_id || ''),
      work_date: String(schedule.work_date || '').slice(0, 10),
      start_time: schedule.start_time || '09:00',
      end_time: schedule.end_time || '17:00',
      shift_name: schedule.shift_name || 'Shift Kasir',
      status: schedule.status || 'scheduled',
      note: schedule.note || '',
    } : {
      ...emptyScheduleForm,
      user_id: cashiers[0]?.id ? String(cashiers[0].id) : '',
      work_date: day || dateRange.start || todayKey,
    });
    setScheduleModal(true);
  };

  const handleUserSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await registerUser({ ...form, default_branch_id: activeBranchId || undefined, branch_id: activeBranchId || undefined });
      await loadUsers();
      setUserModal(false);
      setForm(emptyUserForm);
      showFeedback('success', 'Kasir Ditambahkan', 'Akun kasir baru berhasil dibuat.');
    } catch (err) {
      showFeedback('error', 'Gagal Menambah Kasir', err.response?.data?.message || 'Akun kasir belum bisa dibuat.');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleSubmit = async (event) => {
    event.preventDefault();
    if (selectedConflict) {
      showFeedback(
        'error',
        'Kasir Sudah Dijadwalkan',
        `Kasir ini sudah ditempatkan di ${selectedConflict.branch_name || 'cabang lain'} pada tanggal ${formatDate(scheduleForm.work_date)}.`
      );
      return;
    }
    setScheduleSaving(true);
    try {
      const payload = {
        ...scheduleForm,
        user_id: Number(scheduleForm.user_id),
        branch_id: activeBranchId || undefined,
      };
      if (editingSchedule) {
        await updateCashierSchedule(editingSchedule.id, payload);
        showFeedback('success', 'Jadwal Diperbarui', 'Jadwal kasir berhasil diperbarui.');
      } else {
        await createCashierSchedule(payload);
        showFeedback('success', 'Jadwal Dibuat', 'Jadwal kasir berhasil dibuat.');
      }
      await loadSchedules();
      setScheduleModal(false);
      setEditingSchedule(null);
    } catch (err) {
      showFeedback('error', 'Gagal Menyimpan Jadwal', err.response?.data?.message || 'Jadwal kasir belum bisa disimpan.');
    } finally {
      setScheduleSaving(false);
    }
  };

  const handleDeleteSchedule = async () => {
    if (!deleteTarget) return;
    setScheduleSaving(true);
    try {
      await deleteCashierSchedule(deleteTarget.id);
      await loadSchedules();
      setDeleteTarget(null);
      showFeedback('success', 'Jadwal Dihapus', 'Jadwal kasir berhasil dihapus.');
    } catch (err) {
      showFeedback('error', 'Gagal Menghapus Jadwal', err.response?.data?.message || 'Jadwal kasir belum bisa dihapus.');
    } finally {
      setScheduleSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl space-y-6 pb-8" data-tour="users-page">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between" data-tour="users-header">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-400">Team Management</p>
            <h1 className="mt-2 text-3xl font-black text-white">Manajemen Kasir</h1>
            <p className="mt-2 text-sm text-slate-400">
              Kelola akun kasir global, role, dan penempatan jadwal kerja per cabang.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row" data-tour="users-actions">
            <button
              type="button"
              onClick={() => openScheduleModal()}
              className="rounded-xl border border-orange-500/35 bg-orange-500/10 px-5 py-3 text-sm font-black text-orange-200 transition hover:bg-orange-500/20"
              data-tour="users-add-schedule-button"
              data-tour-action="users-open-schedule-modal"
            >
              + Tambah Jadwal
            </button>
            <button
              type="button"
              onClick={() => setUserModal(true)}
              className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-white transition hover:bg-orange-600"
              data-tour="users-add-button"
              data-tour-action="users-open-user-modal"
            >
              + Tambah Kasir
            </button>
          </div>
        </div>

        {message && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
              message.type === 'success'
                ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-100'
                : 'border-red-500/25 bg-red-500/10 text-red-100'
            }`}
            data-tour="users-feedback"
          >
            <span className="font-black">{message.title}</span> - {message.detail}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3" data-tour="users-stats">
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Total User</p>
            <p className="mt-3 text-3xl font-black text-white">{users.length}</p>
            <p className="mt-1 text-sm text-slate-500">Admin dan kasir global</p>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Kasir</p>
            <p className="mt-3 text-3xl font-black text-blue-300">{cashiers.length}</p>
            <p className="mt-1 text-sm text-slate-500">Akun kasir aktif di sistem</p>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Jadwal Range</p>
            <p className="mt-3 text-3xl font-black text-orange-300">{activeSchedules.length}</p>
            <p className="mt-1 text-sm text-slate-500">Shift terjadwal pada filter</p>
          </div>
        </div>

        <section className="rounded-3xl border border-slate-700 bg-slate-900/70 p-5" data-tour="users-schedule-panel">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-400">Jadwal Kasir</p>
              <h2 className="mt-2 text-2xl font-black text-white">Calendar Event Shift</h2>
              <p className="mt-1 text-sm text-slate-400">
                Penempatan jadwal untuk {activeBranchName}. Satu kasir tidak bisa ditempatkan di dua cabang pada tanggal yang sama.
              </p>
            </div>
            <div className="w-full lg:w-[360px]" data-tour="users-schedule-filter">
              <DateRangePicker
                label="Range jadwal"
                value={dateRange}
                onChange={setDateRange}
                onClear={() => setDateRange({ start: todayKey, end: todayKey })}
                placeholder="Pilih range jadwal"
              />
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" data-tour="users-calendar">
            {scheduleLoading ? (
              <div className="col-span-full">
                <TableSkeleton rows={3} cols={4} />
              </div>
            ) : calendarDays.map((day) => {
              const daySchedules = schedulesByDate[day] || [];
              return (
                <article key={day} className="min-h-52 rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{formatDayName(day)}</p>
                      <h3 className="mt-1 text-lg font-black text-white">{formatDate(day, { day: 'numeric', month: 'short' })}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => openScheduleModal(null, day)}
                      className="rounded-xl border border-orange-500/25 px-3 py-1.5 text-xs font-black text-orange-300 transition hover:bg-orange-500/10"
                    >
                      + Shift
                    </button>
                  </div>

                  <div className="mt-4 space-y-2" data-tour={day === calendarDays[0] ? 'users-schedule-card' : undefined}>
                    {daySchedules.length ? daySchedules.map((schedule) => {
                      const statusMeta = getStatusMeta(schedule.status);
                      return (
                        <div key={schedule.id} className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-black text-white">{schedule.user_name}</p>
                              <p className="mt-0.5 text-xs font-semibold text-orange-200">{schedule.start_time} - {schedule.end_time}</p>
                            </div>
                            <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-black ${statusMeta.className}`}>
                              {statusMeta.label}
                            </span>
                          </div>
                          <p className="mt-2 text-xs font-bold text-slate-300">{schedule.shift_name || 'Shift Kasir'}</p>
                          {schedule.note && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{schedule.note}</p>}
                          <div className="mt-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() => openScheduleModal(schedule)}
                              className="flex-1 rounded-xl bg-slate-800 px-3 py-2 text-xs font-bold text-slate-200 transition hover:bg-slate-700"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(schedule)}
                              className="flex-1 rounded-xl bg-red-500/15 px-3 py-2 text-xs font-bold text-red-200 transition hover:bg-red-500/25"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      );
                    }) : (
                      <p className="rounded-2xl border border-dashed border-slate-700 px-3 py-6 text-center text-sm text-slate-500">
                        Belum ada shift
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-700 bg-slate-900/70 p-5" data-tour="users-table-section">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Daftar Akun</p>
              <h2 className="mt-1 text-xl font-black text-white">Tim Admin & Kasir</h2>
            </div>
            <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-bold text-slate-400">{users.length} user</span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-700" data-tour="users-table">
            {pageLoading ? (
              <TableSkeleton rows={5} cols={5} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 bg-slate-950/40">
                      <th className="px-4 py-3 text-left font-bold text-slate-400">Nama</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-400">Email</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-400">Role</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-400">Cabang</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-400">Dibuat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-slate-700/50 hover:bg-slate-800/45">
                        <td className="px-4 py-3 font-black text-white">{user.name}</td>
                        <td className="px-4 py-3 text-slate-400">{user.email}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-lg px-2 py-1 text-xs font-black ${
                            user.role === 'admin' ? 'bg-orange-500/20 text-orange-300' : 'bg-blue-500/20 text-blue-300'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400">{user.branch_name || '-'}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{formatDate(user.created_at)}</td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-slate-500">Belum ada data</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>

      {userModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6" data-tour="users-add-modal">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-xl font-black text-white">Tambah Kasir</h2>
              <button type="button" onClick={() => setUserModal(false)} className="text-2xl text-slate-500 hover:text-white" data-tour-action="users-close-user-modal">x</button>
            </div>
            <form onSubmit={handleUserSubmit} className="space-y-4">
              {[
                { label: 'Nama', key: 'name', type: 'text', ph: 'Budi Santoso', tour: 'users-form-name' },
                { label: 'Email', key: 'email', type: 'email', ph: 'budi@kebab.com', tour: 'users-form-email' },
                { label: 'Password', key: 'password', type: 'password', ph: 'Minimal 6 karakter', tour: 'users-form-password' },
              ].map((field) => (
                <div key={field.key} data-tour={field.tour}>
                  <label className="text-sm font-semibold text-slate-400">{field.label}</label>
                  <input
                    type={field.type}
                    value={form[field.key]}
                    onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}
                    required
                    placeholder={field.ph}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-orange-500"
                  />
                </div>
              ))}
              <div data-tour="users-form-role">
                <label className="text-sm font-semibold text-slate-400">Role</label>
                <select
                  value={form.role}
                  onChange={(event) => setForm({ ...form, role: event.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-orange-500"
                >
                  <option value="kasir">Kasir</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2" data-tour="users-form-actions">
                <button type="button" onClick={() => setUserModal(false)} className="flex-1 rounded-xl bg-slate-800 py-3 text-white transition hover:bg-slate-700">
                  Batal
                </button>
                <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-orange-500 py-3 font-black text-white transition hover:bg-orange-600 disabled:opacity-50" data-tour="users-save-button">
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {scheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-6" data-tour="users-schedule-modal">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-400">Schedule Form</p>
                <h2 className="mt-1 text-xl font-black text-white">{editingSchedule ? 'Edit Jadwal Kasir' : 'Tambah Jadwal Kasir'}</h2>
                <p className="mt-1 text-xs font-semibold text-slate-400">
                  Penempatan cabang: <span className="text-orange-300">{activeBranchName}</span>
                </p>
              </div>
              <button type="button" onClick={() => setScheduleModal(false)} className="text-2xl text-slate-500 hover:text-white" data-tour-action="users-close-schedule-modal">x</button>
            </div>
            <form onSubmit={handleScheduleSubmit} className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2" data-tour="users-schedule-user-field">
                <label className="text-sm font-semibold text-slate-400">Kasir</label>
                <select
                  value={scheduleForm.user_id}
                  onChange={(event) => setScheduleForm({ ...scheduleForm, user_id: event.target.value })}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-orange-500"
                >
                  <option value="">Pilih kasir</option>
                  {cashiers.map((cashier) => (
                    <option
                      key={cashier.id}
                      value={cashier.id}
                      disabled={Boolean(conflictByUser[Number(cashier.id)])}
                    >
                      {cashier.name}
                      {conflictByUser[Number(cashier.id)]
                        ? ` - sudah di ${conflictByUser[Number(cashier.id)].branch_name || 'cabang lain'}`
                        : ''}
                    </option>
                  ))}
                </select>
                {conflictLoading && (
                  <p className="mt-2 text-xs font-semibold text-sky-300">Mengecek penempatan kasir pada tanggal ini...</p>
                )}
                {selectedConflict && (
                  <p className="mt-2 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200">
                    Kasir ini sudah ditempatkan di {selectedConflict.branch_name || 'cabang lain'} pada {formatDate(scheduleForm.work_date)}.
                  </p>
                )}
                {!selectedConflict && scheduleConflicts.length > 0 && (
                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    Beberapa kasir dinonaktifkan karena sudah punya penempatan pada tanggal ini.
                  </p>
                )}
              </div>
              <div data-tour="users-schedule-date-field">
                <label className="text-sm font-semibold text-slate-400">Tanggal</label>
                <input
                  type="date"
                  value={scheduleForm.work_date}
                  onChange={(event) => setScheduleForm({ ...scheduleForm, work_date: event.target.value })}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-orange-500"
                />
              </div>
              <div data-tour="users-schedule-status-field">
                <label className="text-sm font-semibold text-slate-400">Status</label>
                <select
                  value={scheduleForm.status}
                  onChange={(event) => setScheduleForm({ ...scheduleForm, status: event.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-orange-500"
                >
                  {statusOptions.map((status) => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>
              <div data-tour="users-schedule-time-field">
                <label className="text-sm font-semibold text-slate-400">Jam Mulai</label>
                <input
                  type="time"
                  value={scheduleForm.start_time}
                  onChange={(event) => setScheduleForm({ ...scheduleForm, start_time: event.target.value })}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-orange-500"
                />
              </div>
              <div data-tour="users-schedule-time-field">
                <label className="text-sm font-semibold text-slate-400">Jam Selesai</label>
                <input
                  type="time"
                  value={scheduleForm.end_time}
                  onChange={(event) => setScheduleForm({ ...scheduleForm, end_time: event.target.value })}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-orange-500"
                />
              </div>
              <div className="sm:col-span-2" data-tour="users-schedule-shift-field">
                <label className="text-sm font-semibold text-slate-400">Nama Shift</label>
                <input
                  value={scheduleForm.shift_name}
                  onChange={(event) => setScheduleForm({ ...scheduleForm, shift_name: event.target.value })}
                  placeholder="Shift Pagi"
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-orange-500"
                />
              </div>
              <div className="sm:col-span-2" data-tour="users-schedule-note-field">
                <label className="text-sm font-semibold text-slate-400">Catatan</label>
                <textarea
                  value={scheduleForm.note}
                  onChange={(event) => setScheduleForm({ ...scheduleForm, note: event.target.value })}
                  placeholder="Contoh: handle POS cabang Dago"
                  className="mt-1 min-h-24 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-orange-500"
                />
              </div>
              <div className="flex gap-3 pt-2 sm:col-span-2" data-tour="users-schedule-actions">
                <button type="button" onClick={() => setScheduleModal(false)} className="flex-1 rounded-xl bg-slate-800 py-3 text-white transition hover:bg-slate-700">
                  Batal
                </button>
                <button type="submit" disabled={scheduleSaving || Boolean(selectedConflict)} className="flex-1 rounded-xl bg-orange-500 py-3 font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50" data-tour="users-schedule-save-button">
                  {scheduleSaving ? 'Menyimpan...' : editingSchedule ? 'Update Jadwal' : 'Simpan Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
          <div className="w-full max-w-sm rounded-3xl border border-red-500/25 bg-slate-900 p-6">
            <h2 className="text-xl font-black text-white">Hapus Jadwal?</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Jadwal {deleteTarget.user_name} pada {formatDate(deleteTarget.work_date)} akan dihapus permanen.
            </p>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setDeleteTarget(null)} className="flex-1 rounded-xl bg-slate-800 py-3 text-white transition hover:bg-slate-700">
                Batal
              </button>
              <button type="button" onClick={handleDeleteSchedule} disabled={scheduleSaving} className="flex-1 rounded-xl bg-red-500 py-3 font-black text-white transition hover:bg-red-600 disabled:opacity-50">
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
