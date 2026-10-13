import crypto from 'node:crypto'
const pw = process.argv[2]
if (!pw) { console.error('Pemakaian: npm run hash -- PASSWORD_BARU'); process.exit(1) }
console.log(crypto.createHash('sha256').update(pw).digest('hex'))
