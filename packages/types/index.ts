export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  SCRB_ANALYST = "SCRB_ANALYST",
  DISTRICT_SP = "DISTRICT_SP",
  CIRCLE_INSPECTOR = "CIRCLE_INSPECTOR",
  PS_OFFICER = "PS_OFFICER",
  ANALYST = "ANALYST",
}

export interface User {
  id: number;
  email: string;
  password: string;
  name: string | null;
  role: Role;
  employeeID: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CaseMaster {
  CaseMasterID: number;
  CrimeNo: string;
  CaseNo: string;
  CrimeRegisteredDate: Date;
  PolicePersonID: number;
  PoliceStationID: number;
  CaseCategoryID: number;
  GravityOffenceID: number;
  CrimeMajorHeadID: number | null;
  CrimeMinorHeadID: number | null;
  CaseStatusID: number | null;
  CourtID: number | null;
  IncidentFromDate: Date | null;
  IncidentToDate: Date | null;
  InfoReceivedPSDate: Date | null;
  latitude: number | null;
  longitude: number | null;
  BriefFacts: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplainantDetails {
  ComplainantID: number;
  CaseMasterID: number;
  ComplainantName: string;
  AgeYear: number | null;
  OccupationID: number | null;
  ReligionID: number | null;
  CasteID: number | null;
  GenderID: number | null;
}

export interface Victim {
  VictimMasterID: number;
  CaseMasterID: number;
  VictimName: string;
  AgeYear: number | null;
  GenderID: number | null;
  VictimPolice: string | null;
}

export interface Accused {
  AccusedMasterID: number;
  CaseMasterID: number;
  AccusedName: string;
  AgeYear: number | null;
  GenderID: number | null;
  PersonID: string | null;
}

export interface ArrestSurrenderAccused {
  ArrestSurrenderID: number;
  AccusedMasterID: number;
}

export interface ActSectionAssociation {
  CaseMasterID: number;
  ActID: string;
  SectionID: string;
  ActOrderID: number | null;
  SectionOrderID: number | null;
}

export interface ArrestSurrender {
  ArrestSurrenderID: number;
  CaseMasterID: number;
  ArrestSurrenderTypeID: number | null;
  ArrestSurrenderDate: Date | null;
  ArrestSurrenderStateId: number | null;
  ArrestSurrenderDistrictId: number | null;
  PoliceStationID: number | null;
  IOID: number | null;
  CourtID: number | null;
  IsAccused: boolean | null;
  IsComplainantAccused: boolean | null;
}

export interface Act {
  ActCode: string;
  ActDescription: string | null;
  ShortName: string | null;
  Active: boolean | null;
}

export interface Section {
  ActCode: string;
  SectionCode: string;
  SectionDescription: string | null;
  Active: boolean | null;
}

export interface CrimeHead {
  CrimeHeadID: number;
  CrimeGroupName: string | null;
  Active: boolean | null;
}

export interface CrimeSubHead {
  CrimeSubHeadID: number;
  CrimeHeadID: number;
  CrimeHeadName: string | null;
  SeqID: number | null;
}

export interface CrimeHeadActSection {
  CrimeHeadID: number;
  ActCode: string;
  SectionCode: string;
}

export interface CaseCategory {
  CaseCategoryID: number;
  LookupValue: string | null;
}

export interface GravityOffence {
  GravityOffenceID: number;
  LookupValue: string | null;
}

export interface CaseStatusMaster {
  CaseStatusID: number;
  CaseStatusName: string | null;
}

export interface Court {
  CourtID: number;
  CourtName: string | null;
  DistrictID: number | null;
  StateID: number | null;
  Active: boolean | null;
}

export interface District {
  DistrictID: number;
  DistrictName: string | null;
  StateID: number;
  Active: boolean | null;
}

export interface State {
  StateID: number;
  StateName: string | null;
  NationalityID: number | null;
  Active: boolean | null;
}

export interface Unit {
  UnitID: number;
  UnitName: string | null;
  TypeID: number | null;
  ParentUnit: number | null;
  NationalityID: number | null;
  StateID: number | null;
  DistrictID: number | null;
  Active: boolean | null;
}

export interface UnitType {
  UnitTypeID: number;
  UnitTypeName: string | null;
  CityDistState: string | null;
  Hierarchy: number | null;
  Active: boolean | null;
}

export interface Employee {
  EmployeeID: number;
  DistrictID: number | null;
  UnitID: number | null;
  RankID: number | null;
  DesignationID: number | null;
  KGID: string | null;
  FirstName: string | null;
  EmployeeDOB: Date | null;
  GenderID: number | null;
  BloodGroupID: number | null;
  PhysicallyChallenged: boolean | null;
  AppointmentDate: Date | null;
}

export interface Rank {
  RankID: number;
  RankName: string | null;
  Hierarchy: number | null;
  Active: boolean | null;
}

export interface Designation {
  DesignationID: number;
  DesignationName: string | null;
  Active: boolean | null;
  SortOrder: number | null;
}

export interface OccupationMaster {
  OccupationID: number;
  OccupationName: string | null;
}

export interface ReligionMaster {
  ReligionID: number;
  ReligionName: string | null;
}

export interface CasteMaster {
  caste_master_id: number;
  caste_master_name: string | null;
}

export interface ChargesheetDetails {
  CSID: number;
  CaseMasterID: number;
  csdate: Date | null;
  cstype: string | null;
  PolicePersonID: number | null;
}

export interface Inv_OccuranceTime {
  OccurrenceID: number;
  CaseMasterID: number;
  OccurrenceFromDateTime: Date | null;
  OccurrenceToDateTime: Date | null;
}

export interface CrimeEmbedding {
  id: number;
  CaseMasterID: number;
  embedding: string;
  model_version: string | null;
  created_at: Date;
}

export interface CrimeCluster {
  id: number;
  cluster_id: number;
  CaseMasterID: number;
  cluster_label: string | null;
  confidence: number | null;
  created_at: Date;
}

export interface CriminalNetworkEdge {
  id: number;
  source_type: string;
  source_id: number;
  target_type: string;
  target_id: number;
  relationship: string;
  weight: number | null;
  caseMasterID: number | null;
  created_at: Date;
}

export interface CrimePrediction {
  id: number;
  districtID: number | null;
  policeStationID: number | null;
  crimeType: string | null;
  predictedDate: Date;
  probability: number;
  model_name: string | null;
  features: Record<string, unknown> | null;
  explanation: string | null;
  created_at: Date;
}

export interface AuditLog {
  id: number;
  userId: number;
  action: string;
  resource: string;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: Date;
}

export type Gender = 1 | 2 | 3;
export const GenderMap = { Male: 1, Female: 2, Other: 3 } as const;

export const BloodGroupMap = [
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-",
] as const;

export interface GenderMaster {
  GenderID: number;
  GenderName: string | null;
  GenderCode: string | null;
}

export interface BloodGroupMaster {
  BloodGroupID: number;
  BloodGroupName: string | null;
}

export interface ArrestSurrenderTypeMaster {
  ArrestSurrenderTypeID: number;
  TypeName: string | null;
}

export type ChargesheetType = "A" | "B" | "C";

export const CrimeCategoryPrefix: Record<string, string> = {
  FIR: "1",
  UDR: "2",
  PAR: "3",
  ZeroFIR: "4",
};
