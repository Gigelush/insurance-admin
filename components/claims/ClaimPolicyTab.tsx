import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { XCircle, CheckCircle } from "lucide-react";

import { Policy, Claim } from "@/types";

interface ClaimPolicyTabProps {
    policy: Policy | null;
    claim: Claim | null;
}

export function ClaimPolicyTab({ policy, claim }: ClaimPolicyTabProps) {
    if (!policy) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <p className="text-gray-500 flex items-center gap-2">
                        <XCircle className="text-red-500 w-4 h-4" /> Nu s-au găsit date despre polița {claim?.policyId}
                    </p>
                </CardContent>
            </Card>
        );
    }

    const details = policy.details || {};
    const isHomeInsurance = policy.type === "Home Insurance (Facultativa)";

    return (
        <div className="space-y-6">
            {/* General Information */}
            <Card>
                <CardHeader>
                    <CardTitle>Informații Generale Poliță</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                            <Label className="text-gray-500">Serie Poliță</Label>
                            <div className="font-bold text-lg">{policy.id}</div>
                        </div>
                        <div>
                            <Label className="text-gray-500">Titular</Label>
                            <div className="font-semibold">{policy.holder}</div>
                        </div>
                        <div>
                            <Label className="text-gray-500">Telefon</Label>
                            <div className="font-semibold">{policy.phone || "-"}</div>
                        </div>
                        <div>
                            <Label className="text-gray-500">Email</Label>
                            <div className="text-blue-600 truncate font-medium" title={policy.email}>{policy.email || "-"}</div>
                        </div>
                        <div>
                            <Label className="text-gray-500">CNP</Label>
                            <div>{policy.cnp || "N/A"}</div>
                        </div>
                        <div>
                            <Label className="text-gray-500">Status</Label>
                            <Badge className="mt-1" variant={policy.status === "Active" ? "success" : "secondary"}>
                                {policy.status}
                            </Badge>
                        </div>
                        <div>
                            <Label className="text-gray-500">Tip Asigurare</Label>
                            <div className="font-semibold">{policy.type}</div>
                        </div>
                        <div>
                            <Label className="text-gray-500">Perioada Valabilitate</Label>
                            <div className="font-semibold text-blue-700 text-sm">
                                {policy.startDate || "N/A"} <br /> {policy.expiry || "N/A"}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Locations */}
            <Card>
                <CardHeader>
                    <CardTitle>Locații Asigurate</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <Label className="text-gray-500 block mb-1">Adresa de Domiciliu / Principală</Label>
                            <div className="p-3 bg-gray-50 border rounded-md font-medium">
                                {policy.address || "N/A"}
                            </div>
                        </div>

                        {policy.insuredLocations && policy.insuredLocations.length > 0 && (
                            <div>
                                <Label className="text-gray-500 block mb-1">Alte Locații Asigurate</Label>
                                <ul className="space-y-2">
                                    {policy.insuredLocations.map((loc: string, idx: number) => (
                                        <li key={idx} className="p-3 bg-white border rounded-md shadow-sm text-sm">
                                            {loc}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Coverage Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Acoperiri și Prime</CardTitle>
                </CardHeader>
                <CardContent>
                    {isHomeInsurance ? (
                        <div className="border rounded-md overflow-hidden">
                            <Table>
                                <TableHeader className="bg-gray-100">
                                    <TableRow>
                                        <TableHead className="w-1/4">Tip Bunuri / Opțiuni</TableHead>
                                        <TableHead className="w-1/3">Riscuri Asigurate</TableHead>
                                        <TableHead>Suma Asigurată</TableHead>
                                        <TableHead>Franșiză</TableHead>
                                        <TableHead className="text-right">Prima (EUR)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell className="font-medium align-top">Imobil locuință</TableCell>
                                        <TableCell className="text-xs text-gray-600 align-top">
                                            Flexa, calamități naturale, furt, vandalism, etc.
                                        </TableCell>
                                        <TableCell className="align-top font-semibold">{details.acoperiri_suma_asigurata || "-"}</TableCell>
                                        <TableCell className="align-top text-xs">{details.acoperiri_fransiza || "-"}</TableCell>
                                        <TableCell className="text-right align-top">{details.acoperiri_prima || "-"}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium align-top">Conținut</TableCell>
                                        <TableCell className="text-xs text-gray-600 align-top">
                                            Bunuri din locuință, echipamente, etc.
                                        </TableCell>
                                        <TableCell className="align-top font-semibold">{details.acoperiri_continut_suma || "-"}</TableCell>
                                        <TableCell className="align-top text-xs">-</TableCell>
                                        <TableCell className="text-right align-top">{details.acoperiri_continut_prima || "-"}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium align-top">Răspundere civilă</TableCell>
                                        <TableCell className="text-xs text-gray-600 align-top">
                                            Față de terți
                                        </TableCell>
                                        <TableCell className="align-top font-semibold">{details.acoperiri_raspundere_suma || "-"}</TableCell>
                                        <TableCell className="align-top text-xs">-</TableCell>
                                        <TableCell className="text-right align-top">{details.acoperiri_raspundere_prima || "-"}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium align-top">Avarii accidentale</TableCell>
                                        <TableCell className="text-xs text-gray-600 align-top">
                                            Instalații, centrale, etc.
                                        </TableCell>
                                        <TableCell className="align-top font-semibold">{details.acoperiri_avarii_suma || "-"}</TableCell>
                                        <TableCell className="align-top text-xs">-</TableCell>
                                        <TableCell className="text-right align-top">{details.acoperiri_avarii_prima || "-"}</TableCell>
                                    </TableRow>
                                    <TableRow className="bg-orange-50 font-bold border-t-2 border-orange-200">
                                        <TableCell colSpan={4} className="text-right text-orange-800">TOTAL PRIMĂ DE ASIGURARE</TableCell>
                                        <TableCell className="text-right text-orange-800 text-lg">
                                            {details.acoperiri_total_prima ? `${details.acoperiri_total_prima} EUR` : "-"}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="p-4 bg-gray-50 rounded-md text-center text-gray-500">
                            Această poliță nu are detalii extinse de acoperire configurate pentru vizualizare.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
