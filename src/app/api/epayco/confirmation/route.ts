import { NextResponse } from "next/server";
import { findOrderByInvoice, updateOrder, verifyEpaycoSignature } from "@/lib/orders";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const value = (name: string) => String(form.get(name) ?? "");
    const invoice = value("x_extra1") || value("x_id_invoice");
    const order = findOrderByInvoice(invoice);
    if (!order) return NextResponse.json({ error: "Orden no encontrada." }, { status: 404 });
    if (order.status === "PAID") return NextResponse.json({ ok: true, duplicate: true });

    const validSignature = verifyEpaycoSignature({
      signature: value("x_signature"),
      refPayco: value("x_ref_payco"),
      transactionId: value("x_transaction_id"),
      amount: value("x_amount"),
      currency: value("x_currency"),
    });
    const amountMatches = Number(value("x_amount")) === order.total;
    const currencyMatches = value("x_currency").toUpperCase() === order.currency;
    if (!validSignature || !amountMatches || !currencyMatches) {
      return NextResponse.json({ error: "Confirmación inválida." }, { status: 400 });
    }

    const state = value("x_transaction_state");
    const status = state === "Aceptada" ? "PAID" : state === "Rechazada" ? "FAILED" : "PENDING";
    updateOrder(order.id, {
      status,
      epayco: { refPayco: value("x_ref_payco"), transactionId: value("x_transaction_id"), state },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No fue posible procesar la confirmación." }, { status: 400 });
  }
}
