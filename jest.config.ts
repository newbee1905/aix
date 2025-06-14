/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type {Config} from 'jest';

const config: Config = {
	testEnvironment: "jsdom",
	clearMocks: true,
	collectCoverage: true,
	coverageDirectory: "coverage",
	coverageProvider: 'v8',
	transform: {
		'^.+\\.tsx?$': 'ts-jest',
	},
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  reporters: [
    "default",
    [
      "jest-junit",
      {
        outputDirectory: ".",
        outputName: "test-results.xml",
      },
    ],
  ],
	coverageReporters: [
		"json-summary",
		"lcov",
	],
};

export default config;
