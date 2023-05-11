/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-var-requires */
import {
  Controller,
  Get,
  Res,
  Param,
  Req,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FileAccess, FileAccessDocument } from './file-access.entity';
import { Model } from 'mongoose';

import { HttpService } from '@nestjs/axios';

import type { Response } from 'express';
import { Readable } from 'stream';
import { firstValueFrom, map } from 'rxjs';
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
const fs = require('fs');
const crypto = require('crypto').webcrypto;
const jwt = require('jsonwebtoken');
const util = require('util');

async function generateSecretKeyForEncryption(
  secreteKeyString: string,
  userSalt: string,
) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secreteKeyString),
    { name: 'PBKDF2', hash: 'SHA-256' },
    false,
    ['deriveKey'],
  );

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode(userSalt),
      iterations: 1000,
      hash: 'SHA-256',
    },
    key,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  );
  return derivedKey;
}

const fromHexString = (hexString) =>
  Uint8Array.from(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));

const decryptedSecretKeyAndFile = async (
  data,
  secretKey,
  accessKey,
  iv,
  fileData,
  userSalt,
) => {
  const newDataArray = fromHexString(data);
  const key = await generateSecretKeyForEncryption(secretKey, userSalt);
  const encryptionKey = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new TextEncoder().encode(accessKey),
      tagLength: 128,
    },
    key,
    newDataArray,
  );

  const ecnryptionKeyForFile = await crypto.subtle.importKey(
    'raw',
    new Uint8Array(encryptionKey),
    { name: 'AES-GCM' },
    true,
    ['encrypt', 'decrypt'],
  );

  const encrtedData = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new TextEncoder().encode(iv) },
    ecnryptionKeyForFile,
    fileData,
  );
  return encrtedData;
};

@Controller('file')
export class FileController {
  constructor(
    @InjectModel(FileAccess.name)
    private fileAccessModel: Model<FileAccessDocument>,
    private readonly httpService: HttpService,
  ) {}

  @Get('access/:accessKey/play/:token?')
  async playVideo(@Res() res: Response, @Param() params, @Req() req) {
    const { accessKey, token } = params;

    const accessDataResponse = await firstValueFrom(
      this.httpService
        .post(`${process.env.API_SERVER_URL}/file/access/verify-token`, {
          accessKey,
          token,
        })
        .pipe(
          map((response) => {
            return response.data;
          }),
        ),
    );

    const accessData = accessDataResponse?.data;

    // @ts-ignore
    const ipfsMetaData = accessData.fileMetaData.sort(function (a, b) {
      return a.index - b.index;
    });

    const path = `videos/${accessData.accessKey}${accessData.fileName}`;
    if (!fs.existsSync(path)) {
      const writableStream = fs.createWriteStream(path);

      for (let i = 0; i < ipfsMetaData.length; i++) {
        const fileRespone = await firstValueFrom(
          this.httpService
            .get(
              `http://46.101.133.110:8080/api/v0/cat/${ipfsMetaData[i].cid}`,
              {
                responseType: 'arraybuffer',
              },
            )
            .pipe(
              map((response) => {
                return response.data;
              }),
            ),
        );
        const decryptedData = await decryptedSecretKeyAndFile(
          accessData.data,
          accessData.secretKey,
          accessData.accessKey,
          accessData.iv,
          fileRespone,
          accessData.salt,
        );

        writableStream.write(Buffer.from(decryptedData));
      }
      writableStream.end();
      writableStream.on('finish', () => {
        const stat = fs.statSync(path);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
          const parts = range.replace(/bytes=/, '').split('-');
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
          const chunksize = end - start + 1;
          const file = fs.createReadStream(path, { start, end });
          const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4',
          };
          res.writeHead(206, head);
          file.on('end', () => {
            fs.unlink(path, async (error) => {
              // TODO: add node authendication token.
              await firstValueFrom(
                this.httpService
                  .post(
                    `${process.env.API_SERVER_URL}/file/access/change/token-salt/${accessData._id}`,
                  )
                  .pipe(
                    map((response) => {
                      return response.data;
                    }),
                  ),
              );
            });
          });
          file.pipe(res);
        } else {
          const head = {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
          };
          res.writeHead(200, head);
          const fileReadStream = fs.createReadStream(path);
          fileReadStream.on('end', () => {
            fs.unlink(path, async (error) => {
              // TODO: add node authendication token.
              await firstValueFrom(
                this.httpService
                  .post(
                    `${process.env.API_SERVER_URL}/file/access/change/token-salt/${accessData._id}`,
                  )
                  .pipe(
                    map((response) => {
                      return response.data;
                    }),
                  ),
              );
            });
          });
          fileReadStream.pipe(res);
        }
      });
    } else {
      const stat = fs.statSync(path);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = end - start + 1;
        const file = fs.createReadStream(path, { start, end });
        const head = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': 'video/mp4',
        };
        res.writeHead(206, head);
        file.on('end', () => {
          fs.unlink(path, async (error) => {
            console.log(error);
            // TODO: add node authendication token.
            await firstValueFrom(
              this.httpService
                .post(
                  `${process.env.API_SERVER_URL}/file/access/change/token-salt/${accessData._id}`,
                )
                .pipe(
                  map((response) => {
                    return response.data;
                  }),
                ),
            );
          });
        });
        file.pipe(res);
      } else {
        const head = {
          'Content-Length': fileSize,
          'Content-Type': 'video/mp4',
        };
        res.writeHead(200, head);
        const fileReadStream = fs.createReadStream(path);
        fileReadStream.on('end', () => {
          fs.unlink(path, async (error) => {
            console.log(error);
            // TODO: add node authendication token.
            await firstValueFrom(
              this.httpService
                .post(
                  `${process.env.API_SERVER_URL}/file/access/change/token-salt/${accessData._id}`,
                )
                .pipe(
                  map((response) => {
                    return response.data;
                  }),
                ),
            );
          });
        });
        fileReadStream.pipe(res);
      }
    }
  }

  @Get('access/:accessKey/:token?')
  async getAcessFile(@Res() res: Response, @Param() params) {
    try {
      const { accessKey, token } = params;

      const accessDataResponse = await firstValueFrom(
        this.httpService
          .post(`${process.env.API_SERVER_URL}/file/access/verify-token`, {
            accessKey,
            token,
          })
          .pipe(
            map((response) => {
              return response.data;
            }),
          ),
      );

      const accessData = accessDataResponse?.data;

      await firstValueFrom(
        this.httpService
          .post(
            `${process.env.API_SERVER_URL}/file/access/change/token-salt/${accessData._id}`,
          )
          .pipe(
            map((response) => {
              return response.data;
            }),
          ),
      );
      // @ts-ignore
      const ipfsMetaData = accessData.fileMetaData.sort(function (a, b) {
        return a.index - b.index;
      });

      res.set({
        'Content-Type': accessData?.fileType,
        'Content-Disposition': `filename="${accessData.fileName}"`,
      });
      const readableStream = new Readable();
      readableStream._read = () => {};
      readableStream.pipe(res).on;

      for (let i = 0; i < ipfsMetaData.length; i++) {
        const fileRespone = await firstValueFrom(
          this.httpService
            .get(
              `http://46.101.133.110:8080/api/v0/cat/${ipfsMetaData[i].cid}`,
              {
                responseType: 'arraybuffer',
              },
            )
            .pipe(
              map((response) => {
                // console.log(response);
                return response.data;
              }),
            ),
        );

        const decryptedData = await decryptedSecretKeyAndFile(
          accessData.data,
          accessData.secretKey,
          accessData.accessKey,
          accessData.iv,
          fileRespone,
          accessData.salt,
        );

        readableStream.push(Buffer.from(decryptedData));
      }
      readableStream.push(null);
    } catch (error) {
      console.log('error ===', error);
      return res.status(HttpStatus.NOT_FOUND).send();
    }
  }
}