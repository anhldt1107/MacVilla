import { useLocation } from "react-router-dom";

/**
 * Tiền tố route Admin / Manager / Saler cho cùng API `/api/admin/*` (Staff).
 * @returns {{
 *   shell: "admin" | "manager" | "saler";
 *   root: string;
 *   sales: string;
 *   quotesList: string;
 *   ordersList: string;
 *   customersList: string;
 *   contractsList: string;
 *   accounting: string;
 *   invoicesList: string;
 *   paymentsList: string;
 *   transferNotificationsList: string;
 *   fulfillmentsList: string | null;
 *   returnsList: string;
 *   warrantyTicketsList: string;
 * }}
 */
export function useStaffShellPaths() {
  const { pathname } = useLocation();
  const pathLower = pathname.toLowerCase();
  if (pathLower.startsWith("/manager")) {
    const root = "/manager";
    const sales = `${root}/sales`;
    return {
      shell: "manager",
      root,
      sales,
      quotesList: `${sales}/quotations`,
      ordersList: `${sales}/orders`,
      customersList: `${sales}/customers`,
      contractsList: `${sales}/contracts`,
      accounting: `${root}/accounting`,
      invoicesList: `${root}/accounting/invoices`,
      paymentsList: `${root}/accounting/payments`,
      transferNotificationsList: `${root}/accounting/transfer-notifications`,
      fulfillmentsList: `${root}/logistics/fulfillments`,
      returnsList: `${root}/after-sales/returns`,
      warrantyTicketsList: `${root}/after-sales/warranty`,
    };
  }
  if (pathLower.startsWith("/saler")) {
    const root = "/saler";
    return {
      shell: "saler",
      root,
      sales: root,
      quotesList: `${root}/quotations`,
      ordersList: `${root}/orders`,
      customersList: `${root}/customers`,
      contractsList: `${root}/contracts`,
      accounting: root,
      invoicesList: `${root}/invoices`,
      paymentsList: `${root}/payments`,
      transferNotificationsList: `${root}/transfer-notifications`,
      fulfillmentsList: null,
      returnsList: `${root}/returns`,
      warrantyTicketsList: `${root}/warranty`,
    };
  }
  const root = "/admin";
  const sales = `${root}/sales`;
  return {
    shell: "admin",
    root,
    sales,
    quotesList: `${sales}/quotations-b2b`,
    ordersList: `${sales}/orders`,
    customersList: `${sales}/customers`,
    contractsList: `${sales}/contracts`,
    accounting: `${root}/accounting`,
    invoicesList: `${root}/accounting/invoices`,
    paymentsList: `${root}/accounting/payments`,
    transferNotificationsList: `${root}/accounting/transfer-notifications`,
    fulfillmentsList: `${root}/logistics/fulfillments`,
    returnsList: `${root}/after-sales/returns`,
    warrantyTicketsList: `${root}/after-sales/warranty`,
  };
}
