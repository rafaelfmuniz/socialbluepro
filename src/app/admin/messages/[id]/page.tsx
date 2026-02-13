"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { getContactMessageById, markMessageAsRead, deleteContactMessage } from "@/actions/contact";
import { useToast } from "@/lib/toast";
import { ArrowLeft, Check, X, Phone, Mail, Calendar, Trash2 } from "lucide-react";

export default function MessageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [message, setMessage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const resolvedParams = use(params);

  useEffect(() => {
    const loadMessage = async () => {
      try {
        const result = await getContactMessageById(resolvedParams.id);
        if (result.success && result.data) {
          setMessage(result.data);
          // Auto mark as read if unread
          if (result.data.status === "unread") {
            await markMessageAsRead(resolvedParams.id, true);
            result.data.status = "read";
            setMessage(result.data);
          }
        } else {
          addToast(result.error || "Message not found", "error");
          router.push("/admin/messages");
        }
      } catch (error) {
        addToast("An unexpected error occurred", "error");
        router.push("/admin/messages");
      } finally {
        setLoading(false);
      }
    };

    loadMessage();
  }, [resolvedParams.id]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this message?")) return;

    try {
      const result = await deleteContactMessage(resolvedParams.id);
      if (result.success) {
        addToast("Message deleted successfully", "success");
        router.push("/admin/messages");
      } else {
        addToast(result.error || "Failed to delete message", "error");
      }
    } catch (error) {
      addToast("An unexpected error occurred", "error");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!message) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() => router.push("/admin/messages")}
            className="flex items-center gap-2 text-slate-400 hover:text-accent mb-2 font-black text-xs uppercase tracking-widest transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Messages
          </button>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
            Message Details
          </h1>
          <p className="text-slate-500 text-sm font-bold mt-1">
            From {message.name}
          </p>
        </div>

        <button
          onClick={handleDelete}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-100 transition-all"
        >
          <Trash2 size={16} />
          Delete
        </button>
      </div>

      <div className="grid gap-6">
        {/* Contact Info Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-400">
                <Mail size={16} />
                <span className="text-[10px] uppercase tracking-widest font-black">Email</span>
              </div>
              <div className="font-mono text-sm text-slate-900 break-all">{message.email}</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-400">
                <Phone size={16} />
                <span className="text-[10px] uppercase tracking-widest font-black">Phone</span>
              </div>
              <div className="font-mono text-sm text-slate-900">{message.phone}</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-400">
                <Calendar size={16} />
                <span className="text-[10px] uppercase tracking-widest font-black">Received</span>
              </div>
              <div className="text-sm text-slate-900">{formatDate(message.created_at)}</div>
            </div>
          </div>
        </div>

        {/* Message Content Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-4">Message</h2>
          <div className="prose max-w-none">
            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed font-medium">
              {message.message}
            </p>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider",
                message.status === "unread"
                  ? "bg-accent/20 text-accent border border-accent/30"
                  : "bg-slate-100 text-slate-600 border border-slate-200"
              )}>
                {message.status === "unread" ? (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-accent rounded-full"></div>
                    Unread
                  </div>
                ) : (
                  "Read"
                )}
              </div>
              {message.status === "unread" && (
                <span className="text-sm text-slate-500 font-bold">New message</span>
              )}
            </div>

            {message.status === "unread" && (
              <button
                onClick={async () => {
                  const result = await markMessageAsRead(message.id, true);
                  if (result.success) {
                    addToast("Message marked as read", "success");
                    setMessage({ ...message, status: "read" });
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-xl font-black text-xs uppercase tracking-widest hover:bg-accent/20 transition-all"
              >
                <Check size={16} />
                Mark as Read
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
