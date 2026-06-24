"use client";

import { Claim, Policy } from "@/types";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { Lightbox } from "@/components/ui/lightbox";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DraggableModal } from "@/components/ui/draggable-modal";
import { PaymentModal } from "@/components/claims/PaymentModal";

// Regress Modal Inner Content (Keeping it here or moving to separate component if huge)
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Refactored Components
import { ClaimTabs } from "@/components/claims/ClaimTabs";
import { ClaimNotificationTab } from "@/components/claims/ClaimNotificationTab";
import { ClaimPolicyTab } from "@/components/claims/ClaimPolicyTab";
import { ClaimReserveTab } from "@/components/claims/ClaimReserveTab";
import { ClaimFilesTab } from "@/components/claims/ClaimFilesTab";
import { ClaimPaymentTab } from "@/components/claims/ClaimPaymentTab";
import { ClaimRegressTab } from "@/components/claims/ClaimRegressTab";
import { ClaimHistoryTab } from "@/components/claims/ClaimHistoryTab";
import { ClaimOfferTab } from "@/components/claims/ClaimOfferTab";
import { ClaimRejectionTab } from "@/components/claims/ClaimRejectionTab";
import { ClaimChat } from "@/components/claims/ClaimChat";
import { ClaimAiOpinionTab } from "@/components/claims/ClaimAiOpinionTab";

export default function ClaimDetail() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const isRegressFile = id?.endsWith('-REGRES');

    const [messages, setMessages] = useState<any[]>([]);
    const [claim, setClaim] = useState<Claim | null>(null);
    const [policy, setPolicy] = useState<Policy | null>(null);
    const [activeTab, setActiveTab] = useState(isRegressFile ? "policy" : "notification");
    const [lightboxIndex, setLightboxIndex] = useState<number>(-1);
    const [viewingDocs, setViewingDocs] = useState(false);

    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [editingPaymentIndex, setEditingPaymentIndex] = useState<number>(-1);
    const [tempPayment, setTempPayment] = useState<any>({});
    const [isRegressModalOpen, setIsRegressModalOpen] = useState(false);
    const [collaborators, setCollaborators] = useState<any[]>([]);
    const [relatedStats, setRelatedStats] = useState<{ samePolicy: any[], sameCnp: any[] }>({ samePolicy: [], sameCnp: [] });

    useEffect(() => {
        if (isRegressFile) {
            setActiveTab("policy");
        }
    }, [id]);

    useEffect(() => {
        // Fetch collaborators for autofill
        fetch('/api/collaborators')
            .then(res => res.json())
            .then(data => setCollaborators(data))
            .catch(err => console.error("Failed to fetch collaborators", err));
    }, []);

    const photos = claim?.files?.filter((f: any) => f.category === 'photo' || (!f.category && f.type.startsWith('image/'))) || [];
    const docs = claim?.files?.filter((f: any) => f.category === 'document' || (!f.category && !f.type.startsWith('image/'))) || [];

    const isReadOnly = claim?.status === 'Finalizat' || claim?.status === 'Respins';

    // --- Actions ---

    const handleSaveNotification = async () => {
        if (!claim) return;
        try {
            const res = await fetch(`/api/claims/${encodeURIComponent(id)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(claim)
            });
            if (res.ok) {
                alert("Detaliile avizării au fost salvate cu succes!");
            } else {
                alert("Eroare la salvare.");
            }
        } catch (e) {
            console.error(e);
            alert("Eroare de conexiune.");
        }
    };

    const handleDeleteFile = async (file: { fileId?: string; name: string; category?: string }) => {
        if (!confirm("Ești sigur că vrei să ștergi acest fișier?")) return;
        try {
            await fetch(`/api/claims/${encodeURIComponent(id)}/files`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileId: file.fileId, name: file.name, category: file.category })
            });
            fetchAllData();
        } catch (e) {
            console.error(e);
            alert("Eroare la ștergere.");
        }
    };

    const handleUploadFiles = async (files: FileList | null, category: 'photo' | 'document' | 'estimate') => {
        if (!files || files.length === 0) return;

        try {
            let successCount = 0;

            // Upload each file sequentially using FormData (avoids JSON body size limits)
            for (const file of Array.from(files)) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('category', category);

                const res = await fetch(`/api/claims/${encodeURIComponent(id)}/files`, {
                    method: 'POST',
                    body: formData, // No Content-Type header — browser sets multipart boundary automatically
                });

                if (res.ok) {
                    successCount++;
                } else {
                    const errText = await res.text().catch(() => 'Unknown error');
                    console.error(`Upload failed for ${file.name}: ${res.status} ${errText}`);
                }
            }

            if (successCount === 0 && files.length > 0) {
                alert(`Niciun fișier nu a putut fi încărcat. Verificați conexiunea.`);
            } else if (successCount < files.length) {
                alert(`${successCount} din ${files.length} fișiere au fost încărcate. Unele au eșuat.`);
            }

            // Automate Status Change for Estimates
            if (category === 'estimate' && claim?.status === 'Deschis' && successCount > 0) {
                const newHistoryItem = {
                    date: new Date().toISOString(),
                    event: 'Schimbare Status',
                    details: 'Status schimbat automat din "Deschis" în "Rezerva" (Încărcare Deviz)',
                    user: 'System'
                };

                const updatedClaim = {
                    ...claim,
                    status: 'Rezerva',
                    history: [...(claim.history || []), newHistoryItem]
                };

                await fetch(`/api/claims/${encodeURIComponent(id)}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedClaim)
                });
            }

            fetchAllData();
        } catch (e) {
            console.error("Upload error:", e);
            alert("Eroare la upload. Verificați conexiunea.");
        }
    };

    const handleUpdateReserve = async () => {
        if (!claim) return;

        const materials = parseFloat(claim.reserve?.materials || "0");
        const contractor = parseFloat(claim.reserve?.contractor || claim.reserve?.labor || "0");
        const other = parseFloat(claim.reserve?.other || "0");
        const legal = parseFloat(claim.reserve?.legal || "0");

        // Always recalculate total from component values
        const calcTotal = materials + contractor + other + legal;

        const newReserve = {
            ...claim.reserve,
            materials: materials.toString(),
            contractor: contractor.toString(),
            other: other.toString(),
            legal: legal.toString(),
            total: calcTotal.toString(),
            updatedAt: new Date().toISOString()
        };

        const newHistoryItem = {
            date: new Date().toISOString(),
            event: 'Actualizare Rezervă',
            details: `Total: ${calcTotal} RON - Dauna: ${materials}, Contractor: ${contractor}, Expert: ${other}, Legal: ${legal}`,
            user: 'Admin'
        };

        let newStatus = claim.status;
        const newHistory = [...(claim.history || []), newHistoryItem];

        if (claim.status === 'Deschis') {
            newStatus = 'Rezerva';
            newHistory.push({
                date: new Date().toISOString(),
                event: 'Schimbare Status',
                details: 'Status schimbat automat din "Deschis" în "Rezerva" (Actualizare Rezervă)',
                user: 'System'
            });
        }

        const updatedClaim = {
            ...claim,
            status: newStatus,
            reserve: newReserve,
            history: newHistory
        };

        try {
            // Strip base64 file content to avoid huge request body
            const { files, ...claimWithoutFiles } = updatedClaim as any;
            const lightFiles = files?.map((f: any) => ({
                name: f.name,
                type: f.type,
                category: f.category,
                fileId: f.fileId,
                uploadedAt: f.uploadedAt,
            })) || [];

            const res = await fetch(`/api/claims/${encodeURIComponent(id)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...claimWithoutFiles, files: lightFiles })
            });
            if (res.ok) {
                setClaim(updatedClaim);
                alert("Rezerva a fost actualizată și istoricul completat!");
            } else {
                alert("Eroare la actualizarea rezervei.");
            }
        } catch (e) {
            console.error(e);
            alert("Eroare de conexiune.");
        }
    };

    // --- Multiple Payment Logic ---
    const openPaymentModal = (index: number) => {
        setEditingPaymentIndex(index);
        const payments = claim?.payments || (claim?.payment ? [claim.payment] : []);

        if (index >= 0) {
            setTempPayment({ ...payments[index] });
        } else {
            setTempPayment({
                amount: '',
                date: (() => {
                    const d = new Date();
                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                })(),
                iban: '',
                details: '',
                beneficiaryName: '',
                cnp: '',
                address: '',
                email: '',
                phone: '',
                bank: '',
                claimDate: '',
                registrationDate: ''
            });
        }
        setIsPaymentModalOpen(true);
    };

    const handleSavePayment = async () => {
        if (!claim) return;
        const payments = [...(claim.payments || (claim.payment ? [claim.payment] : []))];

        if (editingPaymentIndex >= 0) {
            payments[editingPaymentIndex] = tempPayment;
        } else {
            payments.push(tempPayment);
        }

        const updatedClaim = {
            ...claim,
            payments: payments,
            payment: undefined // Clear legacy
        };
        setClaim(updatedClaim);

        try {
            // Strip base64 content from files before PUT
            const { files, ...claimWithoutFiles } = updatedClaim as any;
            const lightFiles = files?.map((f: any) => ({
                name: f.name, type: f.type, category: f.category, fileId: f.fileId, uploadedAt: f.uploadedAt,
            })) || [];

            const res = await fetch(`/api/claims/${encodeURIComponent(id)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...claimWithoutFiles, files: lightFiles })
            });
            if (res.ok) {
                alert("Referat salvat cu succes!");
                setIsPaymentModalOpen(false);
            }
        } catch (e) {
            console.error(e);
            alert("Eroare la salvarea platii.");
        }
    };

    const handleValidatePayment = async (index: number) => {
        if (!claim) return;
        const payments = [...(claim.payments || [])];
        const payment = payments[index];

        if (!payment || payment.validated) return;

        // 1. Mark as validated
        payment.validated = true;
        payment.validatedAt = new Date().toISOString();
        payments[index] = payment;

        // 2. Deduct from reserve
        const currentReserve = { ...claim.reserve };
        const amountToDeduct = parseFloat(payment.amount || "0");
        const reserveType = payment.reserveType || "materials";

        // Map UI types to reserve keys
        let reserveKey = reserveType;
        if (reserveType === 'contractor') reserveKey = 'contractor'; // Matches reserve object key

        const currentVal = parseFloat(currentReserve[reserveKey as keyof typeof currentReserve] || currentReserve['labor'] || "0");
        const newVal = Math.max(0, currentVal - amountToDeduct);

        // Update the specific reserve
        if (reserveType === 'contractor') {
            currentReserve.contractor = newVal.toString();
        } else {
            currentReserve[reserveKey as keyof typeof currentReserve] = newVal.toString();
        }

        // Recalc Total
        currentReserve.total = (
            parseFloat(currentReserve.materials || "0") +
            parseFloat(currentReserve.contractor || currentReserve.labor || "0") +
            parseFloat(currentReserve.other || "0") +
            parseFloat(currentReserve.legal || "0")
        ).toString();

        // 3. Update Status
        let newStatus = claim.status;
        const openPayments = payments.filter((p: any) => !p.validated);
        if (openPayments.length === 0) {
            newStatus = "Finalizat";
        } else {
            newStatus = "Inchis Partial";
        }

        let historyDetails = `Referat #${index + 1} validat. ${amountToDeduct} RON scăzuți din ${reserveType}. Status: ${newStatus}`;
        let historyEvent = 'Validare Plată';

        if (newStatus === "Finalizat") {
            historyEvent = 'Dosar Finalizat';
            historyDetails = `Dosarul a fost inchis in data de ${new Date().toLocaleDateString('ro-RO')}. Toate plățile au fost validate. Ultima plată: ${amountToDeduct} RON.`;
        }

        const updatedClaim = {
            ...claim,
            payments: payments,
            reserve: currentReserve,
            status: newStatus,
            history: [
                {
                    date: new Date().toISOString(),
                    event: historyEvent,
                    details: historyDetails,
                    user: 'Admin'
                },
                ...(claim.history || [])
            ]
        };

        setClaim(updatedClaim);

        try {
            // Strip base64 content from files before PUT
            const { files, ...claimWithoutFiles } = updatedClaim as any;
            const lightFiles = files?.map((f: any) => ({
                name: f.name, type: f.type, category: f.category, fileId: f.fileId, uploadedAt: f.uploadedAt,
            })) || [];

            await fetch(`/api/claims/${encodeURIComponent(id)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...claimWithoutFiles, files: lightFiles })
            });

            if (newStatus === "Finalizat") {
                alert("Dosarul a fost inchis, toate rezervele deduse si nu mai poate fi facuta nici o modificare!");
            } else {
                alert("Referat validat și sume actualizate!");
            }
        } catch (error) {
            console.error("Failed to validate", error);
            alert("Eroare la validare.");
        }
    };


    const fetchAllData = async () => {
        try {
            const [paramsRes, claimsRes, policiesRes] = await Promise.all([
                Promise.resolve(params), // Ensure params are ready
                fetch('/api/claims'),
                fetch('/api/policies')
            ]);

            if (claimsRes.ok && policiesRes.ok) {
                const allClaims = await claimsRes.json();
                const allPolicies = await policiesRes.json();

                const currentClaim = allClaims.find((c: any) => c.id === id);
                if (currentClaim) {
                    // Fetch full files (with content) separately since the claims list strips base64 data
                    try {
                        const filesRes = await fetch(`/api/claims/${encodeURIComponent(id)}/files`);
                        if (filesRes.ok) {
                            const filesData = await filesRes.json();
                            currentClaim.files = filesData;
                        }
                    } catch (fileErr) {
                        console.error("Failed to fetch files:", fileErr);
                    }

                    setClaim(currentClaim);

                    const currentPolicy = allPolicies.find((p: any) => p.id === currentClaim.policyId);
                    setPolicy(currentPolicy);

                    // Calculate Stats
                    if (currentPolicy) {
                        // 1. Same Policy ID (excluding current)
                        const policyClaims = allClaims.filter((c: any) =>
                            c.policyId === currentClaim.policyId && c.id !== id
                        );

                        // 2. Same CNP (excluding current claim)
                        // Find all policies with same CNP
                        const cnpPolicies = allPolicies.filter((p: any) => p.cnp === currentPolicy.cnp).map((p: any) => p.id);

                        // Find all claims belonging to these policies
                        const cnpClaims = allClaims.filter((c: any) =>
                            cnpPolicies.includes(c.policyId) && c.id !== id
                        );

                        setRelatedStats({ samePolicy: policyClaims, sameCnp: cnpClaims });
                    }
                }
            }
        } catch (e) {
            console.error("Failed to fetch data", e);
        }
    };

    // ... useEffect will call fetchAllData

    const fetchMessages = async () => {
        if (!id) return;
        try {
            const res = await fetch(`/api/claims/${encodeURIComponent(id)}/messages`);
            if (res.ok) {
                const data = await res.json();
                setMessages(prev => {
                    if (JSON.stringify(prev) !== JSON.stringify(data)) return data;
                    return prev;
                });
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (id) {
            fetchAllData();
            fetchMessages();
            const interval = setInterval(fetchMessages, 3000);
            return () => clearInterval(interval);
        }
    }, [id]);

    const handleSend = async (text: string) => {
        if (!id) return;

        await fetch(`/api/claims/${encodeURIComponent(id)}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: text,
                sender: "agent",
            })
        });

        fetchMessages();
    };



    const handleCreateRegressFile = async () => {
        if (!confirm("Sigur dorești să generezi Dosarul de Regres? Se va crea o copie a acestui dosar în secțiunea Dosare Regres.")) return;

        if (!claim) return;
        const newId = `${claim.id}-REGRES`;
        const regressClaim = {
            ...claim,
            id: newId,
            status: 'Deschis',
            type: 'Dosar Regres',
            submittedAt: new Date().toISOString(),
            history: [
                {
                    date: new Date().toISOString(),
                    event: 'Dosar Regres Generat',
                    details: `Generat din dosarul ${claim.id}`,
                    user: 'Admin'
                }
            ]
        };

        try {
            const res = await fetch('/api/claims', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(regressClaim)
            });

            if (res.ok) {
                // Update parent claim to mark as created
                const updatedParent = {
                    ...claim,
                    regress: {
                        ...(claim.regress || { type: 'neighbor', amount: '0', status: 'initiated' }),
                        fileCreated: true
                    }
                };

                await fetch(`/api/claims/${encodeURIComponent(id)}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedParent)
                });

                setClaim(updatedParent); // Update local state immediately

                alert("Dosar Regres generat cu succes!");
                router.push('/users'); // Navigate to Regress Files list
            } else {
                alert("Eroare la generare. Posibil dosarul există deja.");
            }
        } catch (e) {
            console.error(e);
            alert("Eroare de conexiune.");
        }
    };

    return (
        <div className="p-8 space-y-6 h-screen flex flex-col">
            <div className="flex items-center gap-4 mb-2">
                <Link href={isRegressFile ? "/users" : "/claims"}>
                    <Button variant="outline" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        Dosar #{id}
                        <Badge variant="warning" className="text-sm">{claim?.status || 'Investigating'}</Badge>
                    </h1>
                    <p className="text-gray-500">Titular: {claim?.holderName || '...'}</p>
                </div>
            </div>

            {/* Claim History Indicators - HIDDEN FOR REGRESS FILES */}
            {!isRegressFile && (
                <div className="flex gap-4">
                    {relatedStats.samePolicy.length > 0 && (
                        <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-3 rounded text-sm flex-1">
                            <p className="font-bold">Atenție: Istoric pe Poliță</p>
                            <p>Există alte <span className="font-bold">{relatedStats.samePolicy.length}</span> dosare de daună deschise pe această poliță.</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {relatedStats.samePolicy.map((c: any) => (
                                    <Link key={c.id} href={`/claims/${encodeURIComponent(c.id)}`} target="_blank" className="bg-orange-200 hover:bg-orange-300 px-2 py-1 rounded text-xs font-semibold underline">
                                        #{c.id} ({c.status})
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                    {relatedStats.sameCnp.length > 0 && (
                        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-3 rounded text-sm flex-1">
                            <p className="font-bold">Info: Istoric Asigurat (CNP)</p>
                            <p>Există alte <span className="font-bold">{relatedStats.sameCnp.length}</span> dosare asociate acestui CNP, inclusiv pe alte polițe.</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {relatedStats.sameCnp.map((c: any) => (
                                    <Link key={c.id} href={`/claims/${encodeURIComponent(c.id)}`} target="_blank" className="bg-blue-200 hover:bg-blue-300 px-2 py-1 rounded text-xs font-semibold underline">
                                        #{c.id} ({c.status})
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <ClaimTabs activeTab={activeTab} setActiveTab={setActiveTab} hasRegress={claim?.hasRegress} claimId={claim?.id} />

            <div className="grid grid-cols-3 gap-6 flex-1 min-h-0">
                <div className="col-span-2 space-y-6 overflow-y-auto pr-2">

                    {activeTab === "policy" && (
                        <ClaimPolicyTab policy={policy} claim={claim} />
                    )}

                    {!isRegressFile && activeTab === "notification" && claim && (
                        <ClaimNotificationTab claim={claim} setClaim={setClaim} onSave={handleSaveNotification} policy={policy} />
                    )}

                    {!isRegressFile && activeTab === "reserve" && claim && (
                        <ClaimReserveTab
                            claim={claim}
                            setClaim={setClaim}
                            onSave={handleUpdateReserve}
                            estimates={claim?.files?.filter((f: any) => f.category === 'estimate') || []}
                            onUploadEstimates={(files) => handleUploadFiles(files, 'estimate')}
                            onDeleteEstimate={handleDeleteFile}
                            onViewEstimate={(idx) => {
                                setViewingDocs(true);

                            }}
                            readOnly={isReadOnly}
                        />
                    )}

                    {!isRegressFile && activeTab === "rejection" && claim && (
                        <ClaimRejectionTab
                            claim={claim}
                            policy={policy}
                            onReject={async (rejectionReason: string) => {
                                if (!claim) return;
                                // Zero out insured reserves, keep contractor
                                const currentReserve = { ...claim.reserve };
                                const contractorAmount = currentReserve.contractor || '0';
                                const newReserve = {
                                    materials: '0',
                                    labor: '0',
                                    contractor: contractorAmount,
                                    other: '0',
                                    legal: '0',
                                    total: contractorAmount,
                                    updatedAt: new Date().toISOString(),
                                };

                                const updatedClaim: Claim = {
                                    ...claim,
                                    status: 'Respins',
                                    reserve: newReserve,
                                    history: [
                                        {
                                            date: new Date().toISOString(),
                                            event: 'Dosar Respins',
                                            details: `Dosarul a fost respins. Motiv: ${rejectionReason}. Rezervele asigurat au fost anulate. Rezerva Contractor: ${contractorAmount} RON.`,
                                            user: 'Admin'
                                        },
                                        ...(claim.history || [])
                                    ]
                                };

                                try {
                                    const res = await fetch(`/api/claims/${encodeURIComponent(id)}`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(updatedClaim)
                                    });
                                    if (res.ok) {
                                        setClaim(updatedClaim);
                                        alert('Dosarul a fost RESPINS. Rezervele asigurat au fost anulate. Puteți în continuare crea referate de plată pentru Contractor.');
                                    }
                                } catch (e) {
                                    console.error(e);
                                    alert('Eroare la respingerea dosarului.');
                                }
                            }}
                            readOnly={isReadOnly}
                        />
                    )}

                    {!isRegressFile && activeTab === "offer" && (
                        <ClaimOfferTab
                            claim={claim}
                            policy={policy}
                            onSendOffer={async (offer) => {
                                if (!claim) return;
                                const newHistoryItem = {
                                    date: new Date().toISOString(),
                                    event: 'Ofertă Trimisă',
                                    details: `Ofertă Regie Proprie trimisă: ${offer.amount} RON.`,
                                    user: 'Admin'
                                };
                                const statusChangeItem = {
                                    date: new Date().toISOString(),
                                    event: 'Schimbare Status',
                                    details: `Status schimbat automat din "${claim.status}" în "Oferta" (Ofertă Trimisă)`,
                                    user: 'System'
                                };
                                const updatedClaim: Claim = {
                                    ...claim,
                                    status: 'Oferta',
                                    history: [...(claim.history || []), newHistoryItem, statusChangeItem]
                                };
                                setClaim(updatedClaim);
                                await fetch(`/api/claims/${encodeURIComponent(id)}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(updatedClaim)
                                });
                                alert("Oferta a fost înregistrată în istoric!");
                            }}
                            readOnly={isReadOnly}
                        />
                    )}

                    {activeTab === "gallery" && (
                        <ClaimFilesTab
                            photos={photos}
                            docs={docs}
                            onUploadRequests={handleUploadFiles}
                            onDelete={handleDeleteFile}
                            onView={(isDoc, idx) => { setViewingDocs(isDoc); setLightboxIndex(idx); }}
                            readOnly={isReadOnly}
                        />
                    )}

                    {activeTab === "opinius" && (
                        <ClaimAiOpinionTab claimId={id} onHistoryUpdate={fetchAllData} />
                    )}

                    {!isRegressFile && activeTab === "payment" && claim && !!(claim.status !== 'Respins' || parseFloat(claim.reserve?.contractor || '0') > 0) && (
                        <ClaimPaymentTab
                            claim={claim}
                            onEdit={isReadOnly ? () => { } : openPaymentModal}
                            onValidate={handleValidatePayment}
                            readOnly={isReadOnly}
                        />
                    )}

                    {activeTab === "regress" && claim && (
                        <ClaimRegressTab
                            claim={claim}
                            onManage={isReadOnly ? () => { } : () => setIsRegressModalOpen(true)}
                            onUpdate={handleCreateRegressFile}
                            onRefresh={fetchAllData}
                            readOnly={isReadOnly}
                        />
                    )}

                    {activeTab === "history" && (
                        <ClaimHistoryTab history={claim?.history} />
                    )}

                </div>

                {/* Chat Sidebar */}
                <div className="col-span-1 h-full">
                    <ClaimChat messages={messages} onSend={handleSend} />
                </div>
            </div>

            {/* Lightbox Overlay */}
            <Lightbox
                isOpen={lightboxIndex >= 0}
                onClose={() => setLightboxIndex(-1)}
                images={(viewingDocs ? docs : photos).map((p: any) => ({ src: p.content, alt: p.name, type: p.type }))}
                startIndex={lightboxIndex}
                onNavigate={setLightboxIndex}
            />



            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                title={editingPaymentIndex >= 0 ? "Modifică Referat de Plată" : "Adaugă Referat de Plată"}
                tempPayment={tempPayment}
                setTempPayment={setTempPayment}
                onSave={handleSavePayment}
                policyData={editingPaymentIndex === -1 ? policy : null} // Only suggest for new payments
                lockedAmount={undefined} // We handle specific locking inside modal based on selection
                reserveData={claim?.reserve}
                collaborators={collaborators}
            />

            {/* We could also move the RegressModal, but it's intertwined with state a lot. Keeping for now or moving next. */}
            <DraggableModal
                isOpen={isRegressModalOpen}
                onClose={() => setIsRegressModalOpen(false)}
                title="Dosar de Regres"
                initialWidth={700}
                initialHeight={650}
            >
                <div className="p-6 space-y-6">
                    {/* Type Selection */}
                    <div className="space-y-2">
                        <Label>Regres către:</Label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={claim?.regress?.type || ''}
                            onChange={(e) => {
                                if (!claim) return;
                                const currentRegress = claim.regress || { amount: '0', status: 'initiated', type: 'neighbor' };
                                setClaim({ ...claim, regress: { ...currentRegress, type: e.target.value } as any })
                            }}
                        >
                            <option value="" disabled>Selectează entitatea...</option>
                            <option value="neighbor">Persoană Fizică - Vecin</option>
                            <option value="tenant">Persoană Fizică - Chiriaș</option>
                            <option value="company">Societate de Asigurări</option>
                        </select>
                    </div>

                    {(claim?.regress?.type === 'neighbor' || claim?.regress?.type === 'tenant') && (
                        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="col-span-2">
                                <Label>Nume și Prenume ({claim?.regress?.type === 'tenant' ? 'Chiriaș' : 'Vecin'})</Label>
                                <Input
                                    placeholder="Numele persoanei..."
                                    value={claim?.regress?.name || ''}
                                    onChange={(e) => {
                                        if (!claim) return;
                                        setClaim({ ...claim, regress: { ...claim.regress!, name: e.target.value } as any })
                                    }}
                                />
                            </div>
                            <div className="col-span-2">
                                <Label>Adresă (Strada, Nr, Bloc, Scara)</Label>
                                <Input
                                    placeholder="Adresa completă..."
                                    value={claim?.regress?.address || ''}
                                    onChange={(e) => {
                                        if (!claim) return;
                                        setClaim({ ...claim, regress: { ...claim.regress!, address: e.target.value } as any })
                                    }}
                                />
                            </div>
                            <div>
                                <Label>Nr. Apartament</Label>
                                <Input
                                    placeholder="Ap..."
                                    value={claim?.regress?.apartment || ''}
                                    onChange={(e) => {
                                        if (!claim) return;
                                        setClaim({ ...claim, regress: { ...claim.regress!, apartment: e.target.value } as any })
                                    }}
                                />
                            </div>
                            <div>
                                <Label>Nr. Telefon</Label>
                                <Input
                                    placeholder="07xx..."
                                    value={claim?.regress?.phone || ''}
                                    onChange={(e) => {
                                        if (!claim) return;
                                        setClaim({ ...claim, regress: { ...claim.regress!, phone: e.target.value } as any })
                                    }}
                                />
                            </div>
                            <div className="col-span-2">
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    placeholder="email@exemplu.ro"
                                    value={claim?.regress?.email || ''}
                                    onChange={(e) => {
                                        if (!claim) return;
                                        setClaim({ ...claim, regress: { ...claim.regress!, email: e.target.value } as any })
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {claim?.regress?.type === 'company' && (
                        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="col-span-2">
                                <Label>Societate de Asigurări</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={claim?.regress?.companyName || ''}
                                    onChange={(e) => {
                                        const companies: any = {
                                            "Allianz-Tiriac": { email: "info@allianztiriac.ro", phone: "021.20.19.100" },
                                            "Groupama": { email: "relatii.clienti@groupama.ro", phone: "0374.110.110" },
                                            "Omniasig": { email: "sesizari@omniasig.ro", phone: "021.9669" },
                                            "Asirom": { email: "office@asirom.ro", phone: "021.9599" },
                                            "Generali": { email: "info@generali.ro", phone: "0372.01.02.02" },
                                            "Grawe": { email: "office@grawe.ro", phone: "021.312.60.03" },
                                            "Euroins": { email: "office@euroins.ro", phone: "Falvis" },
                                            "City Insurance": { email: "office@cityinsurance.ro", phone: "Falvis" }
                                        };
                                        const selected = e.target.value;
                                        const info = companies[selected] || { email: '', phone: '' };
                                        if (!claim) return;
                                        setClaim({
                                            ...claim,
                                            regress: {
                                                ...claim.regress!,
                                                companyName: selected,
                                                companyEmail: info.email,
                                                companyPhone: info.phone
                                            }
                                        });
                                    }}
                                >
                                    <option value="">Alege Societatea...</option>
                                    <option value="Allianz-Tiriac">Allianz-Tiriac Asigurări</option>
                                    <option value="Groupama">Groupama Asigurări</option>
                                    <option value="Omniasig">Omniasig VIG</option>
                                    <option value="Asirom">Asirom VIG</option>
                                    <option value="Generali">Generali România</option>
                                    <option value="Grawe">Grawe România</option>
                                    <option value="Euroins">Euroins (Faliment)</option>
                                    <option value="City Insurance">City Insurance (Faliment)</option>
                                </select>
                            </div>
                            <div>
                                <Label>Email Contact (Auto)</Label>
                                <Input
                                    readOnly
                                    className="bg-gray-50"
                                    value={claim?.regress?.companyEmail || ''}
                                />
                            </div>
                            <div>
                                <Label>Telefon Contact (Auto)</Label>
                                <Input
                                    readOnly
                                    className="bg-gray-50"
                                    value={claim?.regress?.companyPhone || ''}
                                />
                            </div>
                            <div>
                                <Label>Număr Poliță</Label>
                                <Input
                                    placeholder="Serie poliță RCA/PAD..."
                                    value={claim?.regress?.policyNo || ''}
                                    onChange={(e) => {
                                        if (!claim) return;
                                        setClaim({ ...claim, regress: { ...claim.regress!, policyNo: e.target.value } as any })
                                    }}
                                />
                            </div>
                            <div>
                                <Label>Număr Dosar Daună</Label>
                                <Input
                                    placeholder="Nr. dosar..."
                                    value={claim?.regress?.fileNo || ''}
                                    onChange={(e) => {
                                        if (!claim) return;
                                        setClaim({ ...claim, regress: { ...claim.regress!, fileNo: e.target.value } as any })
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Common Fields */}
                    <div className="border-t pt-4 space-y-4">
                        <div className="col-span-2">
                            <Label className="mb-2 block">Selectează Referatele de Plată pentru Regres:</Label>
                            {(() => {
                                const availablePayments = claim?.payments || (claim?.payment ? [claim.payment] : []) || [];
                                const linkedIndices = claim?.regress?.linkedPayments || []; // Array of indices

                                if (availablePayments.length === 0) {
                                    return <p className="text-sm text-red-500 italic">Nu există referate de plată disponibile. Creează un referat întâi.</p>;
                                }

                                return (
                                    <div className="grid grid-cols-1 gap-2 border rounded-md p-2 max-h-[150px] overflow-y-auto bg-gray-50">
                                        {availablePayments.map((p: any, idx: number) => {
                                            const isSelected = linkedIndices.includes(idx);
                                            return (
                                                <div key={idx} className="flex items-center space-x-2 p-2 bg-white rounded border">
                                                    <input
                                                        type="checkbox"
                                                        id={`pay-select-${idx}`}
                                                        className="h-4 w-4"
                                                        checked={isSelected}
                                                        onChange={(e) => {
                                                            let newIndices = [...linkedIndices];
                                                            if (e.target.checked) {
                                                                newIndices.push(idx);
                                                            } else {
                                                                newIndices = newIndices.filter((i: number) => i !== idx);
                                                            }

                                                            // Recalculate total amount
                                                            const total = newIndices.reduce((sum: number, i: number) => {
                                                                return sum + (parseFloat(availablePayments[i]?.amount) || 0);
                                                            }, 0);

                                                            if (!claim) return;
                                                            setClaim({
                                                                ...claim,
                                                                regress: {
                                                                    ...claim.regress!,
                                                                    linkedPayments: newIndices,
                                                                    amount: total.toFixed(2)
                                                                } as any
                                                            });
                                                        }}
                                                    />
                                                    <Label htmlFor={`pay-select-${idx}`} className="flex-1 cursor-pointer text-xs">
                                                        Referat #{idx + 1} - <span className="font-bold">{p.amount} RON</span> ({p.date})
                                                    </Label>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Suma Totală de Recuperat (RON)</Label>
                                <Input
                                    type="number"
                                    readOnly
                                    className="bg-gray-100 font-bold text-lg"
                                    placeholder="0.00"
                                    value={claim?.regress?.amount || '0.00'}
                                />
                                <p className="text-[10px] text-gray-500 mt-1">* Calculat automat din referatele selectate</p>
                            </div>
                            <div>
                                <Label>Status Regres</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={claim?.regress?.status || 'initiated'}
                                    onChange={(e) => {
                                        if (!claim) return;
                                        setClaim({ ...claim, regress: { ...claim.regress!, status: e.target.value } as any })
                                    }}
                                >
                                    <option value="initiated">Inițiat</option>
                                    <option value="notice_sent">Notificare Trimisă</option>
                                    <option value="agreed">Acord de Plată</option>
                                    <option value="in_progress">În Curs de Plată</option>
                                    <option value="completed">Recuperat Integral</option>
                                    <option value="legal">În Instanță</option>
                                    <option value="abandoned">Abandonat / Prescris</option>
                                </select>
                            </div>
                            <div className="col-span-2 space-y-2">
                                <Label>Note / Observații Regres</Label>
                                <Textarea
                                    placeholder="Detalii despre demersurile de recuperare..."
                                    value={claim?.regress?.notes || ''}
                                    onChange={(e) => claim && setClaim({ ...claim, regress: { ...(claim.regress || { type: 'neighbor', amount: '0', status: 'initiated' }), notes: e.target.value } })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t gap-2">
                        <Button variant="outline" onClick={() => setIsRegressModalOpen(false)}>Anulează</Button>
                        <Button className="bg-orange-600 hover:bg-orange-700" onClick={async () => {
                            await handleSaveNotification();
                            setIsRegressModalOpen(false);
                        }}>
                            Actualizează Dosar Regres
                        </Button>
                    </div>
                </div>
            </DraggableModal>
        </div>
    );
}
