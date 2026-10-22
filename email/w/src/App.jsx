import { useEffect, useState } from "react";
import "./App.css";

async function readApiResponse(response) {
  if (response.status === 502) {
    throw new Error(
      "Patient API is not running. Stop the old development server and restart the app with npm run dev.",
    );
  }

  const responseText = await response.text();
  let result;

  try {
    result = responseText ? JSON.parse(responseText) : {};
  } catch {
    throw new Error(
      `Server returned an unexpected response (HTTP ${response.status}). Make sure the API server is running.`,
    );
  }

  if (!response.ok) {
    throw new Error(result.error || `Request failed (HTTP ${response.status}).`);
  }

  return result;
}

function getErrorMessage(error) {
  if (error instanceof TypeError) {
    return "Could not connect to the server. Start the app with npm run dev and try again.";
  }

  return error.message || "The request could not be completed.";
}

function App() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState(null);
  const [notice, setNotice] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    source: "Website",
    message: "",
  });

  useEffect(() => {
    async function loadPatients() {
      try {
        const response = await fetch("/api/patients");
        const result = await readApiResponse(response);
        setPatients(result);
      } catch (error) {
        setNotice(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    }

    loadPatients();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setNotice("");

    try {
      const isEditing = editingPatientId !== null;
      const response = await fetch(
        isEditing ? `/api/patients/${editingPatientId}` : "/api/patients",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        },
      );
      const result = await readApiResponse(response);

      if (isEditing) {
        setPatients((oldPatients) =>
          oldPatients.map((patient) =>
            patient.id === editingPatientId ? result.patient : patient,
          ),
        );
        setNotice("Patient message updated.");
      } else {
        setPatients((oldPatients) => [result.patient, ...oldPatients]);
        setNotice(
          result.notificationSent
            ? "Message saved and email notification sent."
            : "Message saved, but email notification was not sent. Configure SMTP settings on the server.",
        );
      }

      setEditingPatientId(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        source: "Website",
        message: "",
      });
    } catch (error) {
      setNotice(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
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
    setEditingPatientId(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      source: "Website",
      message: "",
    });
    setNotice("Edit cancelled.");
  };

  const handleDelete = async (id) => {
    setNotice("");
    try {
      const response = await fetch(`/api/patients/${id}`, { method: "DELETE" });
      if (!response.ok) {
        await readApiResponse(response);
      }
      setPatients((oldPatients) =>
        oldPatients.filter((patient) => patient.id !== id)
      );
    } catch (error) {
      setNotice(getErrorMessage(error));
    }
  };

  return (
    <div className="app">

      {/* Header */}
      <header className="top-header">
        <div className="logo-section">
          <img className="logo" src="/logo.jpg" alt="Multiple Hostital logo" />

          <div>
            <h1> Multiple Hostital</h1>
            <p>Patient Communication Management</p>
          </div>
        </div>

        <div className="admin-badge">
          Admin Panel
        </div>
      </header>


      {/* Main */}
      <main className="main-container">

        {/* Page Heading */}
        <div className="page-heading">
          <div>
            <h2>Patient Messages</h2>
            <p>
              Manage patient requests received from website, email and WhatsApp.
            </p>
          </div>

          <div className="message-count">
            <span>{patients.length}</span>
            <small>Total Messages</small>
          </div>
        </div>


        {/* Form */}
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
                <label>Patient Name *</label>

                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter patient name"
                />
              </div>


              <div className="input-group">
                <label>Email Address *</label>

                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="patient@example.com"
                />
              </div>


              <div className="input-group">
                <label>Phone Number *</label>

                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                />
              </div>


              <div className="input-group">
                <label>Message Source</label>

                <select
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
              <label>Patient Message *</label>

              <textarea
                name="message"
                required
                value={formData.message}
                onChange={handleChange}
                placeholder="Write patient message here..."
                rows="5"
              ></textarea>
            </div>


            <div className="form-footer">

              <p aria-live="polite">
                {notice || "Please verify the patient information before submitting."}
              </p>

              <div className="form-actions">
                {editingPatientId && (
                  <button
                    className="cancel-button"
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                )}
                <button type="submit" disabled={saving}>
                  {saving
                    ? editingPatientId
                      ? "Updating..."
                      : "Submitting..."
                    : editingPatientId
                      ? "Update Message"
                      : "Submit Message"}
                </button>
              </div>

            </div>

          </form>

        </section>


        {/* Messages */}
        <section className="card">

          <div className="messages-header">

            <div>
              <h3>Received Patient Messages</h3>
              <p>All messages received from patients</p>
            </div>

            <div className="received-number">
              {patients.length}
            </div>

          </div>


          {loading ? (
            <div className="empty-state">
              <p>Loading patient messages...</p>
            </div>
          ) : patients.length === 0 ? (

            <div className="empty-state">

              <div className="empty-icon">
                ✉
              </div>

              <h3>No messages yet</h3>

              <p>
                Patient messages will appear here after submission.
              </p>

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
                    <th>Date & Time</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>

                  {patients.map((patient, index) => (

                    <tr key={patient.id}>

                      <td>
                        <span className="number">
                          {index + 1}
                        </span>
                      </td>


                      <td>
                        <div className="patient-name">
                          <div className="avatar">
                            {patient.name.charAt(0).toUpperCase()}
                          </div>

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
                        <span
                          className={`source ${patient.source.toLowerCase()}`}
                        >
                          {patient.source}
                        </span>
                      </td>


                      <td>
                        <div className="table-message">
                          {patient.message}
                        </div>
                      </td>


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


      {/* Footer */}
      <footer>
        <p> R.V HealthCare Portal | Patient Communication System</p>
      </footer>

    </div>
  );
}

export default App;