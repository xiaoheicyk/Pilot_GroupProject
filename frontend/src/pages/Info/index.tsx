import SectionCard from "../../components/SectionCard"
import { Field, FieldArray, ErrorMessage } from "formik"

const Info = () => {
  /* In real life fetch this from Redux / API. */
  const personalInfo = {
    /* Name */
    firstName: "John",
    middleName: "A.",
    lastName: "Doe",
    preferredName: "Johnny",
    email: "john@example.com",
    ssn: "123456789",
    dob: "1995-01-01",
    gender: "male",
    /* Address */
    building: "123",
    street: "Main St",
    city: "Seattle",
    state: "WA",
    zip: "98101",
    cellPhone: "555-123-4567",
    workPhone: "",
    visaTitle: "F-1 OPT",
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
      /* example */
      { name: "Driver-License.pdf", url: "/docs/driver-license.pdf" },
      { name: "OPT-Receipt.pdf", url: "/docs/opt-receipt.pdf" },
    ],
  }

  /* Helper for labelled inputs */
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

  return (
    <main className="mx-auto w-full max-w-4xl space-y-8 p-6">
      {/* =====  Name  ===== */}
      <SectionCard
        title="Name & Identity"
        initialValues={personalInfo}
        onSubmit={v => {
          console.log("save name", v)
        }}
        display={v => (
          <ul className="grid grid-cols-2 gap-x-8 gap-y-1 text-slate-700">
            <li>
              <span className="font-medium">Legal name:</span> {v.firstName}{" "}
              {v.middleName} {v.lastName}
            </li>
            <li>
              <span className="font-medium">Preferred name:</span>{" "}
              {v.preferredName || "—"}
            </li>
            <li>
              <span className="font-medium">Email:</span> {v.email}
            </li>
            <li>
              <span className="font-medium">DOB:</span> {v.dob}
            </li>
            <li>
              <span className="font-medium">SSN:</span> •••-••-••••
            </li>
            <li>
              <span className="font-medium">Gender:</span> {v.gender}
            </li>
          </ul>
        )}
      >
        <div className="grid grid-cols-2 gap-4">
          <L name="firstName" label="First name" />
          <L name="middleName" label="Middle name" />
          <L name="lastName" label="Last name" />
          <L name="preferredName" label="Preferred name" />
          <L name="email" label="Email" type="email" />
          <L name="dob" label="Date of birth" type="date" />
          <L name="ssn" label="SSN" />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-600">Gender</label>
            <Field
              as="select"
              name="gender"
              className="rounded border border-slate-300 p-2"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="n/a">Prefer not to say</option>
            </Field>
            <ErrorMessage
              name="gender"
              component="p"
              className="text-sm text-red-600"
            />
          </div>
        </div>
      </SectionCard>

      {/* =====  Address  ===== */}
      <SectionCard
        title="Address"
        initialValues={personalInfo}
        onSubmit={v => {
          console.log("save address", v)
        }}
        display={v => (
          <p className="text-slate-700">
            {v.building} {v.street}, {v.city}, {v.state} {v.zip}
          </p>
        )}
      >
        <div className="grid grid-cols-2 gap-4">
          <L name="building" label="Building/Apt #" />
          <L name="street" label="Street" />
          <L name="city" label="City" />
          <L name="state" label="State" />
          <L name="zip" label="ZIP" />
        </div>
      </SectionCard>

      {/* ===== Contact Info ===== */}
      <SectionCard
        title="Contact Info"
        initialValues={personalInfo}
        onSubmit={v => {
          console.log("save contact", v)
        }}
        display={v => (
          <ul className="text-slate-700">
            <li>
              <span className="font-medium">Cell:&nbsp;</span>
              {v.cellPhone}
            </li>
            <li>
              <span className="font-medium">Work:&nbsp;</span>
              {v.workPhone || "—"}
            </li>
          </ul>
        )}
      >
        <div className="grid grid-cols-2 gap-4">
          <L name="cellPhone" label="Cell phone" />
          <L name="workPhone" label="Work phone" />
        </div>
      </SectionCard>

      {/* ===== Employment ===== */}
      <SectionCard
        title="Employment"
        initialValues={personalInfo}
        onSubmit={v => {
          console.log("save employment", v)
        }}
        display={v => (
          <ul className="text-slate-700">
            <li>
              <span className="font-medium">Visa:&nbsp;</span>
              {v.visaTitle}
            </li>
            <li>
              <span className="font-medium">Start:&nbsp;</span>
              {v.visaStart}
            </li>
            <li>
              <span className="font-medium">End:&nbsp;</span>
              {v.visaEnd}
            </li>
          </ul>
        )}
      >
        <div className="grid grid-cols-2 gap-4">
          <L name="visaTitle" label="Visa title" />
          <L name="visaStart" label="Start date" type="date" />
          <L name="visaEnd" label="End date" type="date" />
        </div>
      </SectionCard>

      {/* ===== Emergency Contact ===== */}
      <SectionCard
        title="Emergency Contact(s)"
        initialValues={personalInfo}
        onSubmit={v => {
          console.log("save emergency", v)
        }}
        display={v => (
          <ul className="space-y-2 text-slate-700">
            {v.emergency.map((c, idx) => (
              <li key={idx}>
                <span className="font-medium">
                  {c.firstName} {c.lastName}:
                </span>{" "}
                {c.phone} · {c.email} · {c.relationship}
              </li>
            ))}
          </ul>
        )}
      >
        <FieldArray name="emergency">
          {arrayHelpers => {
            const { form } = arrayHelpers
            const contacts = form.values.emergency

            return (
              <div className="space-y-6">
                {contacts.map((_: any, idx: number) => (
                  <div key={idx} className="grid grid-cols-3 gap-4">
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

      {/* ===== Documents ===== */}
      <SectionCard
        title="Documents"
        initialValues={personalInfo}
        onSubmit={v => {
          console.log("save docs", v)
        }}
        display={v => (
          <ul className="space-y-1 text-slate-700">
            {v.files.map((f, idx) => (
              <li key={idx}>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline"
                >
                  {f.name}
                </a>
              </li>
            ))}
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
                        url: URL.createObjectURL(file), // TODO: replace with your S3 URL
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

export default Info
