import { readFileSync } from "fs";
import { resolve } from "path";

interface PackageJson {
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
}

function loadPackageJson(): PackageJson {
	const pkgPath = resolve(__dirname, "..", "package.json");
	const raw = readFileSync(pkgPath, "utf-8");
	return JSON.parse(raw) as PackageJson;
}

const RUNTIME_DEPENDENCIES = [
	"@nestjs/config",
	"@nestjs/jwt",
	"@nestjs/passport",
	"@nestjs/typeorm",
	"bcrypt",
	"class-transformer",
	"class-validator",
	"nodemailer",
	"passport",
	"passport-jwt",
	"pg",
	"typeorm",
] as const;

describe("Runtime dependency classification", () => {
	const pkg = loadPackageJson();

	it("has a dependencies field", () => {
		expect(pkg.dependencies).toBeDefined();
	});

	it("has a devDependencies field", () => {
		expect(pkg.devDependencies).toBeDefined();
	});

	for (const dep of RUNTIME_DEPENDENCIES) {
		it(`lists "${dep}" in dependencies`, () => {
			expect(pkg.dependencies).toHaveProperty(dep);
		});

		it(`does NOT list "${dep}" in devDependencies`, () => {
			expect(pkg.devDependencies).not.toHaveProperty(dep);
		});
	}

	it("keeps @nestjs/common in dependencies (sanity check — it should stay)", () => {
		expect(pkg.dependencies).toHaveProperty("@nestjs/common");
	});

	it("keeps @nestjs/cli in devDependencies (sanity check — it should stay)", () => {
		expect(pkg.devDependencies).toHaveProperty("@nestjs/cli");
	});

	it("keeps TypeScript in devDependencies (sanity check — it should stay)", () => {
		expect(pkg.devDependencies).toHaveProperty("typescript");
	});
});
