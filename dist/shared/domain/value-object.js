"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValueObject = void 0;
/**
 * Base Value Object class
 * Value Objects are immutable and compared by their properties
 */
class ValueObject {
    constructor(props) {
        this.props = Object.freeze(props);
    }
    equals(vo) {
        if (vo === null || vo === undefined) {
            return false;
        }
        return JSON.stringify(this.props) === JSON.stringify(vo.props);
    }
}
exports.ValueObject = ValueObject;
//# sourceMappingURL=value-object.js.map