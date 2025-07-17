import { useState, useEffect } from "react"
import { useParams, Link } from "react-router"
import { ArrowLeft } from "lucide-react"
import { Employee } from "./mockData"
import { Formik, Form, Field, ErrorMessage, FieldArray } from "formik"
import SectionCard from "../../../components/SectionCard"
import api from "../../../api"
import { useAppSelector } from "../../../app/hooks"
import { selectUser } from "../../../features/auth/authSlice"

const EmployeeDetail = () => {
  const user = useAppSelector(selectUser)
  const { id } = useParams<{ id: string }>()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)

  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      setLoading(true)
      try {
        const response = await api.get(`/hr/employees/${id}`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        })
        setEmployee(response.data)
        setError(null)
      } catch (err: any) {
        console.error("Error fetching employee details:", err)
        setError(
          err.response?.data?.error ||
            `Error loading employee data: ${err.message}`,
        )
      } finally {
        setLoading(false)
      }
    }

    fetchEmployeeDetails()
  }, [id])

  // Helper for labelled inputs
  const L = ({
    name,
    label,
    type = "text",
  }: {
    name: string
    label: string
    type?: string
  }) => (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium text-slate-600">
        {label}
      </label>
      <Field
        id={name}
        name={name}
        type={type}
        className="rounded border border-slate-300 p-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
      />
      <ErrorMessage
        name={name}
        component="p"
        className="text-sm text-red-600"
      />
    </div>
  )

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
        <Link
          to="/hr/employee-profiles"
          className="text-indigo-600 hover:text-indigo-900"
        >
          <ArrowLeft className="inline h-4 w-4 mr-1" />
          Back to Employee Profiles
        </Link>
      </div>
    )
  }

  if (!employee) {
    return null
  }

  // Handle form submissions with API calls
  const updateEmployeeData = async (sectionName: string, values: any) => {
    try {
      const token = localStorage.getItem("token")
      await api.put(`/hr/employees/${id}/${sectionName}`, values, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      // Update the local state with the new values
      setEmployee({ ...employee, ...values })
      return true
    } catch (err) {
      console.error(`Error updating ${sectionName}:`, err)
      return false
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl space-y-8 p-6">
      <div className="mb-6">
        <Link
          to="/hr/employee-profiles"
          className="text-indigo-600 hover:text-indigo-900"
        >
          <ArrowLeft className="inline h-4 w-4 mr-1" />
          Back to Employee Profiles
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {employee.firstName}{" "}
            {employee.middleName && `${employee.middleName} `}
            {employee.lastName}
            {employee.preferredName &&
              employee.preferredName !== employee.firstName && (
                <span className="text-gray-500 ml-2 text-xl">
                  ({employee.preferredName})
                </span>
              )}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Employee Details
          </p>
        </div>
      </div>

      {/* Name & Identity */}
      <SectionCard
        title="Name & Identity"
        editable={true}
        submitted={true}
        initialValues={employee}
        onSubmit={async values => {
          const success = await updateEmployeeData("identity", values)
          if (success) {
            alert("Employee information updated successfully!")
          } else {
            alert("Failed to update employee information. Please try again.")
          }
        }}
        display={v => (
          <ul className="grid grid-cols-2 gap-x-8 gap-y-1 text-slate-700">
            <li>
              <span className="font-medium">Legal name:</span> {v.firstName}{" "}
              {v.middleName} {v.lastName}
            </li>
            <li>
              <span className="font-medium">Preferred name:</span>{" "}
              {v.preferredName}
            </li>
            <li>
              <span className="font-medium">SSN:</span> {v.ssn}
            </li>
            <li>
              <span className="font-medium">Date of birth:</span> {v.dob}
            </li>
            <li>
              <span className="font-medium">Gender:</span>{" "}
              {v.gender === "male"
                ? "Male"
                : v.gender === "female"
                  ? "Female"
                  : v.gender}
            </li>
            <li>
              <span className="font-medium">Email:</span> {v.email}
            </li>
          </ul>
        )}
      >
        <div className="grid grid-cols-2 gap-4">
          <L name="firstName" label="First name" />
          <L name="middleName" label="Middle name" />
          <L name="lastName" label="Last name" />
          <L name="preferredName" label="Preferred name" />
          <L name="ssn" label="SSN" />
          <L name="dob" label="Date of birth" type="date" />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-600">Gender</label>
            <Field
              as="select"
              name="gender"
              className="rounded border border-slate-300 p-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </Field>
          </div>
          <L name="email" label="Email" type="email" />
        </div>
      </SectionCard>

      {/* Contact Information */}
      <SectionCard
        title="Contact Information"
        editable={true}
        submitted={true}
        initialValues={employee}
        onSubmit={async values => {
          const success = await updateEmployeeData("contact", values)
          if (success) {
            alert("Contact information updated successfully!")
          } else {
            alert("Failed to update contact information. Please try again.")
          }
        }}
        display={v => (
          <ul className="grid grid-cols-2 gap-x-8 gap-y-1 text-slate-700">
            <li>
              <span className="font-medium">Cell Phone:</span> {v.cellPhone}
            </li>
            <li>
              <span className="font-medium">Work Phone:</span>{" "}
              {v.workPhone || "Not provided"}
            </li>
          </ul>
        )}
      >
        <div className="grid grid-cols-2 gap-4">
          <L name="cellPhone" label="Cell Phone" />
          <L name="workPhone" label="Work Phone" />
        </div>
      </SectionCard>

      {/* Address */}
      <SectionCard
        title="Address"
        editable={true}
        submitted={true}
        initialValues={employee}
        onSubmit={async values => {
          const success = await updateEmployeeData("address", values)
          if (success) {
            alert("Address updated successfully!")
          } else {
            alert("Failed to update address. Please try again.")
          }
        }}
        display={v => (
          <ul className="grid grid-cols-2 gap-x-8 gap-y-1 text-slate-700">
            <li>
              <span className="font-medium">Street Address:</span> {v.building}{" "}
              {v.street}
            </li>
            <li>
              <span className="font-medium">City, State, ZIP:</span> {v.city},{" "}
              {v.state} {v.zip}
            </li>
          </ul>
        )}
      >
        <div className="grid grid-cols-2 gap-4">
          <L name="building" label="Building/Apt #" />
          <L name="street" label="Street" />
          <L name="city" label="City" />
          <L name="state" label="State" />
          <L name="zip" label="ZIP Code" />
        </div>
      </SectionCard>

      {/* Work Authorization */}
      <SectionCard
        title="Work Authorization"
        editable={true}
        submitted={true}
        initialValues={employee}
        onSubmit={async values => {
          const success = await updateEmployeeData("workAuth", values)
          if (success) {
            alert("Work authorization updated successfully!")
          } else {
            alert("Failed to update work authorization. Please try again.")
          }
        }}
        display={v => (
          <ul className="grid grid-cols-2 gap-x-8 gap-y-1 text-slate-700">
            <li>
              <span className="font-medium">Visa Title:</span> {v.visaTitle}
            </li>
            <li>
              <span className="font-medium">Start Date:</span> {v.visaStart}
            </li>
            <li>
              <span className="font-medium">End Date:</span> {v.visaEnd}
            </li>
          </ul>
        )}
      >
        <div className="grid grid-cols-2 gap-4">
          <L name="visaTitle" label="Visa Title" />
          <div></div>
          <L name="visaStart" label="Start Date" type="date" />
          <L name="visaEnd" label="End Date" type="date" />
        </div>
      </SectionCard>

      {/* Emergency Contacts */}
      <SectionCard
        title="Emergency Contacts"
        editable={true}
        submitted={true}
        initialValues={employee}
        onSubmit={async values => {
          const success = await updateEmployeeData("emergency", values)
          if (success) {
            alert("Emergency contacts updated successfully!")
          } else {
            alert("Failed to update emergency contacts. Please try again.")
          }
        }}
        display={v => (
          <div>
            {v.emergency.length === 0 ? (
              <p className="text-sm text-gray-500">
                No emergency contacts provided
              </p>
            ) : (
              v.emergency.map((contact, index) => (
                <div key={index} className="mb-4 border-b pb-4 last:border-b-0">
                  <p className="font-medium">Contact #{index + 1}</p>
                  <ul className="grid grid-cols-2 gap-x-8 gap-y-1 text-slate-700">
                    <li>
                      <span className="font-medium">Name:</span>{" "}
                      {contact.firstName} {contact.middleName}{" "}
                      {contact.lastName}
                    </li>
                    <li>
                      <span className="font-medium">Relationship:</span>{" "}
                      {contact.relationship}
                    </li>
                    <li>
                      <span className="font-medium">Phone:</span>{" "}
                      {contact.phone}
                    </li>
                    <li>
                      <span className="font-medium">Email:</span>{" "}
                      {contact.email}
                    </li>
                  </ul>
                </div>
              ))
            )}
          </div>
        )}
      >
        <FieldArray name="emergency">
          {arrayHelpers => {
            const { form } = arrayHelpers
            const contacts = form.values.emergency

            return (
              <div className="space-y-6">
                {contacts.map((_: any, idx: number) => (
                  <div
                    key={idx}
                    className="grid grid-cols-3 gap-4 border-b pb-4"
                  >
                    <L name={`emergency.${idx}.firstName`} label="First name" />
                    <L name={`emergency.${idx}.middleName`} label="Middle" />
                    <L name={`emergency.${idx}.lastName`} label="Last name" />
                    <L name={`emergency.${idx}.phone`} label="Phone" />
                    <L name={`emergency.${idx}.email`} label="Email" />
                    <L
                      name={`emergency.${idx}.relationship`}
                      label="Relationship"
                    />

                    <button
                      type="button"
                      onClick={() => arrayHelpers.remove(idx)}
                      className="col-span-3 rounded border border-red-300 p-2 text-sm text-red-600"
                    >
                      Remove contact
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    arrayHelpers.push({
                      firstName: "",
                      middleName: "",
                      lastName: "",
                      phone: "",
                      email: "",
                      relationship: "",
                    })
                  }}
                  className="rounded bg-indigo-50 px-4 py-1 text-sm text-indigo-700"
                >
                  + Add another contact
                </button>
              </div>
            )
          }}
        </FieldArray>
      </SectionCard>

      {/* Documents */}
      <SectionCard
        title="Documents"
        editable={true}
        submitted={true}
        initialValues={employee}
        onSubmit={async values => {
          const success = await updateEmployeeData("documents", values)
          if (success) {
            alert("Documents updated successfully!")
          } else {
            alert("Failed to update documents. Please try again.")
          }
        }}
        display={v => (
          <ul className="space-y-1 text-slate-700">
            {v.files.length === 0 ? (
              <p className="text-sm text-gray-500">No documents uploaded</p>
            ) : (
              v.files.map((file, index) => (
                <li key={index}>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline"
                  >
                    {file.name}
                  </a>
                </li>
              ))
            )}
          </ul>
        )}
      >
        <FieldArray name="files">
          {arrayHelpers => {
            const { form } = arrayHelpers
            const files = form.values.files

            return (
              <div className="space-y-4">
                {/* upload */}
                <input
                  type="file"
                  onChange={e => {
                    const file = e.currentTarget.files?.[0]
                    if (file) {
                      arrayHelpers.push({
                        name: file.name,
                        url: URL.createObjectURL(file), // In a real app, this would upload to S3
                      })
                    }
                  }}
                />

                {/* list */}
                <ul className="space-y-1">
                  {files.map(
                    (f: { name: string; url: string }, idx: number) => (
                      <li
                        key={idx}
                        className="flex items-center justify-between rounded border p-2"
                      >
                        {f.name}
                        <button
                          type="button"
                          onClick={() => arrayHelpers.remove(idx)}
                          className="text-sm text-red-600"
                        >
                          Delete
                        </button>
                      </li>
                    ),
                  )}
                </ul>
              </div>
            )
          }}
        </FieldArray>
      </SectionCard>
    </main>
  )
}

export default EmployeeDetail
