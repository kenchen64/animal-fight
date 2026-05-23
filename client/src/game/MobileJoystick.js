import nipplejs from 'nipplejs'

export default function createJoystick(scene) {
  return nipplejs.create({
    zone: document.body,
    mode: 'static',
    position: {
      left: '80px',
      bottom: '80px'
    },
    color: 'white'
  })
}