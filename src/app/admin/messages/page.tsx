"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { getContactMessages, markMessageAsRead, deleteContactMessage, getContactMessagesCount } from "@/actions/contact";
import { useToast } from "@/lib/toast";
import { Check, Trash2, Eye, Mail, Phone, Calendar, ArrowUpDown } from "lucide-react";

import { PageContainer, PageHeader } from "@/components/ui/PageContainer";

export default function MessagesPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [counts, setCounts] = useState({ total: 0, unread: 0 });

  const loadMessages = async () => {
    setLoading(true);
    try {
      const result = await getContactMessages({
        status: filter === "all" ? undefined : filter,
        limit: 100,
        offset: 0
      });

      if (result.success && result.data) {
        setMessages(result.data);
      } else {
        addToast(result.error || "Failed to load messages", "error");
      }

      const countResult = await getContactMessagesCount();
      if (countResult.success && countResult.data) {
        setCounts(countResult.data);
      }
    } catch (error) {
      addToast("An unexpected error occurred", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [filter]);

  const handleMarkAsRead = async (messageId: string, isRead: boolean) => {
    try {
      const result = await markMessageAsRead(messageId, isRead);
      if (result.success) {
        addToast(`Message marked as ${isRead ? "read" : "unread"}`, "success");
        loadMessages();
      } else {
        addToast(result.error || "Failed to update status", "error");
      }
    } catch (error) {
      addToast("An unexpected error occurred", "error");
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;

    try {
      const result = await deleteContactMessage(messageId);
      if (result.success) {
        addToast("Message deleted successfully", "success");
        loadMessages();
      } else {
        addToast(result.error || "Failed to delete message", "error");
      }
    } catch (error) {
      addToast("An unexpected error occurred", "error");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-black uppercase tracking-wider";
    if (status === "unread") {
      return `${baseClasses} bg-accent/20 text-accent border border-accent/30`;
    }
    return `${baseClasses} bg-slate-100 text-slate-600 border border-slate-200`;
  };

  return (
    <PageContainer>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <PageHeader 
          title="Contact Messages" 
          description={`${counts.unread} unread / ${counts.total} total messages`}
        />

        <div className="flex gap-2 self-start sm:self-center">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all",
              filter === "all"
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            )}
          >
            All
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={cn(
              "px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all",
              filter === "unread"
                ? "bg-accent text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-accent/10"
            )}
          >
            Unread
          </button>
          <button
            onClick={() => setFilter("read")}
            className={cn(
              "px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all",
              filter === "read"
                ? "bg-slate-700 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            )}
          >
            Read
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-500 font-bold">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="p-12 text-center">
            <Mail className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-bold">No messages found</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status</span>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Name</span>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email</span>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Phone</span>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Message Preview</span>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Date</span>
                    </th>
                    <th className="px-6 py-4 text-right">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {messages.map((message) => (
                    <tr key={message.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className={getStatusBadge(message.status)}>
                          {message.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-black text-slate-900 text-sm uppercase tracking-wide">
                          {message.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600 font-mono max-w-[200px] truncate">
                          {message.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600 font-mono">{message.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-[300px]">
                          <p className="text-sm text-slate-600 line-clamp-2">
                            {message.message}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-500 font-mono">
                          <Calendar size={12} />
                          {formatDate(message.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => router.push(`/admin/messages/${message.id}`)}
                            className="p-2 text-slate-400 hover:text-accent hover:bg-accent/10 rounded-lg transition-all"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          {message.status === "unread" && (
                            <button
                              onClick={() => handleMarkAsRead(message.id, true)}
                              className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                              title="Mark as Read"
                            >
                              <Check size={16} />
                            </button>
                          )}
                          {message.status === "read" && (
                            <button
                              onClick={() => handleMarkAsRead(message.id, false)}
                              className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                              title="Mark as Unread"
                            >
                              <Eye size={16} className="opacity-50" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(message.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden divide-y divide-slate-100">
              {messages.map((message) => (
                <div key={message.id} className="p-4 space-y-4 hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <span className={getStatusBadge(message.status)}>
                          {message.status}
                        </span>
                        <h3 className="font-black text-slate-900 text-base uppercase tracking-wide pt-2 break-words">
                          {message.name}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                          <Calendar size={12} />
                          {formatDate(message.created_at)}
                        </div>
                      </div>
                      
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => router.push(`/admin/messages/${message.id}`)}
                          className="p-2 text-slate-400 hover:text-accent hover:bg-accent/10 rounded-lg transition-all"
                        >
                          <Eye size={20} />
                        </button>
                        <button
                          onClick={() => handleDelete(message.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2 font-mono text-xs break-all">
                        <Mail size={14} className="text-slate-400 shrink-0" />
                        {message.email}
                      </div>
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <Phone size={14} className="text-slate-400 shrink-0" />
                        {message.phone}
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <p className="text-sm text-slate-600 line-clamp-3 italic">
                        "{message.message}"
                      </p>
                    </div>

                    <div className="pt-2">
                      {message.status === "unread" ? (
                        <button
                          onClick={() => handleMarkAsRead(message.id, true)}
                          className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider px-4 py-3 bg-accent hover:bg-green-600 rounded-xl w-full justify-center transition-colors shadow-sm"
                        >
                          <Check size={16} />
                          Mark as Read
                        </button>
                      ) : (
                        <button
                          onClick={() => handleMarkAsRead(message.id, false)}
                          className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl w-full justify-center transition-colors"
                        >
                          <Eye size={16} className="opacity-50" />
                          Mark as Unread
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </PageContainer>
  );
}
