function splash() {
  const canvas = document.getElementById("fancy-canvas");

  let config = {
    SIM_RESOLUTION: 128,
    DYE_RESOLUTION: 512,
    DENSITY_DISSIPATION: 0.945,
    VELOCITY_DISSIPATION: 0.98,
    PRESSURE_DISSIPATION: 0.8,
    PRESSURE_ITERATIONS: 20,
    CURL: 30,
    SPLAT_RADIUS: 0.56,
    SHADING: false,
    COLORFUL: false,
    PAUSED: false,
    BACK_COLOR: {
      r: 0,
      g: 0,
      b: 0
    },
    TRANSPARENT: false,
    BLOOM: true,
    BLOOM_ITERATIONS: 8,
    BLOOM_RESOLUTION: 256,
    BLOOM_INTENSITY: 0.5,
    BLOOM_THRESHOLD: 0.5,
    BLOOM_SOFT_KNEE: 0.7
  };

  function pointerPrototype() {
    this.id = -1;
    this.x = 0;
    this.y = 0;
    this.dx = 0;
    this.dy = 0;
    this.down = false;
    this.moved = false;
    this.color = [30, 0, 300];
  }

  let pointers = [];
  let splatStack = [];
  let bloomFramebuffers = [];
  pointers.push(new pointerPrototype());

  const {
    gl,
    ext
  } = getWebGLContext(canvas);

  if (isMobile()) config.SHADING = false;
  if (!ext.supportLinearFiltering) {
    config.SHADING = false;
    config.BLOOM = false;
  }

  window.splatStack = splatStack;

  function getWebGLContext(canvas) {
    const params = {
      alpha: true,
      depth: false,
      stencil: false,
      antialias: false,
      preserveDrawingBuffer: false
    };

    let gl = canvas.getContext("webgl2", params);
    const isWebGL2 = !!gl;
    if (!isWebGL2)
      gl =
      canvas.getContext("webgl", params) ||
      canvas.getContext("experimental-webgl", params);

    let halfFloat;
    let supportLinearFiltering;
    if (isWebGL2) {
      gl.getExtension("EXT_color_buffer_float");
      supportLinearFiltering = gl.getExtension(
        "OES_texture_float_linear"
      );
    } else {
      halfFloat = gl.getExtension("OES_texture_half_float");
      supportLinearFiltering = gl.getExtension(
        "OES_texture_half_float_linear"
      );
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    const halfFloatTexType = isWebGL2 ?
      gl.HALF_FLOAT :
      halfFloat.HALF_FLOAT_OES;
    let formatRGBA;
    let formatRG;
    let formatR;

    if (isWebGL2) {
      formatRGBA = getSupportedFormat(
        gl,
        gl.RGBA16F,
        gl.RGBA,
        halfFloatTexType
      );
      formatRG = getSupportedFormat(
        gl,
        gl.RG16F,
        gl.RG,
        halfFloatTexType
      );
      formatR = getSupportedFormat(
        gl,
        gl.R16F,
        gl.RED,
        halfFloatTexType
      );
    } else {
      formatRGBA = getSupportedFormat(
        gl,
        gl.RGBA,
        gl.RGBA,
        halfFloatTexType
      );
      formatRG = getSupportedFormat(
        gl,
        gl.RGBA,
        gl.RGBA,
        halfFloatTexType
      );
      formatR = getSupportedFormat(
        gl,
        gl.RGBA,
        gl.RGBA,
        halfFloatTexType
      );
    }

    return {
      gl,
      ext: {
        formatRGBA,
        formatRG,
        formatR,
        halfFloatTexType,
        supportLinearFiltering
      }
    };
  }

  function getSupportedFormat(gl, internalFormat, format, type) {
    if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
      switch (internalFormat) {
        case gl.R16F:
          return getSupportedFormat(gl, gl.RG16F, gl.RG, type);
        case gl.RG16F:
          return getSupportedFormat(
            gl,
            gl.RGBA16F,
            gl.RGBA,
            type
          );
        default:
          return null;
      }
    }

    return {
      internalFormat,
      format
    };
  }

  function supportRenderTextureFormat(gl, internalFormat, format, type) {
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_WRAP_S,
      gl.CLAMP_TO_EDGE
    );
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_WRAP_T,
      gl.CLAMP_TO_EDGE
    );
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      internalFormat,
      4,
      4,
      0,
      format,
      type,
      null
    );

    let fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0
    );

    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) return false;
    return true;
  }

  function isMobile() {
    return /Mobi|Android/i.test(navigator.userAgent);
  }

  class GLProgram {
    constructor(vertexShader, fragmentShader) {
      this.uniforms = {};
      this.program = gl.createProgram();

      gl.attachShader(this.program, vertexShader);
      gl.attachShader(this.program, fragmentShader);
      gl.linkProgram(this.program);

      if (!gl.getProgramParameter(this.program, gl.LINK_STATUS))
        throw gl.getProgramInfoLog(this.program);

      const uniformCount = gl.getProgramParameter(
        this.program,
        gl.ACTIVE_UNIFORMS
      );
      for (let i = 0; i < uniformCount; i++) {
        const uniformName = gl.getActiveUniform(this.program, i)
          .name;
        this.uniforms[uniformName] = gl.getUniformLocation(
          this.program,
          uniformName
        );
      }
    }

    bind() {
      gl.useProgram(this.program);
    }
  }

  function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
      throw gl.getShaderInfoLog(shader);

    return shader;
  }

  const baseVertexShader = compileShader(
    gl.VERTEX_SHADER,
    `
    precision highp float;
    attribute vec2 aPosition;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform vec2 texelSize;
    void main () {
        vUv = aPosition * 0.5 + 0.5;
        vL = vUv - vec2(texelSize.x, 0.0);
        vR = vUv + vec2(texelSize.x, 0.0);
        vT = vUv + vec2(0.0, texelSize.y);
        vB = vUv - vec2(0.0, texelSize.y);
        gl_Position = vec4(aPosition, 0.0, 1.0);
    }
`
  );

  const clearShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
    precision mediump float;
    precision mediump sampler2D;
    varying highp vec2 vUv;
    uniform sampler2D uTexture;
    uniform float value;
    void main () {
        gl_FragColor = value * texture2D(uTexture, vUv);
    }
`
  );

  const colorShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
    precision mediump float;
    uniform vec4 color;
    void main () {
        gl_FragColor = color;
    }
`
  );

  const backgroundShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
    precision highp float;
    precision highp sampler2D;
    varying vec2 vUv;
    uniform sampler2D uTexture;
    uniform float aspectRatio;
    #define SCALE 25.0
    void main () {
        vec2 uv = floor(vUv * SCALE * vec2(aspectRatio, 1.0));
        float v = mod(uv.x + uv.y, 2.0);
        v = v * 0.1 + 0.8;
        gl_FragColor = vec4(vec3(v), 1.0);
    }
`
  );

  const displayShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
    precision highp float;
    precision highp sampler2D;
    varying vec2 vUv;
    uniform sampler2D uTexture;
    void main () {
        vec3 C = texture2D(uTexture, vUv).rgb;
        float a = max(C.r, max(C.g, C.b));
        gl_FragColor = vec4(C, a);
    }
`
  );

  const displayBloomShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
    precision highp float;
    precision highp sampler2D;
    varying vec2 vUv;
    uniform sampler2D uTexture;
    uniform sampler2D uBloom;
    uniform sampler2D uDithering;
    uniform vec2 ditherScale;
    void main () {
        vec3 C = texture2D(uTexture, vUv).rgb;
        vec3 bloom = texture2D(uBloom, vUv).rgb;
        vec3 noise = texture2D(uDithering, vUv * ditherScale).rgb;
        noise = noise * 2.0 - 1.0;
        bloom += noise / 800.0;
        bloom = pow(bloom.rgb, vec3(1.0 / 2.2));
        C += bloom;
        float a = max(C.r, max(C.g, C.b));
        gl_FragColor = vec4(C, a);
    }
`
  );

  const displayShadingShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
    precision highp float;
    precision highp sampler2D;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uTexture;
    uniform vec2 texelSize;
    void main () {
        vec3 L = texture2D(uTexture, vL).rgb;
        vec3 R = texture2D(uTexture, vR).rgb;
        vec3 T = texture2D(uTexture, vT).rgb;
        vec3 B = texture2D(uTexture, vB).rgb;
        vec3 C = texture2D(uTexture, vUv).rgb;
        float dx = length(R) - length(L);
        float dy = length(T) - length(B);
        vec3 n = normalize(vec3(dx, dy, length(texelSize)));
        vec3 l = vec3(0.0, 0.0, 1.0);
        float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
        C.rgb *= diffuse;
        float a = max(C.r, max(C.g, C.b));
        gl_FragColor = vec4(C, a);
    }
`
  );

  const displayBloomShadingShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
    precision highp float;
    precision highp sampler2D;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uTexture;
    uniform sampler2D uBloom;
    uniform sampler2D uDithering;
    uniform vec2 ditherScale;
    uniform vec2 texelSize;
    void main () {
        vec3 L = texture2D(uTexture, vL).rgb;
        vec3 R = texture2D(uTexture, vR).rgb;
        vec3 T = texture2D(uTexture, vT).rgb;
        vec3 B = texture2D(uTexture, vB).rgb;
        vec3 C = texture2D(uTexture, vUv).rgb;
        float dx = length(R) - length(L);
        float dy = length(T) - length(B);
        vec3 n = normalize(vec3(dx, dy, length(texelSize)));
        vec3 l = vec3(0.0, 0.0, 1.0);
        float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
        C *= diffuse;
        vec3 bloom = texture2D(uBloom, vUv).rgb;
        vec3 noise = texture2D(uDithering, vUv * ditherScale).rgb;
        noise = noise * 2.0 - 1.0;
        bloom += noise / 800.0;
        bloom = pow(bloom.rgb, vec3(1.0 / 2.2));
        C += bloom;
        float a = max(C.r, max(C.g, C.b));
        gl_FragColor = vec4(C, a);
    }
`
  );

  const bloomPrefilterShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
    precision mediump float;
    precision mediump sampler2D;
    varying vec2 vUv;
    uniform sampler2D uTexture;
    uniform vec3 curve;
    uniform float threshold;
    void main () {
        vec3 c = texture2D(uTexture, vUv).rgb;
        float br = max(c.r, max(c.g, c.b));
        float rq = clamp(br - curve.x, 0.0, curve.y);
        rq = curve.z * rq * rq;
        c *= max(rq, br - threshold) / max(br, 0.0001);
        gl_FragColor = vec4(c, 0.0);
    }
`
  );

  const bloomBlurShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
    precision mediump float;
    precision mediump sampler2D;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uTexture;
    void main () {
        vec4 sum = vec4(0.0);
        sum += texture2D(uTexture, vL);
        sum += texture2D(uTexture, vR);
        sum += texture2D(uTexture, vT);
        sum += texture2D(uTexture, vB);
        sum *= 0.25;
        gl_FragColor = sum;
    }
`
  );

  const bloomFinalShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
    precision mediump float;
    precision mediump sampler2D;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uTexture;
    uniform float intensity;
    void main () {
        vec4 sum = vec4(0.0);
        sum += texture2D(uTexture, vL);
        sum += texture2D(uTexture, vR);
        sum += texture2D(uTexture, vT);
        sum += texture2D(uTexture, vB);
        sum *= 0.25;
        gl_FragColor = sum * intensity;
    }
`
  );

  const splatShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
    precision highp float;
    precision highp sampler2D;
    varying vec2 vUv;
    uniform sampler2D uTarget;
    uniform float aspectRatio;
    uniform vec3 color;
    uniform vec2 point;
    uniform float radius;
    void main () {
        vec2 p = vUv - point.xy;
        p.x *= aspectRatio;
        vec3 splat = exp(-dot(p, p) / radius) * color;
        vec3 base = texture2D(uTarget, vUv).xyz;
        gl_FragColor = vec4(base + splat, 1.0);
    }
`
  );

  const advectionManualFilteringShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
    precision highp float;
    precision highp sampler2D;
    varying vec2 vUv;
    uniform sampler2D uVelocity;
    uniform sampler2D uSource;
    uniform vec2 texelSize;
    uniform vec2 dyeTexelSize;
    uniform float dt;
    uniform float dissipation;
    vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
        vec2 st = uv / tsize - 0.5;
        vec2 iuv = floor(st);
        vec2 fuv = fract(st);
        vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
        vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
        vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
        vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
        return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
    }
    void main () {
        vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
        gl_FragColor = dissipation * bilerp(uSource, coord, dyeTexelSize);
        gl_FragColor.a = 1.0;
    }
`
  );

  const advectionShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
    precision highp float;
    precision highp sampler2D;
    varying vec2 vUv;
    uniform sampler2D uVelocity;
    uniform sampler2D uSource;
    uniform vec2 texelSize;
    uniform float dt;
    uniform float dissipation;
    void main () {
        vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
        gl_FragColor = dissipation * texture2D(uSource, coord);
        gl_FragColor.a = 1.0;
    }
`
  );

  const divergenceShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
    precision mediump float;
    precision mediump sampler2D;
    varying highp vec2 vUv;
    varying highp vec2 vL;
    varying highp vec2 vR;
    varying highp vec2 vT;
    varying highp vec2 vB;
    uniform sampler2D uVelocity;
    void main () {
        float L = texture2D(uVelocity, vL).x;
        float R = texture2D(uVelocity, vR).x;
        float T = texture2D(uVelocity, vT).y;
        float B = texture2D(uVelocity, vB).y;
        vec2 C = texture2D(uVelocity, vUv).xy;
        if (vL.x < 0.0) { L = -C.x; }
        if (vR.x > 1.0) { R = -C.x; }
        if (vT.y > 1.0) { T = -C.y; }
        if (vB.y < 0.0) { B = -C.y; }
        float div = 0.5 * (R - L + T - B);
        gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
    }
`
  );

  const curlShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
    precision mediump float;
    precision mediump sampler2D;
    varying highp vec2 vUv;
    varying highp vec2 vL;
    varying highp vec2 vR;
    varying highp vec2 vT;
    varying highp vec2 vB;
    uniform sampler2D uVelocity;
    void main () {
        float L = texture2D(uVelocity, vL).y;
        float R = texture2D(uVelocity, vR).y;
        float T = texture2D(uVelocity, vT).x;
        float B = texture2D(uVelocity, vB).x;
        float vorticity = R - L - T + B;
        gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
    }
`
  );

  const vorticityShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
    precision highp float;
    precision highp sampler2D;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uVelocity;
    uniform sampler2D uCurl;
    uniform float curl;
    uniform float dt;
    void main () {
        float L = texture2D(uCurl, vL).x;
        float R = texture2D(uCurl, vR).x;
        float T = texture2D(uCurl, vT).x;
        float B = texture2D(uCurl, vB).x;
        float C = texture2D(uCurl, vUv).x;
        vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
        force /= length(force) + 0.0001;
        force *= curl * C;
        force.y *= -1.0;
        vec2 vel = texture2D(uVelocity, vUv).xy;
        gl_FragColor = vec4(vel + force * dt, 0.0, 1.0);
    }
`
  );

  const pressureShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
    precision mediump float;
    precision mediump sampler2D;
    varying highp vec2 vUv;
    varying highp vec2 vL;
    varying highp vec2 vR;
    varying highp vec2 vT;
    varying highp vec2 vB;
    uniform sampler2D uPressure;
    uniform sampler2D uDivergence;
    vec2 boundary (vec2 uv) {
        return uv;
        // uncomment if you use wrap or repeat texture mode
        // uv = min(max(uv, 0.0), 1.0);
        // return uv;
    }
    void main () {
        float L = texture2D(uPressure, boundary(vL)).x;
        float R = texture2D(uPressure, boundary(vR)).x;
        float T = texture2D(uPressure, boundary(vT)).x;
        float B = texture2D(uPressure, boundary(vB)).x;
        float C = texture2D(uPressure, vUv).x;
        float divergence = texture2D(uDivergence, vUv).x;
        float pressure = (L + R + B + T - divergence) * 0.25;
        gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
    }
`
  );

  const gradientSubtractShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
    precision mediump float;
    precision mediump sampler2D;
    varying highp vec2 vUv;
    varying highp vec2 vL;
    varying highp vec2 vR;
    varying highp vec2 vT;
    varying highp vec2 vB;
    uniform sampler2D uPressure;
    uniform sampler2D uVelocity;
    vec2 boundary (vec2 uv) {
        return uv;
        // uv = min(max(uv, 0.0), 1.0);
        // return uv;
    }
    void main () {
        float L = texture2D(uPressure, boundary(vL)).x;
        float R = texture2D(uPressure, boundary(vR)).x;
        float T = texture2D(uPressure, boundary(vT)).x;
        float B = texture2D(uPressure, boundary(vB)).x;
        vec2 velocity = texture2D(uVelocity, vUv).xy;
        velocity.xy -= vec2(R - L, T - B);
        gl_FragColor = vec4(velocity, 0.0, 1.0);
    }
`
  );

  const blit = (() => {
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]),
      gl.STATIC_DRAW
    );
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array([0, 1, 2, 0, 2, 3]),
      gl.STATIC_DRAW
    );
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    return destination => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, destination);
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    };
  })();

  let simWidth;
  let simHeight;
  let dyeWidth;
  let dyeHeight;
  let density;
  let velocity;
  let divergence;
  let curl;
  let pressure;
  let bloom;

  let ditheringTexture = createTextureAsync("data:image/png;base64,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");

  const clearProgram = new GLProgram(baseVertexShader, clearShader);
  const colorProgram = new GLProgram(baseVertexShader, colorShader);
  const backgroundProgram = new GLProgram(
    baseVertexShader,
    backgroundShader
  );
  const displayProgram = new GLProgram(baseVertexShader, displayShader);
  const displayBloomProgram = new GLProgram(
    baseVertexShader,
    displayBloomShader
  );
  const displayShadingProgram = new GLProgram(
    baseVertexShader,
    displayShadingShader
  );
  const displayBloomShadingProgram = new GLProgram(
    baseVertexShader,
    displayBloomShadingShader
  );
  const bloomPrefilterProgram = new GLProgram(
    baseVertexShader,
    bloomPrefilterShader
  );
  const bloomBlurProgram = new GLProgram(
    baseVertexShader,
    bloomBlurShader
  );
  const bloomFinalProgram = new GLProgram(
    baseVertexShader,
    bloomFinalShader
  );
  const splatProgram = new GLProgram(baseVertexShader, splatShader);
  const advectionProgram = new GLProgram(
    baseVertexShader,
    ext.supportLinearFiltering ?
    advectionShader :
    advectionManualFilteringShader
  );
  const divergenceProgram = new GLProgram(
    baseVertexShader,
    divergenceShader
  );
  const curlProgram = new GLProgram(baseVertexShader, curlShader);
  const vorticityProgram = new GLProgram(
    baseVertexShader,
    vorticityShader
  );
  const pressureProgram = new GLProgram(baseVertexShader, pressureShader);
  const gradienSubtractProgram = new GLProgram(
    baseVertexShader,
    gradientSubtractShader
  );

  function initFramebuffers() {
    let simRes = getResolution(config.SIM_RESOLUTION);
    let dyeRes = getResolution(config.DYE_RESOLUTION);

    simWidth = simRes.width;
    simHeight = simRes.height;
    dyeWidth = dyeRes.width;
    dyeHeight = dyeRes.height;

    const texType = ext.halfFloatTexType;
    const rgba = ext.formatRGBA;
    const rg = ext.formatRG;
    const r = ext.formatR;
    const filtering = ext.supportLinearFiltering ?
      gl.LINEAR :
      gl.NEAREST;

    if (density == null)
      density = createDoubleFBO(
        dyeWidth,
        dyeHeight,
        rgba.internalFormat,
        rgba.format,
        texType,
        filtering
      );
    else
      density = resizeDoubleFBO(
        density,
        dyeWidth,
        dyeHeight,
        rgba.internalFormat,
        rgba.format,
        texType,
        filtering
      );

    if (velocity == null)
      velocity = createDoubleFBO(
        simWidth,
        simHeight,
        rg.internalFormat,
        rg.format,
        texType,
        filtering
      );
    else
      velocity = resizeDoubleFBO(
        velocity,
        simWidth,
        simHeight,
        rg.internalFormat,
        rg.format,
        texType,
        filtering
      );

    divergence = createFBO(
      simWidth,
      simHeight,
      r.internalFormat,
      r.format,
      texType,
      gl.NEAREST
    );
    curl = createFBO(
      simWidth,
      simHeight,
      r.internalFormat,
      r.format,
      texType,
      gl.NEAREST
    );
    pressure = createDoubleFBO(
      simWidth,
      simHeight,
      r.internalFormat,
      r.format,
      texType,
      gl.NEAREST
    );

    initBloomFramebuffers();
  }

  function initBloomFramebuffers() {
    let res = getResolution(config.BLOOM_RESOLUTION);

    const texType = ext.halfFloatTexType;
    const rgba = ext.formatRGBA;
    const filtering = ext.supportLinearFiltering ?
      gl.LINEAR :
      gl.NEAREST;

    bloom = createFBO(
      res.width,
      res.height,
      rgba.internalFormat,
      rgba.format,
      texType,
      filtering
    );

    bloomFramebuffers.length = 0;
    for (let i = 0; i < config.BLOOM_ITERATIONS; i++) {
      let width = res.width >> (i + 1);
      let height = res.height >> (i + 1);

      if (width < 2 || height < 2) break;

      let fbo = createFBO(
        width,
        height,
        rgba.internalFormat,
        rgba.format,
        texType,
        filtering
      );
      bloomFramebuffers.push(fbo);
    }
  }

  function createFBO(w, h, internalFormat, format, type, param) {
    gl.activeTexture(gl.TEXTURE0);
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_WRAP_S,
      gl.CLAMP_TO_EDGE
    );
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_WRAP_T,
      gl.CLAMP_TO_EDGE
    );
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      internalFormat,
      w,
      h,
      0,
      format,
      type,
      null
    );

    let fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0
    );
    gl.viewport(0, 0, w, h);
    gl.clear(gl.COLOR_BUFFER_BIT);

    return {
      texture,
      fbo,
      width: w,
      height: h,
      attach(id) {
        gl.activeTexture(gl.TEXTURE0 + id);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        return id;
      }
    };
  }

  function createDoubleFBO(w, h, internalFormat, format, type, param) {
    let fbo1 = createFBO(w, h, internalFormat, format, type, param);
    let fbo2 = createFBO(w, h, internalFormat, format, type, param);

    return {
      get read() {
        return fbo1;
      },
      set read(value) {
        fbo1 = value;
      },
      get write() {
        return fbo2;
      },
      set write(value) {
        fbo2 = value;
      },
      swap() {
        let temp = fbo1;
        fbo1 = fbo2;
        fbo2 = temp;
      }
    };
  }

  function resizeFBO(target, w, h, internalFormat, format, type, param) {
    let newFBO = createFBO(w, h, internalFormat, format, type, param);
    clearProgram.bind();
    gl.uniform1i(clearProgram.uniforms.uTexture, target.attach(0));
    gl.uniform1f(clearProgram.uniforms.value, 1);
    blit(newFBO.fbo);
    return newFBO;
  }

  function resizeDoubleFBO(
    target,
    w,
    h,
    internalFormat,
    format,
    type,
    param
  ) {
    target.read = resizeFBO(
      target.read,
      w,
      h,
      internalFormat,
      format,
      type,
      param
    );
    target.write = createFBO(w, h, internalFormat, format, type, param);
    return target;
  }

  function createTextureAsync(url) {
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGB,
      1,
      1,
      0,
      gl.RGB,
      gl.UNSIGNED_BYTE,
      new Uint8Array([255, 255, 255])
    );

    let obj = {
      texture,
      width: 1,
      height: 1,
      attach(id) {
        gl.activeTexture(gl.TEXTURE0 + id);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        return id;
      }
    };

    let image = new Image();
    image.onload = () => {
      obj.width = image.width;
      obj.height = image.height;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGB,
        gl.RGB,
        gl.UNSIGNED_BYTE,
        image
      );
    };
    image.src = url;

    return obj;
  }

  initFramebuffers();

  let lastColorChangeTime = Date.now();

  update();

  function update() {
    resizeCanvas();
    input();
    if (!config.PAUSED) step(0.016);
    render(null);
    requestAnimationFrame(update);
  }

  function input() {
    if (splatStack.length > 0) multipleSplats(splatStack.pop());

    for (let i = 0; i < pointers.length; i++) {
      const p = pointers[i];
      if (p.moved) {
        splat(p.x, p.y, p.dx, p.dy, p.color);
        p.moved = false;
      }
    }

    if (!config.COLORFUL) return;

    if (lastColorChangeTime + 100 < Date.now()) {
      lastColorChangeTime = Date.now();
      for (let i = 0; i < pointers.length; i++) {
        const p = pointers[i];
        p.color = generateColor();
      }
    }
  }

  function step(dt) {
    gl.disable(gl.BLEND);
    gl.viewport(0, 0, simWidth, simHeight);

    curlProgram.bind();
    gl.uniform2f(
      curlProgram.uniforms.texelSize,
      1.0 / simWidth,
      1.0 / simHeight
    );
    gl.uniform1i(
      curlProgram.uniforms.uVelocity,
      velocity.read.attach(0)
    );
    blit(curl.fbo);

    vorticityProgram.bind();
    gl.uniform2f(
      vorticityProgram.uniforms.texelSize,
      1.0 / simWidth,
      1.0 / simHeight
    );
    gl.uniform1i(
      vorticityProgram.uniforms.uVelocity,
      velocity.read.attach(0)
    );
    gl.uniform1i(vorticityProgram.uniforms.uCurl, curl.attach(1));
    gl.uniform1f(vorticityProgram.uniforms.curl, config.CURL);
    gl.uniform1f(vorticityProgram.uniforms.dt, dt);
    blit(velocity.write.fbo);
    velocity.swap();

    divergenceProgram.bind();
    gl.uniform2f(
      divergenceProgram.uniforms.texelSize,
      1.0 / simWidth,
      1.0 / simHeight
    );
    gl.uniform1i(
      divergenceProgram.uniforms.uVelocity,
      velocity.read.attach(0)
    );
    blit(divergence.fbo);

    clearProgram.bind();
    gl.uniform1i(
      clearProgram.uniforms.uTexture,
      pressure.read.attach(0)
    );
    gl.uniform1f(
      clearProgram.uniforms.value,
      config.PRESSURE_DISSIPATION
    );
    blit(pressure.write.fbo);
    pressure.swap();

    pressureProgram.bind();
    gl.uniform2f(
      pressureProgram.uniforms.texelSize,
      1.0 / simWidth,
      1.0 / simHeight
    );
    gl.uniform1i(
      pressureProgram.uniforms.uDivergence,
      divergence.attach(0)
    );
    for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
      gl.uniform1i(
        pressureProgram.uniforms.uPressure,
        pressure.read.attach(1)
      );
      blit(pressure.write.fbo);
      pressure.swap();
    }

    gradienSubtractProgram.bind();
    gl.uniform2f(
      gradienSubtractProgram.uniforms.texelSize,
      1.0 / simWidth,
      1.0 / simHeight
    );
    gl.uniform1i(
      gradienSubtractProgram.uniforms.uPressure,
      pressure.read.attach(0)
    );
    gl.uniform1i(
      gradienSubtractProgram.uniforms.uVelocity,
      velocity.read.attach(1)
    );
    blit(velocity.write.fbo);
    velocity.swap();

    advectionProgram.bind();
    gl.uniform2f(
      advectionProgram.uniforms.texelSize,
      1.0 / simWidth,
      1.0 / simHeight
    );
    if (!ext.supportLinearFiltering)
      gl.uniform2f(
        advectionProgram.uniforms.dyeTexelSize,
        1.0 / simWidth,
        1.0 / simHeight
      );
    let velocityId = velocity.read.attach(0);
    gl.uniform1i(advectionProgram.uniforms.uVelocity, velocityId);
    gl.uniform1i(advectionProgram.uniforms.uSource, velocityId);
    gl.uniform1f(advectionProgram.uniforms.dt, dt);
    gl.uniform1f(
      advectionProgram.uniforms.dissipation,
      config.VELOCITY_DISSIPATION
    );
    blit(velocity.write.fbo);
    velocity.swap();

    gl.viewport(0, 0, dyeWidth, dyeHeight);

    if (!ext.supportLinearFiltering)
      gl.uniform2f(
        advectionProgram.uniforms.dyeTexelSize,
        1.0 / dyeWidth,
        1.0 / dyeHeight
      );
    gl.uniform1i(
      advectionProgram.uniforms.uVelocity,
      velocity.read.attach(0)
    );
    gl.uniform1i(
      advectionProgram.uniforms.uSource,
      density.read.attach(1)
    );
    gl.uniform1f(
      advectionProgram.uniforms.dissipation,
      config.DENSITY_DISSIPATION
    );
    blit(density.write.fbo);
    density.swap();
  }

  function render(target) {
    if (config.BLOOM) applyBloom(density.read, bloom);

    if (target == null || !config.TRANSPARENT) {
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.enable(gl.BLEND);
    } else {
      gl.disable(gl.BLEND);
    }

    let width = target == null ? gl.drawingBufferWidth : dyeWidth;
    let height = target == null ? gl.drawingBufferHeight : dyeHeight;

    gl.viewport(0, 0, width, height);

    if (!config.TRANSPARENT) {
      colorProgram.bind();
      let bc = config.BACK_COLOR;
      gl.uniform4f(
        colorProgram.uniforms.color,
        bc.r / 255,
        bc.g / 255,
        bc.b / 255,
        1
      );
      blit(target);
    }

    if (target == null && config.TRANSPARENT) {
      backgroundProgram.bind();
      gl.uniform1f(
        backgroundProgram.uniforms.aspectRatio,
        canvas.width / canvas.height
      );
      blit(null);
    }

    if (config.SHADING) {
      let program = config.BLOOM ?
        displayBloomShadingProgram :
        displayShadingProgram;
      program.bind();
      gl.uniform2f(
        program.uniforms.texelSize,
        1.0 / width,
        1.0 / height
      );
      gl.uniform1i(program.uniforms.uTexture, density.read.attach(0));
      if (config.BLOOM) {
        gl.uniform1i(program.uniforms.uBloom, bloom.attach(1));
        gl.uniform1i(
          program.uniforms.uDithering,
          ditheringTexture.attach(2)
        );
        let scale = getTextureScale(
          ditheringTexture,
          width,
          height
        );
        gl.uniform2f(
          program.uniforms.ditherScale,
          scale.x,
          scale.y
        );
      }
    } else {
      let program = config.BLOOM ?
        displayBloomProgram :
        displayProgram;
      program.bind();
      gl.uniform1i(program.uniforms.uTexture, density.read.attach(0));
      if (config.BLOOM) {
        gl.uniform1i(program.uniforms.uBloom, bloom.attach(1));
        gl.uniform1i(
          program.uniforms.uDithering,
          ditheringTexture.attach(2)
        );
        let scale = getTextureScale(
          ditheringTexture,
          width,
          height
        );
        gl.uniform2f(
          program.uniforms.ditherScale,
          scale.x,
          scale.y
        );
      }
    }

    blit(target);
  }

  function applyBloom(source, destination) {
    if (bloomFramebuffers.length < 2) return;

    let last = destination;

    gl.disable(gl.BLEND);
    bloomPrefilterProgram.bind();
    let knee = config.BLOOM_THRESHOLD * config.BLOOM_SOFT_KNEE + 0.0001;
    let curve0 = config.BLOOM_THRESHOLD - knee;
    let curve1 = knee * 2;
    let curve2 = 0.25 / knee;
    gl.uniform3f(
      bloomPrefilterProgram.uniforms.curve,
      curve0,
      curve1,
      curve2
    );
    gl.uniform1f(
      bloomPrefilterProgram.uniforms.threshold,
      config.BLOOM_THRESHOLD
    );
    gl.uniform1i(
      bloomPrefilterProgram.uniforms.uTexture,
      source.attach(0)
    );
    gl.viewport(0, 0, last.width, last.height);
    blit(last.fbo);

    bloomBlurProgram.bind();
    for (let i = 0; i < bloomFramebuffers.length; i++) {
      let dest = bloomFramebuffers[i];
      gl.uniform2f(
        bloomBlurProgram.uniforms.texelSize,
        1.0 / last.width,
        1.0 / last.height
      );
      gl.uniform1i(
        bloomBlurProgram.uniforms.uTexture,
        last.attach(0)
      );
      gl.viewport(0, 0, dest.width, dest.height);
      blit(dest.fbo);
      last = dest;
    }

    gl.blendFunc(gl.ONE, gl.ONE);
    gl.enable(gl.BLEND);

    for (let i = bloomFramebuffers.length - 2; i >= 0; i--) {
      let baseTex = bloomFramebuffers[i];
      gl.uniform2f(
        bloomBlurProgram.uniforms.texelSize,
        1.0 / last.width,
        1.0 / last.height
      );
      gl.uniform1i(
        bloomBlurProgram.uniforms.uTexture,
        last.attach(0)
      );
      gl.viewport(0, 0, baseTex.width, baseTex.height);
      blit(baseTex.fbo);
      last = baseTex;
    }

    gl.disable(gl.BLEND);
    bloomFinalProgram.bind();
    gl.uniform2f(
      bloomFinalProgram.uniforms.texelSize,
      1.0 / last.width,
      1.0 / last.height
    );
    gl.uniform1i(bloomFinalProgram.uniforms.uTexture, last.attach(0));
    gl.uniform1f(
      bloomFinalProgram.uniforms.intensity,
      config.BLOOM_INTENSITY
    );
    gl.viewport(0, 0, destination.width, destination.height);
    blit(destination.fbo);
  }

  function splat(x, y, dx, dy, color) {
    gl.viewport(0, 0, simWidth, simHeight);
    splatProgram.bind();
    gl.uniform1i(
      splatProgram.uniforms.uTarget,
      velocity.read.attach(0)
    );
    gl.uniform1f(
      splatProgram.uniforms.aspectRatio,
      canvas.width / canvas.height
    );
    gl.uniform2f(
      splatProgram.uniforms.point,
      x / canvas.width,
      1.0 - y / canvas.height
    );
    gl.uniform3f(splatProgram.uniforms.color, dx, -dy, 1.0);
    gl.uniform1f(
      splatProgram.uniforms.radius,
      config.SPLAT_RADIUS / 100.0
    );
    blit(velocity.write.fbo);
    velocity.swap();

    gl.viewport(0, 0, dyeWidth, dyeHeight);
    gl.uniform1i(splatProgram.uniforms.uTarget, density.read.attach(0));
    gl.uniform3f(
      splatProgram.uniforms.color,
      color.r,
      color.g,
      color.b
    );
    blit(density.write.fbo);
    density.swap();
  }

  function multipleSplats(amount) {
    for (let i = 0; i < amount; i++) {
      const color = generateColor();
      color.r *= 10.0;
      color.g *= 10.0;
      color.b *= 10.0;
      const x = canvas.width * Math.random();
      const y = canvas.height * Math.random();
      const dx = 1000 * (Math.random() - 0.5);
      const dy = 1000 * (Math.random() - 0.5);
      splat(x, y, dx, dy, color);
    }
  }

  function resizeCanvas() {
    if (
      canvas.width !== canvas.clientWidth ||
      canvas.height !== canvas.clientHeight
    ) {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      initFramebuffers();
    }
  }

  function generateColor() {
    let c = HSVtoRGB(Math.random(), 1.0, 1.0);
    c.r *= 0.15;
    c.g *= 0.15;
    c.b *= 0.15;
    return c;
  }

  function HSVtoRGB(h, s, v) {
    let r, g, b, i, f, p, q, t;
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);

    /*eslint-disable */
    switch (i % 6) {
      case 0:
        (r = v), (g = t), (b = p);
        break;
      case 1:
        (r = q), (g = v), (b = p);
        break;
      case 2:
        (r = p), (g = v), (b = t);
        break;
      case 3:
        (r = p), (g = q), (b = v);
        break;
      case 4:
        (r = t), (g = p), (b = v);
        break;
      case 5:
        (r = v), (g = p), (b = q);
        break;
      default:
    }
    /*eslint-enable */

    return {
      r,
      g,
      b
    };
  }

  function getResolution(resolution) {
    let aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
    if (aspectRatio < 1) aspectRatio = 1.0 / aspectRatio;

    let max = Math.round(resolution * aspectRatio);
    let min = Math.round(resolution);

    if (gl.drawingBufferWidth > gl.drawingBufferHeight)
      return {
        width: max,
        height: min
      };
    else return {
      width: min,
      height: max
    };
  }

  function getTextureScale(texture, width, height) {
    return {
      x: width / texture.width,
      y: height / texture.height
    };
  }
}

function randomSplat() {
  this.splatStack &&
    this.splatStack.push(
      parseInt(Math.random() * 20) + parseInt(Math.random() * 5)
    );
}