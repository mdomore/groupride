# GroupRide App Deployment Guide

## Quick Setup (5 minutes)

### 1. Set up Supabase
1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to Settings > API to get your project URL and anon key
4. Run the SQL from `supabase-setup.md` in the SQL editor

### 2. Configure Environment
1. Copy `script-supabase.js` to `script.js` (replace the existing file)
2. Update the Supabase URL and key in `supabase.js`:
   ```javascript
   const supabaseUrl = 'YOUR_SUPABASE_URL'
   const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'
   ```

### 3. Install and Run
```bash
npm install
npm run dev
```

### 4. Deploy to Production
You can deploy to any static hosting service:
- **Vercel**: `npm run build` then drag the `dist` folder to Vercel
- **Netlify**: `npm run build` then drag the `dist` folder to Netlify
- **GitHub Pages**: Push to GitHub and enable Pages

## Features Now Available

✅ **Shared Data**: Events are stored in the cloud and shared between all users
✅ **Real-time Updates**: When someone books a seat, others see it immediately
✅ **Persistent Storage**: Data survives browser refreshes and device changes
✅ **Scalable**: Can handle thousands of events and users
✅ **Secure**: Row Level Security protects your data

## Database Schema

- **events**: Stores event information (name, date, time)
- **cars**: Stores car information (driver, model, seats)
- **passengers**: Stores passenger bookings with seat assignments

## Security

The current setup allows all operations for simplicity. For production, you should:
1. Enable authentication
2. Add proper RLS policies
3. Validate user permissions
4. Add rate limiting

## Cost

- **Supabase Free Tier**: 50,000 monthly active users, 500MB database
- **Hosting**: Free on Vercel/Netlify
- **Total Cost**: $0 for most use cases
