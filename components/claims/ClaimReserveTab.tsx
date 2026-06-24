
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Download, Trash2, FileSpreadsheet } from "lucide-react";

import { Claim, FileAttachment } from "@/types";

interface ClaimReserveTabProps {
    claim: Claim;
    setClaim: (claim: Claim) => void;
    onSave: () => void;
    estimates?: FileAttachment[];
    onUploadEstimates?: (files: FileList | null) => void;
    onDeleteEstimate?: (file: { fileId?: string; name: string; category?: string }) => void;
    onViewEstimate?: (index: number) => void;
    readOnly?: boolean;
}

export function ClaimReserveTab({ claim, setClaim, onSave, estimates = [], onUploadEstimates, onDeleteEstimate, readOnly = false }: ClaimReserveTabProps) {
    if (!claim) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Rezervă de Daună (Estimare)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Rezerva DAUNA (RON)</Label>
                        <Input
                            type="number"
                            placeholder="0.00"
                            value={claim.reserve?.materials || ''}
                            onChange={(e) => setClaim({ ...claim, reserve: { ...claim.reserve, materials: e.target.value } })}
                            disabled={readOnly}
                        />
                    </div>
                    <div>
                        <Label>Rezerva Contractor (RON)</Label>
                        <Input
                            type="number"
                            placeholder="0.00"
                            className="bg-gray-50 text-gray-700"
                            value={claim.reserve?.contractor || ''}
                            onChange={(e) => setClaim({ ...claim, reserve: { ...claim.reserve, contractor: e.target.value } })}
                            disabled={readOnly}
                        />
                    </div>
                    <div>
                        <Label>Rezerva EXPERT (RON)</Label>
                        <Input
                            type="number"
                            placeholder="0.00"
                            value={claim.reserve?.other || ''}
                            onChange={(e) => setClaim({ ...claim, reserve: { ...claim.reserve, other: e.target.value } })}
                            disabled={readOnly}
                        />
                    </div>
                    <div>
                        <Label>Rezerva LEGAL (RON)</Label>
                        <Input
                            type="number"
                            placeholder="0.00"
                            value={claim.reserve?.legal || ''}
                            onChange={(e) => setClaim({ ...claim, reserve: { ...claim.reserve, legal: e.target.value } })}
                            disabled={readOnly}
                        />
                    </div>
                    <div>
                        <Label>Rezervă Finală (RON)</Label>
                        <Input
                            type="number"
                            placeholder="0.00"
                            className="font-bold border-orange-200 focus-visible:ring-orange-500"
                            value={(parseFloat(claim.reserve?.materials || '0') + parseFloat(claim.reserve?.contractor || '0') + parseFloat(claim.reserve?.other || '0') + parseFloat(claim.reserve?.legal || '0')).toFixed(2)}
                            readOnly // Making it readOnly as it should be sum of all parts per user request "sa apara suma tuturor sumelor"
                            onChange={(e) => { }} // No-op since it's read-only now
                        />
                    </div>

                </div>


                {/* Estimate Gallery Section */}
                <div className="border-t pt-6 mt-2">
                    <div className="flex items-center justify-between mb-4">
                        <Label className="text-lg font-semibold flex items-center gap-2 text-blue-700">
                            <FileSpreadsheet className="w-5 h-5" /> DOCUMENTE DEVIZ (Estimări, Excel, PDF, Poze)
                        </Label>
                        <div>
                            <input
                                type="file"
                                id="estimate-upload"
                                className="hidden"
                                accept=".xlsx, .xls, .doc, .docx, .pdf, image/*"
                                multiple
                                onChange={(e) => onUploadEstimates && onUploadEstimates(e.target.files)}
                            />
                            <Label htmlFor="estimate-upload" className={`cursor-pointer ${readOnly ? 'hidden' : ''}`}>
                                <Button size="sm" variant="outline" className="gap-2 pointer-events-none" asChild disabled={readOnly}>
                                    <span><Upload className="w-4 h-4" /> Încarcă Devize</span>
                                </Button>
                            </Label>
                        </div>
                    </div>

                    {estimates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg bg-blue-50/50 text-blue-400">
                            <FileSpreadsheet className="w-8 h-8 mb-2 opacity-50" />
                            <p className="text-sm">Nu există documente de deviz încărcate.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                            {estimates.map((file: FileAttachment, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow group">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-10 h-10 rounded bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600">
                                            {file.type.includes('sheet') || file.type.includes('excel') ? <FileSpreadsheet className="w-6 h-6" /> :
                                                file.type.includes('pdf') ? <FileText className="w-6 h-6 text-red-500" /> :
                                                    <FileText className="w-6 h-6" />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate" title={file.name}>{file.name}</p>
                                            <p className="text-[10px] text-gray-400">{new Date(file.uploadedAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <a href={file.content} download={file.name}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-blue-600">
                                                <Download className="w-4 h-4" />
                                            </Button>
                                        </a>
                                        {onDeleteEstimate && !readOnly && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-gray-500 hover:text-red-600"
                                                onClick={() => onDeleteEstimate(file)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-4 border-t">
                    <Button onClick={onSave} className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md" disabled={readOnly}>
                        {readOnly ? "Vizualizare (Finalizat)" : "Actualizează Rezervă"}
                    </Button>
                </div>
            </CardContent>
        </Card >
    );
}
