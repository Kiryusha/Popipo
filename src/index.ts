import { View } from './core/View'
import { Model } from './core/Model'
import { Controller } from './core/Controller'

class App {
  model = new Model()
  contoller = new Controller(this.model)
  view = new View(this.model, this.contoller)
}

// async function initPlayer() {
//   const ownerPlayer = document.querySelector('video#owner') as HTMLVideoElement
//   const guestPlayer = document.querySelector('video#guest') as HTMLVideoElement
//   let ownerConnection: RTCPeerConnection
//   let guestConnection: RTCPeerConnection

//   const ownerStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })

//   ownerPlayer.srcObject = ownerStream

//   // Creating a RTCPeerConnection
//   startPeerConnection(ownerStream).catch((e) => console.log(e))

//   async function startPeerConnection(stream: MediaStream) {
//     const config: RTCConfiguration = {
//       // iceServers: [{ urls: 'stun:stun.1.google.com:19302' }]
//     }

//     ownerConnection = new RTCPeerConnection(config)
//     guestConnection = new RTCPeerConnection(config)

//     // Setup stream listening
//     stream.getTracks().forEach((track) => {
//       ownerConnection.addTrack(track, stream)
//     })

//     guestConnection.ontrack = (e) => {
//       guestPlayer.srcObject = e.streams[0]
//     }

//     // Setup ice handling
//     ownerConnection.onicecandidate = (event) => {
//       if (event.candidate) {
//         guestConnection.addIceCandidate(new RTCIceCandidate(event.candidate)).catch((e) => console.log(e))
//       }
//     }

//     guestConnection.onicecandidate = (event) => {
//       if (event.candidate) {
//         ownerConnection.addIceCandidate(new RTCIceCandidate(event.candidate)).catch((e) => console.log(e))
//       }
//     }

//     // Creating the SDP offer and response answer
//     const offer = await ownerConnection.createOffer()
//     ownerConnection.setLocalDescription(offer).catch((e) => console.log(e))
//     guestConnection.setRemoteDescription(offer).catch((e) => console.log(e))

//     const answer = await guestConnection.createAnswer()
//     guestConnection.setLocalDescription(answer).catch((e) => console.log(e))
//     ownerConnection.setRemoteDescription(answer).catch((e) => console.log(e))
//   }
// }

new App()

// initPlayer().catch((e) => console.log(e))