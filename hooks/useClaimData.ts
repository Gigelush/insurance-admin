"use client";

import { useState, useEffect, useCallback } from "react";
import { Claim, Policy } from "@/types";

interface UseClaimDataReturn {
    claim: Claim | null;
    setClaim: (claim: Claim | null) => void;
    policy: Policy | null;
    messages: any[];
    collaborators: any[];
    relatedStats: { samePolicy: any[]; sameCnp: any[] };
    photos: any[];
    docs: any[];
    isReadOnly: boolean;
    isRegressFile: boolean;
    fetchAllData: () => Promise<void>;
    fetchMessages: () => Promise<void>;
    handleSend: (text: string) => Promise<void>;
    handleDeleteFile: (fileName: string) => Promise<void>;
    handleUploadFiles: (files: FileList | null, category: 'photo' | 'document' | 'estimate') => Promise<void>;
}

export function useClaimData(id: string): UseClaimDataReturn {
    const isRegressFile = id?.endsWith('-REGRES');

    const [claim, setClaim] = useState<Claim | null>(null);
    const [policy, setPolicy] = useState<Policy | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [collaborators, setCollaborators] = useState<any[]>([]);
    const [relatedStats, setRelatedStats] = useState<{ samePolicy: any[]; sameCnp: any[] }>({ samePolicy: [], sameCnp: [] });

    const photos = claim?.files?.filter((f: any) => f.category === 'photo' || (!f.category && f.type.startsWith('image/'))) || [];
    const docs = claim?.files?.filter((f: any) => f.category === 'document' || (!f.category && !f.type.startsWith('image/'))) || [];
    const isReadOnly = claim?.status === 'Finalizat';

    const fetchAllData = useCallback(async () => {
        try {
            const [claimsRes, policiesRes] = await Promise.all([
                fetch('/api/claims'),
                fetch('/api/policies')
            ]);

            if (claimsRes.ok && policiesRes.ok) {
                const allClaims = await claimsRes.json();
                const allPolicies = await policiesRes.json();

                const currentClaim = allClaims.find((c: any) => c.id === id);
                if (currentClaim) {
                    setClaim(currentClaim);

                    const currentPolicy = allPolicies.find((p: any) => p.id === currentClaim.policyId);
                    setPolicy(currentPolicy);

                    if (currentPolicy) {
                        const policyClaims = allClaims.filter((c: any) =>
                            c.policyId === currentClaim.policyId && c.id !== id
                        );
                        const cnpPolicies = allPolicies.filter((p: any) => p.cnp === currentPolicy.cnp).map((p: any) => p.id);
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
    }, [id]);

    const fetchMessages = useCallback(async () => {
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
    }, [id]);

    const handleSend = useCallback(async (text: string) => {
        if (!id) return;
        await fetch(`/api/claims/${encodeURIComponent(id)}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, sender: "agent" })
        });
        fetchMessages();
    }, [id, fetchMessages]);

    const handleDeleteFile = useCallback(async (fileName: string) => {
        if (!id) return;
        try {
            await fetch(`/api/claims/${encodeURIComponent(id)}/files`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: fileName })
            });
            fetchAllData();
        } catch (e) {
            console.error(e);
            alert("Eroare la ștergere.");
        }
    }, [id, fetchAllData]);

    const handleUploadFiles = useCallback(async (files: FileList | null, category: 'photo' | 'document' | 'estimate') => {
        if (!files || !id) return;

        const promises = Array.from(files).map(file => new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve({
                name: file.name,
                type: file.type,
                content: e.target?.result,
                category: category,
                uploadedAt: new Date().toISOString()
            });
            reader.readAsDataURL(file);
        }));

        try {
            const filesData = await Promise.all(promises);
            for (const fileData of filesData) {
                await fetch(`/api/claims/${encodeURIComponent(id)}/files`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(fileData)
                });
            }
            fetchAllData();
        } catch (e) {
            console.error(e);
            alert("Eroare la upload.");
        }
    }, [id, fetchAllData]);

    // Fetch collaborators
    useEffect(() => {
        fetch('/api/collaborators')
            .then(res => res.json())
            .then(data => setCollaborators(data))
            .catch(err => console.error("Failed to fetch collaborators", err));
    }, []);

    // Fetch claim data and start message polling
    useEffect(() => {
        if (id) {
            fetchAllData();
            fetchMessages();
            const interval = setInterval(fetchMessages, 3000);
            return () => clearInterval(interval);
        }
    }, [id, fetchAllData, fetchMessages]);

    return {
        claim,
        setClaim,
        policy,
        messages,
        collaborators,
        relatedStats,
        photos,
        docs,
        isReadOnly,
        isRegressFile,
        fetchAllData,
        fetchMessages,
        handleSend,
        handleDeleteFile,
        handleUploadFiles,
    };
}
