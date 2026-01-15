import { env } from "@/lib/env";

type AfipIssueInput = {
  pointOfSale: string;
  invoiceType: "A" | "B" | "C";
  total: number;
  net: number;
  tax: number;
  customerDocType: number;
  customerDocNumber: string;
};

type AfipIssueResult = {
  cae: string;
  caeDueAt: Date;
  receiptNumber: string;
};

const ensureAfipConfig = () => {
  if (!env.AFIP_ENABLED) {
    throw new Error("AFIP not enabled");
  }
  if (
    !env.AFIP_CUIT ||
    !env.AFIP_POINT_OF_SALE ||
    !env.AFIP_CERT_BASE64 ||
    !env.AFIP_KEY_BASE64
  ) {
    throw new Error("AFIP configuration missing");
  }
};

const generateMockCAE = () => {
  const now = new Date();
  const expires = new Date(now);
  expires.setDate(expires.getDate() + 10);
  return {
    cae: `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
      now.getDate(),
    ).padStart(2, "0")}${Math.floor(Math.random() * 1e6)
      .toString()
      .padStart(6, "0")}`,
    caeDueAt: expires,
    receiptNumber: `${now.getFullYear()}${Math.floor(Math.random() * 1e8)
      .toString()
      .padStart(8, "0")}`,
  };
};

export const issueAfipInvoice = async (
  _input: AfipIssueInput,
): Promise<AfipIssueResult> => {
  ensureAfipConfig();

  if (env.AFIP_ENV === "test" || env.NODE_ENV !== "production") {
    return generateMockCAE();
  }

  throw new Error("AFIP production integration not configured");
};
