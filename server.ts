import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Config body parsing middleware
  app.use(express.json());

  // API Route - Proxy to secure validation with Mercado Livre
  app.get("/api/meli/users/me", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: "Authorization header is missing" });
      }

      const response = await fetch("https://api.mercadolibre.com/users/me", {
        headers: {
          "Authorization": authHeader
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText };
        }
        return res.status(response.status).json(errorData);
      }

      const data = await response.json();
      return res.json(data);
    } catch (error: any) {
      console.error("Error proxying to Mercado Libre:", error);
      return res.status(500).json({ message: `Physical network/CORS error proxying to Mercado Livre: ${error.message || error}` });
    }
  });

  // API Route - Proxy Secure OAuth 2.0 Token Exchange and Refresh
  app.post("/api/meli/oauth/token", async (req, res) => {
    try {
      const { grant_type, client_id, client_secret, code, redirect_uri, refresh_token } = req.body;

      if (!grant_type) {
        return res.status(400).json({ message: "grant_type is required" });
      }

      const params = new URLSearchParams();
      params.append("grant_type", grant_type);
      params.append("client_id", String(client_id || ''));
      params.append("client_secret", String(client_secret || ''));

      if (grant_type === "authorization_code") {
        if (!code || !redirect_uri) {
          return res.status(400).json({ message: "code and redirect_uri are required for authorization_code grant" });
        }
        params.append("code", code);
        params.append("redirect_uri", redirect_uri);
      } else if (grant_type === "refresh_token") {
        if (!refresh_token) {
          return res.status(400).json({ message: "refresh_token is required for refresh_token grant" });
        }
        params.append("refresh_token", refresh_token);
      }

      const response = await fetch("https://api.mercadolibre.com/oauth/token", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params.toString()
      });

      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json(data);
      }

      return res.json(data);
    } catch (error: any) {
      console.error("Error proxying token exchange to Mercado Livre:", error);
      return res.status(500).json({ message: `Physical network error during token exchange with Mercado Livre: ${error.message || error}` });
    }
  });

  // API Route - Proxy public search endpoint
  app.get("/api/meli/search", async (req, res) => {
    try {
      const { siteId, q, limit } = req.query;
      if (!siteId) {
        return res.status(400).json({ message: "siteId parameter is required" });
      }
      const cleanQuery = encodeURIComponent(String(q || ''));
      const url = `https://api.mercadolibre.com/sites/${siteId}/search?q=${cleanQuery}&limit=${limit || 24}`;

      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText };
        }
        return res.status(response.status).json(errorData);
      }

      const data = await response.json();
      return res.json(data);
    } catch (error: any) {
      console.error("Error proxying search to Mercado Livre:", error);
      return res.status(500).json({ message: `Physical network/CORS error proxying search to Mercado Livre: ${error.message || error}` });
    }
  });

  // Serve Vite in development / production mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server loaded as Express middleware.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Static production assets mounted from dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
