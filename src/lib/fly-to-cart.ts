/**
 * "Vuela al carrito": una miniatura del producto sale desde donde se tocó y cae en el ícono del carrito,
 * que rebota. Usa la Web Animations API (solo transform/opacity, sin re-renders de React): liviano en
 * celulares de gama baja. Devuelve cuánto dura (ms) para encadenar lo que sigue (abrir el carrito).
 */

const FLY_MS = 650;
let lastPointer: { x: number; y: number; at: number } | null = null;

// Último toque/clic: de ahí sale la miniatura.
if (typeof window !== "undefined") {
  window.addEventListener("pointerdown", (event) => (lastPointer = { x: event.clientX, y: event.clientY, at: Date.now() }), { capture: true, passive: true });
}

/** Ícono del carrito visible (navbar). */
function cartTarget() {
  const target = document.querySelector<HTMLElement>("[data-cart-target]");
  const rect = target?.getBoundingClientRect();
  // Si la barra está oculta (p. ej. al bajar en celular) no hay a dónde volar.
  return target && rect && rect.width > 0 && rect.bottom > 0 ? { target, rect } : null;
}

/** Rebote corto del ícono del carrito. */
export function bounceCart() {
  cartTarget()?.target.animate(
    [{ transform: "scale(1)" }, { transform: "scale(1.35)" }, { transform: "scale(0.9)" }, { transform: "scale(1)" }],
    { duration: 450, easing: "ease-out" },
  );
}

export function flyToCart(imageSrc?: string): number {
  if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return 0;
  const cart = cartTarget();
  if (!cart) return 0;

  // Origen: el último toque (si fue hace poco); si no, el centro de la pantalla.
  const recent = lastPointer && Date.now() - lastPointer.at < 1500;
  const from = recent ? lastPointer! : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const to = { x: cart.rect.left + cart.rect.width / 2, y: cart.rect.top + cart.rect.height / 2 };

  // Se reutiliza la imagen ya cargada en la página (misma URL optimizada, sale de caché).
  const loaded = imageSrc ? document.querySelector<HTMLImageElement>(`[data-media-src="${CSS.escape(imageSrc)}"] img`) : null;
  const size = 56;
  const node = document.createElement(loaded?.currentSrc ? "img" : "div");
  if (node instanceof HTMLImageElement) {
    node.src = loaded!.currentSrc;
    node.alt = "";
  }
  node.setAttribute("aria-hidden", "true");
  Object.assign(node.style, {
    position: "fixed",
    left: `${from.x - size / 2}px`,
    top: `${from.y - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    objectFit: "cover",
    borderRadius: "9999px",
    background: "var(--color-volt, #0066ff)",
    boxShadow: "0 0 24px rgba(0,102,255,0.7)",
    pointerEvents: "none",
    zIndex: "90",
    willChange: "transform, opacity",
  });
  document.body.appendChild(node);

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  // Arco: sube un poco antes de caer en el ícono.
  const lift = Math.min(120, Math.abs(dy) * 0.35 + 40);
  const animation = node.animate(
    [
      { transform: "translate(0, 0) scale(1)", opacity: 1 },
      { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - lift}px) scale(0.8)`, opacity: 1, offset: 0.45 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.2)`, opacity: 0.4 },
    ],
    { duration: FLY_MS, easing: "cubic-bezier(0.5, 0, 0.75, 0)" },
  );
  const done = () => {
    node.remove();
    bounceCart();
  };
  animation.onfinish = done;
  animation.oncancel = () => node.remove();
  return FLY_MS;
}
