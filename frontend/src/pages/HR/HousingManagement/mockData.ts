import { Employee } from "../EmployeeProfiles/mockData"

// House and facility types
export type Landlord = {
  name: string
  phone: string
  email: string
}

export type Facility = {
  beds: number
  mattresses: number
  tables: number
  chairs: number
}

export type Car = {
  make: string
  model: string
  color: string
  licensePlate: string
}

export type Resident = {
  id: string
  employeeId: string
  name: string
  phone: string
  email: string
  car?: Car
}

export type House = {
  id: string
  address: {
    street: string
    city: string
    state: string
    zip: string
  }
  landlord: Landlord
  facility: Facility
  residents: Resident[]
}

// Mock data
export const mockHouses: House[] = [
  {
    id: "house1",
    address: {
      street: "123 Main Street",
      city: "Seattle",
      state: "WA",
      zip: "98101"
    },
    landlord: {
      name: "James Wilson",
      phone: "555-123-4567",
      email: "james.wilson@example.com"
    },
    facility: {
      beds: 4,
      mattresses: 4,
      tables: 2,
      chairs: 8
    },
    residents: [
      {
        id: "resident1",
        employeeId: "emp001",
        name: "John Doe",
        phone: "555-111-2222",
        email: "john.doe@example.com",
        car: {
          make: "Toyota",
          model: "Camry",
          color: "Blue",
          licensePlate: "ABC123"
        }
      },
      {
        id: "resident2",
        employeeId: "emp002",
        name: "Jane Smith",
        phone: "555-222-3333",
        email: "jane.smith@example.com"
      }
    ]
  },
  {
    id: "house2",
    address: {
      street: "456 Oak Avenue",
      city: "Boston",
      state: "MA",
      zip: "02108"
    },
    landlord: {
      name: "Sarah Johnson",
      phone: "555-987-6543",
      email: "sarah.johnson@example.com"
    },
    facility: {
      beds: 3,
      mattresses: 3,
      tables: 1,
      chairs: 6
    },
    residents: [
      {
        id: "resident3",
        employeeId: "emp003",
        name: "Michael Johnson",
        phone: "555-333-4444",
        email: "michael.johnson@example.com",
        car: {
          make: "Honda",
          model: "Civic",
          color: "Silver",
          licensePlate: "XYZ789"
        }
      }
    ]
  },
  {
    id: "house3",
    address: {
      street: "789 Pine Street",
      city: "San Francisco",
      state: "CA",
      zip: "94102"
    },
    landlord: {
      name: "Robert Brown",
      phone: "555-456-7890",
      email: "robert.brown@example.com"
    },
    facility: {
      beds: 5,
      mattresses: 5,
      tables: 2,
      chairs: 10
    },
    residents: [
      {
        id: "resident4",
        employeeId: "emp004",
        name: "Emily Brown",
        phone: "555-444-5555",
        email: "emily.brown@example.com"
      },
      {
        id: "resident5",
        employeeId: "emp005",
        name: "William Davis",
        phone: "555-555-6666",
        email: "william.davis@example.com",
        car: {
          make: "Ford",
          model: "Focus",
          color: "Red",
          licensePlate: "DEF456"
        }
      }
    ]
  }
]
