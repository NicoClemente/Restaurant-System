"use client";

export const PrintButton = () => {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
    >
      Imprimir
    </button>
  );
};
