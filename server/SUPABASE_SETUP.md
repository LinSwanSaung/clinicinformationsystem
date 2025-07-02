# 🏥 RealCIS Supabase Setup Instructions

## Step 1: Create Supabase Account & Project

### 1.1 Go to Supabase
- Visit: https://supabase.com
- Click "Start your project"
- Sign up with GitHub or email

### 1.2 Create New Project
- Click "New Project" 
- **Project Name**: `realcis-clinic`
- **Database Password**: Choose a strong password (SAVE THIS!)
- **Region**: Choose closest to your location
- **Plan**: Free tier
- Click "Create new project"
- Wait 2-3 minutes for setup

## Step 2: Get Your API Keys

### 2.1 Navigate to API Settings
- In your Supabase dashboard, click the gear icon (⚙️) 
- Go to "API" section

### 2.2 Copy These Values
You'll see:
- **Project URL**: `https://xxxxx.supabase.co`
- **API Keys**:
  - `anon public` key (safe for frontend)
  - `service_role` key (keep secret - for backend only)

## Step 3: Update Your .env File

Replace the placeholder values in your `server/.env` file:

```env
# Replace these with your actual values from Supabase:
SUPABASE_URL=https://your-actual-project-id.supabase.co
SUPABASE_ANON_KEY=your_actual_anon_key_from_supabase
SUPABASE_SERVICE_KEY=your_actual_service_role_key_from_supabase
```

## Step 4: Create Database Tables

After connecting, we'll run SQL commands in Supabase to create your tables:

1. Go to "SQL Editor" in Supabase dashboard
2. Run the table creation scripts I'll provide
3. Test the connection with your backend

## Step 5: Test Connection

Once you've updated the .env file, we'll test:
```bash
npm run dev
```

The server should start without errors and connect to your Supabase database.

---

## 🔑 Important Notes

- **Never commit your .env file to git** (it's already in .gitignore)
- **Keep your service_role key secret** - it has full database access
- **The anon key is safe** for frontend use
- **Free tier includes**: 500MB database, 1GB bandwidth, 50MB file storage

## 📞 Next Steps

1. Create your Supabase project first
2. Get your API keys  
3. Update the .env file
4. Let me know when ready and I'll help you create the database tables!

---

**Questions? Just ask and I'll walk you through each step! 🚀**
