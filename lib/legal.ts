/**
 * Datos legales del titular de AutoMailX. Rellénalos y se actualizan en todos los textos legales.
 * La LSSI (art. 10) obliga a mostrar: nombre o razón social, NIF, domicilio y un correo de contacto.
 * Mientras falte alguno, la web lo marca como «pendiente».
 */
export const OWNER = {
  /** Nombre y apellidos (autónomo) o razón social (empresa). */
  name: "",
  /** NIF / DNI con letra, o CIF de la sociedad. */
  nif: "",
  /** Domicilio completo: calle, número, código postal, ciudad y provincia. */
  address: "",
  /** Correo de contacto para clientes y para ejercer derechos de privacidad. */
  email: "",
  /** Solo si es una sociedad: datos del Registro Mercantil. Déjalo vacío si eres autónomo. */
  registry: "",
};

export const BRAND = "AutoMailX";
export const LEGAL_UPDATED = "7 de noviembre de 2026";
export const DESISTIMIENTO_DIAS = 14;

export const ownerComplete = () => !!(OWNER.name && OWNER.nif && OWNER.address && OWNER.email);

/** Proveedores que tratan datos por cuenta de AutoMailX (subencargados). */
export const PROVIDERS = [
  { name: "Vercel Inc.", what: "Alojamiento de la web", where: "EE. UU. (servidores en Dublín, Irlanda)" },
  { name: "Supabase Inc.", what: "Base de datos", where: "Unión Europea (Irlanda)" },
  { name: "Resend (Plus Five Five, Inc.)", what: "Envío de correos", where: "EE. UU." },
  { name: "OpenAI, L.L.C. / Anthropic, PBC", what: "Redacción con inteligencia artificial", where: "EE. UU." },
  { name: "Stripe Payments Europe, Ltd.", what: "Cobro de las suscripciones Premium", where: "Unión Europea (Irlanda)" },
] as const;

export const LEGAL_LINKS = [
  { href: "/aviso-legal", label: "Aviso legal" },
  { href: "/privacidad", label: "Privacidad" },
  { href: "/cookies", label: "Cookies" },
  { href: "/terminos", label: "Términos" },
  { href: "/encargo-tratamiento", label: "Encargo del tratamiento" },
] as const;
