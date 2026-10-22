import "dotenv/config";
import express from "express";
import mysql from "mysql2/promise";
import nodemailer from "nodemailer";

const app = express();
const port = Number(process.env.PORT || 3000);
const databaseName = process.env.DB_NAME || "email";
const tableName = "nova_Hospetal";

if (!/^[a-zA-Z0-9_]+$/.test(databaseName)) {
  throw new Error("DB_NAME may only contain letters, numbers, and underscores.");
}

const databaseOptions = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
};

const pool = mysql.createPool({
  ...databaseOptions,
  database: databaseName,
  waitForConnections: true,
  connectionLimit: 10,
});

const emailConfigured = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
const mailer = emailConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT || 587) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

app.use(express.json({ limit: "20kb" }));
app.use((error, _request, response, next) => {
  if (error instanceof SyntaxError && "body" in error) {
    response.status(400).json({ error: "Invalid JSON in request body." });
    return;
  }

  next(error);
});

function toPatient(row) {
  const submittedAt = new Date(row.created_at);

  return {
    id: Number(row.id),
    name: row.name,
    email: row.email,
    phone: row.phone,
    source: row.source,
    message: row.message,
    date: submittedAt.toLocaleDateString(),
    time: submittedAt.toLocaleTimeString(),
  };
}

app.get("/api/patients", async (_request, response) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, email, phone, source, message, created_at
       FROM \`${tableName}\`
       ORDER BY created_at DESC, id DESC`,
    );
    response.json(rows.map(toPatient));
  } catch (error) {
    console.error("Failed to retrieve patient messages:", error);
    response.status(500).json({ error: "Could not load patient messages." });
  }
});

app.post("/api/patients", async (request, response) => {
  const { name, email, phone, source, message } = request.body ?? {};
  const patient = {
    name: typeof name === "string" ? name.trim() : "",
    email: typeof email === "string" ? email.trim() : "",
    phone: typeof phone === "string" ? phone.trim() : "",
    source: typeof source === "string" ? source.trim() : "Website",
    message: typeof message === "string" ? message.trim() : "",
  };

  if (!patient.name || !patient.email || !patient.phone || !patient.message) {
    response.status(400).json({ error: "Please fill all required fields." });
    return;
  }

  if (
    patient.name.length > 150 ||
    patient.email.length > 254 ||
    patient.phone.length > 50 ||
    patient.source.length > 50 ||
    patient.message.length > 5000
  ) {
    response.status(400).json({ error: "One or more fields are too long." });
    return;
  }

  if (!["Website", "Email", "WhatsApp"].includes(patient.source)) {
    response.status(400).json({ error: "Invalid message source." });
    return;
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO \`${tableName}\` (name, email, phone, source, message)
       VALUES (?, ?, ?, ?, ?)`,
      [
        patient.name,
        patient.email,
        patient.phone,
        patient.source,
        patient.message,
      ],
    );

    const [rows] = await pool.execute(
      `SELECT id, name, email, phone, source, message, created_at
       FROM \`${tableName}\`
       WHERE id = ?`,
      [result.insertId],
    );
    const savedPatient = toPatient(rows[0]);
    let notificationSent = false;

    if (mailer) {
      try {
        await mailer.sendMail({
          from: process.env.SMTP_USER,
          to: process.env.NOTIFICATION_EMAIL || "ashokrajpoot129@gmail.com",
          subject: `New patient message from ${savedPatient.name}`,
          text: [
            `Patient name: ${savedPatient.name}`,
            `Phone number: ${savedPatient.phone}`,
            `Email: ${savedPatient.email}`,
            `Message: ${savedPatient.message}`,
          ].join("\n"),
        });
        notificationSent = true;
      } catch (error) {
        console.error("Patient message saved, but email notification failed:", error);
      }
    }

    response.status(201).json({
      patient: savedPatient,
      notificationSent,
    });
  } catch (error) {
    console.error("Failed to save patient message:", error);
    response.status(500).json({ error: "Could not save the patient message." });
  }
});

app.put("/api/patients/:id", async (request, response) => {
  const id = Number(request.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    response.status(400).json({ error: "Invalid patient message ID." });
    return;
  }

  const { name, email, phone, source, message } = request.body ?? {};
  const patient = {
    name: typeof name === "string" ? name.trim() : "",
    email: typeof email === "string" ? email.trim() : "",
    phone: typeof phone === "string" ? phone.trim() : "",
    source: typeof source === "string" ? source.trim() : "",
    message: typeof message === "string" ? message.trim() : "",
  };

  if (!patient.name || !patient.email || !patient.phone || !patient.message) {
    response.status(400).json({ error: "Please fill all required fields." });
    return;
  }

  if (
    patient.name.length > 150 ||
    patient.email.length > 254 ||
    patient.phone.length > 50 ||
    patient.source.length > 50 ||
    patient.message.length > 5000
  ) {
    response.status(400).json({ error: "One or more fields are too long." });
    return;
  }

  if (!["Website", "Email", "WhatsApp"].includes(patient.source)) {
    response.status(400).json({ error: "Invalid message source." });
    return;
  }

  try {
    await pool.execute(
      `UPDATE \`${tableName}\`
       SET name = ?, email = ?, phone = ?, source = ?, message = ?
       WHERE id = ?`,
      [
        patient.name,
        patient.email,
        patient.phone,
        patient.source,
        patient.message,
        id,
      ],
    );

    const [rows] = await pool.execute(
      `SELECT id, name, email, phone, source, message, created_at
       FROM \`${tableName}\`
       WHERE id = ?`,
      [id],
    );
    if (rows.length === 0) {
      response.status(404).json({ error: "Patient message was not found." });
      return;
    }

    response.json({ patient: toPatient(rows[0]) });
  } catch (error) {
    console.error("Failed to update patient message:", error);
    response.status(500).json({ error: "Could not update the patient message." });
  }
});

app.delete("/api/patients/:id", async (request, response) => {
  const id = Number(request.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    response.status(400).json({ error: "Invalid patient message ID." });
    return;
  }

  try {
    const [result] = await pool.execute(
      `DELETE FROM \`${tableName}\` WHERE id = ?`,
      [id],
    );
    if (result.affectedRows === 0) {
      response.status(404).json({ error: "Patient message was not found." });
      return;
    }
    response.status(204).end();
  } catch (error) {
    console.error("Failed to delete patient message:", error);
    response.status(500).json({ error: "Could not delete the patient message." });
  }
});

async function startServer() {
  const connection = await mysql.createConnection(databaseOptions);
  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  await connection.end();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`${tableName}\` (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(254) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      source VARCHAR(50) NOT NULL DEFAULT 'Website',
      message TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  app.listen(port, () => {
    console.log(`Patient message API listening on http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error("Could not initialize MySQL or start the API server:", error);
  process.exitCode = 1;
});
