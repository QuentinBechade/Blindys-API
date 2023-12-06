import { ApiProperty } from '@nestjs/swagger';

export class AuthEntity {
  constructor(partial: Partial<AuthEntity>) {
    Object.assign(this, partial);
  }
  @ApiProperty()
  id: string;

  @ApiProperty()
  userName: string;

  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  lookupKey: string;
}
