"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Circle,
  CircleAlert,
  CircleDotDashed,
  CircleX,
} from "lucide-react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";

const fallbackTasks = [
  {
    id: "1",
    title: "Pahami pertanyaan user",
    description: "Mengidentifikasi topik, periode, dan data bisnis yang diperlukan.",
    status: "in-progress",
    priority: "high",
    dependencies: [],
    subtasks: [
      {
        id: "1.1",
        title: "Ekstrak intent prompt",
        description: "Membaca apakah user bertanya revenue, stok, profit, produk, atau performa karyawan.",
        status: "completed",
        priority: "high",
        tools: ["prompt-parser"],
      },
      {
        id: "1.2",
        title: "Tentukan konteks bisnis",
        description: "Menentukan cabang, periode, dan metrik yang relevan untuk jawaban.",
        status: "in-progress",
        priority: "medium",
        tools: ["business-context"],
      },
    ],
  },
  {
    id: "2",
    title: "Ambil data operasional",
    description: "Menyiapkan data transaksi, stok, dan laporan yang tersedia dari sistem POS.",
    status: "pending",
    priority: "high",
    dependencies: ["1"],
    subtasks: [
      {
        id: "2.1",
        title: "Baca ringkasan transaksi",
        description: "Memeriksa omzet, margin, jumlah transaksi, dan produk terkait.",
        status: "pending",
        priority: "high",
        tools: ["reports-api", "sales-context"],
      },
    ],
  },
  {
    id: "3",
    title: "Susun jawaban dan rekomendasi",
    description: "Mengubah data menjadi insight ringkas yang bisa langsung ditindaklanjuti.",
    status: "pending",
    priority: "medium",
    dependencies: ["1", "2"],
    subtasks: [
      {
        id: "3.1",
        title: "Buat insight",
        description: "Menjelaskan angka penting, risiko, peluang, dan tindakan berikutnya.",
        status: "pending",
        priority: "medium",
        tools: ["ai-analysis"],
      },
    ],
  },
];

const statusMeta = {
  completed: {
    label: "Selesai",
    icon: CheckCircle2,
    iconClass: "text-emerald-400",
    badgeClass: "bg-emerald-400/10 text-emerald-200 border-emerald-400/25",
  },
  "in-progress": {
    label: "Berjalan",
    icon: CircleDotDashed,
    iconClass: "text-cyan-300",
    badgeClass: "bg-cyan-400/10 text-cyan-200 border-cyan-400/25",
  },
  "need-help": {
    label: "Butuh cek",
    icon: CircleAlert,
    iconClass: "text-yellow-300",
    badgeClass: "bg-yellow-400/10 text-yellow-200 border-yellow-400/25",
  },
  failed: {
    label: "Gagal",
    icon: CircleX,
    iconClass: "text-red-300",
    badgeClass: "bg-red-400/10 text-red-200 border-red-400/25",
  },
  pending: {
    label: "Menunggu",
    icon: Circle,
    iconClass: "text-slate-500",
    badgeClass: "bg-slate-700/70 text-slate-300 border-slate-600",
  },
};

function normalizeTasks(tasks) {
  const source = Array.isArray(tasks) && tasks.length > 0 ? tasks : fallbackTasks;
  return source.map((task, taskIndex) => ({
    ...task,
    id: String(task.id || taskIndex + 1),
    dependencies: Array.isArray(task.dependencies) ? task.dependencies : [],
    subtasks: Array.isArray(task.subtasks)
      ? task.subtasks.map((subtask, subtaskIndex) => ({
          ...subtask,
          id: String(subtask.id || `${taskIndex + 1}.${subtaskIndex + 1}`),
          tools: Array.isArray(subtask.tools) ? subtask.tools : [],
        }))
      : [],
  }));
}

function PlanIcon({ status, small = false }) {
  const meta = statusMeta[status] || statusMeta.pending;
  const Icon = meta.icon;
  return <Icon className={`${small ? "h-3.5 w-3.5" : "h-[18px] w-[18px]"} ${meta.iconClass}`} />;
}

export default function AgentPlan({
  title = "Rencana Analisis AI",
  description = "Ringkasan langkah yang dipakai AI untuk menjawab prompt ini.",
  prompt = "",
  tasks = fallbackTasks,
  compact = false,
}) {
  const normalizedTasks = useMemo(() => normalizeTasks(tasks), [tasks]);
  const [expandedTasks, setExpandedTasks] = useState(() =>
    normalizedTasks.slice(0, compact ? 1 : 2).map((task) => task.id)
  );
  const [expandedSubtasks, setExpandedSubtasks] = useState({});

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const toggleTaskExpansion = (taskId) => {
    setExpandedTasks((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const toggleSubtaskExpansion = (taskId, subtaskId) => {
    const key = `${taskId}-${subtaskId}`;
    setExpandedSubtasks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const taskVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : -5 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: prefersReducedMotion ? "tween" : "spring",
        stiffness: 500,
        damping: 30,
        duration: prefersReducedMotion ? 0.2 : undefined,
      },
    },
  };

  const subtaskListVariants = {
    hidden: { opacity: 0, height: 0, overflow: "hidden" },
    visible: {
      height: "auto",
      opacity: 1,
      overflow: "visible",
      transition: {
        duration: 0.25,
        staggerChildren: prefersReducedMotion ? 0 : 0.04,
        when: "beforeChildren",
        ease: [0.2, 0.65, 0.3, 0.9],
      },
    },
    exit: {
      height: 0,
      opacity: 0,
      overflow: "hidden",
      transition: { duration: 0.18, ease: [0.2, 0.65, 0.3, 0.9] },
    },
  };

  const subtaskVariants = {
    hidden: { opacity: 0, x: prefersReducedMotion ? 0 : -10 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: prefersReducedMotion ? "tween" : "spring",
        stiffness: 500,
        damping: 25,
        duration: prefersReducedMotion ? 0.2 : undefined,
      },
    },
  };

  return (
    <motion.div
      className="agent-plan overflow-hidden rounded-xl border border-cyan-300/20 bg-slate-950/78 text-slate-100 shadow-2xl shadow-cyan-950/20"
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.2, 0.65, 0.3, 0.9] }}
    >
      <div className="border-b border-cyan-300/10 bg-cyan-300/[0.04] px-3.5 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200/70">
              Thinking Process
            </p>
            <h4 className="mt-1 text-sm font-black text-white">{title}</h4>
            <p className="mt-1 text-xs leading-5 text-slate-400">{description}</p>
          </div>
          <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-[10px] font-bold text-cyan-100">
            {normalizedTasks.length} step
          </div>
        </div>
        {prompt && (
          <div className="mt-3 rounded-lg border border-slate-700/80 bg-slate-900/80 px-3 py-2 text-xs text-slate-300">
            <span className="font-bold text-cyan-200">Prompt:</span> {prompt}
          </div>
        )}
      </div>

      <LayoutGroup>
        <ul className="space-y-1 p-2.5">
          {normalizedTasks.map((task, index) => {
            const isExpanded = expandedTasks.includes(task.id);
            const meta = statusMeta[task.status] || statusMeta.pending;

            return (
              <motion.li
                key={task.id}
                initial="hidden"
                animate="visible"
                variants={taskVariants}
                className={index !== 0 ? "pt-1" : ""}
              >
                <motion.button
                  type="button"
                  className="group flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition hover:bg-white/[0.03]"
                  onClick={() => toggleTaskExpansion(task.id)}
                  whileTap={{ scale: 0.99 }}
                >
                  <PlanIcon status={task.status} />
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-sm font-semibold text-slate-100">{task.title}</span>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${meta.badgeClass}`}>
                        {meta.label}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{task.description}</p>
                  </div>
                  {task.dependencies.length > 0 && (
                    <div className="hidden shrink-0 flex-wrap gap-1 sm:flex">
                      {task.dependencies.map((dep) => (
                        <span key={dep} className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                          dep {dep}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.button>

                <AnimatePresence mode="wait">
                  {isExpanded && task.subtasks.length > 0 && (
                    <motion.div
                      className="relative overflow-hidden"
                      variants={subtaskListVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                    >
                      <div className="absolute bottom-1 top-0 left-[18px] border-l border-dashed border-cyan-200/20" />
                      <ul className="ml-4 space-y-1 pb-1 pl-4">
                        {task.subtasks.map((subtask) => {
                          const key = `${task.id}-${subtask.id}`;
                          const isSubtaskExpanded = expandedSubtasks[key];
                          const subMeta = statusMeta[subtask.status] || statusMeta.pending;

                          return (
                            <motion.li key={subtask.id} variants={subtaskVariants} layout>
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-white/[0.03]"
                                onClick={() => toggleSubtaskExpansion(task.id, subtask.id)}
                              >
                                <PlanIcon status={subtask.status} small />
                                <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-200">
                                  {subtask.title}
                                </span>
                                <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${subMeta.badgeClass}`}>
                                  {subMeta.label}
                                </span>
                              </button>

                              <AnimatePresence mode="wait">
                                {isSubtaskExpanded && (
                                  <motion.div
                                    className="ml-5 overflow-hidden border-l border-dashed border-slate-700 py-1 pl-3 text-xs text-slate-400"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <p>{subtask.description}</p>
                                    {subtask.tools?.length > 0 && (
                                      <div className="mt-2 flex flex-wrap gap-1">
                                        {subtask.tools.map((tool) => (
                                          <span
                                            key={tool}
                                            className="rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-2 py-0.5 text-[10px] text-cyan-100/80"
                                          >
                                            {tool}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.li>
                          );
                        })}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.li>
            );
          })}
        </ul>
      </LayoutGroup>
    </motion.div>
  );
}
