import React, { useMemo, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Bell,
  Camera,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  FileCheck2,
  FileText,
  Gauge,
  Grid2X2,
  History,
  Home,
  LayoutDashboard,
  ListChecks,
  LogOut,
  MapPin,
  Menu,
  QrCode,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  X,
  Upload,
  Mail,
  RefreshCw,
  Lock,
} from "lucide-react";
import "./App.css";
import { demoApi } from "./services/api";

const roles = {
  owner: "Instrument Owner",
  lmo: "Legal Metrology Officer",
  gatc: "Government Test Centre",
  admin: "System Administrator",
};
const statusMap = {
  submitted: ["Submitted", "status-submitted"],
  assigned: ["Assigned", "status-assigned"],
  in_progress: ["In progress", "status-progress"],
  completed: ["Completed", "status-completed"],
  active: ["Active", "status-completed"],
  expiring_soon: ["Expiring soon", "status-progress"],
  expired: ["Expired", "status-submitted"],
  rejected: ["Rejected", "status-rejected"],
  revoked: ["Revoked", "status-rejected"],
};
const StatusPill = ({ status }) => {
  const [label, cls] = statusMap[status] || [status, "status-submitted"];
  return (
    <span
      data-testid={`status-pill-${status}`}
      className={`status-pill ${cls}`}
    >
      <span className="status-dot" />
      {label}
    </span>
  );
};
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  variant?: string;
  icon?: any;
  loading?: boolean;
  [key: string]: any;
}
const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  icon: Icon,
  loading = false,
  ...props
}) => {
  const fallbackId = `action-${String(children || "button")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
  return (
    <button
      data-testid={props["data-testid"] || fallbackId}
      className={`btn btn-${variant}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <span className="button-spinner" />
      ) : (
        Icon && <Icon size={17} />
      )}
      {children}
    </button>
  );
};
interface CardProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
const Card: React.FC<CardProps> = ({ children, className = "", ...props }) => (
  <section className={`card ${className}`} {...props}>
    {children}
  </section>
);
interface EmptyStateProps {
  icon?: any;
  text: string;
  action?: string;
  onClick?: () => void;
}
const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon = FileText, text, action, onClick }) => (
  <div className="empty-state" data-testid="empty-state">
    <Icon size={28} />
    <p>{text}</p>
    {action && (
      <Button onClick={onClick} data-testid="empty-state-action">
        {action}
      </Button>
    )}
  </div>
);

function Login() {
  const [role, setRole] = useState("owner");
  const [email, setEmail] = useState("owner@maapsetu.demo");
  const [password, setPassword] = useState("Password@123");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [devOtpHint, setDevOtpHint] = useState("");
  const [isLiveEmail, setIsLiveEmail] = useState(false);
  const navigate = useNavigate();

  const handleRoleSelect = (selectedRole: string) => {
    setRole(selectedRole);
    setEmail(`${selectedRole}@maapsetu.demo`);
    setErrorMessage("");
    setStatusMessage("");
    setDevOtpHint("");
    setOtpSent(false);
    setOtpCode("");
  };

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage("");
    setStatusMessage("");
    setDevOtpHint("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage("Please enter an email address or official identifier.");
      return;
    }

    if (!password.trim()) {
      setErrorMessage("Please enter your account password.");
      return;
    }

    setIsSending(true);
    try {
      const res = await demoApi.sendOtp(trimmedEmail);
      if (res?.data?.success || res?.success) {
        setOtpSent(true);
        const emailDispatched = Boolean(res.data?.emailDispatched);
        setIsLiveEmail(emailDispatched);
        if (emailDispatched) {
          setStatusMessage(
            `A 6-digit verification code has been dispatched directly to ${trimmedEmail}. Please check your inbox.`
          );
        } else {
          setStatusMessage(
            res.data?.message || `Verification code generated for ${trimmedEmail}.`
          );
          if (res.data?.devOtp) {
            setDevOtpHint(res.data.devOtp);
          }
        }
      } else {
        setErrorMessage(
          res?.error || "Failed to dispatch verification code. Please try again."
        );
      }
    } catch (err: any) {
      setErrorMessage(
        "Network connection error while requesting OTP: " +
          (err?.message || "Please check backend connectivity.")
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyAndLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage("");

    const code = otpCode.trim();
    if (!code) {
      setErrorMessage("Please enter the 6-digit verification code.");
      return;
    }

    if (code.length < 6) {
      setErrorMessage("The OTP code must be at least 6 digits.");
      return;
    }

    setIsVerifying(true);
    try {
      const res = await demoApi.loginWithOtp(role, email.trim(), code);
      if (res?.error || !res?.success) {
        setErrorMessage(
          res?.error ||
            "Invalid OTP code. Please enter the valid code sent to your email or testing code 123456."
        );
        setIsVerifying(false);
        return;
      }

      // Success: persist session
      const userRole = res.data?.user?.role || role;
      demoApi.setRole(userRole);
      if (res.data?.user) {
        demoApi.setUser(res.data.user);
      }
      navigate("/dashboard");
    } catch (err: any) {
      setErrorMessage(
        "Authentication failed: " + (err?.message || "Server connection error.")
      );
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-aside">
        <div className="brand brand-light">
          <span className="brand-mark">
            <ShieldCheck size={22} />
          </span>
          <span>MaapSetu</span>
        </div>
        <div className="login-aside-copy">
          <p className="eyebrow light">LEGAL METROLOGY · SIH 26036</p>
          <h1>
            Trust, measured
            <br />
            <em>digitally.</em>
          </h1>
          <p>
            A transparent verification system for every weighing and measuring
            instrument across the sovereign metrology registry.
          </p>
        </div>
        <div className="login-aside-footer">
          <span className="seal-mark">भारत सरकार</span>
          <span>
            Ministry of Consumer Affairs
            <br />
            Legal Metrology Division
          </span>
        </div>
      </div>
      <div className="login-panel">
        <div className="mobile-brand brand">
          <span className="brand-mark">
            <ShieldCheck size={20} />
          </span>
          <span>MaapSetu</span>
        </div>
        <div className="login-box">
          <p className="eyebrow">SECURE ACCESS</p>
          <h2>Sign in to MaapSetu</h2>
          <p className="muted">
            Enter your credentials or choose a pre-configured role below.
          </p>

          <label>Select Role Category</label>
          <div className="role-grid" data-testid="demo-role-selector">
            {Object.entries(roles).map(([key, label]) => (
              <button
                key={key}
                type="button"
                data-testid={`role-option-${key}`}
                className={`role-option ${role === key ? "selected" : ""}`}
                onClick={() => handleRoleSelect(key)}
              >
                <span className="role-icon">
                  {key === "owner" ? (
                    <Gauge size={18} />
                  ) : key === "admin" ? (
                    <Settings size={18} />
                  ) : (
                    <ClipboardCheck size={18} />
                  )}
                </span>
                <span>{label}</span>
              </button>
            ))}
          </div>

          {errorMessage && (
            <div className="login-alert error" data-testid="login-error-alert">
              <X size={15} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {statusMessage && (
            <div className="login-alert success" data-testid="login-status-alert">
              <CheckCircle2 size={15} className="shrink-0" />
              <div>
                <span>{statusMessage}</span>
                {devOtpHint && (
                  <div className="login-dev-hint">
                    Testing Passcode: <strong>{devOtpHint}</strong> (or enter <strong>123456</strong>)
                  </div>
                )}
              </div>
            </div>
          )}

          {!otpSent ? (
            <form onSubmit={handleRequestOtp}>
              <label htmlFor="email">
                Email address or identifier
              </label>
              <input
                id="email"
                data-testid="login-email-input"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMessage("");
                }}
                placeholder="Enter email e.g. vinayydv0277@gmail.com or owner@maapsetu.demo"
                autoComplete="email"
              />

              <label htmlFor="password">Password</label>
              <input
                id="password"
                data-testid="login-password-input"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage("");
                }}
                placeholder="Enter account password"
                autoComplete="current-password"
              />

              <Button
                type="submit"
                data-testid="login-submit-button"
                icon={isSending ? RefreshCw : ArrowRight}
                loading={isSending}
              >
                {isSending ? "Requesting Verification Code..." : "Continue with OTP Verification"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyAndLogin} className="otp-row">
              <div className="flex items-center justify-between">
                <label htmlFor="otp">
                  Enter 6-Digit OTP Sent to <strong>{email}</strong>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtpCode("");
                    setErrorMessage("");
                    setStatusMessage("");
                  }}
                  className="login-edit-email"
                >
                  Edit email
                </button>
              </div>

              <input
                id="otp"
                data-testid="otp-input"
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value.replace(/[^0-9]/g, ""));
                  setErrorMessage("");
                }}
                placeholder="Enter 6-digit code (e.g. 123456)"
                autoFocus
              />

              <div className="login-resend-row">
                <span className="text-muted">Didn't receive the code?</span>
                <button
                  type="button"
                  onClick={() => handleRequestOtp()}
                  disabled={isSending}
                  className="login-resend-btn"
                >
                  <RefreshCw size={12} className={isSending ? "animate-spin" : ""} />
                  <span>Resend OTP</span>
                </button>
              </div>

              <Button
                type="submit"
                data-testid="otp-submit-button"
                icon={isVerifying ? RefreshCw : ShieldCheck}
                loading={isVerifying}
              >
                {isVerifying ? "Verifying Credentials..." : "Verify and Sign In"}
              </Button>
            </form>
          )}

          {/* Quick Demo Credentials Reference Table */}
          <div className="demo-reference-box">
            <div className="demo-reference-title">
              <ShieldCheck size={14} />
              <span>Standard Demo Accounts (Click to Fill)</span>
            </div>
            <div className="demo-reference-grid">
              <button
                type="button"
                className="demo-ref-btn"
                onClick={() => handleRoleSelect("owner")}
              >
                <span className="demo-ref-role">Instrument Owner</span>
                <span className="demo-ref-email">owner@maapsetu.demo</span>
              </button>
              <button
                type="button"
                className="demo-ref-btn"
                onClick={() => handleRoleSelect("lmo")}
              >
                <span className="demo-ref-role">LMO Officer</span>
                <span className="demo-ref-email">lmo@maapsetu.demo</span>
              </button>
              <button
                type="button"
                className="demo-ref-btn"
                onClick={() => handleRoleSelect("gatc")}
              >
                <span className="demo-ref-role">GATC Test Lab</span>
                <span className="demo-ref-email">gatc@maapsetu.demo</span>
              </button>
              <button
                type="button"
                className="demo-ref-btn"
                onClick={() => handleRoleSelect("admin")}
              >
                <span className="demo-ref-role">System Admin</span>
                <span className="demo-ref-email">admin@maapsetu.demo</span>
              </button>
            </div>
            <p className="login-note" style={{ margin: "8px 0 0 0" }}>
              <ShieldCheck size={13} />
              <span>Demo password: <code>Password@123</code> · Test bypass OTP: <code>123456</code></span>
            </p>
          </div>

          <Link
            data-testid="public-verify-link"
            className="public-link"
            to="/verify"
          >
            <QrCode size={16} /> Verify a certificate without signing in
          </Link>
        </div>
        <p className="login-footer">
          Legal Metrology Division · Ministry of Consumer Affairs · Sovereign Portal
        </p>
      </div>
    </main>
  );
}

const navByRole = {
  owner: [
    ["/dashboard", "Overview", LayoutDashboard],
    ["/instruments", "My instruments", Gauge],
    ["/applications", "Applications", FileText],
    ["/certificates", "Certificates", FileCheck2],
  ],
  lmo: [
    ["/dashboard", "Overview", LayoutDashboard],
    ["/queue", "Assignment queue", ListChecks],
    ["/audit", "My audit log", History],
  ],
  gatc: [
    ["/dashboard", "Overview", LayoutDashboard],
    ["/queue", "Assignment queue", ListChecks],
    ["/audit", "My audit log", History],
  ],
  admin: [
    ["/dashboard", "System overview", LayoutDashboard],
    ["/users", "Users & roles", Users],
    ["/rules", "Rules configuration", SlidersHorizontal],
    ["/repository", "Certificate repository", FileCheck2],
    ["/audit", "Audit trail", History],
    ["/analytics", "National analytics", Activity],
  ],
};
function Shell({ children }: { children: React.ReactNode }) {
  const role = demoApi.getRole();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">
            <ShieldCheck size={20} />
          </span>
          <span>MaapSetu</span>
        </div>
        <div className="side-caption">
          {role === "admin" ? "CONTROL CENTRE" : "WORKSPACE"}
        </div>
        <nav>
          {navByRole[role].map(([path, label, Icon]) => (
            <Link
              key={path}
              onClick={() => setOpen(false)}
              data-testid={`nav-${label.toLowerCase().replaceAll(" ", "-")}`}
              className={location.pathname === path ? "active" : ""}
              to={path}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="side-bottom">
          <div className="security-note">
            <ShieldCheck size={17} />
            <span>
              <strong>Trusted records</strong>
              <small>All actions are auditable</small>
            </span>
          </div>
          <button
            data-testid="sidebar-logout-button"
            className="logout"
            onClick={() => navigate("/")}
          >
            <LogOut size={17} /> Sign out
          </button>
        </div>
      </aside>
      <div className="shell-main">
        <header className="topbar">
          <button
            data-testid="mobile-menu-button"
            className="mobile-menu"
            onClick={() => setOpen(!open)}
          >
            <Menu size={21} />
          </button>
          <div className="breadcrumb">
            MaapSetu <span>/</span>{" "}
            {navByRole[role].find(([p]) => p === location.pathname)?.[1] ||
              "Overview"}
          </div>
          <div className="top-actions">
            <button data-testid="notifications-button" className="icon-btn">
              <Bell size={18} />
              <span className="notification-dot" />
            </button>
            <div className="user-chip">
              <div className="avatar">
                {role === "owner"
                  ? "AK"
                  : role === "admin"
                    ? "AD"
                    : role === "lmo"
                      ? "RS"
                      : "GT"}
              </div>
              <span>
                <strong>
                  {role === "owner"
                    ? "Ananya Kapoor"
                    : role === "admin"
                      ? "System Admin"
                      : role === "lmo"
                        ? "R. Sharma"
                        : "GATC Officer"}
                </strong>
                <small>{roles[role]}</small>
              </span>
              <ChevronDown size={15} />
            </div>
          </div>
        </header>
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
}

interface PageHeaderProps {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  action?: { label: string; icon?: any } | null;
  onAction?: () => void;
}
function PageHeader({ eyebrow, title, subtitle, action, onAction }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 data-testid="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action && (
        <Button
          data-testid="page-header-action"
          icon={action.icon}
          onClick={onAction}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
interface StatCardProps {
  label: string;
  value: string;
  detail: string;
  tone?: string;
  icon: any;
}
function StatCard({ label, value, detail, tone = "navy", icon: Icon }: StatCardProps) {
  return (
    <Card
      className="stat-card"
      data-testid={`stat-${label.toLowerCase().replaceAll(" ", "-")}`}
    >
      <div className={`stat-icon ${tone}`}>
        <Icon size={19} />
      </div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </Card>
  );
}
function OwnerDashboard() {
  const navigate = useNavigate();
  return (
    <>
      <PageHeader
        eyebrow="OWNER WORKSPACE"
        title="Good morning, Ananya"
        subtitle="Here is the current verification position for your instruments."
        action={{ label: "Register instrument", icon: Gauge }}
        onAction={() => navigate("/instruments/new")}
      />
      <div className="stat-grid">
        <StatCard
          label="Registered instruments"
          value="12"
          detail="Across 3 locations"
          icon={Gauge}
        />
        <StatCard
          label="Active applications"
          value="03"
          detail="01 awaiting inspection"
          tone="blue"
          icon={FileText}
        />
        <StatCard
          label="Renewals due soon"
          value="02"
          detail="Within the next 30 days"
          tone="amber"
          icon={Bell}
        />
      </div>
      <div className="content-grid two-thirds">
        <Card>
          <div className="card-heading">
            <div>
              <h3>My instruments</h3>
              <p className="muted">
                Verification status across your registered instruments
              </p>
            </div>
            <Button
              variant="ghost"
              icon={ArrowRight}
              onClick={() => navigate("/instruments")}
              data-testid="view-all-instruments-button"
            >
              View all
            </Button>
          </div>
          <InstrumentTable compact />
        </Card>
        <Card>
          <div className="card-heading">
            <div>
              <h3>Recent activity</h3>
              <p className="muted">Latest changes to your records</p>
            </div>
          </div>
          <ActivityFeed />
        </Card>
      </div>
    </>
  );
}
const instruments = [
  {
    type: "Weighing scale",
    serial: "WS-DL-2024-0081",
    site: "Lajpat Nagar, New Delhi",
    status: "active",
    action: "View certificate",
  },
  {
    type: "Fuel dispenser",
    serial: "FD-HR-2023-0147",
    site: "Sector 18, Gurugram",
    status: "expiring_soon",
    action: "Apply for re-verification",
  },
  {
    type: "Water meter",
    serial: "WM-DL-2025-0032",
    site: "Dwarka, New Delhi",
    status: "assigned",
    action: "View application",
  },
  {
    type: "Taxi meter",
    serial: "TM-DL-2024-0193",
    site: "Karol Bagh, New Delhi",
    status: "expired",
    action: "Apply for verification",
  },
];
function InstrumentTable({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate();
  return (
    <div className="table-wrap">
      <table data-testid="instruments-table">
        <thead>
          <tr>
            <th>Instrument</th>
            <th>Serial number</th>
            <th>Location</th>
            <th>Status</th>
            <th className="align-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {instruments.slice(0, compact ? 3 : 10).map((item) => (
            <tr key={item.serial}>
              <td>
                <div className="table-primary">
                  <span className="table-icon">
                    <Gauge size={16} />
                  </span>
                  {item.type}
                </div>
              </td>
              <td className="mono">{item.serial}</td>
              <td>{item.site}</td>
              <td>
                <StatusPill status={item.status} />
              </td>
              <td className="align-right">
                <button
                  data-testid={`instrument-action-${item.serial}`}
                  className="text-button"
                  onClick={() =>
                    navigate(
                      item.status === "assigned"
                        ? "/applications/app-2048"
                        : "/certificates/MS-2026-DL-000123",
                    )
                  }
                >
                  {item.action}
                  <ArrowRight size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function ActivityFeed() {
  return (
    <div className="activity-feed">
      {[
        [
          "Application MS-2026-041",
          "Assigned to LMO R. Sharma",
          "Today, 10:42",
          "blue",
        ],
        [
          "Fuel dispenser FD-HR-2023-0147",
          "Renewal reminder issued",
          "Yesterday, 16:18",
          "amber",
        ],
        [
          "Weighing scale WS-DL-2024-0081",
          "Certificate verified",
          "12 Jun 2026, 09:05",
          "green",
        ],
      ].map(([title, desc, time, tone]) => (
        <div className="activity-item" key={title}>
          <span className={`activity-dot ${tone}`} />
          <div>
            <strong>{title}</strong>
            <p>{desc}</p>
            <small>{time}</small>
          </div>
        </div>
      ))}
    </div>
  );
}
function Instruments() {
  const navigate = useNavigate();
  return (
    <>
      <PageHeader
        eyebrow="INSTRUMENT REGISTRY"
        title="My instruments"
        subtitle="Register and manage instruments requiring legal metrology verification."
        action={{ label: "Register instrument", icon: Gauge }}
        onAction={() => navigate("/instruments/new")}
      />
      <Card>
        <div className="toolbar">
          <div className="search-box">
            <Search size={17} />
            <input
              data-testid="instrument-search-input"
              placeholder="Search by serial number or type"
            />
          </div>
          <button
            data-testid="instrument-filter-button"
            className="filter-button"
          >
            <SlidersHorizontal size={16} /> Filters
          </button>
        </div>
        <InstrumentTable />
      </Card>
    </>
  );
}
function RegisterInstrument() {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  return (
    <>
      <PageHeader
        eyebrow="INSTRUMENT REGISTRY / NEW"
        title="Register an instrument"
        subtitle="Add the instrument details exactly as they appear on the instrument plate."
      />
      <div className="form-layout">
        <Card>
          <div className="form-section">
            <h3>Instrument identity</h3>
            <p className="muted">
              These details help officers identify the instrument during
              inspection.
            </p>
            <div className="form-grid">
              <div className="field full">
                <label>Instrument type</label>
                <select data-testid="instrument-type-select">
                  <option>Weighing scale</option>
                  <option>Fuel dispenser</option>
                  <option>Water meter</option>
                  <option>Taxi meter</option>
                </select>
              </div>
              <div className="field">
                <label>Make</label>
                <input
                  data-testid="instrument-make-input"
                  placeholder="e.g. Avery"
                />
              </div>
              <div className="field">
                <label>Model</label>
                <input
                  data-testid="instrument-model-input"
                  placeholder="e.g. 2200"
                />
              </div>
              <div className="field">
                <label>Serial number</label>
                <input
                  data-testid="instrument-serial-input"
                  placeholder="Enter serial number"
                />
              </div>
              <div className="field">
                <label>Capacity</label>
                <input
                  data-testid="instrument-capacity-input"
                  placeholder="e.g. 0–50 kg"
                />
              </div>
              <div className="field">
                <label>Accuracy class</label>
                <input
                  data-testid="instrument-accuracy-input"
                  placeholder="e.g. Class III"
                />
              </div>
              <div className="field full">
                <label>Installation site address</label>
                <textarea
                  data-testid="instrument-address-input"
                  rows="3"
                  placeholder="Full address including PIN code"
                />
              </div>
            </div>
          </div>
          <div className="form-footer">
            <Button
              variant="secondary"
              onClick={() => navigate("/instruments")}
            >
              Cancel
            </Button>
            <Button
              data-testid="save-instrument-button"
              onClick={() => setSaved(true)}
            >
              {saved ? "Instrument saved" : "Save instrument"}
            </Button>
          </div>
        </Card>
        <div className="info-panel">
          <ShieldCheck size={22} />
          <h3>Why these details matter</h3>
          <p>
            The installation address determines the jurisdiction and ensures
            your application reaches the correct authority.
          </p>
          <div className="info-line">
            <CheckCircle2 size={16} /> Jurisdiction derived from address
          </div>
          <div className="info-line">
            <CheckCircle2 size={16} /> Duplicate serial numbers prevented
          </div>
        </div>
      </div>
    </>
  );
}
function Applications() {
  const navigate = useNavigate();
  return (
    <>
      <PageHeader
        eyebrow="APPLICATIONS"
        title="Verification applications"
        subtitle="Track every application from submission through certificate issue."
      />
      <Card>
        <div className="card-heading">
          <div>
            <h3>Application history</h3>
            <p className="muted">Showing 4 applications</p>
          </div>
          <Button
            data-testid="new-application-button"
            onClick={() => navigate("/applications/new")}
            icon={FileText}
          >
            New application
          </Button>
        </div>
        <div className="application-list">
          {[
            [
              "MS-APP-2026-041",
              "Weighing scale · WS-DL-2024-0081",
              "12 Jun 2026",
              "assigned",
            ],
            [
              "MS-APP-2026-038",
              "Fuel dispenser · FD-HR-2023-0147",
              "03 Jun 2026",
              "in_progress",
            ],
            [
              "MS-APP-2026-021",
              "Water meter · WM-DL-2025-0032",
              "19 May 2026",
              "completed",
            ],
            [
              "MS-APP-2026-009",
              "Taxi meter · TM-DL-2024-0193",
              "02 Apr 2026",
              "rejected",
            ],
          ].map(([id, detail, date, status]) => (
            <button
              key={id}
              data-testid={`application-row-${id}`}
              className="application-row"
              onClick={() => navigate(`/applications/${id}`)}
            >
              <div>
                <strong>{id}</strong>
                <span>{detail}</span>
              </div>
              <span>{date}</span>
              <StatusPill status={status} />
              <ArrowRight size={17} />
            </button>
          ))}
        </div>
      </Card>
    </>
  );
}
function NewApplication() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  return (
    <>
      <PageHeader
        eyebrow="APPLICATIONS / NEW"
        title="Start a verification application"
        subtitle="Application for WS-DL-2024-0081 · Weighing scale"
      />
      <div className="stepper">
        <span className={step >= 1 ? "current" : ""}>
          1 <b>Details</b>
        </span>
        <i />
        <span className={step >= 2 ? "current" : ""}>
          2 <b>Documents</b>
        </span>
        <i />
        <span className={step >= 3 ? "current" : ""}>
          3 <b>Payment</b>
        </span>
        <i />
        <span className={step >= 4 ? "current" : ""}>
          4 <b>Submitted</b>
        </span>
      </div>
      <Card className="application-form-card">
        {step === 1 && (
          <>
            <div className="section-title">
              <span className="step-number">01</span>
              <div>
                <h3>Application type</h3>
                <p className="muted">
                  Choose the service required for this instrument.
                </p>
              </div>
            </div>
            <label className="radio-card selected">
              <input type="radio" checked readOnly />{" "}
              <span>
                <strong>Initial verification</strong>
                <small>
                  For a newly installed or never-verified instrument.
                </small>
              </span>
              <CheckCircle2 size={18} />
            </label>
            <label className="radio-card">
              <input type="radio" />{" "}
              <span>
                <strong>Re-verification</strong>
                <small>Renew an existing certificate before expiry.</small>
              </span>
            </label>
            <div className="form-footer">
              <Button
                data-testid="continue-details-button"
                onClick={() => setStep(2)}
              >
                Continue <ArrowRight size={16} />
              </Button>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <div className="section-title">
              <span className="step-number">02</span>
              <div>
                <h3>Supporting photographs</h3>
                <p className="muted">
                  Upload 1–3 clear photographs of the instrument and serial
                  plate.
                </p>
              </div>
            </div>
            <div className="upload-zone" data-testid="photo-upload-zone">
              <Upload size={25} />
              <strong>Drop photographs here or browse</strong>
              <span>JPG, PNG up to 10 MB each</span>
              <input
                data-testid="application-photo-input"
                type="file"
                accept="image/*"
                multiple
              />
            </div>
            <div className="form-footer">
              <Button variant="secondary" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                data-testid="continue-documents-button"
                onClick={() => setStep(3)}
              >
                Continue <ArrowRight size={16} />
              </Button>
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <div className="section-title">
              <span className="step-number">03</span>
              <div>
                <h3>Verification fee</h3>
                <p className="muted">
                  Demo payment only. No real transaction will occur.
                </p>
              </div>
            </div>
            <div className="fee-row">
              <div>
                <strong>Initial verification fee</strong>
                <span>Legal metrology service fee · New Delhi</span>
              </div>
              <strong className="fee">₹250.00</strong>
            </div>
            <div className="demo-banner">
              <ShieldCheck size={18} />
              <span>
                <strong>Demo Payment</strong>
                <br />
                This prototype uses a mock-success payment flow. No money is
                charged.
              </span>
            </div>
            <div className="form-footer">
              <Button variant="secondary" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button
                data-testid="demo-payment-button"
                onClick={() => setStep(4)}
              >
                Pay ₹250 (Demo Mode)
              </Button>
            </div>
          </>
        )}
        {step === 4 && (
          <div className="success-screen">
            <div className="success-icon">
              <CheckCircle2 size={32} />
            </div>
            <p className="eyebrow">APPLICATION SUBMITTED</p>
            <h3>We’re assigning an officer now</h3>
            <p>
              Your application <strong>MS-APP-2026-042</strong> has been
              received. The scheduling engine is matching it to an eligible
              officer based on jurisdiction and workload.
            </p>
            <div className="assignment-progress">
              <span className="pulse" /> Assignment completed · LMO R. Sharma,
              New Delhi
            </div>
            <Button
              data-testid="view-submitted-application-button"
              onClick={() => navigate("/applications/app-2048")}
            >
              View application <ArrowRight size={16} />
            </Button>
          </div>
        )}
      </Card>
    </>
  );
}
function ApplicationDetail() {
  const navigate = useNavigate();
  return (
    <>
      <PageHeader
        eyebrow="APPLICATION MS-APP-2026-041"
        title="Verification application"
        subtitle="Submitted 12 June 2026 · Weighing scale · WS-DL-2024-0081"
        action={{ label: "Download receipt", icon: FileText }}
      />
      <Card className="timeline-card">
        <div className="card-heading">
          <div>
            <h3>Application progress</h3>
            <p className="muted">
              Your application is with the assigned officer.
            </p>
          </div>
          <StatusPill status="assigned" />
        </div>
        <div className="timeline">
          {[
            ["submitted", "Submitted", "12 Jun 2026 · 09:16", true],
            ["assigned", "Assigned", "12 Jun 2026 · 09:17", true],
            ["in_progress", "In progress", "Awaiting inspection", false],
            ["completed", "Completed", "Pending", false],
          ].map(([status, label, time, done]) => (
            <div className={`timeline-step ${done ? "done" : ""}`} key={status}>
              <div className="timeline-node">
                {done ? <CheckCircle2 size={15} /> : <span />}
              </div>
              <div>
                <strong>{label}</strong>
                <small>{time}</small>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <div className="content-grid two-thirds">
        <Card>
          <div className="card-heading">
            <h3>Assignment details</h3>
          </div>
          <div className="detail-list">
            <div>
              <span>Assigned officer</span>
              <strong>R. Sharma · LMO</strong>
            </div>
            <div>
              <span>Jurisdiction</span>
              <strong>District Central, New Delhi</strong>
            </div>
            <div>
              <span>Expected inspection</span>
              <strong>Within 5 working days</strong>
            </div>
          </div>
        </Card>
        <Card>
          <div className="card-heading">
            <h3>Instrument summary</h3>
          </div>
          <div className="detail-list">
            <div>
              <span>Type</span>
              <strong>Weighing scale</strong>
            </div>
            <div>
              <span>Serial number</span>
              <strong className="mono">WS-DL-2024-0081</strong>
            </div>
            <div>
              <span>Capacity</span>
              <strong>0–50 kg</strong>
            </div>
          </div>
          <Button
            variant="secondary"
            data-testid="open-certificate-button"
            onClick={() => navigate("/certificates/MS-2026-DL-000123")}
          >
            View previous certificate <ArrowRight size={16} />
          </Button>
        </Card>
      </div>
    </>
  );
}
function CertificateDetail() {
  return (
    <>
      <PageHeader
        eyebrow="CERTIFICATE REPOSITORY"
        title="Certificate MS-2026-DL-000123"
        subtitle="Digitally signed verification record"
        action={{ label: "Download PDF", icon: FileText }}
      />
      <div className="certificate-layout">
        <Card className="certificate-preview">
          <div className="certificate-paper">
            <div className="paper-top">
              <span>भारत सरकार</span>
              <span>LEGAL METROLOGY DIVISION</span>
            </div>
            <div className="paper-seal">
              <ShieldCheck size={25} />
            </div>
            <p className="paper-eyebrow">CERTIFICATE OF VERIFICATION</p>
            <h2>MaapSetu</h2>
            <p className="certificate-number">MS-2026-DL-000123</p>
            <div className="paper-rule" />
            <div className="paper-fields">
              <div>
                <span>Instrument category</span>
                <strong>Weighing scale</strong>
              </div>
              <div>
                <span>Serial number</span>
                <strong>WS-DL-2024-0081</strong>
              </div>
              <div>
                <span>Capacity</span>
                <strong>0–50 kg</strong>
              </div>
              <div>
                <span>Issuing authority</span>
                <strong>District Central, New Delhi</strong>
              </div>
              <div>
                <span>Issue date</span>
                <strong>14 Jun 2026</strong>
              </div>
              <div>
                <span>Valid until</span>
                <strong>13 Jun 2027</strong>
              </div>
            </div>
            <div className="paper-bottom">
              <div>
                <div className="signature-line" />
                Issuing officer
              </div>
              <div className="fake-qr">
                <QrCode size={72} />
              </div>
            </div>
          </div>
        </Card>
        <div className="certificate-side">
          <div className="verified-callout">
            <CheckCircle2 size={23} />
            <div>
              <strong>Currently valid</strong>
              <span>Verified on 16 Jun 2026, 11:34</span>
            </div>
          </div>
          <Card>
            <div className="card-heading">
              <h3>Public verification</h3>
            </div>
            <p className="muted">
              Anyone can verify this certificate using the QR-linked page. No
              owner information is exposed.
            </p>
            <div className="qr-large">
              <QrCode size={112} />
            </div>
            <div className="url-copy">
              maapsetu.demo/verify/MS-2026-DL-000123
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
function PublicVerify({ result = false }: { result?: boolean }) {
  const [query, setQuery] = useState(result ? "MS-2026-DL-000123" : "");
  const navigate = useNavigate();
  return (
    <main className="public-page">
      <div className="public-header">
        <Link to="/" className="brand">
          <span className="brand-mark">
            <ShieldCheck size={20} />
          </span>
          <span>MaapSetu</span>
        </Link>
        <span className="public-tag">PUBLIC VERIFICATION</span>
      </div>
      <div className="public-content">
        {!result ? (
          <>
            <QrCode size={31} className="public-icon" />
            <p className="eyebrow">OPEN VERIFICATION</p>
            <h1>Verify a certificate</h1>
            <p className="page-subtitle">
              Check the current legal verification status of a weighing or
              measuring instrument.
            </p>
            <div className="public-search">
              <Search size={19} />
              <input
                data-testid="public-verify-search-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter certificate number or instrument serial"
              />
              <Button
                data-testid="public-verify-search-button"
                onClick={() =>
                  navigate(`/verify/${query || "MS-2026-DL-000123"}`)
                }
              >
                Verify
              </Button>
            </div>
            <p className="public-hint">
              <QrCode size={15} /> Or scan the QR code on the instrument’s
              certificate
            </p>
          </>
        ) : (
          <>
            <div className="verified-header">
              <div className="valid-icon">
                <CheckCircle2 size={29} />
              </div>
              <div>
                <p className="eyebrow">CERTIFICATE FOUND</p>
                <h1>Verification result</h1>
              </div>
            </div>
            <Card className="verification-card">
              <div className="verification-status">
                <StatusPill status="active" />
                <strong>Valid and currently verified</strong>
                <span>Last checked just now</span>
              </div>
              <div className="public-fields">
                <div>
                  <span>Certificate number</span>
                  <strong className="mono">MS-2026-DL-000123</strong>
                </div>
                <div>
                  <span>Instrument category</span>
                  <strong>Weighing scale</strong>
                </div>
                <div>
                  <span>Capacity band</span>
                  <strong>0–50 kg</strong>
                </div>
                <div>
                  <span>Issuing authority</span>
                  <strong>Legal Metrology · New Delhi</strong>
                </div>
                <div>
                  <span>Issue date</span>
                  <strong>14 June 2026</strong>
                </div>
                <div>
                  <span>Expiry date</span>
                  <strong>13 June 2027</strong>
                </div>
              </div>
            </Card>
            <button
              data-testid="verify-another-button"
              className="text-button center-button"
              onClick={() => navigate("/verify")}
            >
              Verify another certificate <ArrowRight size={14} />
            </button>
          </>
        )}
      </div>
      <footer className="public-footer">
        This service displays the minimum information needed to verify legal
        status. No owner information is shown.
      </footer>
    </main>
  );
}

function OfficerDashboard({ role }: { role: string }) {
  const navigate = useNavigate();
  return (
    <>
      <PageHeader
        eyebrow={`${role.toUpperCase()} WORKSPACE`}
        title={
          role === "lmo" ? "District Central overview" : "Test centre overview"
        }
        subtitle="Keep verification work moving with a clear, oldest-first queue."
      />
      <div className="stat-grid">
        <StatCard
          label="Pending queue"
          value="18"
          detail="4 due this week"
          tone="blue"
          icon={ListChecks}
        />
        <StatCard
          label="Average TAT"
          value="2.4 days"
          detail="This month"
          icon={Activity}
        />
        <StatCard
          label="Compliance rate"
          value="96.8%"
          detail="Across 74 inspections"
          tone="green"
          icon={CheckCircle2}
        />
      </div>
      <div className="content-grid two-thirds">
        <Card>
          <div className="card-heading">
            <div>
              <h3>Oldest-first assignment queue</h3>
              <p className="muted">Next applications requiring attention</p>
            </div>
            <Button
              variant="ghost"
              icon={ArrowRight}
              onClick={() => navigate("/queue")}
              data-testid="officer-view-queue-button"
            >
              Open queue
            </Button>
          </div>
          <QueueTable compact />
        </Card>
        <Card>
          <div className="card-heading">
            <h3>Queue health</h3>
          </div>
          <div className="mini-bars">
            {[
              ["Submitted", 38, "gray"],
              ["Assigned", 62, "blue"],
              ["In progress", 26, "amber"],
              ["Completed", 84, "green"],
            ].map(([label, value, tone]) => (
              <div key={label}>
                <div>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
                <div className="bar">
                  <i className={tone} style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="attention-box">
            <Bell size={17} />
            <span>
              <strong>4 applications need attention</strong>
              <small>Oldest pending application is 6 days old.</small>
            </span>
          </div>
        </Card>
      </div>
    </>
  );
}
function QueueTable({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate();
  const rows = [
    [
      "MS-APP-2026-041",
      "Weighing scale",
      "Ananya Kapoor",
      "12 Jun 2026",
      "assigned",
    ],
    [
      "MS-APP-2026-039",
      "Fuel dispenser",
      "Vikram Traders",
      "10 Jun 2026",
      "assigned",
    ],
    [
      "MS-APP-2026-034",
      "Water meter",
      "Northline Foods",
      "08 Jun 2026",
      "in_progress",
    ],
    [
      "MS-APP-2026-029",
      "Taxi meter",
      "Rajesh Mobility",
      "04 Jun 2026",
      "assigned",
    ],
  ];
  return (
    <div className="table-wrap">
      <table data-testid="assignment-queue-table">
        <thead>
          <tr>
            <th>Application</th>
            <th>Instrument</th>
            <th>Owner</th>
            <th>Submitted</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, compact ? 3 : 4).map((r) => (
            <tr key={r[0]}>
              <td className="mono">{r[0]}</td>
              <td>{r[1]}</td>
              <td>{r[2]}</td>
              <td>{r[3]}</td>
              <td>
                <StatusPill status={r[4]} />
              </td>
              <td className="align-right">
                <button
                  data-testid={`begin-inspection-${r[0]}`}
                  className="text-button"
                  onClick={() => navigate(`/inspection/${r[0]}`)}
                >
                  Begin inspection <ArrowRight size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Queue() {
  return (
    <>
      <PageHeader
        eyebrow="ASSIGNMENT QUEUE"
        title="Applications to inspect"
        subtitle="Jurisdiction and workload-aware assignment · oldest first"
      />
      <Card>
        <div className="toolbar">
          <div className="search-box">
            <Search size={17} />
            <input
              data-testid="queue-search-input"
              placeholder="Search application, owner or instrument"
            />
          </div>
          <button data-testid="queue-filter-button" className="filter-button">
            <SlidersHorizontal size={16} /> Filter queue
          </button>
        </div>
        <QueueTable />
      </Card>
    </>
  );
}
function Inspection() {
  const [gps, setGps] = useState(false);
  const [decision, setDecision] = useState("");
  return (
    <>
      <PageHeader
        eyebrow="FIELD VERIFICATION / MS-APP-2026-041"
        title="Record inspection"
        subtitle="Complete every evidence field before recording a decision."
      />
      <div className="offline-banner">
        <Activity size={17} />
        <span>
          <strong>Online</strong> · Inspection will sync immediately after
          submission.
        </span>
      </div>
      <div className="inspection-layout">
        <div>
          <Card>
            <div className="card-heading">
              <div>
                <h3>Instrument details</h3>
                <p className="muted">Read-only record from the application</p>
              </div>
              <StatusPill status="in_progress" />
            </div>
            <div className="detail-list grid-details">
              <div>
                <span>Type</span>
                <strong>Weighing scale</strong>
              </div>
              <div>
                <span>Serial number</span>
                <strong className="mono">WS-DL-2024-0081</strong>
              </div>
              <div>
                <span>Capacity</span>
                <strong>0–50 kg</strong>
              </div>
              <div>
                <span>Site</span>
                <strong>Lajpat Nagar, New Delhi</strong>
              </div>
            </div>
          </Card>
          <Card>
            <div className="card-heading">
              <div>
                <h3>Inspection readings</h3>
                <p className="muted">
                  Record test readings at each load point.
                </p>
              </div>
            </div>
            <div className="reading-grid">
              <div className="reading-label">Test load</div>
              <div className="reading-label">Observed reading</div>
              <div className="reading-label">Permitted error</div>
              {[
                ["10 kg", "10.00 kg", "± 20 g"],
                ["25 kg", "25.01 kg", "± 50 g"],
                ["50 kg", "50.01 kg", "± 100 g"],
              ].map(([a, b, c]) => (
                <div className="reading-row" key={a}>
                  <strong>{a}</strong>
                  <input data-testid={`reading-${a}`} defaultValue={b} />
                  <span>{c}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <div className="card-heading">
              <div>
                <h3>Evidence and location</h3>
                <p className="muted">
                  A timestamped photo and location are required.
                </p>
              </div>
            </div>
            <label
              className="evidence-upload"
              data-testid="inspection-photo-upload"
            >
              <Camera size={20} />
              <span>
                <strong>Capture inspection photo</strong>
                <small>Use camera or choose from device</small>
              </span>
              <input type="file" capture="environment" accept="image/*" />
            </label>
            <div className="gps-row">
              <div className="gps-icon">
                <MapPin size={19} />
              </div>
              <div>
                <strong>
                  {gps ? "Location captured" : "GPS location not yet captured"}
                </strong>
                <small>
                  {gps
                    ? "28.5672° N, 77.2430° E"
                    : "Use your current location to attach coordinates"}
                </small>
              </div>
              <Button
                data-testid="capture-gps-button"
                variant="secondary"
                onClick={() => setGps(true)}
              >
                {gps ? "Captured" : "Use my location"}
              </Button>
            </div>
          </Card>
        </div>
        <div className="inspection-side">
          <Card>
            <div className="card-heading">
              <h3>Officer confirmation</h3>
            </div>
            <p className="muted">
              Confirm your identity before selecting a result.
            </p>
            <label>One-time password</label>
            <input
              data-testid="inspection-otp-input"
              placeholder="Enter 123456"
            />
            <p className="login-note">
              <ShieldCheck size={14} /> DEV MODE: OTP is 123456
            </p>
          </Card>
          <Card>
            <div className="card-heading">
              <h3>Inspection result</h3>
            </div>
            <div className="decision-buttons">
              <button
                data-testid="inspection-pass-button"
                className={decision === "pass" ? "selected-pass" : ""}
                onClick={() => setDecision("pass")}
              >
                <CheckCircle2 size={19} />
                <strong>Pass</strong>
                <span>Issue certificate</span>
              </button>
              <button
                data-testid="inspection-fail-button"
                className={decision === "fail" ? "selected-fail" : ""}
                onClick={() => setDecision("fail")}
              >
                <X size={19} />
                <strong>Fail</strong>
                <span>Reject application</span>
              </button>
            </div>
            {decision === "fail" && (
              <div className="field">
                <label>Reason for rejection</label>
                <select data-testid="rejection-reason-select">
                  <option>Select a reason</option>
                  <option>Accuracy outside permitted limits</option>
                  <option>Instrument damaged</option>
                </select>
              </div>
            )}
            {decision && (
              <Button
                data-testid="submit-inspection-button"
                className="full-button"
                variant={decision === "fail" ? "danger" : "primary"}
              >
                {decision === "pass"
                  ? "Submit and issue certificate"
                  : "Submit rejection"}
              </Button>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
function AdminPage({ type }: { type: string }) {
  const configs: Record<string, [string, string, string, any]> = {
    users: [
      "USERS & ROLES",
      "Users and roles",
      "Manage access across the MaapSetu system.",
      Users,
    ],
    rules: [
      "RULES CONFIGURATION",
      "Rules configuration",
      "Set fees, validity periods, and lifecycle alert thresholds.",
      SlidersHorizontal,
    ],
    repository: [
      "CERTIFICATE REPOSITORY",
      "Certificate repository",
      "Search, inspect, and revoke issued certificates.",
      FileCheck2,
    ],
    audit: [
      "AUDIT TRAIL",
      "Audit trail",
      "Immutable record of every action in the system.",
      History,
    ],
    analytics: [
      "NATIONAL ANALYTICS",
      "National analytics",
      "Compare pendency, turnaround, and compliance across jurisdictions.",
      Activity,
    ],
  };
  const [eyebrow, title, subtitle, Icon] = configs[type];
  return (
    <>
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        action={type === "users" ? { label: "Create user", icon: Users } : null}
      />
      <Card>
        {type === "users" && (
          <>
            <div className="toolbar">
              <div className="search-box">
                <Search size={17} />
                <input
                  data-testid="users-search-input"
                  placeholder="Search users"
                />
              </div>
              <button
                data-testid="users-filter-button"
                className="filter-button"
              >
                <SlidersHorizontal size={16} /> Filter
              </button>
            </div>
            <div className="user-list">
              {[
                [
                  "R. Sharma",
                  "r.sharma@maapsetu.demo",
                  "LMO",
                  "District Central, New Delhi",
                  "Active",
                ],
                [
                  "Meera Iyer",
                  "meera.iyer@maapsetu.demo",
                  "LMO",
                  "District South, New Delhi",
                  "Active",
                ],
                [
                  "GATC Officer",
                  "gatc@maapsetu.demo",
                  "GATC",
                  "Weighing instruments",
                  "Active",
                ],
                [
                  "Sanjay Verma",
                  "sanjay.verma@maapsetu.demo",
                  "Owner",
                  "—",
                  "Active",
                ],
              ].map((u) => (
                <div className="user-row" key={u[1]}>
                  <div className="avatar">
                    {u[0]
                      .split(" ")
                      .map((x) => x[0])
                      .join("")}
                  </div>
                  <div>
                    <strong>{u[0]}</strong>
                    <span>{u[1]}</span>
                  </div>
                  <span className="role-badge">{u[2]}</span>
                  <span>{u[3]}</span>
                  <StatusPill status="active" />
                  <button
                    data-testid={`user-menu-${u[2].toLowerCase()}`}
                    className="icon-btn"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
        {type === "rules" && (
          <div className="rules-grid">
            {[
              [
                "Verification fee",
                "₹250",
                "Fee schedule for standard verification",
              ],
              ["Re-verification fee", "₹150", "Fee schedule for renewal"],
              [
                "Alert threshold",
                "30 days",
                "When to mark certificates expiring soon",
              ],
              [
                "Weighing scale validity",
                "12 months",
                "Validity period by category",
              ],
              [
                "Fuel dispenser validity",
                "12 months",
                "Validity period by category",
              ],
              [
                "Water meter validity",
                "24 months",
                "Validity period by category",
              ],
            ].map(([a, b, c]) => (
              <div className="rule-row" key={a}>
                <div>
                  <strong>{a}</strong>
                  <span>{c}</span>
                </div>
                <input
                  data-testid={`rule-${a.toLowerCase().replaceAll(" ", "-")}`}
                  defaultValue={b}
                />
              </div>
            ))}
          </div>
        )}
        {type === "repository" && (
          <>
            <div className="toolbar">
              <div className="search-box">
                <Search size={17} />
                <input
                  data-testid="repository-search-input"
                  placeholder="Certificate number, serial or owner"
                />
              </div>
            </div>
            <InstrumentTable />
          </>
        )}
        {type === "audit" && (
          <>
            <div className="toolbar">
              <Button variant="secondary" data-testid="export-audit-button">
                Export CSV
              </Button>
            </div>
            <div className="audit-list">
              {[
                [
                  "certificate.issued",
                  "R. Sharma",
                  "MS-2026-DL-000123",
                  "14 Jun 2026 · 12:05",
                ],
                [
                  "application.assigned",
                  "Scheduling engine",
                  "MS-APP-2026-041",
                  "12 Jun 2026 · 09:17",
                ],
                [
                  "verify.public_lookup",
                  "Anonymous",
                  "MS-2026-DL-000117",
                  "11 Jun 2026 · 17:44",
                ],
                [
                  "rules.updated",
                  "System Admin",
                  "rules_config",
                  "01 Jun 2026 · 10:22",
                ],
              ].map((r) => (
                <div className="audit-row" key={r[3]}>
                  <History size={17} />
                  <span className="mono">{r[0]}</span>
                  <strong>{r[1]}</strong>
                  <span>{r[2]}</span>
                  <small>{r[3]}</small>
                </div>
              ))}
            </div>
          </>
        )}
        {type === "analytics" && (
          <div className="analytics">
            <div className="analytics-chart">
              <div className="chart-heading">
                <h3>Pendency by jurisdiction</h3>
                <span>Current quarter</span>
              </div>
              <div className="chart-bars">
                {[
                  ["Central", 74],
                  ["South", 52],
                  ["Gurugram", 38],
                  ["Noida", 28],
                ].map(([x, v]) => (
                  <div key={x}>
                    <span>{x}</span>
                    <i style={{ height: `${v}%` }} />
                    <small>{v}</small>
                  </div>
                ))}
              </div>
            </div>
            <div className="analytics-chart">
              <div className="chart-heading">
                <h3>Compliance rate</h3>
                <span>Current quarter</span>
              </div>
              <div className="big-rate">
                96.8<small>%</small>
              </div>
              <p className="muted">Across 312 completed inspections</p>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
function Dashboard() {
  const role = demoApi.getRole();
  return role === "owner" ? (
    <OwnerDashboard />
  ) : role === "admin" ? (
    <AdminHome />
  ) : (
    <OfficerDashboard role={role} />
  );
}
function AdminHome() {
  return (
    <>
      <PageHeader
        eyebrow="ADMIN CONTROL CENTRE"
        title="System overview"
        subtitle="A national view of verification operations and trust signals."
      />
      <div className="stat-grid">
        <StatCard
          label="Unassigned applications"
          value="04"
          detail="Needs routing attention"
          tone="amber"
          icon={ListChecks}
        />
        <StatCard
          label="Active users"
          value="47"
          detail="Across 4 role types"
          icon={Users}
        />
        <StatCard
          label="System compliance"
          value="98.2%"
          detail="This reporting period"
          tone="green"
          icon={ShieldCheck}
        />
      </div>
      <Card className="attention-list">
        <div className="card-heading">
          <div>
            <h3>Needs attention</h3>
            <p className="muted">Items requiring administrative review</p>
          </div>
          <span className="alert-count">4 open</span>
        </div>
        {[
          "4 applications have no eligible officer",
          "2 certificates expire within 7 days",
          "1 jurisdiction has a queue above target",
        ].map((x, i) => (
          <div className="attention-row" key={x}>
            <span
              className={`attention-number ${i === 0 ? "amber-bg" : "gray-bg"}`}
            >
              0{i + 1}
            </span>
            <span>{x}</span>
            <ArrowRight size={16} />
          </div>
        ))}
      </Card>
    </>
  );
}
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/verify" element={<PublicVerify />} />
      <Route path="/verify/:id" element={<PublicVerify result />} />
      <Route
        path="/*"
        element={
          <Shell>
            <Routes>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="instruments" element={<Instruments />} />
              <Route path="instruments/new" element={<RegisterInstrument />} />
              <Route path="applications" element={<Applications />} />
              <Route path="applications/new" element={<NewApplication />} />
              <Route path="applications/:id" element={<ApplicationDetail />} />
              <Route path="certificates/:id" element={<CertificateDetail />} />
              <Route path="certificates" element={<CertificateDetail />} />
              <Route path="queue" element={<Queue />} />
              <Route path="inspection/:id" element={<Inspection />} />
              <Route
                path="audit"
                element={
                  demoApi.getRole() === "admin" ? (
                    <AdminPage type="audit" />
                  ) : (
                    <AdminPage type="audit" />
                  )
                }
              />
              <Route path="users" element={<AdminPage type="users" />} />
              <Route path="rules" element={<AdminPage type="rules" />} />
              <Route
                path="repository"
                element={<AdminPage type="repository" />}
              />
              <Route
                path="analytics"
                element={<AdminPage type="analytics" />}
              />
            </Routes>
          </Shell>
        }
      />
    </Routes>
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
