import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Minus, ChevronDown, ChevronUp } from "lucide-react";

interface OfficerCount {
  [role: string]: number;
}

interface OfficerRoleSelectorProps {
  value: OfficerCount;
  onChange: (officers: OfficerCount) => void;
}

const OFFICER_ROLES = {
  "Entry-Level Officers": [
    { role: "Junior Security Officer (JSO)", desc: "Entry-level security personnel providing basic perimeter and access control duties." },
    { role: "Security Guard", desc: "Basic security personnel for general surveillance and access monitoring." },
    { role: "Unarmed Security Officer", desc: "Non-armed security professional providing observation and reporting services." },
  ],
  "Mid-Level Officers": [
    { role: "Senior Security Officer (SSO)", desc: "Experienced officer managing security operations and supervising junior staff." },
    { role: "Armed Security Officer", desc: "Authorized personnel carrying firearms for enhanced security in high-risk environments." },
    { role: "Mobile Patrol Officer", desc: "Officer conducting vehicle-based patrols for property and area monitoring." },
    { role: "CCTV Operator", desc: "Specialist monitoring surveillance systems and responding to incidents." },
  ],
  "Specialized Officers": [
    { role: "Event Security Officer", desc: "Professional providing security for events, conferences, and public gatherings." },
    { role: "Corporate Security Officer", desc: "Dedicated officer managing security for corporate offices and facilities." },
    { role: "Industrial Security Officer", desc: "Specialist providing security for manufacturing and industrial facilities." },
    { role: "Loss Prevention Officer", desc: "Professional tasked with preventing theft and managing asset protection." },
    { role: "Personal Security Officer", desc: "Close protection specialist providing security for individuals and dignities." },
  ],
  "Supervisory & Management Roles": [
    { role: "Security Supervisor", desc: "Supervisory personnel managing security team operations and reporting." },
    { role: "Site Security Manager", desc: "Manager overseeing all security operations at a specific site or location." },
    { role: "Security Manager", desc: "Senior manager responsible for comprehensive security strategy and personnel." },
  ],
};

const OfficerRoleSelector = ({ value, onChange }: OfficerRoleSelectorProps) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(
    Object.keys(OFFICER_ROLES).reduce((acc, cat) => ({ ...acc, [cat]: true }), {})
  );

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const updateOfficerCount = (role: string, count: number) => {
    const newCount = Math.max(0, count);
    if (newCount === 0) {
      const { [role]: _, ...rest } = value;
      onChange(rest);
    } else {
      onChange({ ...value, [role]: newCount });
    }
  };

  const totalOfficers = Object.values(value).reduce((sum, count) => sum + count, 0);

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm font-semibold text-blue-900">
          Total Officers Selected: <span className="text-lg font-bold text-blue-700">{totalOfficers}</span>
        </p>
      </div>

      <div className="space-y-3">
        {Object.entries(OFFICER_ROLES).map(([category, roles]) => (
          <div key={category} className="border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#1A1A1B]/5 to-[#FFD700]/5 hover:bg-gradient-to-r hover:from-[#1A1A1B]/10 hover:to-[#FFD700]/10 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-[#FFD700]">🔹</span>
                <span className="font-semibold text-foreground">{category}</span>
                <span className="text-xs bg-[#FFD700]/20 text-[#1A1A1B] px-2 py-1 rounded-full">
                  {roles.length} roles
                </span>
              </div>
              {expandedCategories[category] ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </button>

            {expandedCategories[category] && (
              <div className="p-4 bg-white/50 space-y-3 border-t">
                {roles.map(({ role, desc }) => (
                  <div key={role} className="space-y-2 pb-3 border-b last:border-b-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-foreground">{role}</p>
                        <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                      </div>
                      <div className="flex items-center gap-2 bg-white border rounded-lg p-1.5">
                        <button
                          type="button"
                          onClick={() => updateOfficerCount(role, (value[role] || 0) - 1)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                          disabled={!value[role] || value[role] === 0}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <Input
                          type="number"
                          min="0"
                          value={value[role] || 0}
                          onChange={(e) => updateOfficerCount(role, parseInt(e.target.value) || 0)}
                          className="w-16 h-8 text-center text-sm border-0 p-0"
                        />
                        <button
                          type="button"
                          onClick={() => updateOfficerCount(role, (value[role] || 0) + 1)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OfficerRoleSelector;
