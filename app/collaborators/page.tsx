"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Gavel, Scale, Search, Plus, Trash2, Edit } from "lucide-react";
import { CollaboratorModal } from "@/components/collaborators/CollaboratorModal";

export default function CollaboratorsPage() {
    const [collaborators, setCollaborators] = useState<any[]>([]);
    const [filtered, setFiltered] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCollab, setEditingCollab] = useState<any>(null);
    const [tempCollab, setTempCollab] = useState<any>({});

    const fetchCollaborators = async () => {
        try {
            const res = await fetch('/api/collaborators');
            if (res.ok) {
                const data = await res.json();
                setCollaborators(data);
                setFiltered(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchCollaborators();
    }, []);

    useEffect(() => {
        let res = collaborators;
        if (typeFilter !== 'all') {
            res = res.filter(c => c.type === typeFilter);
        }
        if (search) {
            const lowerSearch = search.toLowerCase();
            res = res.filter(c =>
                c.companyName.toLowerCase().includes(lowerSearch) ||
                (c.cui || '').includes(lowerSearch) ||
                (c.details || '').toLowerCase().includes(lowerSearch)
            );
        }
        setFiltered(res);
    }, [search, typeFilter, collaborators]);

    const handleOpenAdd = () => {
        setEditingCollab(null);
        setTempCollab({ type: 'contractor', companyName: '' });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (collab: any) => {
        setEditingCollab(collab);
        setTempCollab({ ...collab });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!tempCollab.companyName) {
            alert("Numele companiei este obligatoriu!");
            return;
        }

        try {
            const method = editingCollab ? 'PUT' : 'POST';
            const url = editingCollab ? `/api/collaborators/${editingCollab.id}` : '/api/collaborators';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tempCollab)
            });

            if (res.ok) {
                fetchCollaborators();
                setIsModalOpen(false);
            } else {
                alert("Eroare la salvare.");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Sigur ștergi acest colaborator?")) return;
        try {
            const res = await fetch(`/api/collaborators/${id}`, { method: 'DELETE' });
            if (res.ok) fetchCollaborators();
        } catch (e) {
            console.error(e);
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'contractor': return <Badge variant="default" className="bg-blue-600"><Briefcase className="w-3 h-3 mr-1" /> Contractor</Badge>;
            case 'legal': return <Badge variant="secondary" className="bg-purple-100 text-purple-700"><Scale className="w-3 h-3 mr-1" /> Legal</Badge>;
            case 'expert': return <Badge variant="outline" className="border-orange-500 text-orange-600"><Gavel className="w-3 h-3 mr-1" /> Expert</Badge>;
            default: return type;
        }
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Colaboratori</h1>
                <Button onClick={handleOpenAdd} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" /> Adaugă Colaborator
                </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-4 items-center bg-white p-4 rounded-lg border shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Caută după nume, CUI, detalii..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <Button variant={typeFilter === 'all' ? 'default' : 'outline'} onClick={() => setTypeFilter('all')}>Toți</Button>
                    <Button variant={typeFilter === 'contractor' ? 'default' : 'outline'} onClick={() => setTypeFilter('contractor')}>Contractori</Button>
                    <Button variant={typeFilter === 'legal' ? 'default' : 'outline'} onClick={() => setTypeFilter('legal')}>Legal</Button>
                    <Button variant={typeFilter === 'expert' ? 'default' : 'outline'} onClick={() => setTypeFilter('expert')}>Experți</Button>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-lg border shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Companie</TableHead>
                            <TableHead>Tip</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Locație</TableHead>
                            <TableHead className="text-right">Acțiuni</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-gray-500">
                                    Nu s-au găsit colaboratori.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((collab) => (
                                <TableRow key={collab.id}>
                                    <TableCell>
                                        <div className="font-semibold">{collab.companyName}</div>
                                        <div className="text-xs text-gray-500">CUI: {collab.cui || '-'}</div>
                                    </TableCell>
                                    <TableCell>{getTypeLabel(collab.type)}</TableCell>
                                    <TableCell>
                                        <div className="text-sm">{collab.email}</div>
                                        <div className="text-sm text-gray-500">{collab.phone}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">{collab.city}</div>
                                        <div className="text-xs text-gray-500">{collab.county}</div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(collab)}>
                                                <Edit className="w-4 h-4 text-blue-500" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(collab.id)}>
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <CollaboratorModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                collab={tempCollab}
                setCollab={setTempCollab}
                onSave={handleSave}
                isEditing={!!editingCollab}
            />
        </div>
    );
}
