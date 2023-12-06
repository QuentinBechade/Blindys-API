import { JwtService } from '@nestjs/jwt';

const jwtService = new JwtService({
  secret: process.env.JWT_SECRET,
  signOptions: { expiresIn: '5m' },
});
export const generateAccessToken = (id: string) => {
  return jwtService.signAsync({ userId: id });
};

export const generateRefreshToken = (id: string) => {
  return jwtService.signAsync({ userId: id }, { expiresIn: '30d' });
};

export const decodeToken = (token: string) => {
  return jwtService.decode(token);
};

export const isValidateToken = (token: string): boolean => {
  try {
    jwtService.verify(token, { secret: process.env.JWT_SECRET });
    return true;
  } catch (error) {
    return false;
  }
};
