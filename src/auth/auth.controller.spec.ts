import { APP_GUARD } from "@nestjs/core";
import { Test, type TestingModule } from "@nestjs/testing";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { RolesGuard } from "./guards/roles.guard";

describe("AuthController", () => {
	let controller: AuthController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }])],
			controllers: [AuthController],
			providers: [
				{
					provide: AuthService,
					useValue: {},
				},
				{
					provide: APP_GUARD,
					useClass: ThrottlerGuard,
				},
			],
		})
			.overrideGuard(RolesGuard)
			.useValue({ canActivate: () => true })
			.compile();

		controller = module.get<AuthController>(AuthController);
	});

	it("should be defined", () => {
		expect(controller).toBeDefined();
	});

	it("should have @Throttle metadata on login with limit 5 / ttl 60000", () => {
		const limit = Reflect.getMetadata(
			"THROTTLER:LIMITdefault",
			controller.login,
		);
		const ttl = Reflect.getMetadata(
			"THROTTLER:TTLdefault",
			controller.login,
		);

		expect(limit).toBe(5);
		expect(ttl).toBe(60000);
	});

	it("should have @Throttle metadata on register with limit 3 / ttl 3600000", () => {
		const limit = Reflect.getMetadata(
			"THROTTLER:LIMITdefault",
			controller.register,
		);
		const ttl = Reflect.getMetadata(
			"THROTTLER:TTLdefault",
			controller.register,
		);

		expect(limit).toBe(3);
		expect(ttl).toBe(3600000);
	});

	it("should have @Throttle metadata on forgotPassword with limit 3 / ttl 3600000", () => {
		const limit = Reflect.getMetadata(
			"THROTTLER:LIMITdefault",
			controller.forgotPassword,
		);
		const ttl = Reflect.getMetadata(
			"THROTTLER:TTLdefault",
			controller.forgotPassword,
		);

		expect(limit).toBe(3);
		expect(ttl).toBe(3600000);
	});
});
