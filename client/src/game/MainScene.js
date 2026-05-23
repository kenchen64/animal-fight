import Phaser from 'phaser'
import socket from '../socket'

export default class MainScene extends Phaser.Scene {
  constructor() {
    super('main')
  }

  preload() {
    this.load.image('dog', '/assets/dog.png')
    this.load.image('cat', '/assets/cat.png')
    this.load.image('fox', '/assets/fox.png')
    this.load.image('skill', '/assets/skill.png')
  }

  create() {
    this.players = {}

    const username = localStorage.getItem('username')

    const animal = localStorage.getItem('animal') || 'dog'

    socket.emit('join', {
      username,
      animal
    })

    socket.on('players', players => {
      Object.keys(players).forEach(id => {
        const player = players[id]

        if (!this.players[id]) {
          const sprite = this.add.sprite(
            player.x,
            player.y,
            player.animal
          )

          sprite.setScale(2)
          const hpBar = this.add.rectangle(
            player.x,
            player.y - 40,
            50,
            8,
            0xff0000
          )

          const name = this.add.text(
            player.x - 20,
            player.y - 70,
            player.username,
            {
              fontSize: '16px'
            }
          )

          this.players[id] = {
            sprite,
            hpBar,
            name
          }        }

        this.players[id].sprite.x = player.x
        this.players[id].sprite.y = player.y

        this.players[id].hpBar.x = player.x
        this.players[id].hpBar.y = player.y - 40

        this.players[id].hpBar.width =
          (player.hp / player.maxHp) * 50

        this.players[id].name.x = player.x - 20
        this.players[id].name.y = player.y - 70
      })
    })

    socket.on('skillEffect', data => {
      const target = this.players[data.target]

      if (!target) return

      const effect = this.add.sprite(        target.sprite.x,
        target.sprite.y,
        'skill'
      )

      this.tweens.add({
        targets: effect,
        alpha: 0,
        duration: 500,
        onComplete: () => {
          effect.destroy()
        }
      })
    })

    this.keys = this.input.keyboard.addKeys({
      up: 'W',
      down: 'S',
      left: 'A',
      right: 'D',
      attack: 'J',
      skill: 'K'
    })  }

  update() {
    const me = this.players[socket.id]

    if (!me) return

    let speed = 5

    if (this.keys.left.isDown) {
      me.sprite.x -= speed
    }

    if (this.keys.right.isDown) {
      me.sprite.x += speed
    }

    if (this.keys.up.isDown) {
      me.sprite.y -= speed
    }

    if (this.keys.down.isDown) {      me.sprite.y += speed
    }

    socket.emit('move', {
      x: me.sprite.x,
      y: me.sprite.y
    })

    if (
      Phaser.Input.Keyboard.JustDown(
        this.keys.attack
      )
    ) {
      Object.keys(this.players).forEach(id => {
        if (id !== socket.id) {
          socket.emit('attack', id)
        }
      })
    }

    if (
      Phaser.Input.Keyboard.JustDown(
        this.keys.skill      )
    ) {
      Object.keys(this.players).forEach(id => {
        if (id !== socket.id) {
          socket.emit('skill', id)
        }
      })
    }
  }
}