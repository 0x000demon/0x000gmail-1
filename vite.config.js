
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 5000,
    host: '0.0.0.0',
    allowedHosts: [
      '2f6e83ff-7433-4603-8165-92bdedb306fc-00-ial75m4uik2c.worf.replit.dev',
      '3f518f9c-a711-4a2d-8551-d85c81a4d2fa-00-2pmfvw4uq57f4.riker.replit.dev',
      '7e3b0258-5bb6-4fc3-bbf2-9704138cb7e9-00-2qxyc1jt0dwir.worf.replit.dev',
      'db3f996d-dc9e-499a-acb5-33f77bc3ef23-00-3bryjjq3y5qu4.riker.replit.dev',
      '2d4c6a2a-3a87-443b-8654-d7b9b445f017-00-3vsay40wxihzt.janeway.replit.dev'
    ]
  }
})
