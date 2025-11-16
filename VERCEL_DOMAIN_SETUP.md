# Setting Up Custom Domain on Vercel

This guide will help you configure your custom domain (`www.koldgeneration.com`) on Vercel.

## Step 1: Add Domain in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (`koldgeneration-website`)
3. Go to **Settings** → **Domains** (left sidebar)
4. Click **"Add Domain"** button
5. Enter your domain: `www.koldgeneration.com`
6. Click **"Add"**

### Step 1b: Set Domain to Production (Optional but Recommended)

After adding the domain, make sure it's connected to production:

1. Find `www.koldgeneration.com` in the domains list
2. Click **"Edit"** (or the three dots **"..."** → **"Edit"**) next to the domain
3. In the **"Connect to an environment"** section:
   - Select **"Production"** (this automatically connects to your main branch)
4. Click **"Save"** or **"Update"**

✅ This ensures `www.koldgeneration.com` always points to your production/main branch

## Step 2: Configure DNS

You have two options for configuring DNS. **Option A (Vercel DNS)** is easier and recommended.

### Option A: Use Vercel DNS (Recommended - Easier!)

This lets Vercel manage all DNS records automatically.

1. In Vercel Dashboard → **Settings** → **Domains**
2. Click on your domain (`www.koldgeneration.com`)
3. Look for **"Nameservers"** section or **"Configure DNS"**
4. Vercel will show you nameserver addresses (usually 2-4 addresses like `ns1.vercel-dns.com` and `ns2.vercel-dns.com`)
5. Copy these nameservers
6. Go to your domain registrar (where you bought `koldgeneration.com`)
   - Examples: GoDaddy, Namecheap, Cloudflare, Google Domains, etc.
7. Find **"Nameservers"** or **"DNS Servers"** settings (usually in domain settings, not DNS records)
8. Replace your current nameservers with Vercel's nameservers
9. Save

**Common Registrar Locations:**
- **GoDaddy**: Domain Settings → DNS → Nameservers → Change → Enter Vercel nameservers
- **Namecheap**: Domain List → Manage → Advanced DNS → Change Nameservers
- **Cloudflare**: DNS → Find nameservers in right sidebar → Change at your registrar

✅ **Benefits**: Vercel automatically manages all DNS records. You don't need to add CNAME/A records manually.
✅ **Drawback**: You lose control over DNS at your registrar (Vercel manages it all)

### Option B: Add DNS Records Manually (Keep Your Current Nameservers)

If you prefer to keep using your registrar's DNS (or you're using Cloudflare/other DNS service):

Vercel will show you DNS records to add. You'll need to add these at your domain registrar (where you bought the domain).

**If Vercel Shows These Records:**

**CNAME Record (Recommended for subdomains like www):**
- **Type**: `CNAME`
- **Name**: `www`
- **Value**: `cname.vercel-dns.com` (or similar - Vercel will show you the exact value)
- **TTL**: 3600 (or default)

**A Record (Alternative, usually for root domain):**
- **Type**: `A`
- **Name**: `www`
- **Value**: `76.76.21.21` (Vercel will show you the exact IPs)
- **TTL**: 3600 (or default)

### Adding DNS Records at Your Registrar:

1. Go to your domain registrar (where you bought `koldgeneration.com`)
   - Examples: GoDaddy, Namecheap, Cloudflare, Google Domains, etc.
2. Find **DNS Management** or **DNS Settings**
3. Look for **DNS Records** or **Records**
4. Add the CNAME or A record Vercel provided:
   - Click **"Add Record"** or **"Add"**
   - Select the Type (CNAME or A)
   - Enter the Name (`www`)
   - Enter the Value (what Vercel gave you)
   - Save

### Common Registrars:

**GoDaddy:**
1. Go to "DNS" → "Records"
2. Click "Add" → Select Type → Enter Name/Value → Save

**Namecheap:**
1. Go to "Advanced DNS"
2. Click "Add New Record" → Enter details → Save

**Cloudflare:**
1. Go to DNS → Records
2. Click "Add record" → Enter details → Save

## Step 3: Wait for DNS Propagation

- DNS changes can take 5 minutes to 48 hours
- Usually takes 5-15 minutes
- Vercel will show "Pending" until DNS propagates
- Check status in Vercel Dashboard → Domains

## Step 4: Vercel Provisions SSL Certificate

Once DNS is configured correctly:
- Vercel automatically provisions an SSL certificate
- Takes 1-5 minutes after DNS propagation
- Status will change from "Pending" → "Valid" in Vercel

## Step 5: Verify Domain Works

1. Visit `https://www.koldgeneration.com`
2. You should see your site!
3. Check that HTTPS is working (padlock icon in browser)

## Step 6: Update Firebase Authorized Domains

Since you're using Firebase Auth, you need to add your custom domain:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **koldgeneration-website**
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Click **"Add domain"**
5. Enter: `www.koldgeneration.com`
6. Click **"Add"**

✅ Firebase Auth will now work from your custom domain!

## Setting Up Dev Environment (dev.koldgeneration.com)

To set up a dev environment that deploys from your `dev` or `develop` branch:

### Step 1: Add Dev Domain in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (`koldgeneration-website`)
3. Go to **Settings** → **Domains** (left sidebar)
4. Click **"Add Domain"** button
5. Enter: `dev.koldgeneration.com`
6. Click **"Add"**

### Step 2: Assign Domain to Specific Branch

After adding the domain, you need to assign it to your dev branch:

1. In Vercel Dashboard → **Settings** → **Domains**
2. Find `dev.koldgeneration.com` in the list
3. Click **"Edit"** (or the three dots **"..."** → **"Edit"**) next to the domain
4. In the **"Connect to an environment"** section:
   - Select **"Preview"** (NOT "Production")
   - In the **"Git Branch"** field, enter your dev branch name (e.g., `dev` or `develop`)
5. Click **"Save"** or **"Update"**

Now `dev.koldgeneration.com` will automatically point to the latest deployment from your dev branch!

### Step 3: Configure DNS for Dev Domain

**Important:** This depends on whether you're using Vercel DNS (nameservers) or your registrar's DNS:

**If using Vercel DNS (nameservers):**
- ✅ You don't need to add DNS records manually
- ✅ Vercel automatically handles all subdomains including `dev`
- ✅ Skip this step and go to Step 4

**If using your registrar's DNS (like Squarespace):**
1. In Vercel Dashboard → **Settings** → **Domains** → click on `dev.koldgeneration.com`
2. Vercel will show you DNS records to add (usually a CNAME record)
3. Go to your domain registrar's DNS settings (Squarespace in your case)
4. Add a new DNS record:
   - **Type**: `CNAME`
   - **Name**: `dev` (or `dev.koldgeneration.com` depending on registrar)
   - **Value**: Copy the exact value from Vercel (e.g., `23a93c15b05f58cc.vercel-dns-017.com`)
     - **Note:** Some registrars show it with a trailing dot (`.`), some without. Either usually works, but use exactly what your registrar shows/accepts.
   - **TTL**: 3600 or 4 hours (or default)
5. Save the record

**Troubleshooting "Invalid Configuration":**
- Wait 5-30 minutes for DNS propagation
- Make sure the CNAME value matches exactly what Vercel shows (trailing dot usually doesn't matter)
- Don't add the DNS record in BOTH Vercel's DNS section AND your registrar - choose one:
  - Using Vercel nameservers? → Add records in Vercel DNS section
  - Using registrar DNS? → Add records at your registrar (Squarespace), NOT in Vercel

### Step 4: Wait for DNS and SSL

- Wait 5-15 minutes for DNS propagation
- Vercel will automatically provision SSL certificate
- Status will show "Valid" when ready

### Step 5: Update Firebase Authorized Domains

Add the dev domain to Firebase Auth:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **koldgeneration-website**
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Click **"Add domain"**
5. Enter: `dev.koldgeneration.com`
6. Click **"Add"**

✅ Now `dev.koldgeneration.com` will deploy from your dev branch!

### Alternative: Using Vercel Preview Deployments

If you prefer to keep using Vercel's automatic preview deployments (which create unique URLs for each branch/PR):

- You don't need to set up a custom domain
- Vercel automatically creates URLs like: `koldgeneration-website-xyz123.vercel.app`
- These work automatically for all branches and PRs
- You can share these preview URLs for testing

## Optional: Root Domain (koldgeneration.com without www)

If you also want `koldgeneration.com` (without www) to work:

### Option A: Redirect to www (Recommended)

1. In Vercel Dashboard → Domains
2. Add domain: `koldgeneration.com`
3. Vercel will show DNS records (usually A records pointing to IPs)
4. Add those records at your registrar
5. Vercel will automatically redirect `koldgeneration.com` → `www.koldgeneration.com`

### Option B: Use Both

1. Add both domains in Vercel:
   - `www.koldgeneration.com`
   - `koldgeneration.com`
2. Configure DNS for both
3. Both will work (same content)

## Troubleshooting

### Issue: Domain shows "Pending" for a long time
**Solution**: 
- Check DNS records are correct at your registrar
- Wait up to 48 hours (usually much faster)
- Use a DNS checker tool like [whatsmydns.net](https://www.whatsmydns.net)

### Issue: SSL certificate not provisioning
**Solution**:
- Wait for DNS to fully propagate
- Make sure DNS records are correct
- Contact Vercel support if stuck

### Issue: Domain works but Firebase Auth doesn't
**Solution**: 
- Make sure you added `www.koldgeneration.com` to Firebase Authorized Domains
- Check that you're using `https://` not `http://`

### Issue: "Domain already in use" error
**Solution**:
- Remove the domain from Firebase Hosting first
- Go to Firebase Console → Hosting → Remove domain
- Then add it to Vercel

## After Domain is Set Up

✅ Your site is live at: `https://www.koldgeneration.com`
✅ HTTPS is automatic (SSL certificate)
✅ Firebase Auth works
✅ Firestore works
✅ All routes work (SPA routing)

## Next Steps

- Remove domain from Firebase Hosting (if you haven't already)
- Update any hardcoded URLs in your code/docs
- Test all functionality on the custom domain
- Celebrate! 🎉

