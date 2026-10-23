import { useState } from "react";
import Login from "./login.jsx";
import "./App.css";

const storageKey = "hospital-patient-messages";

function readStoredMessages() {
  try {
    const savedMessages = localStorage.getItem(storageKey);
    const patients = savedMessages ? JSON.parse(savedMessages) : [];
    if (!Array.isArray(patients)) {
      throw new Error("Saved patient messages are not in the expected format.");
    }

    return { patients, notice: "" };
  } catch (error) {
    console.error("Could not load locally saved patient messages:", error);
    return {
      patients: [],
      notice: "Saved messages could not be loaded from this browser.",
    };
  }
}

function PatientMessages({ email, onLogout }) {
  const [storedMessages] = useState(readStoredMessages);
  const [patients, setPatients] = useState(storedMessages.patients);
  const [editingPatientId, setEditingPatientId] = useState(null);
  const [notice, setNotice] = useState(storedMessages.notice);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    source: "Website",
    message: "",
  });

  const savePatients = (updatedPatients) => {
    setPatients(updatedPatients);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedPatients));
    } catch (error) {
      console.error("Could not save patient messages in this browser:", error);
      setNotice("Messages could not be saved in this browser. They will be lost when you leave this page.");
      return false;
    }
    return true;
  };

  const handleChange = (event) => {
    setFormData((currentFormData) => ({
      ...currentFormData,
      [event.target.name]: event.target.value,
    }));
  };

  const resetForm = () => {
    setEditingPatientId(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      source: "Website",
      message: "",
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const submittedAt = new Date();

    if (editingPatientId !== null) {
      const saved = savePatients(
        patients.map((patient) =>
          patient.id === editingPatientId
            ? { ...patient, ...formData }
            : patient,
        ),
      );
      if (saved) setNotice("Patient message updated in this browser.");
    } else {
      const saved = savePatients([
        {
          id: crypto.randomUUID(),
          ...formData,
          date: submittedAt.toLocaleDateString(),
          time: submittedAt.toLocaleTimeString(),
        },
        ...patients,
      ]);
      if (saved) setNotice("Message saved in this browser. It was not sent by email.");
    }

    resetForm();
  };

  const handleEdit = (patient) => {
    setEditingPatientId(patient.id);
    setFormData({
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      source: patient.source,
      message: patient.message,
    });
    setNotice(`Editing message from ${patient.name}.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    resetForm();
    setNotice("Edit cancelled.");
  };

  const handleDelete = (id) => {
    if (savePatients(patients.filter((patient) => patient.id !== id))) {
      setNotice("Message deleted from this browser.");
    }
  };

  return (
    <div className="app">
      <header className="top-header">
        <div className="logo-section">
          <img className="logo" src="/logo.jpg" alt="Multiple Hospital logo" />
          <div>
            <h1>Multiple Hospital</h1>
            <p>Patient Communication Management</p>
          </div>
        </div>
        <div className="logged-in-user">
          <span>{email}</span>
          <button className="admin-badge logout-button" type="button" onClick={onLogout}>
            Log out
          </button>
        </div>
      </header>

      <main className="main-container">
        <div className="page-heading">
          <div>
            <h2>Patient Messages</h2>
            <p>Manage patient requests received from website, email and WhatsApp.</p>
          </div>
          <div className="message-count">
            <span>{patients.length}</span>
            <small>Total Messages</small>
          </div>
        </div>

        <section className="card">
          <div className="card-title">
            <img className="title-icon" src="/logo.jpg" alt="" />
            <div>
              <h3>{editingPatientId ? "Update Patient Message" : "New Patient Message"}</h3>
              <p>
                {editingPatientId
                  ? "Update the patient information below"
                  : "Enter patient information below"}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="input-group">
                <label htmlFor="patient-name">Patient Name *</label>
                <input
                  id="patient-name"
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter patient name"
                />
              </div>
              <div className="input-group">
                <label htmlFor="patient-email">Email Address *</label>
                <input
                  id="patient-email"
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="patient@example.com"
                />
              </div>
              <div className="input-group">
                <label htmlFor="patient-phone">Phone Number *</label>
                <input
                  id="patient-phone"
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div className="input-group">
                <label htmlFor="patient-source">Message Source</label>
                <select
                  id="patient-source"
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                >
                  <option value="Website">Website</option>
                  <option value="Email">Email</option>
                  <option value="WhatsApp">WhatsApp</option>
                </select>
              </div>
            </div>

            <div className="input-group full-width">
              <label htmlFor="patient-message">Patient Message *</label>
              <textarea
                id="patient-message"
                name="message"
                required
                value={formData.message}
                onChange={handleChange}
                placeholder="Write patient message here..."
                rows="5"
              />
            </div>

            <div className="form-footer">
              <p aria-live="polite">
                {notice || "Messages are stored only in this browser."}
              </p>
              <div className="form-actions">
                {editingPatientId && (
                  <button
                    className="cancel-button"
                    type="button"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </button>
                )}
                <button type="submit">
                  {editingPatientId ? "Update Message" : "Submit Message"}
                </button>
              </div>
            </div>
          </form>
        </section>

        <section className="card">
          <div className="messages-header">
            <div>
              <h3>Received Patient Messages</h3>
              <p>Messages saved in this browser</p>
            </div>
            <div className="received-number">{patients.length}</div>
          </div>

          {patients.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon" aria-hidden="true">✉</div>
              <h3>No messages yet</h3>
              <p>Patient messages will appear here after submission.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Patient</th>
                    <th>Contact</th>
                    <th>Source</th>
                    <th>Message</th>
                    <th>Date &amp; Time</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient, index) => (
                    <tr key={patient.id}>
                      <td><span className="number">{index + 1}</span></td>
                      <td>
                        <div className="patient-name">
                          <div className="avatar">{patient.name.charAt(0).toUpperCase()}</div>
                          <strong>{patient.name}</strong>
                        </div>
                      </td>
                      <td>
                        <div className="contact-info">
                          <span>{patient.email}</span>
                          <span>{patient.phone}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`source ${patient.source.toLowerCase()}`}>
                          {patient.source}
                        </span>
                      </td>
                      <td><div className="table-message">{patient.message}</div></td>
                      <td>
                        <div className="date-time">
                          <strong>{patient.date}</strong>
                          <span>{patient.time}</span>
                        </div>
                      </td>
                      <td>
                        <div className="message-actions">
                          <button
                            className="edit-button"
                            type="button"
                            onClick={() => handleEdit(patient)}
                          >
                            Edit
                          </button>
                          <button
                            className="delete-button"
                            type="button"
                            onClick={() => handleDelete(patient.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      <footer>
        <p>R.V HealthCare Portal | Patient Communication System</p>
      </footer>
    </div>
  );
}

function App() {
  const [loginEmail, setLoginEmail] = useState("");

  if (!loginEmail) {
    return <Login onAuthenticated={setLoginEmail} />;
  }

  return <PatientMessages email={loginEmail} onLogout={() => setLoginEmail("")} />;
}

export default App;
