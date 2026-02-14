"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Phone, MapPin, Clock, FileText, Tag, MessageSquare, User, CheckCircle, Download, Trash2, Edit, Globe, Loader2 } from "lucide-react";
import { Attachment } from "@/actions/leads";
import { getLeadNotes, addLeadNote, deleteLeadNote, LeadNote } from "@/actions/lead-notes";
import { cn } from "@/lib/utils";
import { useToast } from "@/lib/toast";
import { useState, useEffect, useCallback } from "react";
import { resolveAttachmentUrl } from "@/lib/attachments";
import { SourceBadge } from "./SourceBadge";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  address_line1?: string;
  city?: string;
  state?: string;
  zip_code: string;
  service_interest: string;
  status: string;
  description?: string;
  notes: string;
  attachments?: Attachment[];
  assigned_to?: string | null;
  assigned_at?: string | null;
  assigned_user_name?: string | null;
  created_at: string;
  // UTM Tracking
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
}

interface LeadDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  onStatusChange?: (leadId: string, newStatus: "new" | "contacted" | "closed") => void;
  onDelete?: (leadId: string) => void;
  onAssignLead?: (leadId: string, userId: string | null) => void;
  adminUsers?: { id: string; name: string; email: string; role: string }[];
}

export default function LeadDetailModal({ isOpen, onClose, lead, onStatusChange, onDelete, onAssignLead, adminUsers = [] }: LeadDetailModalProps) {
  const { addToast } = useToast();
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [downloadingAttachments, setDownloadingAttachments] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);



  useEffect(() => {
    if (showToast && toastMessage) {
      const timer = setTimeout(() => {
        setShowToast(false);
        setToastMessage("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast, toastMessage]);

  const fetchNotes = useCallback(async () => {
    if (!lead) return;
    setNotesLoading(true);
    try {
      const notes = await getLeadNotes(lead.id);
      setNotes(notes);
    } catch (error) {
      console.error("Failed to fetch notes:", error);
    } finally {
      setNotesLoading(false);
    }
  }, [lead]);

  useEffect(() => {
    if (isOpen && lead) {
      fetchNotes();
    }
  }, [isOpen, lead, fetchNotes]);

   async function handleAddNote() {
    if (!lead || !newNoteContent.trim()) return;
    setAddingNote(true);
    try {
      console.log("Adding note for lead:", lead.id, "content:", newNoteContent.trim());
      const result = await addLeadNote(lead.id, newNoteContent.trim());
      console.log("Add note result:", result);
      if (result.success) {
        setNewNoteContent("");
        await fetchNotes();
        // Show success toast
        setToastMessage("✅ Note added successfully");
        setShowToast(true);
       } else {
         console.error("Failed to add note:", result.error);
         addToast("❌ Failed to add note: " + result.error, "error");
       }
     } catch (error) {
       console.error("Failed to add note:", error);
       addToast("❌ Failed to add note: " + (error instanceof Error ? error.message : "Unknown error"), "error");
     } finally {
      setAddingNote(false);
    }
  }

  async function handleDeleteNote(noteId: string) {
    setNoteToDelete(noteId);
  }

  async function handleDeleteNoteConfirm() {
    if (!noteToDelete) return;
    try {
      const result = await deleteLeadNote(noteToDelete);
      if (result.success) {
        await fetchNotes();
        addToast("✅ Note deleted successfully", "success");
      } else {
        addToast("❌ Failed to delete note: " + result.error, "error");
      }
    } catch (error) {
      console.error("Failed to delete note:", error);
      addToast("❌ Failed to delete note: " + (error instanceof Error ? error.message : "Unknown error"), "error");
    } finally {
      setNoteToDelete(null);
    }
  }

  if (!lead) return null;


  const handleDownloadAttachments = async () => {
    if (!lead?.attachments || lead.attachments.length === 0) {
      setDownloadMessage("No attachments to download");
      const timer = setTimeout(() => setDownloadMessage(""), 3000);
      void timer;
      return;
    }
    
    setDownloadingAttachments(true);
    setDownloadMessage(`Downloading ${lead.attachments.length} file(s)...`);
    
    try {
      let successCount = 0;
      let failCount = 0;
      
       // Download each attachment individually with small delay between downloads
       for (let i = 0; i < lead.attachments.length; i++) {
         const att = lead.attachments[i];
         try {
        const attachmentUrl = resolveAttachmentUrl(att.url);

        const link = document.createElement('a');
        link.href = attachmentUrl;
           link.download = att.name || `attachment-${i + 1}`;
           link.target = '_blank';
           link.style.display = 'none';
           
           // Add to body and trigger click
           document.body.appendChild(link);
           link.click();
           
           // Remove after a short delay
            const timer = setTimeout(() => {
              document.body.removeChild(link);
            }, 100);
            void timer;
           
           successCount++;
           
           // Small delay between downloads to avoid browser blocking
           if (i < lead.attachments.length - 1) {
             await new Promise(resolve => setTimeout(resolve, 300));
           }
         } catch (error) {
           console.error(`Failed to download ${att.name}:`, error);
           failCount++;
         }
       }
      
      // Show result message
      if (successCount > 0 && failCount === 0) {
        setDownloadMessage(`✅ Started download of ${successCount} file(s). Check your browser downloads.`);
      } else if (successCount > 0 && failCount > 0) {
        setDownloadMessage(`⚠️ Downloaded ${successCount} file(s), ${failCount} failed.`);
      } else {
        setDownloadMessage("❌ Failed to download files. Check console for errors.");
      }
      
    } catch (error) {
      console.error("Download failed:", error);
      setDownloadMessage("❌ Download failed. Check console for errors.");
    } finally {
      setDownloadingAttachments(false);
      // Clear message after 5 seconds
      const timer = setTimeout(() => setDownloadMessage(""), 5000);
      void timer;
    }
  };

  const handleExportLead = () => {
    if (!lead) return;
    
    // Create a clean export object without circular references
    const exportData = {
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      address: lead.address_line1,
      city: lead.city,
      state: lead.state,
      zip_code: lead.zip_code,
      service_interest: lead.service_interest,
      status: lead.status,
      description: lead.description,
      notes: lead.notes,
      assigned_to: lead.assigned_user_name,
      created_at: lead.created_at,
      attachments_count: lead.attachments?.length || 0
    };
    
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lead-${lead.name.replace(/\s+/g, '-').toLowerCase()}-${lead.id.substring(0, 8)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isImageFile = (fileName: string) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    return imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
  };

  const getAttachmentStatus = (att: Attachment) => {
    // Handle legacy attachments (backward compatibility)
    if (!('status' in att)) {
      return 'ready';
    }
    return att.status;
  };

  const isVideoFile = (fileName: string) => {
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
    return videoExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-3 md:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col mx-2 sm:mx-3 md:mx-4"
          >
            {/* Header */}
            <div className="p-3 sm:p-4 md:p-6 lg:p-8 border-b border-slate-100 flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mb-2">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 rounded-lg sm:rounded-xl flex items-center justify-center font-black text-base sm:text-lg shadow-inner shrink-0">
                    {lead.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 tracking-tighter uppercase truncate">{lead.name}</h2>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium truncate">{lead.email}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                  <span className={cn(
                    "px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                    lead.status === "new" ? "bg-green-50 text-green-700 border-green-100" :
                    lead.status === "contacted" ? "bg-blue-50 text-blue-700 border-blue-100" :
                    "bg-slate-50 text-slate-500 border-slate-200"
                  )}>
                    {lead.status}
                  </span>
                  <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest border border-slate-200">
                    {lead.service_interest}
                  </span>
                  <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-accent/10 text-accent text-[10px] font-black uppercase tracking-widest border border-accent/20">
                    {lead.city || "Colorado"}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 bg-slate-100 rounded-full text-slate-500 hover:text-slate-900 transition-colors shrink-0 ml-2"
              >
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Toast Notification */}
            {showToast && (
              <div className="fixed top-4 right-4 left-4 md:left-auto z-[1000]">
                <div className="bg-accent text-white px-4 py-3 rounded-xl shadow-lg font-bold text-sm text-center animate-pulse">
                  {toastMessage}
                </div>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8">
              <div className="space-y-4 sm:space-y-6 md:space-y-8">
                {/* Lead Details - Full Width */}
                <div className="space-y-8">
                  {/* Contact Information */}
                  <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                      <User size={16} /> Contact Information
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Email</p>
                        <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-slate-700 font-bold hover:text-accent transition-colors">
                          <Mail size={14} /> {lead.email}
                        </a>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Phone</p>
                        <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-slate-700 font-bold hover:text-accent transition-colors">
                          <Phone size={14} /> {lead.phone}
                        </a>
                      </div>
                    </div>
                  </section>

                  {/* Location Information */}
                  <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                      <MapPin size={16} /> Location
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Address</p>
                        <p className="text-slate-700 font-bold">
                          {lead.address_line1 || "Not provided"}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">City/State/ZIP</p>
                        <p className="text-slate-700 font-bold">
                          {[lead.city, lead.state, lead.zip_code].filter(Boolean).join(", ")}
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Service Details */}
                  <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                      <FileText size={16} /> Service Details
                    </h3>
                    <div className="space-y-4">
                      <div>
                         <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Service Required</p>
                         <p className="text-slate-700 font-bold text-lg">{lead.service_interest}</p>
                       </div>
                     </div>
                   </section>

                  {/* Marketing Data */}
                    <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                        <Globe size={16} /> Marketing Data
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Source</p>
                            <SourceBadge source={lead.utm_source} medium={lead.utm_medium} />
                          </div>
                        </div>
                        {(lead.utm_campaign || lead.utm_term || lead.utm_content) && (
                        <div className="grid grid-cols-2 gap-4">
                          {lead.utm_campaign && (
                            <div>
                              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Campaign</p>
                              <p className="text-slate-700 font-bold text-sm">{lead.utm_campaign}</p>
                            </div>
                          )}
                          {lead.utm_term && (
                            <div>
                              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Term</p>
                              <p className="text-slate-700 font-bold text-sm">{lead.utm_term}</p>
                            </div>
                          )}
                          {lead.utm_content && (
                            <div>
                              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Content</p>
                              <p className="text-slate-700 font-bold text-sm">{lead.utm_content}</p>
                            </div>
                          )}
                        </div>
                        )}
                      </div>
                    </section>

                  {/* Project Description */}
                  {lead.description && (
                    <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                        <FileText size={16} /> Project Description
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Description</p>
                          <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">{lead.description}</p>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* Attachments */}
                  {lead.attachments && lead.attachments.length > 0 && (
                     <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                       <div className="flex justify-between items-center mb-4">
                         <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                           <Download size={16} /> Attachments ({lead.attachments.length})
                         </h3>
                         <div className="flex flex-col items-end gap-1">
                           <button
                             onClick={handleDownloadAttachments}
                             disabled={downloadingAttachments}
                             className="text-[10px] font-black uppercase tracking-widest text-accent hover:text-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                           >
                             {downloadingAttachments ? (
                               <>
                                 <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-accent"></div>
                                 Downloading...
                               </>
                             ) : (
                               'Download All'
                             )}
                           </button>
                           {downloadMessage && (
                             <div className="text-[9px] font-bold text-slate-500 max-w-[200px] text-right">
                               {downloadMessage}
                             </div>
                           )}
                         </div>
                       </div>
                         <div className="grid grid-cols-4 gap-3">
                           {lead.attachments.map((att, idx) => {
                             const attachmentUrl = resolveAttachmentUrl(att.url);
                             const isImage = isImageFile(att.name);
                             const isVideo = isVideoFile(att.name);
                             const status = getAttachmentStatus(att);
                             
                             // Processing state
                             if (status === 'processing') {
                               return (
                                 <div
                                   key={idx}
                                   className="bg-white p-3 rounded-xl border border-slate-200 cursor-not-allowed"
                                 >
                                   <div className="aspect-square bg-slate-50 rounded-lg mb-2 flex items-center justify-center">
                                     <Loader2 className="text-accent animate-spin" size={20} />
                                   </div>
                                   <p className="text-[10px] font-bold text-slate-600 truncate" title={att.name}>
                                     {att.name}
                                   </p>
                                   <p className="text-[8px] text-amber-500 font-bold">Processando...</p>
                                 </div>
                               );
                             }
                             
                             // Failed state
                             if (status === 'failed') {
                               return (
                                 <div
                                   key={idx}
                                   className="bg-white p-3 rounded-xl border border-red-200"
                                   title={att.error || 'Falha no processamento'}
                                 >
                                   <div className="aspect-square bg-red-50 rounded-lg mb-2 flex items-center justify-center">
                                     <FileText className="text-red-400" size={20} />
                                   </div>
                                   <p className="text-[10px] font-bold text-slate-600 truncate" title={att.name}>
                                     {att.name}
                                   </p>
                                   <p className="text-[8px] text-red-500 font-bold">Falha</p>
                                 </div>
                               );
                             }
                             
                             // Ready state (normal rendering)
                             return (
                               <a
                                 key={idx}
                                 href={attachmentUrl}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="bg-white p-3 rounded-xl border border-slate-200 hover:border-accent transition-colors group"
                               >
                                 {isImage ? (
                                   <div className="aspect-square bg-slate-100 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                                     <img
                                       src={attachmentUrl}
                                       alt={att.name}
                                       className="max-w-full max-h-full object-contain"
                                       loading="lazy"
                                     />
                                   </div>
                                 ) : isVideo ? (
                                   <div className="aspect-square bg-slate-100 rounded-lg mb-2 flex items-center justify-center relative">
                                     <FileText className="text-slate-400 group-hover:text-accent" size={20} />
                                     <div className="absolute inset-0 flex items-center justify-center">
                                       <div className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center">
                                         <div className="w-0 h-0 border-t-4 border-t-transparent border-l-6 border-l-white border-b-4 border-b-transparent ml-0.5" />
                                       </div>
                                     </div>
                                   </div>
                                 ) : (
                                   <div className="aspect-square bg-slate-100 rounded-lg mb-2 flex items-center justify-center">
                                     <FileText className="text-slate-400 group-hover:text-accent" size={20} />
                                   </div>
                                 )}
                                 <p className="text-[10px] font-bold text-slate-600 truncate" title={att.name}>
                                   {att.name}
                                 </p>
                                 <p className="text-[8px] text-slate-400 font-bold">{Math.round(att.size / 1024)} KB</p>
                               </a>
                             );
                           })}
                         </div>
                    </section>
                  )}
                </div>

                {/* Bottom Section - Reorganized as requested */}
                <div className="space-y-8 mt-8 pt-8 border-t border-slate-100">
                  {/* Row 1: Assignment and Timeline */}
                  <div className="grid lg:grid-cols-2 gap-8">
                    {/* Assignment */}
                    {onAssignLead && (
                      <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                          <User size={16} /> Assignment
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Assigned To</p>
                            {lead.assigned_user_name ? (
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                                  <User size={14} className="text-accent" />
                                </div>
                                <div>
                                  <p className="text-slate-700 font-bold text-sm">{lead.assigned_user_name}</p>
                                  {lead.assigned_at && (
                                    <p className="text-[10px] text-slate-400 font-bold">
                                      Assigned {new Date(lead.assigned_at).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <p className="text-slate-400 font-medium text-sm italic mb-3">Not assigned</p>
                            )}
                            <select
                              value={lead.assigned_to || ""}
                              onChange={(e) => onAssignLead(lead.id, e.target.value || null)}
                              className="w-full px-3 py-2 rounded-lg text-xs font-bold border border-slate-200 bg-white text-slate-700 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/20"
                            >
                              <option value="">Unassign</option>
                              {adminUsers.map(user => (
                                <option key={user.id} value={user.id}>
                                  {user.name} ({user.role})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="pt-3 border-t border-slate-100">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Quick Actions</p>
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => onAssignLead(lead.id, null)}
                                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                              >
                                Unassign
                              </button>
                              {adminUsers.slice(0, 2).map(user => (
                                <button
                                  key={user.id}
                                  onClick={() => onAssignLead(lead.id, user.id)}
                                  className="px-3 py-1.5 rounded-lg bg-accent/10 text-accent text-[10px] font-black uppercase tracking-widest hover:bg-accent/20 transition-all"
                                >
                                  Assign to {user.name.split(' ')[0]}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </section>
                    )}

                    {/* Timeline */}
                    <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                        <Clock size={16} /> Timeline
                      </h3>
                      <div className="space-y-4">
                        <div className="flex gap-3">
                          <div className="w-2 h-2 bg-accent rounded-full mt-2"></div>
                          <div>
                            <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Lead Created</p>
                            <p className="text-[10px] text-slate-400 font-bold">{formatDate(lead.created_at)}</p>
                          </div>
                        </div>
                        <div className="flex gap-3 opacity-50">
                          <div className="w-2 h-2 bg-slate-300 rounded-full mt-2"></div>
                          <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Last Contact</p>
                            <p className="text-[10px] text-slate-400 font-bold">Not contacted yet</p>
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>

                  {/* Row 2: Notes (full width) */}
                  <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <MessageSquare size={16} /> Notes ({notes.length})
                      </h3>
                    </div>
                    
                    {notesLoading ? (
                      <div className="py-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
                        <p className="mt-4 text-slate-400 text-xs font-bold">Loading notes...</p>
                      </div>
                    ) : (
                      <>
                        {/* Notes List */}
                        <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
                          {notes.length === 0 ? (
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center">
                              <p className="text-slate-400 text-sm italic font-medium">No notes added yet.</p>
                              <p className="text-slate-300 text-xs font-bold mt-1">Add your first note below.</p>
                            </div>
                          ) : (
                            notes.map((note) => (
                              <div key={note.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 group hover:bg-slate-100 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <p className="text-xs font-black text-slate-900 uppercase tracking-widest">{note.author_name || "Unknown"}</p>
                                    <p className="text-[10px] text-slate-400 font-bold">{formatDate(note.created_at)}</p>
                                  </div>
                                  <button
                                    onClick={() => handleDeleteNote(note.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                    title="Delete note"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                                <p className="text-slate-600 font-medium text-sm leading-relaxed whitespace-pre-wrap">{note.content}</p>
                                {note.type === 'activity' && (
                                  <span className="inline-block mt-2 px-2 py-0.5 bg-blue-50 text-blue-700 text-[8px] font-black uppercase tracking-widest rounded-full">Activity</span>
                                )}
                              </div>
                            ))
                          )}
                        </div>

                        {/* Add New Note */}
                        <div className="space-y-3">
                          <textarea
                            value={newNoteContent}
                            onChange={(e) => setNewNoteContent(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-medium text-slate-900 text-sm resize-none"
                            rows={3}
                            placeholder="Add a new note about this lead..."
                            disabled={addingNote}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleAddNote}
                              disabled={addingNote || !newNoteContent.trim()}
                              className="flex-1 bg-accent text-white px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {addingNote ? "Adding..." : "Add Note"}
                            </button>
                            <button
                              onClick={() => setNewNoteContent("")}
                              className="flex-1 bg-slate-100 text-slate-600 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </section>

                   {/* Row 3: Quick Actions */}
                   <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                     <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4">Quick Actions</h3>
                     <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                       <button
                         onClick={(e) => {
                            onStatusChange?.(lead.id, "contacted");
                           // Add feedback
                           const btn = e.currentTarget;
                           btn.classList.add('bg-blue-600', 'text-white');
                            const timer = setTimeout(() => {
                              btn.classList.remove('bg-blue-600', 'text-white');
                            }, 300);
                            void timer;
                           // Show toast
                           setToastMessage("✅ Lead marked as contacted");
                           setShowToast(true);
                         }}
                         className="bg-blue-50 text-blue-700 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all flex items-center justify-center gap-2"
                       >
                         <CheckCircle size={14} /> Mark Contacted
                       </button>
                       <button
                         onClick={(e) => {
                            onStatusChange?.(lead.id, "closed");
                           // Add feedback
                           const btn = e.currentTarget;
                           btn.classList.add('bg-slate-800', 'text-white');
                            const timer = setTimeout(() => {
                              btn.classList.remove('bg-slate-800', 'text-white');
                            }, 300);
                            void timer;
                           // Show toast
                           setToastMessage("✅ Lead closed");
                           setShowToast(true);
                         }}
                         className="bg-slate-50 text-slate-700 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest border border-slate-300 hover:bg-slate-100 hover:border-slate-400 transition-all flex items-center justify-center gap-2"
                       >
                         <Tag size={14} /> Close Lead
                       </button>
                        <button
                          onClick={() => setShowStatusModal(true)}
                          className="bg-white text-slate-700 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest border border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all flex items-center justify-center gap-2"
                        >
                          <Edit size={14} /> Edit Status
                        </button>
                       <button
                         onClick={() => {
                           if (onDelete) {
                             onDelete(lead.id);
                             // Show toast (if modal stays open)
                             setToastMessage("🗑️ Lead deleted");
                             setShowToast(true);
                           }
                         }}
                         className="bg-red-50 text-red-700 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest border border-red-300 hover:bg-red-100 hover:border-red-400 transition-all flex items-center justify-center gap-2"
                       >
                         <Trash2 size={14} /> Delete
                       </button>
                     </div>
                   </section>
                </div>
              </div>
            </div>

            {/* Status Update Modal */}
            {showStatusModal && (
              <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                <div 
                  className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm" 
                  onClick={() => setShowStatusModal(false)}
                />
                <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6">
                  <h3 className="text-lg font-black tracking-tighter uppercase text-slate-900 mb-4">Update Lead Status</h3>
                  <p className="text-slate-500 text-sm mb-6">Select the new status for {lead.name}</p>
                  <div className="space-y-3">
                    {['new', 'contacted', 'closed'].map((status) => (
                       <button
                         key={status}
                         onClick={() => {
                            onStatusChange?.(lead.id, status as "new" | "contacted" | "closed");
                           setShowStatusModal(false);
                           // Show toast
                           setToastMessage(`✅ Status updated to ${status}`);
                           setShowToast(true);
                         }}
                         className={`w-full px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${
                           lead.status === status 
                             ? 'bg-accent text-white border-accent' 
                             : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                         }`}
                       >
                         {status.charAt(0).toUpperCase() + status.slice(1)}
                       </button>
                    ))}
                  </div>
                  <div className="mt-6 pt-6 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => setShowStatusModal(false)}
                      className="px-6 py-2 rounded-xl bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
             )}

             {/* Delete Note Confirmation Modal */}
             {noteToDelete && (
               <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                 <div 
                   className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm" 
                   onClick={() => setNoteToDelete(null)}
                 />
                 <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6">
                   <h3 className="text-lg font-black tracking-tighter uppercase text-slate-900 mb-4">Delete Note</h3>
                   <p className="text-slate-500 text-sm mb-6">Are you sure you want to delete this note? This action cannot be undone.</p>
                   <div className="flex gap-3">
                     <button
                       onClick={() => setNoteToDelete(null)}
                       className="flex-1 px-6 py-3 rounded-xl bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                     >
                       Cancel
                     </button>
                     <button
                       onClick={handleDeleteNoteConfirm}
                       className="flex-1 px-6 py-3 rounded-xl bg-red-600 text-white font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all"
                     >
                       Delete Note
                     </button>
                   </div>
                 </div>
               </div>
             )}

             {/* Footer */}
            <div className="p-3 sm:p-4 md:p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">
                Lead ID: {lead.id.substring(0, 8)}...
              </p>
              <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                <button
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-white text-slate-600 font-black text-[10px] sm:text-xs uppercase tracking-widest border border-slate-200 hover:bg-slate-50 transition-all"
                >
                  Close
                </button>
                <button
                  onClick={handleExportLead}
                  className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-slate-900 text-white font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-slate-800 transition-all"
                >
                  Export
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
