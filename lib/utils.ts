import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Sums an array of currency strings, handling both dot and comma decimals.
 * e.g. ["1.234,56", "500"] → "1734,56"
 */
export function calculateTotalPremium(values: string[]): string {
    let total = 0;
    for (const val of values) {
        if (!val) continue;
        // Remove currency symbols and whitespace, then normalize decimal separator.
        // Use /g flag to replace ALL commas (not just the first one).
        const cleanVal = val
            .replace(/[^0-9,.]/g, "")   // keep only digits, dots, commas
            .replace(/\./g, "")          // remove thousands separators (dots)
            .replace(",", ".");          // convert decimal comma to dot
        const num = parseFloat(cleanVal);
        if (!isNaN(num)) {
            total += num;
        }
    }
    // Format back with comma as decimal separator, 2 decimal places
    return total.toFixed(2).replace(".", ",");
}

