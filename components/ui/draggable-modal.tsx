"use client";

import { X, GripHorizontal, Move } from "lucide-react";
import { useEffect, useCallback, useState, useRef } from "react";
import { Button } from "@/components/ui/button";

interface DraggableModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    initialWidth?: number;
    initialHeight?: number;
    className?: string;
}

export function DraggableModal({
    isOpen,
    onClose,
    title,
    children,
    initialWidth = 800,
    initialHeight = 600,
    className
}: DraggableModalProps) {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [size, setSize] = useState<{ width: number; height: number } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const modalRef = useRef<HTMLDivElement>(null);

    // Initial Center
    useEffect(() => {
        if (isOpen) {
            setPosition({
                x: Math.max(0, window.innerWidth / 2 - (size?.width || initialWidth) / 2),
                y: Math.max(0, window.innerHeight / 2 - (size?.height || initialHeight) / 2)
            });
            if (!size) {
                setSize({ width: initialWidth, height: initialHeight });
            }
        }
    }, [isOpen]);

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
            const newWidth = Math.max(400, e.clientX - position.x);
            const newHeight = Math.max(300, e.clientY - position.y);
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 pointer-events-none">
            <div
                ref={modalRef}
                className={`absolute bg-white rounded-xl shadow-2xl border border-gray-200 pointer-events-auto flex flex-col overflow-hidden ${className || ''}`}
                style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    width: size ? `${size.width}px` : `${initialWidth}px`,
                    height: size ? `${size.height}px` : `${initialHeight}px`,
                    cursor: isDragging ? 'grabbing' : 'auto'
                }}
            >
                {/* Header (Dragger) */}
                <div
                    className="h-12 bg-gray-50 flex items-center justify-between px-4 cursor-grab active:cursor-grabbing border-b border-gray-100 select-none"
                    onMouseDown={handleMouseDown}
                >
                    <div className="flex items-center gap-2 text-gray-700 font-semibold">
                        <Move className="w-4 h-4 text-gray-400" />
                        <span>{title}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Content */}
                <div className={`flex-1 overflow-auto p-0 relative ${(isDragging || isResizing) ? 'pointer-events-none' : ''}`}>
                    {children}

                    {/* Resize Handle */}
                    <div
                        className="fixed bottom-1 right-1 cursor-se-resize text-gray-400 hover:text-gray-600 p-1 bg-white/50 rounded-tl-lg"
                        style={{ position: 'absolute' }}
                        onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsResizing(true);
                        }}
                    >
                        <GripHorizontal className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </div>
    );
}
