import nipplejs from 'nipplejs'

export default function createJoystick(scene) {
  // 先抓取你在 HTML 建立的獨立搖桿容器
  const joystickContainer = document.getElementById('joystick-container');

  return nipplejs.create({
    // 1. 修正：將搖桿範圍限制在該容器內，不要用 body
    zone: joystickContainer, 
    // 2. 修正：改用 'semi'（半固定）或 'static'，但位置讓它在容器正中心
    mode: 'static',
    position: {
      left: '50%',
      top: '50%'  // 透過 CSS 容器來定位，這裡直接置中即可
    },
    color: 'white'
  })
}
