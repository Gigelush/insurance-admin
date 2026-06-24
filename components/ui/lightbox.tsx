"use client";

import { X, ChevronLeft, ChevronRight, Download, Move, ZoomIn, ZoomOut, GripHorizontal } from "lucide-react";
import { useEffect, useCallback, useState, useRef } from "react";
import { Button } from "@/components/ui/button";

interface LightboxProps {
    isOpen: boolean;
    onClose: () => void;
    images: { src: string; alt: string; type: string }[];
    startIndex: number;
    onNavigate: (index: number) => void;
}

export function Lightbox({ isOpen, onClose, images, startIndex, onNavigate }: LightboxProps) {
    const [position, setPosition] = useState({ x: 50, y: 50 }); // Initial position? Better centered dynamic.
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const modalRef = useRef<HTMLDivElement>(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanningImage, setIsPanningImage] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [size, setSize] = useState<{ width: number; height: number } | null>(null);
    const [isResizing, setIsResizing] = useState(false);

    // Initial Center
    useEffect(() => {
        if (isOpen) {
            // Simple center estimation or default fixed
            // We'll use fixed positioning with transform in style
            setPosition({ x: window.innerWidth / 2 - 500, y: window.innerHeight / 2 - 350 });
            setZoom(1);
            setPan({ x: 0, y: 0 });
        }
    }, [isOpen]);

    useEffect(() => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
        setSize(null);
    }, [startIndex]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!isOpen) return;
        if (e.key === "Escape") onClose();
        if (e.key === "ArrowLeft") onNavigate((startIndex - 1 + images.length) % images.length);
        if (e.key === "ArrowRight") onNavigate((startIndex + 1) % images.length);
    }, [isOpen, onClose, onNavigate, startIndex, images.length]);

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    // Drag Logic
    const handleMouseDown = (e: React.MouseEvent) => {
        if (modalRef.current) {
            e.preventDefault();
            setIsDragging(true);
            const rect = modalRef.current.getBoundingClientRect();
            setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            });
        }
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragOffset.x,
                y: e.clientY - dragOffset.y
            });
        } else if (isResizing) {
            const newWidth = Math.max(300, e.clientX - position.x);
            const newHeight = Math.max(200, e.clientY - position.y);
            setSize({ width: newWidth, height: newHeight });
        }
    }, [isDragging, dragOffset, isResizing, position]);

    const handleMouseUp = () => {
        setIsDragging(false);
        setIsResizing(false);
    };

    useEffect(() => {
        if (isDragging || isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing, handleMouseMove]);

    // Image Pan Logic
    const handleImageMouseDown = (e: React.MouseEvent) => {
        if (zoom > 1) {
            e.preventDefault();
            e.stopPropagation();
            setIsPanningImage(true);
            setPanStart({
                x: e.clientX - pan.x,
                y: e.clientY - pan.y
            });
        }
    };

    const handleImageMouseMove = useCallback((e: MouseEvent) => {
        if (isPanningImage) {
            e.preventDefault();
            setPan({
                x: e.clientX - panStart.x,
                y: e.clientY - panStart.y
            });
        }
    }, [isPanningImage, panStart]);

    const handleImageMouseUp = () => {
        setIsPanningImage(false);
    };

    useEffect(() => {
        if (isPanningImage) {
            window.addEventListener('mousemove', handleImageMouseMove);
            window.addEventListener('mouseup', handleImageMouseUp);
        } else {
            window.removeEventListener('mousemove', handleImageMouseMove);
            window.removeEventListener('mouseup', handleImageMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleImageMouseMove);
            window.removeEventListener('mouseup', handleImageMouseUp);
        };
    }, [isPanningImage, handleImageMouseMove]);


    if (!isOpen || images.length === 0) return null;

    const currentImage = images[startIndex];

    const isPdf = currentImage.type.includes('pdf') || currentImage.type === 'application/pdf';

    return (
        <div className="fixed inset-0 z-50 pointer-events-none select-none">
            {/* Window Container */}
            <div
                ref={modalRef}
                className={`absolute bg-black rounded-xl shadow-2xl border border-gray-700 pointer-events-auto flex flex-col overflow-hidden max-w-[95vw] max-h-[95vh] ${!size ? (isPdf ? 'w-[1000px] h-[90vh]' : 'w-auto h-auto min-h-[200px] min-w-[300px]') : ''}`}
                style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    width: size ? `${size.width}px` : undefined,
                    height: size ? `${size.height}px` : undefined,
                    cursor: isDragging ? 'grabbing' : 'auto'
                }}
            >
                {/* Header (Dragger) */}
                <div
                    className="h-10 bg-gray-900 flex items-center justify-between px-3 cursor-grab active:cursor-grabbing border-b border-gray-800"
                    onMouseDown={handleMouseDown}
                >
                    <div className="flex items-center gap-2 text-gray-400 text-xs select-none">
                        <Move className="w-4 h-4" />
                        <span>Previzualizare Fișier ({startIndex + 1}/{images.length})</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}>
                            <ZoomOut className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white" onClick={() => setZoom(z => Math.min(3, z + 0.25))}>
                            <ZoomIn className="w-4 h-4" />
                        </Button>
                        <div className="w-px h-4 bg-gray-700 mx-1"></div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-400" onClick={onClose}>
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className={`relative flex-1 bg-gray-950 flex items-center justify-center w-full isolate ${isPdf ? 'min-h-[500px]' : ''} ${(isDragging || isResizing) ? 'pointer-events-none' : ''}`}>
                    {/* Prev */}
                    <div className="absolute left-0 inset-y-0 flex items-center justify-center p-2 z-50 pointer-events-none">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full w-12 h-12 pointer-events-auto backdrop-blur-sm"
                            onClick={() => onNavigate((startIndex - 1 + images.length) % images.length)}
                        >
                            <ChevronLeft className="w-8 h-8" />
                        </Button>
                    </div>

                    {isPdf ? (
                        <iframe
                            src={`${currentImage.src}#toolbar=0&navpanes=0`}
                            className="w-full h-full bg-white block"
                            title={currentImage.alt}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center overflow-hidden cursor-move">
                            <img
                                src={currentImage.src}
                                alt={currentImage.alt}
                                className="max-h-[85vh] max-w-[85vw] object-contain select-none block"
                                style={{
                                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                                    cursor: zoom > 1 ? (isPanningImage ? 'grabbing' : 'grab') : 'default',
                                    transition: isPanningImage ? 'none' : 'transform 0.2s ease-out'
                                }}
                                onMouseDown={handleImageMouseDown}
                            />
                        </div>
                    )}

                    {/* Next */}
                    <div className="absolute right-0 inset-y-0 flex items-center justify-center p-2 z-50 pointer-events-none">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full w-12 h-12 pointer-events-auto backdrop-blur-sm"
                            onClick={() => onNavigate((startIndex + 1) % images.length)}
                        >
                            <ChevronRight className="w-8 h-8" />
                        </Button>
                    </div>
                </div>

                <div className="bg-gray-900 p-2 text-center text-xs text-gray-500 truncate border-t border-gray-800 relative">
                    {currentImage.alt}
                    {/* Resize Handle */}
                    <div
                        className="absolute bottom-1 right-1 cursor-se-resize text-gray-600 hover:text-white p-1"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsResizing(true);
                            if (!size && modalRef.current) {
                                const rect = modalRef.current.getBoundingClientRect();
                                setSize({ width: rect.width, height: rect.height });
                            }
                        }}
                    >
                        <GripHorizontal className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </div>
    );
}
