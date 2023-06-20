import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';

import * as fs from 'fs';

import * as os from 'os';
import { first, firstValueFrom, map } from 'rxjs';

// Uncomment this only for LocalHost
// process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

@Injectable()
export class FileService {
  constructor(
    private readonly httpService: HttpService,
    private readonly jwtService: JwtService,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  getIpAddress() {
    const interfaces = os.networkInterfaces();

    const addresses = [];

    for (const interfaceName of Object.keys(interfaces)) {
      for (const iface of interfaces[interfaceName]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          addresses.push(iface.address);
        }
      }
    }

    return addresses;
  }

  async getIpfsId() {
    try {
      const ipfsNodeInformation = await firstValueFrom(
        this.httpService
          .post('http://localhost:5001/api/v0/id')
          .pipe(map((response) => response.data)),
      );
      return ipfsNodeInformation;
    } catch (err) {
      console.error(
        'file: file.service.ts:37 ~ AppService ~ getIpfsId ~ err:',
        err,
      );
      return null;
    }
  }

  async getClusterId() {
    try {
      const ipfsClusterResponse = await firstValueFrom(
        this.httpService
          //TODO: Replace this cluster URL with http://localhost:port
          // .get('https://46.101.133.110:9094/id')
          .get('http://localhost:9094/id')
          .pipe(map((response) => response?.data)),
      );
      return ipfsClusterResponse;
    } catch (err) {
      console.error(
        'file: file.service.ts:56 ~ AppService ~ getClusterId ~ err:',
        err,
      );
      return null;
    }
  }

  async saveNodeOsDetails() {
    try {
      // IP Address
      const ipAddresses = this.getIpAddress();
      console.log(
        'file: file.service.ts:76 ~ FileService ~ saveNodeOsDetails ~ ipAddresses:',
        ipAddresses,
      );
      // IPFS ID
      const ipfsId = await this.getIpfsId();
      console.log(
        'file: file.service.ts:75 ~ FileService ~ saveNodeOsDetails ~ ipfsId:',
        ipfsId?.ID,
      );

      // IPFS Cluster Id
      const ipfsClusterId = await this.getClusterId();
      console.log(
        'file: file.service.ts:86 ~ FileService ~ saveNodeOsDetails ~ ipfsClusterId:',
        ipfsClusterId?.id,
      );

      // System name
      const systemName = os.hostname();
      console.log(
        'file: file.service.ts:95 ~ FileService ~ saveNodeOsDetails ~ systemName:',
        systemName,
      );

      const addNodeResponse = await firstValueFrom(
        this.httpService
          .post(`${process.env.API_SERVER_URL}/node/os-info`, {
            ipAddress: ipAddresses[0],
            name: systemName,
            ipfsClusterId: ipfsClusterId?.id,
            ipfsId: ipfsId?.ID,
            totalStorage: parseInt(process.env.TOTAL_STORAGE),
          })
          .pipe(map((response) => response?.data)),
      );

      console.log(
        'file: file.service.ts:111 ~ FileService ~ saveNodeOsDetails ~ addNodeResponse:',
        addNodeResponse,
      );

      if (addNodeResponse?.success) {
        const authToken = this.jwtService.sign(addNodeResponse?.data);
        fs.writeFileSync(
          'src/config/node-config.json',
          JSON.stringify({ authToken, ...addNodeResponse?.data }),
          'utf8',
        );
      }
    } catch (err) {
      console.error(
        'file: file.service.ts:14 ~ AppService ~ saveNodeOsDetails ~ err:',
        err?.message,
      );
      return {
        success: false,
        message: err.message,
      };
    }
  }
}
