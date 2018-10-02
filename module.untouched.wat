(module
 (type $iiiiv (func (param i32 i32 i32 i32)))
 (type $iiiii (func (param i32 i32 i32 i32) (result i32)))
 (type $iii (func (param i32 i32) (result i32)))
 (type $ii (func (param i32) (result i32)))
 (type $iiv (func (param i32 i32)))
 (type $iiiv (func (param i32 i32 i32)))
 (type $iiii (func (param i32 i32 i32) (result i32)))
 (type $iiiiiv (func (param i32 i32 i32 i32 i32)))
 (type $v (func))
 (import "env" "abort" (func $~lib/env/abort (param i32 i32 i32 i32)))
 (global $~lib/internal/allocator/AL_BITS i32 (i32.const 3))
 (global $~lib/internal/allocator/AL_SIZE i32 (i32.const 8))
 (global $~lib/internal/allocator/AL_MASK i32 (i32.const 7))
 (global $~lib/internal/allocator/MAX_SIZE_32 i32 (i32.const 1073741824))
 (global $~lib/allocator/tlsf/SL_BITS i32 (i32.const 5))
 (global $~lib/allocator/tlsf/SL_SIZE i32 (i32.const 32))
 (global $~lib/allocator/tlsf/SB_BITS i32 (i32.const 8))
 (global $~lib/allocator/tlsf/SB_SIZE i32 (i32.const 256))
 (global $~lib/allocator/tlsf/FL_BITS i32 (i32.const 22))
 (global $~lib/allocator/tlsf/FREE i32 (i32.const 1))
 (global $~lib/allocator/tlsf/LEFT_FREE i32 (i32.const 2))
 (global $~lib/allocator/tlsf/TAGS i32 (i32.const 3))
 (global $~lib/allocator/tlsf/ROOT (mut i32) (i32.const 0))
 (global $~lib/internal/arraybuffer/HEADER_SIZE i32 (i32.const 8))
 (global $~lib/internal/string/HEADER_SIZE i32 (i32.const 4))
 (global $~lib/internal/string/MAX_LENGTH i32 (i32.const 536870910))
 (global $~lib/allocator/tlsf/Root.SL_START i32 (i32.const 4))
 (global $~lib/allocator/tlsf/Root.SL_END i32 (i32.const 92))
 (global $~lib/allocator/tlsf/Root.HL_START i32 (i32.const 96))
 (global $~lib/allocator/tlsf/Root.HL_END i32 (i32.const 2912))
 (global $~lib/allocator/tlsf/Root.SIZE i32 (i32.const 2916))
 (global $~lib/allocator/tlsf/Block.INFO i32 (i32.const 8))
 (global $~lib/allocator/tlsf/Block.MIN_SIZE i32 (i32.const 16))
 (global $~lib/allocator/tlsf/Block.MAX_SIZE i32 (i32.const 1073741824))
 (global $HEAP_BASE i32 (i32.const 472))
 (table 1 1 anyfunc)
 (elem (i32.const 0) $null)
 (memory $0 1)
 (data (i32.const 8) "\16\00\00\00~\00l\00i\00b\00/\00a\00l\00l\00o\00c\00a\00t\00o\00r\00/\00t\00l\00s\00f\00.\00t\00s\00")
 (data (i32.const 56) "\00\00\00\00")
 (data (i32.const 64) "B\00\00\00$\00{\00 \00i\00 \00=\00=\00=\00 \000\00 \00?\00 \00\'\00M\00\'\00 \00:\00 \00\'\00L\00\'\00 \00}\00 \00$\00{\00 \00i\00 \00+\00 \00o\00f\00f\00s\00e\00t\00L\00e\00f\00t\00 \00}\00 \00$\00{\00 \00(\001\00 \00+\00 \00m\00i\00n\00)\00 \00*\00 \00a\00m\00p\00 \00}\00 \00")
 (data (i32.const 200) "\04\00\00\00n\00u\00l\00l\00")
 (data (i32.const 216) "\0e\00\00\00~\00l\00i\00b\00/\00s\00t\00r\00i\00n\00g\00.\00t\00s\00")
 (data (i32.const 248) "\17\00\00\00~\00l\00i\00b\00/\00i\00n\00t\00e\00r\00n\00a\00l\00/\00s\00t\00r\00i\00n\00g\00.\00t\00s\00")
 (data (i32.const 304) "N\00\00\00L\00 \00$\00{\00 \00i\00 \00+\00 \00o\00f\00f\00s\00e\00t\00L\00e\00f\00t\00 \00}\00 \00$\00{\00 \00m\00a\00x\00<\00f\003\002\00>\00(\001\00,\00 \00(\00m\00a\00x\00 \00-\00 \00m\00i\00n\00)\00 \00*\00 \00a\00m\00p\00)\00 \00+\00 \00(\00(\001\00 \00+\00 \00m\00i\00n\00)\00 \00*\00 \00a\00m\00p\00)\00 \00}\00 \00")
 (data (i32.const 464) "\01\00\00\00Z\00")
 (export "memory" (memory $0))
 (export "drawWavePath" (func $src/service/wasm/waveform/drawWavePath))
 (start $start)
 (func $~lib/array/Array<i32>#__get (; 1 ;) (type $iii) (param $0 i32) (param $1 i32) (result i32)
  (local $2 i32)
  ;;@ ~lib/array.ts:70:4
  (set_local $2
   ;;@ ~lib/array.ts:70:17
   (i32.load
    (get_local $0)
   )
  )
  ;;@ ~lib/array.ts:73:23
  (if (result i32)
   ;;@ ~lib/array.ts:71:11
   (i32.lt_u
    (get_local $1)
    ;;@ ~lib/array.ts:71:24
    (i32.shr_u
     ;;@ ~lib/array.ts:71:30
     (i32.load
      (get_local $2)
     )
     ;;@ ~lib/array.ts:71:52
     (i32.const 2)
    )
   )
   ;;@ ~lib/array.ts:72:8
   (block $~lib/internal/arraybuffer/loadUnsafe<i32,i32>|inlined.0 (result i32)
    ;;@ ~lib/internal/arraybuffer.ts:68:91
    (i32.load offset=8
     ;;@ ~lib/internal/arraybuffer.ts:68:20
     (i32.add
      (get_local $2)
      ;;@ ~lib/internal/arraybuffer.ts:68:48
      (i32.shl
       ;;@ ~lib/internal/arraybuffer.ts:68:49
       (get_local $1)
       ;;@ ~lib/internal/arraybuffer.ts:68:65
       (i32.const 2)
      )
     )
    )
   )
   ;;@ ~lib/array.ts:73:8
   (unreachable)
  )
 )
 (func $~lib/allocator/tlsf/Root#set:tailRef (; 2 ;) (type $iiv) (param $0 i32) (param $1 i32)
  ;;@ ~lib/allocator/tlsf.ts:181:30
  (i32.store offset=2912
   ;;@ ~lib/allocator/tlsf.ts:181:43
   (i32.const 0)
   ;;@ ~lib/allocator/tlsf.ts:181:46
   (get_local $1)
  )
 )
 (func $~lib/allocator/tlsf/Root#setSLMap (; 3 ;) (type $iiiv) (param $0 i32) (param $1 i32) (param $2 i32)
  ;;@ ~lib/allocator/tlsf.ts:144:4
  (if
   (i32.eqz
    ;;@ ~lib/allocator/tlsf.ts:144:11
    (i32.lt_u
     (get_local $1)
     ;;@ ~lib/allocator/tlsf.ts:144:16
     (get_global $~lib/allocator/tlsf/FL_BITS)
    )
   )
   (block
    (call $~lib/env/abort
     (i32.const 0)
     (i32.const 8)
     (i32.const 144)
     (i32.const 4)
    )
    (unreachable)
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:145:4
  (i32.store offset=4
   ;;@ ~lib/allocator/tlsf.ts:145:15
   (i32.add
    (get_local $0)
    ;;@ ~lib/allocator/tlsf.ts:145:41
    (i32.mul
     (get_local $1)
     ;;@ ~lib/allocator/tlsf.ts:145:46
     (i32.const 4)
    )
   )
   ;;@ ~lib/allocator/tlsf.ts:145:49
   (get_local $2)
  )
 )
 (func $~lib/allocator/tlsf/Root#setHead (; 4 ;) (type $iiiiv) (param $0 i32) (param $1 i32) (param $2 i32) (param $3 i32)
  ;;@ ~lib/allocator/tlsf.ts:167:4
  (if
   (i32.eqz
    ;;@ ~lib/allocator/tlsf.ts:167:11
    (i32.lt_u
     (get_local $1)
     ;;@ ~lib/allocator/tlsf.ts:167:16
     (get_global $~lib/allocator/tlsf/FL_BITS)
    )
   )
   (block
    (call $~lib/env/abort
     (i32.const 0)
     (i32.const 8)
     (i32.const 167)
     (i32.const 4)
    )
    (unreachable)
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:168:4
  (if
   (i32.eqz
    ;;@ ~lib/allocator/tlsf.ts:168:11
    (i32.lt_u
     (get_local $2)
     ;;@ ~lib/allocator/tlsf.ts:168:16
     (get_global $~lib/allocator/tlsf/SL_SIZE)
    )
   )
   (block
    (call $~lib/env/abort
     (i32.const 0)
     (i32.const 8)
     (i32.const 168)
     (i32.const 4)
    )
    (unreachable)
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:169:4
  (i32.store offset=96
   ;;@ ~lib/allocator/tlsf.ts:170:6
   (i32.add
    (get_local $0)
    ;;@ ~lib/allocator/tlsf.ts:170:32
    (i32.mul
     (i32.add
      ;;@ ~lib/allocator/tlsf.ts:170:33
      (i32.mul
       (get_local $1)
       ;;@ ~lib/allocator/tlsf.ts:170:38
       (get_global $~lib/allocator/tlsf/SL_SIZE)
      )
      ;;@ ~lib/allocator/tlsf.ts:170:48
      (get_local $2)
     )
     ;;@ ~lib/allocator/tlsf.ts:170:61
     (i32.const 4)
    )
   )
   ;;@ ~lib/allocator/tlsf.ts:171:6
   (get_local $3)
  )
 )
 (func $~lib/allocator/tlsf/Root#get:tailRef (; 5 ;) (type $ii) (param $0 i32) (result i32)
  ;;@ ~lib/allocator/tlsf.ts:180:58
  (i32.load offset=2912
   ;;@ ~lib/allocator/tlsf.ts:180:44
   (i32.const 0)
  )
 )
 (func $~lib/allocator/tlsf/Block#get:right (; 6 ;) (type $ii) (param $0 i32) (result i32)
  (local $1 i32)
  ;;@ ~lib/allocator/tlsf.ts:89:4
  (if
   (i32.eqz
    ;;@ ~lib/allocator/tlsf.ts:89:11
    (i32.and
     (i32.load
      (get_local $0)
     )
     ;;@ ~lib/allocator/tlsf.ts:89:23
     (i32.xor
      ;;@ ~lib/allocator/tlsf.ts:89:24
      (get_global $~lib/allocator/tlsf/TAGS)
      (i32.const -1)
     )
    )
   )
   (block
    (call $~lib/env/abort
     (i32.const 0)
     (i32.const 8)
     (i32.const 89)
     (i32.const 4)
    )
    (unreachable)
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:94:4
  (if (result i32)
   (i32.eqz
    (tee_local $1
     ;;@ ~lib/allocator/tlsf.ts:91:6
     (i32.add
      ;;@ ~lib/allocator/tlsf.ts:92:8
      (i32.add
       (get_local $0)
       ;;@ ~lib/allocator/tlsf.ts:92:34
       (get_global $~lib/allocator/tlsf/Block.INFO)
      )
      ;;@ ~lib/allocator/tlsf.ts:92:47
      (i32.and
       ;;@ ~lib/allocator/tlsf.ts:92:48
       (i32.load
        (get_local $0)
       )
       ;;@ ~lib/allocator/tlsf.ts:92:60
       (i32.xor
        ;;@ ~lib/allocator/tlsf.ts:92:61
        (get_global $~lib/allocator/tlsf/TAGS)
        (i32.const -1)
       )
      )
     )
    )
   )
   (block
    (call $~lib/env/abort
     (i32.const 0)
     (i32.const 8)
     (i32.const 90)
     (i32.const 11)
    )
    (unreachable)
   )
   (get_local $1)
  )
 )
 (func $~lib/allocator/tlsf/fls<usize> (; 7 ;) (type $ii) (param $0 i32) (result i32)
  ;;@ ~lib/allocator/tlsf.ts:428:2
  (if
   (i32.eqz
    ;;@ ~lib/allocator/tlsf.ts:428:9
    (i32.ne
     (get_local $0)
     ;;@ ~lib/allocator/tlsf.ts:428:17
     (i32.const 0)
    )
   )
   (block
    (call $~lib/env/abort
     (i32.const 0)
     (i32.const 8)
     (i32.const 428)
     (i32.const 2)
    )
    (unreachable)
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:430:26
  (i32.sub
   ;;@ ~lib/allocator/tlsf.ts:430:9
   (i32.const 31)
   ;;@ ~lib/allocator/tlsf.ts:430:15
   (i32.clz
    ;;@ ~lib/allocator/tlsf.ts:430:22
    (get_local $0)
   )
  )
 )
 (func $~lib/allocator/tlsf/Root#getHead (; 8 ;) (type $iiii) (param $0 i32) (param $1 i32) (param $2 i32) (result i32)
  ;;@ ~lib/allocator/tlsf.ts:158:4
  (if
   (i32.eqz
    ;;@ ~lib/allocator/tlsf.ts:158:11
    (i32.lt_u
     (get_local $1)
     ;;@ ~lib/allocator/tlsf.ts:158:16
     (get_global $~lib/allocator/tlsf/FL_BITS)
    )
   )
   (block
    (call $~lib/env/abort
     (i32.const 0)
     (i32.const 8)
     (i32.const 158)
     (i32.const 4)
    )
    (unreachable)
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:159:4
  (if
   (i32.eqz
    ;;@ ~lib/allocator/tlsf.ts:159:11
    (i32.lt_u
     (get_local $2)
     ;;@ ~lib/allocator/tlsf.ts:159:16
     (get_global $~lib/allocator/tlsf/SL_SIZE)
    )
   )
   (block
    (call $~lib/env/abort
     (i32.const 0)
     (i32.const 8)
     (i32.const 159)
     (i32.const 4)
    )
    (unreachable)
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:162:20
  (i32.load offset=96
   ;;@ ~lib/allocator/tlsf.ts:161:6
   (i32.add
    (get_local $0)
    ;;@ ~lib/allocator/tlsf.ts:161:32
    (i32.mul
     (i32.add
      ;;@ ~lib/allocator/tlsf.ts:161:33
      (i32.mul
       (get_local $1)
       ;;@ ~lib/allocator/tlsf.ts:161:38
       (get_global $~lib/allocator/tlsf/SL_SIZE)
      )
      ;;@ ~lib/allocator/tlsf.ts:161:48
      (get_local $2)
     )
     ;;@ ~lib/allocator/tlsf.ts:161:61
     (i32.const 4)
    )
   )
  )
 )
 (func $~lib/allocator/tlsf/Root#getSLMap (; 9 ;) (type $iii) (param $0 i32) (param $1 i32) (result i32)
  ;;@ ~lib/allocator/tlsf.ts:138:4
  (if
   (i32.eqz
    ;;@ ~lib/allocator/tlsf.ts:138:11
    (i32.lt_u
     (get_local $1)
     ;;@ ~lib/allocator/tlsf.ts:138:16
     (get_global $~lib/allocator/tlsf/FL_BITS)
    )
   )
   (block
    (call $~lib/env/abort
     (i32.const 0)
     (i32.const 8)
     (i32.const 138)
     (i32.const 4)
    )
    (unreachable)
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:139:68
  (i32.load offset=4
   ;;@ ~lib/allocator/tlsf.ts:139:21
   (i32.add
    (get_local $0)
    ;;@ ~lib/allocator/tlsf.ts:139:47
    (i32.mul
     (get_local $1)
     ;;@ ~lib/allocator/tlsf.ts:139:52
     (i32.const 4)
    )
   )
  )
 )
 (func $~lib/allocator/tlsf/Root#remove (; 10 ;) (type $iiv) (param $0 i32) (param $1 i32)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  (local $6 i32)
  (local $7 i32)
  (local $8 i32)
  ;;@ ~lib/allocator/tlsf.ts:257:4
  (set_local $2
   ;;@ ~lib/allocator/tlsf.ts:257:20
   (i32.load
    (get_local $1)
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:258:4
  (if
   (i32.eqz
    ;;@ ~lib/allocator/tlsf.ts:258:11
    (i32.and
     (get_local $2)
     ;;@ ~lib/allocator/tlsf.ts:258:23
     (get_global $~lib/allocator/tlsf/FREE)
    )
   )
   (block
    (call $~lib/env/abort
     (i32.const 0)
     (i32.const 8)
     (i32.const 258)
     (i32.const 4)
    )
    (unreachable)
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:259:4
  (set_local $3
   ;;@ ~lib/allocator/tlsf.ts:259:15
   (i32.and
    (get_local $2)
    ;;@ ~lib/allocator/tlsf.ts:259:27
    (i32.xor
     ;;@ ~lib/allocator/tlsf.ts:259:28
     (get_global $~lib/allocator/tlsf/TAGS)
     (i32.const -1)
    )
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:260:4
  (if
   (i32.eqz
    ;;@ ~lib/allocator/tlsf.ts:260:11
    (if (result i32)
     (tee_local $4
      (i32.ge_u
       (get_local $3)
       ;;@ ~lib/allocator/tlsf.ts:260:19
       (get_global $~lib/allocator/tlsf/Block.MIN_SIZE)
      )
     )
     ;;@ ~lib/allocator/tlsf.ts:260:37
     (i32.lt_u
      (get_local $3)
      ;;@ ~lib/allocator/tlsf.ts:260:44
      (get_global $~lib/allocator/tlsf/Block.MAX_SIZE)
     )
     (get_local $4)
    )
   )
   (block
    (call $~lib/env/abort
     (i32.const 0)
     (i32.const 8)
     (i32.const 260)
     (i32.const 4)
    )
    (unreachable)
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:264:4
  (if
   ;;@ ~lib/allocator/tlsf.ts:264:8
   (i32.lt_u
    (get_local $3)
    ;;@ ~lib/allocator/tlsf.ts:264:15
    (get_global $~lib/allocator/tlsf/SB_SIZE)
   )
   ;;@ ~lib/allocator/tlsf.ts:264:24
   (block
    ;;@ ~lib/allocator/tlsf.ts:265:6
    (set_local $5
     ;;@ ~lib/allocator/tlsf.ts:265:11
     (i32.const 0)
    )
    ;;@ ~lib/allocator/tlsf.ts:266:6
    (set_local $6
     ;;@ ~lib/allocator/tlsf.ts:266:11
     (i32.div_u
      ;;@ ~lib/allocator/tlsf.ts:266:17
      (get_local $3)
      ;;@ ~lib/allocator/tlsf.ts:266:24
      (get_global $~lib/internal/allocator/AL_SIZE)
     )
    )
   )
   ;;@ ~lib/allocator/tlsf.ts:267:11
   (block
    ;;@ ~lib/allocator/tlsf.ts:268:6
    (set_local $5
     ;;@ ~lib/allocator/tlsf.ts:268:11
     (call $~lib/allocator/tlsf/fls<usize>
      ;;@ ~lib/allocator/tlsf.ts:268:22
      (get_local $3)
     )
    )
    ;;@ ~lib/allocator/tlsf.ts:269:6
    (set_local $6
     ;;@ ~lib/allocator/tlsf.ts:269:11
     (i32.xor
      ;;@ ~lib/allocator/tlsf.ts:269:17
      (i32.shr_u
       ;;@ ~lib/allocator/tlsf.ts:269:18
       (get_local $3)
       ;;@ ~lib/allocator/tlsf.ts:269:26
       (i32.sub
        ;;@ ~lib/allocator/tlsf.ts:269:27
        (get_local $5)
        ;;@ ~lib/allocator/tlsf.ts:269:32
        (get_global $~lib/allocator/tlsf/SL_BITS)
       )
      )
      ;;@ ~lib/allocator/tlsf.ts:269:44
      (i32.shl
       ;;@ ~lib/allocator/tlsf.ts:269:45
       (i32.const 1)
       ;;@ ~lib/allocator/tlsf.ts:269:50
       (get_global $~lib/allocator/tlsf/SL_BITS)
      )
     )
    )
    ;;@ ~lib/allocator/tlsf.ts:270:6
    (set_local $5
     (i32.sub
      (get_local $5)
      ;;@ ~lib/allocator/tlsf.ts:270:12
      (i32.sub
       (get_global $~lib/allocator/tlsf/SB_BITS)
       ;;@ ~lib/allocator/tlsf.ts:270:22
       (i32.const 1)
      )
     )
    )
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:274:4
  (set_local $7
   ;;@ ~lib/allocator/tlsf.ts:274:15
   (i32.load offset=4
    (get_local $1)
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:275:4
  (set_local $8
   ;;@ ~lib/allocator/tlsf.ts:275:15
   (i32.load offset=8
    (get_local $1)
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:276:4
  (if
   ;;@ ~lib/allocator/tlsf.ts:276:8
   (get_local $7)
   ;;@ ~lib/allocator/tlsf.ts:276:14
   (i32.store offset=8
    (get_local $7)
    ;;@ ~lib/allocator/tlsf.ts:276:26
    (get_local $8)
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:277:4
  (if
   ;;@ ~lib/allocator/tlsf.ts:277:8
   (get_local $8)
   ;;@ ~lib/allocator/tlsf.ts:277:14
   (i32.store offset=4
    (get_local $8)
    ;;@ ~lib/allocator/tlsf.ts:277:26
    (get_local $7)
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:280:4
  (if
   ;;@ ~lib/allocator/tlsf.ts:280:8
   (i32.eq
    (get_local $1)
    ;;@ ~lib/allocator/tlsf.ts:280:22
    (call $~lib/allocator/tlsf/Root#getHead
     ;;@ ~lib/allocator/tlsf.ts:280:17
     (get_local $0)
     ;;@ ~lib/allocator/tlsf.ts:280:30
     (get_local $5)
     ;;@ ~lib/allocator/tlsf.ts:280:34
     (get_local $6)
    )
   )
   ;;@ ~lib/allocator/tlsf.ts:280:39
   (block
    ;;@ ~lib/allocator/tlsf.ts:281:11
    (call $~lib/allocator/tlsf/Root#setHead
     ;;@ ~lib/allocator/tlsf.ts:281:6
     (get_local $0)
     ;;@ ~lib/allocator/tlsf.ts:281:19
     (get_local $5)
     ;;@ ~lib/allocator/tlsf.ts:281:23
     (get_local $6)
     ;;@ ~lib/allocator/tlsf.ts:281:27
     (get_local $8)
    )
    ;;@ ~lib/allocator/tlsf.ts:284:6
    (if
     ;;@ ~lib/allocator/tlsf.ts:284:10
     (i32.eqz
      ;;@ ~lib/allocator/tlsf.ts:284:11
      (get_local $8)
     )
     ;;@ ~lib/allocator/tlsf.ts:284:17
     (block
      ;;@ ~lib/allocator/tlsf.ts:285:8
      (set_local $4
       ;;@ ~lib/allocator/tlsf.ts:285:25
       (call $~lib/allocator/tlsf/Root#getSLMap
        ;;@ ~lib/allocator/tlsf.ts:285:20
        (get_local $0)
        ;;@ ~lib/allocator/tlsf.ts:285:34
        (get_local $5)
       )
      )
      ;;@ ~lib/allocator/tlsf.ts:286:13
      (call $~lib/allocator/tlsf/Root#setSLMap
       ;;@ ~lib/allocator/tlsf.ts:286:8
       (get_local $0)
       ;;@ ~lib/allocator/tlsf.ts:286:22
       (get_local $5)
       ;;@ ~lib/allocator/tlsf.ts:286:26
       (tee_local $4
        (i32.and
         (get_local $4)
         ;;@ ~lib/allocator/tlsf.ts:286:35
         (i32.xor
          ;;@ ~lib/allocator/tlsf.ts:286:36
          (i32.shl
           ;;@ ~lib/allocator/tlsf.ts:286:37
           (i32.const 1)
           ;;@ ~lib/allocator/tlsf.ts:286:42
           (get_local $6)
          )
          (i32.const -1)
         )
        )
       )
      )
      ;;@ ~lib/allocator/tlsf.ts:289:8
      (if
       ;;@ ~lib/allocator/tlsf.ts:289:12
       (i32.eqz
        ;;@ ~lib/allocator/tlsf.ts:289:13
        (get_local $4)
       )
       ;;@ ~lib/allocator/tlsf.ts:289:20
       (i32.store
        (get_local $0)
        (i32.and
         (i32.load
          (get_local $0)
         )
         ;;@ ~lib/allocator/tlsf.ts:289:34
         (i32.xor
          ;;@ ~lib/allocator/tlsf.ts:289:35
          (i32.shl
           ;;@ ~lib/allocator/tlsf.ts:289:36
           (i32.const 1)
           ;;@ ~lib/allocator/tlsf.ts:289:41
           (get_local $5)
          )
          (i32.const -1)
         )
        )
       )
      )
     )
    )
   )
  )
 )
 (func $~lib/allocator/tlsf/Block#get:left (; 11 ;) (type $ii) (param $0 i32) (result i32)
  (local $1 i32)
  ;;@ ~lib/allocator/tlsf.ts:81:4
  (if
   (i32.eqz
    ;;@ ~lib/allocator/tlsf.ts:81:11
    (i32.and
     (i32.load
      (get_local $0)
     )
     ;;@ ~lib/allocator/tlsf.ts:81:23
     (get_global $~lib/allocator/tlsf/LEFT_FREE)
    )
   )
   (block
    (call $~lib/env/abort
     (i32.const 0)
     (i32.const 8)
     (i32.const 81)
     (i32.const 4)
    )
    (unreachable)
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:84:4
  (if (result i32)
   (i32.eqz
    (tee_local $1
     ;;@ ~lib/allocator/tlsf.ts:83:6
     (i32.load
      ;;@ ~lib/allocator/tlsf.ts:83:18
      (i32.sub
       (get_local $0)
       ;;@ ~lib/allocator/tlsf.ts:83:44
       (i32.const 4)
      )
     )
    )
   )
   (block
    (call $~lib/env/abort
     (i32.const 0)
     (i32.const 8)
     (i32.const 82)
     (i32.const 11)
    )
    (unreachable)
   )
   (get_local $1)
  )
 )
 (func $~lib/allocator/tlsf/Root#setJump (; 12 ;) (type $iiiv) (param $0 i32) (param $1 i32) (param $2 i32)
  ;;@ ~lib/allocator/tlsf.ts:334:4
  (if
   (i32.eqz
    ;;@ ~lib/allocator/tlsf.ts:334:11
    (i32.and
     (i32.load
      (get_local $1)
     )
     ;;@ ~lib/allocator/tlsf.ts:334:23
     (get_global $~lib/allocator/tlsf/FREE)
    )
   )
   (block
    (call $~lib/env/abort
     (i32.const 0)
     (i32.const 8)
     (i32.const 334)
     (i32.const 4)
    )
    (unreachable)
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:335:4
  (if
   (i32.eqz
    ;;@ ~lib/allocator/tlsf.ts:335:11
    (i32.eq
     (call $~lib/allocator/tlsf/Block#get:right
      (get_local $1)
     )
     ;;@ ~lib/allocator/tlsf.ts:335:25
     (get_local $2)
    )
   )
   (block
    (call $~lib/env/abort
     (i32.const 0)
     (i32.const 8)
     (i32.const 335)
     (i32.const 4)
    )
    (unreachable)
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:336:4
  (if
   (i32.eqz
    ;;@ ~lib/allocator/tlsf.ts:336:11
    (i32.and
     (i32.load
      (get_local $2)
     )
     ;;@ ~lib/allocator/tlsf.ts:336:24
     (get_global $~lib/allocator/tlsf/LEFT_FREE)
    )
   )
   (block
    (call $~lib/env/abort
     (i32.const 0)
     (i32.const 8)
     (i32.const 336)
     (i32.const 4)
    )
    (unreachable)
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:337:4
  (i32.store
   ;;@ ~lib/allocator/tlsf.ts:338:6
   (i32.sub
    (get_local $2)
    ;;@ ~lib/allocator/tlsf.ts:338:33
    (i32.const 4)
   )
   ;;@ ~lib/allocator/tlsf.ts:339:6
   (get_local $1)
  )
 )
 (func $~lib/allocator/tlsf/Root#insert (; 13 ;) (type $iiv) (param $0 i32) (param $1 i32)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  (local $6 i32)
  (local $7 i32)
  (local $8 i32)
  (local $9 i32)
  (local $10 i32)
  ;;@ ~lib/allocator/tlsf.ts:189:4
  (if
   (i32.eqz
    ;;@ ~lib/allocator/tlsf.ts:189:11
    (get_local $1)
   )
   (block
    (call $~lib/env/abort
     (i32.const 0)
     (i32.const 8)
     (i32.const 189)
     (i32.const 4)
    )
    (unreachable)
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:190:4
  (set_local $2
   ;;@ ~lib/allocator/tlsf.ts:190:20
   (i32.load
    (get_local $1)
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:191:4
  (if
   (i32.eqz
    ;;@ ~lib/allocator/tlsf.ts:191:11
    (i32.and
     (get_local $2)
     ;;@ ~lib/allocator/tlsf.ts:191:23
     (get_global $~lib/allocator/tlsf/FREE)
    )
   )
   (block
    (call $~lib/env/abort
     (i32.const 0)
     (i32.const 8)
     (i32.const 191)
     (i32.const 4)
    )
    (unreachable)
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:193:4
  (if
   (i32.eqz
    ;;@ ~lib/allocator/tlsf.ts:194:6
    (if (result i32)
     (tee_local $4
      (i32.ge_u
       (tee_local $3
        ;;@ ~lib/allocator/tlsf.ts:194:14
        (i32.and
         (i32.load
          (get_local $1)
         )
         ;;@ ~lib/allocator/tlsf.ts:194:27
         (i32.xor
          ;;@ ~lib/allocator/tlsf.ts:194:28
          (get_global $~lib/allocator/tlsf/TAGS)
          (i32.const -1)
         )
        )
       )
       ;;@ ~lib/allocator/tlsf.ts:194:37
       (get_global $~lib/allocator/tlsf/Block.MIN_SIZE)
      )
     )
     ;;@ ~lib/allocator/tlsf.ts:194:55
     (i32.lt_u
      (get_local $3)
      ;;@ ~lib/allocator/tlsf.ts:194:62
      (get_global $~lib/allocator/tlsf/Block.MAX_SIZE)
     )
     (get_local $4)
    )
   )
   (block
    (call $~lib/env/abort
     (i32.const 0)
     (i32.const 8)
     (i32.const 193)
     (i32.const 4)
    )
    (unreachable)
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:197:4
  (set_local $5
   ;;@ ~lib/allocator/tlsf.ts:197:23
   (if (result i32)
    (i32.eqz
     (tee_local $4
      ;;@ ~lib/allocator/tlsf.ts:197:30
      (call $~lib/allocator/tlsf/Block#get:right
       (get_local $1)
      )
     )
    )
    (block
     (call $~lib/env/abort
      (i32.const 0)
      (i32.const 8)
      (i32.const 197)
      (i32.const 23)
     )
     (unreachable)
    )
    (get_local $4)
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:198:4
  (set_local $6
   ;;@ ~lib/allocator/tlsf.ts:198:20
   (i32.load
    (get_local $5)
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:201:4
  (if
   ;;@ ~lib/allocator/tlsf.ts:201:8
   (i32.and
    (get_local $6)
    ;;@ ~lib/allocator/tlsf.ts:201:20
    (get_global $~lib/allocator/tlsf/FREE)
   )
   ;;@ ~lib/allocator/tlsf.ts:201:26
   (block
    ;;@ ~lib/allocator/tlsf.ts:202:11
    (call $~lib/allocator/tlsf/Root#remove
     ;;@ ~lib/allocator/tlsf.ts:202:6
     (get_local $0)
     ;;@ ~lib/allocator/tlsf.ts:202:18
     (get_local $5)
    )
    ;;@ ~lib/allocator/tlsf.ts:203:6
    (i32.store
     (get_local $1)
     ;;@ ~lib/allocator/tlsf.ts:203:19
     (tee_local $2
      (i32.add
       ;;@ ~lib/allocator/tlsf.ts:203:20
       (get_local $2)
       ;;@ ~lib/allocator/tlsf.ts:203:33
       (i32.add
        (get_global $~lib/allocator/tlsf/Block.INFO)
        ;;@ ~lib/allocator/tlsf.ts:203:46
        (i32.and
         ;;@ ~lib/allocator/tlsf.ts:203:47
         (get_local $6)
         ;;@ ~lib/allocator/tlsf.ts:203:59
         (i32.xor
          ;;@ ~lib/allocator/tlsf.ts:203:60
          (get_global $~lib/allocator/tlsf/TAGS)
          (i32.const -1)
         )
        )
       )
      )
     )
    )
    ;;@ ~lib/allocator/tlsf.ts:204:6
    (set_local $5
     ;;@ ~lib/allocator/tlsf.ts:204:14
     (call $~lib/allocator/tlsf/Block#get:right
      (get_local $1)
     )
    )
    ;;@ ~lib/allocator/tlsf.ts:205:6
    (set_local $6
     ;;@ ~lib/allocator/tlsf.ts:205:18
     (i32.load
      (get_local $5)
     )
    )
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:210:4
  (if
   ;;@ ~lib/allocator/tlsf.ts:210:8
   (i32.and
    (get_local $2)
    ;;@ ~lib/allocator/tlsf.ts:210:20
    (get_global $~lib/allocator/tlsf/LEFT_FREE)
   )
   ;;@ ~lib/allocator/tlsf.ts:210:31
   (block
    ;;@ ~lib/allocator/tlsf.ts:211:6
    (set_local $4
     ;;@ ~lib/allocator/tlsf.ts:211:24
     (if (result i32)
      (i32.eqz
       (tee_local $4
        ;;@ ~lib/allocator/tlsf.ts:211:31
        (call $~lib/allocator/tlsf/Block#get:left
         (get_local $1)
        )
       )
      )
      (block
       (call $~lib/env/abort
        (i32.const 0)
        (i32.const 8)
        (i32.const 211)
        (i32.const 24)
       )
       (unreachable)
      )
      (get_local $4)
     )
    )
    ;;@ ~lib/allocator/tlsf.ts:212:6
    (set_local $7
     ;;@ ~lib/allocator/tlsf.ts:212:21
     (i32.load
      (get_local $4)
     )
    )
    ;;@ ~lib/allocator/tlsf.ts:213:6
    (if
     (i32.eqz
      ;;@ ~lib/allocator/tlsf.ts:213:13
      (i32.and
       (get_local $7)
       ;;@ ~lib/allocator/tlsf.ts:213:24
       (get_global $~lib/allocator/tlsf/FREE)
      )
     )
     (block
      (call $~lib/env/abort
       (i32.const 0)
       (i32.const 8)
       (i32.const 213)
       (i32.const 6)
      )
      (unreachable)
     )
    )
    ;;@ ~lib/allocator/tlsf.ts:214:11
    (call $~lib/allocator/tlsf/Root#remove
     ;;@ ~lib/allocator/tlsf.ts:214:6
     (get_local $0)
     ;;@ ~lib/allocator/tlsf.ts:214:18
     (get_local $4)
    )
    ;;@ ~lib/allocator/tlsf.ts:215:6
    (i32.store
     (get_local $4)
     ;;@ ~lib/allocator/tlsf.ts:215:18
     (tee_local $7
      (i32.add
       ;;@ ~lib/allocator/tlsf.ts:215:19
       (get_local $7)
       ;;@ ~lib/allocator/tlsf.ts:215:31
       (i32.add
        (get_global $~lib/allocator/tlsf/Block.INFO)
        ;;@ ~lib/allocator/tlsf.ts:215:44
        (i32.and
         ;;@ ~lib/allocator/tlsf.ts:215:45
         (get_local $2)
         ;;@ ~lib/allocator/tlsf.ts:215:57
         (i32.xor
          ;;@ ~lib/allocator/tlsf.ts:215:58
          (get_global $~lib/allocator/tlsf/TAGS)
          (i32.const -1)
         )
        )
       )
      )
     )
    )
    ;;@ ~lib/allocator/tlsf.ts:216:6
    (set_local $1
     ;;@ ~lib/allocator/tlsf.ts:216:14
     (get_local $4)
    )
    ;;@ ~lib/allocator/tlsf.ts:217:6
    (set_local $2
     ;;@ ~lib/allocator/tlsf.ts:217:18
     (get_local $7)
    )
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:221:4
  (i32.store
   (get_local $5)
   ;;@ ~lib/allocator/tlsf.ts:221:17
   (i32.or
    (get_local $6)
    ;;@ ~lib/allocator/tlsf.ts:221:29
    (get_global $~lib/allocator/tlsf/LEFT_FREE)
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:222:9
  (call $~lib/allocator/tlsf/Root#setJump
   ;;@ ~lib/allocator/tlsf.ts:222:4
   (get_local $0)
   ;;@ ~lib/allocator/tlsf.ts:222:17
   (get_local $1)
   ;;@ ~lib/allocator/tlsf.ts:222:24
   (get_local $5)
  )
  ;;@ ~lib/allocator/tlsf.ts:225:4
  (set_local $3
   ;;@ ~lib/allocator/tlsf.ts:225:11
   (i32.and
    (get_local $2)
    ;;@ ~lib/allocator/tlsf.ts:225:23
    (i32.xor
     ;;@ ~lib/allocator/tlsf.ts:225:24
     (get_global $~lib/allocator/tlsf/TAGS)
     (i32.const -1)
    )
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:226:4
  (if
   (i32.eqz
    ;;@ ~lib/allocator/tlsf.ts:226:11
    (if (result i32)
     (tee_local $7
      (i32.ge_u
       (get_local $3)
       ;;@ ~lib/allocator/tlsf.ts:226:19
       (get_global $~lib/allocator/tlsf/Block.MIN_SIZE)
      )
     )
     ;;@ ~lib/allocator/tlsf.ts:226:37
     (i32.lt_u
      (get_local $3)
      ;;@ ~lib/allocator/tlsf.ts:226:44
      (get_global $~lib/allocator/tlsf/Block.MAX_SIZE)
     )
     (get_local $7)
    )
   )
   (block
    (call $~lib/env/abort
     (i32.const 0)
     (i32.const 8)
     (i32.const 226)
     (i32.const 4)
    )
    (unreachable)
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:230:4
  (if
   ;;@ ~lib/allocator/tlsf.ts:230:8
   (i32.lt_u
    (get_local $3)
    ;;@ ~lib/allocator/tlsf.ts:230:15
    (get_global $~lib/allocator/tlsf/SB_SIZE)
   )
   ;;@ ~lib/allocator/tlsf.ts:230:24
   (block
    ;;@ ~lib/allocator/tlsf.ts:231:6
    (set_local $8
     ;;@ ~lib/allocator/tlsf.ts:231:11
     (i32.const 0)
    )
    ;;@ ~lib/allocator/tlsf.ts:232:6
    (set_local $9
     ;;@ ~lib/allocator/tlsf.ts:232:11
     (i32.div_u
      ;;@ ~lib/allocator/tlsf.ts:232:17
      (get_local $3)
      ;;@ ~lib/allocator/tlsf.ts:232:24
      (get_global $~lib/internal/allocator/AL_SIZE)
     )
    )
   )
   ;;@ ~lib/allocator/tlsf.ts:233:11
   (block
    ;;@ ~lib/allocator/tlsf.ts:234:6
    (set_local $8
     ;;@ ~lib/allocator/tlsf.ts:234:11
     (call $~lib/allocator/tlsf/fls<usize>
      ;;@ ~lib/allocator/tlsf.ts:234:22
      (get_local $3)
     )
    )
    ;;@ ~lib/allocator/tlsf.ts:235:6
    (set_local $9
     ;;@ ~lib/allocator/tlsf.ts:235:11
     (i32.xor
      ;;@ ~lib/allocator/tlsf.ts:235:17
      (i32.shr_u
       ;;@ ~lib/allocator/tlsf.ts:235:18
       (get_local $3)
       ;;@ ~lib/allocator/tlsf.ts:235:26
       (i32.sub
        ;;@ ~lib/allocator/tlsf.ts:235:27
        (get_local $8)
        ;;@ ~lib/allocator/tlsf.ts:235:32
        (get_global $~lib/allocator/tlsf/SL_BITS)
       )
      )
      ;;@ ~lib/allocator/tlsf.ts:235:44
      (i32.shl
       ;;@ ~lib/allocator/tlsf.ts:235:45
       (i32.const 1)
       ;;@ ~lib/allocator/tlsf.ts:235:50
       (get_global $~lib/allocator/tlsf/SL_BITS)
      )
     )
    )
    ;;@ ~lib/allocator/tlsf.ts:236:6
    (set_local $8
     (i32.sub
      (get_local $8)
      ;;@ ~lib/allocator/tlsf.ts:236:12
      (i32.sub
       (get_global $~lib/allocator/tlsf/SB_BITS)
       ;;@ ~lib/allocator/tlsf.ts:236:22
       (i32.const 1)
      )
     )
    )
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:240:4
  (set_local $10
   ;;@ ~lib/allocator/tlsf.ts:240:20
   (call $~lib/allocator/tlsf/Root#getHead
    ;;@ ~lib/allocator/tlsf.ts:240:15
    (get_local $0)
    ;;@ ~lib/allocator/tlsf.ts:240:28
    (get_local $8)
    ;;@ ~lib/allocator/tlsf.ts:240:32
    (get_local $9)
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:241:4
  (i32.store offset=4
   (get_local $1)
   ;;@ ~lib/allocator/tlsf.ts:241:17
   (i32.const 0)
  )
  ;;@ ~lib/allocator/tlsf.ts:242:4
  (i32.store offset=8
   (get_local $1)
   ;;@ ~lib/allocator/tlsf.ts:242:17
   (get_local $10)
  )
  ;;@ ~lib/allocator/tlsf.ts:243:4
  (if
   ;;@ ~lib/allocator/tlsf.ts:243:8
   (get_local $10)
   ;;@ ~lib/allocator/tlsf.ts:243:14
   (i32.store offset=4
    (get_local $10)
    ;;@ ~lib/allocator/tlsf.ts:243:26
    (get_local $1)
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:244:9
  (call $~lib/allocator/tlsf/Root#setHead
   ;;@ ~lib/allocator/tlsf.ts:244:4
   (get_local $0)
   ;;@ ~lib/allocator/tlsf.ts:244:17
   (get_local $8)
   ;;@ ~lib/allocator/tlsf.ts:244:21
   (get_local $9)
   ;;@ ~lib/allocator/tlsf.ts:244:25
   (get_local $1)
  )
  ;;@ ~lib/allocator/tlsf.ts:247:4
  (i32.store
   (get_local $0)
   (i32.or
    (i32.load
     (get_local $0)
    )
    ;;@ ~lib/allocator/tlsf.ts:247:18
    (i32.shl
     ;;@ ~lib/allocator/tlsf.ts:247:19
     (i32.const 1)
     ;;@ ~lib/allocator/tlsf.ts:247:24
     (get_local $8)
    )
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:248:9
  (call $~lib/allocator/tlsf/Root#setSLMap
   ;;@ ~lib/allocator/tlsf.ts:248:4
   (get_local $0)
   ;;@ ~lib/allocator/tlsf.ts:248:18
   (get_local $8)
   ;;@ ~lib/allocator/tlsf.ts:248:22
   (i32.or
    ;;@ ~lib/allocator/tlsf.ts:248:27
    (call $~lib/allocator/tlsf/Root#getSLMap
     ;;@ ~lib/allocator/tlsf.ts:248:22
     (get_local $0)
     ;;@ ~lib/allocator/tlsf.ts:248:36
     (get_local $8)
    )
    ;;@ ~lib/allocator/tlsf.ts:248:42
    (i32.shl
     ;;@ ~lib/allocator/tlsf.ts:248:43
     (i32.const 1)
     ;;@ ~lib/allocator/tlsf.ts:248:48
     (get_local $9)
    )
   )
  )
 )
 (func $~lib/allocator/tlsf/Root#addMemory (; 14 ;) (type $iiii) (param $0 i32) (param $1 i32) (param $2 i32) (result i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  (local $6 i32)
  (local $7 i32)
  (local $8 i32)
  ;;@ ~lib/allocator/tlsf.ts:377:4
  (if
   (i32.eqz
    ;;@ ~lib/allocator/tlsf.ts:377:11
    (i32.le_u
     (get_local $1)
     ;;@ ~lib/allocator/tlsf.ts:377:20
     (get_local $2)
    )
   )
   (block
    (call $~lib/env/abort
     (i32.const 0)
     (i32.const 8)
     (i32.const 377)
     (i32.const 4)
    )
    (unreachable)
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:378:4
  (if
   (i32.eqz
    ;;@ ~lib/allocator/tlsf.ts:378:11
    (i32.eqz
     ;;@ ~lib/allocator/tlsf.ts:378:12
     (i32.and
      ;;@ ~lib/allocator/tlsf.ts:378:13
      (get_local $1)
      ;;@ ~lib/allocator/tlsf.ts:378:21
      (get_global $~lib/internal/allocator/AL_MASK)
     )
    )
   )
   (block
    (call $~lib/env/abort
     (i32.const 0)
     (i32.const 8)
     (i32.const 378)
     (i32.const 4)
    )
    (unreachable)
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:379:4
  (if
   (i32.eqz
    ;;@ ~lib/allocator/tlsf.ts:379:11
    (i32.eqz
     ;;@ ~lib/allocator/tlsf.ts:379:12
     (i32.and
      ;;@ ~lib/allocator/tlsf.ts:379:13
      (get_local $2)
      ;;@ ~lib/allocator/tlsf.ts:379:19
      (get_global $~lib/internal/allocator/AL_MASK)
     )
    )
   )
   (block
    (call $~lib/env/abort
     (i32.const 0)
     (i32.const 8)
     (i32.const 379)
     (i32.const 4)
    )
    (unreachable)
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:381:4
  (set_local $3
   ;;@ ~lib/allocator/tlsf.ts:381:18
   (call $~lib/allocator/tlsf/Root#get:tailRef
    (get_local $0)
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:382:4
  (set_local $4
   ;;@ ~lib/allocator/tlsf.ts:382:26
   (i32.const 0)
  )
  ;;@ ~lib/allocator/tlsf.ts:383:4
  (if
   ;;@ ~lib/allocator/tlsf.ts:383:8
   (get_local $3)
   ;;@ ~lib/allocator/tlsf.ts:383:17
   (block
    ;;@ ~lib/allocator/tlsf.ts:384:6
    (if
     (i32.eqz
      ;;@ ~lib/allocator/tlsf.ts:384:13
      (i32.ge_u
       (get_local $1)
       ;;@ ~lib/allocator/tlsf.ts:384:22
       (i32.add
        (get_local $3)
        ;;@ ~lib/allocator/tlsf.ts:384:32
        (i32.const 4)
       )
      )
     )
     (block
      (call $~lib/env/abort
       (i32.const 0)
       (i32.const 8)
       (i32.const 384)
       (i32.const 6)
      )
      (unreachable)
     )
    )
    ;;@ ~lib/allocator/tlsf.ts:387:6
    (if
     ;;@ ~lib/allocator/tlsf.ts:387:10
     (i32.eq
      (i32.sub
       (get_local $1)
       ;;@ ~lib/allocator/tlsf.ts:387:18
       (get_global $~lib/allocator/tlsf/Block.INFO)
      )
      ;;@ ~lib/allocator/tlsf.ts:387:32
      (get_local $3)
     )
     ;;@ ~lib/allocator/tlsf.ts:387:41
     (block
      ;;@ ~lib/allocator/tlsf.ts:388:8
      (set_local $1
       (i32.sub
        (get_local $1)
        ;;@ ~lib/allocator/tlsf.ts:388:17
        (get_global $~lib/allocator/tlsf/Block.INFO)
       )
      )
      ;;@ ~lib/allocator/tlsf.ts:389:8
      (set_local $4
       ;;@ ~lib/allocator/tlsf.ts:389:19
       (i32.load
        (get_local $3)
       )
      )
     )
    )
   )
   ;;@ ~lib/allocator/tlsf.ts:392:11
   (if
    (i32.eqz
     ;;@ ~lib/allocator/tlsf.ts:393:13
     (i32.ge_u
      (get_local $1)
      ;;@ ~lib/allocator/tlsf.ts:393:22
      (i32.add
       (get_local $0)
       ;;@ ~lib/allocator/tlsf.ts:393:48
       (get_global $~lib/allocator/tlsf/Root.SIZE)
      )
     )
    )
    (block
     (call $~lib/env/abort
      (i32.const 0)
      (i32.const 8)
      (i32.const 393)
      (i32.const 6)
     )
     (unreachable)
    )
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:397:4
  (set_local $5
   ;;@ ~lib/allocator/tlsf.ts:397:15
   (i32.sub
    (get_local $2)
    ;;@ ~lib/allocator/tlsf.ts:397:21
    (get_local $1)
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:398:4
  (if
   ;;@ ~lib/allocator/tlsf.ts:398:8
   (i32.lt_u
    (get_local $5)
    ;;@ ~lib/allocator/tlsf.ts:398:15
    (i32.add
     (i32.add
      (get_global $~lib/allocator/tlsf/Block.INFO)
      ;;@ ~lib/allocator/tlsf.ts:398:28
      (get_global $~lib/allocator/tlsf/Block.MIN_SIZE)
     )
     ;;@ ~lib/allocator/tlsf.ts:398:45
     (get_global $~lib/allocator/tlsf/Block.INFO)
    )
   )
   ;;@ ~lib/allocator/tlsf.ts:398:57
   (return
    ;;@ ~lib/allocator/tlsf.ts:399:13
    (i32.const 0)
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:403:4
  (set_local $6
   ;;@ ~lib/allocator/tlsf.ts:403:19
   (i32.sub
    (get_local $5)
    ;;@ ~lib/allocator/tlsf.ts:403:26
    (i32.mul
     (i32.const 2)
     ;;@ ~lib/allocator/tlsf.ts:403:30
     (get_global $~lib/allocator/tlsf/Block.INFO)
    )
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:404:4
  (set_local $7
   ;;@ ~lib/allocator/tlsf.ts:404:15
   (get_local $1)
  )
  ;;@ ~lib/allocator/tlsf.ts:405:4
  (i32.store
   (get_local $7)
   ;;@ ~lib/allocator/tlsf.ts:405:16
   (i32.or
    (i32.or
     (get_local $6)
     ;;@ ~lib/allocator/tlsf.ts:405:27
     (get_global $~lib/allocator/tlsf/FREE)
    )
    ;;@ ~lib/allocator/tlsf.ts:405:34
    (i32.and
     ;;@ ~lib/allocator/tlsf.ts:405:35
     (get_local $4)
     ;;@ ~lib/allocator/tlsf.ts:405:46
     (get_global $~lib/allocator/tlsf/LEFT_FREE)
    )
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:406:4
  (i32.store offset=4
   (get_local $7)
   ;;@ ~lib/allocator/tlsf.ts:406:16
   (i32.const 0)
  )
  ;;@ ~lib/allocator/tlsf.ts:407:4
  (i32.store offset=8
   (get_local $7)
   ;;@ ~lib/allocator/tlsf.ts:407:16
   (i32.const 0)
  )
  ;;@ ~lib/allocator/tlsf.ts:410:4
  (set_local $8
   ;;@ ~lib/allocator/tlsf.ts:410:15
   (i32.sub
    ;;@ ~lib/allocator/tlsf.ts:410:33
    (i32.add
     (get_local $1)
     ;;@ ~lib/allocator/tlsf.ts:410:41
     (get_local $5)
    )
    ;;@ ~lib/allocator/tlsf.ts:410:48
    (get_global $~lib/allocator/tlsf/Block.INFO)
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:411:4
  (i32.store
   (get_local $8)
   ;;@ ~lib/allocator/tlsf.ts:411:16
   (i32.or
    (i32.const 0)
    ;;@ ~lib/allocator/tlsf.ts:411:20
    (get_global $~lib/allocator/tlsf/LEFT_FREE)
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:412:4
  (call $~lib/allocator/tlsf/Root#set:tailRef
   (get_local $0)
   ;;@ ~lib/allocator/tlsf.ts:412:19
   (get_local $8)
  )
  ;;@ ~lib/allocator/tlsf.ts:414:9
  (call $~lib/allocator/tlsf/Root#insert
   ;;@ ~lib/allocator/tlsf.ts:414:4
   (get_local $0)
   ;;@ ~lib/allocator/tlsf.ts:414:16
   (get_local $7)
  )
  ;;@ ~lib/allocator/tlsf.ts:416:11
  (i32.const 1)
 )
 (func $~lib/allocator/tlsf/ffs<usize> (; 15 ;) (type $ii) (param $0 i32) (result i32)
  ;;@ ~lib/allocator/tlsf.ts:422:2
  (if
   (i32.eqz
    ;;@ ~lib/allocator/tlsf.ts:422:9
    (i32.ne
     (get_local $0)
     ;;@ ~lib/allocator/tlsf.ts:422:17
     (i32.const 0)
    )
   )
   (block
    (call $~lib/env/abort
     (i32.const 0)
     (i32.const 8)
     (i32.const 422)
     (i32.const 2)
    )
    (unreachable)
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:423:20
  (i32.ctz
   ;;@ ~lib/allocator/tlsf.ts:423:16
   (get_local $0)
  )
 )
 (func $~lib/allocator/tlsf/ffs<u32> (; 16 ;) (type $ii) (param $0 i32) (result i32)
  ;;@ ~lib/allocator/tlsf.ts:422:2
  (if
   (i32.eqz
    ;;@ ~lib/allocator/tlsf.ts:422:9
    (i32.ne
     (get_local $0)
     ;;@ ~lib/allocator/tlsf.ts:422:17
     (i32.const 0)
    )
   )
   (block
    (call $~lib/env/abort
     (i32.const 0)
     (i32.const 8)
     (i32.const 422)
     (i32.const 2)
    )
    (unreachable)
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:423:20
  (i32.ctz
   ;;@ ~lib/allocator/tlsf.ts:423:16
   (get_local $0)
  )
 )
 (func $~lib/allocator/tlsf/Root#search (; 17 ;) (type $iii) (param $0 i32) (param $1 i32) (result i32)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  (local $6 i32)
  (local $7 i32)
  ;;@ ~lib/allocator/tlsf.ts:296:4
  (if
   (i32.eqz
    ;;@ ~lib/allocator/tlsf.ts:296:11
    (if (result i32)
     (tee_local $2
      (i32.ge_u
       (get_local $1)
       ;;@ ~lib/allocator/tlsf.ts:296:19
       (get_global $~lib/allocator/tlsf/Block.MIN_SIZE)
      )
     )
     ;;@ ~lib/allocator/tlsf.ts:296:37
     (i32.lt_u
      (get_local $1)
      ;;@ ~lib/allocator/tlsf.ts:296:44
      (get_global $~lib/allocator/tlsf/Block.MAX_SIZE)
     )
     (get_local $2)
    )
   )
   (block
    (call $~lib/env/abort
     (i32.const 0)
     (i32.const 8)
     (i32.const 296)
     (i32.const 4)
    )
    (unreachable)
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:300:4
  (if
   ;;@ ~lib/allocator/tlsf.ts:300:8
   (i32.lt_u
    (get_local $1)
    ;;@ ~lib/allocator/tlsf.ts:300:15
    (get_global $~lib/allocator/tlsf/SB_SIZE)
   )
   ;;@ ~lib/allocator/tlsf.ts:300:24
   (block
    ;;@ ~lib/allocator/tlsf.ts:301:6
    (set_local $3
     ;;@ ~lib/allocator/tlsf.ts:301:11
     (i32.const 0)
    )
    ;;@ ~lib/allocator/tlsf.ts:302:6
    (set_local $4
     ;;@ ~lib/allocator/tlsf.ts:302:11
     (i32.div_u
      ;;@ ~lib/allocator/tlsf.ts:302:17
      (get_local $1)
      ;;@ ~lib/allocator/tlsf.ts:302:24
      (get_global $~lib/internal/allocator/AL_SIZE)
     )
    )
   )
   ;;@ ~lib/allocator/tlsf.ts:303:11
   (block
    ;;@ ~lib/allocator/tlsf.ts:305:6
    (set_local $3
     ;;@ ~lib/allocator/tlsf.ts:305:11
     (call $~lib/allocator/tlsf/fls<usize>
      ;;@ ~lib/allocator/tlsf.ts:305:22
      (get_local $1)
     )
    )
    ;;@ ~lib/allocator/tlsf.ts:306:6
    (set_local $4
     ;;@ ~lib/allocator/tlsf.ts:306:11
     (i32.xor
      ;;@ ~lib/allocator/tlsf.ts:306:17
      (i32.shr_u
       ;;@ ~lib/allocator/tlsf.ts:306:18
       (get_local $1)
       ;;@ ~lib/allocator/tlsf.ts:306:26
       (i32.sub
        ;;@ ~lib/allocator/tlsf.ts:306:27
        (get_local $3)
        ;;@ ~lib/allocator/tlsf.ts:306:32
        (get_global $~lib/allocator/tlsf/SL_BITS)
       )
      )
      ;;@ ~lib/allocator/tlsf.ts:306:44
      (i32.shl
       ;;@ ~lib/allocator/tlsf.ts:306:45
       (i32.const 1)
       ;;@ ~lib/allocator/tlsf.ts:306:50
       (get_global $~lib/allocator/tlsf/SL_BITS)
      )
     )
    )
    ;;@ ~lib/allocator/tlsf.ts:307:6
    (set_local $3
     (i32.sub
      (get_local $3)
      ;;@ ~lib/allocator/tlsf.ts:307:12
      (i32.sub
       (get_global $~lib/allocator/tlsf/SB_BITS)
       ;;@ ~lib/allocator/tlsf.ts:307:22
       (i32.const 1)
      )
     )
    )
    ;;@ ~lib/allocator/tlsf.ts:309:6
    (if
     ;;@ ~lib/allocator/tlsf.ts:309:10
     (i32.lt_u
      (get_local $4)
      ;;@ ~lib/allocator/tlsf.ts:309:15
      (i32.sub
       (get_global $~lib/allocator/tlsf/SL_SIZE)
       ;;@ ~lib/allocator/tlsf.ts:309:25
       (i32.const 1)
      )
     )
     ;;@ ~lib/allocator/tlsf.ts:309:28
     (set_local $4
      (i32.add
       ;;@ ~lib/allocator/tlsf.ts:309:30
       (get_local $4)
       (i32.const 1)
      )
     )
     ;;@ ~lib/allocator/tlsf.ts:310:11
     (block
      (set_local $3
       (i32.add
        ;;@ ~lib/allocator/tlsf.ts:310:13
        (get_local $3)
        (i32.const 1)
       )
      )
      ;;@ ~lib/allocator/tlsf.ts:310:17
      (set_local $4
       ;;@ ~lib/allocator/tlsf.ts:310:22
       (i32.const 0)
      )
     )
    )
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:314:4
  (set_local $5
   ;;@ ~lib/allocator/tlsf.ts:314:16
   (i32.and
    ;;@ ~lib/allocator/tlsf.ts:314:21
    (call $~lib/allocator/tlsf/Root#getSLMap
     ;;@ ~lib/allocator/tlsf.ts:314:16
     (get_local $0)
     ;;@ ~lib/allocator/tlsf.ts:314:30
     (get_local $3)
    )
    ;;@ ~lib/allocator/tlsf.ts:314:36
    (i32.shl
     ;;@ ~lib/allocator/tlsf.ts:314:37
     (i32.xor
      ;;@ ~lib/allocator/tlsf.ts:314:38
      (i32.const 0)
      (i32.const -1)
     )
     ;;@ ~lib/allocator/tlsf.ts:314:43
     (get_local $4)
    )
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:316:4
  (if
   ;;@ ~lib/allocator/tlsf.ts:316:8
   (i32.eqz
    ;;@ ~lib/allocator/tlsf.ts:316:9
    (get_local $5)
   )
   ;;@ ~lib/allocator/tlsf.ts:316:16
   (block
    ;;@ ~lib/allocator/tlsf.ts:318:6
    (set_local $2
     ;;@ ~lib/allocator/tlsf.ts:318:18
     (i32.and
      (i32.load
       (get_local $0)
      )
      ;;@ ~lib/allocator/tlsf.ts:318:31
      (i32.shl
       ;;@ ~lib/allocator/tlsf.ts:318:32
       (i32.xor
        ;;@ ~lib/allocator/tlsf.ts:318:33
        (i32.const 0)
        (i32.const -1)
       )
       ;;@ ~lib/allocator/tlsf.ts:318:38
       (i32.add
        ;;@ ~lib/allocator/tlsf.ts:318:39
        (get_local $3)
        ;;@ ~lib/allocator/tlsf.ts:318:44
        (i32.const 1)
       )
      )
     )
    )
    ;;@ ~lib/allocator/tlsf.ts:319:6
    (if
     ;;@ ~lib/allocator/tlsf.ts:319:10
     (i32.eqz
      ;;@ ~lib/allocator/tlsf.ts:319:11
      (get_local $2)
     )
     ;;@ ~lib/allocator/tlsf.ts:319:18
     (set_local $6
      ;;@ ~lib/allocator/tlsf.ts:320:15
      (i32.const 0)
     )
     ;;@ ~lib/allocator/tlsf.ts:321:13
     (block
      ;;@ ~lib/allocator/tlsf.ts:322:8
      (set_local $3
       ;;@ ~lib/allocator/tlsf.ts:322:13
       (call $~lib/allocator/tlsf/ffs<usize>
        ;;@ ~lib/allocator/tlsf.ts:322:24
        (get_local $2)
       )
      )
      ;;@ ~lib/allocator/tlsf.ts:323:8
      (set_local $5
       ;;@ ~lib/allocator/tlsf.ts:323:16
       (if (result i32)
        (tee_local $7
         ;;@ ~lib/allocator/tlsf.ts:323:28
         (call $~lib/allocator/tlsf/Root#getSLMap
          ;;@ ~lib/allocator/tlsf.ts:323:23
          (get_local $0)
          ;;@ ~lib/allocator/tlsf.ts:323:37
          (get_local $3)
         )
        )
        (get_local $7)
        (block
         (call $~lib/env/abort
          (i32.const 0)
          (i32.const 8)
          (i32.const 323)
          (i32.const 16)
         )
         (unreachable)
        )
       )
      )
      ;;@ ~lib/allocator/tlsf.ts:324:8
      (set_local $6
       ;;@ ~lib/allocator/tlsf.ts:324:20
       (call $~lib/allocator/tlsf/Root#getHead
        ;;@ ~lib/allocator/tlsf.ts:324:15
        (get_local $0)
        ;;@ ~lib/allocator/tlsf.ts:324:28
        (get_local $3)
        ;;@ ~lib/allocator/tlsf.ts:324:32
        (call $~lib/allocator/tlsf/ffs<u32>
         ;;@ ~lib/allocator/tlsf.ts:324:41
         (get_local $5)
        )
       )
      )
     )
    )
   )
   ;;@ ~lib/allocator/tlsf.ts:326:11
   (set_local $6
    ;;@ ~lib/allocator/tlsf.ts:327:18
    (call $~lib/allocator/tlsf/Root#getHead
     ;;@ ~lib/allocator/tlsf.ts:327:13
     (get_local $0)
     ;;@ ~lib/allocator/tlsf.ts:327:26
     (get_local $3)
     ;;@ ~lib/allocator/tlsf.ts:327:30
     (call $~lib/allocator/tlsf/ffs<u32>
      ;;@ ~lib/allocator/tlsf.ts:327:39
      (get_local $5)
     )
    )
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:329:11
  (get_local $6)
 )
 (func $~lib/allocator/tlsf/Root#use (; 18 ;) (type $iiii) (param $0 i32) (param $1 i32) (param $2 i32) (result i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  ;;@ ~lib/allocator/tlsf.ts:347:4
  (set_local $3
   ;;@ ~lib/allocator/tlsf.ts:347:20
   (i32.load
    (get_local $1)
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:348:4
  (if
   (i32.eqz
    ;;@ ~lib/allocator/tlsf.ts:348:11
    (i32.and
     (get_local $3)
     ;;@ ~lib/allocator/tlsf.ts:348:23
     (get_global $~lib/allocator/tlsf/FREE)
    )
   )
   (block
    (call $~lib/env/abort
     (i32.const 0)
     (i32.const 8)
     (i32.const 348)
     (i32.const 4)
    )
    (unreachable)
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:349:4
  (if
   (i32.eqz
    ;;@ ~lib/allocator/tlsf.ts:349:11
    (if (result i32)
     (tee_local $4
      (i32.ge_u
       (get_local $2)
       ;;@ ~lib/allocator/tlsf.ts:349:19
       (get_global $~lib/allocator/tlsf/Block.MIN_SIZE)
      )
     )
     ;;@ ~lib/allocator/tlsf.ts:349:37
     (i32.lt_u
      (get_local $2)
      ;;@ ~lib/allocator/tlsf.ts:349:44
      (get_global $~lib/allocator/tlsf/Block.MAX_SIZE)
     )
     (get_local $4)
    )
   )
   (block
    (call $~lib/env/abort
     (i32.const 0)
     (i32.const 8)
     (i32.const 349)
     (i32.const 4)
    )
    (unreachable)
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:350:4
  (if
   (i32.eqz
    ;;@ ~lib/allocator/tlsf.ts:350:11
    (i32.eqz
     ;;@ ~lib/allocator/tlsf.ts:350:12
     (i32.and
      ;;@ ~lib/allocator/tlsf.ts:350:13
      (get_local $2)
      ;;@ ~lib/allocator/tlsf.ts:350:20
      (get_global $~lib/internal/allocator/AL_MASK)
     )
    )
   )
   (block
    (call $~lib/env/abort
     (i32.const 0)
     (i32.const 8)
     (i32.const 350)
     (i32.const 4)
    )
    (unreachable)
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:352:9
  (call $~lib/allocator/tlsf/Root#remove
   ;;@ ~lib/allocator/tlsf.ts:352:4
   (get_local $0)
   ;;@ ~lib/allocator/tlsf.ts:352:16
   (get_local $1)
  )
  ;;@ ~lib/allocator/tlsf.ts:355:4
  (set_local $5
   ;;@ ~lib/allocator/tlsf.ts:355:20
   (i32.sub
    (i32.and
     ;;@ ~lib/allocator/tlsf.ts:355:21
     (get_local $3)
     ;;@ ~lib/allocator/tlsf.ts:355:33
     (i32.xor
      ;;@ ~lib/allocator/tlsf.ts:355:34
      (get_global $~lib/allocator/tlsf/TAGS)
      (i32.const -1)
     )
    )
    ;;@ ~lib/allocator/tlsf.ts:355:42
    (get_local $2)
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:356:4
  (if
   ;;@ ~lib/allocator/tlsf.ts:356:8
   (i32.ge_u
    (get_local $5)
    ;;@ ~lib/allocator/tlsf.ts:356:21
    (i32.add
     (get_global $~lib/allocator/tlsf/Block.INFO)
     ;;@ ~lib/allocator/tlsf.ts:356:34
     (get_global $~lib/allocator/tlsf/Block.MIN_SIZE)
    )
   )
   ;;@ ~lib/allocator/tlsf.ts:356:50
   (block
    ;;@ ~lib/allocator/tlsf.ts:357:6
    (i32.store
     (get_local $1)
     ;;@ ~lib/allocator/tlsf.ts:357:19
     (i32.or
      (get_local $2)
      ;;@ ~lib/allocator/tlsf.ts:357:26
      (i32.and
       ;;@ ~lib/allocator/tlsf.ts:357:27
       (get_local $3)
       ;;@ ~lib/allocator/tlsf.ts:357:39
       (get_global $~lib/allocator/tlsf/LEFT_FREE)
      )
     )
    )
    ;;@ ~lib/allocator/tlsf.ts:359:6
    (set_local $4
     ;;@ ~lib/allocator/tlsf.ts:359:18
     (i32.add
      ;;@ ~lib/allocator/tlsf.ts:360:8
      (i32.add
       (get_local $1)
       ;;@ ~lib/allocator/tlsf.ts:360:35
       (get_global $~lib/allocator/tlsf/Block.INFO)
      )
      ;;@ ~lib/allocator/tlsf.ts:360:48
      (get_local $2)
     )
    )
    ;;@ ~lib/allocator/tlsf.ts:362:6
    (i32.store
     (get_local $4)
     ;;@ ~lib/allocator/tlsf.ts:362:19
     (i32.or
      (i32.sub
       ;;@ ~lib/allocator/tlsf.ts:362:20
       (get_local $5)
       ;;@ ~lib/allocator/tlsf.ts:362:32
       (get_global $~lib/allocator/tlsf/Block.INFO)
      )
      ;;@ ~lib/allocator/tlsf.ts:362:46
      (get_global $~lib/allocator/tlsf/FREE)
     )
    )
    ;;@ ~lib/allocator/tlsf.ts:363:11
    (call $~lib/allocator/tlsf/Root#insert
     ;;@ ~lib/allocator/tlsf.ts:363:6
     (get_local $0)
     ;;@ ~lib/allocator/tlsf.ts:363:18
     (get_local $4)
    )
   )
   ;;@ ~lib/allocator/tlsf.ts:366:11
   (block
    ;;@ ~lib/allocator/tlsf.ts:367:6
    (i32.store
     (get_local $1)
     ;;@ ~lib/allocator/tlsf.ts:367:19
     (i32.and
      (get_local $3)
      ;;@ ~lib/allocator/tlsf.ts:367:31
      (i32.xor
       ;;@ ~lib/allocator/tlsf.ts:367:32
       (get_global $~lib/allocator/tlsf/FREE)
       (i32.const -1)
      )
     )
    )
    ;;@ ~lib/allocator/tlsf.ts:368:6
    (set_local $4
     ;;@ ~lib/allocator/tlsf.ts:368:25
     (if (result i32)
      (i32.eqz
       (tee_local $4
        ;;@ ~lib/allocator/tlsf.ts:368:32
        (call $~lib/allocator/tlsf/Block#get:right
         (get_local $1)
        )
       )
      )
      (block
       (call $~lib/env/abort
        (i32.const 0)
        (i32.const 8)
        (i32.const 368)
        (i32.const 25)
       )
       (unreachable)
      )
      (get_local $4)
     )
    )
    ;;@ ~lib/allocator/tlsf.ts:369:6
    (i32.store
     (get_local $4)
     (i32.and
      (i32.load
       (get_local $4)
      )
      ;;@ ~lib/allocator/tlsf.ts:369:20
      (i32.xor
       ;;@ ~lib/allocator/tlsf.ts:369:21
       (get_global $~lib/allocator/tlsf/LEFT_FREE)
       (i32.const -1)
      )
     )
    )
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:372:44
  (i32.add
   ;;@ ~lib/allocator/tlsf.ts:372:11
   (get_local $1)
   ;;@ ~lib/allocator/tlsf.ts:372:38
   (get_global $~lib/allocator/tlsf/Block.INFO)
  )
 )
 (func $~lib/allocator/tlsf/__memory_allocate (; 19 ;) (type $ii) (param $0 i32) (result i32)
  (local $1 i32)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  (local $6 i32)
  (local $7 i32)
  ;;@ ~lib/allocator/tlsf.ts:442:2
  (set_local $1
   ;;@ ~lib/allocator/tlsf.ts:442:13
   (get_global $~lib/allocator/tlsf/ROOT)
  )
  ;;@ ~lib/allocator/tlsf.ts:443:2
  (if
   ;;@ ~lib/allocator/tlsf.ts:443:6
   (i32.eqz
    ;;@ ~lib/allocator/tlsf.ts:443:7
    (get_local $1)
   )
   ;;@ ~lib/allocator/tlsf.ts:443:13
   (block
    ;;@ ~lib/allocator/tlsf.ts:444:4
    (set_local $2
     ;;@ ~lib/allocator/tlsf.ts:444:21
     (i32.and
      (i32.add
       ;;@ ~lib/allocator/tlsf.ts:444:22
       (get_global $HEAP_BASE)
       ;;@ ~lib/allocator/tlsf.ts:444:34
       (get_global $~lib/internal/allocator/AL_MASK)
      )
      ;;@ ~lib/allocator/tlsf.ts:444:45
      (i32.xor
       ;;@ ~lib/allocator/tlsf.ts:444:46
       (get_global $~lib/internal/allocator/AL_MASK)
       (i32.const -1)
      )
     )
    )
    ;;@ ~lib/allocator/tlsf.ts:445:4
    (set_local $3
     ;;@ ~lib/allocator/tlsf.ts:445:29
     (current_memory)
    )
    ;;@ ~lib/allocator/tlsf.ts:446:4
    (set_local $4
     ;;@ ~lib/allocator/tlsf.ts:446:22
     (i32.shr_u
      ;;@ ~lib/allocator/tlsf.ts:446:28
      (i32.and
       ;;@ ~lib/allocator/tlsf.ts:446:29
       (i32.add
        ;;@ ~lib/allocator/tlsf.ts:446:30
        (i32.add
         ;;@ ~lib/allocator/tlsf.ts:446:31
         (get_local $2)
         ;;@ ~lib/allocator/tlsf.ts:446:44
         (get_global $~lib/allocator/tlsf/Root.SIZE)
        )
        ;;@ ~lib/allocator/tlsf.ts:446:57
        (i32.const 65535)
       )
       ;;@ ~lib/allocator/tlsf.ts:446:67
       (i32.xor
        ;;@ ~lib/allocator/tlsf.ts:446:68
        (i32.const 65535)
        (i32.const -1)
       )
      )
      ;;@ ~lib/allocator/tlsf.ts:446:80
      (i32.const 16)
     )
    )
    ;;@ ~lib/allocator/tlsf.ts:447:4
    (if
     ;;@ ~lib/allocator/tlsf.ts:447:8
     (if (result i32)
      (tee_local $5
       (i32.gt_s
        (get_local $4)
        ;;@ ~lib/allocator/tlsf.ts:447:22
        (get_local $3)
       )
      )
      ;;@ ~lib/allocator/tlsf.ts:447:37
      (i32.lt_s
       ;;@ ~lib/allocator/tlsf.ts:447:44
       (grow_memory
        ;;@ ~lib/allocator/tlsf.ts:447:49
        (i32.sub
         (get_local $4)
         ;;@ ~lib/allocator/tlsf.ts:447:63
         (get_local $3)
        )
       )
       ;;@ ~lib/allocator/tlsf.ts:447:78
       (i32.const 0)
      )
      (get_local $5)
     )
     ;;@ ~lib/allocator/tlsf.ts:447:81
     (unreachable)
    )
    ;;@ ~lib/allocator/tlsf.ts:448:4
    (set_global $~lib/allocator/tlsf/ROOT
     ;;@ ~lib/allocator/tlsf.ts:448:11
     (tee_local $1
      ;;@ ~lib/allocator/tlsf.ts:448:18
      (get_local $2)
     )
    )
    ;;@ ~lib/allocator/tlsf.ts:449:4
    (call $~lib/allocator/tlsf/Root#set:tailRef
     (get_local $1)
     ;;@ ~lib/allocator/tlsf.ts:449:19
     (i32.const 0)
    )
    ;;@ ~lib/allocator/tlsf.ts:450:4
    (i32.store
     (get_local $1)
     ;;@ ~lib/allocator/tlsf.ts:450:17
     (i32.const 0)
    )
    ;;@ ~lib/allocator/tlsf.ts:451:4
    (block $break|0
     ;;@ ~lib/allocator/tlsf.ts:451:9
     (set_local $5
      ;;@ ~lib/allocator/tlsf.ts:451:25
      (i32.const 0)
     )
     (loop $repeat|0
      (br_if $break|0
       (i32.eqz
        ;;@ ~lib/allocator/tlsf.ts:451:28
        (i32.lt_u
         (get_local $5)
         ;;@ ~lib/allocator/tlsf.ts:451:33
         (get_global $~lib/allocator/tlsf/FL_BITS)
        )
       )
      )
      ;;@ ~lib/allocator/tlsf.ts:451:48
      (block
       ;;@ ~lib/allocator/tlsf.ts:452:11
       (call $~lib/allocator/tlsf/Root#setSLMap
        ;;@ ~lib/allocator/tlsf.ts:452:6
        (get_local $1)
        ;;@ ~lib/allocator/tlsf.ts:452:20
        (get_local $5)
        ;;@ ~lib/allocator/tlsf.ts:452:24
        (i32.const 0)
       )
       ;;@ ~lib/allocator/tlsf.ts:453:6
       (block $break|1
        ;;@ ~lib/allocator/tlsf.ts:453:11
        (set_local $6
         ;;@ ~lib/allocator/tlsf.ts:453:25
         (i32.const 0)
        )
        (loop $repeat|1
         (br_if $break|1
          (i32.eqz
           ;;@ ~lib/allocator/tlsf.ts:453:28
           (i32.lt_u
            (get_local $6)
            ;;@ ~lib/allocator/tlsf.ts:453:33
            (get_global $~lib/allocator/tlsf/SL_SIZE)
           )
          )
         )
         ;;@ ~lib/allocator/tlsf.ts:454:13
         (call $~lib/allocator/tlsf/Root#setHead
          ;;@ ~lib/allocator/tlsf.ts:454:8
          (get_local $1)
          ;;@ ~lib/allocator/tlsf.ts:454:21
          (get_local $5)
          ;;@ ~lib/allocator/tlsf.ts:454:25
          (get_local $6)
          ;;@ ~lib/allocator/tlsf.ts:454:29
          (i32.const 0)
         )
         ;;@ ~lib/allocator/tlsf.ts:453:42
         (set_local $6
          (i32.add
           ;;@ ~lib/allocator/tlsf.ts:453:44
           (get_local $6)
           (i32.const 1)
          )
         )
         (br $repeat|1)
        )
       )
      )
      ;;@ ~lib/allocator/tlsf.ts:451:42
      (set_local $5
       (i32.add
        ;;@ ~lib/allocator/tlsf.ts:451:44
        (get_local $5)
        (i32.const 1)
       )
      )
      (br $repeat|0)
     )
    )
    ;;@ ~lib/allocator/tlsf.ts:457:9
    (drop
     (call $~lib/allocator/tlsf/Root#addMemory
      ;;@ ~lib/allocator/tlsf.ts:457:4
      (get_local $1)
      ;;@ ~lib/allocator/tlsf.ts:457:19
      (i32.and
       (i32.add
        ;;@ ~lib/allocator/tlsf.ts:457:20
        (i32.add
         (get_local $2)
         ;;@ ~lib/allocator/tlsf.ts:457:33
         (get_global $~lib/allocator/tlsf/Root.SIZE)
        )
        ;;@ ~lib/allocator/tlsf.ts:457:45
        (get_global $~lib/internal/allocator/AL_MASK)
       )
       ;;@ ~lib/allocator/tlsf.ts:457:56
       (i32.xor
        ;;@ ~lib/allocator/tlsf.ts:457:57
        (get_global $~lib/internal/allocator/AL_MASK)
        (i32.const -1)
       )
      )
      ;;@ ~lib/allocator/tlsf.ts:457:66
      (i32.shl
       ;;@ ~lib/allocator/tlsf.ts:457:73
       (current_memory)
       ;;@ ~lib/allocator/tlsf.ts:457:83
       (i32.const 16)
      )
     )
    )
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:461:2
  (if
   ;;@ ~lib/allocator/tlsf.ts:461:6
   (i32.gt_u
    (get_local $0)
    ;;@ ~lib/allocator/tlsf.ts:461:13
    (get_global $~lib/allocator/tlsf/Block.MAX_SIZE)
   )
   ;;@ ~lib/allocator/tlsf.ts:461:29
   (unreachable)
  )
  ;;@ ~lib/allocator/tlsf.ts:464:2
  (set_local $0
   ;;@ ~lib/allocator/tlsf.ts:464:9
   (select
    (tee_local $4
     ;;@ ~lib/allocator/tlsf.ts:464:20
     (i32.and
      (i32.add
       ;;@ ~lib/allocator/tlsf.ts:464:21
       (get_local $0)
       ;;@ ~lib/allocator/tlsf.ts:464:28
       (get_global $~lib/internal/allocator/AL_MASK)
      )
      ;;@ ~lib/allocator/tlsf.ts:464:39
      (i32.xor
       ;;@ ~lib/allocator/tlsf.ts:464:40
       (get_global $~lib/internal/allocator/AL_MASK)
       (i32.const -1)
      )
     )
    )
    (tee_local $3
     ;;@ ~lib/allocator/tlsf.ts:464:49
     (get_global $~lib/allocator/tlsf/Block.MIN_SIZE)
    )
    (i32.gt_u
     (get_local $4)
     (get_local $3)
    )
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:466:2
  (set_local $7
   ;;@ ~lib/allocator/tlsf.ts:466:19
   (call $~lib/allocator/tlsf/Root#search
    ;;@ ~lib/allocator/tlsf.ts:466:14
    (get_local $1)
    ;;@ ~lib/allocator/tlsf.ts:466:26
    (get_local $0)
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:467:2
  (if
   ;;@ ~lib/allocator/tlsf.ts:467:6
   (i32.eqz
    ;;@ ~lib/allocator/tlsf.ts:467:7
    (get_local $7)
   )
   ;;@ ~lib/allocator/tlsf.ts:467:14
   (block
    ;;@ ~lib/allocator/tlsf.ts:470:4
    (set_local $4
     ;;@ ~lib/allocator/tlsf.ts:470:29
     (current_memory)
    )
    ;;@ ~lib/allocator/tlsf.ts:471:4
    (set_local $3
     ;;@ ~lib/allocator/tlsf.ts:471:22
     (i32.shr_u
      ;;@ ~lib/allocator/tlsf.ts:471:28
      (i32.and
       ;;@ ~lib/allocator/tlsf.ts:471:29
       (i32.add
        ;;@ ~lib/allocator/tlsf.ts:471:30
        (get_local $0)
        ;;@ ~lib/allocator/tlsf.ts:471:37
        (i32.const 65535)
       )
       ;;@ ~lib/allocator/tlsf.ts:471:47
       (i32.xor
        ;;@ ~lib/allocator/tlsf.ts:471:48
        (i32.const 65535)
        (i32.const -1)
       )
      )
      ;;@ ~lib/allocator/tlsf.ts:471:60
      (i32.const 16)
     )
    )
    ;;@ ~lib/allocator/tlsf.ts:472:4
    (set_local $2
     ;;@ ~lib/allocator/tlsf.ts:472:22
     (select
      (tee_local $2
       ;;@ ~lib/allocator/tlsf.ts:472:26
       (get_local $4)
      )
      (tee_local $5
       ;;@ ~lib/allocator/tlsf.ts:472:39
       (get_local $3)
      )
      (i32.gt_s
       (get_local $2)
       (get_local $5)
      )
     )
    )
    ;;@ ~lib/allocator/tlsf.ts:473:4
    (if
     ;;@ ~lib/allocator/tlsf.ts:473:8
     (i32.lt_s
      ;;@ ~lib/allocator/tlsf.ts:473:15
      (grow_memory
       ;;@ ~lib/allocator/tlsf.ts:473:20
       (get_local $2)
      )
      ;;@ ~lib/allocator/tlsf.ts:473:35
      (i32.const 0)
     )
     ;;@ ~lib/allocator/tlsf.ts:473:38
     (if
      ;;@ ~lib/allocator/tlsf.ts:474:10
      (i32.lt_s
       ;;@ ~lib/allocator/tlsf.ts:474:17
       (grow_memory
        ;;@ ~lib/allocator/tlsf.ts:474:22
        (get_local $3)
       )
       ;;@ ~lib/allocator/tlsf.ts:474:37
       (i32.const 0)
      )
      ;;@ ~lib/allocator/tlsf.ts:474:40
      (unreachable)
     )
    )
    ;;@ ~lib/allocator/tlsf.ts:478:4
    (set_local $5
     ;;@ ~lib/allocator/tlsf.ts:478:28
     (current_memory)
    )
    ;;@ ~lib/allocator/tlsf.ts:479:9
    (drop
     (call $~lib/allocator/tlsf/Root#addMemory
      ;;@ ~lib/allocator/tlsf.ts:479:4
      (get_local $1)
      ;;@ ~lib/allocator/tlsf.ts:479:19
      (i32.shl
       (get_local $4)
       ;;@ ~lib/allocator/tlsf.ts:479:41
       (i32.const 16)
      )
      ;;@ ~lib/allocator/tlsf.ts:479:45
      (i32.shl
       (get_local $5)
       ;;@ ~lib/allocator/tlsf.ts:479:66
       (i32.const 16)
      )
     )
    )
    ;;@ ~lib/allocator/tlsf.ts:480:4
    (set_local $7
     ;;@ ~lib/allocator/tlsf.ts:480:12
     (if (result i32)
      (i32.eqz
       (tee_local $6
        ;;@ ~lib/allocator/tlsf.ts:480:24
        (call $~lib/allocator/tlsf/Root#search
         ;;@ ~lib/allocator/tlsf.ts:480:19
         (get_local $1)
         ;;@ ~lib/allocator/tlsf.ts:480:31
         (get_local $0)
        )
       )
      )
      (block
       (call $~lib/env/abort
        (i32.const 0)
        (i32.const 8)
        (i32.const 480)
        (i32.const 12)
       )
       (unreachable)
      )
      (get_local $6)
     )
    )
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:483:2
  (if
   (i32.eqz
    ;;@ ~lib/allocator/tlsf.ts:483:9
    (i32.ge_u
     (i32.and
      ;;@ ~lib/allocator/tlsf.ts:483:10
      (i32.load
       (get_local $7)
      )
      ;;@ ~lib/allocator/tlsf.ts:483:23
      (i32.xor
       ;;@ ~lib/allocator/tlsf.ts:483:24
       (get_global $~lib/allocator/tlsf/TAGS)
       (i32.const -1)
      )
     )
     ;;@ ~lib/allocator/tlsf.ts:483:33
     (get_local $0)
    )
   )
   (block
    (call $~lib/env/abort
     (i32.const 0)
     (i32.const 8)
     (i32.const 483)
     (i32.const 2)
    )
    (unreachable)
   )
  )
  ;;@ ~lib/allocator/tlsf.ts:484:36
  (call $~lib/allocator/tlsf/Root#use
   ;;@ ~lib/allocator/tlsf.ts:484:9
   (get_local $1)
   ;;@ ~lib/allocator/tlsf.ts:484:18
   (get_local $7)
   ;;@ ~lib/allocator/tlsf.ts:484:32
   (get_local $0)
  )
 )
 (func $~lib/internal/string/allocateUnsafe (; 20 ;) (type $ii) (param $0 i32) (result i32)
  (local $1 i32)
  (local $2 i32)
  ;;@ ~lib/internal/string.ts:14:2
  (if
   (i32.eqz
    ;;@ ~lib/internal/string.ts:14:9
    (if (result i32)
     (tee_local $1
      (i32.gt_s
       (get_local $0)
       ;;@ ~lib/internal/string.ts:14:18
       (i32.const 0)
      )
     )
     ;;@ ~lib/internal/string.ts:14:23
     (i32.le_s
      (get_local $0)
      ;;@ ~lib/internal/string.ts:14:33
      (get_global $~lib/internal/string/MAX_LENGTH)
     )
     (get_local $1)
    )
   )
   (block
    (call $~lib/env/abort
     (i32.const 0)
     (i32.const 248)
     (i32.const 14)
     (i32.const 2)
    )
    (unreachable)
   )
  )
  ;;@ ~lib/internal/string.ts:16:2
  (set_local $2
   ;;@ ~lib/internal/string.ts:19:20
   (block $~lib/memory/memory.allocate|inlined.0 (result i32)
    (set_local $1
     ;;@ ~lib/internal/string.ts:19:29
     (i32.add
      (get_global $~lib/internal/string/HEADER_SIZE)
      ;;@ ~lib/internal/string.ts:19:43
      (i32.shl
       ;;@ ~lib/internal/string.ts:19:44
       (get_local $0)
       ;;@ ~lib/internal/string.ts:19:61
       (i32.const 1)
      )
     )
    )
    ;;@ ~lib/memory.ts:41:4
    (br $~lib/memory/memory.allocate|inlined.0
     ;;@ ~lib/memory.ts:41:45
     (call $~lib/allocator/tlsf/__memory_allocate
      ;;@ ~lib/memory.ts:41:63
      (get_local $1)
     )
    )
   )
  )
  ;;@ ~lib/internal/string.ts:21:2
  (i32.store
   ;;@ ~lib/internal/string.ts:21:13
   (get_local $2)
   ;;@ ~lib/internal/string.ts:21:21
   (get_local $0)
  )
  ;;@ ~lib/internal/string.ts:22:34
  (get_local $2)
 )
 (func $~lib/internal/memory/memcpy (; 21 ;) (type $iiiv) (param $0 i32) (param $1 i32) (param $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  ;;@ ~lib/internal/memory.ts:6:2
  (block $break|0
   (loop $continue|0
    (if
     ;;@ ~lib/internal/memory.ts:6:9
     (if (result i32)
      (get_local $2)
      ;;@ ~lib/internal/memory.ts:6:14
      (i32.and
       ;;@ ~lib/internal/memory.ts:6:15
       (get_local $1)
       ;;@ ~lib/internal/memory.ts:6:21
       (i32.const 3)
      )
      (get_local $2)
     )
     (block
      (block
       ;;@ ~lib/internal/memory.ts:7:4
       (i32.store8
        ;;@ ~lib/internal/memory.ts:7:14
        (block (result i32)
         (set_local $5
          (get_local $0)
         )
         (set_local $0
          (i32.add
           (get_local $5)
           (i32.const 1)
          )
         )
         (get_local $5)
        )
        ;;@ ~lib/internal/memory.ts:7:22
        (i32.load8_u
         ;;@ ~lib/internal/memory.ts:7:31
         (block (result i32)
          (set_local $5
           (get_local $1)
          )
          (set_local $1
           (i32.add
            (get_local $5)
            (i32.const 1)
           )
          )
          (get_local $5)
         )
        )
       )
       ;;@ ~lib/internal/memory.ts:8:4
       (set_local $2
        (i32.sub
         (get_local $2)
         (i32.const 1)
        )
       )
      )
      (br $continue|0)
     )
    )
   )
  )
  ;;@ ~lib/internal/memory.ts:12:2
  (if
   ;;@ ~lib/internal/memory.ts:12:6
   (i32.eq
    (i32.and
     ;;@ ~lib/internal/memory.ts:12:7
     (get_local $0)
     ;;@ ~lib/internal/memory.ts:12:14
     (i32.const 3)
    )
    ;;@ ~lib/internal/memory.ts:12:20
    (i32.const 0)
   )
   ;;@ ~lib/internal/memory.ts:12:23
   (block
    (block $break|1
     (loop $continue|1
      (if
       ;;@ ~lib/internal/memory.ts:13:11
       (i32.ge_u
        (get_local $2)
        ;;@ ~lib/internal/memory.ts:13:16
        (i32.const 16)
       )
       (block
        (block
         ;;@ ~lib/internal/memory.ts:14:6
         (i32.store
          ;;@ ~lib/internal/memory.ts:14:17
          (get_local $0)
          ;;@ ~lib/internal/memory.ts:14:28
          (i32.load
           ;;@ ~lib/internal/memory.ts:14:38
           (get_local $1)
          )
         )
         ;;@ ~lib/internal/memory.ts:15:6
         (i32.store
          ;;@ ~lib/internal/memory.ts:15:17
          (i32.add
           (get_local $0)
           ;;@ ~lib/internal/memory.ts:15:25
           (i32.const 4)
          )
          ;;@ ~lib/internal/memory.ts:15:28
          (i32.load
           ;;@ ~lib/internal/memory.ts:15:38
           (i32.add
            (get_local $1)
            ;;@ ~lib/internal/memory.ts:15:45
            (i32.const 4)
           )
          )
         )
         ;;@ ~lib/internal/memory.ts:16:6
         (i32.store
          ;;@ ~lib/internal/memory.ts:16:17
          (i32.add
           (get_local $0)
           ;;@ ~lib/internal/memory.ts:16:25
           (i32.const 8)
          )
          ;;@ ~lib/internal/memory.ts:16:28
          (i32.load
           ;;@ ~lib/internal/memory.ts:16:38
           (i32.add
            (get_local $1)
            ;;@ ~lib/internal/memory.ts:16:45
            (i32.const 8)
           )
          )
         )
         ;;@ ~lib/internal/memory.ts:17:6
         (i32.store
          ;;@ ~lib/internal/memory.ts:17:17
          (i32.add
           (get_local $0)
           ;;@ ~lib/internal/memory.ts:17:24
           (i32.const 12)
          )
          ;;@ ~lib/internal/memory.ts:17:28
          (i32.load
           ;;@ ~lib/internal/memory.ts:17:38
           (i32.add
            (get_local $1)
            ;;@ ~lib/internal/memory.ts:17:44
            (i32.const 12)
           )
          )
         )
         ;;@ ~lib/internal/memory.ts:18:6
         (set_local $1
          (i32.add
           (get_local $1)
           ;;@ ~lib/internal/memory.ts:18:13
           (i32.const 16)
          )
         )
         ;;@ ~lib/internal/memory.ts:18:17
         (set_local $0
          (i32.add
           (get_local $0)
           ;;@ ~lib/internal/memory.ts:18:25
           (i32.const 16)
          )
         )
         ;;@ ~lib/internal/memory.ts:18:29
         (set_local $2
          (i32.sub
           (get_local $2)
           ;;@ ~lib/internal/memory.ts:18:34
           (i32.const 16)
          )
         )
        )
        (br $continue|1)
       )
      )
     )
    )
    ;;@ ~lib/internal/memory.ts:20:4
    (if
     ;;@ ~lib/internal/memory.ts:20:8
     (i32.and
      (get_local $2)
      ;;@ ~lib/internal/memory.ts:20:12
      (i32.const 8)
     )
     ;;@ ~lib/internal/memory.ts:20:15
     (block
      ;;@ ~lib/internal/memory.ts:21:6
      (i32.store
       ;;@ ~lib/internal/memory.ts:21:17
       (get_local $0)
       ;;@ ~lib/internal/memory.ts:21:27
       (i32.load
        ;;@ ~lib/internal/memory.ts:21:37
        (get_local $1)
       )
      )
      ;;@ ~lib/internal/memory.ts:22:6
      (i32.store
       ;;@ ~lib/internal/memory.ts:22:17
       (i32.add
        (get_local $0)
        ;;@ ~lib/internal/memory.ts:22:24
        (i32.const 4)
       )
       ;;@ ~lib/internal/memory.ts:22:27
       (i32.load
        ;;@ ~lib/internal/memory.ts:22:37
        (i32.add
         (get_local $1)
         ;;@ ~lib/internal/memory.ts:22:43
         (i32.const 4)
        )
       )
      )
      ;;@ ~lib/internal/memory.ts:23:6
      (set_local $0
       (i32.add
        (get_local $0)
        ;;@ ~lib/internal/memory.ts:23:14
        (i32.const 8)
       )
      )
      ;;@ ~lib/internal/memory.ts:23:17
      (set_local $1
       (i32.add
        (get_local $1)
        ;;@ ~lib/internal/memory.ts:23:24
        (i32.const 8)
       )
      )
     )
    )
    ;;@ ~lib/internal/memory.ts:25:4
    (if
     ;;@ ~lib/internal/memory.ts:25:8
     (i32.and
      (get_local $2)
      ;;@ ~lib/internal/memory.ts:25:12
      (i32.const 4)
     )
     ;;@ ~lib/internal/memory.ts:25:15
     (block
      ;;@ ~lib/internal/memory.ts:26:6
      (i32.store
       ;;@ ~lib/internal/memory.ts:26:17
       (get_local $0)
       ;;@ ~lib/internal/memory.ts:26:23
       (i32.load
        ;;@ ~lib/internal/memory.ts:26:33
        (get_local $1)
       )
      )
      ;;@ ~lib/internal/memory.ts:27:6
      (set_local $0
       (i32.add
        (get_local $0)
        ;;@ ~lib/internal/memory.ts:27:14
        (i32.const 4)
       )
      )
      ;;@ ~lib/internal/memory.ts:27:17
      (set_local $1
       (i32.add
        (get_local $1)
        ;;@ ~lib/internal/memory.ts:27:24
        (i32.const 4)
       )
      )
     )
    )
    ;;@ ~lib/internal/memory.ts:29:4
    (if
     ;;@ ~lib/internal/memory.ts:29:8
     (i32.and
      (get_local $2)
      ;;@ ~lib/internal/memory.ts:29:12
      (i32.const 2)
     )
     ;;@ ~lib/internal/memory.ts:29:15
     (block
      ;;@ ~lib/internal/memory.ts:30:6
      (i32.store16
       ;;@ ~lib/internal/memory.ts:30:17
       (get_local $0)
       ;;@ ~lib/internal/memory.ts:30:23
       (i32.load16_u
        ;;@ ~lib/internal/memory.ts:30:33
        (get_local $1)
       )
      )
      ;;@ ~lib/internal/memory.ts:31:6
      (set_local $0
       (i32.add
        (get_local $0)
        ;;@ ~lib/internal/memory.ts:31:14
        (i32.const 2)
       )
      )
      ;;@ ~lib/internal/memory.ts:31:17
      (set_local $1
       (i32.add
        (get_local $1)
        ;;@ ~lib/internal/memory.ts:31:24
        (i32.const 2)
       )
      )
     )
    )
    ;;@ ~lib/internal/memory.ts:33:4
    (if
     ;;@ ~lib/internal/memory.ts:33:8
     (i32.and
      (get_local $2)
      ;;@ ~lib/internal/memory.ts:33:12
      (i32.const 1)
     )
     ;;@ ~lib/internal/memory.ts:33:15
     (i32.store8
      ;;@ ~lib/internal/memory.ts:34:16
      (block (result i32)
       (set_local $5
        (get_local $0)
       )
       (set_local $0
        (i32.add
         (get_local $5)
         (i32.const 1)
        )
       )
       (get_local $5)
      )
      ;;@ ~lib/internal/memory.ts:34:24
      (i32.load8_u
       ;;@ ~lib/internal/memory.ts:34:33
       (block (result i32)
        (set_local $5
         (get_local $1)
        )
        (set_local $1
         (i32.add
          (get_local $5)
          (i32.const 1)
         )
        )
        (get_local $5)
       )
      )
     )
    )
    ;;@ ~lib/internal/memory.ts:36:4
    (return)
   )
  )
  ;;@ ~lib/internal/memory.ts:41:2
  (if
   ;;@ ~lib/internal/memory.ts:41:6
   (i32.ge_u
    (get_local $2)
    ;;@ ~lib/internal/memory.ts:41:11
    (i32.const 32)
   )
   ;;@ ~lib/internal/memory.ts:41:15
   (block $break|2
    (block $case2|2
     (block $case1|2
      (block $case0|2
       (set_local $5
        ;;@ ~lib/internal/memory.ts:42:12
        (i32.and
         (get_local $0)
         ;;@ ~lib/internal/memory.ts:42:19
         (i32.const 3)
        )
       )
       (br_if $case0|2
        (i32.eq
         (get_local $5)
         ;;@ ~lib/internal/memory.ts:44:11
         (i32.const 1)
        )
       )
       (br_if $case1|2
        (i32.eq
         (get_local $5)
         ;;@ ~lib/internal/memory.ts:63:11
         (i32.const 2)
        )
       )
       (br_if $case2|2
        (i32.eq
         (get_local $5)
         ;;@ ~lib/internal/memory.ts:81:11
         (i32.const 3)
        )
       )
       (br $break|2)
      )
      ;;@ ~lib/internal/memory.ts:44:14
      (block
       ;;@ ~lib/internal/memory.ts:45:8
       (set_local $3
        ;;@ ~lib/internal/memory.ts:45:12
        (i32.load
         ;;@ ~lib/internal/memory.ts:45:22
         (get_local $1)
        )
       )
       ;;@ ~lib/internal/memory.ts:46:8
       (i32.store8
        ;;@ ~lib/internal/memory.ts:46:18
        (block (result i32)
         (set_local $5
          (get_local $0)
         )
         (set_local $0
          (i32.add
           (get_local $5)
           (i32.const 1)
          )
         )
         (get_local $5)
        )
        ;;@ ~lib/internal/memory.ts:46:26
        (i32.load8_u
         ;;@ ~lib/internal/memory.ts:46:35
         (block (result i32)
          (set_local $5
           (get_local $1)
          )
          (set_local $1
           (i32.add
            (get_local $5)
            (i32.const 1)
           )
          )
          (get_local $5)
         )
        )
       )
       ;;@ ~lib/internal/memory.ts:47:8
       (i32.store8
        ;;@ ~lib/internal/memory.ts:47:18
        (block (result i32)
         (set_local $5
          (get_local $0)
         )
         (set_local $0
          (i32.add
           (get_local $5)
           (i32.const 1)
          )
         )
         (get_local $5)
        )
        ;;@ ~lib/internal/memory.ts:47:26
        (i32.load8_u
         ;;@ ~lib/internal/memory.ts:47:35
         (block (result i32)
          (set_local $5
           (get_local $1)
          )
          (set_local $1
           (i32.add
            (get_local $5)
            (i32.const 1)
           )
          )
          (get_local $5)
         )
        )
       )
       ;;@ ~lib/internal/memory.ts:48:8
       (i32.store8
        ;;@ ~lib/internal/memory.ts:48:18
        (block (result i32)
         (set_local $5
          (get_local $0)
         )
         (set_local $0
          (i32.add
           (get_local $5)
           (i32.const 1)
          )
         )
         (get_local $5)
        )
        ;;@ ~lib/internal/memory.ts:48:26
        (i32.load8_u
         ;;@ ~lib/internal/memory.ts:48:35
         (block (result i32)
          (set_local $5
           (get_local $1)
          )
          (set_local $1
           (i32.add
            (get_local $5)
            (i32.const 1)
           )
          )
          (get_local $5)
         )
        )
       )
       ;;@ ~lib/internal/memory.ts:49:8
       (set_local $2
        (i32.sub
         (get_local $2)
         ;;@ ~lib/internal/memory.ts:49:13
         (i32.const 3)
        )
       )
       ;;@ ~lib/internal/memory.ts:50:8
       (block $break|3
        (loop $continue|3
         (if
          ;;@ ~lib/internal/memory.ts:50:15
          (i32.ge_u
           (get_local $2)
           ;;@ ~lib/internal/memory.ts:50:20
           (i32.const 17)
          )
          (block
           (block
            ;;@ ~lib/internal/memory.ts:51:10
            (set_local $4
             ;;@ ~lib/internal/memory.ts:51:14
             (i32.load
              ;;@ ~lib/internal/memory.ts:51:24
              (i32.add
               (get_local $1)
               ;;@ ~lib/internal/memory.ts:51:30
               (i32.const 1)
              )
             )
            )
            ;;@ ~lib/internal/memory.ts:52:10
            (i32.store
             ;;@ ~lib/internal/memory.ts:52:21
             (get_local $0)
             ;;@ ~lib/internal/memory.ts:52:27
             (i32.or
              (i32.shr_u
               (get_local $3)
               ;;@ ~lib/internal/memory.ts:52:32
               (i32.const 24)
              )
              ;;@ ~lib/internal/memory.ts:52:37
              (i32.shl
               (get_local $4)
               ;;@ ~lib/internal/memory.ts:52:42
               (i32.const 8)
              )
             )
            )
            ;;@ ~lib/internal/memory.ts:53:10
            (set_local $3
             ;;@ ~lib/internal/memory.ts:53:14
             (i32.load
              ;;@ ~lib/internal/memory.ts:53:24
              (i32.add
               (get_local $1)
               ;;@ ~lib/internal/memory.ts:53:30
               (i32.const 5)
              )
             )
            )
            ;;@ ~lib/internal/memory.ts:54:10
            (i32.store
             ;;@ ~lib/internal/memory.ts:54:21
             (i32.add
              (get_local $0)
              ;;@ ~lib/internal/memory.ts:54:28
              (i32.const 4)
             )
             ;;@ ~lib/internal/memory.ts:54:31
             (i32.or
              (i32.shr_u
               (get_local $4)
               ;;@ ~lib/internal/memory.ts:54:36
               (i32.const 24)
              )
              ;;@ ~lib/internal/memory.ts:54:41
              (i32.shl
               (get_local $3)
               ;;@ ~lib/internal/memory.ts:54:46
               (i32.const 8)
              )
             )
            )
            ;;@ ~lib/internal/memory.ts:55:10
            (set_local $4
             ;;@ ~lib/internal/memory.ts:55:14
             (i32.load
              ;;@ ~lib/internal/memory.ts:55:24
              (i32.add
               (get_local $1)
               ;;@ ~lib/internal/memory.ts:55:30
               (i32.const 9)
              )
             )
            )
            ;;@ ~lib/internal/memory.ts:56:10
            (i32.store
             ;;@ ~lib/internal/memory.ts:56:21
             (i32.add
              (get_local $0)
              ;;@ ~lib/internal/memory.ts:56:28
              (i32.const 8)
             )
             ;;@ ~lib/internal/memory.ts:56:31
             (i32.or
              (i32.shr_u
               (get_local $3)
               ;;@ ~lib/internal/memory.ts:56:36
               (i32.const 24)
              )
              ;;@ ~lib/internal/memory.ts:56:41
              (i32.shl
               (get_local $4)
               ;;@ ~lib/internal/memory.ts:56:46
               (i32.const 8)
              )
             )
            )
            ;;@ ~lib/internal/memory.ts:57:10
            (set_local $3
             ;;@ ~lib/internal/memory.ts:57:14
             (i32.load
              ;;@ ~lib/internal/memory.ts:57:24
              (i32.add
               (get_local $1)
               ;;@ ~lib/internal/memory.ts:57:30
               (i32.const 13)
              )
             )
            )
            ;;@ ~lib/internal/memory.ts:58:10
            (i32.store
             ;;@ ~lib/internal/memory.ts:58:21
             (i32.add
              (get_local $0)
              ;;@ ~lib/internal/memory.ts:58:28
              (i32.const 12)
             )
             ;;@ ~lib/internal/memory.ts:58:32
             (i32.or
              (i32.shr_u
               (get_local $4)
               ;;@ ~lib/internal/memory.ts:58:37
               (i32.const 24)
              )
              ;;@ ~lib/internal/memory.ts:58:42
              (i32.shl
               (get_local $3)
               ;;@ ~lib/internal/memory.ts:58:47
               (i32.const 8)
              )
             )
            )
            ;;@ ~lib/internal/memory.ts:59:10
            (set_local $1
             (i32.add
              (get_local $1)
              ;;@ ~lib/internal/memory.ts:59:17
              (i32.const 16)
             )
            )
            ;;@ ~lib/internal/memory.ts:59:21
            (set_local $0
             (i32.add
              (get_local $0)
              ;;@ ~lib/internal/memory.ts:59:29
              (i32.const 16)
             )
            )
            ;;@ ~lib/internal/memory.ts:59:33
            (set_local $2
             (i32.sub
              (get_local $2)
              ;;@ ~lib/internal/memory.ts:59:38
              (i32.const 16)
             )
            )
           )
           (br $continue|3)
          )
         )
        )
       )
       ;;@ ~lib/internal/memory.ts:61:8
       (br $break|2)
      )
     )
     ;;@ ~lib/internal/memory.ts:63:14
     (block
      ;;@ ~lib/internal/memory.ts:64:8
      (set_local $3
       ;;@ ~lib/internal/memory.ts:64:12
       (i32.load
        ;;@ ~lib/internal/memory.ts:64:22
        (get_local $1)
       )
      )
      ;;@ ~lib/internal/memory.ts:65:8
      (i32.store8
       ;;@ ~lib/internal/memory.ts:65:18
       (block (result i32)
        (set_local $5
         (get_local $0)
        )
        (set_local $0
         (i32.add
          (get_local $5)
          (i32.const 1)
         )
        )
        (get_local $5)
       )
       ;;@ ~lib/internal/memory.ts:65:26
       (i32.load8_u
        ;;@ ~lib/internal/memory.ts:65:35
        (block (result i32)
         (set_local $5
          (get_local $1)
         )
         (set_local $1
          (i32.add
           (get_local $5)
           (i32.const 1)
          )
         )
         (get_local $5)
        )
       )
      )
      ;;@ ~lib/internal/memory.ts:66:8
      (i32.store8
       ;;@ ~lib/internal/memory.ts:66:18
       (block (result i32)
        (set_local $5
         (get_local $0)
        )
        (set_local $0
         (i32.add
          (get_local $5)
          (i32.const 1)
         )
        )
        (get_local $5)
       )
       ;;@ ~lib/internal/memory.ts:66:26
       (i32.load8_u
        ;;@ ~lib/internal/memory.ts:66:35
        (block (result i32)
         (set_local $5
          (get_local $1)
         )
         (set_local $1
          (i32.add
           (get_local $5)
           (i32.const 1)
          )
         )
         (get_local $5)
        )
       )
      )
      ;;@ ~lib/internal/memory.ts:67:8
      (set_local $2
       (i32.sub
        (get_local $2)
        ;;@ ~lib/internal/memory.ts:67:13
        (i32.const 2)
       )
      )
      ;;@ ~lib/internal/memory.ts:68:8
      (block $break|4
       (loop $continue|4
        (if
         ;;@ ~lib/internal/memory.ts:68:15
         (i32.ge_u
          (get_local $2)
          ;;@ ~lib/internal/memory.ts:68:20
          (i32.const 18)
         )
         (block
          (block
           ;;@ ~lib/internal/memory.ts:69:10
           (set_local $4
            ;;@ ~lib/internal/memory.ts:69:14
            (i32.load
             ;;@ ~lib/internal/memory.ts:69:24
             (i32.add
              (get_local $1)
              ;;@ ~lib/internal/memory.ts:69:30
              (i32.const 2)
             )
            )
           )
           ;;@ ~lib/internal/memory.ts:70:10
           (i32.store
            ;;@ ~lib/internal/memory.ts:70:21
            (get_local $0)
            ;;@ ~lib/internal/memory.ts:70:27
            (i32.or
             (i32.shr_u
              (get_local $3)
              ;;@ ~lib/internal/memory.ts:70:32
              (i32.const 16)
             )
             ;;@ ~lib/internal/memory.ts:70:37
             (i32.shl
              (get_local $4)
              ;;@ ~lib/internal/memory.ts:70:42
              (i32.const 16)
             )
            )
           )
           ;;@ ~lib/internal/memory.ts:71:10
           (set_local $3
            ;;@ ~lib/internal/memory.ts:71:14
            (i32.load
             ;;@ ~lib/internal/memory.ts:71:24
             (i32.add
              (get_local $1)
              ;;@ ~lib/internal/memory.ts:71:30
              (i32.const 6)
             )
            )
           )
           ;;@ ~lib/internal/memory.ts:72:10
           (i32.store
            ;;@ ~lib/internal/memory.ts:72:21
            (i32.add
             (get_local $0)
             ;;@ ~lib/internal/memory.ts:72:28
             (i32.const 4)
            )
            ;;@ ~lib/internal/memory.ts:72:31
            (i32.or
             (i32.shr_u
              (get_local $4)
              ;;@ ~lib/internal/memory.ts:72:36
              (i32.const 16)
             )
             ;;@ ~lib/internal/memory.ts:72:41
             (i32.shl
              (get_local $3)
              ;;@ ~lib/internal/memory.ts:72:46
              (i32.const 16)
             )
            )
           )
           ;;@ ~lib/internal/memory.ts:73:10
           (set_local $4
            ;;@ ~lib/internal/memory.ts:73:14
            (i32.load
             ;;@ ~lib/internal/memory.ts:73:24
             (i32.add
              (get_local $1)
              ;;@ ~lib/internal/memory.ts:73:30
              (i32.const 10)
             )
            )
           )
           ;;@ ~lib/internal/memory.ts:74:10
           (i32.store
            ;;@ ~lib/internal/memory.ts:74:21
            (i32.add
             (get_local $0)
             ;;@ ~lib/internal/memory.ts:74:28
             (i32.const 8)
            )
            ;;@ ~lib/internal/memory.ts:74:31
            (i32.or
             (i32.shr_u
              (get_local $3)
              ;;@ ~lib/internal/memory.ts:74:36
              (i32.const 16)
             )
             ;;@ ~lib/internal/memory.ts:74:41
             (i32.shl
              (get_local $4)
              ;;@ ~lib/internal/memory.ts:74:46
              (i32.const 16)
             )
            )
           )
           ;;@ ~lib/internal/memory.ts:75:10
           (set_local $3
            ;;@ ~lib/internal/memory.ts:75:14
            (i32.load
             ;;@ ~lib/internal/memory.ts:75:24
             (i32.add
              (get_local $1)
              ;;@ ~lib/internal/memory.ts:75:30
              (i32.const 14)
             )
            )
           )
           ;;@ ~lib/internal/memory.ts:76:10
           (i32.store
            ;;@ ~lib/internal/memory.ts:76:21
            (i32.add
             (get_local $0)
             ;;@ ~lib/internal/memory.ts:76:28
             (i32.const 12)
            )
            ;;@ ~lib/internal/memory.ts:76:32
            (i32.or
             (i32.shr_u
              (get_local $4)
              ;;@ ~lib/internal/memory.ts:76:37
              (i32.const 16)
             )
             ;;@ ~lib/internal/memory.ts:76:42
             (i32.shl
              (get_local $3)
              ;;@ ~lib/internal/memory.ts:76:47
              (i32.const 16)
             )
            )
           )
           ;;@ ~lib/internal/memory.ts:77:10
           (set_local $1
            (i32.add
             (get_local $1)
             ;;@ ~lib/internal/memory.ts:77:17
             (i32.const 16)
            )
           )
           ;;@ ~lib/internal/memory.ts:77:21
           (set_local $0
            (i32.add
             (get_local $0)
             ;;@ ~lib/internal/memory.ts:77:29
             (i32.const 16)
            )
           )
           ;;@ ~lib/internal/memory.ts:77:33
           (set_local $2
            (i32.sub
             (get_local $2)
             ;;@ ~lib/internal/memory.ts:77:38
             (i32.const 16)
            )
           )
          )
          (br $continue|4)
         )
        )
       )
      )
      ;;@ ~lib/internal/memory.ts:79:8
      (br $break|2)
     )
    )
    ;;@ ~lib/internal/memory.ts:81:14
    (block
     ;;@ ~lib/internal/memory.ts:82:8
     (set_local $3
      ;;@ ~lib/internal/memory.ts:82:12
      (i32.load
       ;;@ ~lib/internal/memory.ts:82:22
       (get_local $1)
      )
     )
     ;;@ ~lib/internal/memory.ts:83:8
     (i32.store8
      ;;@ ~lib/internal/memory.ts:83:18
      (block (result i32)
       (set_local $5
        (get_local $0)
       )
       (set_local $0
        (i32.add
         (get_local $5)
         (i32.const 1)
        )
       )
       (get_local $5)
      )
      ;;@ ~lib/internal/memory.ts:83:26
      (i32.load8_u
       ;;@ ~lib/internal/memory.ts:83:35
       (block (result i32)
        (set_local $5
         (get_local $1)
        )
        (set_local $1
         (i32.add
          (get_local $5)
          (i32.const 1)
         )
        )
        (get_local $5)
       )
      )
     )
     ;;@ ~lib/internal/memory.ts:84:8
     (set_local $2
      (i32.sub
       (get_local $2)
       ;;@ ~lib/internal/memory.ts:84:13
       (i32.const 1)
      )
     )
     ;;@ ~lib/internal/memory.ts:85:8
     (block $break|5
      (loop $continue|5
       (if
        ;;@ ~lib/internal/memory.ts:85:15
        (i32.ge_u
         (get_local $2)
         ;;@ ~lib/internal/memory.ts:85:20
         (i32.const 19)
        )
        (block
         (block
          ;;@ ~lib/internal/memory.ts:86:10
          (set_local $4
           ;;@ ~lib/internal/memory.ts:86:14
           (i32.load
            ;;@ ~lib/internal/memory.ts:86:24
            (i32.add
             (get_local $1)
             ;;@ ~lib/internal/memory.ts:86:30
             (i32.const 3)
            )
           )
          )
          ;;@ ~lib/internal/memory.ts:87:10
          (i32.store
           ;;@ ~lib/internal/memory.ts:87:21
           (get_local $0)
           ;;@ ~lib/internal/memory.ts:87:27
           (i32.or
            (i32.shr_u
             (get_local $3)
             ;;@ ~lib/internal/memory.ts:87:32
             (i32.const 8)
            )
            ;;@ ~lib/internal/memory.ts:87:36
            (i32.shl
             (get_local $4)
             ;;@ ~lib/internal/memory.ts:87:41
             (i32.const 24)
            )
           )
          )
          ;;@ ~lib/internal/memory.ts:88:10
          (set_local $3
           ;;@ ~lib/internal/memory.ts:88:14
           (i32.load
            ;;@ ~lib/internal/memory.ts:88:24
            (i32.add
             (get_local $1)
             ;;@ ~lib/internal/memory.ts:88:30
             (i32.const 7)
            )
           )
          )
          ;;@ ~lib/internal/memory.ts:89:10
          (i32.store
           ;;@ ~lib/internal/memory.ts:89:21
           (i32.add
            (get_local $0)
            ;;@ ~lib/internal/memory.ts:89:28
            (i32.const 4)
           )
           ;;@ ~lib/internal/memory.ts:89:31
           (i32.or
            (i32.shr_u
             (get_local $4)
             ;;@ ~lib/internal/memory.ts:89:36
             (i32.const 8)
            )
            ;;@ ~lib/internal/memory.ts:89:40
            (i32.shl
             (get_local $3)
             ;;@ ~lib/internal/memory.ts:89:45
             (i32.const 24)
            )
           )
          )
          ;;@ ~lib/internal/memory.ts:90:10
          (set_local $4
           ;;@ ~lib/internal/memory.ts:90:14
           (i32.load
            ;;@ ~lib/internal/memory.ts:90:24
            (i32.add
             (get_local $1)
             ;;@ ~lib/internal/memory.ts:90:30
             (i32.const 11)
            )
           )
          )
          ;;@ ~lib/internal/memory.ts:91:10
          (i32.store
           ;;@ ~lib/internal/memory.ts:91:21
           (i32.add
            (get_local $0)
            ;;@ ~lib/internal/memory.ts:91:28
            (i32.const 8)
           )
           ;;@ ~lib/internal/memory.ts:91:31
           (i32.or
            (i32.shr_u
             (get_local $3)
             ;;@ ~lib/internal/memory.ts:91:36
             (i32.const 8)
            )
            ;;@ ~lib/internal/memory.ts:91:40
            (i32.shl
             (get_local $4)
             ;;@ ~lib/internal/memory.ts:91:45
             (i32.const 24)
            )
           )
          )
          ;;@ ~lib/internal/memory.ts:92:10
          (set_local $3
           ;;@ ~lib/internal/memory.ts:92:14
           (i32.load
            ;;@ ~lib/internal/memory.ts:92:24
            (i32.add
             (get_local $1)
             ;;@ ~lib/internal/memory.ts:92:30
             (i32.const 15)
            )
           )
          )
          ;;@ ~lib/internal/memory.ts:93:10
          (i32.store
           ;;@ ~lib/internal/memory.ts:93:21
           (i32.add
            (get_local $0)
            ;;@ ~lib/internal/memory.ts:93:28
            (i32.const 12)
           )
           ;;@ ~lib/internal/memory.ts:93:32
           (i32.or
            (i32.shr_u
             (get_local $4)
             ;;@ ~lib/internal/memory.ts:93:37
             (i32.const 8)
            )
            ;;@ ~lib/internal/memory.ts:93:41
            (i32.shl
             (get_local $3)
             ;;@ ~lib/internal/memory.ts:93:46
             (i32.const 24)
            )
           )
          )
          ;;@ ~lib/internal/memory.ts:94:10
          (set_local $1
           (i32.add
            (get_local $1)
            ;;@ ~lib/internal/memory.ts:94:17
            (i32.const 16)
           )
          )
          ;;@ ~lib/internal/memory.ts:94:21
          (set_local $0
           (i32.add
            (get_local $0)
            ;;@ ~lib/internal/memory.ts:94:29
            (i32.const 16)
           )
          )
          ;;@ ~lib/internal/memory.ts:94:33
          (set_local $2
           (i32.sub
            (get_local $2)
            ;;@ ~lib/internal/memory.ts:94:38
            (i32.const 16)
           )
          )
         )
         (br $continue|5)
        )
       )
      )
     )
     ;;@ ~lib/internal/memory.ts:96:8
     (br $break|2)
    )
   )
  )
  ;;@ ~lib/internal/memory.ts:102:2
  (if
   ;;@ ~lib/internal/memory.ts:102:6
   (i32.and
    (get_local $2)
    ;;@ ~lib/internal/memory.ts:102:10
    (i32.const 16)
   )
   ;;@ ~lib/internal/memory.ts:102:14
   (block
    ;;@ ~lib/internal/memory.ts:103:4
    (i32.store8
     ;;@ ~lib/internal/memory.ts:103:14
     (block (result i32)
      (set_local $5
       (get_local $0)
      )
      (set_local $0
       (i32.add
        (get_local $5)
        (i32.const 1)
       )
      )
      (get_local $5)
     )
     ;;@ ~lib/internal/memory.ts:103:22
     (i32.load8_u
      ;;@ ~lib/internal/memory.ts:103:31
      (block (result i32)
       (set_local $5
        (get_local $1)
       )
       (set_local $1
        (i32.add
         (get_local $5)
         (i32.const 1)
        )
       )
       (get_local $5)
      )
     )
    )
    ;;@ ~lib/internal/memory.ts:104:4
    (i32.store8
     ;;@ ~lib/internal/memory.ts:104:14
     (block (result i32)
      (set_local $5
       (get_local $0)
      )
      (set_local $0
       (i32.add
        (get_local $5)
        (i32.const 1)
       )
      )
      (get_local $5)
     )
     ;;@ ~lib/internal/memory.ts:104:22
     (i32.load8_u
      ;;@ ~lib/internal/memory.ts:104:31
      (block (result i32)
       (set_local $5
        (get_local $1)
       )
       (set_local $1
        (i32.add
         (get_local $5)
         (i32.const 1)
        )
       )
       (get_local $5)
      )
     )
    )
    ;;@ ~lib/internal/memory.ts:105:4
    (i32.store8
     ;;@ ~lib/internal/memory.ts:105:14
     (block (result i32)
      (set_local $5
       (get_local $0)
      )
      (set_local $0
       (i32.add
        (get_local $5)
        (i32.const 1)
       )
      )
      (get_local $5)
     )
     ;;@ ~lib/internal/memory.ts:105:22
     (i32.load8_u
      ;;@ ~lib/internal/memory.ts:105:31
      (block (result i32)
       (set_local $5
        (get_local $1)
       )
       (set_local $1
        (i32.add
         (get_local $5)
         (i32.const 1)
        )
       )
       (get_local $5)
      )
     )
    )
    ;;@ ~lib/internal/memory.ts:106:4
    (i32.store8
     ;;@ ~lib/internal/memory.ts:106:14
     (block (result i32)
      (set_local $5
       (get_local $0)
      )
      (set_local $0
       (i32.add
        (get_local $5)
        (i32.const 1)
       )
      )
      (get_local $5)
     )
     ;;@ ~lib/internal/memory.ts:106:22
     (i32.load8_u
      ;;@ ~lib/internal/memory.ts:106:31
      (block (result i32)
       (set_local $5
        (get_local $1)
       )
       (set_local $1
        (i32.add
         (get_local $5)
         (i32.const 1)
        )
       )
       (get_local $5)
      )
     )
    )
    ;;@ ~lib/internal/memory.ts:107:4
    (i32.store8
     ;;@ ~lib/internal/memory.ts:107:14
     (block (result i32)
      (set_local $5
       (get_local $0)
      )
      (set_local $0
       (i32.add
        (get_local $5)
        (i32.const 1)
       )
      )
      (get_local $5)
     )
     ;;@ ~lib/internal/memory.ts:107:22
     (i32.load8_u
      ;;@ ~lib/internal/memory.ts:107:31
      (block (result i32)
       (set_local $5
        (get_local $1)
       )
       (set_local $1
        (i32.add
         (get_local $5)
         (i32.const 1)
        )
       )
       (get_local $5)
      )
     )
    )
    ;;@ ~lib/internal/memory.ts:108:4
    (i32.store8
     ;;@ ~lib/internal/memory.ts:108:14
     (block (result i32)
      (set_local $5
       (get_local $0)
      )
      (set_local $0
       (i32.add
        (get_local $5)
        (i32.const 1)
       )
      )
      (get_local $5)
     )
     ;;@ ~lib/internal/memory.ts:108:22
     (i32.load8_u
      ;;@ ~lib/internal/memory.ts:108:31
      (block (result i32)
       (set_local $5
        (get_local $1)
       )
       (set_local $1
        (i32.add
         (get_local $5)
         (i32.const 1)
        )
       )
       (get_local $5)
      )
     )
    )
    ;;@ ~lib/internal/memory.ts:109:4
    (i32.store8
     ;;@ ~lib/internal/memory.ts:109:14
     (block (result i32)
      (set_local $5
       (get_local $0)
      )
      (set_local $0
       (i32.add
        (get_local $5)
        (i32.const 1)
       )
      )
      (get_local $5)
     )
     ;;@ ~lib/internal/memory.ts:109:22
     (i32.load8_u
      ;;@ ~lib/internal/memory.ts:109:31
      (block (result i32)
       (set_local $5
        (get_local $1)
       )
       (set_local $1
        (i32.add
         (get_local $5)
         (i32.const 1)
        )
       )
       (get_local $5)
      )
     )
    )
    ;;@ ~lib/internal/memory.ts:110:4
    (i32.store8
     ;;@ ~lib/internal/memory.ts:110:14
     (block (result i32)
      (set_local $5
       (get_local $0)
      )
      (set_local $0
       (i32.add
        (get_local $5)
        (i32.const 1)
       )
      )
      (get_local $5)
     )
     ;;@ ~lib/internal/memory.ts:110:22
     (i32.load8_u
      ;;@ ~lib/internal/memory.ts:110:31
      (block (result i32)
       (set_local $5
        (get_local $1)
       )
       (set_local $1
        (i32.add
         (get_local $5)
         (i32.const 1)
        )
       )
       (get_local $5)
      )
     )
    )
    ;;@ ~lib/internal/memory.ts:111:4
    (i32.store8
     ;;@ ~lib/internal/memory.ts:111:14
     (block (result i32)
      (set_local $5
       (get_local $0)
      )
      (set_local $0
       (i32.add
        (get_local $5)
        (i32.const 1)
       )
      )
      (get_local $5)
     )
     ;;@ ~lib/internal/memory.ts:111:22
     (i32.load8_u
      ;;@ ~lib/internal/memory.ts:111:31
      (block (result i32)
       (set_local $5
        (get_local $1)
       )
       (set_local $1
        (i32.add
         (get_local $5)
         (i32.const 1)
        )
       )
       (get_local $5)
      )
     )
    )
    ;;@ ~lib/internal/memory.ts:112:4
    (i32.store8
     ;;@ ~lib/internal/memory.ts:112:14
     (block (result i32)
      (set_local $5
       (get_local $0)
      )
      (set_local $0
       (i32.add
        (get_local $5)
        (i32.const 1)
       )
      )
      (get_local $5)
     )
     ;;@ ~lib/internal/memory.ts:112:22
     (i32.load8_u
      ;;@ ~lib/internal/memory.ts:112:31
      (block (result i32)
       (set_local $5
        (get_local $1)
       )
       (set_local $1
        (i32.add
         (get_local $5)
         (i32.const 1)
        )
       )
       (get_local $5)
      )
     )
    )
    ;;@ ~lib/internal/memory.ts:113:4
    (i32.store8
     ;;@ ~lib/internal/memory.ts:113:14
     (block (result i32)
      (set_local $5
       (get_local $0)
      )
      (set_local $0
       (i32.add
        (get_local $5)
        (i32.const 1)
       )
      )
      (get_local $5)
     )
     ;;@ ~lib/internal/memory.ts:113:22
     (i32.load8_u
      ;;@ ~lib/internal/memory.ts:113:31
      (block (result i32)
       (set_local $5
        (get_local $1)
       )
       (set_local $1
        (i32.add
         (get_local $5)
         (i32.const 1)
        )
       )
       (get_local $5)
      )
     )
    )
    ;;@ ~lib/internal/memory.ts:114:4
    (i32.store8
     ;;@ ~lib/internal/memory.ts:114:14
     (block (result i32)
      (set_local $5
       (get_local $0)
      )
      (set_local $0
       (i32.add
        (get_local $5)
        (i32.const 1)
       )
      )
      (get_local $5)
     )
     ;;@ ~lib/internal/memory.ts:114:22
     (i32.load8_u
      ;;@ ~lib/internal/memory.ts:114:31
      (block (result i32)
       (set_local $5
        (get_local $1)
       )
       (set_local $1
        (i32.add
         (get_local $5)
         (i32.const 1)
        )
       )
       (get_local $5)
      )
     )
    )
    ;;@ ~lib/internal/memory.ts:115:4
    (i32.store8
     ;;@ ~lib/internal/memory.ts:115:14
     (block (result i32)
      (set_local $5
       (get_local $0)
      )
      (set_local $0
       (i32.add
        (get_local $5)
        (i32.const 1)
       )
      )
      (get_local $5)
     )
     ;;@ ~lib/internal/memory.ts:115:22
     (i32.load8_u
      ;;@ ~lib/internal/memory.ts:115:31
      (block (result i32)
       (set_local $5
        (get_local $1)
       )
       (set_local $1
        (i32.add
         (get_local $5)
         (i32.const 1)
        )
       )
       (get_local $5)
      )
     )
    )
    ;;@ ~lib/internal/memory.ts:116:4
    (i32.store8
     ;;@ ~lib/internal/memory.ts:116:14
     (block (result i32)
      (set_local $5
       (get_local $0)
      )
      (set_local $0
       (i32.add
        (get_local $5)
        (i32.const 1)
       )
      )
      (get_local $5)
     )
     ;;@ ~lib/internal/memory.ts:116:22
     (i32.load8_u
      ;;@ ~lib/internal/memory.ts:116:31
      (block (result i32)
       (set_local $5
        (get_local $1)
       )
       (set_local $1
        (i32.add
         (get_local $5)
         (i32.const 1)
        )
       )
       (get_local $5)
      )
     )
    )
    ;;@ ~lib/internal/memory.ts:117:4
    (i32.store8
     ;;@ ~lib/internal/memory.ts:117:14
     (block (result i32)
      (set_local $5
       (get_local $0)
      )
      (set_local $0
       (i32.add
        (get_local $5)
        (i32.const 1)
       )
      )
      (get_local $5)
     )
     ;;@ ~lib/internal/memory.ts:117:22
     (i32.load8_u
      ;;@ ~lib/internal/memory.ts:117:31
      (block (result i32)
       (set_local $5
        (get_local $1)
       )
       (set_local $1
        (i32.add
         (get_local $5)
         (i32.const 1)
        )
       )
       (get_local $5)
      )
     )
    )
    ;;@ ~lib/internal/memory.ts:118:4
    (i32.store8
     ;;@ ~lib/internal/memory.ts:118:14
     (block (result i32)
      (set_local $5
       (get_local $0)
      )
      (set_local $0
       (i32.add
        (get_local $5)
        (i32.const 1)
       )
      )
      (get_local $5)
     )
     ;;@ ~lib/internal/memory.ts:118:22
     (i32.load8_u
      ;;@ ~lib/internal/memory.ts:118:31
      (block (result i32)
       (set_local $5
        (get_local $1)
       )
       (set_local $1
        (i32.add
         (get_local $5)
         (i32.const 1)
        )
       )
       (get_local $5)
      )
     )
    )
   )
  )
  ;;@ ~lib/internal/memory.ts:120:2
  (if
   ;;@ ~lib/internal/memory.ts:120:6
   (i32.and
    (get_local $2)
    ;;@ ~lib/internal/memory.ts:120:10
    (i32.const 8)
   )
   ;;@ ~lib/internal/memory.ts:120:13
   (block
    ;;@ ~lib/internal/memory.ts:121:4
    (i32.store8
     ;;@ ~lib/internal/memory.ts:121:14
     (block (result i32)
      (set_local $5
       (get_local $0)
      )
      (set_local $0
       (i32.add
        (get_local $5)
        (i32.const 1)
       )
      )
      (get_local $5)
     )
     ;;@ ~lib/internal/memory.ts:121:22
     (i32.load8_u
      ;;@ ~lib/internal/memory.ts:121:31
      (block (result i32)
       (set_local $5
        (get_local $1)
       )
       (set_local $1
        (i32.add
         (get_local $5)
         (i32.const 1)
        )
       )
       (get_local $5)
      )
     )
    )
    ;;@ ~lib/internal/memory.ts:122:4
    (i32.store8
     ;;@ ~lib/internal/memory.ts:122:14
     (block (result i32)
      (set_local $5
       (get_local $0)
      )
      (set_local $0
       (i32.add
        (get_local $5)
        (i32.const 1)
       )
      )
      (get_local $5)
     )
     ;;@ ~lib/internal/memory.ts:122:22
     (i32.load8_u
      ;;@ ~lib/internal/memory.ts:122:31
      (block (result i32)
       (set_local $5
        (get_local $1)
       )
       (set_local $1
        (i32.add
         (get_local $5)
         (i32.const 1)
        )
       )
       (get_local $5)
      )
     )
    )
    ;;@ ~lib/internal/memory.ts:123:4
    (i32.store8
     ;;@ ~lib/internal/memory.ts:123:14
     (block (result i32)
      (set_local $5
       (get_local $0)
      )
      (set_local $0
       (i32.add
        (get_local $5)
        (i32.const 1)
       )
      )
      (get_local $5)
     )
     ;;@ ~lib/internal/memory.ts:123:22
     (i32.load8_u
      ;;@ ~lib/internal/memory.ts:123:31
      (block (result i32)
       (set_local $5
        (get_local $1)
       )
       (set_local $1
        (i32.add
         (get_local $5)
         (i32.const 1)
        )
       )
       (get_local $5)
      )
     )
    )
    ;;@ ~lib/internal/memory.ts:124:4
    (i32.store8
     ;;@ ~lib/internal/memory.ts:124:14
     (block (result i32)
      (set_local $5
       (get_local $0)
      )
      (set_local $0
       (i32.add
        (get_local $5)
        (i32.const 1)
       )
      )
      (get_local $5)
     )
     ;;@ ~lib/internal/memory.ts:124:22
     (i32.load8_u
      ;;@ ~lib/internal/memory.ts:124:31
      (block (result i32)
       (set_local $5
        (get_local $1)
       )
       (set_local $1
        (i32.add
         (get_local $5)
         (i32.const 1)
        )
       )
       (get_local $5)
      )
     )
    )
    ;;@ ~lib/internal/memory.ts:125:4
    (i32.store8
     ;;@ ~lib/internal/memory.ts:125:14
     (block (result i32)
      (set_local $5
       (get_local $0)
      )
      (set_local $0
       (i32.add
        (get_local $5)
        (i32.const 1)
       )
      )
      (get_local $5)
     )
     ;;@ ~lib/internal/memory.ts:125:22
     (i32.load8_u
      ;;@ ~lib/internal/memory.ts:125:31
      (block (result i32)
       (set_local $5
        (get_local $1)
       )
       (set_local $1
        (i32.add
         (get_local $5)
         (i32.const 1)
        )
       )
       (get_local $5)
      )
     )
    )
    ;;@ ~lib/internal/memory.ts:126:4
    (i32.store8
     ;;@ ~lib/internal/memory.ts:126:14
     (block (result i32)
      (set_local $5
       (get_local $0)
      )
      (set_local $0
       (i32.add
        (get_local $5)
        (i32.const 1)
       )
      )
      (get_local $5)
     )
     ;;@ ~lib/internal/memory.ts:126:22
     (i32.load8_u
      ;;@ ~lib/internal/memory.ts:126:31
      (block (result i32)
       (set_local $5
        (get_local $1)
       )
       (set_local $1
        (i32.add
         (get_local $5)
         (i32.const 1)
        )
       )
       (get_local $5)
      )
     )
    )
    ;;@ ~lib/internal/memory.ts:127:4
    (i32.store8
     ;;@ ~lib/internal/memory.ts:127:14
     (block (result i32)
      (set_local $5
       (get_local $0)
      )
      (set_local $0
       (i32.add
        (get_local $5)
        (i32.const 1)
       )
      )
      (get_local $5)
     )
     ;;@ ~lib/internal/memory.ts:127:22
     (i32.load8_u
      ;;@ ~lib/internal/memory.ts:127:31
      (block (result i32)
       (set_local $5
        (get_local $1)
       )
       (set_local $1
        (i32.add
         (get_local $5)
         (i32.const 1)
        )
       )
       (get_local $5)
      )
     )
    )
    ;;@ ~lib/internal/memory.ts:128:4
    (i32.store8
     ;;@ ~lib/internal/memory.ts:128:14
     (block (result i32)
      (set_local $5
       (get_local $0)
      )
      (set_local $0
       (i32.add
        (get_local $5)
        (i32.const 1)
       )
      )
      (get_local $5)
     )
     ;;@ ~lib/internal/memory.ts:128:22
     (i32.load8_u
      ;;@ ~lib/internal/memory.ts:128:31
      (block (result i32)
       (set_local $5
        (get_local $1)
       )
       (set_local $1
        (i32.add
         (get_local $5)
         (i32.const 1)
        )
       )
       (get_local $5)
      )
     )
    )
   )
  )
  ;;@ ~lib/internal/memory.ts:130:2
  (if
   ;;@ ~lib/internal/memory.ts:130:6
   (i32.and
    (get_local $2)
    ;;@ ~lib/internal/memory.ts:130:10
    (i32.const 4)
   )
   ;;@ ~lib/internal/memory.ts:130:13
   (block
    ;;@ ~lib/internal/memory.ts:131:4
    (i32.store8
     ;;@ ~lib/internal/memory.ts:131:14
     (block (result i32)
      (set_local $5
       (get_local $0)
      )
      (set_local $0
       (i32.add
        (get_local $5)
        (i32.const 1)
       )
      )
      (get_local $5)
     )
     ;;@ ~lib/internal/memory.ts:131:22
     (i32.load8_u
      ;;@ ~lib/internal/memory.ts:131:31
      (block (result i32)
       (set_local $5
        (get_local $1)
       )
       (set_local $1
        (i32.add
         (get_local $5)
         (i32.const 1)
        )
       )
       (get_local $5)
      )
     )
    )
    ;;@ ~lib/internal/memory.ts:132:4
    (i32.store8
     ;;@ ~lib/internal/memory.ts:132:14
     (block (result i32)
      (set_local $5
       (get_local $0)
      )
      (set_local $0
       (i32.add
        (get_local $5)
        (i32.const 1)
       )
      )
      (get_local $5)
     )
     ;;@ ~lib/internal/memory.ts:132:22
     (i32.load8_u
      ;;@ ~lib/internal/memory.ts:132:31
      (block (result i32)
       (set_local $5
        (get_local $1)
       )
       (set_local $1
        (i32.add
         (get_local $5)
         (i32.const 1)
        )
       )
       (get_local $5)
      )
     )
    )
    ;;@ ~lib/internal/memory.ts:133:4
    (i32.store8
     ;;@ ~lib/internal/memory.ts:133:14
     (block (result i32)
      (set_local $5
       (get_local $0)
      )
      (set_local $0
       (i32.add
        (get_local $5)
        (i32.const 1)
       )
      )
      (get_local $5)
     )
     ;;@ ~lib/internal/memory.ts:133:22
     (i32.load8_u
      ;;@ ~lib/internal/memory.ts:133:31
      (block (result i32)
       (set_local $5
        (get_local $1)
       )
       (set_local $1
        (i32.add
         (get_local $5)
         (i32.const 1)
        )
       )
       (get_local $5)
      )
     )
    )
    ;;@ ~lib/internal/memory.ts:134:4
    (i32.store8
     ;;@ ~lib/internal/memory.ts:134:14
     (block (result i32)
      (set_local $5
       (get_local $0)
      )
      (set_local $0
       (i32.add
        (get_local $5)
        (i32.const 1)
       )
      )
      (get_local $5)
     )
     ;;@ ~lib/internal/memory.ts:134:22
     (i32.load8_u
      ;;@ ~lib/internal/memory.ts:134:31
      (block (result i32)
       (set_local $5
        (get_local $1)
       )
       (set_local $1
        (i32.add
         (get_local $5)
         (i32.const 1)
        )
       )
       (get_local $5)
      )
     )
    )
   )
  )
  ;;@ ~lib/internal/memory.ts:136:2
  (if
   ;;@ ~lib/internal/memory.ts:136:6
   (i32.and
    (get_local $2)
    ;;@ ~lib/internal/memory.ts:136:10
    (i32.const 2)
   )
   ;;@ ~lib/internal/memory.ts:136:13
   (block
    ;;@ ~lib/internal/memory.ts:137:4
    (i32.store8
     ;;@ ~lib/internal/memory.ts:137:14
     (block (result i32)
      (set_local $5
       (get_local $0)
      )
      (set_local $0
       (i32.add
        (get_local $5)
        (i32.const 1)
       )
      )
      (get_local $5)
     )
     ;;@ ~lib/internal/memory.ts:137:22
     (i32.load8_u
      ;;@ ~lib/internal/memory.ts:137:31
      (block (result i32)
       (set_local $5
        (get_local $1)
       )
       (set_local $1
        (i32.add
         (get_local $5)
         (i32.const 1)
        )
       )
       (get_local $5)
      )
     )
    )
    ;;@ ~lib/internal/memory.ts:138:4
    (i32.store8
     ;;@ ~lib/internal/memory.ts:138:14
     (block (result i32)
      (set_local $5
       (get_local $0)
      )
      (set_local $0
       (i32.add
        (get_local $5)
        (i32.const 1)
       )
      )
      (get_local $5)
     )
     ;;@ ~lib/internal/memory.ts:138:22
     (i32.load8_u
      ;;@ ~lib/internal/memory.ts:138:31
      (block (result i32)
       (set_local $5
        (get_local $1)
       )
       (set_local $1
        (i32.add
         (get_local $5)
         (i32.const 1)
        )
       )
       (get_local $5)
      )
     )
    )
   )
  )
  ;;@ ~lib/internal/memory.ts:140:2
  (if
   ;;@ ~lib/internal/memory.ts:140:6
   (i32.and
    (get_local $2)
    ;;@ ~lib/internal/memory.ts:140:10
    (i32.const 1)
   )
   ;;@ ~lib/internal/memory.ts:140:13
   (i32.store8
    ;;@ ~lib/internal/memory.ts:141:14
    (block (result i32)
     (set_local $5
      (get_local $0)
     )
     (set_local $0
      (i32.add
       (get_local $5)
       (i32.const 1)
      )
     )
     (get_local $5)
    )
    ;;@ ~lib/internal/memory.ts:141:22
    (i32.load8_u
     ;;@ ~lib/internal/memory.ts:141:31
     (block (result i32)
      (set_local $5
       (get_local $1)
      )
      (set_local $1
       (i32.add
        (get_local $5)
        (i32.const 1)
       )
      )
      (get_local $5)
     )
    )
   )
  )
 )
 (func $~lib/internal/memory/memmove (; 22 ;) (type $iiiv) (param $0 i32) (param $1 i32) (param $2 i32)
  (local $3 i32)
  ;;@ ~lib/internal/memory.ts:147:2
  (if
   ;;@ ~lib/internal/memory.ts:147:6
   (i32.eq
    (get_local $0)
    ;;@ ~lib/internal/memory.ts:147:14
    (get_local $1)
   )
   ;;@ ~lib/internal/memory.ts:147:19
   (return)
  )
  ;;@ ~lib/internal/memory.ts:148:2
  (if
   ;;@ ~lib/internal/memory.ts:148:6
   (if (result i32)
    (tee_local $3
     (i32.le_u
      (i32.add
       (get_local $1)
       ;;@ ~lib/internal/memory.ts:148:12
       (get_local $2)
      )
      ;;@ ~lib/internal/memory.ts:148:17
      (get_local $0)
     )
    )
    (get_local $3)
    ;;@ ~lib/internal/memory.ts:148:25
    (i32.le_u
     (i32.add
      (get_local $0)
      ;;@ ~lib/internal/memory.ts:148:32
      (get_local $2)
     )
     ;;@ ~lib/internal/memory.ts:148:37
     (get_local $1)
    )
   )
   ;;@ ~lib/internal/memory.ts:148:42
   (block
    ;;@ ~lib/internal/memory.ts:149:4
    (call $~lib/internal/memory/memcpy
     ;;@ ~lib/internal/memory.ts:149:11
     (get_local $0)
     ;;@ ~lib/internal/memory.ts:149:17
     (get_local $1)
     ;;@ ~lib/internal/memory.ts:149:22
     (get_local $2)
    )
    ;;@ ~lib/internal/memory.ts:150:4
    (return)
   )
  )
  ;;@ ~lib/internal/memory.ts:152:2
  (if
   ;;@ ~lib/internal/memory.ts:152:6
   (i32.lt_u
    (get_local $0)
    ;;@ ~lib/internal/memory.ts:152:13
    (get_local $1)
   )
   ;;@ ~lib/internal/memory.ts:152:18
   (block
    ;;@ ~lib/internal/memory.ts:153:4
    (if
     ;;@ ~lib/internal/memory.ts:153:8
     (i32.eq
      (i32.and
       ;;@ ~lib/internal/memory.ts:153:9
       (get_local $1)
       ;;@ ~lib/internal/memory.ts:153:15
       (i32.const 7)
      )
      ;;@ ~lib/internal/memory.ts:153:21
      (i32.and
       ;;@ ~lib/internal/memory.ts:153:22
       (get_local $0)
       ;;@ ~lib/internal/memory.ts:153:29
       (i32.const 7)
      )
     )
     ;;@ ~lib/internal/memory.ts:153:33
     (block
      (block $break|0
       (loop $continue|0
        (if
         ;;@ ~lib/internal/memory.ts:154:13
         (i32.and
          (get_local $0)
          ;;@ ~lib/internal/memory.ts:154:20
          (i32.const 7)
         )
         (block
          (block
           ;;@ ~lib/internal/memory.ts:155:8
           (if
            ;;@ ~lib/internal/memory.ts:155:12
            (i32.eqz
             ;;@ ~lib/internal/memory.ts:155:13
             (get_local $2)
            )
            ;;@ ~lib/internal/memory.ts:155:16
            (return)
           )
           ;;@ ~lib/internal/memory.ts:156:8
           (set_local $2
            (i32.sub
             ;;@ ~lib/internal/memory.ts:156:10
             (get_local $2)
             (i32.const 1)
            )
           )
           ;;@ ~lib/internal/memory.ts:157:8
           (i32.store8
            ;;@ ~lib/internal/memory.ts:157:18
            (block (result i32)
             (set_local $3
              (get_local $0)
             )
             (set_local $0
              (i32.add
               (get_local $3)
               (i32.const 1)
              )
             )
             (get_local $3)
            )
            ;;@ ~lib/internal/memory.ts:157:26
            (i32.load8_u
             ;;@ ~lib/internal/memory.ts:157:35
             (block (result i32)
              (set_local $3
               (get_local $1)
              )
              (set_local $1
               (i32.add
                (get_local $3)
                (i32.const 1)
               )
              )
              (get_local $3)
             )
            )
           )
          )
          (br $continue|0)
         )
        )
       )
      )
      ;;@ ~lib/internal/memory.ts:159:6
      (block $break|1
       (loop $continue|1
        (if
         ;;@ ~lib/internal/memory.ts:159:13
         (i32.ge_u
          (get_local $2)
          ;;@ ~lib/internal/memory.ts:159:18
          (i32.const 8)
         )
         (block
          (block
           ;;@ ~lib/internal/memory.ts:160:8
           (i64.store
            ;;@ ~lib/internal/memory.ts:160:19
            (get_local $0)
            ;;@ ~lib/internal/memory.ts:160:25
            (i64.load
             ;;@ ~lib/internal/memory.ts:160:35
             (get_local $1)
            )
           )
           ;;@ ~lib/internal/memory.ts:161:8
           (set_local $2
            (i32.sub
             (get_local $2)
             ;;@ ~lib/internal/memory.ts:161:16
             (i32.const 8)
            )
           )
           ;;@ ~lib/internal/memory.ts:162:8
           (set_local $0
            (i32.add
             (get_local $0)
             ;;@ ~lib/internal/memory.ts:162:16
             (i32.const 8)
            )
           )
           ;;@ ~lib/internal/memory.ts:163:8
           (set_local $1
            (i32.add
             (get_local $1)
             ;;@ ~lib/internal/memory.ts:163:16
             (i32.const 8)
            )
           )
          )
          (br $continue|1)
         )
        )
       )
      )
     )
    )
    ;;@ ~lib/internal/memory.ts:166:4
    (block $break|2
     (loop $continue|2
      (if
       ;;@ ~lib/internal/memory.ts:166:11
       (get_local $2)
       (block
        (block
         ;;@ ~lib/internal/memory.ts:167:6
         (i32.store8
          ;;@ ~lib/internal/memory.ts:167:16
          (block (result i32)
           (set_local $3
            (get_local $0)
           )
           (set_local $0
            (i32.add
             (get_local $3)
             (i32.const 1)
            )
           )
           (get_local $3)
          )
          ;;@ ~lib/internal/memory.ts:167:24
          (i32.load8_u
           ;;@ ~lib/internal/memory.ts:167:33
           (block (result i32)
            (set_local $3
             (get_local $1)
            )
            (set_local $1
             (i32.add
              (get_local $3)
              (i32.const 1)
             )
            )
            (get_local $3)
           )
          )
         )
         ;;@ ~lib/internal/memory.ts:168:6
         (set_local $2
          (i32.sub
           ;;@ ~lib/internal/memory.ts:168:8
           (get_local $2)
           (i32.const 1)
          )
         )
        )
        (br $continue|2)
       )
      )
     )
    )
   )
   ;;@ ~lib/internal/memory.ts:170:9
   (block
    ;;@ ~lib/internal/memory.ts:171:4
    (if
     ;;@ ~lib/internal/memory.ts:171:8
     (i32.eq
      (i32.and
       ;;@ ~lib/internal/memory.ts:171:9
       (get_local $1)
       ;;@ ~lib/internal/memory.ts:171:15
       (i32.const 7)
      )
      ;;@ ~lib/internal/memory.ts:171:21
      (i32.and
       ;;@ ~lib/internal/memory.ts:171:22
       (get_local $0)
       ;;@ ~lib/internal/memory.ts:171:29
       (i32.const 7)
      )
     )
     ;;@ ~lib/internal/memory.ts:171:33
     (block
      (block $break|3
       (loop $continue|3
        (if
         ;;@ ~lib/internal/memory.ts:172:13
         (i32.and
          (i32.add
           ;;@ ~lib/internal/memory.ts:172:14
           (get_local $0)
           ;;@ ~lib/internal/memory.ts:172:21
           (get_local $2)
          )
          ;;@ ~lib/internal/memory.ts:172:26
          (i32.const 7)
         )
         (block
          (block
           ;;@ ~lib/internal/memory.ts:173:8
           (if
            ;;@ ~lib/internal/memory.ts:173:12
            (i32.eqz
             ;;@ ~lib/internal/memory.ts:173:13
             (get_local $2)
            )
            ;;@ ~lib/internal/memory.ts:173:16
            (return)
           )
           ;;@ ~lib/internal/memory.ts:174:8
           (i32.store8
            ;;@ ~lib/internal/memory.ts:174:18
            (i32.add
             (get_local $0)
             ;;@ ~lib/internal/memory.ts:174:25
             (tee_local $2
              (i32.sub
               ;;@ ~lib/internal/memory.ts:174:27
               (get_local $2)
               (i32.const 1)
              )
             )
            )
            ;;@ ~lib/internal/memory.ts:174:30
            (i32.load8_u
             ;;@ ~lib/internal/memory.ts:174:39
             (i32.add
              (get_local $1)
              ;;@ ~lib/internal/memory.ts:174:45
              (get_local $2)
             )
            )
           )
          )
          (br $continue|3)
         )
        )
       )
      )
      ;;@ ~lib/internal/memory.ts:176:6
      (block $break|4
       (loop $continue|4
        (if
         ;;@ ~lib/internal/memory.ts:176:13
         (i32.ge_u
          (get_local $2)
          ;;@ ~lib/internal/memory.ts:176:18
          (i32.const 8)
         )
         (block
          (block
           ;;@ ~lib/internal/memory.ts:177:8
           (set_local $2
            (i32.sub
             (get_local $2)
             ;;@ ~lib/internal/memory.ts:177:13
             (i32.const 8)
            )
           )
           ;;@ ~lib/internal/memory.ts:178:8
           (i64.store
            ;;@ ~lib/internal/memory.ts:178:19
            (i32.add
             (get_local $0)
             ;;@ ~lib/internal/memory.ts:178:26
             (get_local $2)
            )
            ;;@ ~lib/internal/memory.ts:178:29
            (i64.load
             ;;@ ~lib/internal/memory.ts:178:39
             (i32.add
              (get_local $1)
              ;;@ ~lib/internal/memory.ts:178:45
              (get_local $2)
             )
            )
           )
          )
          (br $continue|4)
         )
        )
       )
      )
     )
    )
    ;;@ ~lib/internal/memory.ts:181:4
    (block $break|5
     (loop $continue|5
      (if
       ;;@ ~lib/internal/memory.ts:181:11
       (get_local $2)
       (block
        ;;@ ~lib/internal/memory.ts:181:14
        (i32.store8
         ;;@ ~lib/internal/memory.ts:182:16
         (i32.add
          (get_local $0)
          ;;@ ~lib/internal/memory.ts:182:23
          (tee_local $2
           (i32.sub
            ;;@ ~lib/internal/memory.ts:182:25
            (get_local $2)
            (i32.const 1)
           )
          )
         )
         ;;@ ~lib/internal/memory.ts:182:28
         (i32.load8_u
          ;;@ ~lib/internal/memory.ts:182:37
          (i32.add
           (get_local $1)
           ;;@ ~lib/internal/memory.ts:182:43
           (get_local $2)
          )
         )
        )
        (br $continue|5)
       )
      )
     )
    )
   )
  )
 )
 (func $~lib/internal/string/copyUnsafe (; 23 ;) (type $iiiiiv) (param $0 i32) (param $1 i32) (param $2 i32) (param $3 i32) (param $4 i32)
  (local $5 i32)
  (local $6 i32)
  (local $7 i32)
  ;;@ ~lib/internal/string.ts:26:9
  (block $~lib/memory/memory.copy|inlined.0
   (set_local $5
    ;;@ ~lib/internal/string.ts:27:4
    (i32.add
     (i32.add
      (get_local $0)
      ;;@ ~lib/internal/string.ts:27:30
      (i32.shl
       ;;@ ~lib/internal/string.ts:27:31
       (get_local $1)
       ;;@ ~lib/internal/string.ts:27:45
       (i32.const 1)
      )
     )
     ;;@ ~lib/internal/string.ts:27:50
     (get_global $~lib/internal/string/HEADER_SIZE)
    )
   )
   (set_local $6
    ;;@ ~lib/internal/string.ts:28:4
    (i32.add
     (i32.add
      (get_local $2)
      ;;@ ~lib/internal/string.ts:28:30
      (i32.shl
       ;;@ ~lib/internal/string.ts:28:31
       (get_local $3)
       ;;@ ~lib/internal/string.ts:28:44
       (i32.const 1)
      )
     )
     ;;@ ~lib/internal/string.ts:28:50
     (get_global $~lib/internal/string/HEADER_SIZE)
    )
   )
   (set_local $7
    ;;@ ~lib/internal/string.ts:29:4
    (i32.shl
     (get_local $4)
     ;;@ ~lib/internal/string.ts:29:11
     (i32.const 1)
    )
   )
   ;;@ ~lib/memory.ts:20:4
   (call $~lib/internal/memory/memmove
    ;;@ ~lib/memory.ts:20:12
    (get_local $5)
    ;;@ ~lib/memory.ts:20:18
    (get_local $6)
    ;;@ ~lib/memory.ts:20:23
    (get_local $7)
   )
  )
 )
 (func $~lib/string/String#concat (; 24 ;) (type $iii) (param $0 i32) (param $1 i32) (result i32)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  ;;@ ~lib/string.ts:106:4
  (if
   (i32.eqz
    ;;@ ~lib/string.ts:106:11
    (i32.ne
     (get_local $0)
     ;;@ ~lib/string.ts:106:20
     (i32.const 0)
    )
   )
   (block
    (call $~lib/env/abort
     (i32.const 0)
     (i32.const 216)
     (i32.const 106)
     (i32.const 4)
    )
    (unreachable)
   )
  )
  ;;@ ~lib/string.ts:107:4
  (if
   ;;@ ~lib/string.ts:107:8
   (i32.eq
    (get_local $1)
    ;;@ ~lib/string.ts:107:18
    (i32.const 0)
   )
   ;;@ ~lib/string.ts:107:24
   (set_local $1
    ;;@ ~lib/string.ts:107:32
    (i32.const 200)
   )
  )
  ;;@ ~lib/string.ts:109:4
  (set_local $2
   ;;@ ~lib/string.ts:109:25
   (i32.load
    (get_local $0)
   )
  )
  ;;@ ~lib/string.ts:110:4
  (set_local $3
   ;;@ ~lib/string.ts:110:26
   (i32.load
    (get_local $1)
   )
  )
  ;;@ ~lib/string.ts:111:4
  (set_local $4
   ;;@ ~lib/string.ts:111:24
   (i32.add
    (get_local $2)
    ;;@ ~lib/string.ts:111:34
    (get_local $3)
   )
  )
  ;;@ ~lib/string.ts:112:4
  (if
   ;;@ ~lib/string.ts:112:8
   (i32.eq
    (get_local $4)
    ;;@ ~lib/string.ts:112:18
    (i32.const 0)
   )
   ;;@ ~lib/string.ts:112:49
   (return
    ;;@ ~lib/string.ts:112:28
    (i32.const 56)
   )
  )
  ;;@ ~lib/string.ts:113:4
  (set_local $5
   ;;@ ~lib/string.ts:113:14
   (call $~lib/internal/string/allocateUnsafe
    ;;@ ~lib/string.ts:113:29
    (get_local $4)
   )
  )
  ;;@ ~lib/string.ts:114:4
  (call $~lib/internal/string/copyUnsafe
   ;;@ ~lib/string.ts:114:15
   (get_local $5)
   ;;@ ~lib/string.ts:114:20
   (i32.const 0)
   ;;@ ~lib/string.ts:114:23
   (get_local $0)
   ;;@ ~lib/string.ts:114:29
   (i32.const 0)
   ;;@ ~lib/string.ts:114:32
   (get_local $2)
  )
  ;;@ ~lib/string.ts:115:4
  (call $~lib/internal/string/copyUnsafe
   ;;@ ~lib/string.ts:115:15
   (get_local $5)
   ;;@ ~lib/string.ts:115:20
   (get_local $2)
   ;;@ ~lib/string.ts:115:29
   (get_local $1)
   ;;@ ~lib/string.ts:115:36
   (i32.const 0)
   ;;@ ~lib/string.ts:115:39
   (get_local $3)
  )
  ;;@ ~lib/string.ts:116:11
  (get_local $5)
 )
 (func $~lib/string/String.__concat (; 25 ;) (type $iii) (param $0 i32) (param $1 i32) (result i32)
  ;;@ ~lib/string.ts:101:4
  (if
   ;;@ ~lib/string.ts:101:8
   (i32.eqz
    ;;@ ~lib/string.ts:101:9
    (get_local $0)
   )
   ;;@ ~lib/string.ts:101:34
   (set_local $0
    ;;@ ~lib/string.ts:101:41
    (i32.const 200)
   )
  )
  ;;@ ~lib/string.ts:102:28
  (call $~lib/string/String#concat
   ;;@ ~lib/string.ts:102:11
   (get_local $0)
   ;;@ ~lib/string.ts:102:23
   (get_local $1)
  )
 )
 (func $src/service/wasm/waveform/drawWavePath (; 26 ;) (type $iiiii) (param $0 i32) (param $1 i32) (param $2 i32) (param $3 i32) (result i32)
  (local $4 i32)
  (local $5 i32)
  (local $6 i32)
  (local $7 i32)
  (local $8 i32)
  (local $9 f32)
  (local $10 f32)
  (local $11 i32)
  (local $12 f32)
  ;;@ src/service/wasm/waveform.ts:6:2
  (set_local $4
   ;;@ src/service/wasm/waveform.ts:6:18
   (i32.const 56)
  )
  ;;@ src/service/wasm/waveform.ts:7:2
  (set_local $5
   ;;@ src/service/wasm/waveform.ts:7:18
   (i32.const 56)
  )
  ;;@ src/service/wasm/waveform.ts:8:2
  (set_local $6
   ;;@ src/service/wasm/waveform.ts:8:15
   (i32.div_s
    ;;@ src/service/wasm/waveform.ts:8:26
    (block $~lib/array/Array<i32>#get:length|inlined.0 (result i32)
     ;;@ ~lib/array.ts:37:16
     (i32.load offset=4
      ;;@ ~lib/array.ts:37:11
      (get_local $0)
     )
    )
    ;;@ src/service/wasm/waveform.ts:8:44
    (get_local $1)
   )
  )
  ;;@ src/service/wasm/waveform.ts:9:2
  (set_local $7
   ;;@ src/service/wasm/waveform.ts:9:14
   (i32.div_s
    (get_local $2)
    ;;@ src/service/wasm/waveform.ts:9:23
    (i32.const 2)
   )
  )
  ;;@ src/service/wasm/waveform.ts:10:2
  (block $break|0
   ;;@ src/service/wasm/waveform.ts:10:7
   (set_local $8
    ;;@ src/service/wasm/waveform.ts:10:20
    (i32.const 0)
   )
   (loop $repeat|0
    (br_if $break|0
     (i32.eqz
      ;;@ src/service/wasm/waveform.ts:10:23
      (i32.lt_s
       (get_local $8)
       ;;@ src/service/wasm/waveform.ts:10:27
       (get_local $1)
      )
     )
    )
    ;;@ src/service/wasm/waveform.ts:10:39
    (block
     ;;@ src/service/wasm/waveform.ts:11:4
     (set_local $9
      ;;@ src/service/wasm/waveform.ts:11:18
      (f32.const 1)
     )
     ;;@ src/service/wasm/waveform.ts:12:4
     (set_local $10
      ;;@ src/service/wasm/waveform.ts:12:18
      (f32.const -1)
     )
     ;;@ src/service/wasm/waveform.ts:13:4
     (block $break|1
      ;;@ src/service/wasm/waveform.ts:13:9
      (set_local $11
       ;;@ src/service/wasm/waveform.ts:13:22
       (i32.const 0)
      )
      (loop $repeat|1
       (br_if $break|1
        (i32.eqz
         ;;@ src/service/wasm/waveform.ts:13:25
         (i32.lt_s
          (get_local $11)
          ;;@ src/service/wasm/waveform.ts:13:29
          (get_local $6)
         )
        )
       )
       ;;@ src/service/wasm/waveform.ts:13:40
       (block
        ;;@ src/service/wasm/waveform.ts:14:6
        (set_local $12
         ;;@ src/service/wasm/waveform.ts:14:25
         (f32.convert_s/i32
          (call $~lib/array/Array<i32>#__get
           ;;@ src/service/wasm/waveform.ts:14:30
           (get_local $0)
           ;;@ src/service/wasm/waveform.ts:14:39
           (i32.add
            (i32.mul
             ;;@ src/service/wasm/waveform.ts:14:40
             (get_local $8)
             ;;@ src/service/wasm/waveform.ts:14:44
             (get_local $6)
            )
            ;;@ src/service/wasm/waveform.ts:14:52
            (get_local $11)
           )
          )
         )
        )
        ;;@ src/service/wasm/waveform.ts:15:6
        (if
         ;;@ src/service/wasm/waveform.ts:15:10
         (f32.lt
          (get_local $12)
          ;;@ src/service/wasm/waveform.ts:15:18
          (get_local $9)
         )
         ;;@ src/service/wasm/waveform.ts:15:23
         (set_local $9
          ;;@ src/service/wasm/waveform.ts:16:14
          (get_local $12)
         )
        )
        ;;@ src/service/wasm/waveform.ts:18:6
        (if
         ;;@ src/service/wasm/waveform.ts:18:10
         (f32.gt
          (get_local $12)
          ;;@ src/service/wasm/waveform.ts:18:18
          (get_local $10)
         )
         ;;@ src/service/wasm/waveform.ts:18:23
         (set_local $10
          ;;@ src/service/wasm/waveform.ts:19:14
          (get_local $12)
         )
        )
       )
       ;;@ src/service/wasm/waveform.ts:13:35
       (set_local $11
        (i32.add
         (get_local $11)
         (i32.const 1)
        )
       )
       (br $repeat|1)
      )
     )
     ;;@ src/service/wasm/waveform.ts:22:4
     (set_local $4
      ;;@ src/service/wasm/waveform.ts:22:16
      (call $~lib/string/String.__concat
       (get_local $4)
       ;;@ src/service/wasm/waveform.ts:22:28
       (i32.const 64)
      )
     )
     ;;@ src/service/wasm/waveform.ts:23:4
     (set_local $5
      ;;@ src/service/wasm/waveform.ts:23:16
      (call $~lib/string/String.__concat
       (i32.const 304)
       ;;@ src/service/wasm/waveform.ts:23:99
       (get_local $5)
      )
     )
    )
    ;;@ src/service/wasm/waveform.ts:10:34
    (set_local $8
     (i32.add
      (get_local $8)
      (i32.const 1)
     )
    )
    (br $repeat|0)
   )
  )
  ;;@ src/service/wasm/waveform.ts:25:33
  (call $~lib/string/String.__concat
   ;;@ src/service/wasm/waveform.ts:25:9
   (call $~lib/string/String.__concat
    (get_local $4)
    ;;@ src/service/wasm/waveform.ts:25:21
    (get_local $5)
   )
   ;;@ src/service/wasm/waveform.ts:25:33
   (i32.const 464)
  )
 )
 (func $start (; 27 ;) (type $v)
  ;;@ ~lib/allocator/tlsf.ts:122:0
  (if
   (i32.eqz
    ;;@ ~lib/allocator/tlsf.ts:122:7
    (i32.le_s
     (i32.shl
      ;;@ ~lib/allocator/tlsf.ts:122:8
      (i32.const 1)
      ;;@ ~lib/allocator/tlsf.ts:122:13
      (get_global $~lib/allocator/tlsf/SL_BITS)
     )
     ;;@ ~lib/allocator/tlsf.ts:122:25
     (i32.const 32)
    )
   )
   (block
    (call $~lib/env/abort
     (i32.const 0)
     (i32.const 8)
     (i32.const 122)
     (i32.const 0)
    )
    (unreachable)
   )
  )
 )
 (func $null (; 28 ;) (type $v)
 )
)
