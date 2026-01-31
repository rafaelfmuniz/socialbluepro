# Release v2.0.1 - Admin Panel UI Improvements & Installer Fixes

**Release Date:** 2026-01-31  
**Version:** 2.0.1  
**Tag:** v2.0.1

---

## 🎨 Admin Panel UI Improvements

### Navigation & Branding
- **Language Consistency:** Changed "Painel Admin" (Portuguese) to "Admin Panel" (English) to match the rest of the English-language interface
- **Mobile Header:** Updated to display logo + "Admin Panel" text instead of just "Painel"
- **Desktop Header:** Changed from "SocialBluePro" to "SocialBluePro Landscaping" to match the landing page branding
- **Mobile Menu:** Now sticky at top - remains visible while scrolling

### User Experience
- **Sidebar User Info:** Now displays the actual logged-in user's name and role instead of static "Admin User / Super User"
- **User Avatar:** Shows the first letter of the user's actual name instead of a fixed "A"
- **Footer Positioning:** Fixed to stay at the bottom of the page using `mt-auto` flexbox approach
- **Footer Version:** Updated to display v2.0.1

---

## 🔧 Installer Fixes

### Database & User Creation
- **Database Setup:** Replaced `prisma migrate deploy` with `prisma db push` exclusively
  - More reliable for fresh installations
  - Bypasses migration synchronization issues
  - Ensures tables are created directly from schema
  
- **Admin User:** Changed default name from "Administrador" (Portuguese) to "Administrator" (English)
- **Default Credentials:** Fixed to use:
  - Email: `admin@local.system`
  - Password: `admin123`

### Post-Installation Warnings
- **RED Security Warning:** Added prominent warning to change default credentials immediately after first login
- **SMTP Recommendation:** Added detailed explanation that without SMTP configured, users cannot:
  - Receive password reset emails
  - Send email marketing campaigns
  - Send automatic lead notifications

### Credentials File
- Updated with comprehensive post-installation instructions
- Includes navigation paths for changing credentials and configuring SMTP

---

## 📋 Files Changed

### Core Application
- `src/app/admin/AdminNavigation.tsx` - UI improvements and user data display
- `src/app/admin/layout.tsx` - Pass user data to navigation component
- `src/components/admin/AdminFooter.tsx` - Version update and positioning fix

### Installer
- `install.sh` - Database setup, user creation, and post-install warnings

### Version & Documentation
- `package.json` - Version bump to 2.0.1
- `CHANGELOG.md` - Updated with all v2.0.1 changes
- `RELEASE_NOTES.md` - This file (new)

---

## 🚀 Installation

```bash
# Fresh installation
curl -fsSL https://raw.githubusercontent.com/rafaelfmuniz/socialbluepro/main/install.sh | sudo bash

# Or reinstall
curl -fsSL https://raw.githubusercontent.com/rafaelfmuniz/socialbluepro/main/install.sh | sudo bash
# Select option 2 - Reinstall
```

**Default Credentials:**
- Email: `admin@local.system`
- Password: `admin123`

**⚠️ Important:** Change these credentials immediately after first login!

---

## 📝 Migration Notes

If upgrading from v2.0.0:
- The database schema remains compatible
- Run the installer and select "Update" (option 3) to preserve data
- The new UI improvements will be applied automatically

---

## 🐛 Bug Fixes

- Fixed login failures caused by missing database tables (using db push instead of migrate deploy)
- Fixed admin user creation with proper timestamp fields
- Fixed footer positioning in admin pages
- Fixed mobile menu visibility during scroll

---

## 📞 Support

For issues or questions:
- Check the log: `/var/log/socialbluepro-install.log`
- View credentials: `/root/.socialbluepro-credentials`
- Service status: `sudo systemctl status socialbluepro`

---

**Full Changelog:** See [CHANGELOG.md](CHANGELOG.md)
