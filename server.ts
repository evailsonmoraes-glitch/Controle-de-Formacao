import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON and URL-encoded body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Route to proxy Google Sheets CSV loading securely and cross-origin free
  app.get("/api/proxy-sheet", async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "Parâmetro URL da planilha é obrigatório." });
    }

    try {
      // Basic validation that it targets google docs sheets
      if (!url.includes("docs.google.com/spreadsheets")) {
        return res.status(400).json({ error: "URL inválida. Somente carregamentos do Google Planilhas são autorizados." });
      }

      console.log(`[Proxy] Buscando dados da planilha: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          return res.status(401).json({
            error: "Esta planilha é privada e exige login (Erro 401/403). Para corrigir, abra a sua planilha, clique em 'Compartilhar' no canto superior direito e mude o Acesso Geral para 'Qualquer pessoa com o link' (como Leitor)."
          });
        }
        return res.status(response.status).json({ 
          error: `Erro ao conectar com os servidores do Google. Código: ${response.status}. Verifique se a planilha está compartilhada publicamente.` 
        });
      }

      const text = await response.text();

      // Check if we got redirected to sign in or HTML error page
      if (!text || text.includes('Sign in - Google Accounts') || text.includes('<!DOCTYPE html>')) {
        return res.status(401).json({ 
          error: "Esta planilha não está pública. No Google Planilhas, clique em 'Compartilhar' e mude o Acesso Geral para 'Qualquer pessoa com o link' (como Leitor)." 
        });
      }

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      return res.send(text);
    } catch (error: any) {
      console.error("[Proxy Error]", error);
      return res.status(500).json({ 
        error: `Falha de rede/conexão no servidor: ${error.message || "Conexão recusada"}` 
      });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    console.log("[Server] Modo de Desenvolvimento Ativo. Iniciando Vite...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("[Server] Modo de Produção Ativo. Servindo arquivos estáticos...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Running] Servidor rodando com sucesso no endereço http://0.0.0.0:${PORT}`);
  });
}

startServer();
