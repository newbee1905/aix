const mockPrisma = {
	user: {
		create: jest.fn(),
		findUnique: jest.fn(),
		findMany: jest.fn(),
		delete: jest.fn(),
		update: jest.fn(),
	},
	post: {
		create: jest.fn(),
		findUnique: jest.fn(),
		findMany: jest.fn(),
		delete: jest.fn(),
		update: jest.fn(),
	},
	comment: {
		create: jest.fn(),
		findUnique: jest.fn(),
		findMany: jest.fn(),
		delete: jest.fn(),
		update: jest.fn(),
	},
	blacklist: {
		create: jest.fn(),
		findUnique: jest.fn(),
		findMany: jest.fn(),
		delete: jest.fn(),
		update: jest.fn(),
	},
};

export default mockPrisma;
