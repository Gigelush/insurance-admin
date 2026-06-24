
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Download } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Message } from "@/types";

interface ClaimChatProps {
    messages: Message[];
    onSend: (text: string) => void;
}

export function ClaimChat({ messages, onSend }: ClaimChatProps) {
    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;
        onSend(input);
        setInput("");
    };

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" /> Chat Dosar
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-4 bg-gray-50/50 overflow-hidden">
                <div className="flex-1 space-y-4 mb-4 overflow-y-auto pr-2">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-lg p-3 text-sm ${msg.sender === 'agent'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white border text-gray-800'
                                }`}>
                                {msg.attachment ? (
                                    <div className="mb-2">
                                        {msg.attachment.type === 'image' ? (
                                            <img src={msg.attachment.content} alt="Attachment" className="rounded-lg max-w-full max-h-[200px] object-cover bg-white" />
                                        ) : (
                                            <div className="flex items-center gap-2 p-2 bg-black/10 rounded-lg">
                                                <Download className="w-4 h-4" />
                                                <span className="underline truncate max-w-[150px]">{msg.attachment.name}</span>
                                            </div>
                                        )}
                                        <a href={msg.attachment.content} download={msg.attachment.name} className="block text-center text-xs underline mt-1 opacity-80 hover:opacity-100">
                                            Download {msg.attachment.type === 'image' ? 'Image' : 'File'}
                                        </a>
                                    </div>
                                ) : null}
                                <p>{msg.text}</p>
                                <p className={`text-[10px] mt-1 text-right ${msg.sender === 'agent' ? 'text-blue-100' : 'text-gray-400'}`}>{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                <div className="flex gap-2">
                    <input
                        className="flex-1 border rounded-md px-3 py-2 text-sm"
                        placeholder="Scrie un mesaj..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <Button size="sm" onClick={handleSend} className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md">Trimite</Button>
                </div>
            </CardContent>
        </Card>
    );
}
