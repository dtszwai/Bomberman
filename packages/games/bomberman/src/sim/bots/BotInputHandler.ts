import type { InputHandler } from "@arcade/realtime-core";
import { EMPTY_BOT_COMMAND, type BotCommand } from "./BotTypes";

export class BotInputHandler implements InputHandler {
  private command: BotCommand = EMPTY_BOT_COMMAND;

  public setCommand(command: BotCommand) {
    this.command = command;
  }

  public clearOneShotInputs() {
    this.command = { ...this.command, action: false };
  }

  public isLeft = () => this.command.left;
  public isRight = () => this.command.right;
  public isUp = () => this.command.up;
  public isDown = () => this.command.down;
  public isAction = () => this.command.action;
}
