const VERTEX_SHADER_CODE = `#version 300 es
layout (location = 0) in vec4 inPosition;
layout (location = 1) in vec4 inNormal;
uniform mat4 uniWorld;
uniform mat4 uniView;
uniform mat4 uniProj;
uniform mat4 uniWorldIT;
uniform vec4 uniCameraPosition;
uniform vec4 uniLightPosition;
uniform vec4 uniLightAmbient;
uniform vec4 uniLightDiffuse;
uniform vec4 uniLightSpecular;
uniform vec4 uniModelAmbient;
uniform vec4 uniModelDiffuse;
uniform vec4 uniModelSpecular;
uniform float uniModelShininess;
out vec4 bridgeColor;
void main() {
  vec4 position = uniWorld * inPosition;
  vec4 normal = uniWorldIT * inNormal;
  gl_Position = uniProj * uniView * position;
  vec3 vecNormal = vec3(normal.xyz);
  vec3 vecToLight = normalize(uniLightPosition.xyz - position.xyz);
  vec3 vecToCamera = normalize(uniCameraPosition.xyz - position.xyz);
  vec3 vecReflect = normalize(-vecToLight + 2.0 * (dot(vecToLight, vecNormal) * vecNormal));
  float cosDiffuseAngle = dot(vecNormal, vecToLight);
  float cosDiffuseAngleClamp = clamp(cosDiffuseAngle, 0.0, 1.0);
  float cosReflectAngle = dot(vecToCamera, vecReflect);
  float cosReflectAngleClamp = clamp(cosReflectAngle, 0.0, 1.0);
  vec3 color =
    uniModelAmbient.xyz * uniLightAmbient.xyz
    + uniModelDiffuse.xyz * cosDiffuseAngleClamp * uniLightDiffuse.xyz
    + uniModelSpecular.xyz * pow(cosReflectAngleClamp, uniModelShininess) * uniLightSpecular.xyz;
  bridgeColor = vec4(color, 1.0);
}`

const FRAGMENT_SHADER_CODE = `#version 300 es
precision highp float;
in vec4 bridgeColor;
out vec4 outColor;
void main() {
  outColor = bridgeColor;
}`

function createShader(gl, type, code) {
  const shader = gl.createShader(type)
  if (!shader) {
    throw new Error("createShader(): failed to create a shader: " + type)
  }
  gl.shaderSource(shader, code)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, WebGL2RenderingContext.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    throw new Error("createShader(): failed to compile a shader: " + type)
  }
  return shader
}

function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram()
  if (!program) {
    throw new Error("createProgram(): failed to create a program.")
  }
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, WebGL2RenderingContext.LINK_STATUS)) {
    gl.deleteProgram(program)
    throw new Error("createProgram(): failed to link a program.")
  }
  return program
}

function createBuffer(gl, type, typedDataArray) {
  const buffer = gl.createBuffer()
  if (!buffer) {
    throw new Error("createBuffer(): failed to create a buffer.")
  }
  gl.bindBuffer(type, buffer)
  gl.bufferData(type, typedDataArray, WebGL2RenderingContext.STATIC_DRAW)
  gl.bindBuffer(type, null)
  return buffer
}

function createParameterGetter(id) {
  const input = document.getElementById(id)
  return () => {
    const v = Number(input.value)
    return v
  }
}

function createXYZParameterGetter(id) {
  const xInput = document.getElementById(id + "-x")
  const yInput = document.getElementById(id + "-y")
  const zInput = document.getElementById(id + "-z")
  return () => {
    const x = Number(xInput.value)
    const y = Number(yInput.value)
    const z = Number(zInput.value)
    return [x, y, z, 1.0]
  }
}

function createSceneResizingSystem(gl, canvas) {
  return [
    () => window.innerWidth,
    () => window.innerHeight,
    () => {
      gl.viewport(0, 0, window.innerWidth, window.innerHeight)
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    },
  ]
}

function main() {
  // init WebGL2
  const canvas = document.getElementById("canvas")
  const gl = canvas.getContext("webgl2")
  if (!gl) {
    throw new Error("main(): failed to get context: webgl2")
  }

  // init shader program
  const vertexShader = createShader(gl, WebGL2RenderingContext.VERTEX_SHADER, VERTEX_SHADER_CODE)
  const fragmentShader = createShader(gl, WebGL2RenderingContext.FRAGMENT_SHADER, FRAGMENT_SHADER_CODE)
  const program = createProgram(gl, vertexShader, fragmentShader)
  gl.useProgram(program)

  // get locations
  const inPositionLocation = 0
  const inNormalLocation = 1
  const uniWorldLocation = gl.getUniformLocation(program, "uniWorld")
  const uniViewLocation = gl.getUniformLocation(program, "uniView")
  const uniProjLocation = gl.getUniformLocation(program, "uniProj")
  const uniWorldITLocation = gl.getUniformLocation(program, "uniWorldIT")
  const uniCameraPositionLocation = gl.getUniformLocation(program, "uniCameraPosition")
  const uniLightPositionLocation = gl.getUniformLocation(program, "uniLightPosition")
  const uniLightAmbientLocation = gl.getUniformLocation(program, "uniLightAmbient")
  const uniLightDiffuseLocation = gl.getUniformLocation(program, "uniLightDiffuse")
  const uniLightSpecularLocation = gl.getUniformLocation(program, "uniLightSpecular")
  const uniModelAmbientLocation = gl.getUniformLocation(program, "uniModelAmbient")
  const uniModelDiffuseLocation = gl.getUniformLocation(program, "uniModelDiffuse")
  const uniModelSpecularLocation = gl.getUniformLocation(program, "uniModelSpecular")
  const uniModelShininessLocation = gl.getUniformLocation(program, "uniModelShininess")

  // configure rendering settings
  gl.clearColor(0.0, 0.0, 0.0, 1.0)
  gl.enable(WebGL2RenderingContext.DEPTH_TEST)
  gl.frontFace(WebGL2RenderingContext.CCW)
  gl.enable(WebGL2RenderingContext.BLEND)
  gl.blendFunc(WebGL2RenderingContext.SRC_ALPHA, WebGL2RenderingContext.ONE_MINUS_SRC_ALPHA)

  // create a model
  const modelVertexCount = MODEL_DATA["vertex"]
  const modelVertexData = []
  for (let i = 0; i < modelVertexCount; ++i) {
    modelVertexData.push(MODEL_DATA["position"][3 * i + 0])
    modelVertexData.push(MODEL_DATA["position"][3 * i + 1])
    modelVertexData.push(MODEL_DATA["position"][3 * i + 2])
    modelVertexData.push(1)
    modelVertexData.push(MODEL_DATA["normal"][3 * i + 0])
    modelVertexData.push(MODEL_DATA["normal"][3 * i + 1])
    modelVertexData.push(MODEL_DATA["normal"][3 * i + 2])
    modelVertexData.push(1)
  }
  const modelIndexCount = MODEL_DATA["index"].length
  const modelIndexData = MODEL_DATA["index"]
  const modelVertexBuffer = createBuffer(
    gl,
    WebGL2RenderingContext.ARRAY_BUFFER,
    new Float32Array(modelVertexData)
  )
  const modelIndexBuffer = createBuffer(
    gl,
    WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(modelIndexData)
  )

  // scene size
  const [getSceneWidth, getSceneHeight, adjustSceneSize] = createSceneResizingSystem(gl, canvas);

  // parameters
  const getModelPosition = createXYZParameterGetter("model-position")
  const getModelRotated = createXYZParameterGetter("model-rotated")
  const getModelRotating = createXYZParameterGetter("model-rotating")
  const getCameraPosition = createXYZParameterGetter("camera-position")
  const getCameraLookAt = createXYZParameterGetter("camera-look-at")
  const getCameraUpVec = createXYZParameterGetter("camera-up-vec")
  const getLightPosition = createXYZParameterGetter("light-position")
  const getLightAmbient = createXYZParameterGetter("light-ambient")
  const getLightDiffuse = createXYZParameterGetter("light-diffuse")
  const getLightSpecular = createXYZParameterGetter("light-specular")
  const getMaterialAmbient = createXYZParameterGetter("material-ambient")
  const getMaterialDiffuse = createXYZParameterGetter("material-diffuse")
  const getMaterialSpecular = createXYZParameterGetter("material-specular")
  const getMaterialShininess = createParameterGetter("material-shininess")

  // mainloop
  let count = 0
  const loop = () => {
    const translation = getModelPosition()
    const rotated = getModelRotated()
    const rotating = getModelRotating()
    const worldMatrix = Matrix.translator(translation[0], translation[1], translation[2])
      .mul(Matrix.rotatorZ(deg2rad(rotating[2] * count)))
      .mul(Matrix.rotatorY(deg2rad(rotating[1] * count)))
      .mul(Matrix.rotatorX(deg2rad(rotating[0] * count)))
      .mul(Matrix.rotatorZ(deg2rad(rotated[2])))
      .mul(Matrix.rotatorY(deg2rad(rotated[1])))
      .mul(Matrix.rotatorX(deg2rad(rotated[0])))
      .mul(Matrix.scaler(1, 1, 1))
    const viewMatrix = Matrix.view(
      getCameraPosition(),
      getCameraLookAt(),
      getCameraUpVec()
    )
    const projMatrix = Matrix.perse(
      deg2rad(45),
      getSceneWidth() / getSceneHeight(),
      1,
      1000
    )
    const worldITMatrix = worldMatrix.inverse().transpose()

    adjustSceneSize()
    gl.clear(WebGL2RenderingContext.COLOR_BUFFER_BIT)
    gl.uniformMatrix4fv(uniWorldLocation, false, worldMatrix.get())
    gl.uniformMatrix4fv(uniViewLocation, false, viewMatrix.get())
    gl.uniformMatrix4fv(uniProjLocation, false, projMatrix.get())
    gl.uniformMatrix4fv(uniWorldITLocation, false, worldITMatrix.get())
    gl.uniform4fv(uniCameraPositionLocation, getCameraPosition())
    gl.uniform4fv(uniLightPositionLocation, getLightPosition())
    gl.uniform4fv(uniLightAmbientLocation, getLightAmbient())
    gl.uniform4fv(uniLightDiffuseLocation, getLightDiffuse())
    gl.uniform4fv(uniLightSpecularLocation, getLightSpecular())
    gl.uniform4fv(uniModelAmbientLocation, getMaterialAmbient())
    gl.uniform4fv(uniModelDiffuseLocation, getMaterialDiffuse())
    gl.uniform4fv(uniModelSpecularLocation, getMaterialSpecular())
    gl.uniform1f(uniModelShininessLocation, getMaterialShininess())
    gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, modelVertexBuffer)
    gl.bindBuffer(WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER, modelIndexBuffer)
    gl.enableVertexAttribArray(inPositionLocation)
    gl.enableVertexAttribArray(inNormalLocation)
    gl.vertexAttribPointer(
      inPositionLocation,
      4,
      WebGL2RenderingContext.FLOAT,
      false,
      Float32Array.BYTES_PER_ELEMENT * 8,
      0
    )
    gl.vertexAttribPointer(
      inNormalLocation,
      4,
      WebGL2RenderingContext.FLOAT,
      false,
      Float32Array.BYTES_PER_ELEMENT * 8,
      Float32Array.BYTES_PER_ELEMENT * 4
    )
    gl.drawElements(
      WebGL2RenderingContext.TRIANGLES,
      modelIndexCount,
      WebGL2RenderingContext.UNSIGNED_SHORT,
      0
    )
    gl.flush()

    count += 1
    requestAnimationFrame(loop)
  }

  loop()
}

document.addEventListener("DOMContentLoaded", main)
