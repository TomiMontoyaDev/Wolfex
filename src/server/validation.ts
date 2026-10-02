import { z } from "zod";

/** Quita caracteres de control y colapsa espacios. */
const clean = (max: number) =>
  z
    .string()
    .transform((value) => value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim())
    .pipe(z.string().max(max));

const required = (max: number, message: string) => clean(max).pipe(z.string().min(1, message));
const optional = (max: number) =>
  clean(max)
    .optional()
    .transform((value) => value || undefined);

export const checkoutSchema = z.object({
  customer: z.object({
    name: required(120, "Ingresa tu nombre completo.").pipe(z.string().min(3, "Ingresa tu nombre completo.")),
    email: clean(160).pipe(z.email("Correo electrónico inválido.")).transform((email) => email.toLowerCase()),
    phone: required(40, "Ingresa tu teléfono.").pipe(z.string().regex(/^[+\d\s()-]{7,20}$/, "Teléfono inválido.")),
    address: required(240, "Ingresa la dirección de entrega."),
    // Campos preparados para el checkout futuro; hoy el formulario no los envía.
    department: optional(80),
    city: optional(80),
    neighborhood: optional(80),
    addressComplement: optional(160),
    postalCode: optional(20),
    recipientName: optional(120),
    recipientPhone: optional(40),
    notes: optional(500),
  }),
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
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const idempotencyKeySchema = z.string().regex(/^[A-Za-z0-9-]{16,80}$/);

/** Primer mensaje legible de un error de Zod. */
export function firstIssue(error: z.ZodError) {
  return error.issues[0]?.message ?? "Datos inválidos.";
}
