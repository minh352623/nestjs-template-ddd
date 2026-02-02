"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserMapper = void 0;
const user_entity_1 = require("../../../domain/model/entity/user.entity");
/**
 * User Mapper
 * Handles conversion between domain entity and persistence model
 */
class UserMapper {
    /**
     * Convert persistence model to domain entity
     */
    static toDomain(model) {
        return user_entity_1.User.reconstitute({
            id: model.id,
            email: model.email,
            name: model.name,
            password: model.password,
            createdAt: model.createdAt,
        });
    }
    /**
     * Convert domain entity to persistence model
     */
    static toPersistence(entity) {
        return {
            id: entity.id,
            email: entity.email,
            name: entity.name,
            password: entity.password,
            createdAt: entity.createdAt,
        };
    }
}
exports.UserMapper = UserMapper;
//# sourceMappingURL=user.mapper.js.map