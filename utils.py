from _G import *
import traceback
import unicodedata

def format_padded_utfstring(*tuples):
  '''
  Padding string with various charcter width, tuple format:\n
  `(text, width, pad_right=False)`\n
  If `pad_right` is set to True, the given text will right-aligned instead left\n
  '''
  global SYMBOL_WIDTH, CH_WIDTH
  ret = ''
  for dat in tuples:
    pad_right = False
    if len(dat) == 2:
      text,width = dat
    elif len(dat) == 3:
      text,width,pad_right = dat
    else:
      raise RuntimeError(f"Wrong number of arugments, expected 2 or 3 but get {len(dat)}")
    text = str(text)
    w = 0
    for ch in text:
      sym = unicodedata.east_asian_width(ch)
      if sym == 'A':
        for cw,chars in SYMBOL_WIDTH.items():
          if ch in chars:
            w += cw
            break
        else:
          w += CH_WIDTH[sym]
      else:
        w += CH_WIDTH[sym]
    if width <= w:
      ret += text
    else:
      ret += (' ' * (width - w))+text if pad_right else text+(' ' * (width - w))
  return ret

def format_timedelta(dt):
  ret = ''
  d  = dt.days
  hr = dt.seconds // 3600
  mn = (dt.seconds % 3600) // 60
  se = dt.seconds % 60
  ms = dt.microseconds // 1000 
  if d:
    ret += f"{d} day"
    ret += 's ' if d != 1 else ' '
  if ret or hr:
    ret += f"{hr} hour"
    ret += 's ' if hr != 1 else ' '
  if ret or mn:
    ret += f"{mn} minute"
    ret += 's ' if mn != 1 else ' '
  if ret or se:
    ret += f"{se} second"
    ret += 's ' if se != 1 else ' '
  ret += f"{ms}ms"
  return ret

def make_lparam(x, y):
  return (y << 16) | x

def get_lparam(val):
  return (val & 0xffff, val >> 16)

def set_last_error(code=None, msg=None):
  global LastErrorCode,LastErrorMessage
  if code != None:
    LastErrorCode = code
  if msg != None:
    LastErrorMessage = msg

def get_last_error():
  global LastErrorCode,LastErrorMessage
  retc = LastErrorCode
  retm = LastErrorMessage
  LastErrorCode = 0
  LastErrorMessage = ''
  return (retc, retm)

def handle_exception(err):
  err_info = traceback.format_exc()
  msg = f"{err}\n{err_info}\n"
  log_error(msg)
