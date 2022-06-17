/*----------------------------------------------------------------------------*
 *                      Global utility functions                              *
 *----------------------------------------------------------------------------*/

// Firefox 1.0+
var isFirefox = typeof InstallTrigger !== 'undefined';

// Chrome 1+
var isChrome = !!window.chrome;

// Safari 3.0+ "[object HTMLElementConstructor]" 
var isSafari = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || (typeof safari !== 'undefined' && safari.pushNotification));

window.mobilecheck = function() {
  var check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};

// Whether is mobile
var isMobile = window.mobilecheck();

/**----------------------------------------------------------------------------
 * > Request user to reload
 */
function requestReload(txt){
  let ok = window.confirm(txt);
  if(ok){window.location.assign(location)}
}
/**----------------------------------------------------------------------------
 * > Disable web page scrolling
 */
function DisablePageScroll() {
  document.documentElement.style.overflow = 'hidden';
}
/**----------------------------------------------------------------------------
 * > Enable web page scrolling
 */
function EnablePageScroll(){
  document.documentElement.style.overflow = '';
}
/**----------------------------------------------------------------------------
 * > Ask use whether really want to leave the page
 */
function RegisterLeaveEvent() {
  window.onbeforeunload = function(){
    return "You have attempted to leave this page. If you have made any changes to the fields without clikcing the Save button, your changes will be lost. Are you sure you want to exit this page?";
  }
}
/**----------------------------------------------------------------------------
 * > Get domain URL of current page
 * @function
 * @global
 * @returns {string} - Domain URL
 */
function getDomainURL(){
  return location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '');
}
/**----------------------------------------------------------------------------
 * > Log debug information
 * @function
 * @global
 * @param {...} - things to be logged on console
 */
function debug_log(){
  if(DataManager.debugMode){
    for(let i=0;i<arguments.length;++i){ console.log(arguments[i]); }
  }
}
/**----------------------------------------------------------------------------
 * > Check audio support
 * @function
 * @global
 * @returns {boolean}
 */
function isAudioSupported(){
  var a = document.createElement('audio');
  return !!(a.canPlayType && a.canPlayType('audio/mpeg;').replace(/no/, ''));
}
/**----------------------------------------------------------------------------
 * > Check WebGL support
 * @function
 * @global
 * @returns {boolean}
 */
function isWebGLSupported(){
  let type = "WebGL", result = PIXI.utils.isWebGLSupported();
  if(!result){ type = "canvas"; }
  PIXI.utils.sayHello(type)
  return result
}
/**----------------------------------------------------------------------------
 * > Check whether given two object has same class
 * @function
 * @global
 * @returns {boolean}
 */
function isClassOf(obj, cls){
  return getClassName(obj) == cls.name;
}
/**----------------------------------------------------------------------------
 * > Get class name of object
 * @function
 * @global
 * @param {object} obj - the object to get class name for
 * @returns {string} - Class name of given object
 */
function getClassName(obj){
  if(obj === undefined){return "undefined";}
  if(obj === null){return "null";}
  return obj.constructor.name;
}
/**----------------------------------------------------------------------------
 * > Clone object
 */
function clone(obj){
  let dup = Object.assign({}, obj);
  dup.constructor = obj.constructor;
  return dup;
}
/**----------------------------------------------------------------------------
 * > Get valid number of arguments
 */
function validArgCount(){
  let sum = 0;
  for(let i=0;i<arguments.length;++i){
    if(arguments[i] !== undefined){sum += 1;}
  }
  return sum;
}
/**----------------------------------------------------------------------------
 * > Get number of valid numeric from arguments
 * @param {function} handler - the extra condition
 * @param {...Nunber} - numbers to be checked
 */
function validNumericCount(){
  let sum = 0;
  let handler = arguments[0];
  if(!handler){
    handler = function(){return true;}
  }
  else if(!isClassOf(handler, Function)){
    throw new TypeError(Function, handler);
  }
  for(let i=1;i<arguments.length;++i){
    if(!isClassOf(arguments[i], Number) || isNaN(arguments[i])){
      continue;
    }
    else if(handler.call(this, arguments[i])){
      sum += 1;
    }
  }
  return sum;
}
/**--------------------------------------------------------------------------
 * Check whether two array contains same object
 */
function isArrayalike(a, b){
  if(!a || !b){return false;}
  try{
    if(a.length != b.length){return false;}
  }catch(e){
    return false;
  }
  for(let i=0;i<a.length;++i){
    if(a[i] !== b[i]){return false;}
  }
  return true;
}
/**--------------------------------------------------------------------------
 * Shuffle array index
 */
function shuffleArray(ar){
  var j, i;
  for (i = ar.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    [ar[i], ar[j]] = [ar[j], ar[i]];
  }
  return ar;
}
/**--------------------------------------------------------------------------
 * Convert degree to radian
 */
function toRad(deg){
  return deg * Math.PI / 180;
}
/**--------------------------------------------------------------------------
 * Capitalize string
 */
function capitalize(str){
  let tmp = str.toLowerCase();
  if(tmp.length){tmp[0] = tmp[0].toUpperCase()}
  return tmp;
}
/**----------------------------------------------------------------------------
 * > Check whether the object is interable 
 * @param {Object} obj - the object to checl
 */
function isIterable(obj) {
  if (obj == null) {
    return false;
  }
  return (typeof obj[Symbol.iterator] === 'function') || false;
}
/**----------------------------------------------------------------------------
 * > Process given JSON file
 * @function
 * @global
 * @param {string} path - path to the json file
 * @param {function} handler - the handler to call, first arg is the read result
 */
function processJSON(path, handler, fallback){
  var xhr = new XMLHttpRequest();
  if(!handler){ handler = function(){} }
  xhr.open('GET', path, true);
  xhr.responseType = 'blob';
  xhr.onload = function(e) { 
    if(this.status == 200){
      var file = new File([this.response], 'temp');
      var fileReader = new FileReader();
      fileReader.addEventListener('load', function(){
        handler.call(this, fileReader.result);
      });
      fileReader.readAsText(file);
    }
    else{
      fallback.call(this, this.status);
    }
  }
  xhr.send();
}
/**----------------------------------------------------------------------------
 * > Report the error
 * @param {boolean} fatel - whether the application is able to continue
 */
function reportError(e, fatel = true){
  // if(Sound.isReady()){Sound.playSE(Sound.Error, 1.0);}
  console.error("An error occurred!")
  console.error(e.name + ':', e.message);
  // console.error(e.stack);
  // if(Sound.isReady()){
  //   window.setTimeout(function(){
  //     Sound.stopAll(); SceneManager.stop();
  //   }, 1000);
  // }
  FatelError = fatel;
}
/**----------------------------------------------------------------------------
 * > Get a random int
 * @param {Number} minn - minimum number
 * @param {Number} maxn - maximum number
 */
function randInt(minn = 0, maxn){
  let re = parseInt(Math.random(42) * 100000000)
  if(maxn){
    return re % (maxn - minn + 1) + minn
  }
  return minn + re;
}
/**----------------------------------------------------------------------------
 * > Get GCD of two numbers
 */
function gcd(a, b){
  if(b > a){[a, b] = [b, a];}
  if(a % b == 0){
    return b;
  }
  return (b, a % b);
}
/**----------------------------------------------------------------------------
 * > Converts Canvas Array to String
 */
function canvasArrToString(pix) {
  var s = "";
  for(let i=0;i<pix.length;++i){
    s += String.fromCharCode(pix[i])
  }
  return s;
}
/**----------------------------------------------------------------------------
 * > Converts Canvas String to Array
 */
function canvasStringToArr(ss) {
  var arr=[];
  for (var i=0;i<ss.length;++i) {
    arr.push(ss[i].charCodeAt());
  }
  return arr;
}

function clipImage(canvas, image, target, cx, cy, cw, ch, dx=null, dy=null, dw=null, dh=null, rotate=null){
  if(dx == null){ dx = 0; }
  if(dy == null){ dy = 0; }
  if(dw == null){ dw = cw; }
  if(dh == null){ dh = ch; }
  var context = canvas.getContext('2d');
  context.webkitImageSmoothingEnabled = false;
  context.mozImageSmoothingEnabled = false;
  context.imageSmoothingEnabled = false;
  if(rotate){ context.rotate(toRad(rotate)); }
  context.drawImage(image, cx, cy, cw, ch, dx, dy, dw, dh);
  context.setTransform(1, 0, 0, 1, 0, 0);
  target.src = canvas.toDataURL();
}

function localizeBootstrapTable(node){
  if(!DataManager.isReady()){
    return setTimeout(()=>{localizeBootstrapTable(node)}, 300);
  }
  for(let key in Vocab.BootstrapTable){
    if(!Vocab.BootstrapTable.hasOwnProperty(key)){ continue; }
    let name = Vocab.BootstrapTable[key];
    node.bootstrapTable('updateFormatText', key, name);
  }
}


function registerCollapseIndicator(node){
  let html_bf = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-right" viewBox="0 0 16 16" style="padding-bottom: 4px; padding-right: 4px;"><path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/></svg>';
  let html_af = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-down" viewBox="0 0 16 16" style="padding-bottom: 4px; padding-right: 4px;"><path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/></svg>';
  if(node[0]){node = node[0];}
  node.innerHTML = html_bf + node.innerHTML;
  node.addEventListener('click', switchCollapseIndicator);
}

function switchCollapseIndicator(event){
  let html_bf = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-right" viewBox="0 0 16 16" style="padding-bottom: 4px; padding-right: 4px;"><path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/></svg>';
  let html_af = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-down" viewBox="0 0 16 16" style="padding-bottom: 4px; padding-right: 4px;"><path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/></svg>';
  let node = event.target;
  if(Array.from(node.classList).includes('collapsed')){
    node.children[0].innerHTML = html_bf;
  }
  else{
    node.children[0].innerHTML = html_af;
  }
}

function handleAjaxError(response){
  debug_log(response);
  if(response.status == 503){
    alert(Vocab['UnderMaintenance']);
  }
  else if(response.status == 202){
    alert(Vocab['AppInitializing']);
  }
  else{
    alert(Vocab['UnknownError']);
  }
}
