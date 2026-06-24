import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History } from "lucide-react";
import { ClaimHistoryItem } from "@/types";

interface ClaimHistoryTabProps {
    history?: ClaimHistoryItem[];
}

export function ClaimHistoryTab({ history }: ClaimHistoryTabProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><History className="w-5 h-5" /> Istoric Dosar</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {(!history || history.length === 0) ? (
                        <p className="text-gray-500 text-sm">Nu există istoric.</p>
                    ) : (
                        history.map((h: ClaimHistoryItem, idx: number) => (
                            <div key={idx} className="flex gap-3 pb-4 border-b last:border-0 last:pb-0">
                                <div className="mt-1">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm">{h.event}</span>
                                        <span className="text-xs text-gray-400">{new Date(h.date).toLocaleString()}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">{h.details}</p>
                                    <p className="text-xs text-gray-400 mt-1">Utilizator: {h.user}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
