// shared types used by registration forms and other utilities

enum Role {
  ADMIN = "ADMIN",
  OPERATION_MANAGER = "OPERATION_MANAGER",
  ACCOUNT_EXECUTIVE = "ACCOUNT_EXECUTIVE",
  EXECUTIVE_OFFICER = "EXECUTIVE_OFFICER",
  DIRECTOR = "DIRECTOR",
  CHAIRMAN = "CHAIRMAN",
  AREA_MANAGER = "AREA_MANAGER",
  SECURITY_OFFICER = "SECURITY_OFFICER",
}

enum Sex {
  MALE = "MALE",
  FEMALE = "FEMALE",
}

// subset of roles that may be selected when creating an admin user
const ADMIN_ROLES = [
  Role.EXECUTIVE_OFFICER,
  Role.OPERATION_MANAGER,
  Role.ACCOUNT_EXECUTIVE,
  Role.AREA_MANAGER,
  Role.DIRECTOR,
  Role.CHAIRMAN,
];

// designations for security officers
enum Designation {
  LSO = "LSO",
  JSO = "JSO",
  SSO = "SSO",
  CSO = "CSO",
  ISO = "ISO",
}

// possible equipment items for officers
enum Equipment {
  TACTICAL_RADIO = "TACTICAL_RADIO",
  MOBILE_PHONE = "MOBILE_PHONE",
}

export { Role, Sex, ADMIN_ROLES, Designation, Equipment };
