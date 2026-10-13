// Membuat sepasang kunci VAPID untuk Web Push (tanpa dependensi).
import crypto from 'node:crypto'
const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
const pub = publicKey.export({ format: 'jwk' }), prv = privateKey.export({ format: 'jwk' })
const pubRaw = Buffer.concat([Buffer.from([4]), Buffer.from(pub.x, 'base64url'), Buffer.from(pub.y, 'base64url')]).toString('base64url')
console.log(`VAPID_PUBLIC_KEY=${pubRaw}\nVAPID_PRIVATE_KEY=${prv.d}`)
