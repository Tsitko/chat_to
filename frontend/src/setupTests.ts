/**
 * Test setup file for vitest.
 *
 * This file is automatically loaded before tests run.
 * It configures testing utilities and global test environment.
 */

import '@testing-library/jest-dom';
import { expect, afterEach, vi, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import axios from 'axios';

// Mock axios globally before any modules are imported
vi.mock('axios');

beforeEach(() => {
  // Setup default axios.create mock
  const mockedAxios = vi.mocked(axios, true);
  mockedAxios.create = vi.fn().mockReturnValue({
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
    defaults: { baseURL: '/api' },
  } as any);
});

// Cleanup after each test case
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock window.scrollTo globally
global.scrollTo = vi.fn();
