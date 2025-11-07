/**
 * Transaction Runner Utility
 *
 * Since Supabase JS client doesn't support native transactions,
 * we use a compensation pattern: execute operations and rollback on failure.
 *
 * For true atomicity, use database RPC functions (see db/functions/).
 * This utility provides a service-layer transaction-like pattern.
 */
import { supabase } from '../../config/database.js';
import logger from '../../config/logger.js';

export class TransactionRunner {
  constructor() {
    this.operations = [];
    this.compensations = [];
  }

  /**
   * Add an operation to the transaction
   * @param {Function} operation - Async function that performs the operation
   * @param {Function} compensation - Async function that undoes the operation
   * @returns {Promise<any>} Result of the operation
   */
  async add(operation, compensation = null) {
    try {
      const result = await operation();
      this.operations.push({ result });
      if (compensation) {
        this.compensations.push(compensation);
      }
      return result;
    } catch (error) {
      // Rollback all previous operations
      await this.rollback();
      throw error;
    }
  }

  /**
   * Rollback all operations in reverse order
   */
  async rollback() {
    const errors = [];
    // Execute compensations in reverse order
    for (let i = this.compensations.length - 1; i >= 0; i--) {
      try {
        await this.compensations[i]();
      } catch (error) {
        errors.push(error);
        logger.error(`[TransactionRunner] Compensation ${i} failed:`, error);
      }
    }
    this.operations = [];
    this.compensations = [];

    if (errors.length > 0) {
      throw new Error(`Rollback completed with ${errors.length} errors`);
    }
  }

  /**
   * Execute all operations in sequence
   * If any fails, rollback all previous operations
   */
  async execute() {
    try {
      // Operations are already executed in add()
      return {
        success: true,
        results: this.operations.map((op) => op.result),
      };
    } catch (error) {
      await this.rollback();
      throw error;
    }
  }

  /**
   * Clear all operations (for reuse)
   */
  clear() {
    this.operations = [];
    this.compensations = [];
  }
}

/**
 * Execute operations with automatic rollback on failure
 * @param {Array<{operation: Function, compensation?: Function}>} operations
 * @returns {Promise<Array>} Results of all operations
 */
export async function executeTransaction(operations) {
  const runner = new TransactionRunner();
  const results = [];

  try {
    for (const { operation, compensation } of operations) {
      const result = await runner.add(operation, compensation);
      results.push(result);
    }
    return results;
  } catch (error) {
    await runner.rollback();
    throw error;
  }
}

/**
 * For true atomicity, use database RPC functions
 * This helper creates a database function call for atomic operations
 */
export async function executeAtomicRPC(functionName, params = {}) {
  const { data, error } = await supabase.rpc(functionName, params);

  if (error) {
    throw new Error(`RPC ${functionName} failed: ${error.message}`);
  }

  return data;
}
