import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class ChatMessage {
    @Prop() room: string;
    @Prop() user: string;
    @Prop() text: string;
    @Prop() timestamp: number;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);
