import { Model } from '../Model'
import { Controller } from '../Controller'
import { PageStates, ModelEvents } from '../../types'

export default class View {
  loginPage = document.getElementById('login-page')
  callPage = document.getElementById('call-page')

  usernameInput = document.getElementById('username') as HTMLInputElement
  guestInput = document.getElementById('guest') as HTMLInputElement

  loginButton = document.getElementById('login')
  callButton = document.getElementById('call')
  hangUpButton = document.getElementById('hang-up')

  ownerPlayer = document.getElementById('owner-player') as HTMLVideoElement
  guestPlayer = document.getElementById('guest-player') as HTMLVideoElement

  constructor(private model: Model, private controller: Controller) {
    this.subscribeToEvents()
    this.updatePageVisibility()
  }

  subscribeToEvents(): void {
    this.model.bus.subscribe(
      ModelEvents.pageStateUpdate,
      this.handleModelPageStartUpdate.bind(this)
    )
    this.model.bus.subscribe(
      ModelEvents.startConnection,
      this.handleModelStartConnection.bind(this)
    )
    this.model.bus.subscribe(
      ModelEvents.addStream,
      this.handleModelAddStream.bind(this)
    )
    this.loginButton?.addEventListener('click', () =>
      this.controller.handleLoginButtonClick(this.usernameInput?.value)
    )
    this.callButton?.addEventListener('click', () =>
      this.controller.handleCallButtonClick(this.guestInput?.value)
    )
    this.hangUpButton?.addEventListener(
      'click',
      this.handleHangUpButtonClick.bind(this)
    )
  }

  updatePageVisibility(): void {
    if (!this.callPage || !this.loginPage) return

    if (this.model.state === PageStates.login) {
      this.callPage.style.display = 'none'
      this.loginPage.style.display = 'block'
    } else {
      this.callPage.style.display = 'block'
      this.loginPage.style.display = 'none'
    }
  }

  handleModelPageStartUpdate(): void {
    this.updatePageVisibility()
  }

  handleModelStartConnection(stream: MediaStream): void {
    this.ownerPlayer.srcObject = stream
  }

  handleModelAddStream(stream: MediaStream): void {
    this.guestPlayer.srcObject = stream
  }

  handleHangUpButtonClick(): void {
    this.controller.handleHangUpButtonClick()
    this.guestPlayer.srcObject = null
  }
}
