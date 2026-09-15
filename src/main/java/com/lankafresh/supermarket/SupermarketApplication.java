package com.lankafresh.supermarket;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@SpringBootApplication
@RestController
public class SupermarketApplication {

	public static void main(String[] args) {
		SpringApplication.run(SupermarketApplication.class, args);
	}

	@GetMapping(value = "/", produces = "text/html")
	public String rootHtml() {
		return """
			<!DOCTYPE html>
			<html>
			<head>
				<title>LankaFresh Supermarket Backend</title>
				<meta http-equiv="refresh" content="1;url=http://localhost:8080" />
				<style>
					body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; }
					.card { background: white; padding: 2.5rem; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: center; max-width: 480px; }
					.badge { display: inline-block; padding: 0.35rem 0.8rem; background: #dcfce7; color: #166534; border-radius: 999px; font-weight: 600; font-size: 0.875rem; margin-bottom: 1rem; }
					h1 { margin: 0 0 0.5rem; font-size: 1.5rem; color: #0f172a; }
					p { color: #64748b; margin: 0 0 1.5rem; line-height: 1.5; font-size: 0.95rem; }
					a.btn { display: inline-block; background: #16a34a; color: white; padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 1rem; }
					a.btn:hover { background: #15803d; }
				</style>
			</head>
			<body>
				<div class="card">
					<div class="badge">&#10004; Backend Online &bull; MS SQL Server Express</div>
					<h1>LankaFresh Supermarket</h1>
					<p>Backend API is active on port 8081.<br>Redirecting you to the frontend storefront...</p>
					<a class="btn" href="http://localhost:8080">Go to Store (http://localhost:8080)</a>
				</div>
			</body>
			</html>
		""";
	}

	@GetMapping(value = "/", produces = "application/json")
	public ResponseEntity<Map<String, Object>> rootJson() {
		return ResponseEntity.ok(Map.of(
			"status", "ONLINE",
			"database", "Microsoft SQL Server Express 2022 (lankafresh_db)",
			"message", "LankaFresh Supermarket Backend is running!",
			"endpoints", Map.of(
				"products", "/api/products",
				"categories", "/api/categories",
				"auth", "/api/auth/login"
			),
			"frontendUrl", "http://localhost:8080"
		));
	}

}
