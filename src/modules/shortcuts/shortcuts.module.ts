import { WorkspacesModule } from './../workspaces/workspaces.module';
import { Shortcut, ShortcutSchema } from './schemas/shortcut.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { ShortcutsService } from './shortcuts.service';
import { ShortcutsController } from './shortcuts.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Shortcut.name, schema: ShortcutSchema },
    ]),
    WorkspacesModule,
  ],
  controllers: [ShortcutsController],
  providers: [ShortcutsService],
})
export class ShortcutsModule {}
