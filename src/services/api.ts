const roleKey = "maapsetu-demo-role";
const userKey = "maapsetu-demo-user";

export const demoApi = {
  setRole(role: string) {
    window.sessionStorage.setItem(roleKey, role);
  },
  getRole(): string {
    return window.sessionStorage.getItem(roleKey) || "owner";
  },
  setUser(user: any) {
    window.sessionStorage.setItem(userKey, JSON.stringify(user));
  },
  getUser(): any {
    try {
      const raw = window.sessionStorage.getItem(userKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  clearSession() {
    window.sessionStorage.removeItem(roleKey);
    window.sessionStorage.removeItem(userKey);
  },

  async get(path: string) {
    try {
      const url = path.startsWith("/api") ? path : `/api${path.startsWith("/") ? path : "/" + path}`;
      const res = await fetch(url, {
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        return { data };
      }
    } catch (err) {
      console.warn(`GET ${path} failed, falling back to local state`, err);
    }
    return { data: { path, synthetic: true } };
  },

  async post(path: string, payload: any) {
    try {
      const url = path.startsWith("/api") ? path : `/api${path.startsWith("/") ? path : "/" + path}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        return { data, success: true };
      } else {
        return { error: data?.error || `Request failed with status ${res.status}`, data, success: false };
      }
    } catch (err: any) {
      console.warn(`POST ${path} failed`, err);
      return { error: err?.message || "Network request failed", data: null, success: false };
    }
  },

  // Auth & OTP
  async sendOtp(emailOrPhone: string) {
    return this.post("/auth/send-otp", { emailOrPhone });
  },

  async loginWithOtp(role: string, emailOrPhone: string, otp: string) {
    return this.post("/auth/login", { role, email: emailOrPhone, otp });
  },

  // Instruments
  async getInstruments() {
    return this.get("/instruments");
  },

  async createInstrument(data: any) {
    return this.post("/instruments", data);
  },

  // Applications
  async getApplications(assignedOnly = false) {
    return this.get(`/applications${assignedOnly ? "?assignedOnly=true" : ""}`);
  },

  async submitApplication(data: any) {
    return this.post("/applications", data);
  },

  // Payments
  async checkoutPayment(instrumentType: string, serialNumber: string) {
    return this.post("/payments/checkout", { instrumentType, serialNumber });
  },

  // File / Photo Uploads
  async uploadPhoto(dataUrl: string, filename?: string) {
    return this.post("/upload", { dataUrl, filename });
  },

  // Field Inspections
  async submitInspection(data: any) {
    return this.post("/inspections", data);
  },

  // Certificates & PDF
  async getCertificates() {
    return this.get("/certificates");
  },

  getCertificatePdfUrl(certIdOrNumber: string) {
    return `/api/certificates/${encodeURIComponent(certIdOrNumber)}/pdf`;
  },

  async verifyCertificate(query: string) {
    return this.get(`/verify/${encodeURIComponent(query)}`);
  },

  // Rules, Audit & Analytics
  async getRules() {
    return this.get("/rules");
  },

  async updateRules(rules: any) {
    try {
      const res = await fetch("/api/rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rules),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("PUT /api/rules failed", e);
    }
    return { success: true };
  },

  async getAuditLogs() {
    return this.get("/audit");
  },

  async getAnalytics() {
    return this.get("/analytics");
  },
};
