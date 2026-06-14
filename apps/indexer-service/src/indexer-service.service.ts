import { Injectable } from '@nestjs/common';

@Injectable()
export class IndexerServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
