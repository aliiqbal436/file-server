/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class FileAccessDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsOptional()
  accessUserId: string;

  @IsEmail()
  @IsOptional()
  accessUserEmail: string;

  @IsUrl()
  @IsOptional()
  accessUserAvatar: string;

  @IsString()
  @IsNotEmpty()
  fileId: string;

  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsString()
  @IsNotEmpty()
  fileType: string;

  @IsNumber()
  @IsNotEmpty()
  fileSize: number;

  @IsNotEmpty()
  data: string;

  @IsString()
  @IsNotEmpty()
  secretKey: string;

  @IsNotEmpty()
  accessKey: string;

  @IsNotEmpty()
  fileMetaData: any;

  @IsNotEmpty()
  iv: string;

  @IsNotEmpty()
  @IsString()
  salt: string;

  @IsOptional()
  @IsString()
  tokenSalt: string;
}
