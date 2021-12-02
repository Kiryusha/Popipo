import { MData, MDataTypes, PageStates, ModelEvents } from '../../types'
import { EventBus } from '../../utils/EventBus'

export default class Model {
  name = ''
  guest = ''
  state = PageStates.login
  webSocket: WebSocket
  bus = new EventBus()
  stream?: MediaStream
  peerConnection?: RTCPeerConnection
  
  constructor() {
    this.webSocket = new WebSocket('ws://localhost:8888')

    this.subscribeToEvents()
  }

  subscribeToEvents(): void {
    this.webSocket.addEventListener('open', this.handleConnectionOpen.bind(this))
    this.webSocket.addEventListener('error', this.handleConnectionError.bind(this))
    this.webSocket.addEventListener('message', this.handleConnectionMessage.bind(this))
  }

  sendMessage(data: MData): void {
    if (this.guest) {
      data.name = this.guest
    }

    this.webSocket.send(JSON.stringify(data))
  }

  async startConnection(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      })
  
      this.bus.emit(ModelEvents.startConnection, this.stream)
  
      this.setupPeerConnection(this.stream)
    } catch(e) {
      console.log(e)
    }
  }

  setupPeerConnection(stream: MediaStream): void {
    const config: RTCConfiguration = {
      // iceServers: [{ urls: 'stun:stun.1.google.com:19302' }]
    }

    this.peerConnection = new RTCPeerConnection(config)

    // Setup stream listening
    stream.getTracks().forEach((track) => {
      console.log(this.peerConnection)
      this.peerConnection?.addTrack(track, stream)
    })

    this.peerConnection.ontrack = (e) => {
      this.bus.emit(ModelEvents.addStream, e.streams[0])
    }

    this.peerConnection.onicecandidate = (e) => {
      if (e.candidate) {
        this.sendMessage({
          type: MDataTypes.candidate,
          candidate: e.candidate
        })
      }
    }
  }

  public async startPeerConnection(username: string): Promise<void> {
    try {
      this.guest = username
      const offer = await this.peerConnection?.createOffer()
      this.sendMessage({
        type: MDataTypes.offer,
        offer
      })
      if (offer) {
        this.peerConnection?.setLocalDescription(offer)
          .catch((e) => Promise.reject(e))
      }
    } catch(e) {
      console.log(e)
    }
  }

  handleConnectionOpen(): void {
    console.log('Connected')
  }

  handleConnectionError(error: Event): void {
    console.log('Got error', error)
  }

  handleConnectionMessage(message: MessageEvent<string>): void {
    console.log('Got message', message)

    try {
      const data = JSON.parse(message.data) as MData
      const { type, offer, name, success, answer, candidate } = data

      switch (type) {
        case MDataTypes.login:
          this.handleMessageLogin(success)
          break

        case MDataTypes.offer:
          this.handleMessageOffer(offer, name).catch((e) => console.log(e))
          break

        case MDataTypes.answer:
          this.handleMessageAnswer(answer)
          break

        case MDataTypes.candidate:
          this.handleMessageCandidate(candidate)
          break

        case MDataTypes.leave:
          this.handleMessageLeave()
          break
      
        default:
          break
      }
    } catch(e) {
      console.log(e)
    }
  }

  handleMessageLogin(success: MData['success']): void {
    if (success) {
      this.state = PageStates.call
      this.bus.emit(ModelEvents.pageStateUpdate)
      this.startConnection().catch((e) => console.log(e))
    } else {
      alert('Login is already in use')
    }
  }

  async handleMessageOffer(offer: MData['offer'], name: MData['name']): Promise<void> {
    if (offer && name) {
      try {
        this.guest = name
        this.peerConnection?.setRemoteDescription(
          new RTCSessionDescription(offer)
        ).catch((e) => console.log(e))

        const answer = await this.peerConnection?.createAnswer()

        if (answer) {
          this.peerConnection?.setLocalDescription(answer)
            .catch((e) => console.log(e))
        }
        this.sendMessage({
          type: MDataTypes.answer,
          answer
        })
      } catch(e) {
        console.log(e)
      }
    }
  }

  handleMessageAnswer(answer: MData['answer']): void {
    if (answer) {
      this.peerConnection?.setRemoteDescription(
        new RTCSessionDescription(answer)
      ).catch((e) => console.log(e))
    }
  }

  handleMessageCandidate(candidate: MData['candidate']): void {
    if (candidate) {
      this.peerConnection?.addIceCandidate(
        new RTCIceCandidate(candidate)
      ).catch((e) => console.log(e))
    }
  }

  handleMessageLeave(): void {
    console.log('User left')
  }
}