
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Send, Mail } from "lucide-react";

import { Claim, Policy } from "@/types";

interface ClaimOfferTabProps {
    claim: Claim | null;
    policy: Policy | null;
    onSendOffer: (offerDetails: any) => void;
    readOnly?: boolean;
}

export function ClaimOfferTab({ claim, policy, onSendOffer, readOnly = false }: ClaimOfferTabProps) {
    const [amount, setAmount] = useState("");
    const [email, setEmail] = useState("");
    const [emailContent, setEmailContent] = useState("");

    useEffect(() => {
        if (claim) {
            const initAmount = claim.reserve?.materials || "";
            // Priority: Claim specific email -> Policy email -> Empty
            const initEmail = claim.email || claim.details?.email || policy?.email || "";

            setAmount(initAmount);
            setEmail(initEmail);
            setEmailContent(
                `Buna ziua,\n\nOferta de regie proprie este in valoare de ${initAmount || "000.00"} lei. Pentru acesta oferta nu este necesar sa depuneti nici un document justificativ.\n\nVa rog sa completati cererea atasata si sa reveniti pe email la claims@nn.ro.\n\nVa multumesc,\nNN Romania`
            );
        }
    }, [claim, policy]);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setAmount(val);
        setEmailContent(
            `Buna ziua,\n\nOferta de regie proprie este in valoare de ${val || "000.00"} lei. Pentru acesta oferta nu este necesar sa depuneti nici un document justificativ.\n\nVa rog sa completati cererea atasata si sa reveniti pe email la claims@nn.ro.\n\nVa multumesc,\nNN Romania`
        );
    };

    const handleSend = () => {
        if (!amount) {
            alert("Vă rugăm introduceți suma ofertei.");
            return;
        }
        onSendOffer({
            amount,
            email,
            content: emailContent,
            date: new Date().toISOString()
        });
    };

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-blue-600" />
                    Ofertă Regie Proprie
                </CardTitle>
                <CardDescription>
                    Compuneți și trimiteți oferta de despăgubire către asigurat.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 flex flex-col">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Către (Email Asigurat)</Label>
                        <Input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="bg-gray-50"
                            disabled={readOnly}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Sumă Ofertă (RON)</Label>
                        <Input
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={handleAmountChange}
                            className="font-bold text-lg"
                            disabled={readOnly}
                        />
                    </div>
                </div>

                <div className="space-y-2 flex-1 flex flex-col">
                    <Label>Conținut Email</Label>
                    <Textarea
                        className="flex-1 min-h-[200px] text-sm leading-relaxed"
                        value={emailContent}
                        onChange={(e) => setEmailContent(e.target.value)}
                        disabled={readOnly}
                    />
                </div>

                <div className="flex justify-end pt-4">
                    <Button className="bg-blue-600 hover:bg-blue-700 gap-2 w-full md:w-auto" onClick={handleSend} disabled={readOnly}>
                        <Send className="w-4 h-4" /> {readOnly ? "Ofertă Trimisă (Finalizat)" : "Trimite Ofertă"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
