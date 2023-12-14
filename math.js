function deg2rad(deg) {
  return Math.PI * deg / 180
}

class Vector {
  constructor(raw) {
    if (raw === undefined) {
      this.v = [0, 0, 0, 0]
    } else if (raw.length < 4) {
      throw new Error("Vector(): the length of `raw` parameter must be no fewer than 4: ", raw)
    } else {
      this.v = [raw[0], raw[1], raw[2], raw[3]]
    }
  }
  clone() {
    return new Vector(this.v)
  }
  get() {
    return new Float32Array(this.v)
  }
  at(i) {
    return this.v[i]
  }
  x() {
    return this.v[0]
  }
  y() {
    return this.v[1]
  }
  z() {
    return this.v[2]
  }
  w() {
    return this.v[3]
  }
  setAt(i, val) {
    this.v[i] = val
  }
  setX(x) {
    this.v[0] = x
  }
  setY(y) {
    this.v[1] = y
  }
  setZ(z) {
    this.v[2] = z
  }
  setW(w) {
    this.v[3] = w
  }
  normalize() {
    const mag = Math.sqrt(this.x() * this.x() + this.y() * this.y() + this.z() * this.z() + this.w() * this.w())
    return new Vector([
      this.x() / mag,
      this.y() / mag,
      this.z() / mag,
      this.w() / mag,
    ])
  }
  add(u) {
    return new Vector([
      this.x() + u.x(),
      this.y() + u.y(),
      this.z() + u.z(),
      this.w() + u.w(),
    ])
  }
  muls(s) {
    return new Vector([
      this.x() * s,
      this.y() * s,
      this.z() * s,
      this.w() * s,
    ])
  }
  mul(u) {
    return new Vector([
      this.x() * u.x(),
      this.y() * u.y(),
      this.z() * u.z(),
      this.w() * u.w(),
    ])
  }
  dot(u) {
    return this.x() * u.x() + this.y() * u.y() + this.z() * u.z() + this.w() * u.w()
  }
}

function cross(v, u) {
  return new Vector([
    v.y() * u.z() - v.z() * u.y(),
    v.z() * u.x() - v.x() * u.z(),
    v.x() * u.y() - v.y() * u.x(),
    0,
  ])
}

class Matrix {
  constructor(raw) {
    if (raw === undefined) {
      this.m = [
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
      ]
    } else if (raw.length < 16) {
      throw new Error("Matrix(): the length of `raw` parameter must be no fewer than 16: ", raw)
    } else {
      this.m = [
        raw[0], raw[1], raw[2], raw[3],
        raw[4], raw[5], raw[6], raw[7],
        raw[8], raw[9], raw[10], raw[11],
        raw[12], raw[13], raw[14], raw[15],
      ]
    }
  }
  clone() {
    return new Matrix(this.m)
  }
  get() {
    return new Float32Array(this.m)
  }
  at(i, j) {
    return this.m[4 * j + i]
  }
  setAt(i, j, val) {
    this.m[4 * j + i] = val
  }
  swapRow(oldi, newi) {
    for (let j = 0; j < 4; ++j) {
      const tmp = this.at(oldi, j)
      this.setAt(oldi, j, this.at(newi, j))
      this.setAt(newi, j, tmp)
    }
  }
  swapCol(oldj, newj) {
    for (let i = 0; i < 4; ++i) {
      const tmp = this.at(i, oldj)
      this.setAt(i, oldj, this.at(i, newj))
      this.setAt(i, newj, tmp)
    }
  }
  muls(s) {
    const result = new Matrix()
    for (let i = 0; i < 4; ++i) {
      for (let j = 0; j < 4; ++j) {
        result.setAt(i, j, this.at(i, j) * s)
      }
    }
    return result
  }
  mulv(v) {
    const result = new Vector()
    for (let i = 0; i < 4; ++i) {
      let val = 0
      for (let j = 0; j < 4; ++j) {
        val += this.at(i, j) * v.at(j)
      }
      result.setAt(i, val)
    }
    return result
  }
  mul(m2) {
    const result = new Matrix()
    for (let i = 0; i < 4; ++i) {
      for (let j = 0; j < 4; ++j) {
        let val = 0
        for (let k = 0; k < 4; ++k) {
          val += this.at(i, k) * m2.at(k, j)
        }
        result.setAt(i, j, val)
      }
    }
    return result
  }
  transpose() {
    return new Matrix([
      this.at(0, 0), this.at(0, 1), this.at(0, 2), this.at(0, 3),
      this.at(1, 0), this.at(1, 1), this.at(1, 2), this.at(1, 3),
      this.at(2, 0), this.at(2, 1), this.at(2, 2), this.at(2, 3),
      this.at(3, 0), this.at(3, 1), this.at(3, 2), this.at(3, 3),
    ])
  }
  inverse() {
    const cloned = this.clone()
    const result = new Matrix([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ])
    for (let i = 0; i < 4; ++i) {
      // partial pivoting
      let max = Math.abs(cloned.at(i, i))
      let newi = i
      for (let k = i + 1; k < 4; ++k) {
        const mki = Math.abs(cloned.at(k, i))
        if (mki > max) {
          max = mki
          newi = k
        }
      }
      if (newi !== i) {
        cloned.swapRow(i, newi)
        result.swapRow(i, newi)
      }
      // divide row by pivot
      const pivot = cloned.at(i, i)
      for (let j = 0; j < 4; ++j) {
        cloned.setAt(i, j, cloned.at(i, j) / pivot)
        result.setAt(i, j, result.at(i, j) / pivot)
      }
      // remove
      for (let j = 0; j < 4; ++j) {
        if (i === j) {
          continue
        }
        const mji = cloned.at(j, i)
        for (let k = 0; k < 4; ++k) {
          cloned.setAt(j, k, cloned.at(j, k) - cloned.at(i, k) * mji)
          result.setAt(j, k, result.at(j, k) - result.at(i, k) * mji)
        }
      }
    }
    return result
  }
  static scaler(x, y, z) {
    return new Matrix([
      x, 0, 0, 0,
      0, y, 0, 0,
      0, 0, z, 0,
      0, 0, 0, 1,
    ])
  }
  static rotatorX(r) {
    return new Matrix([
      1, 0, 0, 0,
      0, Math.cos(r), -Math.sin(r), 0,
      0, Math.sin(r), Math.cos(r), 0,
      0, 0, 0, 1,
    ])
  }
  static rotatorY(r) {
    return new Matrix([
      Math.cos(r), 0, Math.sin(r), 0,
      0, 1, 0, 0,
      -Math.sin(r), 0, Math.cos(r), 0,
      0, 0, 0, 1,
    ])
  }
  static rotatorZ(r) {
    return new Matrix([
      Math.cos(r), -Math.sin(r), 0, 0,
      Math.sin(r), Math.cos(r), 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ])
  }
  static translator(x, y, z) {
    return new Matrix([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      x, y, z, 1,
    ])
  }
  static view(pos, at, up) {
    // vectorize
    const vpos = new Vector([pos[0], pos[1], pos[2], 0])
    const vat = new Vector([at[0], at[1], at[2], 0])
    const vup = new Vector([up[0], up[1], up[2], 0])
    // axis vectors in the view coordinate system
    const z = vat.add(vpos.muls(-1)).normalize()
    const x = cross(z, vup).normalize()
    const y = cross(x, z).normalize()
    // object translation
    const dx = vpos.dot(x)
    const dy = vpos.dot(y)
    const dz = vpos.dot(z)
    // finish
    return new Matrix([
      x.x(), y.x(), z.x(), 0,
      x.y(), y.y(), z.y(), 0,
      x.z(), y.z(), z.z(), 0,
      -dx, -dy, -dz, 1,
    ])
  }
  static perse(pov, aspect, near, far) {
    const divTanpov = 1.0 / Math.tan(pov)
    const divDepth = 1.0 / (far - near)
    return new Matrix([
      divTanpov, 0.0, 0.0, 0.0,
      0.0, divTanpov * aspect, 0.0, 0.0,
      0.0, 0.0, far * divDepth, 1.0,
      0.0, 0.0, -far * near * divDepth, 0.0,
    ])
  }
}
