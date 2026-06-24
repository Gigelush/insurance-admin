
import { Card, CardContent } from "@/components/ui/card";
import { Image as ImageIcon, Upload, Download, Eye, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

import { FileAttachment } from "@/types";

interface ClaimFilesTabProps {
    photos: FileAttachment[];
    docs: FileAttachment[];
    onUploadRequests: (files: FileList | null, category: 'photo' | 'document') => void;
    onDelete: (file: { fileId?: string; name: string; category?: string }) => void;
    onView: (isDoc: boolean, index: number) => void;
    readOnly?: boolean;
}

export function ClaimFilesTab({ photos, docs, onUploadRequests, onDelete, onView, readOnly = false }: ClaimFilesTabProps) {
    return (
        <div className="grid grid-cols-2 gap-6 items-start">
            {/* Section 1: MATERIAL FOTO */}
            <Card>
                <div className="p-6 flex items-center justify-between">
                    <h3 className="text-2xl font-semibold flex items-center gap-2 text-blue-600">
                        <ImageIcon className="w-5 h-5" /> MATERIAL FOTO
                    </h3>
                    {!readOnly && (
                        <label
                            htmlFor="photo-upload-input"
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 gap-2 cursor-pointer"
                        >
                            <Upload className="w-4 h-4" /> Încarcă Poze
                        </label>
                    )}
                    <input
                        id="photo-upload-input"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        multiple
                        onChange={(e) => { onUploadRequests(e.target.files, 'photo'); e.target.value = ''; }}
                    />
                </div>
                <CardContent>
                    {photos.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-gray-50 text-gray-400">
                            <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                            <p className="text-sm">Nu există fotografii.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 gap-2">
                            {photos.map((photo: any, idx: number) => (
                                <div key={idx} className="flex flex-col">
                                    <div
                                        className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden border cursor-pointer hover:shadow-lg transition-all"
                                        onClick={() => photo.content ? onView(false, idx) : undefined}
                                    >
                                        {photo.content ? (
                                            <img
                                                src={photo.content}
                                                alt={photo.name}
                                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-2">
                                                <ImageIcon className="w-8 h-8 mb-1 opacity-40" />
                                                <p className="text-[10px] text-center truncate max-w-full">Conținut indisponibil</p>
                                            </div>
                                        )}
                                        {/* Hover Actions */}
                                        {photo.content && (
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Eye className="w-8 h-8 text-white drop-shadow-md" />
                                            </div>
                                        )}
                                        {/* Download Button */}
                                        {photo.content && (
                                            <div className="absolute top-2 right-10 opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={(e) => e.stopPropagation()}>
                                                <a href={photo.content} download={photo.name}>
                                                    <Button
                                                        variant="secondary"
                                                        size="icon"
                                                        className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-gray-700 shadow-sm"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </Button>
                                                </a>
                                            </div>
                                        )}
                                        {!readOnly && (
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-2 right-2 w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-600 shadow-sm"
                                                onClick={(e) => { e.stopPropagation(); onDelete(photo); }}
                                            >
                                                <Trash2 className="w-4 h-4 text-white" />
                                            </Button>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-gray-500 mt-1 truncate text-center" title={photo.name}>{photo.name}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Section 2: ACTE */}
            <Card>
                <div className="p-6 flex items-center justify-between">
                    <h3 className="text-2xl font-semibold flex items-center gap-2 text-orange-600">
                        <FileText className="w-5 h-5" /> ACTE & DOCUMENTE
                    </h3>
                    {!readOnly && (
                        <label
                            htmlFor="doc-upload-input"
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 gap-2 cursor-pointer"
                        >
                            <Upload className="w-4 h-4" /> Încarcă Documente
                        </label>
                    )}
                    <input
                        id="doc-upload-input"
                        type="file"
                        className="hidden"
                        accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,image/*"
                        multiple
                        onChange={(e) => { onUploadRequests(e.target.files, 'document'); e.target.value = ''; }}
                    />
                </div>
                <CardContent>
                    {docs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-gray-50 text-gray-400">
                            <FileText className="w-10 h-10 mb-2 opacity-50" />
                            <p className="text-sm">Nu există documente.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 gap-2">
                            {docs.map((doc: any, idx: number) => (
                                <div key={idx} className="flex flex-col">
                                    <div
                                        className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden border cursor-pointer hover:shadow-lg transition-all"
                                        onClick={() => onView(true, idx)}
                                    >
                                        {/* Content: Image, PDF thumbnail, or Icon */}
                                        <div className="w-full h-full flex items-center justify-center bg-white">
                                            {doc.type === 'application/pdf' ? (
                                                <div className="w-full h-full overflow-hidden relative">
                                                    <iframe
                                                        src={`${doc.content}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                                                        className="absolute top-0 left-0 border-0 pointer-events-none"
                                                        style={{ width: '200%', height: '200%', transform: 'scale(0.5)', transformOrigin: 'top left' }}
                                                        title={doc.name}
                                                    />
                                                </div>
                                            ) : doc.type.startsWith('image/') ? (
                                                <img src={doc.content} alt={doc.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex flex-col items-center gap-1 text-gray-400">
                                                    <FileText className="w-8 h-8 opacity-50" />
                                                    <span className="text-[10px] uppercase font-bold px-1 truncate max-w-[90%] text-center">{doc.type.split('/')[1] || 'DOC'}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Hover Actions (Eye) */}
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                                            <Eye className="w-8 h-8 text-white drop-shadow-md" />
                                        </div>

                                        {/* Download Button */}
                                        <div className="absolute top-2 right-10 opacity-0 group-hover:opacity-100 transition-opacity z-20" onClick={(e) => e.stopPropagation()}>
                                            <a href={doc.content} download={doc.name}>
                                                <Button
                                                    variant="secondary"
                                                    size="icon"
                                                    className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-gray-700 shadow-sm"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                            </a>
                                        </div>

                                        {!readOnly && (
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-2 right-2 w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-red-600 shadow-sm"
                                                onClick={(e) => { e.stopPropagation(); onDelete(doc); }}
                                            >
                                                <Trash2 className="w-4 h-4 text-white" />
                                            </Button>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-gray-500 mt-1 truncate text-center" title={doc.name}>{doc.name}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

