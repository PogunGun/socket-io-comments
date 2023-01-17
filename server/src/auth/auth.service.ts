import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UsersService } from 'src/users/users.service';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthDto } from './dto/auth.dto';
import { PrismaService } from '../prisma/prisma.service';
import {
  ALREADY_USER_ERROR,
  USER_NOT_FOUND,
  USER_WRONG_PASSWORD,
} from './auth.constants';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private prismaService: PrismaService,
  ) {}

  async signUp(createUserDto: CreateUserDto): Promise<any> {
    // Check if user exists
    const userExists = await this.usersService.findByEmail(createUserDto.email);
    if (userExists) {
      throw new BadRequestException(ALREADY_USER_ERROR);
    }

    // Hash password
    const hash = await this.hashData(createUserDto.password);
    const newUser = await this.usersService.create({
      ...createUserDto,
      password: hash,
    });

    const tokens = await this.getTokens(
      newUser.id,
      newUser.email,
      newUser.name,
    );

    await this.updateRefreshToken(newUser.id, tokens.refreshToken);
    return { tokens: tokens, id: newUser.id };
  }

  async signIn(data: AuthDto) {
    // Check if user exists
    const user = await this.usersService.findByEmail(data.email);

    if (!user) {
      throw new UnauthorizedException(USER_NOT_FOUND);
    }
    const passwordMatches = await argon2.verify(user.password, data.password);

    if (!passwordMatches) {
      throw new UnauthorizedException(USER_WRONG_PASSWORD);
    }
    const tokens = await this.getTokens(user.id, user.email, user.name);

    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return { tokens: tokens, id: user.id };
  }

  async logout(userId: string) {
    return this.prismaService.user.update({
      where: {
        id: userId,
      },
      data: {
        refreshToken: null,
      },
    });
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.refreshToken) {
      throw new ForbiddenException('Access Denied');
    }
    const refreshTokenMatches = await argon2.verify(
      user.refreshToken,
      refreshToken,
    );
    if (!refreshTokenMatches) {
      throw new ForbiddenException('Access Denied');
    }
    const tokens = await this.getTokens(user.id, user.email, user.name);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return { tokens: tokens, id: user.id };
  }

  async hashData(data: string) {
    return argon2.hash(data);
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await argon2.hash(refreshToken);
    await this.prismaService.user.update({
      where: {
        id: userId,
      },
      data: {
        refreshToken: hashedRefreshToken,
      },
    });
  }

  async verifyUser(authToken) {
    const verify = await this.jwtService.verifyAsync(authToken, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
    });
    return verify;
  }

  async getTokens(userId: string, email: string, name: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
          name,
        },
        {
          secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
          expiresIn: '3d',
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
          name,
        },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: '30d',
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
