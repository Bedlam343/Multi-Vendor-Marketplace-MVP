"use client";

import { useState } from "react";
import { Send, X, Loader2 } from "lucide-react";
import Image from "next/image";

import { type ItemWithSeller } from "@/data/items";
import { sendFirstMessage } from "@/services/chat/actions";

interface FirstMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ItemWithSeller;
}

export default function FirstMessageModal({
  isOpen,
  onClose,
  item,
}: FirstMessageModalProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSending(true);

    const result = await sendFirstMessage({
      itemId: item.id,
      content: message,
    });

    if (result.success && result.data?.conversationId) {
      setMessage("");
      
      window.open(`/messages/${result.data.conversationId}`, "_blank");
      
      onClose();
    } else {
      alert(result.message || "Failed to send message");
    }
    
    setIsSending(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* ... (Header and Product Context remain exactly the same) ... */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <h3 className="font-bold text-foreground">Message Seller</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex gap-4 bg-card">
          <div className="relative w-16 h-16 bg-muted rounded-lg overflow-hidden border border-border shrink-0">
            {item.images && item.images.length > 0 ? (
              <Image
                src={item.images[0]}
                alt={item.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                No Img
              </div>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Inquiring about
            </p>
            <h4 className="font-bold text-foreground line-clamp-1">
              {item.title}
            </h4>
            <p className="text-sm font-medium text-primary">
              ${Number(item.price).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Message Form */}
        <form onSubmit={handleSend} className="p-4 pt-0">
          <div className="relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Hi ${item.seller?.name || "Seller"}, is this still available?`}
              className="w-full h-32 p-4 bg-muted/20 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none text-sm transition-all"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!message.trim() || isSending}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Message
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}