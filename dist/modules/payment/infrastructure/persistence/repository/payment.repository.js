"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaPaymentRepository = void 0;
const common_1 = require("@nestjs/common");
/**
 * In-Memory Payment Repository (for demo purposes)
 * Replace with PrismaPaymentRepository in production
 */
let PrismaPaymentRepository = class PrismaPaymentRepository {
    constructor() {
        this.payments = new Map();
    }
    async save(payment) {
        this.payments.set(payment.id, payment);
    }
    async findById(id) {
        return this.payments.get(id) || null;
    }
    async findByUserId(userId) {
        const result = [];
        for (const payment of this.payments.values()) {
            if (payment.userId === userId) {
                result.push(payment);
            }
        }
        return result;
    }
    async delete(id) {
        this.payments.delete(id);
    }
};
exports.PrismaPaymentRepository = PrismaPaymentRepository;
exports.PrismaPaymentRepository = PrismaPaymentRepository = __decorate([
    (0, common_1.Injectable)()
], PrismaPaymentRepository);
//# sourceMappingURL=payment.repository.js.map