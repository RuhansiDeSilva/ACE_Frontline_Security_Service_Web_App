import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { authService, UserProfile } from "@/services/authService";
import { ArrowLeft, Phone, Mail, Building2, User as UserIcon, Shield } from "lucide-react";

const ClientOfficerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [officer, setOfficer] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Officer ID not provided.");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const data = await authService.getUserById(id);
        setOfficer(data);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load officer profile.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return <div className="py-10 text-sm text-muted-foreground">Loading officer profile…</div>;
  }

  if (error || !officer) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate("/client/dashboard")}
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>
        <p className="text-sm text-red-500">{error || "Officer not found."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate("/client/dashboard")}
        className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </button>

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Officer Profile</p>
            <h1 className="text-2xl font-black text-foreground mt-1">{officer.fullName || "Unnamed Officer"}</h1>
            <p className="text-sm text-muted-foreground mt-1">{officer.designation || officer.role || "Security Officer"}</p>
          </div>
          <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${officer.active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
            {officer.active ? "ACTIVE" : "INACTIVE"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
          <InfoRow icon={<UserIcon className="h-4 w-4" />} label="Officer ID" value={String(officer.id)} />
          <InfoRow icon={<Shield className="h-4 w-4" />} label="Role" value={officer.role || "—"} />
          <InfoRow icon={<Building2 className="h-4 w-4" />} label="Assigned Company" value={officer.assignedCompany || "—"} />
          <InfoRow icon={<Building2 className="h-4 w-4" />} label="Assigned Area" value={officer.assignedArea || "—"} />
          <InfoRow icon={<Phone className="h-4 w-4" />} label="Mobile" value={officer.mobileNumber || "—"} />
          <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={officer.email || "—"} />
        </div>
      </div>
    </div>
  );
};

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/40 bg-muted/30 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
        {icon}
        {label}
      </p>
      <p className="text-sm font-semibold text-foreground mt-1 break-words">{value}</p>
    </div>
  );
}

export default ClientOfficerProfile;
