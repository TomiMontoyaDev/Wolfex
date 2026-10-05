import { z } from "zod";
import { COLOMBIA } from "@/data/colombia";

/** Quita caracteres de control y colapsa espacios. */
const clean = (max: number, message = "Dato inválido.") =>
  z
    .string({ error: message })
    .transform((value) => value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim())
    .pipe(z.string().max(max));

const required = (max: number, message: string) => clean(max, message).pipe(z.string().min(1, message));
const optional = (max: number) =>
  clean(max)
    .optional()
    .transform((value) => value || undefined);

/** Datos para la factura electrónica (opcional). Todos obligatorios cuando el cliente la pide. */
export const invoiceSchema = z
  .object({
    personType: z.enum(["NATURAL", "JURIDICA"], { error: "Elige el tipo de persona." }),
    docType: z.enum(["CC", "NIT", "CE", "PASAPORTE"], { error: "Elige el tipo de documento." }),
    docNumber: required(20, "Ingresa el número de documento."),
    dv: optional(1),
    legalName: required(160, "Ingresa el nombre completo o la razón social.").pipe(z.string().min(3, "Ingresa el nombre completo o la razón social.")),
    email: clean(160, "Ingresa el correo para la factura.").pipe(z.email("Correo de facturación inválido.")).transform((email) => email.toLowerCase()),
    address: required(240, "Ingresa la dirección de facturación."),
    city: required(80, "Ingresa la ciudad de facturación."),
    department: required(80, "Selecciona el departamento de facturación.").refine((value) => Object.hasOwn(COLOMBIA, value), "Departamento de facturación inválido."),
    phone: required(15, "Ingresa el teléfono de facturación.").pipe(z.string().regex(/^\d{7,15}$/, "El teléfono de facturación debe tener solo números (7 a 15 dígitos).")),
  })
  .superRefine((invoice, ctx) => {
    // Pasaporte puede llevar letras; los demás documentos colombianos son solo números.
    const pattern = invoice.docType === "PASAPORTE" ? /^[A-Za-z0-9]{5,20}$/ : /^\d{5,15}$/;
    if (!pattern.test(invoice.docNumber)) {
      ctx.addIssue({ code: "custom", path: ["docNumber"], message: invoice.docType === "PASAPORTE" ? "Número de pasaporte inválido." : "El número de documento debe tener solo números." });
    }
    if (invoice.docType === "NIT" && !/^\d$/.test(invoice.dv ?? "")) {
      ctx.addIssue({ code: "custom", path: ["dv"], message: "Ingresa el dígito de verificación del NIT (un número)." });
    }
    if (invoice.personType === "JURIDICA" && invoice.docType !== "NIT") {
      ctx.addIssue({ code: "custom", path: ["docType"], message: "Una persona jurídica se factura con NIT." });
    }
  })
  .transform((invoice) => ({ ...invoice, dv: invoice.docType === "NIT" ? invoice.dv : undefined }));

export const checkoutSchema = z.object({
  customer: z.object(
    {
      name: required(120, "Ingresa tu nombre completo.").pipe(z.string().min(3, "Ingresa tu nombre completo.")),
      email: clean(160, "Ingresa tu correo electrónico.").pipe(z.email("Correo electrónico inválido.")).transform((email) => email.toLowerCase()),
      phone: required(40, "Ingresa tu teléfono.").pipe(z.string().regex(/^[+\d\s()-]{7,20}$/, "Teléfono inválido.")),
      address: required(240, "Ingresa la dirección de entrega."),
      department: required(80, "Selecciona el departamento.").refine((value) => Object.hasOwn(COLOMBIA, value), "Departamento inválido."),
      city: required(80, "Selecciona la ciudad o municipio.").pipe(z.string().min(2, "Selecciona la ciudad o municipio.")),
      // Campos preparados para crecer; hoy el formulario no los envía.
      neighborhood: optional(80),
      addressComplement: optional(160),
      postalCode: optional(20),
      recipientName: optional(120),
      recipientPhone: optional(40),
      notes: optional(500),
    },
    { error: "Faltan los datos de entrega." },
  ),
  lines: z
    .array(
      z.object({
        productId: z.string().min(1).max(160),
        color: z.string().max(80).optional(),
        quantity: z.number().int("Cantidad inválida.").min(1, "Cantidad inválida.").max(99, "Cantidad inválida."),
      }),
    )
    .min(1, "El carrito está vacío.")
    .max(50, "Demasiados productos en un solo pedido."),
  invoice: invoiceSchema.optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const idempotencyKeySchema = z.string().regex(/^[A-Za-z0-9-]{16,80}$/);

/** Primer mensaje legible de un error de Zod. */
export function firstIssue(error: z.ZodError) {
  return error.issues[0]?.message ?? "Datos inválidos.";
}
