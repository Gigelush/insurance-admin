
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ReopenClaimDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string, details: string) => void;
}

export function ReopenClaimDialog({ isOpen, onClose, onConfirm }: ReopenClaimDialogProps) {
    const [reason, setReason] = useState<string>("");
    const [details, setDetails] = useState<string>("");

    const handleConfirm = () => {
        if (!reason) {
            alert("Vă rugăm selectați un motiv.");
            return;
        }
        if (reason === "Altele" && !details) {
            alert("Vă rugăm introduceți detalii pentru motivul 'Altele'.");
            return;
        }
        onConfirm(reason, details);
        // Reset state
        setReason("");
        setDetails("");
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Redeschidere Dosar Finalizat</DialogTitle>
                    <DialogDescription>
                        Pentru a accesa și modifica acest dosar finalizat, este necesar să specificați motivul redeschiderii.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="reason">Motiv Redeschidere</Label>
                        <select
                            id="reason"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        >
                            <option value="" disabled>Selectează motivul...</option>
                            <option value="Modificare Referat">Modificare Referat</option>
                            <option value="Adaugare Referat">Adaugare Referat</option>
                            <option value="Incarcare foto/acte">Incarcare foto/acte</option>
                            <option value="Altele">Altele</option>
                        </select>
                    </div>
                    {(reason === "Altele" || reason) && (
                        <div className="space-y-2">
                            <Label htmlFor="details">Detalii Suplimentare {reason === "Altele" ? "*" : "(Opțional)"}</Label>
                            <Textarea
                                id="details"
                                placeholder="Introduceți detalii..."
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                            />
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Anulează</Button>
                    <Button onClick={handleConfirm} className="bg-orange-600 hover:bg-orange-700 text-white">
                        Confirmă și Deschide
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
