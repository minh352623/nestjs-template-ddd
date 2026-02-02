"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Result = void 0;
/**
 * Result Pattern for handling success/failure without exceptions
 * Inspired by functional programming Either monad
 */
class Result {
    constructor(isSuccess, value, error) {
        this._isSuccess = isSuccess;
        this._value = value;
        this._error = error;
    }
    get isSuccess() {
        return this._isSuccess;
    }
    get isFailure() {
        return !this._isSuccess;
    }
    get value() {
        if (!this._isSuccess) {
            throw new Error('Cannot get value of a failed result');
        }
        return this._value;
    }
    get error() {
        if (this._isSuccess) {
            throw new Error('Cannot get error of a successful result');
        }
        return this._error;
    }
    static ok(value) {
        return new Result(true, value);
    }
    static fail(error) {
        return new Result(false, undefined, error);
    }
    static combine(results) {
        for (const result of results) {
            if (result.isFailure) {
                return Result.fail(result.error);
            }
        }
        return Result.ok(results.map((r) => r.value));
    }
    map(fn) {
        if (this.isFailure) {
            return Result.fail(this._error);
        }
        return Result.ok(fn(this._value));
    }
    flatMap(fn) {
        if (this.isFailure) {
            return Result.fail(this._error);
        }
        return fn(this._value);
    }
}
exports.Result = Result;
//# sourceMappingURL=result.js.map