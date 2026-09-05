# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.





## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { insertDepartment, updateDepartment, deleteDepartment, getDepartment, listDepartments, insertSpecialist, updateSpecialist, deleteSpecialist, getSpecialist, listSpecialists } from '@dataconnect/generated';


// Operation InsertDepartment: 
const { data } = await InsertDepartment(dataConnect);

// Operation UpdateDepartment:  For variables, look at type UpdateDepartmentVars in ../index.d.ts
const { data } = await UpdateDepartment(dataConnect, updateDepartmentVars);

// Operation DeleteDepartment:  For variables, look at type DeleteDepartmentVars in ../index.d.ts
const { data } = await DeleteDepartment(dataConnect, deleteDepartmentVars);

// Operation GetDepartment:  For variables, look at type GetDepartmentVars in ../index.d.ts
const { data } = await GetDepartment(dataConnect, getDepartmentVars);

// Operation ListDepartments: 
const { data } = await ListDepartments(dataConnect);

// Operation InsertSpecialist:  For variables, look at type InsertSpecialistVars in ../index.d.ts
const { data } = await InsertSpecialist(dataConnect, insertSpecialistVars);

// Operation UpdateSpecialist:  For variables, look at type UpdateSpecialistVars in ../index.d.ts
const { data } = await UpdateSpecialist(dataConnect, updateSpecialistVars);

// Operation DeleteSpecialist:  For variables, look at type DeleteSpecialistVars in ../index.d.ts
const { data } = await DeleteSpecialist(dataConnect, deleteSpecialistVars);

// Operation GetSpecialist:  For variables, look at type GetSpecialistVars in ../index.d.ts
const { data } = await GetSpecialist(dataConnect, getSpecialistVars);

// Operation ListSpecialists: 
const { data } = await ListSpecialists(dataConnect);


```