const { queryRef, executeQuery, validateArgsWithOptions, mutationRef, executeMutation, validateArgs, makeMemoryCacheProvider } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'hospitalreferralsystem1',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;
const dataConnectSettings = {
  cacheSettings: {
    cacheProvider: makeMemoryCacheProvider()
  }
};
exports.dataConnectSettings = dataConnectSettings;

const insertDepartmentRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertDepartment');
}
insertDepartmentRef.operationName = 'InsertDepartment';
exports.insertDepartmentRef = insertDepartmentRef;

exports.insertDepartment = function insertDepartment(dc) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dc, undefined);
  return executeMutation(insertDepartmentRef(dcInstance, inputVars));
}
;

const updateDepartmentRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateDepartment', inputVars);
}
updateDepartmentRef.operationName = 'UpdateDepartment';
exports.updateDepartmentRef = updateDepartmentRef;

exports.updateDepartment = function updateDepartment(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateDepartmentRef(dcInstance, inputVars));
}
;

const deleteDepartmentRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteDepartment', inputVars);
}
deleteDepartmentRef.operationName = 'DeleteDepartment';
exports.deleteDepartmentRef = deleteDepartmentRef;

exports.deleteDepartment = function deleteDepartment(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteDepartmentRef(dcInstance, inputVars));
}
;

const getDepartmentRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetDepartment', inputVars);
}
getDepartmentRef.operationName = 'GetDepartment';
exports.getDepartmentRef = getDepartmentRef;

exports.getDepartment = function getDepartment(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getDepartmentRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listDepartmentsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListDepartments');
}
listDepartmentsRef.operationName = 'ListDepartments';
exports.listDepartmentsRef = listDepartmentsRef;

exports.listDepartments = function listDepartments(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listDepartmentsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const insertSpecialistRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertSpecialist', inputVars);
}
insertSpecialistRef.operationName = 'InsertSpecialist';
exports.insertSpecialistRef = insertSpecialistRef;

exports.insertSpecialist = function insertSpecialist(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertSpecialistRef(dcInstance, inputVars));
}
;

const updateSpecialistRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateSpecialist', inputVars);
}
updateSpecialistRef.operationName = 'UpdateSpecialist';
exports.updateSpecialistRef = updateSpecialistRef;

exports.updateSpecialist = function updateSpecialist(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateSpecialistRef(dcInstance, inputVars));
}
;

const deleteSpecialistRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteSpecialist', inputVars);
}
deleteSpecialistRef.operationName = 'DeleteSpecialist';
exports.deleteSpecialistRef = deleteSpecialistRef;

exports.deleteSpecialist = function deleteSpecialist(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteSpecialistRef(dcInstance, inputVars));
}
;

const getSpecialistRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetSpecialist', inputVars);
}
getSpecialistRef.operationName = 'GetSpecialist';
exports.getSpecialistRef = getSpecialistRef;

exports.getSpecialist = function getSpecialist(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getSpecialistRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listSpecialistsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListSpecialists');
}
listSpecialistsRef.operationName = 'ListSpecialists';
exports.listSpecialistsRef = listSpecialistsRef;

exports.listSpecialists = function listSpecialists(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listSpecialistsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const insertPatientRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertPatient', inputVars);
}
insertPatientRef.operationName = 'InsertPatient';
exports.insertPatientRef = insertPatientRef;

exports.insertPatient = function insertPatient(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertPatientRef(dcInstance, inputVars));
}
;

const updatePatientContactRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdatePatientContact', inputVars);
}
updatePatientContactRef.operationName = 'UpdatePatientContact';
exports.updatePatientContactRef = updatePatientContactRef;

exports.updatePatientContact = function updatePatientContact(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updatePatientContactRef(dcInstance, inputVars));
}
;

const deletePatientRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeletePatient', inputVars);
}
deletePatientRef.operationName = 'DeletePatient';
exports.deletePatientRef = deletePatientRef;

exports.deletePatient = function deletePatient(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deletePatientRef(dcInstance, inputVars));
}
;

const getPatientRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetPatient', inputVars);
}
getPatientRef.operationName = 'GetPatient';
exports.getPatientRef = getPatientRef;

exports.getPatient = function getPatient(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getPatientRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listPatientsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListPatients');
}
listPatientsRef.operationName = 'ListPatients';
exports.listPatientsRef = listPatientsRef;

exports.listPatients = function listPatients(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listPatientsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const insertReferralRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertReferral', inputVars);
}
insertReferralRef.operationName = 'InsertReferral';
exports.insertReferralRef = insertReferralRef;

exports.insertReferral = function insertReferral(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertReferralRef(dcInstance, inputVars));
}
;

const updateReferralStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateReferralStatus', inputVars);
}
updateReferralStatusRef.operationName = 'UpdateReferralStatus';
exports.updateReferralStatusRef = updateReferralStatusRef;

exports.updateReferralStatus = function updateReferralStatus(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateReferralStatusRef(dcInstance, inputVars));
}
;

const deleteReferralRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteReferral', inputVars);
}
deleteReferralRef.operationName = 'DeleteReferral';
exports.deleteReferralRef = deleteReferralRef;

exports.deleteReferral = function deleteReferral(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteReferralRef(dcInstance, inputVars));
}
;

const getReferralRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetReferral', inputVars);
}
getReferralRef.operationName = 'GetReferral';
exports.getReferralRef = getReferralRef;

exports.getReferral = function getReferral(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getReferralRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listReferralsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListReferrals');
}
listReferralsRef.operationName = 'ListReferrals';
exports.listReferralsRef = listReferralsRef;

exports.listReferrals = function listReferrals(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listReferralsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const insertRosterSlotRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertRosterSlot', inputVars);
}
insertRosterSlotRef.operationName = 'InsertRosterSlot';
exports.insertRosterSlotRef = insertRosterSlotRef;

exports.insertRosterSlot = function insertRosterSlot(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertRosterSlotRef(dcInstance, inputVars));
}
;

const updateRosterLocationRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateRosterLocation', inputVars);
}
updateRosterLocationRef.operationName = 'UpdateRosterLocation';
exports.updateRosterLocationRef = updateRosterLocationRef;

exports.updateRosterLocation = function updateRosterLocation(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateRosterLocationRef(dcInstance, inputVars));
}
;

const deleteRosterSlotRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteRosterSlot', inputVars);
}
deleteRosterSlotRef.operationName = 'DeleteRosterSlot';
exports.deleteRosterSlotRef = deleteRosterSlotRef;

exports.deleteRosterSlot = function deleteRosterSlot(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteRosterSlotRef(dcInstance, inputVars));
}
;

const getRosterSlotRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetRosterSlot', inputVars);
}
getRosterSlotRef.operationName = 'GetRosterSlot';
exports.getRosterSlotRef = getRosterSlotRef;

exports.getRosterSlot = function getRosterSlot(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getRosterSlotRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listRosterSlotsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListRosterSlots');
}
listRosterSlotsRef.operationName = 'ListRosterSlots';
exports.listRosterSlotsRef = listRosterSlotsRef;

exports.listRosterSlots = function listRosterSlots(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listRosterSlotsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;
