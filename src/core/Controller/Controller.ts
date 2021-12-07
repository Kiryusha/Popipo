import { Model } from '../Model'
import { MDataTypes } from '../../types'

export default class Controller {
  constructor(private model: Model) {}

  public handleLoginButtonClick(inputValue: string): void {
    if (inputValue) {
      this.model.name = inputValue
      this.model.sendMessage({
        type: MDataTypes.login,
        name: this.model.name,
      })
    }
  }

  public handleCallButtonClick(inputValue: string): void {
    if (inputValue) {
      this.model.startPeerConnection(inputValue).catch((e) => console.log(e))
    }
  }

  public handleHangUpButtonClick(): void {
    if (!this.model.guest) return

    this.model.sendMessage({ type: MDataTypes.leave })
    this.model.handleMessageLeave()
  }
}
