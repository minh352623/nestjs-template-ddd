"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniqueEntityID = exports.AggregateRoot = exports.Entity = void 0;
/**
 * Base Entity class for all domain entities
 * Provides identity equality and domain events support
 */
class Entity {
    constructor(id) {
        this._domainEvents = [];
        this._id = id;
    }
    get id() {
        return this._id;
    }
    get domainEvents() {
        return [...this._domainEvents];
    }
    addDomainEvent(event) {
        this._domainEvents.push(event);
    }
    clearEvents() {
        this._domainEvents = [];
    }
    equals(entity) {
        if (entity === null || entity === undefined) {
            return false;
        }
        if (this === entity) {
            return true;
        }
        return this._id === entity._id;
    }
}
exports.Entity = Entity;
/**
 * Base class for Aggregate Roots
 * Aggregate roots are the only entry point to the aggregate
 */
class AggregateRoot extends Entity {
    constructor() {
        super(...arguments);
        this._version = 0;
    }
    get version() {
        return this._version;
    }
    incrementVersion() {
        this._version++;
    }
}
exports.AggregateRoot = AggregateRoot;
/**
 * Unique Entity ID Value Object
 */
class UniqueEntityID {
    constructor(id) {
        this.value = id ?? crypto.randomUUID();
    }
    toString() {
        return this.value;
    }
    equals(id) {
        if (id === null || id === undefined) {
            return false;
        }
        return this.value === id.value;
    }
}
exports.UniqueEntityID = UniqueEntityID;
//# sourceMappingURL=base.entity.js.map