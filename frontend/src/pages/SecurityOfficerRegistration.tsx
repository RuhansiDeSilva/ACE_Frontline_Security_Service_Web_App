import { useEffect, useState } from "react";
import { Designation, Sex, Equipment } from "@/data/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Shield, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { authService } from "@/services/authService";
import { ValidationRules } from "@/lib/validationHelpers";
import { clientApi } from "@/lib/api";

interface FieldErrors {
  [key: string]: string;
}

interface FieldValidation {
  [key: string]: string | null; // null = valid, string = error message
}

const designationLabels: Record<string, string> = {
  LSO: "Leading Security Officer",
  JSO: "Junior Security Officer",
  SSO: "Senior Security Officer",
  CSO: "Chief Security Officer",
  ISO: "Industrial Security Officer",
};

interface SecurityOfficerRegistrationProps {
  onBack?: () => void;
}

export default function SecurityOfficerRegistration({ onBack }: SecurityOfficerRegistrationProps) {
  const [loading, setLoading] = useState(false);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientCompanies, setClientCompanies] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment[]>([]);
  const [selectedSex, setSelectedSex] = useState("");
  const [selectedDesignation, setSelectedDesignation] = useState("");
  const [selectedBloodGroup, setSelectedBloodGroup] = useState("");
  const [assignedCompany, setAssignedCompany] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [fieldValidations, setFieldValidations] = useState<FieldValidation>({}); // Real-time validation

  useEffect(() => {
    let mounted = true;

    const loadClients = async () => {
      setClientsLoading(true);
      try {
        const data = await clientApi.getAll();
        if (!mounted) return;

        const companies = Array.from(
          new Set(
            (data || [])
              .map((c) => c.companyName?.trim())
              .filter((name): name is string => Boolean(name))
          )
        ).sort((a, b) => a.localeCompare(b));

        setClientCompanies(companies);
      } catch {
        if (!mounted) return;
        setClientCompanies([]);
      } finally {
        if (mounted) setClientsLoading(false);
      }
    };

    loadClients();
    return () => {
      mounted = false;
    };
  }, []);

  const toggleEquipment = (eq: Equipment) => {
    setSelectedEquipment((prev) =>
      prev.includes(eq) ? prev.filter((e) => e !== eq) : [...prev, eq]
    );
  };

  // Real-time validation handlers
  const validateField = (name: string, value: string) => {
    let error: string | null = null;

    switch (name) {
      case "so_username":
        error = ValidationRules.validateUsername(value);
        break;
      case "so_password":
        error = ValidationRules.validatePassword(value);
        break;
      case "so_fullName":
        error = ValidationRules.validateFullName(value);
        break;
      case "so_email":
        error = ValidationRules.validateEmail(value);
        break;
      case "so_nicNumber":
        if (value) {
          error = ValidationRules.validateNIC(value);
        }
        break;
      case "so_mobileNumber":
        if (value) {
          error = ValidationRules.validatePhoneNumber(value);
        }
        break;
      case "so_emergencyContact":
        if (value) {
          error = ValidationRules.validatePhoneNumber(value);
        }
        break;
      case "so_dateOfBirth":
        if (value) {
          error = ValidationRules.validateDateOfBirth(value);
        }
        break;
      case "so_residentialAddress":
        if (value) {
          error = ValidationRules.validateResidentialAddress(value);
        }
        break;
      case "so_bankAccountNumber":
        if (value) {
          error = ValidationRules.validateBankAccount(value);
        }
        break;
      default:
        break;
    }

    setFieldValidations((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setFieldErrors({});

    try {
      const form = e.currentTarget;
      const get = (name: string) => (form.elements.namedItem(name) as HTMLInputElement)?.value || "";

      const errors: FieldErrors = {};
      
      if (!selectedSex) {
        errors.sex = "Please select sex";
      }
      if (!selectedDesignation) {
        errors.designation = "Please select a designation";
      }
      
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setLoading(false);
        return;
      }

      const data = {
        username: get("so_username"),
        password: get("so_password"),
        role: "SECURITY_OFFICER",
        fullName: get("so_fullName"),
        nicNumber: get("so_nicNumber"),
        sex: selectedSex,
        email: get("so_email"),
        mobileNumber: get("so_mobileNumber"),
        dateOfBirth: get("so_dateOfBirth") || undefined,
        emergencyContact: get("so_emergencyContact"),
        emergencyContactPersonName: get("so_emergencyContactPersonName") || undefined,
        bloodGroup: selectedBloodGroup || undefined,
        residentialAddress: get("so_residentialAddress"),
        designation: selectedDesignation,
        assignedArea: get("so_assignedArea") || undefined,
        assignedCompany: get("so_assignedCompany") || undefined,
        basicSalary: get("so_basicSalary") ? Number(get("so_basicSalary")) : undefined,
        professionalCertificate: get("so_professionalCertificate") || undefined,
        joinDate: get("so_joinDate") || undefined,
        specialSkills: get("so_specialSkills") || undefined,
        handoverEquipment: selectedEquipment.length > 0 ? selectedEquipment : undefined,
        bankName: get("so_bankName") || undefined,
        bankAccountNumber: get("so_bankAccountNumber") || undefined,
        bankBranch: get("so_bankBranch") || undefined,
      };

      await authService.registerUser(data as any, photo || undefined);
      toast.success("Security Officer registered successfully! They can now log in with the provided credentials.");
      form.reset();
      setSelectedSex("");
      setSelectedDesignation("");
      setSelectedBloodGroup("");
      setAssignedCompany("");
      setSelectedEquipment([]);
      setPhoto(null);
      setFieldValidations({});
    } catch (err: any) {
      const errors: FieldErrors = {};
      if (err?.fieldErrors && typeof err.fieldErrors === "object") {
        Object.assign(errors, err.fieldErrors);
      }

      const errorMessage = err.message || "Registration failed";
      if (Object.keys(errors).length === 0) {
        if (errorMessage.includes("Field validation errors:") || errorMessage.includes("validation errors")) {
          const match = errorMessage.match(/(?:Field\s+)?validation errors:?\s*(.*)/i);
          if (match) {
            const errorStr = match[1];
            const fieldPairs = errorStr.split(/[,;]/);
            fieldPairs.forEach(pair => {
              const [field, ...messageParts] = pair.trim().split(":");
              if (field && messageParts.length > 0) {
                errors[field.trim()] = messageParts.join(":").trim();
              }
            });
          }
        }

        if (Object.keys(errors).length === 0) {
          const errorMappings: Record<string, string[]> = {
            username: ["username", "user", "login"],
            password: ["password", "pwd"],
            email: ["email", "mail"],
            fullName: ["fullname", "name", "full_name"],
            nicNumber: ["nic", "nicer", "ic_number"],
            mobileNumber: ["mobile", "phone", "contact"],
            emergencyContact: ["emergency"],
          };
          let identified = false;
          for (const [field, keywords] of Object.entries(errorMappings)) {
            if (keywords.some(kw => errorMessage.toLowerCase().includes(kw))) {
              errors[field] = errorMessage;
              identified = true;
              break;
            }
          }
          if (!identified) {
            errors.general = errorMessage;
          }
        }
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        const errorMessages = Object.values(errors).join("\n");
        toast.error(errorMessages);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="rounded-2xl border-2 border-primary/30 bg-card shadow-lg backdrop-blur-sm overflow-hidden">
          {/* Header Section with gradient background */}
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b-2 border-primary/20 px-6 md:px-10 py-8">
            <div>
              {onBack ? (
                <button onClick={onBack} className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 mb-4 transition-colors font-medium">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
              ) : (
                <Link to="/" className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 mb-4 transition-colors font-medium">
                  <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                </Link>
              )}
              <h1 className="text-4xl font-display font-bold text-foreground tracking-tight flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md">
                  <Shield className="h-7 w-7" />
                </div>
                Security Officer Registration
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">Register a new security officer</p>
            </div>
          </div>

          {/* Form Content */}
          <div className="px-6 md:px-10 py-8">
            <form onSubmit={handleSubmit} className="space-y-8">
        {/* General Errors */}
        {fieldErrors.general && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{fieldErrors.general}</AlertDescription>
          </Alert>
        )}

        {/* Login Credentials */}
        <Section title="Login Credentials">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldWithValidation 
              label="Username" 
              name="so_username" 
              required 
              error={fieldErrors.username}
              validation={fieldValidations.so_username}
              onBlur={(e) => validateField("so_username", e.currentTarget.value)}
              onInput={(e) => validateField("so_username", e.currentTarget.value)}
            />
            <FieldWithValidation 
              label="Password" 
              name="so_password" 
              type="password" 
              required 
              error={fieldErrors.password}
              validation={fieldValidations.so_password}
              onBlur={(e) => validateField("so_password", e.currentTarget.value)}
              onInput={(e) => validateField("so_password", e.currentTarget.value)}
            />
          </div>
        </Section>

        {/* Personal Information */}
        <Section title="Personal Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldWithValidation 
              label="Full Name" 
              name="so_fullName" 
              required 
              error={fieldErrors.fullName}
              validation={fieldValidations.so_fullName}
              onBlur={(e) => validateField("so_fullName", e.currentTarget.value)}
              onInput={(e) => validateField("so_fullName", e.currentTarget.value)}
            />
            <FieldWithValidation 
              label="NIC Number" 
              name="so_nicNumber" 
              required 
              error={fieldErrors.nicNumber}
              validation={fieldValidations.so_nicNumber}
              onBlur={(e) => validateField("so_nicNumber", e.currentTarget.value)}
              onInput={(e) => validateField("so_nicNumber", e.currentTarget.value)}
            />
            <div className="space-y-2">
              <Label>Sex <span className="text-destructive">*</span></Label>
              <Select required value={selectedSex} onValueChange={setSelectedSex}>
                <SelectTrigger className={fieldErrors.sex ? "border-destructive" : ""}><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {Object.values(Sex).map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.sex && <p className="text-xs text-destructive">{fieldErrors.sex}</p>}
            </div>
            <FieldWithValidation 
              label="Email" 
              name="so_email" 
              type="email" 
              required 
              error={fieldErrors.email}
              validation={fieldValidations.so_email}
              onBlur={(e) => validateField("so_email", e.currentTarget.value)}
              onInput={(e) => validateField("so_email", e.currentTarget.value)}
            />
            <FieldWithValidation 
              label="Mobile Number" 
              name="so_mobileNumber" 
              required 
              error={fieldErrors.mobileNumber}
              validation={fieldValidations.so_mobileNumber}
              onBlur={(e) => validateField("so_mobileNumber", e.currentTarget.value)}
              onInput={(e) => validateField("so_mobileNumber", e.currentTarget.value)}
            />
            <FieldWithValidation 
              label="Date of Birth" 
              name="so_dateOfBirth" 
              type="date" 
              required 
              error={fieldErrors.dateOfBirth}
              validation={fieldValidations.so_dateOfBirth}
              onBlur={(e) => validateField("so_dateOfBirth", e.currentTarget.value)}
            />
            <div className="space-y-2">
              <Label>Blood Group</Label>
              <Select value={selectedBloodGroup} onValueChange={setSelectedBloodGroup}>
                <SelectTrigger><SelectValue placeholder="Select blood group" /></SelectTrigger>
                <SelectContent>
                  {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((bg) => (
                    <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <FieldWithValidation 
              label="Emergency Contact Number" 
              name="so_emergencyContact" 
              required 
              error={fieldErrors.emergencyContact}
              validation={fieldValidations.so_emergencyContact}
              onBlur={(e) => validateField("so_emergencyContact", e.currentTarget.value)}
              onInput={(e) => validateField("so_emergencyContact", e.currentTarget.value)}
            />
            <FieldWithValidation 
              label="Emergency Contact Person Name" 
              name="so_emergencyContactPersonName" 
              required 
              error={fieldErrors.emergencyContactPersonName}
            />
          </div>
          <div className="mt-4 space-y-2">
            <Label>Residential Address <span className="text-destructive">*</span></Label>
            <Textarea 
              name="so_residentialAddress" 
              className={`mt-2 ${fieldErrors.residentialAddress ? "border-destructive" : ""}`} 
              required 
              onBlur={(e) => validateField("so_residentialAddress", e.currentTarget.value)}
              onInput={(e) => validateField("so_residentialAddress", e.currentTarget.value)}
            />
            {fieldValidations.so_residentialAddress && <p className="text-xs text-destructive">{fieldValidations.so_residentialAddress}</p>}
            {fieldErrors.residentialAddress && <p className="text-xs text-destructive">{fieldErrors.residentialAddress}</p>}
          </div>
        </Section>

        {/* Professional Details */}
        <Section title="Professional Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Designation <span className="text-destructive">*</span></Label>
              <Select required value={selectedDesignation} onValueChange={setSelectedDesignation}>
                <SelectTrigger className={fieldErrors.designation ? "border-destructive" : ""}><SelectValue placeholder="Select designation" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(Designation).map(([key, value]) => (
                    <SelectItem key={key} value={value}>
                      {value} — {designationLabels[key] || key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.designation && <p className="text-xs text-destructive">{fieldErrors.designation}</p>}
            </div>
            <Field label="Assigned Area" name="so_assignedArea" error={fieldErrors.assignedArea} />
            <div className="space-y-2">
              <Label htmlFor="so_assignedCompany">Assigned Company</Label>
              <Input
                id="so_assignedCompany"
                name="so_assignedCompany"
                list="assigned-company-options"
                placeholder={clientsLoading ? "Loading companies..." : "Select or type a company name"}
                value={assignedCompany}
                onChange={(e) => setAssignedCompany(e.target.value)}
                className={fieldErrors.assignedCompany ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              <datalist id="assigned-company-options">
                {clientCompanies.map((company) => (
                  <option key={company} value={company} />
                ))}
              </datalist>
              {clientsLoading && <p className="text-xs text-muted-foreground">Loading company list...</p>}
              {!clientsLoading && clientCompanies.length === 0 && (
                <p className="text-xs text-muted-foreground">No saved clients found. You can still type a company name manually.</p>
              )}
              {fieldErrors.assignedCompany && <p className="text-xs text-destructive">{fieldErrors.assignedCompany}</p>}
            </div>
            <Field label="Professional Certificate" name="so_professionalCertificate" error={fieldErrors.professionalCertificate} />
            <Field label="Join Date" name="so_joinDate" type="date" error={fieldErrors.joinDate} />
            <Field label="Basic Salary" name="so_basicSalary" type="number" error={fieldErrors.basicSalary} />
            <Field label="Special Skills" name="so_specialSkills" error={fieldErrors.specialSkills} />
          </div>
        </Section>

        {/* Equipment Handover */}
        <Section title="Equipment Handover">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.values(Equipment).map((eq) => (
              <label key={eq} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={selectedEquipment.includes(eq)}
                  onCheckedChange={() => toggleEquipment(eq)}
                />
                <span className="text-sm text-foreground">{eq}</span>
              </label>
            ))}
          </div>
        </Section>

        {/* Bank Details */}
        <Section title="Bank Details">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Bank Name" name="so_bankName" error={fieldErrors.bankName} />
            <FieldWithValidation 
              label="Account Number" 
              name="so_bankAccountNumber" 
              error={fieldErrors.bankAccountNumber}
              validation={fieldValidations.so_bankAccountNumber}
              onBlur={(e) => validateField("so_bankAccountNumber", e.currentTarget.value)}
              onInput={(e) => validateField("so_bankAccountNumber", e.currentTarget.value)}
            />
            <Field label="Branch" name="so_bankBranch" error={fieldErrors.bankBranch} />
          </div>
        </Section>

        {/* Photo */}
        <Section title="Photo">
          <Input
            type="file"
            accept="image/*"
            className="max-w-sm"
            onChange={(e) => setPhoto(e.target.files?.[0] || null)}
          />
        </Section>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading} className="px-8">
            {loading ? "Registering..." : "Register Officer"}
          </Button>
          <Button type="reset" variant="outline" onClick={() => {
            setSelectedSex("");
            setSelectedDesignation("");
            setAssignedCompany("");
            setSelectedEquipment([]);
            setPhoto(null);
            setFieldValidations({});
          }}>Reset</Button>
        </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      <h2 className="text-lg font-display font-semibold text-foreground border-b border-border pb-2">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, name, type = "text", required = false, error }: { label: string; name: string; type?: string; required?: boolean; error?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label} {required && <span className="text-destructive">*</span>}</Label>
      <Input 
        id={name} 
        name={name} 
        type={type} 
        required={required}
        className={error ? "border-destructive focus-visible:ring-destructive" : ""}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

interface FieldWithValidationProps {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  error?: string;
  validation?: string | null;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onInput?: (e: React.FormEvent<HTMLInputElement>) => void;
}

function FieldWithValidation({ 
  label, 
  name, 
  type = "text", 
  required = false, 
  error,
  validation,
  onBlur,
  onInput 
}: FieldWithValidationProps) {
  const hasError = error || validation;
  const errorMsg = error || validation;

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label} {required && <span className="text-destructive">*</span>}</Label>
      <div className="relative">
        <Input 
          id={name} 
          name={name} 
          type={type} 
          required={required}
          className={`${hasError ? "border-destructive focus-visible:ring-destructive" : ""} ${!hasError && validation === null && (document.getElementById(name) as HTMLInputElement)?.value ? "border-green-500" : ""}`}
          onBlur={onBlur}
          onInput={onInput}
        />
        {!hasError && validation === null && (document.getElementById(name) as HTMLInputElement)?.value && (
          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
        )}
      </div>
      {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}
    </div>
  );
}
