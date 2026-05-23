import { useState } from "react";
import { Role, Sex, ADMIN_ROLES } from "@/data/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { UserPlus, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { authService } from "@/services/authService";
import { ValidationRules } from "@/lib/validationHelpers";

interface AdminRegistrationProps {
  onBack?: () => void;
}

interface FieldErrors {
  [key: string]: string;
}

interface FieldValidation {
  [key: string]: string | null; // null = valid, string = error message
}

export default function AdminRegistration({ onBack }: AdminRegistrationProps) {
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedSex, setSelectedSex] = useState("");
  const [selectedBloodGroup, setSelectedBloodGroup] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [assignedArea, setAssignedArea] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [fieldValidations, setFieldValidations] = useState<FieldValidation>({}); // Real-time validation

  // Real-time validation handlers
  const validateField = (name: string, value: string) => {
    let error: string | null = null;

    switch (name) {
      case "username":
        error = ValidationRules.validateUsername(value);
        break;
      case "password":
        error = ValidationRules.validatePassword(value);
        break;
      case "fullName":
        error = ValidationRules.validateFullName(value);
        break;
      case "email":
        error = ValidationRules.validateEmail(value);
        break;
      case "nicNumber":
        if (value && selectedRole !== "CHAIRMAN" && selectedRole !== "DIRECTOR") {
          error = ValidationRules.validateNIC(value);
        }
        break;
      case "mobileNumber":
        if (value && selectedRole !== "CHAIRMAN" && selectedRole !== "DIRECTOR") {
          error = ValidationRules.validatePhoneNumber(value);
        }
        break;
      case "emergencyContact":
        if (value && selectedRole !== "CHAIRMAN" && selectedRole !== "DIRECTOR") {
          error = ValidationRules.validatePhoneNumber(value);
        }
        break;
      case "dateOfBirth":
        if (value && selectedRole !== "CHAIRMAN" && selectedRole !== "DIRECTOR") {
          error = ValidationRules.validateDateOfBirth(value);
        }
        break;
      case "residentialAddress":
        if (value && selectedRole !== "CHAIRMAN" && selectedRole !== "DIRECTOR") {
          error = ValidationRules.validateResidentialAddress(value);
        }
        break;
      case "bankAccountNumber":
        if (value && selectedRole !== "CHAIRMAN" && selectedRole !== "DIRECTOR") {
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

      if (!selectedRole) {
        setFieldErrors({ role: "Please select a role" });
        setLoading(false);
        return;
      }

      if (selectedRole === "AREA_MANAGER" && !assignedArea.trim()) {
        setFieldErrors({ assignedArea: "Please enter an assigned area for the Area Manager" });
        setLoading(false);
        return;
      }

      // For Director and Chairman, only require 5 fields
      const isSimplifiedRole = selectedRole === "CHAIRMAN" || selectedRole === "DIRECTOR";

      // Build data object based on role
      let data: any;
      if (isSimplifiedRole) {
        // For Chairman and Director: only 5 fields required
        data = {
          username: get("username"),
          password: get("password"),
          fullName: get("fullName"),
          role: selectedRole,
          email: get("email"),
          // All other fields are null
          nicNumber: null,
          sex: null,
          mobileNumber: null,
          dateOfBirth: null,
          emergencyContact: null,
          emergencyContactPersonName: null,
          bloodGroup: null,
          residentialAddress: null,
          basicSalary: 0,
          assignedArea: null,
          adminPosition: null,
          professionalCertificate: null,
          joinDate: null,
          specialSkills: null,
          bankName: null,
          bankAccountNumber: null,
          bankBranch: null,
        };
      } else {
        // For other roles: send all fields
        data = {
          username: get("username"),
          password: get("password"),
          role: selectedRole,
          fullName: get("fullName"),
          nicNumber: get("nicNumber") || null,
          sex: selectedSex || null,
          email: get("email"),
          mobileNumber: get("mobileNumber") || null,
          dateOfBirth: get("dateOfBirth") || null,
          emergencyContact: get("emergencyContact") || null,
          emergencyContactPersonName: get("emergencyContactPersonName") || null,
          bloodGroup: selectedBloodGroup || null,
          residentialAddress: get("residentialAddress") || null,
          basicSalary: get("basicSalary") ? Number(get("basicSalary")) : 0,
          assignedArea: selectedRole === "AREA_MANAGER" ? assignedArea.trim() : null,
          adminPosition: get("adminPosition") || null,
          professionalCertificate: get("professionalCertificate") || null,
          joinDate: get("joinDate") || null,
          specialSkills: get("specialSkills") || null,
          bankName: get("bankName") || null,
          bankAccountNumber: get("bankAccountNumber") || null,
          bankBranch: get("bankBranch") || null,
        };
      }

      await authService.registerUser(data, photo || undefined);
      toast.success("Admin registered successfully! They can now log in with the provided credentials.");
      form.reset();
      setSelectedRole("");
      setSelectedSex("");
      setSelectedBloodGroup("");
      setPhoto(null);
      setAssignedArea("");
      setFieldValidations({});
    } catch (err: any) {
      // Prefer structured field errors from API (via authService)
      const errors: FieldErrors = {};
      if (err?.fieldErrors && typeof err.fieldErrors === "object") {
        Object.assign(errors, err.fieldErrors);
      }

      // Fallback text error parsing
      const errorMessage = err.message || "Registration failed";
      if (Object.keys(errors).length === 0) {
        // Parse validation message text (legacy support)
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
                  <UserPlus className="h-7 w-7" />
                </div>
                Admin Registration
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">Register new administration staff member</p>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FieldWithValidation 
              label="Username" 
              name="username" 
              required 
              error={fieldErrors.username} 
              validation={fieldValidations.username}
              onBlur={(e) => validateField("username", e.currentTarget.value)}
              onInput={(e) => validateField("username", e.currentTarget.value)}
            />
            <FieldWithValidation 
              label="Password" 
              name="password" 
              type="password" 
              required 
              error={fieldErrors.password}
              validation={fieldValidations.password}
              onBlur={(e) => validateField("password", e.currentTarget.value)}
              onInput={(e) => validateField("password", e.currentTarget.value)}
            />
            <FieldWithValidation 
              label="Full Name" 
              name="fullName" 
              required 
              error={fieldErrors.fullName}
              validation={fieldValidations.fullName}
              onBlur={(e) => validateField("fullName", e.currentTarget.value)}
              onInput={(e) => validateField("fullName", e.currentTarget.value)}
            />
            <div className="space-y-2">
              <Label>Role <span className="text-destructive">*</span></Label>
              <Select required value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className={fieldErrors.role ? "border-destructive" : ""}><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {ADMIN_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{r.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.role && <p className="text-xs text-destructive">{fieldErrors.role}</p>}
            </div>
          </div>
          {selectedRole === "AREA_MANAGER" && (
            <div className="mt-4 space-y-2">
              <Label>Assigned Area <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g. Colombo North, Kandy Central"
                value={assignedArea}
                onChange={(e) => setAssignedArea(e.target.value)}
                required
                className={fieldErrors.assignedArea ? "border-destructive" : ""}
              />
              {fieldErrors.assignedArea && <p className="text-xs text-destructive">{fieldErrors.assignedArea}</p>}
              <p className="text-xs text-muted-foreground">The geographical area this manager will oversee</p>
            </div>
          )}
        </Section>

        {/* Personal Information */}
        <Section title="Personal Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedRole !== "CHAIRMAN" && selectedRole !== "DIRECTOR" && (
              <FieldWithValidation 
                label="NIC Number" 
                name="nicNumber" 
                required 
                error={fieldErrors.nicNumber}
                validation={fieldValidations.nicNumber}
                onBlur={(e) => validateField("nicNumber", e.currentTarget.value)}
                onInput={(e) => validateField("nicNumber", e.currentTarget.value)}
              />
            )}
            {selectedRole !== "CHAIRMAN" && selectedRole !== "DIRECTOR" ? (
              <div className="space-y-2">
                <Label>Sex <span className="text-destructive">*</span></Label>
                <Select required value={selectedSex} onValueChange={setSelectedSex}>
                  <SelectTrigger className={fieldErrors.sex ? "border-destructive" : ""}><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {Object.values(Sex).map((s) => (
                      <SelectItem key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.sex && <p className="text-xs text-destructive">{fieldErrors.sex}</p>}
              </div>
            ) : null}
            <FieldWithValidation 
              label="Email" 
              name="email" 
              type="email" 
              required 
              error={fieldErrors.email}
              validation={fieldValidations.email}
              onBlur={(e) => validateField("email", e.currentTarget.value)}
              onInput={(e) => validateField("email", e.currentTarget.value)}
            />
            {selectedRole !== "CHAIRMAN" && selectedRole !== "DIRECTOR" && (
              <FieldWithValidation 
                label="Mobile Number" 
                name="mobileNumber" 
                required 
                error={fieldErrors.mobileNumber}
                validation={fieldValidations.mobileNumber}
                onBlur={(e) => validateField("mobileNumber", e.currentTarget.value)}
                onInput={(e) => validateField("mobileNumber", e.currentTarget.value)}
              />
            )}
            {selectedRole !== "CHAIRMAN" && selectedRole !== "DIRECTOR" && (
              <FieldWithValidation 
                label="Date of Birth" 
                name="dateOfBirth" 
                type="date" 
                required 
                error={fieldErrors.dateOfBirth}
                validation={fieldValidations.dateOfBirth}
                onBlur={(e) => validateField("dateOfBirth", e.currentTarget.value)}
              />
            )}
            {selectedRole !== "CHAIRMAN" && selectedRole !== "DIRECTOR" ? (
              <div className="space-y-2">
                <Label>Blood Group</Label>
                <Select value={selectedBloodGroup} onValueChange={setSelectedBloodGroup}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                  <SelectContent>
                    {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((bg) => (
                      <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            {selectedRole !== "CHAIRMAN" && selectedRole !== "DIRECTOR" && (
              <FieldWithValidation 
                label="Emergency Contact Number" 
                name="emergencyContact" 
                required 
                error={fieldErrors.emergencyContact}
                validation={fieldValidations.emergencyContact}
                onBlur={(e) => validateField("emergencyContact", e.currentTarget.value)}
                onInput={(e) => validateField("emergencyContact", e.currentTarget.value)}
              />
            )}
            {selectedRole !== "CHAIRMAN" && selectedRole !== "DIRECTOR" && (
              <FieldWithValidation 
                label="Emergency Contact Person Name" 
                name="emergencyContactPersonName" 
                required 
                error={fieldErrors.emergencyContactPersonName}
              />
            )}
          </div>
          {selectedRole !== "CHAIRMAN" && selectedRole !== "DIRECTOR" ? (
            <div className="mt-4 space-y-2">
              <Label>Residential Address <span className="text-destructive">*</span></Label>
              <Textarea 
                name="residentialAddress" 
                className={`mt-2 ${fieldErrors.residentialAddress ? "border-destructive" : ""}`} 
                required 
                onBlur={(e) => validateField("residentialAddress", e.currentTarget.value)}
                onInput={(e) => validateField("residentialAddress", e.currentTarget.value)}
              />
              {fieldValidations.residentialAddress && <p className="text-xs text-destructive">{fieldValidations.residentialAddress}</p>}
              {fieldErrors.residentialAddress && <p className="text-xs text-destructive">{fieldErrors.residentialAddress}</p>}
            </div>
          ) : null}
        </Section>

        {/* Professional Details */}
        {selectedRole !== "CHAIRMAN" && selectedRole !== "DIRECTOR" && (
        <Section title="Professional Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Admin Position" name="adminPosition" error={fieldErrors.adminPosition} />
            <Field label="Professional Certificate" name="professionalCertificate" error={fieldErrors.professionalCertificate} />
            <Field label="Join Date" name="joinDate" type="date" error={fieldErrors.joinDate} />
            <Field label="Basic Salary" name="basicSalary" type="number" error={fieldErrors.basicSalary} />
            <Field label="Special Skills" name="specialSkills" error={fieldErrors.specialSkills} />
          </div>
        </Section>
        )}

        {/* Bank Details */}
        {selectedRole !== "CHAIRMAN" && selectedRole !== "DIRECTOR" && (
        <Section title="Bank Details">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Bank Name" name="bankName" error={fieldErrors.bankName} />
            <FieldWithValidation 
              label="Account Number" 
              name="bankAccountNumber" 
              error={fieldErrors.bankAccountNumber}
              validation={fieldValidations.bankAccountNumber}
              onBlur={(e) => validateField("bankAccountNumber", e.currentTarget.value)}
              onInput={(e) => validateField("bankAccountNumber", e.currentTarget.value)}
            />
            <Field label="Branch" name="bankBranch" error={fieldErrors.bankBranch} />
          </div>
        </Section>
        )}

        {/* Photo Upload */}
        {selectedRole !== "CHAIRMAN" && selectedRole !== "DIRECTOR" && (
        <Section title="Photo">
          <Input type="file" accept="image/*" className="max-w-sm" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
        </Section>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={loading} className="px-8">
            {loading ? "Registering..." : `Register ${selectedRole ? selectedRole.replace(/_/g, " ") : "Admin"}`}
          </Button>
          <Button type="reset" variant="outline">Reset</Button>
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
