"use client";

import { useTransition } from "react";

import { issueInvoiceForOrder } from "@/actions/billing";

type Props = {
  orderId: string;
  status: "DRAFT" | "ISSUED" | "VOIDED";
};

export const IssueInvoiceButton = ({ orderId, status }: Props) => {
  const [isPending, startTransition] = useTransition();

  if (status !== "DRAFT") {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() =>
        startTransition(async () => {
          await issueInvoiceForOrder(orderId);
        })
      }
      className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      disabled={isPending}
    >
      {isPending ? "Emitiendo..." : "Emitir AFIP"}
    </button>
  );
};
