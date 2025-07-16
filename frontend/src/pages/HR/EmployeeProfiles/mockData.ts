// 员工数据类型定义
export type Employee = {
  id: string
  firstName: string
  middleName: string
  lastName: string
  preferredName: string
  ssn: string
  visaTitle: string
  cellPhone: string
  email: string
  dob: string
  gender: string
  building: string
  street: string
  city: string
  state: string
  zip: string
  workPhone: string
  visaStart: string
  visaEnd: string
  emergency: {
    firstName: string
    middleName: string
    lastName: string
    phone: string
    email: string
    relationship: string
  }[]
  files: {
    name: string
    url: string
  }[]
}

// 模拟员工数据
export const mockEmployees: Employee[] = [
  {
    id: "emp001",
    firstName: "John",
    middleName: "",
    lastName: "Doe",
    preferredName: "Johnny",
    ssn: "123-45-6789",
    visaTitle: "F-1 OPT",
    cellPhone: "555-123-4567",
    email: "john.doe@example.com",
    dob: "1995-01-01",
    gender: "male",
    building: "123",
    street: "Main St",
    city: "Seattle",
    state: "WA",
    zip: "98101",
    workPhone: "",
    visaStart: "2025-08-01",
    visaEnd: "2028-08-01",
    emergency: [
      {
        firstName: "Alice",
        middleName: "",
        lastName: "Smith",
        phone: "555-987-6543",
        email: "alice@example.com",
        relationship: "Sister",
      },
    ],
    files: [
      { name: "Driver-License.pdf", url: "/docs/driver-license.pdf" },
      { name: "OPT-Receipt.pdf", url: "/docs/opt-receipt.pdf" },
    ],
  },
  {
    id: "emp002",
    firstName: "Jane",
    middleName: "Marie",
    lastName: "Smith",
    preferredName: "Jane",
    ssn: "987-65-4321",
    visaTitle: "H-1B",
    cellPhone: "555-234-5678",
    email: "jane.smith@example.com",
    dob: "1992-05-15",
    gender: "female",
    building: "456",
    street: "Oak Avenue",
    city: "Boston",
    state: "MA",
    zip: "02108",
    workPhone: "555-876-5432",
    visaStart: "2024-01-15",
    visaEnd: "2027-01-14",
    emergency: [
      {
        firstName: "Robert",
        middleName: "",
        lastName: "Smith",
        phone: "555-345-6789",
        email: "robert@example.com",
        relationship: "Brother",
      },
    ],
    files: [
      { name: "Passport.pdf", url: "/docs/passport.pdf" },
      { name: "H1B-Approval.pdf", url: "/docs/h1b-approval.pdf" },
    ],
  },
  {
    id: "emp003",
    firstName: "Michael",
    middleName: "James",
    lastName: "Johnson",
    preferredName: "Mike",
    ssn: "456-78-9012",
    visaTitle: "Green Card",
    cellPhone: "555-345-6789",
    email: "michael.johnson@example.com",
    dob: "1988-09-23",
    gender: "male",
    building: "789",
    street: "Pine Street",
    city: "San Francisco",
    state: "CA",
    zip: "94102",
    workPhone: "555-765-4321",
    visaStart: "2023-03-10",
    visaEnd: "Permanent",
    emergency: [
      {
        firstName: "Sarah",
        middleName: "",
        lastName: "Johnson",
        phone: "555-456-7890",
        email: "sarah@example.com",
        relationship: "Spouse",
      },
    ],
    files: [
      { name: "Green-Card.pdf", url: "/docs/green-card.pdf" },
      { name: "SSN-Card.pdf", url: "/docs/ssn-card.pdf" },
    ],
  },
  {
    id: "emp004",
    firstName: "Emily",
    middleName: "Rose",
    lastName: "Brown",
    preferredName: "Em",
    ssn: "789-01-2345",
    visaTitle: "F-1 CPT",
    cellPhone: "555-456-7890",
    email: "emily.brown@example.com",
    dob: "1997-11-08",
    gender: "female",
    building: "101",
    street: "Cedar Road",
    city: "Chicago",
    state: "IL",
    zip: "60601",
    workPhone: "",
    visaStart: "2025-01-10",
    visaEnd: "2026-01-09",
    emergency: [
      {
        firstName: "David",
        middleName: "",
        lastName: "Brown",
        phone: "555-567-8901",
        email: "david@example.com",
        relationship: "Father",
      },
    ],
    files: [
      { name: "I-20.pdf", url: "/docs/i-20.pdf" },
      { name: "CPT-Authorization.pdf", url: "/docs/cpt-auth.pdf" },
    ],
  },
  {
    id: "emp005",
    firstName: "William",
    middleName: "Thomas",
    lastName: "Davis",
    preferredName: "Will",
    ssn: "234-56-7890",
    visaTitle: "TN Visa",
    cellPhone: "555-567-8901",
    email: "william.davis@example.com",
    dob: "1990-07-17",
    gender: "male",
    building: "202",
    street: "Maple Drive",
    city: "Austin",
    state: "TX",
    zip: "78701",
    workPhone: "555-654-3210",
    visaStart: "2024-06-20",
    visaEnd: "2027-06-19",
    emergency: [
      {
        firstName: "Jennifer",
        middleName: "",
        lastName: "Davis",
        phone: "555-678-9012",
        email: "jennifer@example.com",
        relationship: "Spouse",
      },
    ],
    files: [
      { name: "TN-Visa.pdf", url: "/docs/tn-visa.pdf" },
      { name: "Employment-Letter.pdf", url: "/docs/employment-letter.pdf" },
    ],
  },
];
