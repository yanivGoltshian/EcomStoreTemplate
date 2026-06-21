"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { Category } from "@/lib/types";

export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  dir,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  dir?: "rtl" | "ltr";
  hint?: string;
}) {
  return (
    <label className="block">
      {label ? (
        <span className="mb-1 block text-sm font-semibold text-heading">
          {label}
        </span>
      ) : null}
      <input
        type={type}
        value={value}
        dir={dir}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-base text-gray-900 shadow-sm outline-none focus:border-brand-red focus:ring-2 focus:ring-red-100 sm:py-2 sm:text-sm"
      />
      {hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  rows = 5,
  dir,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  dir?: "rtl" | "ltr";
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-heading">
        {label}
      </span>
      <textarea
        value={value}
        rows={rows}
        dir={dir}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-base text-gray-900 shadow-sm outline-none focus:border-brand-red focus:ring-2 focus:ring-red-100 sm:py-2 sm:text-sm"
      />
    </label>
  );
}

export function RichTextArea({
  label,
  value,
  onChange,
  dir = "rtl",
  minRows = 6,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  dir?: "rtl" | "ltr";
  minRows?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Initialise to a sentinel (not `value`) so the very first effect run always
  // paints the incoming value into the DOM. Initialising to `value` made the
  // mount paint a no-op, leaving existing descriptions blank in the editor.
  const last = useRef<string | null>(null);

  // Push external value into the editable DOM only when it changes from the
  // outside (e.g. mounting, or opening a different product). This avoids the
  // caret jumping to the start on every keystroke that a naive controlled
  // contentEditable has.
  useEffect(() => {
    const el = ref.current;
    if (el && value !== last.current) {
      el.innerHTML = value || "";
      last.current = value;
    }
  }, [value]);

  const emit = () => {
    const html = ref.current?.innerHTML ?? "";
    last.current = html;
    onChange(html);
  };

  const run = (command: string, arg?: string) => {
    ref.current?.focus();
    try {
      document.execCommand(command, false, arg);
    } catch {
      /* execCommand is best-effort */
    }
    emit();
  };

  const tools: { title: string; cmd: string; label: ReactNode }[] = [
    { title: "מודגש", cmd: "bold", label: <span className="font-bold">B</span> },
    { title: "נטוי", cmd: "italic", label: <span className="italic">I</span> },
    { title: "קו תחתון", cmd: "underline", label: <span className="underline">U</span> },
    { title: "רשימת תבליטים", cmd: "insertUnorderedList", label: "•" },
    { title: "רשימה ממוספרת", cmd: "insertOrderedList", label: "1." },
    { title: "נקה עיצוב", cmd: "removeFormat", label: "⌫" },
  ];

  return (
    <div className="block">
      <span className="mb-1 block text-sm font-semibold text-heading">{label}</span>
      <div className="overflow-hidden rounded-lg border border-line bg-white shadow-sm focus-within:border-brand-red focus-within:ring-2 focus-within:ring-red-100">
        <div
          dir="rtl"
          className="flex flex-wrap items-center gap-1 border-b border-line bg-gray-50 px-2 py-1.5"
        >
          {tools.map((t) => (
            <button
              key={t.cmd}
              type="button"
              title={t.title}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => run(t.cmd)}
              className="flex h-7 min-w-7 items-center justify-center rounded px-1.5 text-sm text-heading hover:bg-gray-200"
            >
              {t.label}
            </button>
          ))}
        </div>
        <div
          ref={ref}
          contentEditable
          dir={dir}
          suppressContentEditableWarning
          onInput={emit}
          onBlur={emit}
          style={{ minHeight: `${minRows * 1.6}rem` }}
          className="admin-rte w-full overflow-y-auto px-3 py-2.5 text-base leading-relaxed text-gray-900 outline-none sm:text-sm [&_a]:text-brand-red [&_a]:underline [&_b]:font-bold [&_li]:my-0.5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pr-6 [&_strong]:font-bold [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pr-6"
        />
      </div>
    </div>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 accent-brand-red"
      />
      <span className="text-sm font-semibold text-heading">{label}</span>
    </label>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "blue" | "ghost" | "danger" | "subtle";
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const styles: Record<string, string> = {
    primary: "bg-brand-red text-white hover:bg-brand-red-dark",
    blue: "bg-brand-blue text-white hover:bg-brand-blue-dark",
    danger: "bg-white text-brand-red border border-red-200 hover:bg-red-50",
    ghost: "bg-white text-heading border border-line hover:bg-soft",
    subtle: "bg-soft text-heading border border-line hover:bg-line",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-[2.75rem] items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold shadow-sm transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-0 ${styles[variant]}`}
    >
      {children}
    </button>
  );
}

export function CategorySelect({
  label,
  value,
  onChange,
  categories,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  categories: Category[];
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-heading">
        {label}
      </span>
      <select
        value={String(value || 0)}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-base text-gray-900 shadow-sm outline-none focus:border-brand-red focus:ring-2 focus:ring-red-100 sm:py-2 sm:text-sm"
      >
        <option value="0">— ללא —</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} (#{c.id})
          </option>
        ))}
      </select>
    </label>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-line bg-white p-4 shadow-card sm:p-5 ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionCard({
  title,
  action,
  children,
}: {
  title: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-extrabold text-heading sm:text-lg">{title}</h2>
        {action}
      </div>
      {children}
    </Card>
  );
}

export type ToastState = { msg: string; ok: boolean } | null;

export function Toast({ toast }: { toast: ToastState }) {
  if (!toast) return null;
  return (
    <div
      className={`fixed bottom-5 left-1/2 z-[60] max-w-[92vw] -translate-x-1/2 rounded-xl px-5 py-3 text-center text-sm font-bold text-white shadow-pop ${
        toast.ok ? "bg-emerald-600" : "bg-brand-red"
      }`}
      role="status"
    >
      {toast.msg}
    </div>
  );
}
