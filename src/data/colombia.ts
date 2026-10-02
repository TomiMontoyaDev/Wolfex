/**
 * Departamentos de Colombia con sus municipios principales para el checkout.
 * No es la lista completa de municipios: el checkout ofrece "Otro municipio" para escribirlo a mano.
 * Para agregar un municipio, súmalo al arreglo de su departamento.
 */
export const OTHER_CITY = "Otro municipio";

export const COLOMBIA: Record<string, string[]> = {
  Amazonas: ["Leticia", "Puerto Nariño"],
  Antioquia: [
    "Medellín", "Bello", "Itagüí", "Envigado", "Sabaneta", "La Estrella", "Caldas", "Copacabana", "Girardota", "Barbosa",
    "Rionegro", "Marinilla", "La Ceja", "El Retiro", "Guarne", "El Carmen de Viboral", "Apartadó", "Turbo", "Caucasia", "Santa Fe de Antioquia",
  ],
  Arauca: ["Arauca", "Saravena", "Tame", "Arauquita"],
  Atlántico: ["Barranquilla", "Soledad", "Malambo", "Puerto Colombia", "Galapa", "Sabanalarga", "Baranoa"],
  "Bogotá D.C.": ["Bogotá"],
  Bolívar: ["Cartagena", "Magangué", "Turbaco", "Arjona", "El Carmen de Bolívar"],
  Boyacá: ["Tunja", "Duitama", "Sogamoso", "Chiquinquirá", "Paipa", "Villa de Leyva"],
  Caldas: ["Manizales", "Villamaría", "Chinchiná", "La Dorada", "Riosucio"],
  Caquetá: ["Florencia", "San Vicente del Caguán"],
  Casanare: ["Yopal", "Aguazul", "Villanueva", "Paz de Ariporo"],
  Cauca: ["Popayán", "Santander de Quilichao", "Puerto Tejada"],
  Cesar: ["Valledupar", "Aguachica", "Agustín Codazzi", "Bosconia"],
  Chocó: ["Quibdó", "Istmina"],
  Córdoba: ["Montería", "Cereté", "Sahagún", "Lorica", "Montelíbano"],
  Cundinamarca: [
    "Soacha", "Chía", "Zipaquirá", "Facatativá", "Fusagasugá", "Mosquera", "Madrid", "Funza", "Cajicá", "Girardot",
    "Cota", "Tocancipá", "La Calera", "Sopó", "Tenjo",
  ],
  Guainía: ["Inírida"],
  Guaviare: ["San José del Guaviare"],
  Huila: ["Neiva", "Pitalito", "Garzón", "La Plata"],
  "La Guajira": ["Riohacha", "Maicao", "Uribia", "San Juan del Cesar"],
  Magdalena: ["Santa Marta", "Ciénaga", "Fundación", "El Banco"],
  Meta: ["Villavicencio", "Acacías", "Granada", "Puerto López"],
  Nariño: ["Pasto", "Tumaco", "Ipiales", "Túquerres"],
  "Norte de Santander": ["Cúcuta", "Ocaña", "Villa del Rosario", "Los Patios", "Pamplona"],
  Putumayo: ["Mocoa", "Puerto Asís", "Orito"],
  Quindío: ["Armenia", "Calarcá", "Montenegro", "La Tebaida", "Quimbaya", "Circasia"],
  Risaralda: ["Pereira", "Dosquebradas", "Santa Rosa de Cabal", "La Virginia"],
  "San Andrés y Providencia": ["San Andrés", "Providencia"],
  Santander: ["Bucaramanga", "Floridablanca", "Girón", "Piedecuesta", "Barrancabermeja", "San Gil", "Socorro"],
  Sucre: ["Sincelejo", "Corozal", "Sampués", "Santiago de Tolú"],
  Tolima: ["Ibagué", "Espinal", "Melgar", "Honda", "Mariquita", "Chaparral"],
  "Valle del Cauca": ["Cali", "Palmira", "Buenaventura", "Tuluá", "Jamundí", "Yumbo", "Cartago", "Buga", "Candelaria", "Florida"],
  Vaupés: ["Mitú"],
  Vichada: ["Puerto Carreño"],
};

export const DEPARTMENTS = Object.keys(COLOMBIA).sort((a, b) => a.localeCompare(b, "es"));
