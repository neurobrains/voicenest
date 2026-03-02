# Publishing Guide

## 🚀 Automated Publishing Workflow

This project uses GitHub Actions to automatically build and publish to NPM when changes are made to the main branch.

## 📋 Setup Requirements

### 1. NPM Token Configuration

1. **Create NPM Token:**
   - Go to [npmjs.com](https://www.npmjs.com) → Account → Access Tokens
   - Click "Generate New Token" → Select "Automation"
   - Copy the token

2. **Add to GitHub Secrets:**
   - Go to Repository → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Your NPM token
   - Save

## 🔄 Publishing Process

### Method 1: Version Bump & Push (Recommended)

```bash
# For bug fixes (0.2.0 → 0.2.1)
npm run version:patch

# For new features (0.2.0 → 0.3.0)  
npm run version:minor

# For breaking changes (0.2.0 → 1.0.0)
npm run version:major
```

This will:
- ✅ Update package.json version
- ✅ Create a git commit and tag
- ✅ Push to GitHub
- ✅ Trigger automated build & publish
- ✅ Update changelog automatically
- ✅ Publish to NPM with CDN access

### Method 2: Manual Version Update

```bash
# 1. Update version in package.json
# 2. Commit and push to main branch
git add .
git commit -m "chore: bump version to 0.3.0"
git push origin main
```

### Method 3: GitHub Release

1. Go to GitHub → Releases → Create a new release
2. Create a tag (e.g., `v0.3.0`)
3. Publish release
4. Workflow will automatically publish to NPM

## 📦 What Gets Published

The workflow publishes:
- ✅ Built `dist/` folder with minified JS
- ✅ Package metadata for CDN usage
- ✅ Automatic changelog updates
- ✅ Git tags for version tracking

## 🔗 CDN URLs

After publishing, your package is available via:

```html
<!-- Specific version -->
<script src="https://cdn.jsdelivr.net/npm/voicenest@0.2.0/dist/voicenest.min.js"></script>

<!-- Latest version -->
<script src="https://cdn.jsdelivr.net/npm/voicenest/dist/voicenest.min.js"></script>
```

## 🎯 Workflow Triggers

| Trigger | Action |
|---------|--------|
| Push to `main` | Build + Publish (if version changed) |
| GitHub Release | Build + Publish (always) |
| Pull Request | Test build only |
| Other branches | Test build only |

## 📝 Changelog

The workflow automatically:
- ✅ Generates changelog entries from commit messages
- ✅ Categorizes commits (Added, Fixed, Changed)
- ✅ Updates `CHANGELOG.md` file
- ✅ Commits changelog back to repository

### Commit Message Best Practices

For better changelogs, use conventional commits:

```bash
feat: add new voice transport option
fix: resolve microphone permission issue  
docs: update README with new examples
chore: update dependencies
```

## 🛠️ Troubleshooting

**Version already exists error:**
- The workflow skips publishing if the version already exists on NPM
- Update the version number in `package.json` before pushing

**Build fails:**
- Check that all dependencies are in `package.json`
- Ensure `npm run build` works locally
- Verify dist files are generated correctly

**NPM publish fails:**
- Check that `NPM_TOKEN` secret is set correctly
- Ensure you have publish permissions for the package
- Verify package name is available on NPM