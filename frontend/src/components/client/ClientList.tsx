import { useState } from "react";
import type { Client } from "@/utils/client";
import { clientApi } from "@/lib/api";
import { Users, CheckCircle, PauseCircle, CalendarX, TrendingUp, TrendingDown, MoreVertical, Download, Filter, Search } from "lucide-react";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ClientListProps {
    clients: Client[];
    loading: boolean;
    error: string;
    onRegister: () => void;
    onRefresh: () => void;
}

const statusBadge = (s: string) => {
    const map: Record<string, string> = {
        ACTIVE: "bg-emerald-100 text-emerald-700",
        SUSPENDED: "bg-amber-100 text-amber-700",
        TERMINATED: "bg-red-100 text-red-700",
        EXPIRED: "bg-rose-100 text-rose-700",
    };
    return map[s] || "bg-muted text-muted-foreground";
};

const formatDate = (d?: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const getInitials = (name: string) =>
    name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

const ClientList = ({ clients, loading, error, onRegister, onRefresh }: ClientListProps) => {
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    const total = clients.length;
    const active = clients.filter(c => c.status === "ACTIVE").length;
    const suspended = clients.filter(c => c.status === "SUSPENDED").length;
    const expiring = clients.filter(c => {
        if (!c.contractEndDate) return false;
        const end = new Date(c.contractEndDate);
        const diff = (end.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        return diff > 0 && diff <= 60;
    }).length;

    const filtered = clients.filter(c => {
        const matchSearch =
            c.companyName.toLowerCase().includes(search.toLowerCase()) ||
            c.contactPersonEmail.toLowerCase().includes(search.toLowerCase()) ||
            (c.clientCode || "").toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === "ALL" || c.status === filterStatus;
        return matchSearch && matchStatus;
    });

    const handleAction = async (clientId: number, action: "suspend" | "terminate" | "reactivate") => {
        if (!confirm(`Are you sure you want to ${action} this client?`)) return;
        setActionLoading(clientId);
        try {
            await clientApi[action](clientId);
            onRefresh();
        } catch {
            alert("Action failed.");
        } finally {
            setActionLoading(null);
        }
    };

    const stats = [
        { label: "Total Clients", value: total.toLocaleString(), icon: Users, trend: "12%", up: true, color: "" },
        { label: "Active Contracts", value: active.toLocaleString(), icon: CheckCircle, trend: "5%", up: true, color: "text-emerald-600" },
        { label: "Suspended", value: suspended.toString(), icon: PauseCircle, trend: "2%", up: false, color: "text-amber-600" },
        { label: "Expiring Soon", value: expiring.toString(), icon: CalendarX, trend: "8%", up: true, color: "text-rose-600" },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Client Management</h1>
                    <p className="text-muted-foreground mt-1">Manage and monitor high-profile security service contracts</p>
                </div>
                <button
                    onClick={onRegister}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-primary/20"
                >
                    <span className="material-symbols-outlined text-lg">add_circle</span>
                    Register New Client
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-card p-6 rounded-xl border shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-muted rounded-lg">
                                <stat.icon className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <span className={`text-sm font-bold flex items-center gap-0.5 ${stat.up ? "text-emerald-500" : "text-rose-500"}`}>
                {stat.up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                {stat.trend}
              </span>
                        </div>
                        <p className="text-muted-foreground text-sm font-medium">{stat.label}</p>
                        <p className={`text-3xl font-black mt-1 ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-card p-4 rounded-t-xl border-x border-t">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg border">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Status:</span>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="bg-transparent border-none p-0 text-sm font-medium focus:ring-0 cursor-pointer"
                            >
                                <option value="ALL">All Statuses</option>
                                <option value="ACTIVE">Active</option>
                                <option value="SUSPENDED">Suspended</option>
                                <option value="TERMINATED">Terminated</option>
                                <option value="EXPIRED">Expired</option>
                            </select>
                        </div>
                        <div className="flex items-center bg-muted rounded-lg border px-3 py-1.5">
                            <Search className="h-4 w-4 text-muted-foreground" />
                            <input
                                className="bg-transparent border-none focus:ring-0 text-sm w-48 placeholder:text-muted-foreground ml-2"
                                placeholder="Search clients..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors border">
                            <Download className="h-5 w-5" />
                        </button>
                        <button className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors border">
                            <Filter className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4 text-sm">
                    {error}
                </div>
            )}

            {/* Table */}
            <div className="bg-card rounded-b-xl border shadow-sm overflow-hidden -mt-8">
                {loading ? (
                    <div className="text-center py-16 text-muted-foreground">Loading clients...</div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                        {search || filterStatus !== "ALL" ? "No clients match your filters." : "No clients yet. Register your first client!"}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                <tr className="bg-muted/50 border-b">
                                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-left">Client Code</th>
                                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-left">Company Name</th>
                                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-left">Contact Person</th>
                                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-left">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-left">Service End Date</th>
                                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Balance</th>
                                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">Actions</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y">
                                {filtered.map((client) => (
                                    <tr key={client.clientId} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4 font-mono text-sm text-muted-foreground">
                                            {client.clientCode || `#${client.clientId}`}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded bg-primary flex items-center justify-center font-bold text-xs text-primary-foreground">
                                                    {getInitials(client.companyName)}
                                                </div>
                                                <span className="font-bold">{client.companyName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-semibold">{client.contactPersonName}</p>
                                            <p className="text-xs text-muted-foreground">{client.contactPersonEmail}</p>
                                        </td>
                                        <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${statusBadge(client.status)}`}>
                          {client.status}
                        </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium">
                                            {formatDate(client.contractEndDate)}
                                        </td>
                                        <td className={`px-6 py-4 text-sm font-bold text-right ${client.totalOutstanding > 0 && client.status !== "ACTIVE" ? "text-destructive" : ""}`}>
                                            ${client.totalOutstanding?.toLocaleString("en-US", { minimumFractionDigits: 2 }) || "0.00"}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="p-1 hover:bg-muted rounded transition-colors" disabled={actionLoading === client.clientId}>
                                                        <MoreVertical className="h-5 w-5 text-muted-foreground" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem>View Details</DropdownMenuItem>
                                                    <DropdownMenuItem>Edit Client</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {client.status === "ACTIVE" && (
                                                        <>
                                                            <DropdownMenuItem onClick={() => handleAction(client.clientId, "suspend")}>
                                                                Suspend Client
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-destructive"
                                                                onClick={() => handleAction(client.clientId, "terminate")}
                                                            >
                                                                Terminate Client
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                    {(client.status === "SUSPENDED" || client.status === "TERMINATED") && (
                                                        <DropdownMenuItem onClick={() => handleAction(client.clientId, "reactivate")}>
                                                            Reactivate Client
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-6 py-4 bg-muted/30 flex items-center justify-between border-t">
                            <p className="text-sm text-muted-foreground">
                                Showing <span className="font-bold text-foreground">1 to {filtered.length}</span> of{" "}
                                <span className="font-bold text-foreground">{total.toLocaleString()}</span> clients
                            </p>
                            <div className="flex gap-2">
                                <button className="px-3 py-1.5 rounded-lg border text-sm font-medium hover:bg-card transition-colors disabled:opacity-50" disabled>
                                    Previous
                                </button>
                                <button className="px-3 py-1.5 rounded-lg border text-sm font-medium hover:bg-card transition-colors">
                                    Next
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ClientList;
