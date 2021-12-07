export enum ModelEvents {
  pageStateUpdate = 'pageStateUpdate',
  startConnection = 'startConnection',
  addStream = 'addStream',
}

export interface MData {
  type: string
  name?: string
  offer?: RTCSessionDescriptionInit
  answer?: RTCSessionDescriptionInit
  candidate?: RTCIceCandidate
  success?: boolean
}

export enum MDataTypes {
  login = 'login',
  offer = 'offer',
  answer = 'answer',
  candidate = 'candidate',
  leave = 'leave',
}

export enum PageStates {
  login = 'login',
  call = 'call',
}
