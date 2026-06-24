import { Badge } from "@/components/ui/badge";

interface ClaimTabsProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    hasRegress?: boolean;
    claimId?: string;
}

export function ClaimTabs({ activeTab, setActiveTab, hasRegress, claimId }: ClaimTabsProps) {
    const isRegressFile = claimId?.toUpperCase().endsWith('-REGRES');

    let tabs = [
        ...(isRegressFile ? [] : [
            { id: "notification", label: "AVIZARE DAUNA" },
        ]),
        { id: "policy", label: "POLITĂ ASIGURAT" },
        // Rename "Documente" to "Dosar Daune" for Regress files as requested
        { id: "gallery", label: isRegressFile ? "DOSAR DAUNE" : "DOCUMENTE / POZE" },
        ...(isRegressFile ? [] : [
            { id: "opinius", label: "OPINIE AI" },
            { id: "reserve", label: "REZERVA DAUNA" },
            { id: "rejection", label: "RESPINGERE" },
            { id: "offer", label: "OFERTA" },
            { id: "payment", label: "REFERAT PLATA" },
        ]),
        { id: "regress", label: "REGRES" },
        // Remove "Istoric Dosar" for Regress files as requested
        ...(isRegressFile ? [] : [{ id: "history", label: "ISTORIC DOSAR" }]),
    ];

    return (
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            {tabs.map((tab) => (
                tab.id && (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all duration-200 ${activeTab === tab.id
                            ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md scale-105"
                            : "text-gray-500 hover:text-orange-600 hover:bg-orange-50"
                            }`}
                    >
                        {tab.label}
                    </button>
                )
            ))}
        </div>
    );
}
