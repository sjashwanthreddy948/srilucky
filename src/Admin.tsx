import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ArrowLeft,
  LogOut,
  Calendar,
  LayoutDashboard,
  Settings as SettingsIcon,
  Phone,
  MessageCircle,
  Check,
  X,
  LoaderCircle,
} from "lucide-react";
import { api, type Settings } from "./api";
type Appointment = {
  id: number;
  customer_name: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  message: string;
  status: string;
  created_at: string;
};
type AdminData = { appointments: Appointment[]; settings: Settings };
export default function Admin() {
  const [data, setData] = useState<AdminData | null>(null);
  const [section, setSection] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("All");
  async function load() {
    try {
      setData(await api("/admin"));
    } catch (e) {
      const m = (e as Error).message;
      if (m !== "Please sign in.") setError(m);
      else setData(null);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    document.title = "Owner workspace | Sri Lucky";
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex,nofollow";
    document.head.appendChild(meta);
    load();
    return () => meta.remove();
  }, []);
  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api(
        "/auth/login",
        "POST",
        Object.fromEntries(new FormData(e.currentTarget)),
      );
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function status(a: Appointment, value: string) {
    setError("");
    try {
      await api("/admin/appointments/" + a.id, "PATCH", { status: value });
      await load();
      setNotice("Appointment updated.");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function settings(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(
        "/admin/settings",
        "PATCH",
        Object.fromEntries(new FormData(e.currentTarget)),
      );
      await load();
      setNotice("Store settings saved.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (loading)
    return <div className="loading-page">Opening your workspace…</div>;
  if (!data)
    return (
      <div className="owner-login">
        <a href="/" className="brand">
          <span>
            SRI LUCKY<span className="brand-mark">®</span>
          </span>
          <small>OWNER WORKSPACE</small>
        </a>
        <form onSubmit={login}>
          <span className="eyebrow">YOUR BUSINESS. IN FOCUS.</span>
          <h1>
            Welcome
            <br />
            back.
          </h1>
          <p>Sign in to manage appointments and store details.</p>
          <label>
            Email
            <input name="email" type="email" autoComplete="username" required />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}
          <button className="button" disabled={busy}>
            {busy ? "SIGNING IN…" : "SIGN IN"}
            <ArrowUpRight size={16} />
          </button>
          <small>
            No default credentials. Create your secure owner account using the
            README setup instructions.
          </small>
        </form>
        <a className="line-link" href="/">
          <ArrowLeft size={15} /> BACK TO THE WEBSITE
        </a>
      </div>
    );
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date());
  const all = data.appointments;
  const rows = all.filter((a) => filter === "All" || a.status === filter);
  const title =
    section === "dashboard"
      ? "In focus."
      : section === "appointments"
        ? "Appointments."
        : "Store settings.";
  const table = (items: Appointment[]) => (
    <div className="appointment-table">
      {items.length ? (
        <table>
          <thead>
            <tr>
              {[
                "Name",
                "Phone",
                "Service",
                "Date",
                "Time",
                "Status",
                "Actions",
              ].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id}>
                <td>
                  <strong>{a.customer_name}</strong>
                  {a.message && (
                    <details className="appointment-note">
                      <summary>Visit note</summary>
                      <p>{a.message}</p>
                    </details>
                  )}
                </td>
                <td>{a.phone}</td>
                <td>{a.service}</td>
                <td>{a.date}</td>
                <td>{a.time}</td>
                <td>
                  <select
                    value={a.status}
                    aria-label={"Status for " + a.customer_name}
                    onChange={(e) => status(a, e.target.value)}
                  >
                    {["Pending", "Confirmed", "Completed", "Cancelled"].map(
                      (s) => (
                        <option key={s}>{s}</option>
                      ),
                    )}
                  </select>
                </td>
                <td>
                  <a
                    href={"tel:" + a.phone}
                    aria-label={"Call " + a.customer_name}
                  >
                    <Phone size={16} />
                  </a>
                  <a
                    href={`https://wa.me/${a.phone.replace(/\D/g, "").replace(/^(\d{10})$/, "91$1")}?text=${encodeURIComponent(`Hi ${a.customer_name}, this is ${data.settings.business_name} about your ${a.service} request on ${a.date} at ${a.time}. Current status: ${a.status}.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={"WhatsApp " + a.customer_name}
                  >
                    <MessageCircle size={17} />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="admin-empty">
          <Calendar size={30} strokeWidth={1} />
          <h3>Nothing on the calendar yet.</h3>
          <p>
            {filter === "All"
              ? "New appointment requests will appear here."
              : "No " + filter.toLowerCase() + " appointments."}
          </p>
        </div>
      )}
    </div>
  );
  return (
    <div className="owner-shell">
      <aside>
        <a className="brand" href="/">
          <span>
            SRI LUCKY<span className="brand-mark">®</span>
          </span>
          <small>OWNER WORKSPACE</small>
        </a>
        <nav aria-label="Owner navigation">
          {[
            ["dashboard", "Dashboard", LayoutDashboard],
            ["appointments", "Appointments", Calendar],
            ["settings", "Store settings", SettingsIcon],
          ].map(([key, name, Icon]) => {
            const I = Icon as typeof Calendar;
            return (
              <button
                key={key as string}
                className={section === key ? "active" : ""}
                onClick={() => {
                  setSection(key as string);
                  setError("");
                  setNotice("");
                }}
              >
                <I size={17} />
                {name as string}
                <ArrowUpRight size={13} />
              </button>
            );
          })}
        </nav>
        <a href="/" className="line-link">
          VIEW WEBSITE <ArrowUpRight size={14} />
        </a>
        <button
          className="line-link"
          onClick={async () => {
            try {
              await api("/auth/logout", "POST");
              setData(null);
              setError("");
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          <LogOut size={14} /> SIGN OUT
        </button>
      </aside>
      <main className="owner-main">
        <div className="owner-heading">
          <div>
            <span className="eyebrow">SRI LUCKY / OWNER WORKSPACE</span>
            <h1>{title}</h1>
          </div>
          <span className="owner-session">
            <i /> SECURE SESSION
          </span>
        </div>
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        {notice && (
          <div className="owner-notice" role="status">
            <Check size={16} />
            {notice}
            <button
              aria-label="Dismiss notification"
              onClick={() => setNotice("")}
            >
              <X size={15} />
            </button>
          </div>
        )}
        {section === "dashboard" ? (
          <>
            <div className="appointment-stats">
              {[
                [
                  "TODAY’S APPOINTMENTS",
                  all.filter((a) => a.date === today).length,
                ],
                ["PENDING", all.filter((a) => a.status === "Pending").length],
                [
                  "CONFIRMED",
                  all.filter((a) => a.status === "Confirmed").length,
                ],
                [
                  "COMPLETED",
                  all.filter((a) => a.status === "Completed").length,
                ],
              ].map(([label, n]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{n}</strong>
                </div>
              ))}
            </div>
            <div className="owner-section-heading">
              <h2>Recent requests</h2>
              <button
                className="line-link"
                onClick={() => setSection("appointments")}
              >
                ALL APPOINTMENTS <ArrowUpRight size={15} />
              </button>
            </div>
            {table([...all].sort((a, b) => b.id - a.id).slice(0, 5))}
          </>
        ) : section === "appointments" ? (
          <>
            <div
              className="appointment-filters"
              role="tablist"
              aria-label="Appointment status"
            >
              {["All", "Pending", "Confirmed", "Completed", "Cancelled"].map(
                (s) => (
                  <button
                    role="tab"
                    aria-selected={s === filter}
                    key={s}
                    className={s === filter ? "active" : ""}
                    onClick={() => setFilter(s)}
                  >
                    {s}
                  </button>
                ),
              )}
              <span>{rows.length} requests</span>
            </div>
            {table(rows)}
          </>
        ) : (
          <form className="settings-editor" onSubmit={settings}>
            <h2>Keep the details clear.</h2>
            <p>
              These details power the contact buttons across your website.
              <br />
              Use international phone numbers, including the country code.
            </p>
            <div className="form-grid">
              {Object.entries(data.settings)
                .filter(([k]) => k !== "id")
                .map(([key, v]) => (
                  <label
                    key={key}
                    className={
                      [
                        "business_name",
                        "address",
                        "hours",
                        "store_image",
                      ].includes(key)
                        ? "full"
                        : ""
                    }
                  >
                    {
                      (
                        {
                          business_name: "Business name",
                          phone: "Phone",
                          whatsapp: "WhatsApp",
                          address: "Address",
                          hours: "Opening hours",
                          maps_url: "Google Maps link",
                          instagram: "Instagram",
                          facebook: "Facebook",
                          store_image: "Actual store photograph — image URL",
                        } as Record<string, string>
                      )[key]
                    }
                    {["address", "hours"].includes(key) ? (
                      <textarea name={key} rows={2} defaultValue={v} />
                    ) : (
                      <input
                        name={key}
                        defaultValue={v}
                        required={key === "business_name"}
                        type={
                          [
                            "maps_url",
                            "instagram",
                            "facebook",
                            "store_image",
                          ].includes(key)
                            ? "url"
                            : key === "phone" || key === "whatsapp"
                              ? "tel"
                              : "text"
                        }
                      />
                    )}
                  </label>
                ))}
            </div>
            <p className="settings-hint">
              Add a store photograph only if it is an actual image of your
              business. Social and image links must use HTTPS.
            </p>
            <button className="button" disabled={busy}>
              {busy ? (
                <LoaderCircle className="spin" size={16} />
              ) : (
                <>
                  SAVE SETTINGS <Check size={16} />
                </>
              )}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
