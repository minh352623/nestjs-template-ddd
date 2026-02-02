"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const base_entity_1 = require("../../../../../shared/domain/base.entity");
const result_1 = require("../../../../../shared/domain/result");
/**
 * User Entity (Aggregate Root)
 * Pure domain entity with business invariants
 */
class User extends base_entity_1.AggregateRoot {
    constructor(id, props) {
        super(id);
        this._email = props.email;
        this._name = props.name;
        this._password = props.password;
        this._createdAt = props.createdAt;
        this._updatedAt = props.updatedAt;
    }
    // Getters
    get email() {
        return this._email;
    }
    get name() {
        return this._name;
    }
    get password() {
        return this._password;
    }
    get createdAt() {
        return this._createdAt;
    }
    get updatedAt() {
        return this._updatedAt;
    }
    /**
     * Factory method - Create new User with validation
     */
    static create(props) {
        // Validate email
        if (!props.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(props.email)) {
            return result_1.Result.fail(new Error('Invalid email format'));
        }
        // Validate name
        if (!props.name || props.name.trim().length < 2) {
            return result_1.Result.fail(new Error('Name must be at least 2 characters'));
        }
        // Validate password
        if (!props.password || props.password.length < 8) {
            return result_1.Result.fail(new Error('Password must be at least 8 characters'));
        }
        const userId = props.id ?? crypto.randomUUID();
        const user = new User(userId, {
            email: props.email.toLowerCase().trim(),
            name: props.name.trim(),
            password: props.password,
            createdAt: new Date(),
        });
        return result_1.Result.ok(user);
    }
    /**
     * Reconstitute from persistence (no validation)
     */
    static reconstitute(props) {
        return new User(props.id, {
            email: props.email,
            name: props.name,
            password: props.password,
            createdAt: props.createdAt,
            updatedAt: props.updatedAt,
        });
    }
    /**
     * Update email
     */
    updateEmail(email) {
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return result_1.Result.fail(new Error('Invalid email format'));
        }
        this._email = email.toLowerCase().trim();
        this._updatedAt = new Date();
        this.incrementVersion();
        return result_1.Result.ok(undefined);
    }
    /**
     * Update name
     */
    updateName(name) {
        if (!name || name.trim().length < 2) {
            return result_1.Result.fail(new Error('Name must be at least 2 characters'));
        }
        this._name = name.trim();
        this._updatedAt = new Date();
        this.incrementVersion();
        return result_1.Result.ok(undefined);
    }
    /**
     * Update password (already hashed)
     */
    updatePassword(hashedPassword) {
        this._password = hashedPassword;
        this._updatedAt = new Date();
        this.incrementVersion();
    }
}
exports.User = User;
//# sourceMappingURL=user.entity.js.map