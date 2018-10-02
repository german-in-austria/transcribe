(module
 (type $iiiv (func (param i32 i32 i32)))
 (type $iiii (func (param i32 i32 i32) (result i32)))
 (type $ii (func (param i32) (result i32)))
 (type $iv (func (param i32)))
 (type $v (func))
 (type $iiiiiii (func (param i32 i32 i32 i32 i32 i32) (result i32)))
 (type $iiiiv (func (param i32 i32 i32 i32)))
 (type $FF (func (param f64) (result f64)))
 (type $iiifi (func (param i32 i32 i32 f32) (result i32)))
 (type $fff (func (param f32 f32) (result f32)))
 (type $fif (func (param f32 i32) (result f32)))
 (type $iifv (func (param i32 i32 f32)))
 (type $iii (func (param i32 i32) (result i32)))
 (type $iif (func (param i32 i32) (result f32)))
 (import "env" "abort" (func $~lib/env/abort (param i32 i32 i32 i32)))
 (global $~lib/internal/allocator/AL_BITS i32 (i32.const 3))
 (global $~lib/internal/allocator/AL_SIZE i32 (i32.const 8))
 (global $~lib/internal/allocator/AL_MASK i32 (i32.const 7))
 (global $~lib/internal/allocator/MAX_SIZE_32 i32 (i32.const 1073741824))
 (global $~lib/allocator/arena/startOffset (mut i32) (i32.const 0))
 (global $~lib/allocator/arena/offset (mut i32) (i32.const 0))
 (global $src/service/wasm/get-frequencies/E f32 (f32.const 2.7182817459106445))
 (global $~lib/builtins/f64.EPSILON f64 (f64.const 2.220446049250313e-16))
 (global $NaN f64 (f64.const nan:0x8000000000000))
 (global $~lib/internal/arraybuffer/HEADER_SIZE i32 (i32.const 8))
 (global $~lib/internal/arraybuffer/MAX_BLENGTH i32 (i32.const 1073741816))
 (global $~lib/math/NativeMath.PI f64 (f64.const 3.141592653589793))
 (global $HEAP_BASE i32 (i32.const 296))
 (table 1 1 anyfunc)
 (elem (i32.const 0) $null)
 (memory $0 1)
 (data (i32.const 8) "#\00\00\00s\00r\00c\00/\00s\00e\00r\00v\00i\00c\00e\00/\00w\00a\00s\00m\00/\00g\00e\00t\00-\00f\00r\00e\00q\00u\00e\00n\00c\00i\00e\00s\00.\00t\00s\00")
 (data (i32.const 88) "\00\00\00\00\00\00\00\00")
 (data (i32.const 96) "X\00\00\00\00\00\00\00")
 (data (i32.const 104) "\00\00\00\00\00\00\00\00")
 (data (i32.const 112) "h\00\00\00\00\00\00\00")
 (data (i32.const 120) "\00\00\00\00\00\00\00\00")
 (data (i32.const 128) "x\00\00\00\00\00\00\00")
 (data (i32.const 136) "\00\00\00\00\00\00\00\00")
 (data (i32.const 144) "\88\00\00\00\00\00\00\00")
 (data (i32.const 152) "\0d\00\00\00~\00l\00i\00b\00/\00a\00r\00r\00a\00y\00.\00t\00s\00")
 (data (i32.const 184) "\1c\00\00\00~\00l\00i\00b\00/\00i\00n\00t\00e\00r\00n\00a\00l\00/\00a\00r\00r\00a\00y\00b\00u\00f\00f\00e\00r\00.\00t\00s\00")
 (data (i32.const 248) "\00\00\00\00\00\00\00\00")
 (data (i32.const 256) "\f8\00\00\00\00\00\00\00")
 (data (i32.const 264) "\00\00\00\00\00\00\00\00")
 (data (i32.const 272) "\08\01\00\00\00\00\00\00")
 (data (i32.const 280) "\00\00\00\00\00\00\00\00")
 (data (i32.const 288) "\18\01\00\00\00\00\00\00")
 (export "memory" (memory $0))
 (export "getFrequencies" (func $src/service/wasm/get-frequencies/getFrequencies))
 (export "memory.fill" (func $~lib/memory/memory.fill))
 (export "memory.copy" (func $~lib/memory/memory.copy))
 (export "memory.compare" (func $~lib/memory/memory.compare))
 (export "memory.allocate" (func $~lib/memory/memory.allocate))
 (export "memory.free" (func $~lib/memory/memory.free))
 (export "memory.reset" (func $~lib/memory/memory.reset))
 (start $start)
 (func $~lib/internal/memory/memset (; 1 ;) (type $iiiv) (param $0 i32) (param $1 i32) (param $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i64)
  ;;@ ~lib/internal/memory.ts:191:2
  (if
   ;;@ ~lib/internal/memory.ts:191:6
   (i32.eqz
    ;;@ ~lib/internal/memory.ts:191:7
    (get_local $2)
   )
   ;;@ ~lib/internal/memory.ts:191:10
   (return)
  )
  ;;@ ~lib/internal/memory.ts:192:2
  (i32.store8
   ;;@ ~lib/internal/memory.ts:192:12
   (get_local $0)
   ;;@ ~lib/internal/memory.ts:192:18
   (get_local $1)
  )
  ;;@ ~lib/internal/memory.ts:193:2
  (i32.store8
   ;;@ ~lib/internal/memory.ts:193:12
   (i32.sub
    (i32.add
     (get_local $0)
     ;;@ ~lib/internal/memory.ts:193:19
     (get_local $2)
    )
    ;;@ ~lib/internal/memory.ts:193:23
    (i32.const 1)
   )
   ;;@ ~lib/internal/memory.ts:193:26
   (get_local $1)
  )
  ;;@ ~lib/internal/memory.ts:194:2
  (if
   ;;@ ~lib/internal/memory.ts:194:6
   (i32.le_u
    (get_local $2)
    ;;@ ~lib/internal/memory.ts:194:11
    (i32.const 2)
   )
   ;;@ ~lib/internal/memory.ts:194:14
   (return)
  )
  ;;@ ~lib/internal/memory.ts:196:2
  (i32.store8
   ;;@ ~lib/internal/memory.ts:196:12
   (i32.add
    (get_local $0)
    ;;@ ~lib/internal/memory.ts:196:19
    (i32.const 1)
   )
   ;;@ ~lib/internal/memory.ts:196:22
   (get_local $1)
  )
  ;;@ ~lib/internal/memory.ts:197:2
  (i32.store8
   ;;@ ~lib/internal/memory.ts:197:12
   (i32.add
    (get_local $0)
    ;;@ ~lib/internal/memory.ts:197:19
    (i32.const 2)
   )
   ;;@ ~lib/internal/memory.ts:197:22
   (get_local $1)
  )
  ;;@ ~lib/internal/memory.ts:198:2
  (i32.store8
   ;;@ ~lib/internal/memory.ts:198:12
   (i32.sub
    (i32.add
     (get_local $0)
     ;;@ ~lib/internal/memory.ts:198:19
     (get_local $2)
    )
    ;;@ ~lib/internal/memory.ts:198:23
    (i32.const 2)
   )
   ;;@ ~lib/internal/memory.ts:198:26
   (get_local $1)
  )
  ;;@ ~lib/internal/memory.ts:199:2
  (i32.store8
   ;;@ ~lib/internal/memory.ts:199:12
   (i32.sub
    (i32.add
     (get_local $0)
     ;;@ ~lib/internal/memory.ts:199:19
     (get_local $2)
    )
    ;;@ ~lib/internal/memory.ts:199:23
    (i32.const 3)
   )
   ;;@ ~lib/internal/memory.ts:199:26
   (get_local $1)
  )
  ;;@ ~lib/internal/memory.ts:200:2
  (if
   ;;@ ~lib/internal/memory.ts:200:6
   (i32.le_u
    (get_local $2)
    ;;@ ~lib/internal/memory.ts:200:11
    (i32.const 6)
   )
   ;;@ ~lib/internal/memory.ts:200:14
   (return)
  )
  ;;@ ~lib/internal/memory.ts:201:2
  (i32.store8
   ;;@ ~lib/internal/memory.ts:201:12
   (i32.add
    (get_local $0)
    ;;@ ~lib/internal/memory.ts:201:19
    (i32.const 3)
   )
   ;;@ ~lib/internal/memory.ts:201:22
   (get_local $1)
  )
  ;;@ ~lib/internal/memory.ts:202:2
  (i32.store8
   ;;@ ~lib/internal/memory.ts:202:12
   (i32.sub
    (i32.add
     (get_local $0)
     ;;@ ~lib/internal/memory.ts:202:19
     (get_local $2)
    )
    ;;@ ~lib/internal/memory.ts:202:23
    (i32.const 4)
   )
   ;;@ ~lib/internal/memory.ts:202:26
   (get_local $1)
  )
  ;;@ ~lib/internal/memory.ts:203:2
  (if
   ;;@ ~lib/internal/memory.ts:203:6
   (i32.le_u
    (get_local $2)
    ;;@ ~lib/internal/memory.ts:203:11
    (i32.const 8)
   )
   ;;@ ~lib/internal/memory.ts:203:14
   (return)
  )
  ;;@ ~lib/internal/memory.ts:206:2
  (set_local $3
   ;;@ ~lib/internal/memory.ts:206:17
   (i32.and
    (i32.sub
     (i32.const 0)
     ;;@ ~lib/internal/memory.ts:206:18
     (get_local $0)
    )
    ;;@ ~lib/internal/memory.ts:206:25
    (i32.const 3)
   )
  )
  ;;@ ~lib/internal/memory.ts:207:2
  (set_local $0
   (i32.add
    (get_local $0)
    ;;@ ~lib/internal/memory.ts:207:10
    (get_local $3)
   )
  )
  ;;@ ~lib/internal/memory.ts:208:2
  (set_local $2
   (i32.sub
    (get_local $2)
    ;;@ ~lib/internal/memory.ts:208:7
    (get_local $3)
   )
  )
  ;;@ ~lib/internal/memory.ts:209:2
  (set_local $2
   (i32.and
    (get_local $2)
    ;;@ ~lib/internal/memory.ts:209:7
    (i32.const -4)
   )
  )
  ;;@ ~lib/internal/memory.ts:211:2
  (set_local $4
   ;;@ ~lib/internal/memory.ts:211:17
   (i32.mul
    (i32.div_u
     (i32.const -1)
     ;;@ ~lib/internal/memory.ts:211:27
     (i32.const 255)
    )
    (i32.and
     ;;@ ~lib/internal/memory.ts:211:33
     (get_local $1)
     (i32.const 255)
    )
   )
  )
  ;;@ ~lib/internal/memory.ts:214:2
  (i32.store
   ;;@ ~lib/internal/memory.ts:214:13
   (get_local $0)
   ;;@ ~lib/internal/memory.ts:214:19
   (get_local $4)
  )
  ;;@ ~lib/internal/memory.ts:215:2
  (i32.store
   ;;@ ~lib/internal/memory.ts:215:13
   (i32.sub
    (i32.add
     (get_local $0)
     ;;@ ~lib/internal/memory.ts:215:20
     (get_local $2)
    )
    ;;@ ~lib/internal/memory.ts:215:24
    (i32.const 4)
   )
   ;;@ ~lib/internal/memory.ts:215:27
   (get_local $4)
  )
  ;;@ ~lib/internal/memory.ts:216:2
  (if
   ;;@ ~lib/internal/memory.ts:216:6
   (i32.le_u
    (get_local $2)
    ;;@ ~lib/internal/memory.ts:216:11
    (i32.const 8)
   )
   ;;@ ~lib/internal/memory.ts:216:14
   (return)
  )
  ;;@ ~lib/internal/memory.ts:217:2
  (i32.store
   ;;@ ~lib/internal/memory.ts:217:13
   (i32.add
    (get_local $0)
    ;;@ ~lib/internal/memory.ts:217:20
    (i32.const 4)
   )
   ;;@ ~lib/internal/memory.ts:217:23
   (get_local $4)
  )
  ;;@ ~lib/internal/memory.ts:218:2
  (i32.store
   ;;@ ~lib/internal/memory.ts:218:13
   (i32.add
    (get_local $0)
    ;;@ ~lib/internal/memory.ts:218:20
    (i32.const 8)
   )
   ;;@ ~lib/internal/memory.ts:218:23
   (get_local $4)
  )
  ;;@ ~lib/internal/memory.ts:219:2
  (i32.store
   ;;@ ~lib/internal/memory.ts:219:13
   (i32.sub
    (i32.add
     (get_local $0)
     ;;@ ~lib/internal/memory.ts:219:20
     (get_local $2)
    )
    ;;@ ~lib/internal/memory.ts:219:24
    (i32.const 12)
   )
   ;;@ ~lib/internal/memory.ts:219:28
   (get_local $4)
  )
  ;;@ ~lib/internal/memory.ts:220:2
  (i32.store
   ;;@ ~lib/internal/memory.ts:220:13
   (i32.sub
    (i32.add
     (get_local $0)
     ;;@ ~lib/internal/memory.ts:220:20
     (get_local $2)
    )
    ;;@ ~lib/internal/memory.ts:220:24
    (i32.const 8)
   )
   ;;@ ~lib/internal/memory.ts:220:27
   (get_local $4)
  )
  ;;@ ~lib/internal/memory.ts:221:2
  (if
   ;;@ ~lib/internal/memory.ts:221:6
   (i32.le_u
    (get_local $2)
    ;;@ ~lib/internal/memory.ts:221:11
    (i32.const 24)
   )
   ;;@ ~lib/internal/memory.ts:221:15
   (return)
  )
  ;;@ ~lib/internal/memory.ts:222:2
  (i32.store
   ;;@ ~lib/internal/memory.ts:222:13
   (i32.add
    (get_local $0)
    ;;@ ~lib/internal/memory.ts:222:20
    (i32.const 12)
   )
   ;;@ ~lib/internal/memory.ts:222:24
   (get_local $4)
  )
  ;;@ ~lib/internal/memory.ts:223:2
  (i32.store
   ;;@ ~lib/internal/memory.ts:223:13
   (i32.add
    (get_local $0)
    ;;@ ~lib/internal/memory.ts:223:20
    (i32.const 16)
   )
   ;;@ ~lib/internal/memory.ts:223:24
   (get_local $4)
  )
  ;;@ ~lib/internal/memory.ts:224:2
  (i32.store
   ;;@ ~lib/internal/memory.ts:224:13
   (i32.add
    (get_local $0)
    ;;@ ~lib/internal/memory.ts:224:20
    (i32.const 20)
   )
   ;;@ ~lib/internal/memory.ts:224:24
   (get_local $4)
  )
  ;;@ ~lib/internal/memory.ts:225:2
  (i32.store
   ;;@ ~lib/internal/memory.ts:225:13
   (i32.add
    (get_local $0)
    ;;@ ~lib/internal/memory.ts:225:20
    (i32.const 24)
   )
   ;;@ ~lib/internal/memory.ts:225:24
   (get_local $4)
  )
  ;;@ ~lib/internal/memory.ts:226:2
  (i32.store
   ;;@ ~lib/internal/memory.ts:226:13
   (i32.sub
    (i32.add
     (get_local $0)
     ;;@ ~lib/internal/memory.ts:226:20
     (get_local $2)
    )
    ;;@ ~lib/internal/memory.ts:226:24
    (i32.const 28)
   )
   ;;@ ~lib/internal/memory.ts:226:28
   (get_local $4)
  )
  ;;@ ~lib/internal/memory.ts:227:2
  (i32.store
   ;;@ ~lib/internal/memory.ts:227:13
   (i32.sub
    (i32.add
     (get_local $0)
     ;;@ ~lib/internal/memory.ts:227:20
     (get_local $2)
    )
    ;;@ ~lib/internal/memory.ts:227:24
    (i32.const 24)
   )
   ;;@ ~lib/internal/memory.ts:227:28
   (get_local $4)
  )
  ;;@ ~lib/internal/memory.ts:228:2
  (i32.store
   ;;@ ~lib/internal/memory.ts:228:13
   (i32.sub
    (i32.add
     (get_local $0)
     ;;@ ~lib/internal/memory.ts:228:20
     (get_local $2)
    )
    ;;@ ~lib/internal/memory.ts:228:24
    (i32.const 20)
   )
   ;;@ ~lib/internal/memory.ts:228:28
   (get_local $4)
  )
  ;;@ ~lib/internal/memory.ts:229:2
  (i32.store
   ;;@ ~lib/internal/memory.ts:229:13
   (i32.sub
    (i32.add
     (get_local $0)
     ;;@ ~lib/internal/memory.ts:229:20
     (get_local $2)
    )
    ;;@ ~lib/internal/memory.ts:229:24
    (i32.const 16)
   )
   ;;@ ~lib/internal/memory.ts:229:28
   (get_local $4)
  )
  ;;@ ~lib/internal/memory.ts:232:2
  (set_local $3
   ;;@ ~lib/internal/memory.ts:232:6
   (i32.add
    (i32.const 24)
    ;;@ ~lib/internal/memory.ts:232:11
    (i32.and
     ;;@ ~lib/internal/memory.ts:232:12
     (get_local $0)
     ;;@ ~lib/internal/memory.ts:232:19
     (i32.const 4)
    )
   )
  )
  ;;@ ~lib/internal/memory.ts:233:2
  (set_local $0
   (i32.add
    (get_local $0)
    ;;@ ~lib/internal/memory.ts:233:10
    (get_local $3)
   )
  )
  ;;@ ~lib/internal/memory.ts:234:2
  (set_local $2
   (i32.sub
    (get_local $2)
    ;;@ ~lib/internal/memory.ts:234:7
    (get_local $3)
   )
  )
  ;;@ ~lib/internal/memory.ts:237:2
  (set_local $5
   ;;@ ~lib/internal/memory.ts:237:17
   (i64.or
    (i64.extend_u/i32
     (get_local $4)
    )
    ;;@ ~lib/internal/memory.ts:237:28
    (i64.shl
     ;;@ ~lib/internal/memory.ts:237:29
     (i64.extend_u/i32
      (get_local $4)
     )
     ;;@ ~lib/internal/memory.ts:237:41
     (i64.const 32)
    )
   )
  )
  ;;@ ~lib/internal/memory.ts:238:2
  (block $break|0
   (loop $continue|0
    (if
     ;;@ ~lib/internal/memory.ts:238:9
     (i32.ge_u
      (get_local $2)
      ;;@ ~lib/internal/memory.ts:238:14
      (i32.const 32)
     )
     (block
      (block
       ;;@ ~lib/internal/memory.ts:239:4
       (i64.store
        ;;@ ~lib/internal/memory.ts:239:15
        (get_local $0)
        ;;@ ~lib/internal/memory.ts:239:21
        (get_local $5)
       )
       ;;@ ~lib/internal/memory.ts:240:4
       (i64.store
        ;;@ ~lib/internal/memory.ts:240:15
        (i32.add
         (get_local $0)
         ;;@ ~lib/internal/memory.ts:240:22
         (i32.const 8)
        )
        ;;@ ~lib/internal/memory.ts:240:25
        (get_local $5)
       )
       ;;@ ~lib/internal/memory.ts:241:4
       (i64.store
        ;;@ ~lib/internal/memory.ts:241:15
        (i32.add
         (get_local $0)
         ;;@ ~lib/internal/memory.ts:241:22
         (i32.const 16)
        )
        ;;@ ~lib/internal/memory.ts:241:26
        (get_local $5)
       )
       ;;@ ~lib/internal/memory.ts:242:4
       (i64.store
        ;;@ ~lib/internal/memory.ts:242:15
        (i32.add
         (get_local $0)
         ;;@ ~lib/internal/memory.ts:242:22
         (i32.const 24)
        )
        ;;@ ~lib/internal/memory.ts:242:26
        (get_local $5)
       )
       ;;@ ~lib/internal/memory.ts:243:4
       (set_local $2
        (i32.sub
         (get_local $2)
         ;;@ ~lib/internal/memory.ts:243:9
         (i32.const 32)
        )
       )
       ;;@ ~lib/internal/memory.ts:244:4
       (set_local $0
        (i32.add
         (get_local $0)
         ;;@ ~lib/internal/memory.ts:244:12
         (i32.const 32)
        )
       )
      )
      (br $continue|0)
     )
    )
   )
  )
 )
 (func $~lib/memory/memory.fill (; 2 ;) (type $iiiv) (param $0 i32) (param $1 i32) (param $2 i32)
  ;;@ ~lib/memory.ts:15:4
  (call $~lib/internal/memory/memset
   ;;@ ~lib/memory.ts:15:11
   (get_local $0)
   ;;@ ~lib/memory.ts:15:17
   (get_local $1)
   ;;@ ~lib/memory.ts:15:20
   (get_local $2)
  )
 )
 (func $~lib/internal/memory/memcpy (; 3 ;) (type $iiiv) (param $0 i32) (param $1 i32) (param $2 i32)
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
 (func $~lib/internal/memory/memmove (; 4 ;) (type $iiiv) (param $0 i32) (param $1 i32) (param $2 i32)
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
 (func $~lib/memory/memory.copy (; 5 ;) (type $iiiv) (param $0 i32) (param $1 i32) (param $2 i32)
  ;;@ ~lib/memory.ts:20:4
  (call $~lib/internal/memory/memmove
   ;;@ ~lib/memory.ts:20:12
   (get_local $0)
   ;;@ ~lib/memory.ts:20:18
   (get_local $1)
   ;;@ ~lib/memory.ts:20:23
   (get_local $2)
  )
 )
 (func $~lib/internal/memory/memcmp (; 6 ;) (type $iiii) (param $0 i32) (param $1 i32) (param $2 i32) (result i32)
  (local $3 i32)
  ;;@ ~lib/internal/memory.ts:249:2
  (if
   ;;@ ~lib/internal/memory.ts:249:6
   (i32.eq
    (get_local $0)
    ;;@ ~lib/internal/memory.ts:249:12
    (get_local $1)
   )
   ;;@ ~lib/internal/memory.ts:249:23
   (return
    (i32.const 0)
   )
  )
  ;;@ ~lib/internal/memory.ts:250:2
  (block $break|0
   (loop $continue|0
    (if
     ;;@ ~lib/internal/memory.ts:250:9
     (if (result i32)
      (tee_local $3
       (i32.ne
        (get_local $2)
        ;;@ ~lib/internal/memory.ts:250:14
        (i32.const 0)
       )
      )
      ;;@ ~lib/internal/memory.ts:250:19
      (i32.eq
       (i32.load8_u
        ;;@ ~lib/internal/memory.ts:250:28
        (get_local $0)
       )
       ;;@ ~lib/internal/memory.ts:250:35
       (i32.load8_u
        ;;@ ~lib/internal/memory.ts:250:44
        (get_local $1)
       )
      )
      (get_local $3)
     )
     (block
      (block
       ;;@ ~lib/internal/memory.ts:251:4
       (set_local $2
        (i32.sub
         (get_local $2)
         (i32.const 1)
        )
       )
       ;;@ ~lib/internal/memory.ts:251:9
       (set_local $0
        (i32.add
         (get_local $0)
         (i32.const 1)
        )
       )
       ;;@ ~lib/internal/memory.ts:251:15
       (set_local $1
        (i32.add
         (get_local $1)
         (i32.const 1)
        )
       )
      )
      (br $continue|0)
     )
    )
   )
  )
  ;;@ ~lib/internal/memory.ts:253:53
  (if (result i32)
   ;;@ ~lib/internal/memory.ts:253:9
   (get_local $2)
   ;;@ ~lib/internal/memory.ts:253:13
   (i32.sub
    (i32.load8_u
     ;;@ ~lib/internal/memory.ts:253:27
     (get_local $0)
    )
    ;;@ ~lib/internal/memory.ts:253:33
    (i32.load8_u
     ;;@ ~lib/internal/memory.ts:253:47
     (get_local $1)
    )
   )
   ;;@ ~lib/internal/memory.ts:253:53
   (i32.const 0)
  )
 )
 (func $~lib/memory/memory.compare (; 7 ;) (type $iiii) (param $0 i32) (param $1 i32) (param $2 i32) (result i32)
  ;;@ ~lib/memory.ts:25:27
  (call $~lib/internal/memory/memcmp
   ;;@ ~lib/memory.ts:25:18
   (get_local $0)
   ;;@ ~lib/memory.ts:25:22
   (get_local $1)
   ;;@ ~lib/memory.ts:25:26
   (get_local $2)
  )
 )
 (func $~lib/allocator/arena/__memory_allocate (; 8 ;) (type $ii) (param $0 i32) (result i32)
  (local $1 i32)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  (local $6 i32)
  ;;@ ~lib/allocator/arena.ts:18:2
  (if
   ;;@ ~lib/allocator/arena.ts:18:6
   (i32.gt_u
    (get_local $0)
    ;;@ ~lib/allocator/arena.ts:18:13
    (get_global $~lib/internal/allocator/MAX_SIZE_32)
   )
   ;;@ ~lib/allocator/arena.ts:18:26
   (unreachable)
  )
  ;;@ ~lib/allocator/arena.ts:19:2
  (set_local $1
   ;;@ ~lib/allocator/arena.ts:19:12
   (get_global $~lib/allocator/arena/offset)
  )
  ;;@ ~lib/allocator/arena.ts:20:2
  (set_local $4
   ;;@ ~lib/allocator/arena.ts:20:15
   (i32.and
    (i32.add
     ;;@ ~lib/allocator/arena.ts:20:16
     (i32.add
      (get_local $1)
      ;;@ ~lib/allocator/arena.ts:20:22
      (select
       (tee_local $2
        ;;@ ~lib/allocator/arena.ts:20:33
        (get_local $0)
       )
       (tee_local $3
        ;;@ ~lib/allocator/arena.ts:20:39
        (i32.const 1)
       )
       (i32.gt_u
        (get_local $2)
        (get_local $3)
       )
      )
     )
     ;;@ ~lib/allocator/arena.ts:20:44
     (get_global $~lib/internal/allocator/AL_MASK)
    )
    ;;@ ~lib/allocator/arena.ts:20:55
    (i32.xor
     ;;@ ~lib/allocator/arena.ts:20:56
     (get_global $~lib/internal/allocator/AL_MASK)
     (i32.const -1)
    )
   )
  )
  ;;@ ~lib/allocator/arena.ts:21:2
  (set_local $5
   ;;@ ~lib/allocator/arena.ts:21:27
   (current_memory)
  )
  ;;@ ~lib/allocator/arena.ts:22:2
  (if
   ;;@ ~lib/allocator/arena.ts:22:6
   (i32.gt_u
    (get_local $4)
    ;;@ ~lib/allocator/arena.ts:22:15
    (i32.shl
     (get_local $5)
     ;;@ ~lib/allocator/arena.ts:22:37
     (i32.const 16)
    )
   )
   ;;@ ~lib/allocator/arena.ts:22:41
   (block
    ;;@ ~lib/allocator/arena.ts:23:4
    (set_local $2
     ;;@ ~lib/allocator/arena.ts:23:22
     (i32.shr_u
      (i32.and
       ;;@ ~lib/allocator/arena.ts:23:23
       (i32.add
        ;;@ ~lib/allocator/arena.ts:23:24
        (i32.sub
         (get_local $4)
         ;;@ ~lib/allocator/arena.ts:23:33
         (get_local $1)
        )
        ;;@ ~lib/allocator/arena.ts:23:39
        (i32.const 65535)
       )
       ;;@ ~lib/allocator/arena.ts:23:49
       (i32.xor
        ;;@ ~lib/allocator/arena.ts:23:50
        (i32.const 65535)
        (i32.const -1)
       )
      )
      ;;@ ~lib/allocator/arena.ts:23:62
      (i32.const 16)
     )
    )
    ;;@ ~lib/allocator/arena.ts:24:4
    (set_local $3
     ;;@ ~lib/allocator/arena.ts:24:22
     (select
      (tee_local $3
       ;;@ ~lib/allocator/arena.ts:24:26
       (get_local $5)
      )
      (tee_local $6
       ;;@ ~lib/allocator/arena.ts:24:39
       (get_local $2)
      )
      (i32.gt_s
       (get_local $3)
       (get_local $6)
      )
     )
    )
    ;;@ ~lib/allocator/arena.ts:25:4
    (if
     ;;@ ~lib/allocator/arena.ts:25:8
     (i32.lt_s
      ;;@ ~lib/allocator/arena.ts:25:15
      (grow_memory
       ;;@ ~lib/allocator/arena.ts:25:20
       (get_local $3)
      )
      ;;@ ~lib/allocator/arena.ts:25:35
      (i32.const 0)
     )
     ;;@ ~lib/allocator/arena.ts:25:38
     (if
      ;;@ ~lib/allocator/arena.ts:26:10
      (i32.lt_s
       ;;@ ~lib/allocator/arena.ts:26:17
       (grow_memory
        ;;@ ~lib/allocator/arena.ts:26:22
        (get_local $2)
       )
       ;;@ ~lib/allocator/arena.ts:26:37
       (i32.const 0)
      )
      ;;@ ~lib/allocator/arena.ts:26:40
      (unreachable)
     )
    )
   )
  )
  ;;@ ~lib/allocator/arena.ts:31:2
  (set_global $~lib/allocator/arena/offset
   ;;@ ~lib/allocator/arena.ts:31:11
   (get_local $4)
  )
  ;;@ ~lib/allocator/arena.ts:32:9
  (get_local $1)
 )
 (func $~lib/memory/memory.allocate (; 9 ;) (type $ii) (param $0 i32) (result i32)
  ;;@ ~lib/memory.ts:41:4
  (return
   ;;@ ~lib/memory.ts:41:45
   (call $~lib/allocator/arena/__memory_allocate
    ;;@ ~lib/memory.ts:41:63
    (get_local $0)
   )
  )
 )
 (func $~lib/allocator/arena/__memory_free (; 10 ;) (type $iv) (param $0 i32)
  (nop)
 )
 (func $~lib/memory/memory.free (; 11 ;) (type $iv) (param $0 i32)
  ;;@ ~lib/memory.ts:47:36
  (call $~lib/allocator/arena/__memory_free
   ;;@ ~lib/memory.ts:47:50
   (get_local $0)
  )
  ;;@ ~lib/memory.ts:47:56
  (return)
 )
 (func $~lib/allocator/arena/__memory_reset (; 12 ;) (type $v)
  ;;@ ~lib/allocator/arena.ts:38:2
  (set_global $~lib/allocator/arena/offset
   ;;@ ~lib/allocator/arena.ts:38:11
   (get_global $~lib/allocator/arena/startOffset)
  )
 )
 (func $~lib/memory/memory.reset (; 13 ;) (type $v)
  ;;@ ~lib/memory.ts:53:37
  (call $~lib/allocator/arena/__memory_reset)
  ;;@ ~lib/memory.ts:53:55
  (return)
 )
 (func $~lib/math/NativeMath.round (; 14 ;) (type $FF) (param $0 f64) (result f64)
  (local $1 i64)
  (local $2 i32)
  (local $3 f64)
  ;;@ ~lib/math.ts:1022:4
  (set_local $1
   ;;@ ~lib/math.ts:1022:13
   (i64.reinterpret/f64
    ;;@ ~lib/math.ts:1022:30
    (get_local $0)
   )
  )
  ;;@ ~lib/math.ts:1023:4
  (set_local $2
   ;;@ ~lib/math.ts:1023:12
   (i32.wrap/i64
    ;;@ ~lib/math.ts:1023:18
    (i64.and
     (i64.shr_u
      (get_local $1)
      ;;@ ~lib/math.ts:1023:24
      (i64.const 52)
     )
     ;;@ ~lib/math.ts:1023:29
     (i64.const 2047)
    )
   )
  )
  ;;@ ~lib/math.ts:1024:4
  (if
   ;;@ ~lib/math.ts:1024:8
   (i32.ge_s
    (get_local $2)
    ;;@ ~lib/math.ts:1024:13
    (i32.add
     (i32.const 1023)
     ;;@ ~lib/math.ts:1024:21
     (i32.const 52)
    )
   )
   ;;@ ~lib/math.ts:1024:32
   (return
    (get_local $0)
   )
  )
  ;;@ ~lib/math.ts:1025:4
  (if
   ;;@ ~lib/math.ts:1025:8
   (i32.lt_s
    (get_local $2)
    ;;@ ~lib/math.ts:1025:12
    (i32.sub
     (i32.const 1023)
     ;;@ ~lib/math.ts:1025:20
     (i32.const 1)
    )
   )
   ;;@ ~lib/math.ts:1025:34
   (return
    ;;@ ~lib/math.ts:1025:30
    (f64.mul
     (f64.const 0)
     ;;@ ~lib/math.ts:1025:34
     (get_local $0)
    )
   )
  )
  ;;@ ~lib/math.ts:1027:4
  (if
   (i64.ne
    ;;@ ~lib/math.ts:1027:8
    (i64.shr_u
     (get_local $1)
     ;;@ ~lib/math.ts:1027:14
     (i64.const 63)
    )
    (i64.const 0)
   )
   ;;@ ~lib/math.ts:1027:18
   (block
    ;;@ ~lib/math.ts:1030:6
    (set_local $3
     ;;@ ~lib/math.ts:1030:10
     (f64.add
      (f64.sub
       (f64.sub
        (f64.const 4503599627370496)
        ;;@ ~lib/math.ts:1030:18
        (get_local $0)
       )
       ;;@ ~lib/math.ts:1030:22
       (f64.const 4503599627370496)
      )
      ;;@ ~lib/math.ts:1030:30
      (get_local $0)
     )
    )
    ;;@ ~lib/math.ts:1031:6
    (if
     ;;@ ~lib/math.ts:1031:10
     (f64.ge
      (get_local $3)
      ;;@ ~lib/math.ts:1031:15
      (f64.const 0.5)
     )
     ;;@ ~lib/math.ts:1031:20
     (set_local $3
      ;;@ ~lib/math.ts:1031:24
      (f64.add
       (f64.sub
        (get_local $0)
        ;;@ ~lib/math.ts:1031:28
        (get_local $3)
       )
       ;;@ ~lib/math.ts:1031:32
       (f64.const 1)
      )
     )
     ;;@ ~lib/math.ts:1032:11
     (if
      ;;@ ~lib/math.ts:1032:15
      (f64.lt
       (get_local $3)
       ;;@ ~lib/math.ts:1032:19
       (f64.const -0.5)
      )
      ;;@ ~lib/math.ts:1032:25
      (set_local $3
       ;;@ ~lib/math.ts:1032:29
       (f64.sub
        (f64.sub
         (get_local $0)
         ;;@ ~lib/math.ts:1032:33
         (get_local $3)
        )
        ;;@ ~lib/math.ts:1032:37
        (f64.const 1)
       )
      )
      ;;@ ~lib/math.ts:1033:11
      (set_local $3
       ;;@ ~lib/math.ts:1033:15
       (f64.sub
        (get_local $0)
        ;;@ ~lib/math.ts:1033:19
        (get_local $3)
       )
      )
     )
    )
   )
   ;;@ ~lib/math.ts:1034:11
   (block
    ;;@ ~lib/math.ts:1035:6
    (set_local $3
     ;;@ ~lib/math.ts:1035:10
     (f64.sub
      (f64.sub
       (f64.add
        (get_local $0)
        ;;@ ~lib/math.ts:1035:14
        (f64.const 4503599627370496)
       )
       ;;@ ~lib/math.ts:1035:22
       (f64.const 4503599627370496)
      )
      ;;@ ~lib/math.ts:1035:30
      (get_local $0)
     )
    )
    ;;@ ~lib/math.ts:1036:6
    (if
     ;;@ ~lib/math.ts:1036:10
     (f64.gt
      (get_local $3)
      ;;@ ~lib/math.ts:1036:14
      (f64.const 0.5)
     )
     ;;@ ~lib/math.ts:1036:19
     (set_local $3
      ;;@ ~lib/math.ts:1036:23
      (f64.sub
       (f64.add
        (get_local $3)
        ;;@ ~lib/math.ts:1036:27
        (get_local $0)
       )
       ;;@ ~lib/math.ts:1036:31
       (f64.const 1)
      )
     )
     ;;@ ~lib/math.ts:1037:11
     (if
      ;;@ ~lib/math.ts:1037:15
      (f64.le
       (get_local $3)
       ;;@ ~lib/math.ts:1037:20
       (f64.const -0.5)
      )
      ;;@ ~lib/math.ts:1037:26
      (set_local $3
       ;;@ ~lib/math.ts:1037:30
       (f64.add
        (f64.add
         (get_local $3)
         ;;@ ~lib/math.ts:1037:34
         (get_local $0)
        )
        ;;@ ~lib/math.ts:1037:38
        (f64.const 1)
       )
      )
      ;;@ ~lib/math.ts:1038:11
      (set_local $3
       ;;@ ~lib/math.ts:1038:15
       (f64.add
        (get_local $3)
        ;;@ ~lib/math.ts:1038:19
        (get_local $0)
       )
      )
     )
    )
   )
  )
  ;;@ ~lib/math.ts:1040:11
  (get_local $3)
 )
 (func $~lib/math/NativeMathf.scalbn (; 15 ;) (type $fif) (param $0 f32) (param $1 i32) (result f32)
  (local $2 f32)
  ;;@ ~lib/math.ts:2170:4
  (set_local $2
   ;;@ ~lib/math.ts:2170:12
   (get_local $0)
  )
  ;;@ ~lib/math.ts:2171:4
  (if
   ;;@ ~lib/math.ts:2171:8
   (i32.gt_s
    (get_local $1)
    ;;@ ~lib/math.ts:2171:12
    (i32.const 127)
   )
   ;;@ ~lib/math.ts:2171:17
   (block
    ;;@ ~lib/math.ts:2172:6
    (set_local $2
     (f32.mul
      (get_local $2)
      ;;@ ~lib/math.ts:2172:11
      (f32.const 1701411834604692317316873e14)
     )
    )
    ;;@ ~lib/math.ts:2173:6
    (set_local $1
     (i32.sub
      (get_local $1)
      ;;@ ~lib/math.ts:2173:11
      (i32.const 127)
     )
    )
    ;;@ ~lib/math.ts:2174:6
    (if
     ;;@ ~lib/math.ts:2174:10
     (i32.gt_s
      (get_local $1)
      ;;@ ~lib/math.ts:2174:14
      (i32.const 127)
     )
     ;;@ ~lib/math.ts:2174:19
     (block
      ;;@ ~lib/math.ts:2175:8
      (set_local $2
       (f32.mul
        (get_local $2)
        ;;@ ~lib/math.ts:2175:13
        (f32.const 1701411834604692317316873e14)
       )
      )
      ;;@ ~lib/math.ts:2176:8
      (set_local $1
       (i32.sub
        (get_local $1)
        ;;@ ~lib/math.ts:2176:13
        (i32.const 127)
       )
      )
      ;;@ ~lib/math.ts:2177:8
      (if
       ;;@ ~lib/math.ts:2177:12
       (i32.gt_s
        (get_local $1)
        ;;@ ~lib/math.ts:2177:16
        (i32.const 127)
       )
       ;;@ ~lib/math.ts:2177:21
       (set_local $1
        ;;@ ~lib/math.ts:2177:25
        (i32.const 127)
       )
      )
     )
    )
   )
   ;;@ ~lib/math.ts:2179:11
   (if
    ;;@ ~lib/math.ts:2179:15
    (i32.lt_s
     (get_local $1)
     ;;@ ~lib/math.ts:2179:19
     (i32.const -126)
    )
    ;;@ ~lib/math.ts:2179:25
    (block
     ;;@ ~lib/math.ts:2180:6
     (set_local $2
      (f32.mul
       (get_local $2)
       ;;@ ~lib/math.ts:2180:11
       (f32.const 1.1754943508222875e-38)
      )
     )
     ;;@ ~lib/math.ts:2181:6
     (set_local $1
      (i32.add
       (get_local $1)
       ;;@ ~lib/math.ts:2181:11
       (i32.const 126)
      )
     )
     ;;@ ~lib/math.ts:2182:6
     (if
      ;;@ ~lib/math.ts:2182:10
      (i32.lt_s
       (get_local $1)
       ;;@ ~lib/math.ts:2182:14
       (i32.const -126)
      )
      ;;@ ~lib/math.ts:2182:20
      (block
       ;;@ ~lib/math.ts:2183:8
       (set_local $2
        (f32.mul
         (get_local $2)
         ;;@ ~lib/math.ts:2183:13
         (f32.const 1.1754943508222875e-38)
        )
       )
       ;;@ ~lib/math.ts:2184:8
       (set_local $1
        (i32.add
         (get_local $1)
         ;;@ ~lib/math.ts:2184:13
         (i32.const 126)
        )
       )
       ;;@ ~lib/math.ts:2185:8
       (if
        ;;@ ~lib/math.ts:2185:12
        (i32.lt_s
         (get_local $1)
         ;;@ ~lib/math.ts:2185:16
         (i32.const -126)
        )
        ;;@ ~lib/math.ts:2185:22
        (set_local $1
         ;;@ ~lib/math.ts:2185:26
         (i32.const -126)
        )
       )
      )
     )
    )
   )
  )
  ;;@ ~lib/math.ts:2188:53
  (f32.mul
   ;;@ ~lib/math.ts:2188:11
   (get_local $2)
   ;;@ ~lib/math.ts:2188:15
   (f32.reinterpret/i32
    ;;@ ~lib/math.ts:2188:32
    (i32.shl
     (i32.add
      ;;@ ~lib/math.ts:2188:38
      (i32.const 127)
      ;;@ ~lib/math.ts:2188:45
      (get_local $1)
     )
     ;;@ ~lib/math.ts:2188:51
     (i32.const 23)
    )
   )
  )
 )
 (func $~lib/math/NativeMathf.pow (; 16 ;) (type $fff) (param $0 f32) (param $1 f32) (result f32)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  (local $6 i32)
  (local $7 i32)
  (local $8 i32)
  (local $9 i32)
  (local $10 f32)
  (local $11 f32)
  (local $12 f32)
  (local $13 f32)
  (local $14 f32)
  (local $15 f32)
  (local $16 f32)
  (local $17 f32)
  (local $18 f32)
  (local $19 f32)
  (local $20 f32)
  (local $21 f32)
  (local $22 f32)
  (local $23 i32)
  (local $24 i32)
  (local $25 f32)
  (local $26 f32)
  (local $27 f32)
  (local $28 f32)
  (local $29 f32)
  (local $30 f32)
  (local $31 f32)
  (local $32 f32)
  (local $33 f32)
  (local $34 f32)
  (local $35 f32)
  (local $36 i32)
  ;;@ ~lib/math.ts:1911:4
  (set_local $2
   ;;@ ~lib/math.ts:1911:13
   (i32.reinterpret/f32
    ;;@ ~lib/math.ts:1911:30
    (get_local $0)
   )
  )
  ;;@ ~lib/math.ts:1912:4
  (set_local $3
   ;;@ ~lib/math.ts:1912:13
   (i32.reinterpret/f32
    ;;@ ~lib/math.ts:1912:30
    (get_local $1)
   )
  )
  ;;@ ~lib/math.ts:1913:4
  (set_local $4
   ;;@ ~lib/math.ts:1913:13
   (i32.and
    (get_local $2)
    ;;@ ~lib/math.ts:1913:18
    (i32.const 2147483647)
   )
  )
  ;;@ ~lib/math.ts:1914:4
  (set_local $5
   ;;@ ~lib/math.ts:1914:13
   (i32.and
    (get_local $3)
    ;;@ ~lib/math.ts:1914:18
    (i32.const 2147483647)
   )
  )
  ;;@ ~lib/math.ts:1915:4
  (if
   ;;@ ~lib/math.ts:1915:8
   (i32.eq
    (get_local $5)
    ;;@ ~lib/math.ts:1915:14
    (i32.const 0)
   )
   ;;@ ~lib/math.ts:1915:24
   (return
    (f32.const 1)
   )
  )
  ;;@ ~lib/math.ts:1917:4
  (if
   ;;@ ~lib/math.ts:1917:8
   (if (result i32)
    (tee_local $6
     (i32.gt_s
      (get_local $4)
      ;;@ ~lib/math.ts:1917:13
      (i32.const 2139095040)
     )
    )
    (get_local $6)
    ;;@ ~lib/math.ts:1917:27
    (i32.gt_s
     (get_local $5)
     ;;@ ~lib/math.ts:1917:32
     (i32.const 2139095040)
    )
   )
   ;;@ ~lib/math.ts:1917:55
   (return
    ;;@ ~lib/math.ts:1917:51
    (f32.add
     (get_local $0)
     ;;@ ~lib/math.ts:1917:55
     (get_local $1)
    )
   )
  )
  ;;@ ~lib/math.ts:1918:4
  (set_local $7
   ;;@ ~lib/math.ts:1918:18
   (i32.const 0)
  )
  ;;@ ~lib/math.ts:1919:4
  (if
   ;;@ ~lib/math.ts:1919:8
   (i32.lt_s
    (get_local $2)
    ;;@ ~lib/math.ts:1919:13
    (i32.const 0)
   )
   ;;@ ~lib/math.ts:1919:16
   (if
    ;;@ ~lib/math.ts:1920:10
    (i32.ge_s
     (get_local $5)
     ;;@ ~lib/math.ts:1920:16
     (i32.const 1266679808)
    )
    ;;@ ~lib/math.ts:1920:28
    (set_local $7
     ;;@ ~lib/math.ts:1920:37
     (i32.const 2)
    )
    ;;@ ~lib/math.ts:1921:11
    (if
     ;;@ ~lib/math.ts:1921:15
     (i32.ge_s
      (get_local $5)
      ;;@ ~lib/math.ts:1921:21
      (i32.const 1065353216)
     )
     ;;@ ~lib/math.ts:1921:33
     (block
      ;;@ ~lib/math.ts:1922:8
      (set_local $9
       ;;@ ~lib/math.ts:1922:12
       (i32.sub
        (i32.shr_s
         ;;@ ~lib/math.ts:1922:13
         (get_local $5)
         ;;@ ~lib/math.ts:1922:19
         (i32.const 23)
        )
        ;;@ ~lib/math.ts:1922:25
        (i32.const 127)
       )
      )
      ;;@ ~lib/math.ts:1923:8
      (set_local $8
       ;;@ ~lib/math.ts:1923:12
       (i32.shr_s
        (get_local $5)
        ;;@ ~lib/math.ts:1923:18
        (i32.sub
         ;;@ ~lib/math.ts:1923:19
         (i32.const 23)
         ;;@ ~lib/math.ts:1923:24
         (get_local $9)
        )
       )
      )
      ;;@ ~lib/math.ts:1924:8
      (if
       ;;@ ~lib/math.ts:1924:12
       (i32.eq
        (i32.shl
         ;;@ ~lib/math.ts:1924:13
         (get_local $8)
         ;;@ ~lib/math.ts:1924:18
         (i32.sub
          ;;@ ~lib/math.ts:1924:19
          (i32.const 23)
          ;;@ ~lib/math.ts:1924:24
          (get_local $9)
         )
        )
        ;;@ ~lib/math.ts:1924:31
        (get_local $5)
       )
       ;;@ ~lib/math.ts:1924:35
       (set_local $7
        ;;@ ~lib/math.ts:1924:44
        (i32.sub
         (i32.const 2)
         ;;@ ~lib/math.ts:1924:48
         (i32.and
          ;;@ ~lib/math.ts:1924:49
          (get_local $8)
          ;;@ ~lib/math.ts:1924:53
          (i32.const 1)
         )
        )
       )
      )
     )
    )
   )
  )
  ;;@ ~lib/math.ts:1927:4
  (if
   ;;@ ~lib/math.ts:1927:8
   (i32.eq
    (get_local $5)
    ;;@ ~lib/math.ts:1927:14
    (i32.const 2139095040)
   )
   ;;@ ~lib/math.ts:1927:26
   (block
    ;;@ ~lib/math.ts:1928:6
    (if
     ;;@ ~lib/math.ts:1928:10
     (i32.eq
      (get_local $4)
      ;;@ ~lib/math.ts:1928:16
      (i32.const 1065353216)
     )
     ;;@ ~lib/math.ts:1928:35
     (return
      (f32.const nan:0x400000)
     )
     ;;@ ~lib/math.ts:1929:11
     (if
      ;;@ ~lib/math.ts:1929:15
      (i32.gt_s
       (get_local $4)
       ;;@ ~lib/math.ts:1929:20
       (i32.const 1065353216)
      )
      ;;@ ~lib/math.ts:1929:53
      (return
       ;;@ ~lib/math.ts:1929:39
       (if (result f32)
        (i32.ge_s
         (get_local $3)
         ;;@ ~lib/math.ts:1929:45
         (i32.const 0)
        )
        ;;@ ~lib/math.ts:1929:49
        (get_local $1)
        ;;@ ~lib/math.ts:1929:53
        (f32.const 0)
       )
      )
      ;;@ ~lib/math.ts:1930:35
      (return
       ;;@ ~lib/math.ts:1930:18
       (if (result f32)
        (i32.ge_s
         (get_local $3)
         ;;@ ~lib/math.ts:1930:24
         (i32.const 0)
        )
        ;;@ ~lib/math.ts:1930:28
        (f32.const 0)
        ;;@ ~lib/math.ts:1930:34
        (f32.neg
         ;;@ ~lib/math.ts:1930:35
         (get_local $1)
        )
       )
      )
     )
    )
    (unreachable)
   )
  )
  ;;@ ~lib/math.ts:1932:4
  (if
   ;;@ ~lib/math.ts:1932:8
   (i32.eq
    (get_local $5)
    ;;@ ~lib/math.ts:1932:14
    (i32.const 1065353216)
   )
   ;;@ ~lib/math.ts:1932:53
   (return
    ;;@ ~lib/math.ts:1932:33
    (if (result f32)
     (i32.ge_s
      (get_local $3)
      ;;@ ~lib/math.ts:1932:39
      (i32.const 0)
     )
     ;;@ ~lib/math.ts:1932:43
     (get_local $0)
     ;;@ ~lib/math.ts:1932:47
     (f32.div
      (f32.const 1)
      ;;@ ~lib/math.ts:1932:53
      (get_local $0)
     )
    )
   )
  )
  ;;@ ~lib/math.ts:1933:4
  (if
   ;;@ ~lib/math.ts:1933:8
   (i32.eq
    (get_local $3)
    ;;@ ~lib/math.ts:1933:14
    (i32.const 1073741824)
   )
   ;;@ ~lib/math.ts:1933:37
   (return
    ;;@ ~lib/math.ts:1933:33
    (f32.mul
     (get_local $0)
     ;;@ ~lib/math.ts:1933:37
     (get_local $0)
    )
   )
  )
  ;;@ ~lib/math.ts:1934:4
  (if
   ;;@ ~lib/math.ts:1934:8
   (i32.eq
    (get_local $3)
    ;;@ ~lib/math.ts:1934:14
    (i32.const 1056964608)
   )
   ;;@ ~lib/math.ts:1934:26
   (if
    ;;@ ~lib/math.ts:1935:10
    (i32.ge_s
     (get_local $2)
     ;;@ ~lib/math.ts:1935:16
     (i32.const 0)
    )
    ;;@ ~lib/math.ts:1935:45
    (return
     ;;@ ~lib/math.ts:1935:26
     (f32.sqrt
      ;;@ ~lib/math.ts:1935:44
      (get_local $0)
     )
    )
   )
  )
  ;;@ ~lib/math.ts:1937:4
  (set_local $10
   ;;@ ~lib/math.ts:1937:13
   (f32.abs
    ;;@ ~lib/math.ts:1937:30
    (get_local $0)
   )
  )
  ;;@ ~lib/math.ts:1939:4
  (if
   ;;@ ~lib/math.ts:1939:8
   (if (result i32)
    (tee_local $6
     (if (result i32)
      (tee_local $6
       (i32.eq
        (get_local $4)
        ;;@ ~lib/math.ts:1939:14
        (i32.const 2139095040)
       )
      )
      (get_local $6)
      ;;@ ~lib/math.ts:1939:28
      (i32.eq
       (get_local $4)
       ;;@ ~lib/math.ts:1939:34
       (i32.const 0)
      )
     )
    )
    (get_local $6)
    ;;@ ~lib/math.ts:1939:39
    (i32.eq
     (get_local $4)
     ;;@ ~lib/math.ts:1939:45
     (i32.const 1065353216)
    )
   )
   ;;@ ~lib/math.ts:1939:57
   (block
    ;;@ ~lib/math.ts:1940:6
    (set_local $11
     ;;@ ~lib/math.ts:1940:10
     (get_local $10)
    )
    ;;@ ~lib/math.ts:1941:6
    (if
     ;;@ ~lib/math.ts:1941:10
     (i32.lt_s
      (get_local $3)
      ;;@ ~lib/math.ts:1941:15
      (i32.const 0)
     )
     ;;@ ~lib/math.ts:1941:18
     (set_local $11
      ;;@ ~lib/math.ts:1941:22
      (f32.div
       (f32.const 1)
       ;;@ ~lib/math.ts:1941:28
       (get_local $11)
      )
     )
    )
    ;;@ ~lib/math.ts:1942:6
    (if
     ;;@ ~lib/math.ts:1942:10
     (i32.lt_s
      (get_local $2)
      ;;@ ~lib/math.ts:1942:15
      (i32.const 0)
     )
     ;;@ ~lib/math.ts:1942:18
     (if
      ;;@ ~lib/math.ts:1943:12
      (i32.eq
       (i32.or
        ;;@ ~lib/math.ts:1943:13
        (i32.sub
         ;;@ ~lib/math.ts:1943:14
         (get_local $4)
         ;;@ ~lib/math.ts:1943:19
         (i32.const 1065353216)
        )
        ;;@ ~lib/math.ts:1943:33
        (get_local $7)
       )
       ;;@ ~lib/math.ts:1943:44
       (i32.const 0)
      )
      ;;@ ~lib/math.ts:1943:47
      (set_local $11
       ;;@ ~lib/math.ts:1943:51
       (f32.div
        (f32.sub
         ;;@ ~lib/math.ts:1943:52
         (get_local $11)
         ;;@ ~lib/math.ts:1943:56
         (get_local $11)
        )
        ;;@ ~lib/math.ts:1943:61
        (f32.sub
         ;;@ ~lib/math.ts:1943:62
         (get_local $11)
         ;;@ ~lib/math.ts:1943:66
         (get_local $11)
        )
       )
      )
      ;;@ ~lib/math.ts:1944:13
      (if
       ;;@ ~lib/math.ts:1944:17
       (i32.eq
        (get_local $7)
        ;;@ ~lib/math.ts:1944:27
        (i32.const 1)
       )
       ;;@ ~lib/math.ts:1944:30
       (set_local $11
        ;;@ ~lib/math.ts:1944:34
        (f32.neg
         ;;@ ~lib/math.ts:1944:35
         (get_local $11)
        )
       )
      )
     )
    )
    ;;@ ~lib/math.ts:1946:13
    (return
     (get_local $11)
    )
   )
  )
  ;;@ ~lib/math.ts:1948:4
  (set_local $12
   ;;@ ~lib/math.ts:1948:13
   (f32.const 1)
  )
  ;;@ ~lib/math.ts:1949:4
  (if
   ;;@ ~lib/math.ts:1949:8
   (i32.lt_s
    (get_local $2)
    ;;@ ~lib/math.ts:1949:13
    (i32.const 0)
   )
   ;;@ ~lib/math.ts:1949:16
   (block
    ;;@ ~lib/math.ts:1950:6
    (if
     ;;@ ~lib/math.ts:1950:10
     (i32.eq
      (get_local $7)
      ;;@ ~lib/math.ts:1950:20
      (i32.const 0)
     )
     ;;@ ~lib/math.ts:1950:46
     (return
      ;;@ ~lib/math.ts:1950:30
      (f32.div
       (f32.sub
        ;;@ ~lib/math.ts:1950:31
        (get_local $0)
        ;;@ ~lib/math.ts:1950:35
        (get_local $0)
       )
       ;;@ ~lib/math.ts:1950:40
       (f32.sub
        ;;@ ~lib/math.ts:1950:41
        (get_local $0)
        ;;@ ~lib/math.ts:1950:45
        (get_local $0)
       )
      )
     )
    )
    ;;@ ~lib/math.ts:1951:6
    (if
     ;;@ ~lib/math.ts:1951:10
     (i32.eq
      (get_local $7)
      ;;@ ~lib/math.ts:1951:20
      (i32.const 1)
     )
     ;;@ ~lib/math.ts:1951:23
     (set_local $12
      ;;@ ~lib/math.ts:1951:28
      (f32.const -1)
     )
    )
   )
  )
  ;;@ ~lib/math.ts:1955:4
  (if
   ;;@ ~lib/math.ts:1955:8
   (i32.gt_s
    (get_local $5)
    ;;@ ~lib/math.ts:1955:13
    (i32.const 1291845632)
   )
   ;;@ ~lib/math.ts:1955:25
   (block
    ;;@ ~lib/math.ts:1956:6
    (if
     ;;@ ~lib/math.ts:1956:10
     (i32.lt_s
      (get_local $4)
      ;;@ ~lib/math.ts:1956:15
      (i32.const 1065353208)
     )
     ;;@ ~lib/math.ts:1956:74
     (return
      ;;@ ~lib/math.ts:1956:34
      (if (result f32)
       (i32.lt_s
        (get_local $3)
        ;;@ ~lib/math.ts:1956:39
        (i32.const 0)
       )
       ;;@ ~lib/math.ts:1956:43
       (f32.mul
        (f32.mul
         (get_local $12)
         ;;@ ~lib/math.ts:1956:48
         (f32.const 1000000015047466219876688e6)
        )
        ;;@ ~lib/math.ts:1956:55
        (f32.const 1000000015047466219876688e6)
       )
       ;;@ ~lib/math.ts:1956:62
       (f32.mul
        (f32.mul
         (get_local $12)
         ;;@ ~lib/math.ts:1956:67
         (f32.const 1.0000000031710769e-30)
        )
        ;;@ ~lib/math.ts:1956:74
        (f32.const 1.0000000031710769e-30)
       )
      )
     )
    )
    ;;@ ~lib/math.ts:1957:6
    (if
     ;;@ ~lib/math.ts:1957:10
     (i32.gt_s
      (get_local $4)
      ;;@ ~lib/math.ts:1957:15
      (i32.const 1065353223)
     )
     ;;@ ~lib/math.ts:1957:74
     (return
      ;;@ ~lib/math.ts:1957:34
      (if (result f32)
       (i32.gt_s
        (get_local $3)
        ;;@ ~lib/math.ts:1957:39
        (i32.const 0)
       )
       ;;@ ~lib/math.ts:1957:43
       (f32.mul
        (f32.mul
         (get_local $12)
         ;;@ ~lib/math.ts:1957:48
         (f32.const 1000000015047466219876688e6)
        )
        ;;@ ~lib/math.ts:1957:55
        (f32.const 1000000015047466219876688e6)
       )
       ;;@ ~lib/math.ts:1957:62
       (f32.mul
        (f32.mul
         (get_local $12)
         ;;@ ~lib/math.ts:1957:67
         (f32.const 1.0000000031710769e-30)
        )
        ;;@ ~lib/math.ts:1957:74
        (f32.const 1.0000000031710769e-30)
       )
      )
     )
    )
    ;;@ ~lib/math.ts:1958:6
    (set_local $17
     ;;@ ~lib/math.ts:1958:10
     (f32.sub
      (get_local $10)
      ;;@ ~lib/math.ts:1958:15
      (f32.const 1)
     )
    )
    ;;@ ~lib/math.ts:1959:6
    (set_local $20
     ;;@ ~lib/math.ts:1959:10
     (f32.mul
      (f32.mul
       ;;@ ~lib/math.ts:1959:11
       (get_local $17)
       ;;@ ~lib/math.ts:1959:15
       (get_local $17)
      )
      ;;@ ~lib/math.ts:1959:20
      (f32.sub
       ;;@ ~lib/math.ts:1959:21
       (f32.const 0.5)
       ;;@ ~lib/math.ts:1959:27
       (f32.mul
        (get_local $17)
        ;;@ ~lib/math.ts:1959:31
        (f32.sub
         ;;@ ~lib/math.ts:1959:32
         (f32.const 0.3333333432674408)
         ;;@ ~lib/math.ts:1959:49
         (f32.mul
          (get_local $17)
          ;;@ ~lib/math.ts:1959:53
          (f32.const 0.25)
         )
        )
       )
      )
     )
    )
    ;;@ ~lib/math.ts:1960:6
    (set_local $18
     ;;@ ~lib/math.ts:1960:10
     (f32.mul
      (f32.const 1.44268798828125)
      ;;@ ~lib/math.ts:1960:20
      (get_local $17)
     )
    )
    ;;@ ~lib/math.ts:1961:6
    (set_local $19
     ;;@ ~lib/math.ts:1961:10
     (f32.sub
      (f32.mul
       (get_local $17)
       ;;@ ~lib/math.ts:1961:14
       (f32.const 7.052607543300837e-06)
      )
      ;;@ ~lib/math.ts:1961:24
      (f32.mul
       (get_local $20)
       ;;@ ~lib/math.ts:1961:28
       (f32.const 1.4426950216293335)
      )
     )
    )
    ;;@ ~lib/math.ts:1962:6
    (set_local $13
     ;;@ ~lib/math.ts:1962:11
     (f32.add
      (get_local $18)
      ;;@ ~lib/math.ts:1962:15
      (get_local $19)
     )
    )
    ;;@ ~lib/math.ts:1963:6
    (set_local $24
     ;;@ ~lib/math.ts:1963:11
     (i32.reinterpret/f32
      ;;@ ~lib/math.ts:1963:28
      (get_local $13)
     )
    )
    ;;@ ~lib/math.ts:1964:6
    (set_local $13
     ;;@ ~lib/math.ts:1964:11
     (f32.reinterpret/i32
      ;;@ ~lib/math.ts:1964:28
      (i32.and
       (get_local $24)
       ;;@ ~lib/math.ts:1964:33
       (i32.const -4096)
      )
     )
    )
    ;;@ ~lib/math.ts:1965:6
    (set_local $14
     ;;@ ~lib/math.ts:1965:11
     (f32.sub
      (get_local $19)
      ;;@ ~lib/math.ts:1965:15
      (f32.sub
       ;;@ ~lib/math.ts:1965:16
       (get_local $13)
       ;;@ ~lib/math.ts:1965:21
       (get_local $18)
      )
     )
    )
   )
   ;;@ ~lib/math.ts:1966:11
   (block
    ;;@ ~lib/math.ts:1968:6
    (set_local $23
     ;;@ ~lib/math.ts:1968:10
     (i32.const 0)
    )
    ;;@ ~lib/math.ts:1969:6
    (if
     ;;@ ~lib/math.ts:1969:10
     (i32.lt_s
      (get_local $4)
      ;;@ ~lib/math.ts:1969:15
      (i32.const 8388608)
     )
     ;;@ ~lib/math.ts:1969:27
     (block
      ;;@ ~lib/math.ts:1970:8
      (set_local $10
       (f32.mul
        (get_local $10)
        ;;@ ~lib/math.ts:1970:14
        (f32.const 16777216)
       )
      )
      ;;@ ~lib/math.ts:1971:8
      (set_local $23
       (i32.sub
        (get_local $23)
        ;;@ ~lib/math.ts:1971:13
        (i32.const 24)
       )
      )
      ;;@ ~lib/math.ts:1972:8
      (set_local $4
       ;;@ ~lib/math.ts:1972:13
       (i32.reinterpret/f32
        ;;@ ~lib/math.ts:1972:30
        (get_local $10)
       )
      )
     )
    )
    ;;@ ~lib/math.ts:1974:6
    (set_local $23
     (i32.add
      (get_local $23)
      ;;@ ~lib/math.ts:1974:11
      (i32.sub
       (i32.shr_s
        ;;@ ~lib/math.ts:1974:12
        (get_local $4)
        ;;@ ~lib/math.ts:1974:18
        (i32.const 23)
       )
       ;;@ ~lib/math.ts:1974:24
       (i32.const 127)
      )
     )
    )
    ;;@ ~lib/math.ts:1975:6
    (set_local $8
     ;;@ ~lib/math.ts:1975:10
     (i32.and
      (get_local $4)
      ;;@ ~lib/math.ts:1975:15
      (i32.const 8388607)
     )
    )
    ;;@ ~lib/math.ts:1976:6
    (set_local $4
     ;;@ ~lib/math.ts:1976:11
     (i32.or
      (get_local $8)
      ;;@ ~lib/math.ts:1976:15
      (i32.const 1065353216)
     )
    )
    ;;@ ~lib/math.ts:1977:6
    (if
     ;;@ ~lib/math.ts:1977:10
     (i32.le_s
      (get_local $8)
      ;;@ ~lib/math.ts:1977:15
      (i32.const 1885297)
     )
     ;;@ ~lib/math.ts:1977:25
     (set_local $9
      ;;@ ~lib/math.ts:1977:29
      (i32.const 0)
     )
     ;;@ ~lib/math.ts:1978:11
     (if
      ;;@ ~lib/math.ts:1978:15
      (i32.lt_s
       (get_local $8)
       ;;@ ~lib/math.ts:1978:19
       (i32.const 6140887)
      )
      ;;@ ~lib/math.ts:1978:29
      (set_local $9
       ;;@ ~lib/math.ts:1978:33
       (i32.const 1)
      )
      ;;@ ~lib/math.ts:1979:11
      (block
       ;;@ ~lib/math.ts:1980:8
       (set_local $9
        ;;@ ~lib/math.ts:1980:12
        (i32.const 0)
       )
       ;;@ ~lib/math.ts:1981:8
       (set_local $23
        (i32.add
         (get_local $23)
         ;;@ ~lib/math.ts:1981:13
         (i32.const 1)
        )
       )
       ;;@ ~lib/math.ts:1982:8
       (set_local $4
        (i32.sub
         (get_local $4)
         ;;@ ~lib/math.ts:1982:14
         (i32.const 8388608)
        )
       )
      )
     )
    )
    ;;@ ~lib/math.ts:1984:6
    (set_local $10
     ;;@ ~lib/math.ts:1984:11
     (f32.reinterpret/i32
      ;;@ ~lib/math.ts:1984:28
      (get_local $4)
     )
    )
    ;;@ ~lib/math.ts:1985:6
    (set_local $30
     ;;@ ~lib/math.ts:1985:15
     (select
      ;;@ ~lib/math.ts:1985:27
      (f32.const 1.5)
      ;;@ ~lib/math.ts:1985:32
      (f32.const 1)
      ;;@ ~lib/math.ts:1985:37
      (get_local $9)
     )
    )
    ;;@ ~lib/math.ts:1986:6
    (set_local $18
     ;;@ ~lib/math.ts:1986:10
     (f32.sub
      (get_local $10)
      ;;@ ~lib/math.ts:1986:15
      (get_local $30)
     )
    )
    ;;@ ~lib/math.ts:1987:6
    (set_local $19
     ;;@ ~lib/math.ts:1987:10
     (f32.div
      (f32.const 1)
      ;;@ ~lib/math.ts:1987:16
      (f32.add
       ;;@ ~lib/math.ts:1987:17
       (get_local $10)
       ;;@ ~lib/math.ts:1987:22
       (get_local $30)
      )
     )
    )
    ;;@ ~lib/math.ts:1988:6
    (set_local $16
     ;;@ ~lib/math.ts:1988:10
     (f32.mul
      (get_local $18)
      ;;@ ~lib/math.ts:1988:14
      (get_local $19)
     )
    )
    ;;@ ~lib/math.ts:1989:6
    (set_local $26
     ;;@ ~lib/math.ts:1989:12
     (get_local $16)
    )
    ;;@ ~lib/math.ts:1990:6
    (set_local $24
     ;;@ ~lib/math.ts:1990:11
     (i32.reinterpret/f32
      ;;@ ~lib/math.ts:1990:28
      (get_local $26)
     )
    )
    ;;@ ~lib/math.ts:1991:6
    (set_local $26
     ;;@ ~lib/math.ts:1991:12
     (f32.reinterpret/i32
      ;;@ ~lib/math.ts:1991:29
      (i32.and
       (get_local $24)
       ;;@ ~lib/math.ts:1991:34
       (i32.const -4096)
      )
     )
    )
    ;;@ ~lib/math.ts:1992:6
    (set_local $24
     ;;@ ~lib/math.ts:1992:11
     (i32.or
      (i32.and
       ;;@ ~lib/math.ts:1992:12
       (i32.shr_s
        ;;@ ~lib/math.ts:1992:13
        (get_local $4)
        ;;@ ~lib/math.ts:1992:19
        (i32.const 1)
       )
       ;;@ ~lib/math.ts:1992:24
       (i32.const -4096)
      )
      ;;@ ~lib/math.ts:1992:38
      (i32.const 536870912)
     )
    )
    ;;@ ~lib/math.ts:1993:6
    (set_local $28
     ;;@ ~lib/math.ts:1993:12
     (f32.reinterpret/i32
      ;;@ ~lib/math.ts:1993:29
      (i32.add
       (i32.add
        (get_local $24)
        ;;@ ~lib/math.ts:1993:34
        (i32.const 4194304)
       )
       ;;@ ~lib/math.ts:1993:47
       (i32.shl
        ;;@ ~lib/math.ts:1993:48
        (get_local $9)
        ;;@ ~lib/math.ts:1993:53
        (i32.const 21)
       )
      )
     )
    )
    ;;@ ~lib/math.ts:1994:6
    (set_local $29
     ;;@ ~lib/math.ts:1994:12
     (f32.sub
      (get_local $10)
      ;;@ ~lib/math.ts:1994:17
      (f32.sub
       ;;@ ~lib/math.ts:1994:18
       (get_local $28)
       ;;@ ~lib/math.ts:1994:24
       (get_local $30)
      )
     )
    )
    ;;@ ~lib/math.ts:1995:6
    (set_local $27
     ;;@ ~lib/math.ts:1995:12
     (f32.mul
      (get_local $19)
      ;;@ ~lib/math.ts:1995:16
      (f32.sub
       ;;@ ~lib/math.ts:1995:17
       (f32.sub
        ;;@ ~lib/math.ts:1995:18
        (get_local $18)
        ;;@ ~lib/math.ts:1995:22
        (f32.mul
         (get_local $26)
         ;;@ ~lib/math.ts:1995:28
         (get_local $28)
        )
       )
       ;;@ ~lib/math.ts:1995:35
       (f32.mul
        (get_local $26)
        ;;@ ~lib/math.ts:1995:41
        (get_local $29)
       )
      )
     )
    )
    ;;@ ~lib/math.ts:1996:6
    (set_local $25
     ;;@ ~lib/math.ts:1996:11
     (f32.mul
      (get_local $16)
      ;;@ ~lib/math.ts:1996:15
      (get_local $16)
     )
    )
    ;;@ ~lib/math.ts:1997:6
    (set_local $15
     ;;@ ~lib/math.ts:1997:10
     (f32.mul
      (f32.mul
       (get_local $25)
       ;;@ ~lib/math.ts:1997:15
       (get_local $25)
      )
      ;;@ ~lib/math.ts:1997:20
      (f32.add
       ;;@ ~lib/math.ts:1997:21
       (f32.const 0.6000000238418579)
       ;;@ ~lib/math.ts:1997:26
       (f32.mul
        (get_local $25)
        ;;@ ~lib/math.ts:1997:31
        (f32.add
         ;;@ ~lib/math.ts:1997:32
         (f32.const 0.4285714328289032)
         ;;@ ~lib/math.ts:1997:37
         (f32.mul
          (get_local $25)
          ;;@ ~lib/math.ts:1997:42
          (f32.add
           ;;@ ~lib/math.ts:1997:43
           (f32.const 0.3333333432674408)
           ;;@ ~lib/math.ts:1997:48
           (f32.mul
            (get_local $25)
            ;;@ ~lib/math.ts:1997:53
            (f32.add
             ;;@ ~lib/math.ts:1997:54
             (f32.const 0.2727281153202057)
             ;;@ ~lib/math.ts:1997:59
             (f32.mul
              (get_local $25)
              ;;@ ~lib/math.ts:1997:64
              (f32.add
               ;;@ ~lib/math.ts:1997:65
               (f32.const 0.23066075146198273)
               ;;@ ~lib/math.ts:1997:70
               (f32.mul
                (get_local $25)
                ;;@ ~lib/math.ts:1997:75
                (f32.const 0.20697501301765442)
               )
              )
             )
            )
           )
          )
         )
        )
       )
      )
     )
    )
    ;;@ ~lib/math.ts:1998:6
    (set_local $15
     (f32.add
      (get_local $15)
      ;;@ ~lib/math.ts:1998:11
      (f32.mul
       (get_local $27)
       ;;@ ~lib/math.ts:1998:17
       (f32.add
        ;;@ ~lib/math.ts:1998:18
        (get_local $26)
        ;;@ ~lib/math.ts:1998:24
        (get_local $16)
       )
      )
     )
    )
    ;;@ ~lib/math.ts:1999:6
    (set_local $25
     ;;@ ~lib/math.ts:1999:11
     (f32.mul
      (get_local $26)
      ;;@ ~lib/math.ts:1999:17
      (get_local $26)
     )
    )
    ;;@ ~lib/math.ts:2000:6
    (set_local $28
     ;;@ ~lib/math.ts:2000:12
     (f32.add
      (f32.add
       (f32.const 3)
       ;;@ ~lib/math.ts:2000:18
       (get_local $25)
      )
      ;;@ ~lib/math.ts:2000:23
      (get_local $15)
     )
    )
    ;;@ ~lib/math.ts:2001:6
    (set_local $24
     ;;@ ~lib/math.ts:2001:11
     (i32.reinterpret/f32
      ;;@ ~lib/math.ts:2001:28
      (get_local $28)
     )
    )
    ;;@ ~lib/math.ts:2002:6
    (set_local $28
     ;;@ ~lib/math.ts:2002:12
     (f32.reinterpret/i32
      ;;@ ~lib/math.ts:2002:29
      (i32.and
       (get_local $24)
       ;;@ ~lib/math.ts:2002:34
       (i32.const -4096)
      )
     )
    )
    ;;@ ~lib/math.ts:2003:6
    (set_local $29
     ;;@ ~lib/math.ts:2003:12
     (f32.sub
      (get_local $15)
      ;;@ ~lib/math.ts:2003:16
      (f32.sub
       ;;@ ~lib/math.ts:2003:17
       (f32.sub
        ;;@ ~lib/math.ts:2003:18
        (get_local $28)
        ;;@ ~lib/math.ts:2003:24
        (f32.const 3)
       )
       ;;@ ~lib/math.ts:2003:31
       (get_local $25)
      )
     )
    )
    ;;@ ~lib/math.ts:2004:6
    (set_local $18
     ;;@ ~lib/math.ts:2004:10
     (f32.mul
      (get_local $26)
      ;;@ ~lib/math.ts:2004:16
      (get_local $28)
     )
    )
    ;;@ ~lib/math.ts:2005:6
    (set_local $19
     ;;@ ~lib/math.ts:2005:10
     (f32.add
      (f32.mul
       (get_local $27)
       ;;@ ~lib/math.ts:2005:16
       (get_local $28)
      )
      ;;@ ~lib/math.ts:2005:22
      (f32.mul
       (get_local $29)
       ;;@ ~lib/math.ts:2005:28
       (get_local $16)
      )
     )
    )
    ;;@ ~lib/math.ts:2006:6
    (set_local $21
     ;;@ ~lib/math.ts:2006:12
     (f32.add
      (get_local $18)
      ;;@ ~lib/math.ts:2006:16
      (get_local $19)
     )
    )
    ;;@ ~lib/math.ts:2007:6
    (set_local $24
     ;;@ ~lib/math.ts:2007:11
     (i32.reinterpret/f32
      ;;@ ~lib/math.ts:2007:28
      (get_local $21)
     )
    )
    ;;@ ~lib/math.ts:2008:6
    (set_local $21
     ;;@ ~lib/math.ts:2008:12
     (f32.reinterpret/i32
      ;;@ ~lib/math.ts:2008:29
      (i32.and
       (get_local $24)
       ;;@ ~lib/math.ts:2008:34
       (i32.const -4096)
      )
     )
    )
    ;;@ ~lib/math.ts:2009:6
    (set_local $22
     ;;@ ~lib/math.ts:2009:12
     (f32.sub
      (get_local $19)
      ;;@ ~lib/math.ts:2009:16
      (f32.sub
       ;;@ ~lib/math.ts:2009:17
       (get_local $21)
       ;;@ ~lib/math.ts:2009:23
       (get_local $18)
      )
     )
    )
    ;;@ ~lib/math.ts:2010:6
    (set_local $31
     ;;@ ~lib/math.ts:2010:16
     (f32.mul
      (f32.const 0.9619140625)
      ;;@ ~lib/math.ts:2010:23
      (get_local $21)
     )
    )
    ;;@ ~lib/math.ts:2011:6
    (set_local $32
     ;;@ ~lib/math.ts:2011:17
     (select
      ;;@ ~lib/math.ts:2011:29
      (f32.const 1.5632208487659227e-06)
      ;;@ ~lib/math.ts:2011:36
      (f32.const 0)
      ;;@ ~lib/math.ts:2011:41
      (get_local $9)
     )
    )
    ;;@ ~lib/math.ts:2012:6
    (set_local $33
     ;;@ ~lib/math.ts:2012:16
     (f32.add
      (f32.add
       (f32.mul
        (f32.const -1.1736857413779944e-04)
        ;;@ ~lib/math.ts:2012:23
        (get_local $21)
       )
       ;;@ ~lib/math.ts:2012:29
       (f32.mul
        (get_local $22)
        ;;@ ~lib/math.ts:2012:35
        (f32.const 0.9617967009544373)
       )
      )
      ;;@ ~lib/math.ts:2012:40
      (get_local $32)
     )
    )
    ;;@ ~lib/math.ts:2013:6
    (set_local $17
     ;;@ ~lib/math.ts:2013:10
     (f32.convert_s/i32
      (get_local $23)
     )
    )
    ;;@ ~lib/math.ts:2014:6
    (set_local $34
     ;;@ ~lib/math.ts:2014:17
     (select
      ;;@ ~lib/math.ts:2014:29
      (f32.const 0.5849609375)
      ;;@ ~lib/math.ts:2014:36
      (f32.const 0)
      ;;@ ~lib/math.ts:2014:41
      (get_local $9)
     )
    )
    ;;@ ~lib/math.ts:2015:6
    (set_local $13
     ;;@ ~lib/math.ts:2015:11
     (f32.add
      ;;@ ~lib/math.ts:2015:12
      (f32.add
       ;;@ ~lib/math.ts:2015:13
       (f32.add
        ;;@ ~lib/math.ts:2015:14
        (get_local $31)
        ;;@ ~lib/math.ts:2015:20
        (get_local $33)
       )
       ;;@ ~lib/math.ts:2015:27
       (get_local $34)
      )
      ;;@ ~lib/math.ts:2015:35
      (get_local $17)
     )
    )
    ;;@ ~lib/math.ts:2016:6
    (set_local $24
     ;;@ ~lib/math.ts:2016:11
     (i32.reinterpret/f32
      ;;@ ~lib/math.ts:2016:28
      (get_local $13)
     )
    )
    ;;@ ~lib/math.ts:2017:6
    (set_local $13
     ;;@ ~lib/math.ts:2017:11
     (f32.reinterpret/i32
      ;;@ ~lib/math.ts:2017:28
      (i32.and
       (get_local $24)
       ;;@ ~lib/math.ts:2017:33
       (i32.const -4096)
      )
     )
    )
    ;;@ ~lib/math.ts:2018:6
    (set_local $14
     ;;@ ~lib/math.ts:2018:11
     (f32.sub
      (get_local $33)
      ;;@ ~lib/math.ts:2018:17
      (f32.sub
       ;;@ ~lib/math.ts:2018:18
       (f32.sub
        ;;@ ~lib/math.ts:2018:19
        (f32.sub
         ;;@ ~lib/math.ts:2018:20
         (get_local $13)
         ;;@ ~lib/math.ts:2018:25
         (get_local $17)
        )
        ;;@ ~lib/math.ts:2018:30
        (get_local $34)
       )
       ;;@ ~lib/math.ts:2018:38
       (get_local $31)
      )
     )
    )
   )
  )
  ;;@ ~lib/math.ts:2020:4
  (set_local $24
   ;;@ ~lib/math.ts:2020:9
   (i32.reinterpret/f32
    ;;@ ~lib/math.ts:2020:26
    (get_local $1)
   )
  )
  ;;@ ~lib/math.ts:2021:4
  (set_local $35
   ;;@ ~lib/math.ts:2021:13
   (f32.reinterpret/i32
    ;;@ ~lib/math.ts:2021:30
    (i32.and
     (get_local $24)
     ;;@ ~lib/math.ts:2021:35
     (i32.const -4096)
    )
   )
  )
  ;;@ ~lib/math.ts:2022:4
  (set_local $22
   ;;@ ~lib/math.ts:2022:10
   (f32.add
    (f32.mul
     (f32.sub
      ;;@ ~lib/math.ts:2022:11
      (get_local $1)
      ;;@ ~lib/math.ts:2022:15
      (get_local $35)
     )
     ;;@ ~lib/math.ts:2022:21
     (get_local $13)
    )
    ;;@ ~lib/math.ts:2022:26
    (f32.mul
     (get_local $1)
     ;;@ ~lib/math.ts:2022:30
     (get_local $14)
    )
   )
  )
  ;;@ ~lib/math.ts:2023:4
  (set_local $21
   ;;@ ~lib/math.ts:2023:10
   (f32.mul
    (get_local $35)
    ;;@ ~lib/math.ts:2023:15
    (get_local $13)
   )
  )
  ;;@ ~lib/math.ts:2024:4
  (set_local $11
   ;;@ ~lib/math.ts:2024:8
   (f32.add
    (get_local $22)
    ;;@ ~lib/math.ts:2024:14
    (get_local $21)
   )
  )
  ;;@ ~lib/math.ts:2025:4
  (set_local $8
   ;;@ ~lib/math.ts:2025:8
   (i32.reinterpret/f32
    ;;@ ~lib/math.ts:2025:25
    (get_local $11)
   )
  )
  ;;@ ~lib/math.ts:2026:4
  (if
   ;;@ ~lib/math.ts:2026:8
   (i32.gt_s
    (get_local $8)
    ;;@ ~lib/math.ts:2026:12
    (i32.const 1124073472)
   )
   ;;@ ~lib/math.ts:2026:24
   (return
    ;;@ ~lib/math.ts:2027:13
    (f32.mul
     (f32.mul
      (get_local $12)
      ;;@ ~lib/math.ts:2027:18
      (f32.const 1000000015047466219876688e6)
     )
     ;;@ ~lib/math.ts:2027:25
     (f32.const 1000000015047466219876688e6)
    )
   )
   ;;@ ~lib/math.ts:2028:11
   (if
    ;;@ ~lib/math.ts:2028:15
    (i32.eq
     (get_local $8)
     ;;@ ~lib/math.ts:2028:20
     (i32.const 1124073472)
    )
    ;;@ ~lib/math.ts:2028:32
    (if
     ;;@ ~lib/math.ts:2029:10
     (f32.gt
      (f32.add
       (get_local $22)
       ;;@ ~lib/math.ts:2029:16
       (f32.const 4.299566569443414e-08)
      )
      ;;@ ~lib/math.ts:2029:22
      (f32.sub
       (get_local $11)
       ;;@ ~lib/math.ts:2029:26
       (get_local $21)
      )
     )
     ;;@ ~lib/math.ts:2029:50
     (return
      ;;@ ~lib/math.ts:2029:38
      (f32.mul
       (f32.mul
        (get_local $12)
        ;;@ ~lib/math.ts:2029:43
        (f32.const 1000000015047466219876688e6)
       )
       ;;@ ~lib/math.ts:2029:50
       (f32.const 1000000015047466219876688e6)
      )
     )
    )
    ;;@ ~lib/math.ts:2030:11
    (if
     ;;@ ~lib/math.ts:2030:15
     (i32.gt_s
      (i32.and
       ;;@ ~lib/math.ts:2030:16
       (get_local $8)
       ;;@ ~lib/math.ts:2030:20
       (i32.const 2147483647)
      )
      ;;@ ~lib/math.ts:2030:34
      (i32.const 1125515264)
     )
     ;;@ ~lib/math.ts:2030:46
     (return
      ;;@ ~lib/math.ts:2031:13
      (f32.mul
       (f32.mul
        (get_local $12)
        ;;@ ~lib/math.ts:2031:18
        (f32.const 1.0000000031710769e-30)
       )
       ;;@ ~lib/math.ts:2031:25
       (f32.const 1.0000000031710769e-30)
      )
     )
     ;;@ ~lib/math.ts:2032:11
     (if
      ;;@ ~lib/math.ts:2032:15
      (i32.eq
       (get_local $8)
       ;;@ ~lib/math.ts:2032:20
       (i32.const -1021968384)
      )
      ;;@ ~lib/math.ts:2032:32
      (if
       ;;@ ~lib/math.ts:2033:10
       (f32.le
        (get_local $22)
        ;;@ ~lib/math.ts:2033:17
        (f32.sub
         (get_local $11)
         ;;@ ~lib/math.ts:2033:21
         (get_local $21)
        )
       )
       ;;@ ~lib/math.ts:2033:45
       (return
        ;;@ ~lib/math.ts:2033:33
        (f32.mul
         (f32.mul
          (get_local $12)
          ;;@ ~lib/math.ts:2033:38
          (f32.const 1.0000000031710769e-30)
         )
         ;;@ ~lib/math.ts:2033:45
         (f32.const 1.0000000031710769e-30)
        )
       )
      )
     )
    )
   )
  )
  ;;@ ~lib/math.ts:2035:4
  (set_local $36
   ;;@ ~lib/math.ts:2035:12
   (i32.and
    (get_local $8)
    ;;@ ~lib/math.ts:2035:16
    (i32.const 2147483647)
   )
  )
  ;;@ ~lib/math.ts:2036:4
  (set_local $9
   ;;@ ~lib/math.ts:2036:8
   (i32.sub
    (i32.shr_s
     ;;@ ~lib/math.ts:2036:9
     (get_local $36)
     ;;@ ~lib/math.ts:2036:14
     (i32.const 23)
    )
    ;;@ ~lib/math.ts:2036:20
    (i32.const 127)
   )
  )
  ;;@ ~lib/math.ts:2037:4
  (set_local $23
   ;;@ ~lib/math.ts:2037:8
   (i32.const 0)
  )
  ;;@ ~lib/math.ts:2038:4
  (if
   ;;@ ~lib/math.ts:2038:8
   (i32.gt_s
    (get_local $36)
    ;;@ ~lib/math.ts:2038:12
    (i32.const 1056964608)
   )
   ;;@ ~lib/math.ts:2038:24
   (block
    ;;@ ~lib/math.ts:2039:6
    (set_local $23
     ;;@ ~lib/math.ts:2039:10
     (i32.add
      (get_local $8)
      ;;@ ~lib/math.ts:2039:14
      (i32.shr_s
       ;;@ ~lib/math.ts:2039:15
       (i32.const 8388608)
       ;;@ ~lib/math.ts:2039:29
       (i32.add
        ;;@ ~lib/math.ts:2039:30
        (get_local $9)
        ;;@ ~lib/math.ts:2039:34
        (i32.const 1)
       )
      )
     )
    )
    ;;@ ~lib/math.ts:2040:6
    (set_local $9
     ;;@ ~lib/math.ts:2040:10
     (i32.sub
      (i32.shr_s
       ;;@ ~lib/math.ts:2040:11
       (i32.and
        ;;@ ~lib/math.ts:2040:12
        (get_local $23)
        ;;@ ~lib/math.ts:2040:16
        (i32.const 2147483647)
       )
       ;;@ ~lib/math.ts:2040:31
       (i32.const 23)
      )
      ;;@ ~lib/math.ts:2040:37
      (i32.const 127)
     )
    )
    ;;@ ~lib/math.ts:2041:6
    (set_local $17
     ;;@ ~lib/math.ts:2041:10
     (f32.reinterpret/i32
      ;;@ ~lib/math.ts:2041:27
      (i32.and
       (get_local $23)
       ;;@ ~lib/math.ts:2041:31
       (i32.xor
        ;;@ ~lib/math.ts:2041:32
        (i32.shr_s
         ;;@ ~lib/math.ts:2041:33
         (i32.const 8388607)
         ;;@ ~lib/math.ts:2041:47
         (get_local $9)
        )
        (i32.const -1)
       )
      )
     )
    )
    ;;@ ~lib/math.ts:2042:6
    (set_local $23
     ;;@ ~lib/math.ts:2042:10
     (i32.shr_s
      (i32.or
       ;;@ ~lib/math.ts:2042:11
       (i32.and
        ;;@ ~lib/math.ts:2042:12
        (get_local $23)
        ;;@ ~lib/math.ts:2042:16
        (i32.const 8388607)
       )
       ;;@ ~lib/math.ts:2042:30
       (i32.const 8388608)
      )
      ;;@ ~lib/math.ts:2042:45
      (i32.sub
       ;;@ ~lib/math.ts:2042:46
       (i32.const 23)
       ;;@ ~lib/math.ts:2042:51
       (get_local $9)
      )
     )
    )
    ;;@ ~lib/math.ts:2043:6
    (if
     ;;@ ~lib/math.ts:2043:10
     (i32.lt_s
      (get_local $8)
      ;;@ ~lib/math.ts:2043:14
      (i32.const 0)
     )
     ;;@ ~lib/math.ts:2043:17
     (set_local $23
      ;;@ ~lib/math.ts:2043:21
      (i32.sub
       (i32.const 0)
       ;;@ ~lib/math.ts:2043:22
       (get_local $23)
      )
     )
    )
    ;;@ ~lib/math.ts:2044:6
    (set_local $21
     (f32.sub
      (get_local $21)
      ;;@ ~lib/math.ts:2044:13
      (get_local $17)
     )
    )
   )
  )
  ;;@ ~lib/math.ts:2046:4
  (set_local $17
   ;;@ ~lib/math.ts:2046:8
   (f32.add
    (get_local $22)
    ;;@ ~lib/math.ts:2046:14
    (get_local $21)
   )
  )
  ;;@ ~lib/math.ts:2047:4
  (set_local $24
   ;;@ ~lib/math.ts:2047:9
   (i32.reinterpret/f32
    ;;@ ~lib/math.ts:2047:26
    (get_local $17)
   )
  )
  ;;@ ~lib/math.ts:2048:4
  (set_local $17
   ;;@ ~lib/math.ts:2048:8
   (f32.reinterpret/i32
    ;;@ ~lib/math.ts:2048:25
    (i32.and
     (get_local $24)
     ;;@ ~lib/math.ts:2048:30
     (i32.const -32768)
    )
   )
  )
  ;;@ ~lib/math.ts:2049:4
  (set_local $18
   ;;@ ~lib/math.ts:2049:8
   (f32.mul
    (get_local $17)
    ;;@ ~lib/math.ts:2049:12
    (f32.const 0.693145751953125)
   )
  )
  ;;@ ~lib/math.ts:2050:4
  (set_local $19
   ;;@ ~lib/math.ts:2050:8
   (f32.add
    (f32.mul
     (f32.sub
      ;;@ ~lib/math.ts:2050:9
      (get_local $22)
      ;;@ ~lib/math.ts:2050:15
      (f32.sub
       ;;@ ~lib/math.ts:2050:16
       (get_local $17)
       ;;@ ~lib/math.ts:2050:20
       (get_local $21)
      )
     )
     ;;@ ~lib/math.ts:2050:28
     (f32.const 0.6931471824645996)
    )
    ;;@ ~lib/math.ts:2050:34
    (f32.mul
     (get_local $17)
     ;;@ ~lib/math.ts:2050:38
     (f32.const 1.4286065379565116e-06)
    )
   )
  )
  ;;@ ~lib/math.ts:2051:4
  (set_local $11
   ;;@ ~lib/math.ts:2051:8
   (f32.add
    (get_local $18)
    ;;@ ~lib/math.ts:2051:12
    (get_local $19)
   )
  )
  ;;@ ~lib/math.ts:2052:4
  (set_local $20
   ;;@ ~lib/math.ts:2052:8
   (f32.sub
    (get_local $19)
    ;;@ ~lib/math.ts:2052:12
    (f32.sub
     ;;@ ~lib/math.ts:2052:13
     (get_local $11)
     ;;@ ~lib/math.ts:2052:17
     (get_local $18)
    )
   )
  )
  ;;@ ~lib/math.ts:2053:4
  (set_local $17
   ;;@ ~lib/math.ts:2053:8
   (f32.mul
    (get_local $11)
    ;;@ ~lib/math.ts:2053:12
    (get_local $11)
   )
  )
  ;;@ ~lib/math.ts:2054:4
  (set_local $13
   ;;@ ~lib/math.ts:2054:9
   (f32.sub
    (get_local $11)
    ;;@ ~lib/math.ts:2054:13
    (f32.mul
     (get_local $17)
     ;;@ ~lib/math.ts:2054:17
     (f32.add
      ;;@ ~lib/math.ts:2054:18
      (f32.const 0.1666666716337204)
      ;;@ ~lib/math.ts:2054:23
      (f32.mul
       (get_local $17)
       ;;@ ~lib/math.ts:2054:27
       (f32.add
        ;;@ ~lib/math.ts:2054:28
        (f32.const -2.7777778450399637e-03)
        ;;@ ~lib/math.ts:2054:33
        (f32.mul
         (get_local $17)
         ;;@ ~lib/math.ts:2054:37
         (f32.add
          ;;@ ~lib/math.ts:2054:38
          (f32.const 6.61375597701408e-05)
          ;;@ ~lib/math.ts:2054:43
          (f32.mul
           (get_local $17)
           ;;@ ~lib/math.ts:2054:47
           (f32.add
            ;;@ ~lib/math.ts:2054:48
            (f32.const -1.6533901998627698e-06)
            ;;@ ~lib/math.ts:2054:53
            (f32.mul
             (get_local $17)
             ;;@ ~lib/math.ts:2054:57
             (f32.const 4.138136944220605e-08)
            )
           )
          )
         )
        )
       )
      )
     )
    )
   )
  )
  ;;@ ~lib/math.ts:2055:4
  (set_local $15
   ;;@ ~lib/math.ts:2055:8
   (f32.sub
    (f32.div
     (f32.mul
      ;;@ ~lib/math.ts:2055:9
      (get_local $11)
      ;;@ ~lib/math.ts:2055:13
      (get_local $13)
     )
     ;;@ ~lib/math.ts:2055:19
     (f32.sub
      ;;@ ~lib/math.ts:2055:20
      (get_local $13)
      ;;@ ~lib/math.ts:2055:25
      (f32.const 2)
     )
    )
    ;;@ ~lib/math.ts:2055:32
    (f32.add
     ;;@ ~lib/math.ts:2055:33
     (get_local $20)
     ;;@ ~lib/math.ts:2055:37
     (f32.mul
      (get_local $11)
      ;;@ ~lib/math.ts:2055:41
      (get_local $20)
     )
    )
   )
  )
  ;;@ ~lib/math.ts:2056:4
  (set_local $11
   ;;@ ~lib/math.ts:2056:8
   (f32.sub
    (f32.const 1)
    ;;@ ~lib/math.ts:2056:14
    (f32.sub
     ;;@ ~lib/math.ts:2056:15
     (get_local $15)
     ;;@ ~lib/math.ts:2056:19
     (get_local $11)
    )
   )
  )
  ;;@ ~lib/math.ts:2057:4
  (set_local $8
   ;;@ ~lib/math.ts:2057:8
   (i32.reinterpret/f32
    ;;@ ~lib/math.ts:2057:25
    (get_local $11)
   )
  )
  ;;@ ~lib/math.ts:2058:4
  (set_local $8
   (i32.add
    (get_local $8)
    ;;@ ~lib/math.ts:2058:9
    (i32.shl
     (get_local $23)
     ;;@ ~lib/math.ts:2058:14
     (i32.const 23)
    )
   )
  )
  ;;@ ~lib/math.ts:2059:4
  (if
   ;;@ ~lib/math.ts:2059:8
   (i32.le_s
    (i32.shr_s
     ;;@ ~lib/math.ts:2059:9
     (get_local $8)
     ;;@ ~lib/math.ts:2059:14
     (i32.const 23)
    )
    ;;@ ~lib/math.ts:2059:21
    (i32.const 0)
   )
   ;;@ ~lib/math.ts:2059:24
   (set_local $11
    ;;@ ~lib/math.ts:2059:28
    (call $~lib/math/NativeMathf.scalbn
     ;;@ ~lib/math.ts:2059:35
     (get_local $11)
     ;;@ ~lib/math.ts:2059:38
     (get_local $23)
    )
   )
   ;;@ ~lib/math.ts:2060:9
   (set_local $11
    ;;@ ~lib/math.ts:2060:13
    (f32.reinterpret/i32
     ;;@ ~lib/math.ts:2060:30
     (get_local $8)
    )
   )
  )
  ;;@ ~lib/math.ts:2061:16
  (f32.mul
   ;;@ ~lib/math.ts:2061:11
   (get_local $12)
   ;;@ ~lib/math.ts:2061:16
   (get_local $11)
  )
 )
 (func $~lib/internal/arraybuffer/computeSize (; 17 ;) (type $ii) (param $0 i32) (result i32)
  ;;@ ~lib/internal/arraybuffer.ts:15:77
  (i32.shl
   ;;@ ~lib/internal/arraybuffer.ts:15:9
   (i32.const 1)
   ;;@ ~lib/internal/arraybuffer.ts:15:21
   (i32.sub
    ;;@ ~lib/internal/arraybuffer.ts:15:29
    (i32.const 32)
    ;;@ ~lib/internal/arraybuffer.ts:15:39
    (i32.clz
     ;;@ ~lib/internal/arraybuffer.ts:15:48
     (i32.sub
      (i32.add
       (get_local $0)
       ;;@ ~lib/internal/arraybuffer.ts:15:61
       (get_global $~lib/internal/arraybuffer/HEADER_SIZE)
      )
      ;;@ ~lib/internal/arraybuffer.ts:15:75
      (i32.const 1)
     )
    )
   )
  )
 )
 (func $~lib/internal/arraybuffer/allocateUnsafe (; 18 ;) (type $ii) (param $0 i32) (result i32)
  (local $1 i32)
  (local $2 i32)
  ;;@ ~lib/internal/arraybuffer.ts:23:2
  (if
   (i32.eqz
    ;;@ ~lib/internal/arraybuffer.ts:23:9
    (i32.le_u
     (get_local $0)
     ;;@ ~lib/internal/arraybuffer.ts:23:28
     (get_global $~lib/internal/arraybuffer/MAX_BLENGTH)
    )
   )
   (block
    (call $~lib/env/abort
     (i32.const 0)
     (i32.const 184)
     (i32.const 23)
     (i32.const 2)
    )
    (unreachable)
   )
  )
  ;;@ ~lib/internal/arraybuffer.ts:25:2
  (set_local $1
   ;;@ ~lib/internal/arraybuffer.ts:28:20
   (block $~lib/memory/memory.allocate|inlined.0 (result i32)
    (set_local $2
     ;;@ ~lib/internal/arraybuffer.ts:28:29
     (call $~lib/internal/arraybuffer/computeSize
      ;;@ ~lib/internal/arraybuffer.ts:28:41
      (get_local $0)
     )
    )
    ;;@ ~lib/memory.ts:41:4
    (br $~lib/memory/memory.allocate|inlined.0
     ;;@ ~lib/memory.ts:41:45
     (call $~lib/allocator/arena/__memory_allocate
      ;;@ ~lib/memory.ts:41:63
      (get_local $2)
     )
    )
   )
  )
  ;;@ ~lib/internal/arraybuffer.ts:30:2
  (i32.store
   ;;@ ~lib/internal/arraybuffer.ts:30:13
   (get_local $1)
   ;;@ ~lib/internal/arraybuffer.ts:30:21
   (get_local $0)
  )
  ;;@ ~lib/internal/arraybuffer.ts:31:39
  (get_local $1)
 )
 (func $~lib/internal/arraybuffer/reallocateUnsafe (; 19 ;) (type $iii) (param $0 i32) (param $1 i32) (result i32)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  (local $6 i32)
  ;;@ ~lib/internal/arraybuffer.ts:35:2
  (set_local $2
   ;;@ ~lib/internal/arraybuffer.ts:35:22
   (i32.load
    (get_local $0)
   )
  )
  ;;@ ~lib/internal/arraybuffer.ts:36:2
  (if
   ;;@ ~lib/internal/arraybuffer.ts:36:6
   (i32.gt_s
    (get_local $1)
    ;;@ ~lib/internal/arraybuffer.ts:36:22
    (get_local $2)
   )
   ;;@ ~lib/internal/arraybuffer.ts:36:37
   (block
    ;;@ ~lib/internal/arraybuffer.ts:37:4
    (if
     (i32.eqz
      ;;@ ~lib/internal/arraybuffer.ts:37:11
      (i32.le_s
       (get_local $1)
       ;;@ ~lib/internal/arraybuffer.ts:37:28
       (get_global $~lib/internal/arraybuffer/MAX_BLENGTH)
      )
     )
     (block
      (call $~lib/env/abort
       (i32.const 0)
       (i32.const 184)
       (i32.const 37)
       (i32.const 4)
      )
      (unreachable)
     )
    )
    ;;@ ~lib/internal/arraybuffer.ts:38:4
    (if
     ;;@ ~lib/internal/arraybuffer.ts:38:8
     (i32.le_s
      (get_local $1)
      ;;@ ~lib/internal/arraybuffer.ts:38:25
      (i32.sub
       ;;@ ~lib/internal/arraybuffer.ts:38:31
       (call $~lib/internal/arraybuffer/computeSize
        ;;@ ~lib/internal/arraybuffer.ts:38:43
        (get_local $2)
       )
       ;;@ ~lib/internal/arraybuffer.ts:38:60
       (get_global $~lib/internal/arraybuffer/HEADER_SIZE)
      )
     )
     ;;@ ~lib/internal/arraybuffer.ts:38:74
     (block
      ;;@ ~lib/internal/arraybuffer.ts:39:6
      (i32.store
       ;;@ ~lib/internal/arraybuffer.ts:39:17
       (get_local $0)
       ;;@ ~lib/internal/arraybuffer.ts:39:44
       (get_local $1)
      )
      ;;@ ~lib/internal/arraybuffer.ts:40:13
      (block $~lib/memory/memory.fill|inlined.0
       (set_local $3
        ;;@ ~lib/internal/arraybuffer.ts:41:8
        (i32.add
         (i32.add
          (get_local $0)
          ;;@ ~lib/internal/arraybuffer.ts:41:36
          (get_global $~lib/internal/arraybuffer/HEADER_SIZE)
         )
         ;;@ ~lib/internal/arraybuffer.ts:41:50
         (get_local $2)
        )
       )
       (set_local $4
        ;;@ ~lib/internal/arraybuffer.ts:42:8
        (i32.const 0)
       )
       (set_local $5
        ;;@ ~lib/internal/arraybuffer.ts:43:8
        (i32.sub
         ;;@ ~lib/internal/arraybuffer.ts:43:16
         (get_local $1)
         ;;@ ~lib/internal/arraybuffer.ts:43:32
         (get_local $2)
        )
       )
       (call $~lib/internal/memory/memset
        (get_local $3)
        (get_local $4)
        (get_local $5)
       )
      )
     )
     ;;@ ~lib/internal/arraybuffer.ts:45:11
     (block
      ;;@ ~lib/internal/arraybuffer.ts:46:6
      (set_local $5
       ;;@ ~lib/internal/arraybuffer.ts:46:22
       (call $~lib/internal/arraybuffer/allocateUnsafe
        ;;@ ~lib/internal/arraybuffer.ts:46:37
        (get_local $1)
       )
      )
      ;;@ ~lib/internal/arraybuffer.ts:47:13
      (block $~lib/memory/memory.copy|inlined.0
       (set_local $4
        ;;@ ~lib/internal/arraybuffer.ts:48:8
        (i32.add
         (get_local $5)
         ;;@ ~lib/internal/arraybuffer.ts:48:39
         (get_global $~lib/internal/arraybuffer/HEADER_SIZE)
        )
       )
       (set_local $3
        ;;@ ~lib/internal/arraybuffer.ts:49:8
        (i32.add
         (get_local $0)
         ;;@ ~lib/internal/arraybuffer.ts:49:36
         (get_global $~lib/internal/arraybuffer/HEADER_SIZE)
        )
       )
       ;;@ ~lib/memory.ts:20:4
       (call $~lib/internal/memory/memmove
        ;;@ ~lib/memory.ts:20:12
        (get_local $4)
        ;;@ ~lib/memory.ts:20:18
        (get_local $3)
        ;;@ ~lib/memory.ts:20:23
        (get_local $2)
       )
      )
      ;;@ ~lib/internal/arraybuffer.ts:52:13
      (block $~lib/memory/memory.fill|inlined.1
       (set_local $3
        ;;@ ~lib/internal/arraybuffer.ts:53:8
        (i32.add
         (i32.add
          (get_local $5)
          ;;@ ~lib/internal/arraybuffer.ts:53:39
          (get_global $~lib/internal/arraybuffer/HEADER_SIZE)
         )
         ;;@ ~lib/internal/arraybuffer.ts:53:53
         (get_local $2)
        )
       )
       (set_local $4
        ;;@ ~lib/internal/arraybuffer.ts:54:8
        (i32.const 0)
       )
       (set_local $6
        ;;@ ~lib/internal/arraybuffer.ts:55:8
        (i32.sub
         ;;@ ~lib/internal/arraybuffer.ts:55:16
         (get_local $1)
         ;;@ ~lib/internal/arraybuffer.ts:55:32
         (get_local $2)
        )
       )
       ;;@ ~lib/memory.ts:15:4
       (call $~lib/internal/memory/memset
        ;;@ ~lib/memory.ts:15:11
        (get_local $3)
        ;;@ ~lib/memory.ts:15:17
        (get_local $4)
        ;;@ ~lib/memory.ts:15:20
        (get_local $6)
       )
      )
      ;;@ ~lib/internal/arraybuffer.ts:57:13
      (return
       (get_local $5)
      )
     )
    )
   )
   ;;@ ~lib/internal/arraybuffer.ts:59:9
   (if
    ;;@ ~lib/internal/arraybuffer.ts:59:13
    (i32.lt_s
     (get_local $1)
     ;;@ ~lib/internal/arraybuffer.ts:59:29
     (get_local $2)
    )
    ;;@ ~lib/internal/arraybuffer.ts:59:44
    (block
     ;;@ ~lib/internal/arraybuffer.ts:61:4
     (if
      (i32.eqz
       ;;@ ~lib/internal/arraybuffer.ts:61:11
       (i32.ge_s
        (get_local $1)
        ;;@ ~lib/internal/arraybuffer.ts:61:28
        (i32.const 0)
       )
      )
      (block
       (call $~lib/env/abort
        (i32.const 0)
        (i32.const 184)
        (i32.const 61)
        (i32.const 4)
       )
       (unreachable)
      )
     )
     ;;@ ~lib/internal/arraybuffer.ts:62:4
     (i32.store
      ;;@ ~lib/internal/arraybuffer.ts:62:15
      (get_local $0)
      ;;@ ~lib/internal/arraybuffer.ts:62:42
      (get_local $1)
     )
    )
   )
  )
  ;;@ ~lib/internal/arraybuffer.ts:64:9
  (get_local $0)
 )
 (func $~lib/array/Array<f32>#__set (; 20 ;) (type $iifv) (param $0 i32) (param $1 i32) (param $2 f32)
  (local $3 i32)
  (local $4 i32)
  ;;@ ~lib/array.ts:83:4
  (set_local $3
   ;;@ ~lib/array.ts:83:17
   (i32.load
    (get_local $0)
   )
  )
  ;;@ ~lib/array.ts:84:4
  (set_local $4
   ;;@ ~lib/array.ts:84:19
   (i32.shr_u
    (i32.load
     (get_local $3)
    )
    ;;@ ~lib/array.ts:84:41
    (i32.const 2)
   )
  )
  ;;@ ~lib/array.ts:85:4
  (if
   ;;@ ~lib/array.ts:85:8
   (i32.ge_u
    (get_local $1)
    ;;@ ~lib/array.ts:85:22
    (get_local $4)
   )
   ;;@ ~lib/array.ts:85:37
   (block
    ;;@ ~lib/array.ts:87:6
    (if
     ;;@ ~lib/array.ts:87:10
     (i32.ge_u
      (get_local $1)
      ;;@ ~lib/array.ts:87:24
      (i32.const 268435454)
     )
     ;;@ ~lib/array.ts:87:41
     (block
      (call $~lib/env/abort
       (i32.const 0)
       (i32.const 152)
       (i32.const 87)
       (i32.const 41)
      )
      (unreachable)
     )
    )
    ;;@ ~lib/array.ts:88:6
    (set_local $3
     ;;@ ~lib/array.ts:88:15
     (call $~lib/internal/arraybuffer/reallocateUnsafe
      ;;@ ~lib/array.ts:88:32
      (get_local $3)
      ;;@ ~lib/array.ts:88:40
      (i32.shl
       (i32.add
        ;;@ ~lib/array.ts:88:41
        (get_local $1)
        ;;@ ~lib/array.ts:88:49
        (i32.const 1)
       )
       ;;@ ~lib/array.ts:88:55
       (i32.const 2)
      )
     )
    )
    ;;@ ~lib/array.ts:89:6
    (i32.store
     (get_local $0)
     ;;@ ~lib/array.ts:89:21
     (get_local $3)
    )
    ;;@ ~lib/array.ts:90:6
    (i32.store offset=4
     (get_local $0)
     ;;@ ~lib/array.ts:90:21
     (i32.add
      (get_local $1)
      ;;@ ~lib/array.ts:90:29
      (i32.const 1)
     )
    )
   )
  )
  ;;@ ~lib/array.ts:92:4
  (block $~lib/internal/arraybuffer/storeUnsafe<f32,f32>|inlined.0
   ;;@ ~lib/internal/arraybuffer.ts:72:2
   (f32.store offset=8
    ;;@ ~lib/internal/arraybuffer.ts:72:11
    (i32.add
     (get_local $3)
     ;;@ ~lib/internal/arraybuffer.ts:72:39
     (i32.shl
      ;;@ ~lib/internal/arraybuffer.ts:72:40
      (get_local $1)
      ;;@ ~lib/internal/arraybuffer.ts:72:56
      (i32.const 2)
     )
    )
    ;;@ ~lib/internal/arraybuffer.ts:72:71
    (get_local $2)
   )
  )
 )
 (func $~lib/array/Array<i32>#__get (; 21 ;) (type $iii) (param $0 i32) (param $1 i32) (result i32)
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
 (func $~lib/array/Array<i32>#__set (; 22 ;) (type $iiiv) (param $0 i32) (param $1 i32) (param $2 i32)
  (local $3 i32)
  (local $4 i32)
  ;;@ ~lib/array.ts:83:4
  (set_local $3
   ;;@ ~lib/array.ts:83:17
   (i32.load
    (get_local $0)
   )
  )
  ;;@ ~lib/array.ts:84:4
  (set_local $4
   ;;@ ~lib/array.ts:84:19
   (i32.shr_u
    (i32.load
     (get_local $3)
    )
    ;;@ ~lib/array.ts:84:41
    (i32.const 2)
   )
  )
  ;;@ ~lib/array.ts:85:4
  (if
   ;;@ ~lib/array.ts:85:8
   (i32.ge_u
    (get_local $1)
    ;;@ ~lib/array.ts:85:22
    (get_local $4)
   )
   ;;@ ~lib/array.ts:85:37
   (block
    ;;@ ~lib/array.ts:87:6
    (if
     ;;@ ~lib/array.ts:87:10
     (i32.ge_u
      (get_local $1)
      ;;@ ~lib/array.ts:87:24
      (i32.const 268435454)
     )
     ;;@ ~lib/array.ts:87:41
     (block
      (call $~lib/env/abort
       (i32.const 0)
       (i32.const 152)
       (i32.const 87)
       (i32.const 41)
      )
      (unreachable)
     )
    )
    ;;@ ~lib/array.ts:88:6
    (set_local $3
     ;;@ ~lib/array.ts:88:15
     (call $~lib/internal/arraybuffer/reallocateUnsafe
      ;;@ ~lib/array.ts:88:32
      (get_local $3)
      ;;@ ~lib/array.ts:88:40
      (i32.shl
       (i32.add
        ;;@ ~lib/array.ts:88:41
        (get_local $1)
        ;;@ ~lib/array.ts:88:49
        (i32.const 1)
       )
       ;;@ ~lib/array.ts:88:55
       (i32.const 2)
      )
     )
    )
    ;;@ ~lib/array.ts:89:6
    (i32.store
     (get_local $0)
     ;;@ ~lib/array.ts:89:21
     (get_local $3)
    )
    ;;@ ~lib/array.ts:90:6
    (i32.store offset=4
     (get_local $0)
     ;;@ ~lib/array.ts:90:21
     (i32.add
      (get_local $1)
      ;;@ ~lib/array.ts:90:29
      (i32.const 1)
     )
    )
   )
  )
  ;;@ ~lib/array.ts:92:4
  (block $~lib/internal/arraybuffer/storeUnsafe<i32,i32>|inlined.0
   ;;@ ~lib/internal/arraybuffer.ts:72:2
   (i32.store offset=8
    ;;@ ~lib/internal/arraybuffer.ts:72:11
    (i32.add
     (get_local $3)
     ;;@ ~lib/internal/arraybuffer.ts:72:39
     (i32.shl
      ;;@ ~lib/internal/arraybuffer.ts:72:40
      (get_local $1)
      ;;@ ~lib/internal/arraybuffer.ts:72:56
      (i32.const 2)
     )
    )
    ;;@ ~lib/internal/arraybuffer.ts:72:71
    (get_local $2)
   )
  )
 )
 (func $~lib/math/NativeMath.sin (; 23 ;) (type $FF) (param $0 f64) (result f64)
  ;;@ ~lib/math.ts:1050:4
  (unreachable)
  ;;@ ~lib/math.ts:1051:11
  (f64.const 0)
 )
 (func $~lib/math/NativeMath.cos (; 24 ;) (type $FF) (param $0 f64) (result f64)
  ;;@ ~lib/math.ts:395:4
  (unreachable)
  ;;@ ~lib/math.ts:396:11
  (f64.const 0)
 )
 (func $src/service/wasm/get-frequencies/FFT#constructor (; 25 ;) (type $iiifi) (param $0 i32) (param $1 i32) (param $2 i32) (param $3 f32) (result i32)
  (local $4 i32)
  (local $5 f32)
  (local $6 i32)
  (local $7 i32)
  ;;@ src/service/wasm/get-frequencies.ts:44:4
  (i32.store
   (tee_local $0
    (if (result i32)
     (get_local $0)
     (get_local $0)
     (tee_local $0
      (block (result i32)
       (set_local $4
        (call $~lib/memory/memory.allocate
         (i32.const 32)
        )
       )
       (i32.store
        (get_local $4)
        (i32.const 0)
       )
       (i32.store offset=4
        (get_local $4)
        (i32.const 0)
       )
       (i32.store offset=8
        (get_local $4)
        (i32.const 0)
       )
       (i32.store offset=12
        (get_local $4)
        (i32.const 0)
       )
       (i32.store offset=16
        (get_local $4)
        (i32.const 0)
       )
       (i32.store offset=20
        (get_local $4)
        (i32.const 0)
       )
       (i32.store offset=24
        (get_local $4)
        (i32.const 0)
       )
       (f32.store offset=28
        (get_local $4)
        (f32.const 0)
       )
       (get_local $4)
      )
     )
    )
   )
   ;;@ src/service/wasm/get-frequencies.ts:44:22
   (get_local $1)
  )
  ;;@ src/service/wasm/get-frequencies.ts:45:4
  (i32.store offset=4
   (get_local $0)
   ;;@ src/service/wasm/get-frequencies.ts:45:22
   (get_local $2)
  )
  ;;@ src/service/wasm/get-frequencies.ts:46:4
  (i32.store offset=8
   (get_local $0)
   ;;@ src/service/wasm/get-frequencies.ts:46:20
   (i32.const 96)
  )
  ;;@ src/service/wasm/get-frequencies.ts:47:4
  (i32.store offset=12
   (get_local $0)
   ;;@ src/service/wasm/get-frequencies.ts:47:20
   (i32.const 112)
  )
  ;;@ src/service/wasm/get-frequencies.ts:48:4
  (i32.store offset=16
   (get_local $0)
   ;;@ src/service/wasm/get-frequencies.ts:48:24
   (i32.const 128)
  )
  ;;@ src/service/wasm/get-frequencies.ts:49:4
  (i32.store offset=20
   (get_local $0)
   ;;@ src/service/wasm/get-frequencies.ts:49:24
   (i32.const 144)
  )
  ;;@ src/service/wasm/get-frequencies.ts:50:4
  (i32.store offset=24
   (get_local $0)
   ;;@ src/service/wasm/get-frequencies.ts:50:20
   (i32.const 0)
  )
  ;;@ src/service/wasm/get-frequencies.ts:51:4
  (f32.store offset=28
   (get_local $0)
   ;;@ src/service/wasm/get-frequencies.ts:51:16
   (f32.const 0)
  )
  ;;@ src/service/wasm/get-frequencies.ts:52:4
  (set_local $5
   ;;@ src/service/wasm/get-frequencies.ts:52:14
   (f32.convert_s/i32
    (get_local $1)
   )
  )
  ;;@ src/service/wasm/get-frequencies.ts:54:4
  (block $break|0
   ;;@ src/service/wasm/get-frequencies.ts:54:9
   (set_local $4
    ;;@ src/service/wasm/get-frequencies.ts:54:22
    (i32.const 0)
   )
   (loop $repeat|0
    (br_if $break|0
     (i32.eqz
      ;;@ src/service/wasm/get-frequencies.ts:54:25
      (i32.lt_s
       (get_local $4)
       ;;@ src/service/wasm/get-frequencies.ts:54:29
       (get_local $1)
      )
     )
    )
    ;;@ src/service/wasm/get-frequencies.ts:55:6
    (call $~lib/array/Array<f32>#__set
     (i32.load offset=16
      (get_local $0)
     )
     ;;@ src/service/wasm/get-frequencies.ts:55:24
     (get_local $4)
     ;;@ src/service/wasm/get-frequencies.ts:55:29
     (call $~lib/math/NativeMathf.pow
      ;;@ src/service/wasm/get-frequencies.ts:55:35
      (get_global $src/service/wasm/get-frequencies/E)
      ;;@ src/service/wasm/get-frequencies.ts:55:40
      (f32.mul
       ;;@ src/service/wasm/get-frequencies.ts:56:8
       (f32.const -0.5)
       ;;@ src/service/wasm/get-frequencies.ts:56:20
       (f32.div
        ;;@ src/service/wasm/get-frequencies.ts:57:10
        (f32.sub
         ;;@ src/service/wasm/get-frequencies.ts:58:12
         (f32.convert_s/i32
          (get_local $4)
         )
         ;;@ src/service/wasm/get-frequencies.ts:58:21
         (f32.div
          (f32.sub
           ;;@ src/service/wasm/get-frequencies.ts:58:22
           (get_local $5)
           ;;@ src/service/wasm/get-frequencies.ts:58:26
           (f32.const 1)
          )
          ;;@ src/service/wasm/get-frequencies.ts:58:36
          (f32.const 2)
         )
        )
        ;;@ src/service/wasm/get-frequencies.ts:60:10
        (call $~lib/math/NativeMathf.pow
         (f32.div
          ;;@ src/service/wasm/get-frequencies.ts:61:12
          (f32.mul
           ;;@ src/service/wasm/get-frequencies.ts:61:13
           (get_local $3)
           ;;@ src/service/wasm/get-frequencies.ts:61:21
           (f32.sub
            ;;@ src/service/wasm/get-frequencies.ts:61:22
            (get_local $5)
            ;;@ src/service/wasm/get-frequencies.ts:61:26
            (f32.const 1)
           )
          )
          ;;@ src/service/wasm/get-frequencies.ts:61:37
          (f32.const 2)
         )
         ;;@ src/service/wasm/get-frequencies.ts:62:15
         (f32.const 2)
        )
       )
      )
     )
    )
    ;;@ src/service/wasm/get-frequencies.ts:54:41
    (set_local $4
     (i32.add
      (get_local $4)
      (i32.const 1)
     )
    )
    (br $repeat|0)
   )
  )
  ;;@ src/service/wasm/get-frequencies.ts:67:4
  (set_local $4
   ;;@ src/service/wasm/get-frequencies.ts:67:16
   (i32.const 1)
  )
  ;;@ src/service/wasm/get-frequencies.ts:69:4
  (set_local $6
   ;;@ src/service/wasm/get-frequencies.ts:69:14
   (i32.shr_s
    (get_local $1)
    ;;@ src/service/wasm/get-frequencies.ts:69:28
    (i32.const 1)
   )
  )
  ;;@ src/service/wasm/get-frequencies.ts:71:4
  (block $break|1
   (loop $continue|1
    (if
     ;;@ src/service/wasm/get-frequencies.ts:71:11
     (i32.lt_s
      (get_local $4)
      ;;@ src/service/wasm/get-frequencies.ts:71:19
      (get_local $1)
     )
     (block
      (block
       (block $break|2
        ;;@ src/service/wasm/get-frequencies.ts:72:11
        (set_local $7
         ;;@ src/service/wasm/get-frequencies.ts:72:19
         (i32.const 0)
        )
        (loop $repeat|2
         (br_if $break|2
          (i32.eqz
           ;;@ src/service/wasm/get-frequencies.ts:72:22
           (i32.lt_s
            (get_local $7)
            ;;@ src/service/wasm/get-frequencies.ts:72:26
            (get_local $4)
           )
          )
         )
         ;;@ src/service/wasm/get-frequencies.ts:73:8
         (call $~lib/array/Array<i32>#__set
          (i32.load offset=20
           (get_local $0)
          )
          ;;@ src/service/wasm/get-frequencies.ts:73:26
          (i32.add
           (get_local $7)
           ;;@ src/service/wasm/get-frequencies.ts:73:30
           (get_local $4)
          )
          ;;@ src/service/wasm/get-frequencies.ts:73:39
          (i32.add
           (call $~lib/array/Array<i32>#__get
            (i32.load offset=20
             (get_local $0)
            )
            ;;@ src/service/wasm/get-frequencies.ts:73:57
            (get_local $7)
           )
           ;;@ src/service/wasm/get-frequencies.ts:73:62
           (get_local $6)
          )
         )
         ;;@ src/service/wasm/get-frequencies.ts:72:33
         (set_local $7
          (i32.add
           (get_local $7)
           (i32.const 1)
          )
         )
         (br $repeat|2)
        )
       )
       ;;@ src/service/wasm/get-frequencies.ts:77:6
       (set_local $4
        ;;@ src/service/wasm/get-frequencies.ts:77:14
        (i32.shl
         (get_local $4)
         ;;@ src/service/wasm/get-frequencies.ts:77:23
         (i32.const 1)
        )
       )
       ;;@ src/service/wasm/get-frequencies.ts:79:6
       (set_local $6
        ;;@ src/service/wasm/get-frequencies.ts:79:12
        (i32.shr_s
         (get_local $6)
         ;;@ src/service/wasm/get-frequencies.ts:79:19
         (i32.const 1)
        )
       )
      )
      (br $continue|1)
     )
    )
   )
  )
  ;;@ src/service/wasm/get-frequencies.ts:82:4
  (block $break|3
   ;;@ src/service/wasm/get-frequencies.ts:82:9
   (set_local $7
    ;;@ src/service/wasm/get-frequencies.ts:82:17
    (i32.const 0)
   )
   (loop $repeat|3
    (br_if $break|3
     (i32.eqz
      ;;@ src/service/wasm/get-frequencies.ts:82:20
      (i32.lt_s
       (get_local $7)
       ;;@ src/service/wasm/get-frequencies.ts:82:24
       (get_local $1)
      )
     )
    )
    ;;@ src/service/wasm/get-frequencies.ts:82:41
    (block
     ;;@ src/service/wasm/get-frequencies.ts:83:6
     (call $~lib/array/Array<f32>#__set
      (i32.load offset=8
       (get_local $0)
      )
      ;;@ src/service/wasm/get-frequencies.ts:83:20
      (get_local $7)
      ;;@ src/service/wasm/get-frequencies.ts:83:25
      (f32.demote/f64
       (call $~lib/math/NativeMath.sin
        ;;@ src/service/wasm/get-frequencies.ts:83:39
        (f64.promote/f32
         (f32.div
          (f32.demote/f64
           (f64.neg
            ;;@ src/service/wasm/get-frequencies.ts:83:45
            (get_global $~lib/math/NativeMath.PI)
           )
          )
          ;;@ src/service/wasm/get-frequencies.ts:83:55
          (f32.convert_s/i32
           (get_local $7)
          )
         )
        )
       )
      )
     )
     ;;@ src/service/wasm/get-frequencies.ts:84:6
     (call $~lib/array/Array<f32>#__set
      (i32.load offset=12
       (get_local $0)
      )
      ;;@ src/service/wasm/get-frequencies.ts:84:20
      (get_local $7)
      ;;@ src/service/wasm/get-frequencies.ts:84:25
      (f32.demote/f64
       (call $~lib/math/NativeMath.cos
        ;;@ src/service/wasm/get-frequencies.ts:84:39
        (f64.promote/f32
         (f32.div
          (f32.demote/f64
           (f64.neg
            ;;@ src/service/wasm/get-frequencies.ts:84:45
            (get_global $~lib/math/NativeMath.PI)
           )
          )
          ;;@ src/service/wasm/get-frequencies.ts:84:55
          (f32.convert_s/i32
           (get_local $7)
          )
         )
        )
       )
      )
     )
    )
    ;;@ src/service/wasm/get-frequencies.ts:82:36
    (set_local $7
     (i32.add
      (get_local $7)
      (i32.const 1)
     )
    )
    (br $repeat|3)
   )
  )
  (get_local $0)
 )
 (func $~lib/array/Array<f32>#constructor (; 26 ;) (type $iii) (param $0 i32) (param $1 i32) (result i32)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  ;;@ ~lib/array.ts:23:4
  (if
   ;;@ ~lib/array.ts:23:8
   (i32.gt_u
    (get_local $1)
    ;;@ ~lib/array.ts:23:22
    (i32.const 268435454)
   )
   ;;@ ~lib/array.ts:23:39
   (block
    (call $~lib/env/abort
     (i32.const 0)
     (i32.const 152)
     (i32.const 23)
     (i32.const 39)
    )
    (unreachable)
   )
  )
  ;;@ ~lib/array.ts:24:4
  (set_local $2
   ;;@ ~lib/array.ts:24:21
   (i32.shl
    (get_local $1)
    ;;@ ~lib/array.ts:24:31
    (i32.const 2)
   )
  )
  ;;@ ~lib/array.ts:25:4
  (set_local $3
   ;;@ ~lib/array.ts:25:17
   (call $~lib/internal/arraybuffer/allocateUnsafe
    ;;@ ~lib/array.ts:25:32
    (get_local $2)
   )
  )
  ;;@ ~lib/array.ts:26:4
  (i32.store
   (tee_local $0
    (if (result i32)
     (get_local $0)
     (get_local $0)
     (tee_local $0
      (block (result i32)
       (set_local $4
        (call $~lib/memory/memory.allocate
         (i32.const 8)
        )
       )
       (i32.store
        (get_local $4)
        (i32.const 0)
       )
       (i32.store offset=4
        (get_local $4)
        (i32.const 0)
       )
       (get_local $4)
      )
     )
    )
   )
   ;;@ ~lib/array.ts:26:19
   (get_local $3)
  )
  ;;@ ~lib/array.ts:27:4
  (i32.store offset=4
   (get_local $0)
   ;;@ ~lib/array.ts:27:19
   (get_local $1)
  )
  ;;@ ~lib/array.ts:28:11
  (block $~lib/memory/memory.fill|inlined.2
   (set_local $4
    ;;@ ~lib/array.ts:29:6
    (i32.add
     (get_local $3)
     ;;@ ~lib/array.ts:29:34
     (get_global $~lib/internal/arraybuffer/HEADER_SIZE)
    )
   )
   (set_local $5
    ;;@ ~lib/array.ts:30:6
    (i32.const 0)
   )
   ;;@ ~lib/memory.ts:15:4
   (call $~lib/internal/memory/memset
    ;;@ ~lib/memory.ts:15:11
    (get_local $4)
    ;;@ ~lib/memory.ts:15:17
    (get_local $5)
    ;;@ ~lib/memory.ts:15:20
    (get_local $2)
   )
  )
  (get_local $0)
 )
 (func $~lib/array/Array<f32>#slice (; 27 ;) (type $iiii) (param $0 i32) (param $1 i32) (param $2 i32) (result i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  (local $6 i32)
  (local $7 i32)
  (local $8 i32)
  ;;@ ~lib/array.ts:284:4
  (set_local $3
   ;;@ ~lib/array.ts:284:17
   (i32.load offset=4
    (get_local $0)
   )
  )
  ;;@ ~lib/array.ts:285:4
  (if
   ;;@ ~lib/array.ts:285:8
   (i32.lt_s
    (get_local $1)
    ;;@ ~lib/array.ts:285:16
    (i32.const 0)
   )
   ;;@ ~lib/array.ts:285:19
   (set_local $1
    ;;@ ~lib/array.ts:285:27
    (select
     (tee_local $4
      ;;@ ~lib/array.ts:285:31
      (i32.add
       (get_local $3)
       ;;@ ~lib/array.ts:285:40
       (get_local $1)
      )
     )
     (tee_local $5
      ;;@ ~lib/array.ts:285:47
      (i32.const 0)
     )
     (i32.gt_s
      (get_local $4)
      (get_local $5)
     )
    )
   )
   ;;@ ~lib/array.ts:286:9
   (if
    ;;@ ~lib/array.ts:286:13
    (i32.gt_s
     (get_local $1)
     ;;@ ~lib/array.ts:286:21
     (get_local $3)
    )
    ;;@ ~lib/array.ts:286:29
    (set_local $1
     ;;@ ~lib/array.ts:286:37
     (get_local $3)
    )
   )
  )
  ;;@ ~lib/array.ts:287:4
  (if
   ;;@ ~lib/array.ts:287:8
   (i32.lt_s
    (get_local $2)
    ;;@ ~lib/array.ts:287:14
    (i32.const 0)
   )
   ;;@ ~lib/array.ts:287:17
   (set_local $2
    ;;@ ~lib/array.ts:287:23
    (i32.add
     (get_local $3)
     ;;@ ~lib/array.ts:287:32
     (get_local $2)
    )
   )
   ;;@ ~lib/array.ts:288:9
   (if
    ;;@ ~lib/array.ts:288:13
    (i32.gt_s
     (get_local $2)
     ;;@ ~lib/array.ts:288:19
     (get_local $3)
    )
    ;;@ ~lib/array.ts:288:27
    (set_local $2
     ;;@ ~lib/array.ts:288:33
     (get_local $3)
    )
   )
  )
  ;;@ ~lib/array.ts:289:4
  (if
   ;;@ ~lib/array.ts:289:8
   (i32.lt_s
    (get_local $2)
    ;;@ ~lib/array.ts:289:14
    (get_local $1)
   )
   ;;@ ~lib/array.ts:289:21
   (set_local $2
    ;;@ ~lib/array.ts:289:27
    (get_local $1)
   )
  )
  ;;@ ~lib/array.ts:290:4
  (set_local $6
   ;;@ ~lib/array.ts:290:20
   (i32.sub
    (get_local $2)
    ;;@ ~lib/array.ts:290:26
    (get_local $1)
   )
  )
  ;;@ ~lib/array.ts:291:4
  (if
   (i32.eqz
    ;;@ ~lib/array.ts:291:11
    (i32.ge_s
     (get_local $6)
     ;;@ ~lib/array.ts:291:24
     (i32.const 0)
    )
   )
   (block
    (call $~lib/env/abort
     (i32.const 0)
     (i32.const 152)
     (i32.const 291)
     (i32.const 4)
    )
    (unreachable)
   )
  )
  ;;@ ~lib/array.ts:292:4
  (set_local $7
   ;;@ ~lib/array.ts:292:17
   (call $~lib/array/Array<f32>#constructor
    (i32.const 0)
    ;;@ ~lib/array.ts:292:30
    (get_local $6)
   )
  )
  ;;@ ~lib/array.ts:293:4
  (if
   ;;@ ~lib/array.ts:293:8
   (get_local $6)
   ;;@ ~lib/array.ts:293:19
   (block $~lib/memory/memory.copy|inlined.1
    (set_local $4
     ;;@ ~lib/array.ts:295:8
     (i32.add
      (i32.load
       ;;@ ~lib/array.ts:295:26
       (get_local $7)
      )
      ;;@ ~lib/array.ts:295:44
      (get_global $~lib/internal/arraybuffer/HEADER_SIZE)
     )
    )
    (set_local $5
     ;;@ ~lib/array.ts:296:8
     (i32.add
      (i32.add
       (i32.load
        ;;@ ~lib/array.ts:296:26
        (get_local $0)
       )
       ;;@ ~lib/array.ts:296:42
       (get_global $~lib/internal/arraybuffer/HEADER_SIZE)
      )
      ;;@ ~lib/array.ts:296:56
      (i32.shl
       ;;@ ~lib/array.ts:296:57
       (get_local $1)
       ;;@ ~lib/array.ts:296:73
       (i32.const 2)
      )
     )
    )
    (set_local $8
     ;;@ ~lib/array.ts:297:8
     (i32.shl
      (get_local $6)
      ;;@ ~lib/array.ts:297:28
      (i32.const 2)
     )
    )
    ;;@ ~lib/memory.ts:20:4
    (call $~lib/internal/memory/memmove
     ;;@ ~lib/memory.ts:20:12
     (get_local $4)
     ;;@ ~lib/memory.ts:20:18
     (get_local $5)
     ;;@ ~lib/memory.ts:20:23
     (get_local $8)
    )
   )
  )
  ;;@ ~lib/array.ts:300:11
  (get_local $7)
 )
 (func $~lib/array/Array<f32>#__get (; 28 ;) (type $iif) (param $0 i32) (param $1 i32) (result f32)
  (local $2 i32)
  ;;@ ~lib/array.ts:70:4
  (set_local $2
   ;;@ ~lib/array.ts:70:17
   (i32.load
    (get_local $0)
   )
  )
  ;;@ ~lib/array.ts:73:23
  (if (result f32)
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
   (block $~lib/internal/arraybuffer/loadUnsafe<f32,f32>|inlined.0 (result f32)
    ;;@ ~lib/internal/arraybuffer.ts:68:91
    (f32.load offset=8
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
 (func $src/service/wasm/get-frequencies/FFT#calculateSpectrum (; 29 ;) (type $iii) (param $0 i32) (param $1 i32) (result i32)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  (local $6 i32)
  (local $7 f32)
  (local $8 f32)
  (local $9 f32)
  (local $10 i32)
  (local $11 f32)
  (local $12 f32)
  (local $13 f32)
  (local $14 f32)
  (local $15 i32)
  (local $16 f32)
  (local $17 f32)
  (local $18 f32)
  (local $19 i32)
  (local $20 i32)
  (local $21 f64)
  ;;@ src/service/wasm/get-frequencies.ts:91:4
  (set_local $2
   ;;@ src/service/wasm/get-frequencies.ts:91:23
   (i32.load
    (get_local $0)
   )
  )
  ;;@ src/service/wasm/get-frequencies.ts:92:4
  (set_local $3
   ;;@ src/service/wasm/get-frequencies.ts:92:21
   (i32.load offset=12
    (get_local $0)
   )
  )
  ;;@ src/service/wasm/get-frequencies.ts:93:4
  (set_local $4
   ;;@ src/service/wasm/get-frequencies.ts:93:21
   (i32.load offset=8
    (get_local $0)
   )
  )
  ;;@ src/service/wasm/get-frequencies.ts:94:4
  (set_local $5
   ;;@ src/service/wasm/get-frequencies.ts:94:25
   (i32.load offset=20
    (get_local $0)
   )
  )
  ;;@ src/service/wasm/get-frequencies.ts:97:4
  (set_local $6
   ;;@ src/service/wasm/get-frequencies.ts:97:16
   (i32.div_s
    (i32.const 2)
    ;;@ src/service/wasm/get-frequencies.ts:97:20
    (i32.load
     (get_local $0)
    )
   )
  )
  ;;@ src/service/wasm/get-frequencies.ts:113:4
  (set_local $10
   ;;@ src/service/wasm/get-frequencies.ts:113:19
   (i32.const 1)
  )
  ;;@ src/service/wasm/get-frequencies.ts:124:4
  (block $break|0
   ;;@ src/service/wasm/get-frequencies.ts:124:9
   (set_local $19
    ;;@ src/service/wasm/get-frequencies.ts:124:17
    (i32.const 0)
   )
   (loop $repeat|0
    (br_if $break|0
     (i32.eqz
      ;;@ src/service/wasm/get-frequencies.ts:124:20
      (i32.lt_s
       (get_local $19)
       ;;@ src/service/wasm/get-frequencies.ts:124:24
       (get_local $2)
      )
     )
    )
    ;;@ src/service/wasm/get-frequencies.ts:124:41
    (block
     ;;@ src/service/wasm/get-frequencies.ts:125:6
     (call $~lib/array/Array<f32>#__set
      (i32.const 256)
      ;;@ src/service/wasm/get-frequencies.ts:125:11
      (get_local $19)
      ;;@ src/service/wasm/get-frequencies.ts:126:8
      (f32.mul
       (call $~lib/array/Array<f32>#__get
        (get_local $1)
        ;;@ src/service/wasm/get-frequencies.ts:126:15
        (call $~lib/array/Array<i32>#__get
         (get_local $5)
         ;;@ src/service/wasm/get-frequencies.ts:126:28
         (get_local $19)
        )
       )
       ;;@ src/service/wasm/get-frequencies.ts:126:34
       (call $~lib/array/Array<f32>#__get
        (i32.load offset=16
         (get_local $0)
        )
        ;;@ src/service/wasm/get-frequencies.ts:126:52
        (call $~lib/array/Array<i32>#__get
         (get_local $5)
         ;;@ src/service/wasm/get-frequencies.ts:126:65
         (get_local $19)
        )
       )
      )
     )
     ;;@ src/service/wasm/get-frequencies.ts:127:6
     (call $~lib/array/Array<f32>#__set
      (i32.const 272)
      ;;@ src/service/wasm/get-frequencies.ts:127:11
      (get_local $19)
      ;;@ src/service/wasm/get-frequencies.ts:127:16
      (f32.const 0)
     )
    )
    ;;@ src/service/wasm/get-frequencies.ts:124:36
    (set_local $19
     (i32.add
      (get_local $19)
      (i32.const 1)
     )
    )
    (br $repeat|0)
   )
  )
  ;;@ src/service/wasm/get-frequencies.ts:130:4
  (block $break|1
   (loop $continue|1
    (if
     ;;@ src/service/wasm/get-frequencies.ts:130:11
     (i32.lt_s
      (get_local $10)
      ;;@ src/service/wasm/get-frequencies.ts:130:22
      (get_local $2)
     )
     (block
      (block
       ;;@ src/service/wasm/get-frequencies.ts:131:6
       (set_local $11
        ;;@ src/service/wasm/get-frequencies.ts:131:27
        (call $~lib/array/Array<f32>#__get
         (get_local $3)
         ;;@ src/service/wasm/get-frequencies.ts:131:36
         (get_local $10)
        )
       )
       ;;@ src/service/wasm/get-frequencies.ts:132:6
       (set_local $12
        ;;@ src/service/wasm/get-frequencies.ts:132:27
        (call $~lib/array/Array<f32>#__get
         (get_local $4)
         ;;@ src/service/wasm/get-frequencies.ts:132:36
         (get_local $10)
        )
       )
       ;;@ src/service/wasm/get-frequencies.ts:134:6
       (set_local $13
        ;;@ src/service/wasm/get-frequencies.ts:134:30
        (f32.const 1)
       )
       ;;@ src/service/wasm/get-frequencies.ts:135:6
       (set_local $14
        ;;@ src/service/wasm/get-frequencies.ts:135:30
        (f32.const 0)
       )
       ;;@ src/service/wasm/get-frequencies.ts:137:6
       (block $break|2
        ;;@ src/service/wasm/get-frequencies.ts:137:11
        (set_local $19
         ;;@ src/service/wasm/get-frequencies.ts:137:25
         (i32.const 0)
        )
        (loop $repeat|2
         (br_if $break|2
          (i32.eqz
           ;;@ src/service/wasm/get-frequencies.ts:137:28
           (i32.lt_s
            (get_local $19)
            ;;@ src/service/wasm/get-frequencies.ts:137:38
            (get_local $10)
           )
          )
         )
         ;;@ src/service/wasm/get-frequencies.ts:137:59
         (block
          ;;@ src/service/wasm/get-frequencies.ts:139:8
          (set_local $20
           ;;@ src/service/wasm/get-frequencies.ts:139:16
           (get_local $19)
          )
          ;;@ src/service/wasm/get-frequencies.ts:141:8
          (block $break|3
           (loop $continue|3
            (if
             ;;@ src/service/wasm/get-frequencies.ts:141:15
             (i32.lt_s
              (get_local $20)
              ;;@ src/service/wasm/get-frequencies.ts:141:19
              (get_local $2)
             )
             (block
              (block
               ;;@ src/service/wasm/get-frequencies.ts:142:10
               (set_local $15
                ;;@ src/service/wasm/get-frequencies.ts:142:16
                (i32.add
                 (get_local $20)
                 ;;@ src/service/wasm/get-frequencies.ts:142:20
                 (get_local $10)
                )
               )
               ;;@ src/service/wasm/get-frequencies.ts:143:10
               (set_local $16
                ;;@ src/service/wasm/get-frequencies.ts:144:14
                (f32.sub
                 (f32.mul
                  (get_local $13)
                  ;;@ src/service/wasm/get-frequencies.ts:144:38
                  (call $~lib/array/Array<f32>#__get
                   (i32.const 256)
                   ;;@ src/service/wasm/get-frequencies.ts:144:43
                   (get_local $15)
                  )
                 )
                 ;;@ src/service/wasm/get-frequencies.ts:145:14
                 (f32.mul
                  (get_local $14)
                  ;;@ src/service/wasm/get-frequencies.ts:145:38
                  (call $~lib/array/Array<f32>#__get
                   (i32.const 272)
                   ;;@ src/service/wasm/get-frequencies.ts:145:43
                   (get_local $15)
                  )
                 )
                )
               )
               ;;@ src/service/wasm/get-frequencies.ts:146:10
               (set_local $17
                ;;@ src/service/wasm/get-frequencies.ts:147:14
                (f32.add
                 (f32.mul
                  (get_local $13)
                  ;;@ src/service/wasm/get-frequencies.ts:147:38
                  (call $~lib/array/Array<f32>#__get
                   (i32.const 272)
                   ;;@ src/service/wasm/get-frequencies.ts:147:43
                   (get_local $15)
                  )
                 )
                 ;;@ src/service/wasm/get-frequencies.ts:148:14
                 (f32.mul
                  (get_local $14)
                  ;;@ src/service/wasm/get-frequencies.ts:148:38
                  (call $~lib/array/Array<f32>#__get
                   (i32.const 256)
                   ;;@ src/service/wasm/get-frequencies.ts:148:43
                   (get_local $15)
                  )
                 )
                )
               )
               ;;@ src/service/wasm/get-frequencies.ts:150:10
               (call $~lib/array/Array<f32>#__set
                (i32.const 256)
                ;;@ src/service/wasm/get-frequencies.ts:150:15
                (get_local $15)
                ;;@ src/service/wasm/get-frequencies.ts:150:22
                (f32.sub
                 (call $~lib/array/Array<f32>#__get
                  (i32.const 256)
                  ;;@ src/service/wasm/get-frequencies.ts:150:27
                  (get_local $20)
                 )
                 ;;@ src/service/wasm/get-frequencies.ts:150:32
                 (get_local $16)
                )
               )
               ;;@ src/service/wasm/get-frequencies.ts:151:10
               (call $~lib/array/Array<f32>#__set
                (i32.const 272)
                ;;@ src/service/wasm/get-frequencies.ts:151:15
                (get_local $15)
                ;;@ src/service/wasm/get-frequencies.ts:151:22
                (f32.sub
                 (call $~lib/array/Array<f32>#__get
                  (i32.const 272)
                  ;;@ src/service/wasm/get-frequencies.ts:151:27
                  (get_local $20)
                 )
                 ;;@ src/service/wasm/get-frequencies.ts:151:32
                 (get_local $17)
                )
               )
               ;;@ src/service/wasm/get-frequencies.ts:152:10
               (call $~lib/array/Array<f32>#__set
                (i32.const 256)
                ;;@ src/service/wasm/get-frequencies.ts:152:15
                (get_local $20)
                (f32.add
                 ;;@ src/service/wasm/get-frequencies.ts:152:10
                 (call $~lib/array/Array<f32>#__get
                  (i32.const 256)
                  (get_local $20)
                 )
                 ;;@ src/service/wasm/get-frequencies.ts:152:21
                 (get_local $16)
                )
               )
               ;;@ src/service/wasm/get-frequencies.ts:153:10
               (call $~lib/array/Array<f32>#__set
                (i32.const 272)
                ;;@ src/service/wasm/get-frequencies.ts:153:15
                (get_local $20)
                (f32.add
                 ;;@ src/service/wasm/get-frequencies.ts:153:10
                 (call $~lib/array/Array<f32>#__get
                  (i32.const 272)
                  (get_local $20)
                 )
                 ;;@ src/service/wasm/get-frequencies.ts:153:21
                 (get_local $17)
                )
               )
               ;;@ src/service/wasm/get-frequencies.ts:156:10
               (set_local $20
                (i32.add
                 (get_local $20)
                 ;;@ src/service/wasm/get-frequencies.ts:156:15
                 (i32.shl
                  (get_local $10)
                  ;;@ src/service/wasm/get-frequencies.ts:156:27
                  (i32.const 1)
                 )
                )
               )
              )
              (br $continue|3)
             )
            )
           )
          )
          ;;@ src/service/wasm/get-frequencies.ts:159:8
          (set_local $18
           ;;@ src/service/wasm/get-frequencies.ts:159:18
           (get_local $13)
          )
          ;;@ src/service/wasm/get-frequencies.ts:160:8
          (set_local $13
           ;;@ src/service/wasm/get-frequencies.ts:161:10
           (f32.sub
            (f32.mul
             (get_local $18)
             ;;@ src/service/wasm/get-frequencies.ts:161:20
             (get_local $11)
            )
            ;;@ src/service/wasm/get-frequencies.ts:162:10
            (f32.mul
             (get_local $14)
             ;;@ src/service/wasm/get-frequencies.ts:162:34
             (get_local $12)
            )
           )
          )
          ;;@ src/service/wasm/get-frequencies.ts:163:8
          (set_local $14
           ;;@ src/service/wasm/get-frequencies.ts:164:10
           (f32.add
            (f32.mul
             (get_local $18)
             ;;@ src/service/wasm/get-frequencies.ts:164:20
             (get_local $12)
            )
            ;;@ src/service/wasm/get-frequencies.ts:165:10
            (f32.mul
             (get_local $14)
             ;;@ src/service/wasm/get-frequencies.ts:165:34
             (get_local $11)
            )
           )
          )
         )
         ;;@ src/service/wasm/get-frequencies.ts:137:48
         (set_local $19
          (i32.add
           (get_local $19)
           (i32.const 1)
          )
         )
         (br $repeat|2)
        )
       )
       ;;@ src/service/wasm/get-frequencies.ts:169:6
       (set_local $10
        ;;@ src/service/wasm/get-frequencies.ts:169:17
        (i32.shl
         (get_local $10)
         ;;@ src/service/wasm/get-frequencies.ts:169:29
         (i32.const 1)
        )
       )
      )
      (br $continue|1)
     )
    )
   )
  )
  ;;@ src/service/wasm/get-frequencies.ts:173:4
  (block $break|4
   (block
    (set_local $19
     ;;@ src/service/wasm/get-frequencies.ts:173:17
     (i32.const 0)
    )
    (set_local $20
     ;;@ src/service/wasm/get-frequencies.ts:173:24
     (i32.div_s
      (get_local $2)
      ;;@ src/service/wasm/get-frequencies.ts:173:37
      (i32.const 2)
     )
    )
   )
   (loop $repeat|4
    (br_if $break|4
     (i32.eqz
      ;;@ src/service/wasm/get-frequencies.ts:173:40
      (i32.lt_s
       (get_local $19)
       ;;@ src/service/wasm/get-frequencies.ts:173:44
       (get_local $20)
      )
     )
    )
    ;;@ src/service/wasm/get-frequencies.ts:173:52
    (block
     ;;@ src/service/wasm/get-frequencies.ts:174:6
     (set_local $7
      ;;@ src/service/wasm/get-frequencies.ts:174:13
      (call $~lib/array/Array<f32>#__get
       (i32.const 256)
       ;;@ src/service/wasm/get-frequencies.ts:174:18
       (get_local $19)
      )
     )
     ;;@ src/service/wasm/get-frequencies.ts:175:6
     (set_local $8
      ;;@ src/service/wasm/get-frequencies.ts:175:13
      (call $~lib/array/Array<f32>#__get
       (i32.const 272)
       ;;@ src/service/wasm/get-frequencies.ts:175:18
       (get_local $19)
      )
     )
     ;;@ src/service/wasm/get-frequencies.ts:176:6
     (set_local $9
      ;;@ src/service/wasm/get-frequencies.ts:176:12
      (f32.mul
       (f32.convert_s/i32
        (get_local $6)
       )
       ;;@ src/service/wasm/get-frequencies.ts:176:23
       (f32.demote/f64
        (block $~lib/math/NativeMath.sqrt|inlined.0 (result f64)
         (set_local $21
          ;;@ src/service/wasm/get-frequencies.ts:176:38
          (f64.promote/f32
           (f32.add
            (f32.mul
             (get_local $7)
             ;;@ src/service/wasm/get-frequencies.ts:176:45
             (get_local $7)
            )
            ;;@ src/service/wasm/get-frequencies.ts:176:52
            (f32.mul
             (get_local $8)
             ;;@ src/service/wasm/get-frequencies.ts:176:59
             (get_local $8)
            )
           )
          )
         )
         ;;@ ~lib/math.ts:1076:30
         (f64.sqrt
          ;;@ ~lib/math.ts:1076:29
          (get_local $21)
         )
        )
       )
      )
     )
     ;;@ src/service/wasm/get-frequencies.ts:178:6
     (if
      ;;@ src/service/wasm/get-frequencies.ts:178:10
      (f32.gt
       (get_local $9)
       ;;@ src/service/wasm/get-frequencies.ts:178:16
       (f32.load offset=28
        (get_local $0)
       )
      )
      ;;@ src/service/wasm/get-frequencies.ts:178:27
      (block
       ;;@ src/service/wasm/get-frequencies.ts:179:10
       (i32.store offset=24
        (get_local $0)
        ;;@ src/service/wasm/get-frequencies.ts:179:26
        (get_local $19)
       )
       ;;@ src/service/wasm/get-frequencies.ts:180:10
       (f32.store offset=28
        (get_local $0)
        ;;@ src/service/wasm/get-frequencies.ts:180:22
        (get_local $9)
       )
      )
     )
     ;;@ src/service/wasm/get-frequencies.ts:182:6
     (call $~lib/array/Array<f32>#__set
      (i32.const 288)
      ;;@ src/service/wasm/get-frequencies.ts:182:15
      (get_local $19)
      ;;@ src/service/wasm/get-frequencies.ts:182:20
      (get_local $9)
     )
    )
    ;;@ src/service/wasm/get-frequencies.ts:173:47
    (set_local $19
     (i32.add
      (get_local $19)
      (i32.const 1)
     )
    )
    (br $repeat|4)
   )
  )
  ;;@ src/service/wasm/get-frequencies.ts:184:11
  (i32.const 288)
 )
 (func $~lib/math/NativeMath.log10 (; 30 ;) (type $FF) (param $0 f64) (result f64)
  (local $1 i64)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 f64)
  (local $6 f64)
  (local $7 f64)
  (local $8 f64)
  (local $9 f64)
  (local $10 f64)
  (local $11 f64)
  (local $12 f64)
  (local $13 f64)
  (local $14 f64)
  (local $15 f64)
  (local $16 f64)
  (local $17 f64)
  (local $18 f64)
  ;;@ ~lib/math.ts:649:4
  (set_local $1
   ;;@ ~lib/math.ts:649:12
   (i64.reinterpret/f64
    ;;@ ~lib/math.ts:649:29
    (get_local $0)
   )
  )
  ;;@ ~lib/math.ts:650:4
  (set_local $2
   ;;@ ~lib/math.ts:650:13
   (i32.wrap/i64
    ;;@ ~lib/math.ts:650:19
    (i64.shr_u
     (get_local $1)
     ;;@ ~lib/math.ts:650:24
     (i64.const 32)
    )
   )
  )
  ;;@ ~lib/math.ts:651:4
  (set_local $3
   ;;@ ~lib/math.ts:651:12
   (i32.const 0)
  )
  ;;@ ~lib/math.ts:652:4
  (if
   ;;@ ~lib/math.ts:652:8
   (if (result i32)
    (tee_local $4
     (i32.lt_u
      (get_local $2)
      ;;@ ~lib/math.ts:652:13
      (i32.const 1048576)
     )
    )
    (get_local $4)
    ;;@ ~lib/math.ts:652:27
    (i32.shr_u
     ;;@ ~lib/math.ts:652:34
     (get_local $2)
     ;;@ ~lib/math.ts:652:40
     (i32.const 31)
    )
   )
   ;;@ ~lib/math.ts:652:45
   (block
    ;;@ ~lib/math.ts:653:6
    (if
     ;;@ ~lib/math.ts:653:10
     (i64.eq
      (i64.shl
       (get_local $1)
       ;;@ ~lib/math.ts:653:15
       (i64.const 1)
      )
      ;;@ ~lib/math.ts:653:20
      (i64.const 0)
     )
     ;;@ ~lib/math.ts:653:41
     (return
      ;;@ ~lib/math.ts:653:30
      (f64.div
       (f64.const -1)
       ;;@ ~lib/math.ts:653:35
       (f64.mul
        ;;@ ~lib/math.ts:653:36
        (get_local $0)
        ;;@ ~lib/math.ts:653:40
        (get_local $0)
       )
      )
     )
    )
    ;;@ ~lib/math.ts:654:6
    (if
     ;;@ ~lib/math.ts:654:10
     (i32.shr_u
      (get_local $2)
      ;;@ ~lib/math.ts:654:16
      (i32.const 31)
     )
     ;;@ ~lib/math.ts:654:37
     (return
      ;;@ ~lib/math.ts:654:27
      (f64.div
       (f64.sub
        ;;@ ~lib/math.ts:654:28
        (get_local $0)
        ;;@ ~lib/math.ts:654:32
        (get_local $0)
       )
       ;;@ ~lib/math.ts:654:37
       (f64.const 0)
      )
     )
    )
    ;;@ ~lib/math.ts:655:6
    (set_local $3
     (i32.sub
      (get_local $3)
      ;;@ ~lib/math.ts:655:11
      (i32.const 54)
     )
    )
    ;;@ ~lib/math.ts:656:6
    (set_local $0
     (f64.mul
      (get_local $0)
      ;;@ ~lib/math.ts:656:11
      (f64.const 18014398509481984)
     )
    )
    ;;@ ~lib/math.ts:657:6
    (set_local $1
     ;;@ ~lib/math.ts:657:10
     (i64.reinterpret/f64
      ;;@ ~lib/math.ts:657:27
      (get_local $0)
     )
    )
    ;;@ ~lib/math.ts:658:6
    (set_local $2
     ;;@ ~lib/math.ts:658:11
     (i32.wrap/i64
      ;;@ ~lib/math.ts:658:17
      (i64.shr_u
       (get_local $1)
       ;;@ ~lib/math.ts:658:22
       (i64.const 32)
      )
     )
    )
   )
   ;;@ ~lib/math.ts:659:11
   (if
    ;;@ ~lib/math.ts:659:15
    (i32.ge_u
     (get_local $2)
     ;;@ ~lib/math.ts:659:21
     (i32.const 2146435072)
    )
    ;;@ ~lib/math.ts:659:40
    (return
     (get_local $0)
    )
    ;;@ ~lib/math.ts:660:11
    (if
     ;;@ ~lib/math.ts:660:15
     (if (result i32)
      (tee_local $4
       (i32.eq
        (get_local $2)
        ;;@ ~lib/math.ts:660:21
        (i32.const 1072693248)
       )
      )
      ;;@ ~lib/math.ts:660:35
      (i64.eq
       (i64.shl
        (get_local $1)
        ;;@ ~lib/math.ts:660:40
        (i64.const 32)
       )
       ;;@ ~lib/math.ts:660:46
       (i64.const 0)
      )
      (get_local $4)
     )
     ;;@ ~lib/math.ts:660:56
     (return
      (f64.const 0)
     )
    )
   )
  )
  ;;@ ~lib/math.ts:661:4
  (set_local $2
   (i32.add
    (get_local $2)
    ;;@ ~lib/math.ts:661:10
    (i32.sub
     (i32.const 1072693248)
     ;;@ ~lib/math.ts:661:23
     (i32.const 1072079006)
    )
   )
  )
  ;;@ ~lib/math.ts:662:4
  (set_local $3
   (i32.add
    (get_local $3)
    ;;@ ~lib/math.ts:662:9
    (i32.sub
     (i32.shr_u
      ;;@ ~lib/math.ts:662:15
      (get_local $2)
      ;;@ ~lib/math.ts:662:21
      (i32.const 20)
     )
     ;;@ ~lib/math.ts:662:27
     (i32.const 1023)
    )
   )
  )
  ;;@ ~lib/math.ts:663:4
  (set_local $2
   ;;@ ~lib/math.ts:663:9
   (i32.add
    (i32.and
     ;;@ ~lib/math.ts:663:10
     (get_local $2)
     ;;@ ~lib/math.ts:663:15
     (i32.const 1048575)
    )
    ;;@ ~lib/math.ts:663:29
    (i32.const 1072079006)
   )
  )
  ;;@ ~lib/math.ts:664:4
  (set_local $1
   ;;@ ~lib/math.ts:664:8
   (i64.or
    (i64.shl
     (i64.extend_u/i32
      (get_local $2)
     )
     ;;@ ~lib/math.ts:664:19
     (i64.const 32)
    )
    ;;@ ~lib/math.ts:664:24
    (i64.and
     ;;@ ~lib/math.ts:664:25
     (get_local $1)
     ;;@ ~lib/math.ts:664:29
     (i64.const 4294967295)
    )
   )
  )
  ;;@ ~lib/math.ts:665:4
  (set_local $0
   ;;@ ~lib/math.ts:665:8
   (f64.reinterpret/i64
    ;;@ ~lib/math.ts:665:25
    (get_local $1)
   )
  )
  ;;@ ~lib/math.ts:666:4
  (set_local $5
   ;;@ ~lib/math.ts:666:12
   (f64.sub
    (get_local $0)
    ;;@ ~lib/math.ts:666:16
    (f64.const 1)
   )
  )
  ;;@ ~lib/math.ts:667:4
  (set_local $6
   ;;@ ~lib/math.ts:667:15
   (f64.mul
    (f64.mul
     (f64.const 0.5)
     ;;@ ~lib/math.ts:667:21
     (get_local $5)
    )
    ;;@ ~lib/math.ts:667:25
    (get_local $5)
   )
  )
  ;;@ ~lib/math.ts:668:4
  (set_local $7
   ;;@ ~lib/math.ts:668:12
   (f64.div
    (get_local $5)
    ;;@ ~lib/math.ts:668:16
    (f64.add
     ;;@ ~lib/math.ts:668:17
     (f64.const 2)
     ;;@ ~lib/math.ts:668:23
     (get_local $5)
    )
   )
  )
  ;;@ ~lib/math.ts:669:4
  (set_local $8
   ;;@ ~lib/math.ts:669:12
   (f64.mul
    (get_local $7)
    ;;@ ~lib/math.ts:669:16
    (get_local $7)
   )
  )
  ;;@ ~lib/math.ts:670:4
  (set_local $9
   ;;@ ~lib/math.ts:670:12
   (f64.mul
    (get_local $8)
    ;;@ ~lib/math.ts:670:16
    (get_local $8)
   )
  )
  ;;@ ~lib/math.ts:671:4
  (set_local $10
   ;;@ ~lib/math.ts:671:13
   (f64.mul
    (get_local $9)
    ;;@ ~lib/math.ts:671:17
    (f64.add
     ;;@ ~lib/math.ts:671:18
     (f64.const 0.3999999999940942)
     ;;@ ~lib/math.ts:671:24
     (f64.mul
      (get_local $9)
      ;;@ ~lib/math.ts:671:28
      (f64.add
       ;;@ ~lib/math.ts:671:29
       (f64.const 0.22222198432149784)
       ;;@ ~lib/math.ts:671:35
       (f64.mul
        (get_local $9)
        ;;@ ~lib/math.ts:671:39
        (f64.const 0.15313837699209373)
       )
      )
     )
    )
   )
  )
  ;;@ ~lib/math.ts:672:4
  (set_local $11
   ;;@ ~lib/math.ts:672:13
   (f64.mul
    (get_local $8)
    ;;@ ~lib/math.ts:672:17
    (f64.add
     ;;@ ~lib/math.ts:672:18
     (f64.const 0.6666666666666735)
     ;;@ ~lib/math.ts:672:24
     (f64.mul
      (get_local $9)
      ;;@ ~lib/math.ts:672:28
      (f64.add
       ;;@ ~lib/math.ts:672:29
       (f64.const 0.2857142874366239)
       ;;@ ~lib/math.ts:672:35
       (f64.mul
        (get_local $9)
        ;;@ ~lib/math.ts:672:39
        (f64.add
         ;;@ ~lib/math.ts:672:40
         (f64.const 0.1818357216161805)
         ;;@ ~lib/math.ts:672:46
         (f64.mul
          (get_local $9)
          ;;@ ~lib/math.ts:672:50
          (f64.const 0.14798198605116586)
         )
        )
       )
      )
     )
    )
   )
  )
  ;;@ ~lib/math.ts:673:4
  (set_local $12
   ;;@ ~lib/math.ts:673:12
   (f64.add
    (get_local $11)
    ;;@ ~lib/math.ts:673:17
    (get_local $10)
   )
  )
  ;;@ ~lib/math.ts:674:4
  (set_local $13
   ;;@ ~lib/math.ts:674:13
   (f64.sub
    (get_local $5)
    ;;@ ~lib/math.ts:674:17
    (get_local $6)
   )
  )
  ;;@ ~lib/math.ts:675:4
  (set_local $1
   ;;@ ~lib/math.ts:675:8
   (i64.reinterpret/f64
    ;;@ ~lib/math.ts:675:25
    (get_local $13)
   )
  )
  ;;@ ~lib/math.ts:676:4
  (set_local $1
   (i64.and
    (get_local $1)
    ;;@ ~lib/math.ts:676:9
    (i64.const -4294967296)
   )
  )
  ;;@ ~lib/math.ts:677:4
  (set_local $13
   ;;@ ~lib/math.ts:677:9
   (f64.reinterpret/i64
    ;;@ ~lib/math.ts:677:26
    (get_local $1)
   )
  )
  ;;@ ~lib/math.ts:678:4
  (set_local $14
   ;;@ ~lib/math.ts:678:13
   (f64.add
    (f64.sub
     (f64.sub
      (get_local $5)
      ;;@ ~lib/math.ts:678:17
      (get_local $13)
     )
     ;;@ ~lib/math.ts:678:22
     (get_local $6)
    )
    ;;@ ~lib/math.ts:678:29
    (f64.mul
     (get_local $7)
     ;;@ ~lib/math.ts:678:33
     (f64.add
      ;;@ ~lib/math.ts:678:34
      (get_local $6)
      ;;@ ~lib/math.ts:678:41
      (get_local $12)
     )
    )
   )
  )
  ;;@ ~lib/math.ts:679:4
  (set_local $15
   ;;@ ~lib/math.ts:679:17
   (f64.mul
    (get_local $13)
    ;;@ ~lib/math.ts:679:22
    (f64.const 0.4342944818781689)
   )
  )
  ;;@ ~lib/math.ts:680:4
  (set_local $16
   ;;@ ~lib/math.ts:680:13
   (f64.convert_s/i32
    (get_local $3)
   )
  )
  ;;@ ~lib/math.ts:681:4
  (set_local $17
   ;;@ ~lib/math.ts:681:12
   (f64.mul
    (get_local $16)
    ;;@ ~lib/math.ts:681:17
    (f64.const 0.30102999566361177)
   )
  )
  ;;@ ~lib/math.ts:682:4
  (set_local $18
   ;;@ ~lib/math.ts:682:17
   (f64.add
    (f64.add
     (f64.mul
      (get_local $16)
      ;;@ ~lib/math.ts:682:22
      (f64.const 3.694239077158931e-13)
     )
     ;;@ ~lib/math.ts:682:34
     (f64.mul
      (f64.add
       ;;@ ~lib/math.ts:682:35
       (get_local $14)
       ;;@ ~lib/math.ts:682:40
       (get_local $13)
      )
      ;;@ ~lib/math.ts:682:46
      (f64.const 2.5082946711645275e-11)
     )
    )
    ;;@ ~lib/math.ts:682:57
    (f64.mul
     (get_local $14)
     ;;@ ~lib/math.ts:682:62
     (f64.const 0.4342944818781689)
    )
   )
  )
  ;;@ ~lib/math.ts:683:4
  (set_local $9
   ;;@ ~lib/math.ts:683:8
   (f64.add
    (get_local $17)
    ;;@ ~lib/math.ts:683:12
    (get_local $15)
   )
  )
  ;;@ ~lib/math.ts:684:4
  (set_local $18
   (f64.add
    (get_local $18)
    ;;@ ~lib/math.ts:684:14
    (f64.add
     (f64.sub
      ;;@ ~lib/math.ts:684:15
      (get_local $17)
      ;;@ ~lib/math.ts:684:19
      (get_local $9)
     )
     ;;@ ~lib/math.ts:684:24
     (get_local $15)
    )
   )
  )
  ;;@ ~lib/math.ts:685:4
  (set_local $15
   ;;@ ~lib/math.ts:685:13
   (get_local $9)
  )
  ;;@ ~lib/math.ts:686:20
  (f64.add
   ;;@ ~lib/math.ts:686:11
   (get_local $18)
   ;;@ ~lib/math.ts:686:20
   (get_local $15)
  )
 )
 (func $~lib/array/Array<u8>#__set (; 31 ;) (type $iiiv) (param $0 i32) (param $1 i32) (param $2 i32)
  (local $3 i32)
  (local $4 i32)
  ;;@ ~lib/array.ts:83:4
  (set_local $3
   ;;@ ~lib/array.ts:83:17
   (i32.load
    (get_local $0)
   )
  )
  ;;@ ~lib/array.ts:84:4
  (set_local $4
   ;;@ ~lib/array.ts:84:19
   (i32.shr_u
    (i32.load
     (get_local $3)
    )
    ;;@ ~lib/array.ts:84:41
    (i32.const 0)
   )
  )
  ;;@ ~lib/array.ts:85:4
  (if
   ;;@ ~lib/array.ts:85:8
   (i32.ge_u
    (get_local $1)
    ;;@ ~lib/array.ts:85:22
    (get_local $4)
   )
   ;;@ ~lib/array.ts:85:37
   (block
    ;;@ ~lib/array.ts:87:6
    (if
     ;;@ ~lib/array.ts:87:10
     (i32.ge_u
      (get_local $1)
      ;;@ ~lib/array.ts:87:24
      (i32.const 1073741816)
     )
     ;;@ ~lib/array.ts:87:41
     (block
      (call $~lib/env/abort
       (i32.const 0)
       (i32.const 152)
       (i32.const 87)
       (i32.const 41)
      )
      (unreachable)
     )
    )
    ;;@ ~lib/array.ts:88:6
    (set_local $3
     ;;@ ~lib/array.ts:88:15
     (call $~lib/internal/arraybuffer/reallocateUnsafe
      ;;@ ~lib/array.ts:88:32
      (get_local $3)
      ;;@ ~lib/array.ts:88:40
      (i32.shl
       (i32.add
        ;;@ ~lib/array.ts:88:41
        (get_local $1)
        ;;@ ~lib/array.ts:88:49
        (i32.const 1)
       )
       ;;@ ~lib/array.ts:88:55
       (i32.const 0)
      )
     )
    )
    ;;@ ~lib/array.ts:89:6
    (i32.store
     (get_local $0)
     ;;@ ~lib/array.ts:89:21
     (get_local $3)
    )
    ;;@ ~lib/array.ts:90:6
    (i32.store offset=4
     (get_local $0)
     ;;@ ~lib/array.ts:90:21
     (i32.add
      (get_local $1)
      ;;@ ~lib/array.ts:90:29
      (i32.const 1)
     )
    )
   )
  )
  ;;@ ~lib/array.ts:92:4
  (block $~lib/internal/arraybuffer/storeUnsafe<u8,u8>|inlined.0
   ;;@ ~lib/internal/arraybuffer.ts:72:2
   (i32.store8 offset=8
    ;;@ ~lib/internal/arraybuffer.ts:72:11
    (i32.add
     (get_local $3)
     ;;@ ~lib/internal/arraybuffer.ts:72:39
     (i32.shl
      ;;@ ~lib/internal/arraybuffer.ts:72:40
      (get_local $1)
      ;;@ ~lib/internal/arraybuffer.ts:72:56
      (i32.const 0)
     )
    )
    ;;@ ~lib/internal/arraybuffer.ts:72:71
    (get_local $2)
   )
  )
 )
 (func $src/service/wasm/get-frequencies/getFrequencies (; 32 ;) (type $iiiiiii) (param $0 i32) (param $1 i32) (param $2 i32) (param $3 i32) (param $4 i32) (param $5 i32) (result i32)
  (local $6 i32)
  (local $7 f64)
  (local $8 f64)
  (local $9 i32)
  (local $10 i32)
  (local $11 i32)
  (local $12 i32)
  (local $13 i32)
  (local $14 i32)
  ;;@ src/service/wasm/get-frequencies.ts:204:2
  (if
   ;;@ src/service/wasm/get-frequencies.ts:204:6
   (i32.eqz
    ;;@ src/service/wasm/get-frequencies.ts:204:7
    (get_local $1)
   )
   ;;@ src/service/wasm/get-frequencies.ts:204:19
   (block
    (call $~lib/env/abort
     (i32.const 0)
     (i32.const 8)
     (i32.const 205)
     (i32.const 4)
    )
    (unreachable)
   )
  )
  ;;@ src/service/wasm/get-frequencies.ts:208:2
  (set_local $6
   ;;@ src/service/wasm/get-frequencies.ts:208:29
   (i32.div_s
    (get_local $2)
    ;;@ src/service/wasm/get-frequencies.ts:208:38
    (get_local $4)
   )
  )
  ;;@ src/service/wasm/get-frequencies.ts:209:2
  (set_local $9
   ;;@ src/service/wasm/get-frequencies.ts:209:19
   (i32.trunc_s/f64
    (block $~lib/math/NativeMath.max|inlined.0 (result f64)
     (set_local $7
      ;;@ src/service/wasm/get-frequencies.ts:209:33
      (f64.const 0)
     )
     (set_local $8
      ;;@ src/service/wasm/get-frequencies.ts:209:41
      (call $~lib/math/NativeMath.round
       ;;@ src/service/wasm/get-frequencies.ts:209:47
       (f64.promote/f32
        (f32.sub
         (f32.convert_s/i32
          (get_local $0)
         )
         ;;@ src/service/wasm/get-frequencies.ts:209:65
         (f32.convert_s/i32
          (get_local $6)
         )
        )
       )
      )
     )
     (f64.max
      (get_local $7)
      (get_local $8)
     )
    )
   )
  )
  ;;@ src/service/wasm/get-frequencies.ts:211:2
  (set_local $10
   ;;@ src/service/wasm/get-frequencies.ts:211:14
   (call $src/service/wasm/get-frequencies/FFT#constructor
    (i32.const 0)
    ;;@ src/service/wasm/get-frequencies.ts:211:22
    (get_local $0)
    ;;@ src/service/wasm/get-frequencies.ts:211:34
    (get_local $3)
    ;;@ src/service/wasm/get-frequencies.ts:211:46
    (f32.const 0.05000000074505806)
   )
  )
  ;;@ src/service/wasm/get-frequencies.ts:212:2
  (set_local $11
   ;;@ src/service/wasm/get-frequencies.ts:212:27
   (i32.const 0)
  )
  ;;@ src/service/wasm/get-frequencies.ts:214:2
  (block $break|0
   (loop $continue|0
    (if
     ;;@ src/service/wasm/get-frequencies.ts:214:9
     (i32.lt_s
      (i32.add
       (get_local $11)
       ;;@ src/service/wasm/get-frequencies.ts:214:25
       (get_local $0)
      )
      ;;@ src/service/wasm/get-frequencies.ts:214:38
      (get_local $2)
     )
     (block
      (block
       ;;@ src/service/wasm/get-frequencies.ts:215:4
       (set_local $12
        ;;@ src/service/wasm/get-frequencies.ts:215:31
        (call $~lib/array/Array<f32>#slice
         ;;@ src/service/wasm/get-frequencies.ts:215:20
         (get_local $1)
         ;;@ src/service/wasm/get-frequencies.ts:216:8
         (get_local $11)
         ;;@ src/service/wasm/get-frequencies.ts:217:8
         (i32.add
          (get_local $11)
          ;;@ src/service/wasm/get-frequencies.ts:217:24
          (get_local $0)
         )
        )
       )
       ;;@ src/service/wasm/get-frequencies.ts:219:4
       (set_local $13
        ;;@ src/service/wasm/get-frequencies.ts:219:25
        (call $src/service/wasm/get-frequencies/FFT#calculateSpectrum
         ;;@ src/service/wasm/get-frequencies.ts:219:21
         (get_local $10)
         ;;@ src/service/wasm/get-frequencies.ts:219:43
         (get_local $12)
        )
       )
       ;;@ src/service/wasm/get-frequencies.ts:220:4
       (block $break|1
        ;;@ src/service/wasm/get-frequencies.ts:220:9
        (set_local $14
         ;;@ src/service/wasm/get-frequencies.ts:220:22
         (i32.const 0)
        )
        (loop $repeat|1
         (br_if $break|1
          (i32.eqz
           ;;@ src/service/wasm/get-frequencies.ts:220:25
           (i32.lt_s
            (get_local $14)
            ;;@ src/service/wasm/get-frequencies.ts:220:29
            (i32.div_s
             (get_local $0)
             ;;@ src/service/wasm/get-frequencies.ts:220:42
             (i32.const 2)
            )
           )
          )
         )
         ;;@ src/service/wasm/get-frequencies.ts:221:8
         (call $~lib/array/Array<u8>#__set
          (get_local $5)
          ;;@ src/service/wasm/get-frequencies.ts:221:20
          (i32.mul
           (get_local $14)
           ;;@ src/service/wasm/get-frequencies.ts:221:24
           (i32.add
            ;;@ src/service/wasm/get-frequencies.ts:221:25
            (get_local $11)
            ;;@ src/service/wasm/get-frequencies.ts:221:41
            (i32.const 1)
           )
          )
          ;;@ src/service/wasm/get-frequencies.ts:221:47
          (i32.trunc_u/f64
           (block $~lib/math/NativeMath.max|inlined.1 (result f64)
            (set_local $8
             ;;@ src/service/wasm/get-frequencies.ts:221:60
             (f64.const -255)
            )
            (set_local $7
             ;;@ src/service/wasm/get-frequencies.ts:221:66
             (f64.mul
              ;;@ src/service/wasm/get-frequencies.ts:221:71
              (call $~lib/math/NativeMath.log10
               ;;@ src/service/wasm/get-frequencies.ts:221:77
               (f64.promote/f32
                (call $~lib/array/Array<f32>#__get
                 (get_local $13)
                 ;;@ src/service/wasm/get-frequencies.ts:221:86
                 (get_local $14)
                )
               )
              )
              ;;@ src/service/wasm/get-frequencies.ts:221:92
              (f64.const 45)
             )
            )
            ;;@ ~lib/math.ts:794:42
            (f64.max
             ;;@ ~lib/math.ts:794:28
             (get_local $8)
             ;;@ ~lib/math.ts:794:36
             (get_local $7)
            )
           )
          )
         )
         ;;@ src/service/wasm/get-frequencies.ts:220:45
         (set_local $14
          (i32.add
           (get_local $14)
           (i32.const 1)
          )
         )
         (br $repeat|1)
        )
       )
       ;;@ src/service/wasm/get-frequencies.ts:223:4
       (set_local $11
        (i32.add
         (get_local $11)
         ;;@ src/service/wasm/get-frequencies.ts:223:21
         (i32.sub
          (get_local $0)
          ;;@ src/service/wasm/get-frequencies.ts:223:34
          (get_local $9)
         )
        )
       )
      )
      (br $continue|0)
     )
    )
   )
  )
  ;;@ src/service/wasm/get-frequencies.ts:226:9
  (get_local $5)
 )
 (func $start (; 33 ;) (type $v)
  (set_global $~lib/allocator/arena/startOffset
   ;;@ ~lib/allocator/arena.ts:12:25
   (i32.and
    (i32.add
     ;;@ ~lib/allocator/arena.ts:12:26
     (get_global $HEAP_BASE)
     ;;@ ~lib/allocator/arena.ts:12:38
     (get_global $~lib/internal/allocator/AL_MASK)
    )
    ;;@ ~lib/allocator/arena.ts:12:49
    (i32.xor
     ;;@ ~lib/allocator/arena.ts:12:50
     (get_global $~lib/internal/allocator/AL_MASK)
     (i32.const -1)
    )
   )
  )
  (set_global $~lib/allocator/arena/offset
   ;;@ ~lib/allocator/arena.ts:13:20
   (get_global $~lib/allocator/arena/startOffset)
  )
 )
 (func $null (; 34 ;) (type $v)
 )
)
