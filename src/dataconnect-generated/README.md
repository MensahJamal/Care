# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetDepartment*](#getdepartment)
  - [*ListDepartments*](#listdepartments)
  - [*GetSpecialist*](#getspecialist)
  - [*ListSpecialists*](#listspecialists)
  - [*GetPatient*](#getpatient)
  - [*ListPatients*](#listpatients)
  - [*GetReferral*](#getreferral)
  - [*ListReferrals*](#listreferrals)
  - [*GetRosterSlot*](#getrosterslot)
  - [*ListRosterSlots*](#listrosterslots)
- [**Mutations**](#mutations)
  - [*InsertDepartment*](#insertdepartment)
  - [*UpdateDepartment*](#updatedepartment)
  - [*DeleteDepartment*](#deletedepartment)
  - [*InsertSpecialist*](#insertspecialist)
  - [*UpdateSpecialist*](#updatespecialist)
  - [*DeleteSpecialist*](#deletespecialist)
  - [*InsertPatient*](#insertpatient)
  - [*UpdatePatientContact*](#updatepatientcontact)
  - [*DeletePatient*](#deletepatient)
  - [*InsertReferral*](#insertreferral)
  - [*UpdateReferralStatus*](#updatereferralstatus)
  - [*DeleteReferral*](#deletereferral)
  - [*InsertRosterSlot*](#insertrosterslot)
  - [*UpdateRosterLocation*](#updaterosterlocation)
  - [*DeleteRosterSlot*](#deleterosterslot)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetDepartment
You can execute the `GetDepartment` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getDepartment(vars: GetDepartmentVariables, options?: ExecuteQueryOptions): QueryPromise<GetDepartmentData, GetDepartmentVariables>;

interface GetDepartmentRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetDepartmentVariables): QueryRef<GetDepartmentData, GetDepartmentVariables>;
}
export const getDepartmentRef: GetDepartmentRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getDepartment(dc: DataConnect, vars: GetDepartmentVariables, options?: ExecuteQueryOptions): QueryPromise<GetDepartmentData, GetDepartmentVariables>;

interface GetDepartmentRef {
  ...
  (dc: DataConnect, vars: GetDepartmentVariables): QueryRef<GetDepartmentData, GetDepartmentVariables>;
}
export const getDepartmentRef: GetDepartmentRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getDepartmentRef:
```typescript
const name = getDepartmentRef.operationName;
console.log(name);
```

### Variables
The `GetDepartment` query requires an argument of type `GetDepartmentVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetDepartmentVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `GetDepartment` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetDepartmentData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetDepartmentData {
  department?: {
    name: string;
    contactPhone?: string | null;
    headPhysicianId: UUIDString;
  };
}
```
### Using `GetDepartment`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getDepartment, GetDepartmentVariables } from '@dataconnect/generated';

// The `GetDepartment` query requires an argument of type `GetDepartmentVariables`:
const getDepartmentVars: GetDepartmentVariables = {
  id: ..., 
};

// Call the `getDepartment()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getDepartment(getDepartmentVars);
// Variables can be defined inline as well.
const { data } = await getDepartment({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getDepartment(dataConnect, getDepartmentVars);

console.log(data.department);

// Or, you can use the `Promise` API.
getDepartment(getDepartmentVars).then((response) => {
  const data = response.data;
  console.log(data.department);
});
```

### Using `GetDepartment`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getDepartmentRef, GetDepartmentVariables } from '@dataconnect/generated';

// The `GetDepartment` query requires an argument of type `GetDepartmentVariables`:
const getDepartmentVars: GetDepartmentVariables = {
  id: ..., 
};

// Call the `getDepartmentRef()` function to get a reference to the query.
const ref = getDepartmentRef(getDepartmentVars);
// Variables can be defined inline as well.
const ref = getDepartmentRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getDepartmentRef(dataConnect, getDepartmentVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.department);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.department);
});
```

## ListDepartments
You can execute the `ListDepartments` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listDepartments(options?: ExecuteQueryOptions): QueryPromise<ListDepartmentsData, undefined>;

interface ListDepartmentsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListDepartmentsData, undefined>;
}
export const listDepartmentsRef: ListDepartmentsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listDepartments(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListDepartmentsData, undefined>;

interface ListDepartmentsRef {
  ...
  (dc: DataConnect): QueryRef<ListDepartmentsData, undefined>;
}
export const listDepartmentsRef: ListDepartmentsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listDepartmentsRef:
```typescript
const name = listDepartmentsRef.operationName;
console.log(name);
```

### Variables
The `ListDepartments` query has no variables.
### Return Type
Recall that executing the `ListDepartments` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListDepartmentsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListDepartmentsData {
  departments: ({
    name: string;
    contactPhone?: string | null;
  })[];
}
```
### Using `ListDepartments`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listDepartments } from '@dataconnect/generated';


// Call the `listDepartments()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listDepartments();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listDepartments(dataConnect);

console.log(data.departments);

// Or, you can use the `Promise` API.
listDepartments().then((response) => {
  const data = response.data;
  console.log(data.departments);
});
```

### Using `ListDepartments`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listDepartmentsRef } from '@dataconnect/generated';


// Call the `listDepartmentsRef()` function to get a reference to the query.
const ref = listDepartmentsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listDepartmentsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.departments);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.departments);
});
```

## GetSpecialist
You can execute the `GetSpecialist` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getSpecialist(vars: GetSpecialistVariables, options?: ExecuteQueryOptions): QueryPromise<GetSpecialistData, GetSpecialistVariables>;

interface GetSpecialistRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetSpecialistVariables): QueryRef<GetSpecialistData, GetSpecialistVariables>;
}
export const getSpecialistRef: GetSpecialistRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getSpecialist(dc: DataConnect, vars: GetSpecialistVariables, options?: ExecuteQueryOptions): QueryPromise<GetSpecialistData, GetSpecialistVariables>;

interface GetSpecialistRef {
  ...
  (dc: DataConnect, vars: GetSpecialistVariables): QueryRef<GetSpecialistData, GetSpecialistVariables>;
}
export const getSpecialistRef: GetSpecialistRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getSpecialistRef:
```typescript
const name = getSpecialistRef.operationName;
console.log(name);
```

### Variables
The `GetSpecialist` query requires an argument of type `GetSpecialistVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetSpecialistVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `GetSpecialist` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetSpecialistData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetSpecialistData {
  specialist?: {
    name: string;
    specialty: string;
    isOnCall: boolean;
  };
}
```
### Using `GetSpecialist`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getSpecialist, GetSpecialistVariables } from '@dataconnect/generated';

// The `GetSpecialist` query requires an argument of type `GetSpecialistVariables`:
const getSpecialistVars: GetSpecialistVariables = {
  id: ..., 
};

// Call the `getSpecialist()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getSpecialist(getSpecialistVars);
// Variables can be defined inline as well.
const { data } = await getSpecialist({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getSpecialist(dataConnect, getSpecialistVars);

console.log(data.specialist);

// Or, you can use the `Promise` API.
getSpecialist(getSpecialistVars).then((response) => {
  const data = response.data;
  console.log(data.specialist);
});
```

### Using `GetSpecialist`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getSpecialistRef, GetSpecialistVariables } from '@dataconnect/generated';

// The `GetSpecialist` query requires an argument of type `GetSpecialistVariables`:
const getSpecialistVars: GetSpecialistVariables = {
  id: ..., 
};

// Call the `getSpecialistRef()` function to get a reference to the query.
const ref = getSpecialistRef(getSpecialistVars);
// Variables can be defined inline as well.
const ref = getSpecialistRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getSpecialistRef(dataConnect, getSpecialistVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.specialist);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.specialist);
});
```

## ListSpecialists
You can execute the `ListSpecialists` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listSpecialists(options?: ExecuteQueryOptions): QueryPromise<ListSpecialistsData, undefined>;

interface ListSpecialistsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListSpecialistsData, undefined>;
}
export const listSpecialistsRef: ListSpecialistsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listSpecialists(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListSpecialistsData, undefined>;

interface ListSpecialistsRef {
  ...
  (dc: DataConnect): QueryRef<ListSpecialistsData, undefined>;
}
export const listSpecialistsRef: ListSpecialistsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listSpecialistsRef:
```typescript
const name = listSpecialistsRef.operationName;
console.log(name);
```

### Variables
The `ListSpecialists` query has no variables.
### Return Type
Recall that executing the `ListSpecialists` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListSpecialistsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListSpecialistsData {
  specialists: ({
    name: string;
    specialty: string;
  })[];
}
```
### Using `ListSpecialists`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listSpecialists } from '@dataconnect/generated';


// Call the `listSpecialists()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listSpecialists();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listSpecialists(dataConnect);

console.log(data.specialists);

// Or, you can use the `Promise` API.
listSpecialists().then((response) => {
  const data = response.data;
  console.log(data.specialists);
});
```

### Using `ListSpecialists`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listSpecialistsRef } from '@dataconnect/generated';


// Call the `listSpecialistsRef()` function to get a reference to the query.
const ref = listSpecialistsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listSpecialistsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.specialists);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.specialists);
});
```

## GetPatient
You can execute the `GetPatient` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getPatient(vars: GetPatientVariables, options?: ExecuteQueryOptions): QueryPromise<GetPatientData, GetPatientVariables>;

interface GetPatientRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetPatientVariables): QueryRef<GetPatientData, GetPatientVariables>;
}
export const getPatientRef: GetPatientRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getPatient(dc: DataConnect, vars: GetPatientVariables, options?: ExecuteQueryOptions): QueryPromise<GetPatientData, GetPatientVariables>;

interface GetPatientRef {
  ...
  (dc: DataConnect, vars: GetPatientVariables): QueryRef<GetPatientData, GetPatientVariables>;
}
export const getPatientRef: GetPatientRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getPatientRef:
```typescript
const name = getPatientRef.operationName;
console.log(name);
```

### Variables
The `GetPatient` query requires an argument of type `GetPatientVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetPatientVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `GetPatient` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetPatientData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetPatientData {
  patient?: {
    fullName: string;
    dateOfBirth: DateString;
    medicalRecordNumber: string;
  };
}
```
### Using `GetPatient`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getPatient, GetPatientVariables } from '@dataconnect/generated';

// The `GetPatient` query requires an argument of type `GetPatientVariables`:
const getPatientVars: GetPatientVariables = {
  id: ..., 
};

// Call the `getPatient()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getPatient(getPatientVars);
// Variables can be defined inline as well.
const { data } = await getPatient({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getPatient(dataConnect, getPatientVars);

console.log(data.patient);

// Or, you can use the `Promise` API.
getPatient(getPatientVars).then((response) => {
  const data = response.data;
  console.log(data.patient);
});
```

### Using `GetPatient`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getPatientRef, GetPatientVariables } from '@dataconnect/generated';

// The `GetPatient` query requires an argument of type `GetPatientVariables`:
const getPatientVars: GetPatientVariables = {
  id: ..., 
};

// Call the `getPatientRef()` function to get a reference to the query.
const ref = getPatientRef(getPatientVars);
// Variables can be defined inline as well.
const ref = getPatientRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getPatientRef(dataConnect, getPatientVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.patient);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.patient);
});
```

## ListPatients
You can execute the `ListPatients` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listPatients(options?: ExecuteQueryOptions): QueryPromise<ListPatientsData, undefined>;

interface ListPatientsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListPatientsData, undefined>;
}
export const listPatientsRef: ListPatientsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listPatients(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListPatientsData, undefined>;

interface ListPatientsRef {
  ...
  (dc: DataConnect): QueryRef<ListPatientsData, undefined>;
}
export const listPatientsRef: ListPatientsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listPatientsRef:
```typescript
const name = listPatientsRef.operationName;
console.log(name);
```

### Variables
The `ListPatients` query has no variables.
### Return Type
Recall that executing the `ListPatients` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListPatientsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListPatientsData {
  patients: ({
    fullName: string;
    medicalRecordNumber: string;
  })[];
}
```
### Using `ListPatients`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listPatients } from '@dataconnect/generated';


// Call the `listPatients()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listPatients();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listPatients(dataConnect);

console.log(data.patients);

// Or, you can use the `Promise` API.
listPatients().then((response) => {
  const data = response.data;
  console.log(data.patients);
});
```

### Using `ListPatients`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listPatientsRef } from '@dataconnect/generated';


// Call the `listPatientsRef()` function to get a reference to the query.
const ref = listPatientsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listPatientsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.patients);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.patients);
});
```

## GetReferral
You can execute the `GetReferral` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getReferral(vars: GetReferralVariables, options?: ExecuteQueryOptions): QueryPromise<GetReferralData, GetReferralVariables>;

interface GetReferralRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetReferralVariables): QueryRef<GetReferralData, GetReferralVariables>;
}
export const getReferralRef: GetReferralRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getReferral(dc: DataConnect, vars: GetReferralVariables, options?: ExecuteQueryOptions): QueryPromise<GetReferralData, GetReferralVariables>;

interface GetReferralRef {
  ...
  (dc: DataConnect, vars: GetReferralVariables): QueryRef<GetReferralData, GetReferralVariables>;
}
export const getReferralRef: GetReferralRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getReferralRef:
```typescript
const name = getReferralRef.operationName;
console.log(name);
```

### Variables
The `GetReferral` query requires an argument of type `GetReferralVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetReferralVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `GetReferral` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetReferralData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetReferralData {
  referral?: {
    status: string;
    urgency: string;
    clinicalNotes?: string | null;
    appointmentDate?: TimestampString | null;
  };
}
```
### Using `GetReferral`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getReferral, GetReferralVariables } from '@dataconnect/generated';

// The `GetReferral` query requires an argument of type `GetReferralVariables`:
const getReferralVars: GetReferralVariables = {
  id: ..., 
};

// Call the `getReferral()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getReferral(getReferralVars);
// Variables can be defined inline as well.
const { data } = await getReferral({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getReferral(dataConnect, getReferralVars);

console.log(data.referral);

// Or, you can use the `Promise` API.
getReferral(getReferralVars).then((response) => {
  const data = response.data;
  console.log(data.referral);
});
```

### Using `GetReferral`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getReferralRef, GetReferralVariables } from '@dataconnect/generated';

// The `GetReferral` query requires an argument of type `GetReferralVariables`:
const getReferralVars: GetReferralVariables = {
  id: ..., 
};

// Call the `getReferralRef()` function to get a reference to the query.
const ref = getReferralRef(getReferralVars);
// Variables can be defined inline as well.
const ref = getReferralRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getReferralRef(dataConnect, getReferralVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.referral);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.referral);
});
```

## ListReferrals
You can execute the `ListReferrals` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listReferrals(options?: ExecuteQueryOptions): QueryPromise<ListReferralsData, undefined>;

interface ListReferralsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListReferralsData, undefined>;
}
export const listReferralsRef: ListReferralsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listReferrals(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListReferralsData, undefined>;

interface ListReferralsRef {
  ...
  (dc: DataConnect): QueryRef<ListReferralsData, undefined>;
}
export const listReferralsRef: ListReferralsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listReferralsRef:
```typescript
const name = listReferralsRef.operationName;
console.log(name);
```

### Variables
The `ListReferrals` query has no variables.
### Return Type
Recall that executing the `ListReferrals` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListReferralsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListReferralsData {
  referrals: ({
    status: string;
    urgency: string;
    referringPhysicianName: string;
  })[];
}
```
### Using `ListReferrals`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listReferrals } from '@dataconnect/generated';


// Call the `listReferrals()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listReferrals();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listReferrals(dataConnect);

console.log(data.referrals);

// Or, you can use the `Promise` API.
listReferrals().then((response) => {
  const data = response.data;
  console.log(data.referrals);
});
```

### Using `ListReferrals`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listReferralsRef } from '@dataconnect/generated';


// Call the `listReferralsRef()` function to get a reference to the query.
const ref = listReferralsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listReferralsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.referrals);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.referrals);
});
```

## GetRosterSlot
You can execute the `GetRosterSlot` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getRosterSlot(vars: GetRosterSlotVariables, options?: ExecuteQueryOptions): QueryPromise<GetRosterSlotData, GetRosterSlotVariables>;

interface GetRosterSlotRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetRosterSlotVariables): QueryRef<GetRosterSlotData, GetRosterSlotVariables>;
}
export const getRosterSlotRef: GetRosterSlotRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getRosterSlot(dc: DataConnect, vars: GetRosterSlotVariables, options?: ExecuteQueryOptions): QueryPromise<GetRosterSlotData, GetRosterSlotVariables>;

interface GetRosterSlotRef {
  ...
  (dc: DataConnect, vars: GetRosterSlotVariables): QueryRef<GetRosterSlotData, GetRosterSlotVariables>;
}
export const getRosterSlotRef: GetRosterSlotRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getRosterSlotRef:
```typescript
const name = getRosterSlotRef.operationName;
console.log(name);
```

### Variables
The `GetRosterSlot` query requires an argument of type `GetRosterSlotVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetRosterSlotVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `GetRosterSlot` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetRosterSlotData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetRosterSlotData {
  rosterSlot?: {
    startTime: TimestampString;
    endTime: TimestampString;
    locationRoom?: string | null;
  };
}
```
### Using `GetRosterSlot`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getRosterSlot, GetRosterSlotVariables } from '@dataconnect/generated';

// The `GetRosterSlot` query requires an argument of type `GetRosterSlotVariables`:
const getRosterSlotVars: GetRosterSlotVariables = {
  id: ..., 
};

// Call the `getRosterSlot()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getRosterSlot(getRosterSlotVars);
// Variables can be defined inline as well.
const { data } = await getRosterSlot({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getRosterSlot(dataConnect, getRosterSlotVars);

console.log(data.rosterSlot);

// Or, you can use the `Promise` API.
getRosterSlot(getRosterSlotVars).then((response) => {
  const data = response.data;
  console.log(data.rosterSlot);
});
```

### Using `GetRosterSlot`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getRosterSlotRef, GetRosterSlotVariables } from '@dataconnect/generated';

// The `GetRosterSlot` query requires an argument of type `GetRosterSlotVariables`:
const getRosterSlotVars: GetRosterSlotVariables = {
  id: ..., 
};

// Call the `getRosterSlotRef()` function to get a reference to the query.
const ref = getRosterSlotRef(getRosterSlotVars);
// Variables can be defined inline as well.
const ref = getRosterSlotRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getRosterSlotRef(dataConnect, getRosterSlotVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.rosterSlot);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.rosterSlot);
});
```

## ListRosterSlots
You can execute the `ListRosterSlots` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listRosterSlots(options?: ExecuteQueryOptions): QueryPromise<ListRosterSlotsData, undefined>;

interface ListRosterSlotsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListRosterSlotsData, undefined>;
}
export const listRosterSlotsRef: ListRosterSlotsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listRosterSlots(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListRosterSlotsData, undefined>;

interface ListRosterSlotsRef {
  ...
  (dc: DataConnect): QueryRef<ListRosterSlotsData, undefined>;
}
export const listRosterSlotsRef: ListRosterSlotsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listRosterSlotsRef:
```typescript
const name = listRosterSlotsRef.operationName;
console.log(name);
```

### Variables
The `ListRosterSlots` query has no variables.
### Return Type
Recall that executing the `ListRosterSlots` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListRosterSlotsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListRosterSlotsData {
  rosterSlots: ({
    startTime: TimestampString;
    endTime: TimestampString;
    locationRoom?: string | null;
  })[];
}
```
### Using `ListRosterSlots`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listRosterSlots } from '@dataconnect/generated';


// Call the `listRosterSlots()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listRosterSlots();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listRosterSlots(dataConnect);

console.log(data.rosterSlots);

// Or, you can use the `Promise` API.
listRosterSlots().then((response) => {
  const data = response.data;
  console.log(data.rosterSlots);
});
```

### Using `ListRosterSlots`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listRosterSlotsRef } from '@dataconnect/generated';


// Call the `listRosterSlotsRef()` function to get a reference to the query.
const ref = listRosterSlotsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listRosterSlotsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.rosterSlots);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.rosterSlots);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## InsertDepartment
You can execute the `InsertDepartment` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
insertDepartment(): MutationPromise<InsertDepartmentData, undefined>;

interface InsertDepartmentRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<InsertDepartmentData, undefined>;
}
export const insertDepartmentRef: InsertDepartmentRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertDepartment(dc: DataConnect): MutationPromise<InsertDepartmentData, undefined>;

interface InsertDepartmentRef {
  ...
  (dc: DataConnect): MutationRef<InsertDepartmentData, undefined>;
}
export const insertDepartmentRef: InsertDepartmentRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertDepartmentRef:
```typescript
const name = insertDepartmentRef.operationName;
console.log(name);
```

### Variables
The `InsertDepartment` mutation has no variables.
### Return Type
Recall that executing the `InsertDepartment` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertDepartmentData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface InsertDepartmentData {
  department_insert: Department_Key;
}
```
### Using `InsertDepartment`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertDepartment } from '@dataconnect/generated';


// Call the `insertDepartment()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertDepartment();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertDepartment(dataConnect);

console.log(data.department_insert);

// Or, you can use the `Promise` API.
insertDepartment().then((response) => {
  const data = response.data;
  console.log(data.department_insert);
});
```

### Using `InsertDepartment`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertDepartmentRef } from '@dataconnect/generated';


// Call the `insertDepartmentRef()` function to get a reference to the mutation.
const ref = insertDepartmentRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertDepartmentRef(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.department_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.department_insert);
});
```

## UpdateDepartment
You can execute the `UpdateDepartment` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateDepartment(vars: UpdateDepartmentVariables): MutationPromise<UpdateDepartmentData, UpdateDepartmentVariables>;

interface UpdateDepartmentRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateDepartmentVariables): MutationRef<UpdateDepartmentData, UpdateDepartmentVariables>;
}
export const updateDepartmentRef: UpdateDepartmentRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateDepartment(dc: DataConnect, vars: UpdateDepartmentVariables): MutationPromise<UpdateDepartmentData, UpdateDepartmentVariables>;

interface UpdateDepartmentRef {
  ...
  (dc: DataConnect, vars: UpdateDepartmentVariables): MutationRef<UpdateDepartmentData, UpdateDepartmentVariables>;
}
export const updateDepartmentRef: UpdateDepartmentRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateDepartmentRef:
```typescript
const name = updateDepartmentRef.operationName;
console.log(name);
```

### Variables
The `UpdateDepartment` mutation requires an argument of type `UpdateDepartmentVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateDepartmentVariables {
  id: UUIDString;
  phone: string;
}
```
### Return Type
Recall that executing the `UpdateDepartment` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateDepartmentData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateDepartmentData {
  department_update?: Department_Key | null;
}
```
### Using `UpdateDepartment`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateDepartment, UpdateDepartmentVariables } from '@dataconnect/generated';

// The `UpdateDepartment` mutation requires an argument of type `UpdateDepartmentVariables`:
const updateDepartmentVars: UpdateDepartmentVariables = {
  id: ..., 
  phone: ..., 
};

// Call the `updateDepartment()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateDepartment(updateDepartmentVars);
// Variables can be defined inline as well.
const { data } = await updateDepartment({ id: ..., phone: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateDepartment(dataConnect, updateDepartmentVars);

console.log(data.department_update);

// Or, you can use the `Promise` API.
updateDepartment(updateDepartmentVars).then((response) => {
  const data = response.data;
  console.log(data.department_update);
});
```

### Using `UpdateDepartment`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateDepartmentRef, UpdateDepartmentVariables } from '@dataconnect/generated';

// The `UpdateDepartment` mutation requires an argument of type `UpdateDepartmentVariables`:
const updateDepartmentVars: UpdateDepartmentVariables = {
  id: ..., 
  phone: ..., 
};

// Call the `updateDepartmentRef()` function to get a reference to the mutation.
const ref = updateDepartmentRef(updateDepartmentVars);
// Variables can be defined inline as well.
const ref = updateDepartmentRef({ id: ..., phone: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateDepartmentRef(dataConnect, updateDepartmentVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.department_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.department_update);
});
```

## DeleteDepartment
You can execute the `DeleteDepartment` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteDepartment(vars: DeleteDepartmentVariables): MutationPromise<DeleteDepartmentData, DeleteDepartmentVariables>;

interface DeleteDepartmentRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteDepartmentVariables): MutationRef<DeleteDepartmentData, DeleteDepartmentVariables>;
}
export const deleteDepartmentRef: DeleteDepartmentRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteDepartment(dc: DataConnect, vars: DeleteDepartmentVariables): MutationPromise<DeleteDepartmentData, DeleteDepartmentVariables>;

interface DeleteDepartmentRef {
  ...
  (dc: DataConnect, vars: DeleteDepartmentVariables): MutationRef<DeleteDepartmentData, DeleteDepartmentVariables>;
}
export const deleteDepartmentRef: DeleteDepartmentRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteDepartmentRef:
```typescript
const name = deleteDepartmentRef.operationName;
console.log(name);
```

### Variables
The `DeleteDepartment` mutation requires an argument of type `DeleteDepartmentVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteDepartmentVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `DeleteDepartment` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteDepartmentData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteDepartmentData {
  department_delete?: Department_Key | null;
}
```
### Using `DeleteDepartment`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteDepartment, DeleteDepartmentVariables } from '@dataconnect/generated';

// The `DeleteDepartment` mutation requires an argument of type `DeleteDepartmentVariables`:
const deleteDepartmentVars: DeleteDepartmentVariables = {
  id: ..., 
};

// Call the `deleteDepartment()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteDepartment(deleteDepartmentVars);
// Variables can be defined inline as well.
const { data } = await deleteDepartment({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteDepartment(dataConnect, deleteDepartmentVars);

console.log(data.department_delete);

// Or, you can use the `Promise` API.
deleteDepartment(deleteDepartmentVars).then((response) => {
  const data = response.data;
  console.log(data.department_delete);
});
```

### Using `DeleteDepartment`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteDepartmentRef, DeleteDepartmentVariables } from '@dataconnect/generated';

// The `DeleteDepartment` mutation requires an argument of type `DeleteDepartmentVariables`:
const deleteDepartmentVars: DeleteDepartmentVariables = {
  id: ..., 
};

// Call the `deleteDepartmentRef()` function to get a reference to the mutation.
const ref = deleteDepartmentRef(deleteDepartmentVars);
// Variables can be defined inline as well.
const ref = deleteDepartmentRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteDepartmentRef(dataConnect, deleteDepartmentVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.department_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.department_delete);
});
```

## InsertSpecialist
You can execute the `InsertSpecialist` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
insertSpecialist(vars: InsertSpecialistVariables): MutationPromise<InsertSpecialistData, InsertSpecialistVariables>;

interface InsertSpecialistRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertSpecialistVariables): MutationRef<InsertSpecialistData, InsertSpecialistVariables>;
}
export const insertSpecialistRef: InsertSpecialistRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertSpecialist(dc: DataConnect, vars: InsertSpecialistVariables): MutationPromise<InsertSpecialistData, InsertSpecialistVariables>;

interface InsertSpecialistRef {
  ...
  (dc: DataConnect, vars: InsertSpecialistVariables): MutationRef<InsertSpecialistData, InsertSpecialistVariables>;
}
export const insertSpecialistRef: InsertSpecialistRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertSpecialistRef:
```typescript
const name = insertSpecialistRef.operationName;
console.log(name);
```

### Variables
The `InsertSpecialist` mutation requires an argument of type `InsertSpecialistVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface InsertSpecialistVariables {
  name: string;
  deptId: UUIDString;
}
```
### Return Type
Recall that executing the `InsertSpecialist` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertSpecialistData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface InsertSpecialistData {
  specialist_insert: Specialist_Key;
}
```
### Using `InsertSpecialist`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertSpecialist, InsertSpecialistVariables } from '@dataconnect/generated';

// The `InsertSpecialist` mutation requires an argument of type `InsertSpecialistVariables`:
const insertSpecialistVars: InsertSpecialistVariables = {
  name: ..., 
  deptId: ..., 
};

// Call the `insertSpecialist()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertSpecialist(insertSpecialistVars);
// Variables can be defined inline as well.
const { data } = await insertSpecialist({ name: ..., deptId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertSpecialist(dataConnect, insertSpecialistVars);

console.log(data.specialist_insert);

// Or, you can use the `Promise` API.
insertSpecialist(insertSpecialistVars).then((response) => {
  const data = response.data;
  console.log(data.specialist_insert);
});
```

### Using `InsertSpecialist`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertSpecialistRef, InsertSpecialistVariables } from '@dataconnect/generated';

// The `InsertSpecialist` mutation requires an argument of type `InsertSpecialistVariables`:
const insertSpecialistVars: InsertSpecialistVariables = {
  name: ..., 
  deptId: ..., 
};

// Call the `insertSpecialistRef()` function to get a reference to the mutation.
const ref = insertSpecialistRef(insertSpecialistVars);
// Variables can be defined inline as well.
const ref = insertSpecialistRef({ name: ..., deptId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertSpecialistRef(dataConnect, insertSpecialistVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.specialist_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.specialist_insert);
});
```

## UpdateSpecialist
You can execute the `UpdateSpecialist` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateSpecialist(vars: UpdateSpecialistVariables): MutationPromise<UpdateSpecialistData, UpdateSpecialistVariables>;

interface UpdateSpecialistRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateSpecialistVariables): MutationRef<UpdateSpecialistData, UpdateSpecialistVariables>;
}
export const updateSpecialistRef: UpdateSpecialistRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateSpecialist(dc: DataConnect, vars: UpdateSpecialistVariables): MutationPromise<UpdateSpecialistData, UpdateSpecialistVariables>;

interface UpdateSpecialistRef {
  ...
  (dc: DataConnect, vars: UpdateSpecialistVariables): MutationRef<UpdateSpecialistData, UpdateSpecialistVariables>;
}
export const updateSpecialistRef: UpdateSpecialistRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateSpecialistRef:
```typescript
const name = updateSpecialistRef.operationName;
console.log(name);
```

### Variables
The `UpdateSpecialist` mutation requires an argument of type `UpdateSpecialistVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateSpecialistVariables {
  id: UUIDString;
  onCall: boolean;
}
```
### Return Type
Recall that executing the `UpdateSpecialist` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateSpecialistData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateSpecialistData {
  specialist_update?: Specialist_Key | null;
}
```
### Using `UpdateSpecialist`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateSpecialist, UpdateSpecialistVariables } from '@dataconnect/generated';

// The `UpdateSpecialist` mutation requires an argument of type `UpdateSpecialistVariables`:
const updateSpecialistVars: UpdateSpecialistVariables = {
  id: ..., 
  onCall: ..., 
};

// Call the `updateSpecialist()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateSpecialist(updateSpecialistVars);
// Variables can be defined inline as well.
const { data } = await updateSpecialist({ id: ..., onCall: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateSpecialist(dataConnect, updateSpecialistVars);

console.log(data.specialist_update);

// Or, you can use the `Promise` API.
updateSpecialist(updateSpecialistVars).then((response) => {
  const data = response.data;
  console.log(data.specialist_update);
});
```

### Using `UpdateSpecialist`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateSpecialistRef, UpdateSpecialistVariables } from '@dataconnect/generated';

// The `UpdateSpecialist` mutation requires an argument of type `UpdateSpecialistVariables`:
const updateSpecialistVars: UpdateSpecialistVariables = {
  id: ..., 
  onCall: ..., 
};

// Call the `updateSpecialistRef()` function to get a reference to the mutation.
const ref = updateSpecialistRef(updateSpecialistVars);
// Variables can be defined inline as well.
const ref = updateSpecialistRef({ id: ..., onCall: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateSpecialistRef(dataConnect, updateSpecialistVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.specialist_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.specialist_update);
});
```

## DeleteSpecialist
You can execute the `DeleteSpecialist` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteSpecialist(vars: DeleteSpecialistVariables): MutationPromise<DeleteSpecialistData, DeleteSpecialistVariables>;

interface DeleteSpecialistRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteSpecialistVariables): MutationRef<DeleteSpecialistData, DeleteSpecialistVariables>;
}
export const deleteSpecialistRef: DeleteSpecialistRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteSpecialist(dc: DataConnect, vars: DeleteSpecialistVariables): MutationPromise<DeleteSpecialistData, DeleteSpecialistVariables>;

interface DeleteSpecialistRef {
  ...
  (dc: DataConnect, vars: DeleteSpecialistVariables): MutationRef<DeleteSpecialistData, DeleteSpecialistVariables>;
}
export const deleteSpecialistRef: DeleteSpecialistRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteSpecialistRef:
```typescript
const name = deleteSpecialistRef.operationName;
console.log(name);
```

### Variables
The `DeleteSpecialist` mutation requires an argument of type `DeleteSpecialistVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteSpecialistVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `DeleteSpecialist` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteSpecialistData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteSpecialistData {
  specialist_delete?: Specialist_Key | null;
}
```
### Using `DeleteSpecialist`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteSpecialist, DeleteSpecialistVariables } from '@dataconnect/generated';

// The `DeleteSpecialist` mutation requires an argument of type `DeleteSpecialistVariables`:
const deleteSpecialistVars: DeleteSpecialistVariables = {
  id: ..., 
};

// Call the `deleteSpecialist()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteSpecialist(deleteSpecialistVars);
// Variables can be defined inline as well.
const { data } = await deleteSpecialist({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteSpecialist(dataConnect, deleteSpecialistVars);

console.log(data.specialist_delete);

// Or, you can use the `Promise` API.
deleteSpecialist(deleteSpecialistVars).then((response) => {
  const data = response.data;
  console.log(data.specialist_delete);
});
```

### Using `DeleteSpecialist`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteSpecialistRef, DeleteSpecialistVariables } from '@dataconnect/generated';

// The `DeleteSpecialist` mutation requires an argument of type `DeleteSpecialistVariables`:
const deleteSpecialistVars: DeleteSpecialistVariables = {
  id: ..., 
};

// Call the `deleteSpecialistRef()` function to get a reference to the mutation.
const ref = deleteSpecialistRef(deleteSpecialistVars);
// Variables can be defined inline as well.
const ref = deleteSpecialistRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteSpecialistRef(dataConnect, deleteSpecialistVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.specialist_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.specialist_delete);
});
```

## InsertPatient
You can execute the `InsertPatient` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
insertPatient(vars: InsertPatientVariables): MutationPromise<InsertPatientData, InsertPatientVariables>;

interface InsertPatientRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertPatientVariables): MutationRef<InsertPatientData, InsertPatientVariables>;
}
export const insertPatientRef: InsertPatientRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertPatient(dc: DataConnect, vars: InsertPatientVariables): MutationPromise<InsertPatientData, InsertPatientVariables>;

interface InsertPatientRef {
  ...
  (dc: DataConnect, vars: InsertPatientVariables): MutationRef<InsertPatientData, InsertPatientVariables>;
}
export const insertPatientRef: InsertPatientRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertPatientRef:
```typescript
const name = insertPatientRef.operationName;
console.log(name);
```

### Variables
The `InsertPatient` mutation requires an argument of type `InsertPatientVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface InsertPatientVariables {
  name: string;
  dob: DateString;
  mrn: string;
}
```
### Return Type
Recall that executing the `InsertPatient` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertPatientData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface InsertPatientData {
  patient_insert: Patient_Key;
}
```
### Using `InsertPatient`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertPatient, InsertPatientVariables } from '@dataconnect/generated';

// The `InsertPatient` mutation requires an argument of type `InsertPatientVariables`:
const insertPatientVars: InsertPatientVariables = {
  name: ..., 
  dob: ..., 
  mrn: ..., 
};

// Call the `insertPatient()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertPatient(insertPatientVars);
// Variables can be defined inline as well.
const { data } = await insertPatient({ name: ..., dob: ..., mrn: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertPatient(dataConnect, insertPatientVars);

console.log(data.patient_insert);

// Or, you can use the `Promise` API.
insertPatient(insertPatientVars).then((response) => {
  const data = response.data;
  console.log(data.patient_insert);
});
```

### Using `InsertPatient`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertPatientRef, InsertPatientVariables } from '@dataconnect/generated';

// The `InsertPatient` mutation requires an argument of type `InsertPatientVariables`:
const insertPatientVars: InsertPatientVariables = {
  name: ..., 
  dob: ..., 
  mrn: ..., 
};

// Call the `insertPatientRef()` function to get a reference to the mutation.
const ref = insertPatientRef(insertPatientVars);
// Variables can be defined inline as well.
const ref = insertPatientRef({ name: ..., dob: ..., mrn: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertPatientRef(dataConnect, insertPatientVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.patient_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.patient_insert);
});
```

## UpdatePatientContact
You can execute the `UpdatePatientContact` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updatePatientContact(vars: UpdatePatientContactVariables): MutationPromise<UpdatePatientContactData, UpdatePatientContactVariables>;

interface UpdatePatientContactRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdatePatientContactVariables): MutationRef<UpdatePatientContactData, UpdatePatientContactVariables>;
}
export const updatePatientContactRef: UpdatePatientContactRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updatePatientContact(dc: DataConnect, vars: UpdatePatientContactVariables): MutationPromise<UpdatePatientContactData, UpdatePatientContactVariables>;

interface UpdatePatientContactRef {
  ...
  (dc: DataConnect, vars: UpdatePatientContactVariables): MutationRef<UpdatePatientContactData, UpdatePatientContactVariables>;
}
export const updatePatientContactRef: UpdatePatientContactRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updatePatientContactRef:
```typescript
const name = updatePatientContactRef.operationName;
console.log(name);
```

### Variables
The `UpdatePatientContact` mutation requires an argument of type `UpdatePatientContactVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdatePatientContactVariables {
  id: UUIDString;
  phone: string;
}
```
### Return Type
Recall that executing the `UpdatePatientContact` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdatePatientContactData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdatePatientContactData {
  patient_update?: Patient_Key | null;
}
```
### Using `UpdatePatientContact`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updatePatientContact, UpdatePatientContactVariables } from '@dataconnect/generated';

// The `UpdatePatientContact` mutation requires an argument of type `UpdatePatientContactVariables`:
const updatePatientContactVars: UpdatePatientContactVariables = {
  id: ..., 
  phone: ..., 
};

// Call the `updatePatientContact()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updatePatientContact(updatePatientContactVars);
// Variables can be defined inline as well.
const { data } = await updatePatientContact({ id: ..., phone: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updatePatientContact(dataConnect, updatePatientContactVars);

console.log(data.patient_update);

// Or, you can use the `Promise` API.
updatePatientContact(updatePatientContactVars).then((response) => {
  const data = response.data;
  console.log(data.patient_update);
});
```

### Using `UpdatePatientContact`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updatePatientContactRef, UpdatePatientContactVariables } from '@dataconnect/generated';

// The `UpdatePatientContact` mutation requires an argument of type `UpdatePatientContactVariables`:
const updatePatientContactVars: UpdatePatientContactVariables = {
  id: ..., 
  phone: ..., 
};

// Call the `updatePatientContactRef()` function to get a reference to the mutation.
const ref = updatePatientContactRef(updatePatientContactVars);
// Variables can be defined inline as well.
const ref = updatePatientContactRef({ id: ..., phone: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updatePatientContactRef(dataConnect, updatePatientContactVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.patient_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.patient_update);
});
```

## DeletePatient
You can execute the `DeletePatient` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deletePatient(vars: DeletePatientVariables): MutationPromise<DeletePatientData, DeletePatientVariables>;

interface DeletePatientRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeletePatientVariables): MutationRef<DeletePatientData, DeletePatientVariables>;
}
export const deletePatientRef: DeletePatientRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deletePatient(dc: DataConnect, vars: DeletePatientVariables): MutationPromise<DeletePatientData, DeletePatientVariables>;

interface DeletePatientRef {
  ...
  (dc: DataConnect, vars: DeletePatientVariables): MutationRef<DeletePatientData, DeletePatientVariables>;
}
export const deletePatientRef: DeletePatientRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deletePatientRef:
```typescript
const name = deletePatientRef.operationName;
console.log(name);
```

### Variables
The `DeletePatient` mutation requires an argument of type `DeletePatientVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeletePatientVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `DeletePatient` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeletePatientData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeletePatientData {
  patient_delete?: Patient_Key | null;
}
```
### Using `DeletePatient`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deletePatient, DeletePatientVariables } from '@dataconnect/generated';

// The `DeletePatient` mutation requires an argument of type `DeletePatientVariables`:
const deletePatientVars: DeletePatientVariables = {
  id: ..., 
};

// Call the `deletePatient()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deletePatient(deletePatientVars);
// Variables can be defined inline as well.
const { data } = await deletePatient({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deletePatient(dataConnect, deletePatientVars);

console.log(data.patient_delete);

// Or, you can use the `Promise` API.
deletePatient(deletePatientVars).then((response) => {
  const data = response.data;
  console.log(data.patient_delete);
});
```

### Using `DeletePatient`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deletePatientRef, DeletePatientVariables } from '@dataconnect/generated';

// The `DeletePatient` mutation requires an argument of type `DeletePatientVariables`:
const deletePatientVars: DeletePatientVariables = {
  id: ..., 
};

// Call the `deletePatientRef()` function to get a reference to the mutation.
const ref = deletePatientRef(deletePatientVars);
// Variables can be defined inline as well.
const ref = deletePatientRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deletePatientRef(dataConnect, deletePatientVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.patient_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.patient_delete);
});
```

## InsertReferral
You can execute the `InsertReferral` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
insertReferral(vars: InsertReferralVariables): MutationPromise<InsertReferralData, InsertReferralVariables>;

interface InsertReferralRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertReferralVariables): MutationRef<InsertReferralData, InsertReferralVariables>;
}
export const insertReferralRef: InsertReferralRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertReferral(dc: DataConnect, vars: InsertReferralVariables): MutationPromise<InsertReferralData, InsertReferralVariables>;

interface InsertReferralRef {
  ...
  (dc: DataConnect, vars: InsertReferralVariables): MutationRef<InsertReferralData, InsertReferralVariables>;
}
export const insertReferralRef: InsertReferralRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertReferralRef:
```typescript
const name = insertReferralRef.operationName;
console.log(name);
```

### Variables
The `InsertReferral` mutation requires an argument of type `InsertReferralVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface InsertReferralVariables {
  patientId: UUIDString;
  specId: UUIDString;
  physician: string;
}
```
### Return Type
Recall that executing the `InsertReferral` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertReferralData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface InsertReferralData {
  referral_insert: Referral_Key;
}
```
### Using `InsertReferral`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertReferral, InsertReferralVariables } from '@dataconnect/generated';

// The `InsertReferral` mutation requires an argument of type `InsertReferralVariables`:
const insertReferralVars: InsertReferralVariables = {
  patientId: ..., 
  specId: ..., 
  physician: ..., 
};

// Call the `insertReferral()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertReferral(insertReferralVars);
// Variables can be defined inline as well.
const { data } = await insertReferral({ patientId: ..., specId: ..., physician: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertReferral(dataConnect, insertReferralVars);

console.log(data.referral_insert);

// Or, you can use the `Promise` API.
insertReferral(insertReferralVars).then((response) => {
  const data = response.data;
  console.log(data.referral_insert);
});
```

### Using `InsertReferral`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertReferralRef, InsertReferralVariables } from '@dataconnect/generated';

// The `InsertReferral` mutation requires an argument of type `InsertReferralVariables`:
const insertReferralVars: InsertReferralVariables = {
  patientId: ..., 
  specId: ..., 
  physician: ..., 
};

// Call the `insertReferralRef()` function to get a reference to the mutation.
const ref = insertReferralRef(insertReferralVars);
// Variables can be defined inline as well.
const ref = insertReferralRef({ patientId: ..., specId: ..., physician: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertReferralRef(dataConnect, insertReferralVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.referral_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.referral_insert);
});
```

## UpdateReferralStatus
You can execute the `UpdateReferralStatus` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateReferralStatus(vars: UpdateReferralStatusVariables): MutationPromise<UpdateReferralStatusData, UpdateReferralStatusVariables>;

interface UpdateReferralStatusRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateReferralStatusVariables): MutationRef<UpdateReferralStatusData, UpdateReferralStatusVariables>;
}
export const updateReferralStatusRef: UpdateReferralStatusRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateReferralStatus(dc: DataConnect, vars: UpdateReferralStatusVariables): MutationPromise<UpdateReferralStatusData, UpdateReferralStatusVariables>;

interface UpdateReferralStatusRef {
  ...
  (dc: DataConnect, vars: UpdateReferralStatusVariables): MutationRef<UpdateReferralStatusData, UpdateReferralStatusVariables>;
}
export const updateReferralStatusRef: UpdateReferralStatusRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateReferralStatusRef:
```typescript
const name = updateReferralStatusRef.operationName;
console.log(name);
```

### Variables
The `UpdateReferralStatus` mutation requires an argument of type `UpdateReferralStatusVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateReferralStatusVariables {
  id: UUIDString;
  status: string;
}
```
### Return Type
Recall that executing the `UpdateReferralStatus` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateReferralStatusData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateReferralStatusData {
  referral_update?: Referral_Key | null;
}
```
### Using `UpdateReferralStatus`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateReferralStatus, UpdateReferralStatusVariables } from '@dataconnect/generated';

// The `UpdateReferralStatus` mutation requires an argument of type `UpdateReferralStatusVariables`:
const updateReferralStatusVars: UpdateReferralStatusVariables = {
  id: ..., 
  status: ..., 
};

// Call the `updateReferralStatus()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateReferralStatus(updateReferralStatusVars);
// Variables can be defined inline as well.
const { data } = await updateReferralStatus({ id: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateReferralStatus(dataConnect, updateReferralStatusVars);

console.log(data.referral_update);

// Or, you can use the `Promise` API.
updateReferralStatus(updateReferralStatusVars).then((response) => {
  const data = response.data;
  console.log(data.referral_update);
});
```

### Using `UpdateReferralStatus`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateReferralStatusRef, UpdateReferralStatusVariables } from '@dataconnect/generated';

// The `UpdateReferralStatus` mutation requires an argument of type `UpdateReferralStatusVariables`:
const updateReferralStatusVars: UpdateReferralStatusVariables = {
  id: ..., 
  status: ..., 
};

// Call the `updateReferralStatusRef()` function to get a reference to the mutation.
const ref = updateReferralStatusRef(updateReferralStatusVars);
// Variables can be defined inline as well.
const ref = updateReferralStatusRef({ id: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateReferralStatusRef(dataConnect, updateReferralStatusVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.referral_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.referral_update);
});
```

## DeleteReferral
You can execute the `DeleteReferral` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteReferral(vars: DeleteReferralVariables): MutationPromise<DeleteReferralData, DeleteReferralVariables>;

interface DeleteReferralRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteReferralVariables): MutationRef<DeleteReferralData, DeleteReferralVariables>;
}
export const deleteReferralRef: DeleteReferralRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteReferral(dc: DataConnect, vars: DeleteReferralVariables): MutationPromise<DeleteReferralData, DeleteReferralVariables>;

interface DeleteReferralRef {
  ...
  (dc: DataConnect, vars: DeleteReferralVariables): MutationRef<DeleteReferralData, DeleteReferralVariables>;
}
export const deleteReferralRef: DeleteReferralRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteReferralRef:
```typescript
const name = deleteReferralRef.operationName;
console.log(name);
```

### Variables
The `DeleteReferral` mutation requires an argument of type `DeleteReferralVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteReferralVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `DeleteReferral` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteReferralData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteReferralData {
  referral_delete?: Referral_Key | null;
}
```
### Using `DeleteReferral`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteReferral, DeleteReferralVariables } from '@dataconnect/generated';

// The `DeleteReferral` mutation requires an argument of type `DeleteReferralVariables`:
const deleteReferralVars: DeleteReferralVariables = {
  id: ..., 
};

// Call the `deleteReferral()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteReferral(deleteReferralVars);
// Variables can be defined inline as well.
const { data } = await deleteReferral({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteReferral(dataConnect, deleteReferralVars);

console.log(data.referral_delete);

// Or, you can use the `Promise` API.
deleteReferral(deleteReferralVars).then((response) => {
  const data = response.data;
  console.log(data.referral_delete);
});
```

### Using `DeleteReferral`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteReferralRef, DeleteReferralVariables } from '@dataconnect/generated';

// The `DeleteReferral` mutation requires an argument of type `DeleteReferralVariables`:
const deleteReferralVars: DeleteReferralVariables = {
  id: ..., 
};

// Call the `deleteReferralRef()` function to get a reference to the mutation.
const ref = deleteReferralRef(deleteReferralVars);
// Variables can be defined inline as well.
const ref = deleteReferralRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteReferralRef(dataConnect, deleteReferralVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.referral_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.referral_delete);
});
```

## InsertRosterSlot
You can execute the `InsertRosterSlot` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
insertRosterSlot(vars: InsertRosterSlotVariables): MutationPromise<InsertRosterSlotData, InsertRosterSlotVariables>;

interface InsertRosterSlotRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertRosterSlotVariables): MutationRef<InsertRosterSlotData, InsertRosterSlotVariables>;
}
export const insertRosterSlotRef: InsertRosterSlotRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertRosterSlot(dc: DataConnect, vars: InsertRosterSlotVariables): MutationPromise<InsertRosterSlotData, InsertRosterSlotVariables>;

interface InsertRosterSlotRef {
  ...
  (dc: DataConnect, vars: InsertRosterSlotVariables): MutationRef<InsertRosterSlotData, InsertRosterSlotVariables>;
}
export const insertRosterSlotRef: InsertRosterSlotRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertRosterSlotRef:
```typescript
const name = insertRosterSlotRef.operationName;
console.log(name);
```

### Variables
The `InsertRosterSlot` mutation requires an argument of type `InsertRosterSlotVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface InsertRosterSlotVariables {
  specId: UUIDString;
  start: TimestampString;
  end: TimestampString;
}
```
### Return Type
Recall that executing the `InsertRosterSlot` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertRosterSlotData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface InsertRosterSlotData {
  rosterSlot_insert: RosterSlot_Key;
}
```
### Using `InsertRosterSlot`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertRosterSlot, InsertRosterSlotVariables } from '@dataconnect/generated';

// The `InsertRosterSlot` mutation requires an argument of type `InsertRosterSlotVariables`:
const insertRosterSlotVars: InsertRosterSlotVariables = {
  specId: ..., 
  start: ..., 
  end: ..., 
};

// Call the `insertRosterSlot()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertRosterSlot(insertRosterSlotVars);
// Variables can be defined inline as well.
const { data } = await insertRosterSlot({ specId: ..., start: ..., end: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertRosterSlot(dataConnect, insertRosterSlotVars);

console.log(data.rosterSlot_insert);

// Or, you can use the `Promise` API.
insertRosterSlot(insertRosterSlotVars).then((response) => {
  const data = response.data;
  console.log(data.rosterSlot_insert);
});
```

### Using `InsertRosterSlot`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertRosterSlotRef, InsertRosterSlotVariables } from '@dataconnect/generated';

// The `InsertRosterSlot` mutation requires an argument of type `InsertRosterSlotVariables`:
const insertRosterSlotVars: InsertRosterSlotVariables = {
  specId: ..., 
  start: ..., 
  end: ..., 
};

// Call the `insertRosterSlotRef()` function to get a reference to the mutation.
const ref = insertRosterSlotRef(insertRosterSlotVars);
// Variables can be defined inline as well.
const ref = insertRosterSlotRef({ specId: ..., start: ..., end: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertRosterSlotRef(dataConnect, insertRosterSlotVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.rosterSlot_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.rosterSlot_insert);
});
```

## UpdateRosterLocation
You can execute the `UpdateRosterLocation` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateRosterLocation(vars: UpdateRosterLocationVariables): MutationPromise<UpdateRosterLocationData, UpdateRosterLocationVariables>;

interface UpdateRosterLocationRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateRosterLocationVariables): MutationRef<UpdateRosterLocationData, UpdateRosterLocationVariables>;
}
export const updateRosterLocationRef: UpdateRosterLocationRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateRosterLocation(dc: DataConnect, vars: UpdateRosterLocationVariables): MutationPromise<UpdateRosterLocationData, UpdateRosterLocationVariables>;

interface UpdateRosterLocationRef {
  ...
  (dc: DataConnect, vars: UpdateRosterLocationVariables): MutationRef<UpdateRosterLocationData, UpdateRosterLocationVariables>;
}
export const updateRosterLocationRef: UpdateRosterLocationRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateRosterLocationRef:
```typescript
const name = updateRosterLocationRef.operationName;
console.log(name);
```

### Variables
The `UpdateRosterLocation` mutation requires an argument of type `UpdateRosterLocationVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateRosterLocationVariables {
  id: UUIDString;
  room: string;
}
```
### Return Type
Recall that executing the `UpdateRosterLocation` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateRosterLocationData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateRosterLocationData {
  rosterSlot_update?: RosterSlot_Key | null;
}
```
### Using `UpdateRosterLocation`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateRosterLocation, UpdateRosterLocationVariables } from '@dataconnect/generated';

// The `UpdateRosterLocation` mutation requires an argument of type `UpdateRosterLocationVariables`:
const updateRosterLocationVars: UpdateRosterLocationVariables = {
  id: ..., 
  room: ..., 
};

// Call the `updateRosterLocation()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateRosterLocation(updateRosterLocationVars);
// Variables can be defined inline as well.
const { data } = await updateRosterLocation({ id: ..., room: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateRosterLocation(dataConnect, updateRosterLocationVars);

console.log(data.rosterSlot_update);

// Or, you can use the `Promise` API.
updateRosterLocation(updateRosterLocationVars).then((response) => {
  const data = response.data;
  console.log(data.rosterSlot_update);
});
```

### Using `UpdateRosterLocation`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateRosterLocationRef, UpdateRosterLocationVariables } from '@dataconnect/generated';

// The `UpdateRosterLocation` mutation requires an argument of type `UpdateRosterLocationVariables`:
const updateRosterLocationVars: UpdateRosterLocationVariables = {
  id: ..., 
  room: ..., 
};

// Call the `updateRosterLocationRef()` function to get a reference to the mutation.
const ref = updateRosterLocationRef(updateRosterLocationVars);
// Variables can be defined inline as well.
const ref = updateRosterLocationRef({ id: ..., room: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateRosterLocationRef(dataConnect, updateRosterLocationVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.rosterSlot_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.rosterSlot_update);
});
```

## DeleteRosterSlot
You can execute the `DeleteRosterSlot` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteRosterSlot(vars: DeleteRosterSlotVariables): MutationPromise<DeleteRosterSlotData, DeleteRosterSlotVariables>;

interface DeleteRosterSlotRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteRosterSlotVariables): MutationRef<DeleteRosterSlotData, DeleteRosterSlotVariables>;
}
export const deleteRosterSlotRef: DeleteRosterSlotRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteRosterSlot(dc: DataConnect, vars: DeleteRosterSlotVariables): MutationPromise<DeleteRosterSlotData, DeleteRosterSlotVariables>;

interface DeleteRosterSlotRef {
  ...
  (dc: DataConnect, vars: DeleteRosterSlotVariables): MutationRef<DeleteRosterSlotData, DeleteRosterSlotVariables>;
}
export const deleteRosterSlotRef: DeleteRosterSlotRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteRosterSlotRef:
```typescript
const name = deleteRosterSlotRef.operationName;
console.log(name);
```

### Variables
The `DeleteRosterSlot` mutation requires an argument of type `DeleteRosterSlotVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteRosterSlotVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `DeleteRosterSlot` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteRosterSlotData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteRosterSlotData {
  rosterSlot_delete?: RosterSlot_Key | null;
}
```
### Using `DeleteRosterSlot`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteRosterSlot, DeleteRosterSlotVariables } from '@dataconnect/generated';

// The `DeleteRosterSlot` mutation requires an argument of type `DeleteRosterSlotVariables`:
const deleteRosterSlotVars: DeleteRosterSlotVariables = {
  id: ..., 
};

// Call the `deleteRosterSlot()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteRosterSlot(deleteRosterSlotVars);
// Variables can be defined inline as well.
const { data } = await deleteRosterSlot({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteRosterSlot(dataConnect, deleteRosterSlotVars);

console.log(data.rosterSlot_delete);

// Or, you can use the `Promise` API.
deleteRosterSlot(deleteRosterSlotVars).then((response) => {
  const data = response.data;
  console.log(data.rosterSlot_delete);
});
```

### Using `DeleteRosterSlot`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteRosterSlotRef, DeleteRosterSlotVariables } from '@dataconnect/generated';

// The `DeleteRosterSlot` mutation requires an argument of type `DeleteRosterSlotVariables`:
const deleteRosterSlotVars: DeleteRosterSlotVariables = {
  id: ..., 
};

// Call the `deleteRosterSlotRef()` function to get a reference to the mutation.
const ref = deleteRosterSlotRef(deleteRosterSlotVars);
// Variables can be defined inline as well.
const ref = deleteRosterSlotRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteRosterSlotRef(dataConnect, deleteRosterSlotVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.rosterSlot_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.rosterSlot_delete);
});
```

