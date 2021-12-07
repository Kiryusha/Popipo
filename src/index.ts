import { View } from './core/View'
import { Model } from './core/Model'
import { Controller } from './core/Controller'

class App {
  model = new Model()
  contoller = new Controller(this.model)
  view = new View(this.model, this.contoller)
}

new App()
