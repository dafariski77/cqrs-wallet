import { Injectable } from '@nestjs/common';

@Injectable()
export class UserWalletServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
