let colorsDivs = window.colors.map((_0x1b8bf2) => {
  return _0x1b8bf2 === '#ffffff'
    ? '<button data-v="' +
        _0x1b8bf2 +
        '" class="colorSelector" style="border: none; outline: none; width: 40px; height: 40px; background-color: ' +
        _0x1b8bf2 +
        '; display: inline-block; position: relative; ">\n             <div class="border fa fl fa-ban" style="width:39px; height:39px; background-color: ; display:inline-block; color:red;margin-left: -4px;"></div>\n           </button>'
    : '<button data-v="' +
        _0x1b8bf2 +
        '" class="colorSelector" style="border: none; outline: none; width: 40px; height: 40px; background-color: ' +
        _0x1b8bf2 +
        '; display: inline-block;"></button>'
})
function hideColorPicker() {
  let _0xab6c70 = document.querySelectorAll('.ppop-color-container')
  _0xab6c70.forEach((_0xb8b688) => (_0xb8b688.style.display = 'none'))
  let _0x41b076 = document.querySelector('.clickaway-container')
  _0x41b076.style.display = 'none'
}
function toggleColorPicker(_0x3672b2) {
  let _0xbe87d8 = document.querySelector('.clickaway-container'),
    _0x3ef5f2 = document.querySelector('.ppop-color-container')
  _0xbe87d8 != null &&
    (_0xbe87d8.style.display == 'none'
      ? (_0xbe87d8.style.display = 'block')
      : (_0xbe87d8.style.display = 'none'))
  if (_0x3ef5f2 != null) {
    window.inputSelectorForColorPicker = _0x3672b2
    let _0x570920 = document.querySelector('button' + _0x3672b2)
    if (_0x570920 != null) {
      const _0x35b8ac = _0x570920.getBoundingClientRect()
      _0x3ef5f2.style.display == 'none'
        ? (console.log(_0x35b8ac),
          (_0x3ef5f2.style.position = 'fixed'),
          (_0x3ef5f2.style.right = 5 + 'px'),
          (_0x3ef5f2.style.top = _0x35b8ac.y + _0x35b8ac.height + 'px'),
         
          (_0x3ef5f2.style.display = 'block'))
        : (_0x3ef5f2.style.display = 'none')
    }
  }
}
function setColorPickerButtonBg(_0x4fe41b, _0x2b1ff8) {
  let _0x542d75 = document.querySelector('.' + _0x2b1ff8 + '-container .cpick')
  _0x542d75 != null && (_0x542d75.style.backgroundColor = _0x4fe41b)
}
function listenAndSetToInput() {
  document.querySelectorAll('.colorSelector').forEach((_0x4c9343) =>
    _0x4c9343.addEventListener('click', () => {
      const _0x42f9ce = window.inputSelectorForColorPicker
      console.log(_0x42f9ce)
      if (_0x42f9ce != undefined) {
        let _0x1b0ea1 = document.querySelector(
          'input[name=' + _0x42f9ce.replace('.', '') + ']'
        )
        if (_0x1b0ea1 != null) {
          _0x1b0ea1.value = _0x4c9343.dataset.v
        }
        toggleColorPicker(_0x42f9ce)
        setColorPickerButtonBg(_0x4c9343.dataset.v, _0x42f9ce.replace('.', ''))
      }
    })
  )
}
function modalOverlay() {
  if (document.querySelector('.clickaway-container') == null) {
    const _0x4eaf66 = document.createElement('div')
    _0x4eaf66.classList = 'clickaway-container'
    _0x4eaf66.addEventListener('click', () => hideColorPicker())
    _0x4eaf66.setAttribute(
      'style',
      'display: none;width: 100vw; height: 100vh; position: absolute; top: 0; left: 0; z-index: 6000'
    )
    document.body.appendChild(_0x4eaf66)
  }
}
function setColorPickerTemplate() {
  if (document.querySelector('.ppop-color-container') == null) {
    const _0x228a55 = document.createElement('div')
    _0x228a55.classList = 'ppop light border break ppop-color-container'
    _0x228a55.setAttribute('style', 'display: none; z-index: 20000')
    const _0x4bcca0 = document.createElement('div')
    _0x4bcca0.setAttribute(
      'style',
      'width: 260px; height: 200px; line-height: 0px !important'
    )
    _0x4bcca0.classList = 'break colors-container'
    _0x228a55.appendChild(_0x4bcca0)
    document.body.appendChild(_0x228a55)
    $('.colors-container').append(colorsDivs)
  }
}
setColorPickerTemplate()
modalOverlay()
listenAndSetToInput()
