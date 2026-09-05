import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise, DataConnectSettings } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;
export const dataConnectSettings: DataConnectSettings;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface DeleteDepartmentData {
  department_delete?: Department_Key | null;
}

export interface DeleteDepartmentVariables {
  id: UUIDString;
}

export interface DeletePatientData {
  patient_delete?: Patient_Key | null;
}

export interface DeletePatientVariables {
  id: UUIDString;
}

export interface DeleteReferralData {
  referral_delete?: Referral_Key | null;
}

export interface DeleteReferralVariables {
  id: UUIDString;
}

export interface DeleteRosterSlotData {
  rosterSlot_delete?: RosterSlot_Key | null;
}

export interface DeleteRosterSlotVariables {
  id: UUIDString;
}

export interface DeleteSpecialistData {
  specialist_delete?: Specialist_Key | null;
}

export interface DeleteSpecialistVariables {
  id: UUIDString;
}

export interface Department_Key {
  id: UUIDString;
  __typename?: 'Department_Key';
}

export interface GetDepartmentData {
  department?: {
    name: string;
    contactPhone?: string | null;
    headPhysicianId: UUIDString;
  };
}

export interface GetDepartmentVariables {
  id: UUIDString;
}

export interface GetPatientData {
  patient?: {
    fullName: string;
    dateOfBirth: DateString;
    medicalRecordNumber: string;
  };
}

export interface GetPatientVariables {
  id: UUIDString;
}

export interface GetReferralData {
  referral?: {
    status: string;
    urgency: string;
    clinicalNotes?: string | null;
    appointmentDate?: TimestampString | null;
  };
}

export interface GetReferralVariables {
  id: UUIDString;
}

export interface GetRosterSlotData {
  rosterSlot?: {
    startTime: TimestampString;
    endTime: TimestampString;
    locationRoom?: string | null;
  };
}

export interface GetRosterSlotVariables {
  id: UUIDString;
}

export interface GetSpecialistData {
  specialist?: {
    name: string;
    specialty: string;
    isOnCall: boolean;
  };
}

export interface GetSpecialistVariables {
  id: UUIDString;
}

export interface InsertDepartmentData {
  department_insert: Department_Key;
}

export interface InsertPatientData {
  patient_insert: Patient_Key;
}

export interface InsertPatientVariables {
  name: string;
  dob: DateString;
  mrn: string;
}

export interface InsertReferralData {
  referral_insert: Referral_Key;
}

export interface InsertReferralVariables {
  patientId: UUIDString;
  specId: UUIDString;
  physician: string;
}

export interface InsertRosterSlotData {
  rosterSlot_insert: RosterSlot_Key;
}

export interface InsertRosterSlotVariables {
  specId: UUIDString;
  start: TimestampString;
  end: TimestampString;
}

export interface InsertSpecialistData {
  specialist_insert: Specialist_Key;
}

export interface InsertSpecialistVariables {
  name: string;
  deptId: UUIDString;
}

export interface ListDepartmentsData {
  departments: ({
    name: string;
    contactPhone?: string | null;
  })[];
}

export interface ListPatientsData {
  patients: ({
    fullName: string;
    medicalRecordNumber: string;
  })[];
}

export interface ListReferralsData {
  referrals: ({
    status: string;
    urgency: string;
    referringPhysicianName: string;
  })[];
}

export interface ListRosterSlotsData {
  rosterSlots: ({
    startTime: TimestampString;
    endTime: TimestampString;
    locationRoom?: string | null;
  })[];
}

export interface ListSpecialistsData {
  specialists: ({
    name: string;
    specialty: string;
  })[];
}

export interface Patient_Key {
  id: UUIDString;
  __typename?: 'Patient_Key';
}

export interface Referral_Key {
  id: UUIDString;
  __typename?: 'Referral_Key';
}

export interface RosterSlot_Key {
  id: UUIDString;
  __typename?: 'RosterSlot_Key';
}

export interface Specialist_Key {
  id: UUIDString;
  __typename?: 'Specialist_Key';
}

export interface UpdateDepartmentData {
  department_update?: Department_Key | null;
}

export interface UpdateDepartmentVariables {
  id: UUIDString;
  phone: string;
}

export interface UpdatePatientContactData {
  patient_update?: Patient_Key | null;
}

export interface UpdatePatientContactVariables {
  id: UUIDString;
  phone: string;
}

export interface UpdateReferralStatusData {
  referral_update?: Referral_Key | null;
}

export interface UpdateReferralStatusVariables {
  id: UUIDString;
  status: string;
}

export interface UpdateRosterLocationData {
  rosterSlot_update?: RosterSlot_Key | null;
}

export interface UpdateRosterLocationVariables {
  id: UUIDString;
  room: string;
}

export interface UpdateSpecialistData {
  specialist_update?: Specialist_Key | null;
}

export interface UpdateSpecialistVariables {
  id: UUIDString;
  onCall: boolean;
}

interface InsertDepartmentRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<InsertDepartmentData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<InsertDepartmentData, undefined>;
  operationName: string;
}
export const insertDepartmentRef: InsertDepartmentRef;

export function insertDepartment(): MutationPromise<InsertDepartmentData, undefined>;
export function insertDepartment(dc: DataConnect): MutationPromise<InsertDepartmentData, undefined>;

interface UpdateDepartmentRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateDepartmentVariables): MutationRef<UpdateDepartmentData, UpdateDepartmentVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateDepartmentVariables): MutationRef<UpdateDepartmentData, UpdateDepartmentVariables>;
  operationName: string;
}
export const updateDepartmentRef: UpdateDepartmentRef;

export function updateDepartment(vars: UpdateDepartmentVariables): MutationPromise<UpdateDepartmentData, UpdateDepartmentVariables>;
export function updateDepartment(dc: DataConnect, vars: UpdateDepartmentVariables): MutationPromise<UpdateDepartmentData, UpdateDepartmentVariables>;

interface DeleteDepartmentRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteDepartmentVariables): MutationRef<DeleteDepartmentData, DeleteDepartmentVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteDepartmentVariables): MutationRef<DeleteDepartmentData, DeleteDepartmentVariables>;
  operationName: string;
}
export const deleteDepartmentRef: DeleteDepartmentRef;

export function deleteDepartment(vars: DeleteDepartmentVariables): MutationPromise<DeleteDepartmentData, DeleteDepartmentVariables>;
export function deleteDepartment(dc: DataConnect, vars: DeleteDepartmentVariables): MutationPromise<DeleteDepartmentData, DeleteDepartmentVariables>;

interface GetDepartmentRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetDepartmentVariables): QueryRef<GetDepartmentData, GetDepartmentVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetDepartmentVariables): QueryRef<GetDepartmentData, GetDepartmentVariables>;
  operationName: string;
}
export const getDepartmentRef: GetDepartmentRef;

export function getDepartment(vars: GetDepartmentVariables, options?: ExecuteQueryOptions): QueryPromise<GetDepartmentData, GetDepartmentVariables>;
export function getDepartment(dc: DataConnect, vars: GetDepartmentVariables, options?: ExecuteQueryOptions): QueryPromise<GetDepartmentData, GetDepartmentVariables>;

interface ListDepartmentsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListDepartmentsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListDepartmentsData, undefined>;
  operationName: string;
}
export const listDepartmentsRef: ListDepartmentsRef;

export function listDepartments(options?: ExecuteQueryOptions): QueryPromise<ListDepartmentsData, undefined>;
export function listDepartments(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListDepartmentsData, undefined>;

interface InsertSpecialistRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertSpecialistVariables): MutationRef<InsertSpecialistData, InsertSpecialistVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: InsertSpecialistVariables): MutationRef<InsertSpecialistData, InsertSpecialistVariables>;
  operationName: string;
}
export const insertSpecialistRef: InsertSpecialistRef;

export function insertSpecialist(vars: InsertSpecialistVariables): MutationPromise<InsertSpecialistData, InsertSpecialistVariables>;
export function insertSpecialist(dc: DataConnect, vars: InsertSpecialistVariables): MutationPromise<InsertSpecialistData, InsertSpecialistVariables>;

interface UpdateSpecialistRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateSpecialistVariables): MutationRef<UpdateSpecialistData, UpdateSpecialistVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateSpecialistVariables): MutationRef<UpdateSpecialistData, UpdateSpecialistVariables>;
  operationName: string;
}
export const updateSpecialistRef: UpdateSpecialistRef;

export function updateSpecialist(vars: UpdateSpecialistVariables): MutationPromise<UpdateSpecialistData, UpdateSpecialistVariables>;
export function updateSpecialist(dc: DataConnect, vars: UpdateSpecialistVariables): MutationPromise<UpdateSpecialistData, UpdateSpecialistVariables>;

interface DeleteSpecialistRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteSpecialistVariables): MutationRef<DeleteSpecialistData, DeleteSpecialistVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteSpecialistVariables): MutationRef<DeleteSpecialistData, DeleteSpecialistVariables>;
  operationName: string;
}
export const deleteSpecialistRef: DeleteSpecialistRef;

export function deleteSpecialist(vars: DeleteSpecialistVariables): MutationPromise<DeleteSpecialistData, DeleteSpecialistVariables>;
export function deleteSpecialist(dc: DataConnect, vars: DeleteSpecialistVariables): MutationPromise<DeleteSpecialistData, DeleteSpecialistVariables>;

interface GetSpecialistRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetSpecialistVariables): QueryRef<GetSpecialistData, GetSpecialistVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetSpecialistVariables): QueryRef<GetSpecialistData, GetSpecialistVariables>;
  operationName: string;
}
export const getSpecialistRef: GetSpecialistRef;

export function getSpecialist(vars: GetSpecialistVariables, options?: ExecuteQueryOptions): QueryPromise<GetSpecialistData, GetSpecialistVariables>;
export function getSpecialist(dc: DataConnect, vars: GetSpecialistVariables, options?: ExecuteQueryOptions): QueryPromise<GetSpecialistData, GetSpecialistVariables>;

interface ListSpecialistsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListSpecialistsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListSpecialistsData, undefined>;
  operationName: string;
}
export const listSpecialistsRef: ListSpecialistsRef;

export function listSpecialists(options?: ExecuteQueryOptions): QueryPromise<ListSpecialistsData, undefined>;
export function listSpecialists(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListSpecialistsData, undefined>;

interface InsertPatientRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertPatientVariables): MutationRef<InsertPatientData, InsertPatientVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: InsertPatientVariables): MutationRef<InsertPatientData, InsertPatientVariables>;
  operationName: string;
}
export const insertPatientRef: InsertPatientRef;

export function insertPatient(vars: InsertPatientVariables): MutationPromise<InsertPatientData, InsertPatientVariables>;
export function insertPatient(dc: DataConnect, vars: InsertPatientVariables): MutationPromise<InsertPatientData, InsertPatientVariables>;

interface UpdatePatientContactRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdatePatientContactVariables): MutationRef<UpdatePatientContactData, UpdatePatientContactVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdatePatientContactVariables): MutationRef<UpdatePatientContactData, UpdatePatientContactVariables>;
  operationName: string;
}
export const updatePatientContactRef: UpdatePatientContactRef;

export function updatePatientContact(vars: UpdatePatientContactVariables): MutationPromise<UpdatePatientContactData, UpdatePatientContactVariables>;
export function updatePatientContact(dc: DataConnect, vars: UpdatePatientContactVariables): MutationPromise<UpdatePatientContactData, UpdatePatientContactVariables>;

interface DeletePatientRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeletePatientVariables): MutationRef<DeletePatientData, DeletePatientVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeletePatientVariables): MutationRef<DeletePatientData, DeletePatientVariables>;
  operationName: string;
}
export const deletePatientRef: DeletePatientRef;

export function deletePatient(vars: DeletePatientVariables): MutationPromise<DeletePatientData, DeletePatientVariables>;
export function deletePatient(dc: DataConnect, vars: DeletePatientVariables): MutationPromise<DeletePatientData, DeletePatientVariables>;

interface GetPatientRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetPatientVariables): QueryRef<GetPatientData, GetPatientVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetPatientVariables): QueryRef<GetPatientData, GetPatientVariables>;
  operationName: string;
}
export const getPatientRef: GetPatientRef;

export function getPatient(vars: GetPatientVariables, options?: ExecuteQueryOptions): QueryPromise<GetPatientData, GetPatientVariables>;
export function getPatient(dc: DataConnect, vars: GetPatientVariables, options?: ExecuteQueryOptions): QueryPromise<GetPatientData, GetPatientVariables>;

interface ListPatientsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListPatientsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListPatientsData, undefined>;
  operationName: string;
}
export const listPatientsRef: ListPatientsRef;

export function listPatients(options?: ExecuteQueryOptions): QueryPromise<ListPatientsData, undefined>;
export function listPatients(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListPatientsData, undefined>;

interface InsertReferralRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertReferralVariables): MutationRef<InsertReferralData, InsertReferralVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: InsertReferralVariables): MutationRef<InsertReferralData, InsertReferralVariables>;
  operationName: string;
}
export const insertReferralRef: InsertReferralRef;

export function insertReferral(vars: InsertReferralVariables): MutationPromise<InsertReferralData, InsertReferralVariables>;
export function insertReferral(dc: DataConnect, vars: InsertReferralVariables): MutationPromise<InsertReferralData, InsertReferralVariables>;

interface UpdateReferralStatusRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateReferralStatusVariables): MutationRef<UpdateReferralStatusData, UpdateReferralStatusVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateReferralStatusVariables): MutationRef<UpdateReferralStatusData, UpdateReferralStatusVariables>;
  operationName: string;
}
export const updateReferralStatusRef: UpdateReferralStatusRef;

export function updateReferralStatus(vars: UpdateReferralStatusVariables): MutationPromise<UpdateReferralStatusData, UpdateReferralStatusVariables>;
export function updateReferralStatus(dc: DataConnect, vars: UpdateReferralStatusVariables): MutationPromise<UpdateReferralStatusData, UpdateReferralStatusVariables>;

interface DeleteReferralRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteReferralVariables): MutationRef<DeleteReferralData, DeleteReferralVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteReferralVariables): MutationRef<DeleteReferralData, DeleteReferralVariables>;
  operationName: string;
}
export const deleteReferralRef: DeleteReferralRef;

export function deleteReferral(vars: DeleteReferralVariables): MutationPromise<DeleteReferralData, DeleteReferralVariables>;
export function deleteReferral(dc: DataConnect, vars: DeleteReferralVariables): MutationPromise<DeleteReferralData, DeleteReferralVariables>;

interface GetReferralRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetReferralVariables): QueryRef<GetReferralData, GetReferralVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetReferralVariables): QueryRef<GetReferralData, GetReferralVariables>;
  operationName: string;
}
export const getReferralRef: GetReferralRef;

export function getReferral(vars: GetReferralVariables, options?: ExecuteQueryOptions): QueryPromise<GetReferralData, GetReferralVariables>;
export function getReferral(dc: DataConnect, vars: GetReferralVariables, options?: ExecuteQueryOptions): QueryPromise<GetReferralData, GetReferralVariables>;

interface ListReferralsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListReferralsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListReferralsData, undefined>;
  operationName: string;
}
export const listReferralsRef: ListReferralsRef;

export function listReferrals(options?: ExecuteQueryOptions): QueryPromise<ListReferralsData, undefined>;
export function listReferrals(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListReferralsData, undefined>;

interface InsertRosterSlotRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertRosterSlotVariables): MutationRef<InsertRosterSlotData, InsertRosterSlotVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: InsertRosterSlotVariables): MutationRef<InsertRosterSlotData, InsertRosterSlotVariables>;
  operationName: string;
}
export const insertRosterSlotRef: InsertRosterSlotRef;

export function insertRosterSlot(vars: InsertRosterSlotVariables): MutationPromise<InsertRosterSlotData, InsertRosterSlotVariables>;
export function insertRosterSlot(dc: DataConnect, vars: InsertRosterSlotVariables): MutationPromise<InsertRosterSlotData, InsertRosterSlotVariables>;

interface UpdateRosterLocationRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateRosterLocationVariables): MutationRef<UpdateRosterLocationData, UpdateRosterLocationVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateRosterLocationVariables): MutationRef<UpdateRosterLocationData, UpdateRosterLocationVariables>;
  operationName: string;
}
export const updateRosterLocationRef: UpdateRosterLocationRef;

export function updateRosterLocation(vars: UpdateRosterLocationVariables): MutationPromise<UpdateRosterLocationData, UpdateRosterLocationVariables>;
export function updateRosterLocation(dc: DataConnect, vars: UpdateRosterLocationVariables): MutationPromise<UpdateRosterLocationData, UpdateRosterLocationVariables>;

interface DeleteRosterSlotRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteRosterSlotVariables): MutationRef<DeleteRosterSlotData, DeleteRosterSlotVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteRosterSlotVariables): MutationRef<DeleteRosterSlotData, DeleteRosterSlotVariables>;
  operationName: string;
}
export const deleteRosterSlotRef: DeleteRosterSlotRef;

export function deleteRosterSlot(vars: DeleteRosterSlotVariables): MutationPromise<DeleteRosterSlotData, DeleteRosterSlotVariables>;
export function deleteRosterSlot(dc: DataConnect, vars: DeleteRosterSlotVariables): MutationPromise<DeleteRosterSlotData, DeleteRosterSlotVariables>;

interface GetRosterSlotRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetRosterSlotVariables): QueryRef<GetRosterSlotData, GetRosterSlotVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetRosterSlotVariables): QueryRef<GetRosterSlotData, GetRosterSlotVariables>;
  operationName: string;
}
export const getRosterSlotRef: GetRosterSlotRef;

export function getRosterSlot(vars: GetRosterSlotVariables, options?: ExecuteQueryOptions): QueryPromise<GetRosterSlotData, GetRosterSlotVariables>;
export function getRosterSlot(dc: DataConnect, vars: GetRosterSlotVariables, options?: ExecuteQueryOptions): QueryPromise<GetRosterSlotData, GetRosterSlotVariables>;

interface ListRosterSlotsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListRosterSlotsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListRosterSlotsData, undefined>;
  operationName: string;
}
export const listRosterSlotsRef: ListRosterSlotsRef;

export function listRosterSlots(options?: ExecuteQueryOptions): QueryPromise<ListRosterSlotsData, undefined>;
export function listRosterSlots(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListRosterSlotsData, undefined>;

