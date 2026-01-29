"use client";

import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { getRemarketingSegments, createRemarketingSegment, updateRemarketingSegment, deleteRemarketingSegment, createCampaign, createScheduledCampaign } from "@/actions/remarketing";
import { getLeads } from "@/actions/leads";
import { useToast } from "@/lib/toast";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
   Flame,
   Snowflake,
   Clock,
   AlertTriangle,
   RefreshCw,
   Send,
   Sparkles,
   Filter,
   Calendar,
   Zap,
   Trash2,
   Pencil,
  } from "lucide-react";

interface Lead {
  id: string;
  name: string;
  email: string;
  status: string;
  service_interest?: string | null;
  created_at: string;
}

interface RemarketingSegment {
  id: string;
  name: string;
  description?: string | null;
  criteria: Record<string, unknown>;
  lead_count: number;
  created_at: string;
  updated_at: string;
}

type SegmentPreset = "hot" | "warm" | "cold" | "no_conversion";
type RemarketingSendMode = "scheduled" | "batch";

interface SegmentBlueprint {
  id: string;
  name: string;
  description: string;
  preset: SegmentPreset;
  accent: string;
  icon: LucideIcon;
}

const SEGMENT_BLUEPRINTS: SegmentBlueprint[] = [
  {
    id: "hot",
    name: "Hot Leads",
    description: "Engaged within the last 30 days",
    preset: "hot",
    accent: "bg-rose-50 text-rose-600",
    icon: Flame,
  },
  {
    id: "warm",
    name: "Warm Leads",
    description: "No contact in the last 60 days",
    preset: "warm",
    accent: "bg-amber-50 text-amber-600",
    icon: Clock,
  },
  {
    id: "cold",
    name: "Cold Leads",
    description: "Dormant for 90+ days",
    preset: "cold",
    accent: "bg-slate-50 text-slate-600",
    icon: Snowflake,
  },
  {
    id: "no_conversion",
    name: "Sem Conversão",
    description: "Status 'new' for more than 7 days",
    preset: "no_conversion",
    accent: "bg-purple-50 text-purple-600",
    icon: AlertTriangle,
  },
];

const daysSince = (value?: string | null) => {
  if (!value) return Number.POSITIVE_INFINITY;
  const diff = Date.now() - new Date(value).getTime();
  return diff / (1000 * 60 * 60 * 24);
};

const matchesPreset = (lead: Lead, preset: SegmentPreset) => {
  const ageInDays = daysSince(lead.created_at);
  switch (preset) {
    case "hot":
      return ageInDays <= 30 && lead.status !== "closed";
    case "warm":
      return ageInDays > 30 && ageInDays <= 60 && lead.status !== "closed";
    case "cold":
      return ageInDays > 90;
    case "no_conversion":
      return lead.status === "new" && ageInDays > 7;
    default:
      return false;
  }
};

const matchesCriteria = (lead: Lead, criteria: Record<string, unknown>) => {
  if (!criteria) return false;
  if (criteria.preset) {
    return matchesPreset(lead, criteria.preset as SegmentPreset);
  }
  return false;
};

export default function RemarketingPage() {
  const { addToast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [segments, setSegments] = useState<RemarketingSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingSegment, setGeneratingSegment] = useState<string | null>(null);
  const [refreshingSegmentId, setRefreshingSegmentId] = useState<string | null>(null);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [campaignSubject, setCampaignSubject] = useState("");
  const [campaignBody, setCampaignBody] = useState("");
  const [campaignSchedule, setCampaignSchedule] = useState("");
  const [campaignSendMode, setCampaignSendMode] = useState<RemarketingSendMode>("scheduled");
  const [campaignEmailsPerDay, setCampaignEmailsPerDay] = useState(100);
  const [launchingCampaign, setLaunchingCampaign] = useState(false);
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [editSegmentName, setEditSegmentName] = useState("");
  const [editSegmentDescription, setEditSegmentDescription] = useState("");
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    segment: RemarketingSegment | null;
  }>({ isOpen: false, segment: null });

  useEffect(() => {
    fetchRemarketingData();
  }, []);

  useEffect(() => {
    if (!selectedSegmentId && segments.length) {
      setSelectedSegmentId(segments[0].id);
    }
  }, [segments, selectedSegmentId]);

  const selectedSegment = segments.find((segment) => segment.id === selectedSegmentId) || null;

  const selectedSegmentLeads = useMemo(() => {
    if (!selectedSegment) return [];
    return leads.filter((lead) => matchesCriteria(lead, selectedSegment.criteria));
  }, [leads, selectedSegment]);

  const blueprintCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    SEGMENT_BLUEPRINTS.forEach((blueprint) => {
      counts[blueprint.id] = leads.filter((lead) => matchesPreset(lead, blueprint.preset)).length;
    });
    return counts;
  }, [leads]);

  async function fetchRemarketingData() {
    try {
      setLoading(true);

      const [leadsResult, segmentsData] = await Promise.all([
        getLeads(),
        getRemarketingSegments()
      ]);

      if (!leadsResult.success) {
        throw new Error(leadsResult.error || "Failed to load leads");
      }

      setLeads(leadsResult.data.map(lead => ({
        ...lead,
        created_at: lead.created_at
      })));
      setSegments(segmentsData.map(segment => ({
        ...segment,
        created_at: segment.created_at,
        updated_at: segment.updated_at
      })));
    } catch (error) {
      console.error("Error loading remarketing data", error);
      addToast("Failed to load remarketing data", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateSegment(blueprint: SegmentBlueprint) {
    setGeneratingSegment(blueprint.id);
    try {
      const matchingLeads = leads.filter((lead) => matchesPreset(lead, blueprint.preset));
      const payload = {
        name: blueprint.name,
        description: blueprint.description,
        criteria: { preset: blueprint.preset },
        lead_count: matchingLeads.length,
      };

      const existing = segments.find((segment) => segment.criteria?.preset === blueprint.preset);

      if (existing) {
        const result = await updateRemarketingSegment(existing.id, {
          name: payload.name,
          description: payload.description,
          criteria: payload.criteria,
          lead_count: payload.lead_count
        });
        if (result.success && result.data) {
          setSegments((prev) => prev.map((segment) => (segment.id === existing.id ? result.data! : segment)));
        } else {
          throw new Error(result.error);
        }
      } else {
        const result = await createRemarketingSegment(payload);
        if (result.success && result.data) {
          setSegments((prev) => [result.data!, ...prev]);
        } else {
          throw new Error(result.error);
        }
      }

      addToast(`Segment "${blueprint.name}" saved (${matchingLeads.length} leads)`, "success");
    } catch (error) {
      console.error("Error creating segment", error);
      addToast("Failed to save segment", "error");
    } finally {
      setGeneratingSegment(null);
    }
  }

  async function handleRefreshSegment(segment: RemarketingSegment) {
    setRefreshingSegmentId(segment.id);
    try {
      const matchingLeads = leads.filter((lead) => matchesCriteria(lead, segment.criteria));
      const result = await updateRemarketingSegment(segment.id, {
        lead_count: matchingLeads.length
      });
      if (result.success && result.data) {
        setSegments((prev) => prev.map((item) => (item.id === segment.id ? result.data! : item)));
      } else {
        throw new Error(result.error);
      }
      addToast("Segment refreshed", "success");
    } catch (error) {
      console.error("Error refreshing segment", error);
      addToast("Failed to refresh segment", "error");
    } finally {
      setRefreshingSegmentId(null);
    }
  }

  function handleEditSegment(segment: RemarketingSegment) {
    setEditingSegmentId(segment.id);
    setEditSegmentName(segment.name);
    setEditSegmentDescription(segment.description || "");
  }

  async function handleSaveSegmentEdit() {
    if (!editingSegmentId) return;
    if (!editSegmentName.trim()) {
      addToast("Segment name is required", "error");
      return;
    }

    try {
      const result = await updateRemarketingSegment(editingSegmentId, {
        name: editSegmentName,
        description: editSegmentDescription
      });
      if (result.success && result.data) {
        setSegments((prev) => prev.map((item) => (item.id === editingSegmentId ? result.data! : item)));
      } else {
        throw new Error(result.error);
      }
      setEditingSegmentId(null);
      addToast("Segment updated", "success");
    } catch (error) {
      console.error("Error updating segment", error);
      addToast("Failed to update segment", "error");
    }
  }

  function handleDeleteSegmentClick(segment: RemarketingSegment) {
    setDeleteModal({
      isOpen: true,
      segment
    });
  }

  async function handleDeleteSegmentConfirm() {
    if (!deleteModal.segment) return;

    try {
      const segmentId = deleteModal.segment.id;

      const result = await deleteRemarketingSegment(segmentId);
      if (!result.success) {
        throw new Error(result.error);
      }

      setSegments((prev) => prev.filter((item) => item.id !== segmentId));
      if (selectedSegmentId === segmentId) {
        const remainingSegments = segments.filter((item) => item.id !== segmentId);
        setSelectedSegmentId(remainingSegments[0]?.id || null);
      }
      addToast("Segment deleted", "success");
    } catch (error) {
      console.error("Error deleting segment", error);
      addToast("Failed to delete segment", "error");
    } finally {
      setDeleteModal({ isOpen: false, segment: null });
    }
  }

  async function handleLaunchRemarketingCampaign() {
    if (!selectedSegment) {
      addToast("Select a segment first", "error");
      return;
    }
    if (!campaignSubject.trim() || !campaignBody.trim()) {
      addToast("Subject and body are required", "error");
      return;
    }
    if (!campaignSchedule) {
      addToast("Choose a schedule date/time", "error");
      return;
    }
    if (!selectedSegmentLeads.length) {
      addToast("Selected segment has no leads", "error");
      return;
    }

    setLaunchingCampaign(true);
    try {
      const scheduledISO = new Date(campaignSchedule).toISOString();
      const campaignPayload = {
        subject: campaignSubject,
        body: campaignBody,
        sent_at: scheduledISO,
        open_rate: 0,
        click_rate: 0,
        total_recipients: selectedSegmentLeads.length,
        total_opens: 0,
        total_clicks: 0,
        status: "scheduled",
        archived: false,
      };

      const campaignResult = await createCampaign(campaignPayload);
      if (!campaignResult.success) {
        throw new Error(campaignResult.error);
      }

      const schedulePayload = {
        name: `${selectedSegment.name} Remarketing`,
        subject: campaignSubject,
        body: campaignBody,
        audience_segment: selectedSegment.name,
        custom_audience: selectedSegmentLeads.map((lead) => ({ id: lead.id, email: lead.email })),
        schedule_type: campaignSendMode,
        scheduled_at: scheduledISO,
        emails_per_day: campaignSendMode === "batch" ? campaignEmailsPerDay : selectedSegmentLeads.length,
        total_count: selectedSegmentLeads.length,
        status: "pending",
      };

      const scheduleResult = await createScheduledCampaign({
        ...schedulePayload,
        scheduled_at: schedulePayload.scheduled_at
      });
      if (!scheduleResult.success) {
        throw new Error(scheduleResult.error);
      }

      addToast(`Remarketing campaign scheduled for ${selectedSegment.name}`, "success");
      setCampaignSubject("");
      setCampaignBody("");
      setCampaignSchedule("");
    } catch (error) {
      console.error("Error scheduling remarketing campaign", error);
      addToast("Failed to schedule campaign", "error");
    } finally {
      setLaunchingCampaign(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-gray-500 font-medium text-sm">Loading remarketing data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-slate-900">Remarketing Automation</h1>
          <p className="text-slate-500 font-medium text-sm">
            Build high-performing segments and relaunch campaigns automatically.
          </p>
        </div>
        <button
          onClick={fetchRemarketingData}
          className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-black uppercase tracking-widest hover:bg-white"
        >
          <RefreshCw size={16} /> Refresh Data
        </button>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {SEGMENT_BLUEPRINTS.map((blueprint) => {
          const Icon = blueprint.icon;
          const count = blueprintCounts[blueprint.id] || 0;
          const isLoading = generatingSegment === blueprint.id;
          return (
            <div key={blueprint.id} className="bg-white border border-slate-100 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm">
              <div className="flex items-center gap-2 sm:gap-3 mb-3">
                <div className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl ${blueprint.accent}`}>
                  <Icon size={18} className="sm:hidden" />
                  <Icon size={20} className="hidden sm:block" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-widest">{blueprint.name}</p>
                  <p className="text-[10px] sm:text-xs text-slate-400 hidden sm:block">{blueprint.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 sm:mt-4">
                <div>
                  <p className="text-xl sm:text-2xl font-black text-slate-900">{count}</p>
                  <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-widest">matched leads</p>
                </div>
                <button
                  onClick={() => handleGenerateSegment(blueprint)}
                  disabled={isLoading}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl bg-slate-900 text-white text-[10px] sm:text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50"
                >
                  {isLoading ? "Saving..." : "Save Segment"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl">
          <h3 className="font-black uppercase tracking-widest text-slate-900 mb-4 flex items-center gap-2">
            <Filter size={18} /> Saved Segments
          </h3>
          <div className="space-y-4">
            {segments.length ? (
              segments.map((segment) => {
                const isActive = selectedSegmentId === segment.id;
                const isEditing = editingSegmentId === segment.id;

                return (
                  <div
                    key={segment.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isActive ? "border-accent bg-accent/5" : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    {isEditing ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Name</label>
                          <input
                            type="text"
                            value={editSegmentName}
                            onChange={(e) => setEditSegmentName(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Description</label>
                          <input
                            type="text"
                            value={editSegmentDescription}
                            onChange={(e) => setEditSegmentDescription(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-bold"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveSegmentEdit}
                            className="px-4 py-2 rounded-xl bg-accent text-white text-xs font-black uppercase tracking-widest hover:bg-green-600"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingSegmentId(null)}
                            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-black uppercase tracking-widest hover:bg-white"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-black text-slate-900 uppercase tracking-widest truncate">{segment.name}</p>
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-2">{segment.description}</p>
                          </div>
                          <span className="text-xs font-black text-slate-500 flex-shrink-0">{segment.lead_count} leads</span>
                        </div>
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          <button
                            onClick={() => setSelectedSegmentId(segment.id)}
                            className="px-3 py-2 rounded-xl bg-white text-xs font-black uppercase tracking-widest border border-slate-200 text-slate-600 flex-shrink-0"
                          >
                            Use Segment
                          </button>
                          <button
                            onClick={() => handleRefreshSegment(segment)}
                            disabled={refreshingSegmentId === segment.id}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-white disabled:opacity-50 flex-shrink-0"
                          >
                            <RefreshCw size={14} />
                            {refreshingSegmentId === segment.id ? "Updating" : "Refresh"}
                          </button>
                          <button
                            onClick={() => handleEditSegment(segment)}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteSegmentClick(segment)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-400 text-center py-10 font-medium">
                No remarketing segments saved yet. Generate one above to get started.
              </p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl">
          <h3 className="font-black uppercase tracking-widest text-slate-900 mb-4 flex items-center gap-2">
            <Sparkles size={18} /> Launch Remarketing Campaign
          </h3>
          {selectedSegment ? (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Selected Segment</p>
                <p className="text-lg font-black text-slate-900">{selectedSegment.name}</p>
                <p className="text-sm text-slate-500">{selectedSegmentLeads.length} leads currently match this segment.</p>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Subject</label>
                <input
                  type="text"
                  value={campaignSubject}
                  onChange={(e) => setCampaignSubject(e.target.value)}
                  placeholder="e.g. We miss you! Exclusive lawn care tune-up"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">HTML Body</label>
                <textarea
                  rows={6}
                  value={campaignBody}
                  onChange={(e) => setCampaignBody(e.target.value)}
                  placeholder="Compose a short remarketing message..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold"
                />
                <p className="text-[11px] text-slate-400 mt-1">Supports HTML and merge tags such as {"{name}"}.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
                    <Calendar size={14} /> Schedule
                  </label>
                  <input
                    type="datetime-local"
                    value={campaignSchedule}
                    onChange={(e) => setCampaignSchedule(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Send Method</label>
                  <select
                    value={campaignSendMode}
                    onChange={(e) => setCampaignSendMode(e.target.value as RemarketingSendMode)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold"
                  >
                    <option value="scheduled">Send all at once</option>
                    <option value="batch">Batch (limit per day)</option>
                  </select>
                </div>
              </div>

              {campaignSendMode === "batch" && (
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
                    <Zap size={14} /> Emails per day: {campaignEmailsPerDay}
                  </label>
                  <input
                    type="range"
                    min={25}
                    max={500}
                    step={25}
                    value={campaignEmailsPerDay}
                    onChange={(e) => setCampaignEmailsPerDay(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              )}

              <button
                onClick={handleLaunchRemarketingCampaign}
                disabled={launchingCampaign}
                className="w-full flex items-center justify-center gap-2 bg-accent text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-green-600 disabled:opacity-60"
              >
                {launchingCampaign ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Send size={16} /> Schedule Campaign
                  </>
                )}
              </button>
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-12 font-medium">
              Select or create a segment to configure a remarketing campaign.
            </p>
          )}
        </div>
      </div>

      {/* Delete Segment Confirm Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, segment: null })}
        onConfirm={handleDeleteSegmentConfirm}
        title="Delete Segment"
        message={`Are you sure you want to delete "${deleteModal.segment?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
