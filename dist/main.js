(function () {
  'use strict';

  var ModelEvents;
  (function (ModelEvents) {
      ModelEvents["pageStateUpdate"] = "pageStateUpdate";
      ModelEvents["startConnection"] = "startConnection";
      ModelEvents["addStream"] = "addStream";
  })(ModelEvents || (ModelEvents = {}));
  var MDataTypes;
  (function (MDataTypes) {
      MDataTypes["login"] = "login";
      MDataTypes["offer"] = "offer";
      MDataTypes["answer"] = "answer";
      MDataTypes["candidate"] = "candidate";
      MDataTypes["leave"] = "leave";
  })(MDataTypes || (MDataTypes = {}));
  var PageStates;
  (function (PageStates) {
      PageStates["login"] = "login";
      PageStates["call"] = "call";
  })(PageStates || (PageStates = {}));

  class View {
      constructor(model, controller) {
          this.model = model;
          this.controller = controller;
          this.loginPage = document.getElementById('login-page');
          this.callPage = document.getElementById('call-page');
          this.usernameInput = document.getElementById('username');
          this.guestInput = document.getElementById('guest');
          this.loginButton = document.getElementById('login');
          this.callButton = document.getElementById('call');
          this.hangUpButton = document.getElementById('hang-up');
          this.ownerPlayer = document.getElementById('owner-player');
          this.guestPlayer = document.getElementById('guest-player');
          this.subscribeToEvents();
          this.updatePageVisibility();
      }
      subscribeToEvents() {
          this.model.bus.subscribe(ModelEvents.pageStateUpdate, this.handleModelPageStartUpdate.bind(this));
          this.model.bus.subscribe(ModelEvents.startConnection, this.handleModelStartConnection.bind(this));
          this.model.bus.subscribe(ModelEvents.addStream, this.handleModelAddStream.bind(this));
          this.loginButton?.addEventListener('click', () => this.controller.handleLoginButtonClick(this.usernameInput?.value));
          this.callButton?.addEventListener('click', () => this.controller.handleCallButtonClick(this.guestInput?.value));
          this.hangUpButton?.addEventListener('click', this.handleHangUpButtonClick.bind(this));
      }
      updatePageVisibility() {
          if (!this.callPage || !this.loginPage)
              return;
          if (this.model.state === PageStates.login) {
              this.callPage.style.display = 'none';
              this.loginPage.style.display = 'block';
          }
          else {
              this.callPage.style.display = 'block';
              this.loginPage.style.display = 'none';
          }
      }
      handleModelPageStartUpdate() {
          this.updatePageVisibility();
      }
      handleModelStartConnection(stream) {
          this.ownerPlayer.srcObject = stream;
      }
      handleModelAddStream(stream) {
          this.guestPlayer.srcObject = stream;
      }
      handleHangUpButtonClick() {
          this.controller.handleHangUpButtonClick();
          this.guestPlayer.srcObject = null;
      }
  }

  class EventBus {
      constructor() {
          this.subscriptions = {};
          this.lastId = 0;
      }
      subscribe(eventType, callback) {
          const callbackId = this.getId();
          if (!this.subscriptions[eventType])
              this.subscriptions[eventType] = {};
          this.subscriptions[eventType][callbackId] = callback;
          return callbackId;
      }
      unsubscribe(eventType, callbackId) {
          delete this.subscriptions[eventType][callbackId];
      }
      emit(eventType, arg) {
          if (!this.subscriptions[eventType])
              return;
          const callbackIds = Object.keys(this.subscriptions[eventType]);
          for (const callbackId of callbackIds) {
              this.subscriptions[eventType][callbackId](arg);
          }
      }
      getId() {
          this.lastId += 1;
          return `${this.lastId}`;
      }
  }

  class Model {
      constructor() {
          this.name = '';
          this.guest = '';
          this.state = PageStates.login;
          this.bus = new EventBus();
          this.webSocket = new WebSocket('wss://kosk-signaling.herokuapp.com');
          this.subscribeToEvents();
      }
      subscribeToEvents() {
          this.webSocket.addEventListener('open', this.handleConnectionOpen.bind(this));
          this.webSocket.addEventListener('error', this.handleConnectionError.bind(this));
          this.webSocket.addEventListener('message', this.handleConnectionMessage.bind(this));
      }
      sendMessage(data) {
          if (this.guest.length) {
              data.name = this.guest;
          }
          this.webSocket.send(JSON.stringify(data));
      }
      async startConnection() {
          try {
              this.stream = await navigator.mediaDevices.getUserMedia({
                  video: true,
                  audio: true
              });
              this.bus.emit(ModelEvents.startConnection, this.stream);
              this.setupPeerConnection(this.stream);
          }
          catch (e) {
              console.log(e);
          }
      }
      setupPeerConnection(stream) {
          const config = {
          // iceServers: [{ urls: 'stun:stun.1.google.com:19302' }]
          };
          this.peerConnection = new RTCPeerConnection(config);
          // Setup stream listening
          stream.getTracks().forEach((track) => {
              console.log(this.peerConnection);
              this.peerConnection?.addTrack(track, stream);
          });
          this.peerConnection.ontrack = (e) => {
              this.bus.emit(ModelEvents.addStream, e.streams[0]);
          };
          this.peerConnection.onicecandidate = (e) => {
              if (e.candidate) {
                  this.sendMessage({
                      type: MDataTypes.candidate,
                      candidate: e.candidate
                  });
              }
          };
      }
      async startPeerConnection(username) {
          try {
              this.guest = username;
              const offer = await this.peerConnection?.createOffer();
              this.sendMessage({
                  type: MDataTypes.offer,
                  offer
              });
              if (offer) {
                  this.peerConnection?.setLocalDescription(offer)
                      .catch((e) => Promise.reject(e));
              }
          }
          catch (e) {
              console.log(e);
          }
      }
      handleConnectionOpen() {
          console.log('Connected');
      }
      handleConnectionError(error) {
          console.log('Got error', error);
      }
      handleConnectionMessage(message) {
          console.log('Got message', message);
          try {
              const data = JSON.parse(message.data);
              const { type, offer, name, success, answer, candidate } = data;
              switch (type) {
                  case MDataTypes.login:
                      this.handleMessageLogin(success);
                      break;
                  case MDataTypes.offer:
                      this.handleMessageOffer(offer, name).catch((e) => console.log(e));
                      break;
                  case MDataTypes.answer:
                      this.handleMessageAnswer(answer);
                      break;
                  case MDataTypes.candidate:
                      this.handleMessageCandidate(candidate);
                      break;
                  case MDataTypes.leave:
                      this.handleMessageLeave();
                      break;
                  default:
                      break;
              }
          }
          catch (e) {
              console.log(e);
          }
      }
      handleMessageLogin(success) {
          if (success) {
              this.state = PageStates.call;
              this.bus.emit(ModelEvents.pageStateUpdate);
              this.startConnection().catch((e) => console.log(e));
          }
          else {
              alert('Login is already in use');
          }
      }
      async handleMessageOffer(offer, name) {
          if (offer && name) {
              try {
                  this.guest = name;
                  this.peerConnection?.setRemoteDescription(new RTCSessionDescription(offer)).catch((e) => console.log(e));
                  const answer = await this.peerConnection?.createAnswer();
                  if (answer) {
                      this.peerConnection?.setLocalDescription(answer)
                          .catch((e) => console.log(e));
                  }
                  this.sendMessage({
                      type: MDataTypes.answer,
                      answer
                  });
              }
              catch (e) {
                  console.log(e);
              }
          }
      }
      handleMessageAnswer(answer) {
          if (answer) {
              this.peerConnection?.setRemoteDescription(new RTCSessionDescription(answer)).catch((e) => console.log(e));
          }
      }
      handleMessageCandidate(candidate) {
          if (candidate) {
              this.peerConnection?.addIceCandidate(new RTCIceCandidate(candidate)).catch((e) => console.log(e));
          }
      }
      handleMessageLeave() {
          console.log('User left');
          this.guest = '';
          if (this.peerConnection) {
              this.peerConnection.close();
              this.peerConnection.onicecandidate = null;
              this.peerConnection.ontrack = null;
              if (this.stream) {
                  this.setupPeerConnection(this.stream);
              }
          }
      }
  }

  class Controller {
      constructor(model) {
          this.model = model;
      }
      handleLoginButtonClick(inputValue) {
          if (inputValue) {
              this.model.name = inputValue;
              this.model.sendMessage({
                  type: MDataTypes.login,
                  name: this.model.name
              });
          }
      }
      handleCallButtonClick(inputValue) {
          if (inputValue) {
              this.model.startPeerConnection(inputValue).catch((e) => console.log(e));
          }
      }
      handleHangUpButtonClick() {
          if (!this.model.guest)
              return;
          this.model.sendMessage({ type: MDataTypes.leave });
          this.model.handleMessageLeave();
      }
  }

  class App {
      constructor() {
          this.model = new Model();
          this.contoller = new Controller(this.model);
          this.view = new View(this.model, this.contoller);
      }
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
  new App();
  // initPlayer().catch((e) => console.log(e))

}());
