"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  MessageSquare,
  Loader2,
  Settings,
  History,
  Layout,
  ExternalLink,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  Building2,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { apiFetch, safeJsonParse } from "@/lib/api";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableSkeleton } from "@/components/table-skeleton";
import { cn } from "@/lib/utils";

type Tab = "mappings" | "templates" | "logs";

export default function WhatsAppSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("mappings");
  const [loading, setLoading] = useState(true);
  const [mappings, setMappings] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);

  // Modals
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [currentMapping, setCurrentMapping] = useState<any>(null);
  const [currentTemplate, setCurrentTemplate] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "mappings") {
        await Promise.all([fetchMappings(), fetchSites()]);
      } else if (activeTab === "templates") {
        await fetchTemplates();
      } else if (activeTab === "logs") {
        await fetchLogs();
      }
    } catch (error) {
      console.error("Data fetch error", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMappings = async () => {
    const res = await apiFetch("/api/whatsapp/mappings");
    const result = await safeJsonParse(res);
    if (result.success) setMappings(result.data || []);
  };

  const fetchTemplates = async () => {
    const res = await apiFetch("/api/whatsapp/templates");
    const result = await safeJsonParse(res);
    if (result.success) setTemplates(result.data || []);
  };

  const fetchLogs = async () => {
    const res = await apiFetch("/api/whatsapp/logs");
    const result = await safeJsonParse(res);
    if (result.success) setLogs(result.data || []);
  };

  const fetchSites = async () => {
    const res = await apiFetch("/api/sites");
    const result = await safeJsonParse(res);
    if (result.success) setSites(result.data || []);
  };

  const handleDeleteMapping = async (id: string) => {
    if (!confirm("Are you sure you want to delete this mapping?")) return;
    try {
      const res = await apiFetch(`/api/whatsapp/mappings/${id}`, {
        method: "DELETE",
      });
      if (res.ok) fetchMappings();
    } catch (error) {
      console.error("Delete error", error);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4 p-4 sm:p-6 pb-2">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/20">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
              WhatsApp Integration
            </h1>
            <p className="text-zinc-500 mt-1">
              Manage group mappings and notification templates.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl w-fit">
        <TabButton
          active={activeTab === "mappings"}
          onClick={() => setActiveTab("mappings")}
          icon={<Layout className="w-4 h-4" />}
          label="Mappings"
        />
        <TabButton
          active={activeTab === "templates"}
          onClick={() => setActiveTab("templates")}
          icon={<Settings className="w-4 h-4" />}
          label="Templates"
        />
        <TabButton
          active={activeTab === "logs"}
          onClick={() => setActiveTab("logs")}
          icon={<History className="w-4 h-4" />}
          label="Audit Logs"
        />
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0">
        {activeTab === "mappings" && (
          <MappingsTab
            loading={loading}
            mappings={mappings}
            sites={sites}
            onAdd={() => {
              setCurrentMapping(null);
              setIsMappingModalOpen(true);
            }}
            onEdit={(m: any) => {
              setCurrentMapping(m);
              setIsMappingModalOpen(true);
            }}
            onDelete={handleDeleteMapping}
          />
        )}
        {activeTab === "templates" && (
          <TemplatesTab
            loading={loading}
            templates={templates}
            onEdit={(t: any) => {
              setCurrentTemplate(t);
              setIsTemplateModalOpen(true);
            }}
          />
        )}
        {activeTab === "logs" && <LogsTab loading={loading} logs={logs} />}
      </div>

      {/* Mapping Modal */}
      <Dialog open={isMappingModalOpen} onOpenChange={setIsMappingModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentMapping ? "Edit Mapping" : "New Mapping"}
            </DialogTitle>
          </DialogHeader>
          <MappingForm
            mapping={currentMapping}
            sites={sites}
            onSave={() => {
              setIsMappingModalOpen(false);
              fetchMappings();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Template Modal */}
      <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
          </DialogHeader>
          <TemplateForm
            template={currentTemplate}
            onSave={() => {
              setIsTemplateModalOpen(false);
              fetchTemplates();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
        active
          ? "bg-white text-red-600 shadow-sm"
          : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

// --- Mappings Tab ---
function MappingsTab({
  loading,
  mappings,
  sites,
  onAdd,
  onEdit,
  onDelete,
}: any) {
  return (
    <Card className="border-zinc-200 shadow-sm overflow-hidden h-full flex flex-col">
      <CardHeader className="bg-white border-b px-6 py-4 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Site Mappings</CardTitle>
          <CardDescription>
            Link sites to their respective WhatsApp Group IDs.
          </CardDescription>
        </div>
        <Button onClick={onAdd} className="bg-red-600 hover:bg-red-700 h-9">
          <Plus className="w-4 h-4 mr-2" /> Add Mapping
        </Button>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-auto">
        <Table className="border-separate border-spacing-0">
          <TableHeader className="bg-zinc-50/50 sticky top-0 z-10 backdrop-blur">
            <TableRow>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 py-3">
                Site Name
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 py-3">
                Group ID
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 py-3">
                Status
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 py-3 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableSkeleton columnCount={4} rowCount={5} />
            ) : mappings.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-12 text-zinc-400 italic"
                >
                  No mappings found
                </TableCell>
              </TableRow>
            ) : (
              mappings.map((m: any) => (
                <TableRow key={m.id} className="group hover:bg-zinc-50/50">
                  <TableCell className="font-bold py-4">
                    {m.site_name}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-zinc-500">
                    {m.whatsapp_group_id}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-bold uppercase",
                        m.is_active
                          ? "bg-green-50 text-green-600 border-green-200"
                          : "bg-zinc-100 text-zinc-500 border-zinc-200",
                      )}
                    >
                      {m.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(m)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600"
                        onClick={() => onDelete(m.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// --- Templates Tab ---
function TemplatesTab({ loading, templates, onEdit }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {loading
        ? [1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 bg-zinc-100 animate-pulse rounded-2xl"
            />
          ))
        : templates.map((t: any) => (
            <Card
              key={t.id}
              className="border-zinc-200 shadow-sm hover:border-red-200 transition-all group"
            >
              <CardHeader className="pb-3 border-b border-zinc-50">
                <div className="flex items-center justify-between">
                  <Badge className="bg-zinc-900 text-[9px] uppercase tracking-widest font-black h-5">
                    {t.template_key}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px] uppercase tracking-widest font-black h-5",
                      t.is_active
                        ? "bg-green-50 text-green-600 border-green-200"
                        : "bg-zinc-50 text-zinc-400",
                    )}
                  >
                    {t.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <CardTitle className="text-sm font-bold mt-2 uppercase tracking-tight">
                  {t.template_name}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100 text-xs text-zinc-600 leading-relaxed font-mono whitespace-pre-wrap min-h-[100px]">
                  {t.template_content}
                </div>
                <Button
                  onClick={() => onEdit(t)}
                  variant="outline"
                  className="w-full border-zinc-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 font-bold text-xs uppercase tracking-widest h-10"
                >
                  <Pencil className="w-3.5 h-3.5 mr-2" /> Edit Template
                </Button>
              </CardContent>
            </Card>
          ))}
    </div>
  );
}

// --- Logs Tab ---
function LogsTab({ loading, logs }: any) {
  return (
    <Card className="border-zinc-200 shadow-sm overflow-hidden h-full flex flex-col">
      <CardHeader className="bg-white border-b px-6 py-4">
        <CardTitle className="text-lg">Message Logs</CardTitle>
        <CardDescription>
          History of WhatsApp notifications sent via the system.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-auto">
        <Table className="border-separate border-spacing-0">
          <TableHeader className="bg-zinc-50/50 sticky top-0 z-10 backdrop-blur">
            <TableRow>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 py-3">
                Timestamp
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 py-3">
                Ticket
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 py-3">
                Message Content
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 py-3">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableSkeleton columnCount={4} rowCount={10} />
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-12 text-zinc-400 italic"
                >
                  No logs found
                </TableCell>
              </TableRow>
            ) : (
              logs.map((l: any) => (
                <TableRow key={l.id} className="hover:bg-zinc-50/30">
                  <TableCell className="whitespace-nowrap tabular-nums text-xs font-medium py-4">
                    {new Date(l.sent_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge
                      variant="outline"
                      className="font-mono text-[10px] font-black border-zinc-200"
                    >
                      {l.ticket_no}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <div className="text-xs text-zinc-600 truncate">
                      {l.message_content}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-bold uppercase",
                        l.status === "sent"
                          ? "bg-green-50 text-green-600 border-green-200"
                          : l.status === "simulated"
                            ? "bg-blue-50 text-blue-600 border-blue-200"
                            : "bg-red-50 text-red-600 border-red-200",
                      )}
                    >
                      {l.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// --- Forms ---

function MappingForm({ mapping, sites, onSave }: any) {
  const [formData, setFormData] = useState(
    mapping || {
      site_id: "",
      site_name: "",
      whatsapp_group_id: "",
      is_active: true,
    },
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const method = mapping ? "PUT" : "POST";
      const path = mapping
        ? `/api/whatsapp/mappings/${mapping.id}`
        : "/api/whatsapp/mappings";

      const res = await apiFetch(path, {
        method,
        body: JSON.stringify(formData),
      });
      if (res.ok) onSave();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <label className="text-sm font-bold uppercase tracking-widest text-zinc-400 selection:bg-red-100">
          Select Site
        </label>
        <Select
          value={formData.site_id}
          onValueChange={(val) => {
            const site = sites.find((s: any) => s.site_id === val);
            setFormData({
              ...formData,
              site_id: val,
              site_name: site?.name || "",
            });
          }}
        >
          <SelectTrigger className="bg-white border-zinc-200 h-11">
            <SelectValue placeholder="Identify Site..." />
          </SelectTrigger>
          <SelectContent>
            {sites.map((s: any) => (
              <SelectItem
                key={s.site_id}
                value={s.site_id}
                className="font-medium"
              >
                {s.name} ({s.site_code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold uppercase tracking-widest text-zinc-400">
          WhatsApp Group ID
        </label>
        <Input
          placeholder="Format: 12036304xxxxxxxxxx@g.us"
          value={formData.whatsapp_group_id}
          onChange={(e) =>
            setFormData({ ...formData, whatsapp_group_id: e.target.value })
          }
          className="bg-white border-zinc-200 h-11"
        />
        <p className="text-[10px] text-zinc-400 flex items-center gap-1 uppercase tracking-tight font-medium">
          <AlertCircle className="w-3 h-3" /> Get this ID from Whapi group list
          or developer tools.
        </p>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={() =>
            setFormData({ ...formData, is_active: !formData.is_active })
          }
          className={cn(
            "w-10 h-6 rounded-full p-1 transition-all duration-200",
            formData.is_active ? "bg-red-600" : "bg-zinc-200",
          )}
        >
          <div
            className={cn(
              "bg-white w-4 h-4 rounded-full shadow-sm transition-all",
              formData.is_active ? "translate-x-4" : "translate-x-0",
            )}
          />
        </button>
        <span className="text-sm font-bold text-zinc-600 uppercase tracking-tight">
          Active Protocol
        </span>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full bg-red-600 hover:bg-red-700 h-12 shadow-lg shadow-red-600/10 font-black uppercase tracking-widest mt-4"
      >
        {isSubmitting ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Save className="w-4 h-4 mr-2" />
        )}
        {mapping ? "Update Config" : "Deploy Config"}
      </Button>
    </div>
  );
}

function TemplateForm({ template, onSave }: any) {
  const [formData, setFormData] = useState(
    template || {
      template_name: "",
      template_content: "",
      is_active: true,
    },
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await apiFetch(`/api/whatsapp/templates/${template.id}`, {
        method: "PUT",
        body: JSON.stringify(formData),
      });
      if (res.ok) onSave();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 py-4">
      <div className="space-y-2">
        <label className="text-sm font-bold uppercase tracking-widest text-zinc-400">
          Template Logic
        </label>
        <Input
          value={formData.template_name}
          onChange={(e) =>
            setFormData({ ...formData, template_name: e.target.value })
          }
          className="bg-zinc-50 border-zinc-200 h-11 font-bold"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold uppercase tracking-widest text-zinc-400">
            Message Content
          </label>
          <div className="flex gap-2">
            <VariableBadge label="ticket_no" />
            <VariableBadge label="status" />
            <VariableBadge label="site_name" />
          </div>
        </div>
        <Textarea
          rows={8}
          value={formData.template_content}
          onChange={(e) =>
            setFormData({ ...formData, template_content: e.target.value })
          }
          className="bg-white border-zinc-200 font-mono text-sm leading-relaxed p-4 rounded-xl"
        />
        <p className="text-[10px] text-zinc-400 uppercase tracking-tight font-medium">
          Use double braces for variables:{" "}
          <span className="text-red-600 font-bold">{"{{ticket_no}}"}</span>
        </p>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={() =>
            setFormData({ ...formData, is_active: !formData.is_active })
          }
          className={cn(
            "w-10 h-6 rounded-full p-1 transition-all duration-200",
            formData.is_active ? "bg-red-600" : "bg-zinc-200",
          )}
        >
          <div
            className={cn(
              "bg-white w-4 h-4 rounded-full shadow-sm transition-all",
              formData.is_active ? "translate-x-4" : "translate-x-0",
            )}
          />
        </button>
        <span className="text-sm font-bold text-zinc-600 uppercase tracking-tight">
          Active for Automation
        </span>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full bg-zinc-900 hover:bg-zinc-800 h-12 shadow-2xl shadow-zinc-900/10 font-black uppercase tracking-widest mt-4"
      >
        {isSubmitting ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Save className="w-4 h-4 mr-2" />
        )}
        Sync Template Changes
      </Button>
    </div>
  );
}

function VariableBadge({ label }: { label: string }) {
  return (
    <Badge
      variant="outline"
      className="text-[9px] font-mono border-zinc-200 bg-zinc-50 text-zinc-500 lowercase px-1.5 h-5"
    >
      {"{{" + label + "}}"}
    </Badge>
  );
}
