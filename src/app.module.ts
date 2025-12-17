// Root module wires DI across layers using tokens to preserve inversion of control
import { Module } from "@nestjs/common";
import { UserModule } from "./modules/user/user.module";

@Module({
  imports: [UserModule],
})
export class AppModule {}
