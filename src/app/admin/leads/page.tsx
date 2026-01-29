"use client";

import { deleteLead, updateLeadStatus, exportLeads, assignLead, getLeads, Attachment } from "@/actions/leads";
import { getUsers } from "@/actions/users";
import LeadDetailModal from "@/components/ui/LeadDetailModal";
import { logLeadActivity } from "@/actions/lead-notes";
import { Search, Download, Filter, MapPin, MessageSquare, Phone, Mail, Trash2, Eye, Loader2, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/lib/toast";
import { resolveAttachmentUrl } from "@/lib/attachments";

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
}

export default function LeadsManagement() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [adminUsers, setAdminUsers] = useState<{ id: string; name: string; email: string; role: string }[]>([]);
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  // const supabase = createClient(); // Removed Supabase client
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    status: "" as "" | "new" | "contacted" | "closed",
    service: "",
    assignedTo: "",
    city: "",
    zip: "",
    dateFrom: "",
    dateTo: ""
  });

  useEffect(() => {
    fetchLeads();
    fetchAdminUsers();
  }, []);



  async function fetchLeads() {
    try {
      setLoading(true);
      
      // Fetch leads using Server Action
      const result = await getLeads({ limit: 1000 });
      
      if (!result.success) {
        console.error("Leads query error:", result.error);
        throw new Error(result.error);
      }
      
      const leadsData = result.data || [];
      
      // Fetch admin users for assignment names
      const adminUsersData = await getUsers();
      
      // Create map of user IDs to names
      const userMap = new Map();
      (adminUsersData || []).forEach((user) => {
        userMap.set(user.id, user.name);
      });
      
      // Transform leads with assigned user names
      const leadsWithAssigned: Lead[] = leadsData.map((lead) => {
        const sanitizedLead: Lead = {
          ...lead,
          address_line1: lead.address_line1 ?? undefined,
          city: lead.city ?? undefined,
          state: lead.state ?? undefined,
          description: lead.description ?? undefined,
          notes: lead.notes ?? "",
          service_interest: lead.service_interest || "General",
          zip_code: lead.zip_code || "",
          attachments: Array.isArray(lead.attachments) ? lead.attachments : [],
          assigned_user_name: lead.assigned_to ? userMap.get(lead.assigned_to) || null : null,
        };
        return sanitizedLead;
      });
      
      setLeads(leadsWithAssigned);

    } catch (error) {
      console.error("Error fetching leads:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      addToast("Failed to load leads", "error");
    } finally {
      setLoading(false);
    }
  }

  async function fetchAdminUsers() {
    try {
      const data = await getUsers();
      setAdminUsers(data || []);
    } catch (error) {
      console.error("Error fetching admin users:", error);
    }
  }

  async function handleDeleteLead(leadId: string) {
    setLeadToDelete(leadId);
  }

  async function handleDeleteConfirm() {
    if (!leadToDelete) return;
    
    const result = await deleteLead(leadToDelete);
    if (result.success) {
      setLeads(prev => prev.filter(lead => lead.id !== leadToDelete));
      addToast("✅ Lead deleted successfully", "success");
    } else {
      addToast("❌ Failed to delete lead: " + result.error, "error");
    }
    setLeadToDelete(null);
  }

  async function handleStatusChange(leadId: string, newStatus: "new" | "contacted" | "closed") {
    const lead = leads.find(l => l.id === leadId);
     const result = await updateLeadStatus(leadId, newStatus);
    if (result.success) {
      setLeads(prev => prev.map(lead => 
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      ));
      addToast(`✅ Status updated to ${newStatus}`, "success");
      // Log activity
      if (lead) {
        await logLeadActivity(leadId, `Status changed to ${newStatus}`, {
          previousStatus: lead.status,
          newStatus,
          leadName: lead.name,
          leadEmail: lead.email
        });
      }
    } else {
      addToast("❌ Failed to update status: " + result.error, "error");
    }
  }

  async function handleAssignLead(leadId: string, userId: string | null) {
    const lead = leads.find(l => l.id === leadId);
    const previousUserId = lead?.assigned_to;
    const previousUserName = lead?.assigned_user_name;
    
     const result = await assignLead(leadId, userId);
    if (result.success) {
      // Find the assigned user name
      const assignedUser = adminUsers.find(u => u.id === userId);
      const assignedUserName = assignedUser?.name || null;
      
      setLeads(prev => prev.map(lead => 
        lead.id === leadId ? { 
          ...lead, 
          assigned_to: userId,
          assigned_user_name: assignedUserName,
          assigned_at: userId ? new Date().toISOString() : null
        } : lead
      ));
      
      addToast(`✅ Lead ${userId ? 'assigned' : 'unassigned'} successfully`, "success");
      // Log activity
      if (lead) {
        const action = userId 
          ? `Assigned to ${assignedUserName || 'user'}`
          : 'Unassigned';
        const previousUser = previousUserName ? ` (previously assigned to ${previousUserName})` : '';
        await logLeadActivity(leadId, `${action}${previousUser}`, {
          previousAssignedTo: previousUserId,
          newAssignedTo: userId,
          leadName: lead.name,
          leadEmail: lead.email
        });
      }
    } else {
      addToast("❌ Failed to assign lead: " + result.error, "error");
    }
  }

   async function handleExport() {
    setExporting(true);
    try {
      const result = await exportLeads('csv');
      if (result.success && result.data) {
        const blob = new Blob([result.data], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename || 'leads.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        addToast("✅ Leads exported successfully", "success");
      } else {
        addToast('❌ Export failed: ' + (result.error || 'Unknown error'), "error");
      }
    } catch (error) {
      addToast('❌ Export error: ' + (error instanceof Error ? error.message : 'Unknown'), "error");
    } finally {
      setExporting(false);
    }
   }

  const filteredLeads = leads.filter(lead => {
    // Search term filter
    const matchesSearch = !searchTerm || 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm) ||
      lead.zip_code.includes(searchTerm) ||
      lead.service_interest.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Advanced filters
    const matchesStatus = !filters.status || lead.status === filters.status;
    const matchesService = !filters.service || lead.service_interest.toLowerCase().includes(filters.service.toLowerCase());
    const matchesAssigned = !filters.assignedTo || 
      (filters.assignedTo === "unassigned" ? !lead.assigned_to : lead.assigned_to === filters.assignedTo);
    const matchesCity = !filters.city || (lead.city && lead.city.toLowerCase().includes(filters.city.toLowerCase()));
    const matchesZip = !filters.zip || lead.zip_code.includes(filters.zip);
    
    // Date filters
    let matchesDate = true;
    if (filters.dateFrom) {
      const leadDate = new Date(lead.created_at);
      const fromDate = new Date(filters.dateFrom);
      matchesDate = matchesDate && leadDate >= fromDate;
    }
    if (filters.dateTo) {
      const leadDate = new Date(lead.created_at);
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      matchesDate = matchesDate && leadDate <= toDate;
    }
    
    return matchesSearch && matchesStatus && matchesService && matchesAssigned && matchesCity && matchesZip && matchesDate;
  });

  const stats = {
    total: leads.length,
    newToday: leads.filter(lead => {
      const today = new Date().toDateString();
      const leadDate = new Date(lead.created_at).toDateString();
      return today === leadDate;
    }).length,
    contacted: leads.filter(lead => lead.status === 'contacted').length,
    closed: leads.filter(lead => lead.status === 'closed').length,
  };

  if (false) { // Disabled Supabase check
    return (
      <div className="p-12 text-center bg-white rounded-3xl shadow-xl border border-slate-100">
        <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">Database Error</h1>
        <p className="text-slate-500 text-sm">Supabase connection is missing.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-slate-500 font-medium text-sm">Loading leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-slate-900">Leads Management</h1>
          <p className="text-slate-500 font-medium text-sm">Track and convert your project inquiries.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
           <button 
             onClick={() => setShowFilters(!showFilters)}
             className={`flex-1 md:flex-none flex items-center justify-center gap-2 border px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-sm ${
               showFilters 
                 ? 'bg-accent text-white border-accent hover:bg-green-600' 
                 : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
             }`}
           >
             <Filter size={16} /> {showFilters ? 'Hide Filters' : 'Filter'}
           </button>
          <button onClick={handleExport} disabled={exporting} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed">
            {exporting ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />} {exporting ? "Exporting..." : "Export"}
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Total Leads", value: stats.total, color: "bg-slate-900 text-white" },
          { label: "New Today", value: stats.newToday, color: "bg-white text-slate-900 border border-slate-100" },
          { label: "Contacted", value: stats.contacted, color: "bg-white text-slate-900 border border-slate-100" },
          { label: "Closed", value: stats.closed, color: "bg-white text-slate-900 border border-slate-100" }
        ].map((stat, i) => (
          <div key={i} className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm ${stat.color}`}>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">{stat.label}</p>
            <p className="text-2xl sm:text-3xl font-black tracking-tighter">{stat.value}</p>
          </div>
        ))}
       </div>

       {/* Filter Panel */}
       {showFilters && (
         <div className="bg-white rounded-2xl border border-slate-100 shadow-xl p-6">
           <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-black tracking-tighter uppercase text-slate-900">Advanced Filters</h3>
             <div className="flex gap-3">
               <button
                 onClick={() => setFilters({
                   status: "",
                   service: "",
                   assignedTo: "",
                   city: "",
                   zip: "",
                   dateFrom: "",
                   dateTo: ""
                 })}
                 className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
               >
                 Clear All
               </button>
               <button
                 onClick={() => setShowFilters(false)}
                 className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all"
               >
                 Apply Filters
               </button>
             </div>
           </div>
           
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
             {/* Status Filter */}
             <div className="space-y-2">
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status</label>
               <select
                 value={filters.status}
                 onChange={(e) => setFilters({...filters, status: e.target.value as "" | "new" | "contacted" | "closed"})}
                 className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
               >
                 <option value="">All Status</option>
                 <option value="new">New</option>
                 <option value="contacted">Contacted</option>
                 <option value="closed">Closed</option>
               </select>
             </div>
             
             {/* Service Filter */}
             <div className="space-y-2">
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Service</label>
               <input
                 type="text"
                 value={filters.service}
                 onChange={(e) => setFilters({...filters, service: e.target.value})}
                 placeholder="Filter by service..."
                 className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
               />
             </div>
             
             {/* Assigned To Filter */}
             <div className="space-y-2">
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Assigned To</label>
               <select
                 value={filters.assignedTo}
                 onChange={(e) => setFilters({...filters, assignedTo: e.target.value})}
                 className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
               >
                 <option value="">All Users</option>
                 <option value="unassigned">Unassigned</option>
                 {adminUsers.map(user => (
                   <option key={user.id} value={user.id}>{user.name}</option>
                 ))}
               </select>
             </div>
             
             {/* City Filter */}
             <div className="space-y-2">
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">City</label>
               <input
                 type="text"
                 value={filters.city}
                 onChange={(e) => setFilters({...filters, city: e.target.value})}
                 placeholder="Filter by city..."
                 className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
               />
             </div>
             
             {/* ZIP Filter */}
             <div className="space-y-2">
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">ZIP Code</label>
               <input
                 type="text"
                 value={filters.zip}
                 onChange={(e) => setFilters({...filters, zip: e.target.value})}
                 placeholder="Filter by ZIP..."
                 className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
               />
             </div>
             
             {/* Date From Filter */}
             <div className="space-y-2">
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">From Date</label>
               <input
                 type="date"
                 value={filters.dateFrom}
                 onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                 className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
               />
             </div>
             
             {/* Date To Filter */}
             <div className="space-y-2">
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">To Date</label>
               <input
                 type="date"
                 value={filters.dateTo}
                 onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                 className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
               />
             </div>
             
             {/* Active Filters Count */}
             <div className="space-y-2">
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Active Filters</label>
               <div className="px-3 py-2 rounded-xl bg-accent/10 border border-accent/20">
                 <p className="text-accent font-black text-sm">
                   {Object.values(filters).filter(v => v !== "").length} filter(s) active
                 </p>
                 <p className="text-[10px] text-slate-500 font-bold">
                   Showing {filteredLeads.length} of {leads.length} leads
                 </p>
               </div>
             </div>
           </div>
         </div>
       )}

         {/* Table Container */}
       <div className="bg-white rounded-xl sm:rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
         
         {/* Search Bar */}
         <div className="p-4 sm:p-6 border-b border-slate-100">
           <div className="relative max-w-full sm:max-w-md">
             <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} className="sm:hidden" />
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hidden sm:block" size={18} />
             <input
               type="text"
               placeholder="Search by name, email, or zip..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-10 sm:pl-12 pr-4 sm:pr-6 py-2.5 sm:py-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-bold text-slate-900 text-sm"
             />
        </div>
        <LeadDetailModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedLead(null);
          }}
          lead={selectedLead}
          onStatusChange={handleStatusChange}
          onDelete={handleDeleteLead}
          onAssignLead={handleAssignLead}
          adminUsers={adminUsers}
        />
     </div>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
           <table className="w-full text-left">
             <thead className="bg-slate-50/50 text-slate-400 text-[9px] uppercase tracking-[0.2em] border-b border-slate-100">
                <tr>
                  <th className="px-6 py-5 font-black min-w-[180px] max-w-[220px]">Contact</th>
                  <th className="px-4 py-5 font-black min-w-[120px]">Service</th>
                  <th className="px-4 py-5 font-black min-w-[100px]">Status</th>
                  <th className="px-4 py-5 font-black min-w-[140px]">Assigned To</th>
                  <th className="px-4 py-5 font-black min-w-[150px] max-w-[200px]">Details</th>
                  <th className="px-4 py-5 font-black min-w-[100px] text-right">Date</th>
                  <th className="px-6 py-5 font-black min-w-[80px]">Actions</th>
                </tr>
             </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.map((lead: Lead) => (
                 <tr 
                    key={lead.id} 
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => {
                      setSelectedLead(lead);
                      setIsModalOpen(true);
                    }}
                  >
                   <td className="px-6 py-6">
                     <div className="flex flex-col">
                       <span className="font-black text-slate-900 text-base mb-1 truncate" title={lead.name}>{lead.name}</span>
                        <a href={`mailto:${lead.email}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 text-slate-500 font-medium text-xs hover:text-accent transition-colors truncate" title={lead.email}>
                          <Mail size={12} /> <span className="truncate">{lead.email}</span>
                        </a>
                        <a href={`tel:${lead.phone}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 text-slate-500 font-medium text-xs mt-1 hover:text-accent transition-colors truncate" title={lead.phone}>
                          <Phone size={12} /> <span className="truncate">{lead.phone}</span>
                        </a>
                       {(lead.address_line1 || lead.city || lead.state) && (
                         <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mt-1 truncate" title={`${lead.address_line1 || ''} ${lead.city || ''} ${lead.state || ''} ${lead.zip_code}`}>
                           <MapPin size={12} />
                           <span className="truncate">
                             {lead.address_line1 && <span>{lead.address_line1}, </span>}
                             {lead.city && <span>{lead.city}, </span>}
                             {lead.state && <span>{lead.state} </span>}
                             {lead.zip_code}
                           </span>
                         </div>
                       )}
                     </div>
                   </td>
                   <td className="px-4 py-6">
                     <div className="flex flex-col gap-2">
                       <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200 truncate" title={lead.service_interest}>
                         {lead.service_interest || "General"}
                       </span>
                       <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 truncate" title={`${lead.city || ''} ${lead.state || ''} ${lead.zip_code}`}>
                         <MapPin size={12} className="text-slate-400 shrink-0" />
                         <span className="truncate">{lead.city && `${lead.city}, `}{lead.state} {lead.zip_code}</span>
                       </div>
                     </div>
                   </td>
                   <td className="px-4 py-6">
                     <div className="flex flex-col gap-2">
                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value as "new" | "contacted" | "closed")}
                          onClick={(e) => e.stopPropagation()}
                          className={`px-2 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/20 w-full max-w-[120px] ${
                            lead.status === 'new' ? 'bg-green-50 text-green-700 border-green-100' : 
                            lead.status === 'contacted' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                            'bg-slate-50 text-slate-500 border-slate-200'
                          }`}
                        >
                         <option value="new">New</option>
                         <option value="contacted">Contacted</option>
                         <option value="closed">Closed</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-4 py-6">
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-col gap-1.5">
                           <select
                             value={lead.assigned_to || ""}
                             onChange={(e) => handleAssignLead(lead.id, e.target.value || null)}
                             onClick={(e) => e.stopPropagation()}
                             className="px-2 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200 bg-white text-slate-700 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/20 w-full"
                             title="Assign lead to user"
                           >
                            <option value="">Unassigned</option>
                            {adminUsers.map(user => (
                              <option key={user.id} value={user.id} title={user.email}>
                                {user.name}
                              </option>
                            ))}
                          </select>
                          {lead.assigned_to && lead.assigned_user_name && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate" title={lead.assigned_user_name}>
                              <User size={12} className="shrink-0" />
                              <span className="font-medium truncate">{lead.assigned_user_name}</span>
                            </div>
                          )}
                        </div>
                        {lead.assigned_at && (
                          <div className="text-[9px] text-slate-400 font-bold truncate" title={new Date(lead.assigned_at).toLocaleString()}>
                            {new Date(lead.assigned_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-6">
                      <div className="flex flex-col gap-2 max-w-[200px]">
                        <div className="flex items-start gap-2">
                          <MessageSquare size={14} className="text-slate-300 mt-0.5 shrink-0" />
                          <p className="text-xs text-slate-600 font-medium leading-relaxed truncate cursor-default"
                             title={lead.description || lead.notes || "No additional details provided."}>
                            {lead.description || lead.notes || "No additional details provided."}
                          </p>
                        </div>
                        {lead.attachments && lead.attachments.length > 0 && (
                          <div className="flex flex-col gap-0.5 mt-0.5">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Attachments ({lead.attachments.length}):</span>
                            <div className="flex flex-wrap gap-1">
                             {lead.attachments.slice(0, 2).map((att, idx) => (
                              <a key={idx} href={resolveAttachmentUrl(att.url)} target="_blank" rel="noopener noreferrer" 
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-[8px] text-accent font-bold hover:underline truncate max-w-[80px]" 
                                  title={att.name}>
                                 {att.name ? (att.name.length > 15 ? att.name.substring(0, 12) + '...' : att.name) : `File ${idx + 1}`}
                               </a>
                             ))}
                             {lead.attachments.length > 2 && (
                               <span className="text-[8px] text-slate-400 font-bold">+{lead.attachments.length - 2} more</span>
                             )}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                   <td className="px-4 py-6 text-right">
                     <div className="flex flex-col items-end">
                       <span className="text-xs font-black text-slate-700 truncate" title={new Date(lead.created_at).toLocaleString()}>
                         {new Date(lead.created_at).toLocaleDateString()}
                       </span>
                       <span className="text-[10px] font-bold text-slate-400 mt-0.5 truncate">
                         {new Date(lead.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </span>
                     </div>
                   </td>
                    <td className="px-6 py-6">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLead(lead);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-slate-500 hover:text-accent hover:bg-slate-100 rounded-xl transition-all border border-slate-200 hover:border-accent"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setLeadToDelete(lead.id);
                          }}
                          className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-slate-200 hover:border-red-300"
                          title="Delete Lead"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

         {/* Mobile List View */}
         <div className="lg:hidden divide-y divide-slate-100">
           {filteredLeads.map((lead: Lead) => (
             <div key={lead.id} className="p-4 sm:p-6 space-y-3 sm:space-y-4">
               <div className="flex justify-between items-start">
                 <div className="flex items-center gap-2 sm:gap-3">
                   <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 rounded-lg sm:rounded-xl flex items-center justify-center font-black text-xs sm:text-sm shadow-inner">
                     {lead.name.charAt(0)}
                   </div>
                   <div>
                     <h3 className="font-black text-slate-900 text-sm sm:text-base">{lead.name}</h3>
                     <p className="text-[10px] sm:text-xs text-slate-500 font-medium hidden sm:block">{lead.email}</p>
                     <p className="text-[9px] sm:text-xs text-slate-400 font-medium">{lead.phone}</p>
                   </div>
                 </div>
                 <div className="flex flex-col items-end gap-2">
                   <select
                     value={lead.status}
                     onChange={(e) => handleStatusChange(lead.id, e.target.value as "new" | "contacted" | "closed")}
                     className={`px-2 py-1 sm:px-2.5 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest border appearance-none cursor-pointer focus:outline-none ${
                       lead.status === 'new' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-slate-50 text-slate-500'
                     }`}
                   >
                     <option value="new">New</option>
                     <option value="contacted">Contacted</option>
                     <option value="closed">Closed</option>
                   </select>
                   <button 
                     onClick={() => setLeadToDelete(lead.id)}
                     className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                   >
                     <Trash2 size={14} />
                   </button>
                 </div>
               </div>
               
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 text-[10px] sm:text-xs">
                  <div className="bg-slate-50 p-2.5 sm:p-3 rounded-lg sm:rounded-xl border border-slate-100">
                    <p className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Service</p>
                    <p className="font-bold text-slate-700 truncate">{lead.service_interest}</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 sm:p-3 rounded-lg sm:rounded-xl border border-slate-100 hidden sm:block">
                    <p className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Location</p>
                    <p className="font-bold text-slate-700 truncate">{lead.city && `${lead.city}, `}{lead.state} {lead.zip_code}</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 sm:p-3 rounded-lg sm:rounded-xl border border-slate-100">
                    <p className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Assigned</p>
                    <select
                      value={lead.assigned_to || ""}
                      onChange={(e) => handleAssignLead(lead.id, e.target.value || null)}
                      className="w-full bg-transparent border-none text-[10px] sm:text-xs font-bold text-slate-700 truncate focus:outline-none focus:ring-0 p-0"
                    >
                      <option value="">Unassigned</option>
                      {adminUsers.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                    {lead.assigned_at && (
                      <p className="text-[6px] sm:text-[7px] text-slate-400 font-bold mt-0.5 sm:mt-1">
                        {new Date(lead.assigned_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

               {(lead.description || lead.notes) && (
                 <div className="flex gap-2 p-2.5 sm:p-3 bg-yellow-50/50 rounded-lg sm:rounded-xl border border-yellow-100/50">
                   <MessageSquare size={12} className="text-yellow-600/50 shrink-0 mt-0.5 sm:hidden" />
                   <MessageSquare size={14} className="text-yellow-600/50 shrink-0 mt-0.5 hidden sm:block" />
                   <p className="text-[10px] sm:text-xs text-slate-600 leading-relaxed italic">{lead.description || lead.notes}</p>
                 </div>
               )}
               
               <div className="pt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-0">
                  <span className="text-[9px] sm:text-[10px] font-bold text-slate-300">{new Date(lead.created_at).toLocaleDateString()}</span>
                  {lead.attachments && lead.attachments.length > 0 && (
                    <span className="text-[7px] sm:text-[8px] font-black text-accent uppercase tracking-widest">
                      {lead.attachments.length} attachment{lead.attachments.length !== 1 ? 's' : ''}
                    </span>
                  )}
               </div>
            </div>
          ))}
        </div>

        {filteredLeads.length === 0 && (
          <div className="py-24 text-center flex flex-col items-center justify-center opacity-50">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
               <Search size={24} className="text-slate-300" />
             </div>
             <p className="text-slate-400 font-black text-sm uppercase tracking-widest">
               {leads.length === 0 ? "No leads found" : "No matching leads"}
             </p>
          </div>
         )}
       </div>

       {/* Delete Confirmation Modal */}
       {leadToDelete && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
           <div 
             className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm" 
             onClick={() => setLeadToDelete(null)}
           />
           <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6">
             <h3 className="text-lg font-black tracking-tighter uppercase text-slate-900 mb-4">Delete Lead</h3>
             <p className="text-slate-500 text-sm mb-6">Are you sure you want to delete this lead? This action cannot be undone.</p>
             <div className="flex gap-3">
               <button
                 onClick={() => setLeadToDelete(null)}
                 className="flex-1 px-6 py-3 rounded-xl bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
               >
                 Cancel
               </button>
               <button
                 onClick={handleDeleteConfirm}
                 className="flex-1 px-6 py-3 rounded-xl bg-red-600 text-white font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all"
               >
                 Delete Lead
               </button>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 }
