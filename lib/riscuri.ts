/**
 * Lista completă de riscuri asigurate.
 * Sursă unică de adevăr — importată în formularul de Avizare și în tab-ul AVIZARE DAUNA.
 */
export const RISCURI_ASIGURATE = [
    "Alunecare teren",
    "Avalanșă",
    "Avarii accidentale",
    "Boom sonic",
    "Bunuri casabile",
    "Cădere accidentală de corpuri",
    "Căderea aparatelor de zbor",
    "Costuri de intervenție de urgență (100 EUR max)",
    "Cutremur",
    "Explozie",
    "Fenomene electrice",
    "Furt",
    "Furtună, uragan, vijelie, tornadă",
    "Greutatea stratului de zăpadă",
    "Greve și tulburări civile",
    "Grindină",
    "Incendiu",
    "Inundație – apă de conductă, refulare canalizare",
    "Inundație de la vecini",
    "Inundație din cauze naturale",
    "Izbirea din exterior de către vehicule",
    "Ploaie torențială",
    "Răspundere civilă",
    "Trăsnet",
    "Vandalism",
] as const;

export type RiscAsigurat = (typeof RISCURI_ASIGURATE)[number];
