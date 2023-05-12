import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
export type FileAccessDocument = FileAccess & Document;
@Schema()
export class FileAccess {
  @Prop({ required: true })
  userId: MongooseSchema.Types.ObjectId;
  @Prop({ required: false })
  accessUserId: MongooseSchema.Types.ObjectId;
  @Prop({ required: false })
  accessUserEmail: string;
  @Prop({ required: false })
  accessUserAvatar: string;
  @Prop({ required: true })
  fileId: MongooseSchema.Types.ObjectId;
  @Prop({ default: 'active', enum: ['active', 'deactivated'] })
  status: string;
  @Prop({ required: true })
  fileName: string;
  @Prop({ required: true })
  fileSize: number;
  @Prop({ required: true })
  fileType: string;
  @Prop({ required: true })
  data: string;
  @Prop({ required: true })
  secretKey: string;
  @Prop({ required: true })
  accessKey: string;
  @Prop({ required: true })
  tokenSalt: string;
  @Prop({ required: true })
  fileMetaData: MongooseSchema.Types.Mixed;
  @Prop({ required: true })
  iv: string;
  @Prop({ required: true })
  salt: string;
  @Prop({ default: Date.now() })
  createdAt: Date;
}
export const FileAccessSchema = SchemaFactory.createForClass(FileAccess);
